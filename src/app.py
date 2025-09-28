from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import duckdb
from collections import Counter, defaultdict
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    db_paths = [
        'universal_cmdb.db',
        './universal_cmdb.db',
        '../universal_cmdb.db',
        os.path.join(os.getcwd(), 'universal_cmdb.db')
    ]
    
    for db_path in db_paths:
        try:
            if os.path.exists(db_path):
                conn = duckdb.connect(db_path, read_only=True)
                tables = conn.execute("SHOW TABLES").fetchall()
                if any('universal_cmdb' in str(table).lower() for table in tables):
                    return conn
                conn.close()
        except Exception as e:
            continue
    
    raise Exception("Database file 'universal_cmdb.db' not found")

def normalize_region(region):
    if not region:
        return 'Unknown'
    region_lower = region.lower().strip()
    if any(x in region_lower for x in ['us', 'usa', 'united states', 'canada', 'north america', 'mexico']):
        return 'North America'
    elif any(x in region_lower for x in ['europe', 'emea', 'uk', 'germany', 'france', 'spain', 'italy']):
        return 'EMEA'
    elif any(x in region_lower for x in ['asia', 'apac', 'pacific', 'japan', 'china', 'india', 'australia']):
        return 'APAC'
    elif any(x in region_lower for x in ['latin', 'latam', 'south america', 'brazil', 'argentina']):
        return 'LATAM'
    return region

def parse_pipe_separated(value):
    if not value or str(value).lower() in ['null', 'none', 'unknown', '']:
        return []
    return [v.strip() for v in str(value).split('|') if v.strip()]

def parse_comma_separated(value):
    if not value or str(value).lower() in ['null', 'none', 'unknown', '']:
        return []
    return [v.strip() for v in str(value).split(',') if v.strip()]

@app.route('/api/database_status')
def database_status():
    try:
        conn = get_db_connection()
        result = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()
        conn.close()
        return jsonify({
            'status': 'connected',
            'total_records': result[0] if result else 0
        })
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/api/global_view/summary')
def global_view_summary():
    try:
        conn = get_db_connection()
        
        total_assets = conn.execute("SELECT COUNT(DISTINCT host) FROM universal_cmdb").fetchone()[0]
        
        cmdb_covered = conn.execute("""
            SELECT COUNT(DISTINCT host) FROM universal_cmdb 
            WHERE LOWER(present_in_cmdb) LIKE '%yes%'
        """).fetchone()[0]
        
        url_fqdn_covered = conn.execute("""
            SELECT COUNT(DISTINCT host) FROM universal_cmdb 
            WHERE (host LIKE '%.%' OR host LIKE 'http%')
        """).fetchone()[0]
        
        regional_data = conn.execute("""
            SELECT 
                COALESCE(region, 'Unknown') as region,
                COUNT(DISTINCT host) as asset_count,
                SUM(CASE WHEN LOWER(present_in_cmdb) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_count,
                SUM(CASE WHEN LOWER(tanium_coverage) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_count,
                SUM(CASE WHEN LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%' THEN 1 ELSE 0 END) as splunk_count,
                SUM(CASE WHEN LOWER(logging_in_gso) LIKE '%yes%' OR LOWER(logging_in_gso) LIKE '%gso%' THEN 1 ELSE 0 END) as gso_count
            FROM universal_cmdb
            GROUP BY region
            ORDER BY asset_count DESC
        """).fetchall()
        
        country_data = conn.execute("""
            SELECT 
                COALESCE(country, 'Unknown') as country,
                COUNT(DISTINCT host) as asset_count,
                SUM(CASE WHEN LOWER(present_in_cmdb) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_count
            FROM universal_cmdb
            GROUP BY country
            ORDER BY asset_count DESC
            LIMIT 15
        """).fetchall()
        
        datacenter_data = conn.execute("""
            SELECT 
                CASE 
                    WHEN data_center IS NULL OR data_center = '' THEN 'Unknown'
                    ELSE SUBSTRING(data_center, 1, POSITION(' ' IN data_center || ' ') - 1)
                END as data_center,
                COUNT(DISTINCT host) as asset_count
            FROM universal_cmdb
            GROUP BY data_center
            ORDER BY asset_count DESC
            LIMIT 10
        """).fetchall()
        
        cloud_data = conn.execute("""
            SELECT 
                COALESCE(cloud_region, 'Unknown') as cloud_region,
                COUNT(DISTINCT host) as asset_count
            FROM universal_cmdb
            WHERE cloud_region IS NOT NULL AND cloud_region != ''
            GROUP BY cloud_region
            ORDER BY asset_count DESC
        """).fetchall()
        
        conn.close()
        
        cmdb_coverage_pct = (cmdb_covered / total_assets * 100) if total_assets > 0 else 0
        url_fqdn_coverage_pct = (url_fqdn_covered / total_assets * 100) if total_assets > 0 else 0
        
        regions = []
        region_aggregates = defaultdict(lambda: {'assets': 0, 'cmdb': 0, 'tanium': 0, 'splunk': 0, 'gso': 0})
        
        for region, assets, cmdb, tanium, splunk, gso in regional_data:
            normalized_region = normalize_region(region)
            region_aggregates[normalized_region]['assets'] += assets
            region_aggregates[normalized_region]['cmdb'] += cmdb
            region_aggregates[normalized_region]['tanium'] += tanium
            region_aggregates[normalized_region]['splunk'] += splunk
            region_aggregates[normalized_region]['gso'] += gso
        
        for region, data in region_aggregates.items():
            assets = data['assets']
            regions.append({
                'region': region,
                'assets': assets,
                'cmdb_coverage': round((data['cmdb'] / assets * 100) if assets > 0 else 0, 2),
                'tanium_coverage': round((data['tanium'] / assets * 100) if assets > 0 else 0, 2),
                'splunk_coverage': round((data['splunk'] / assets * 100) if assets > 0 else 0, 2),
                'gso_coverage': round((data['gso'] / assets * 100) if assets > 0 else 0, 2),
                'overall_visibility': round(((data['cmdb'] + data['tanium'] + data['splunk']) / (assets * 3) * 100) if assets > 0 else 0, 2)
            })
        
        regions.sort(key=lambda x: x['assets'], reverse=True)
        
        countries = []
        for country, assets, cmdb in country_data:
            countries.append({
                'country': country,
                'assets': assets,
                'cmdb_coverage': round((cmdb / assets * 100) if assets > 0 else 0, 2),
                'percentage_of_total': round((assets / total_assets * 100) if total_assets > 0 else 0, 2)
            })
        
        datacenters = [{'datacenter': d, 'assets': a, 
                       'percentage': round((a / total_assets * 100) if total_assets > 0 else 0, 2)} 
                      for d, a in datacenter_data]
        
        cloud_regions = []
        for region_str, assets in cloud_data:
            regions_list = parse_pipe_separated(region_str)
            for r in regions_list[:5]:
                cloud_regions.append({
                    'region': r,
                    'assets': assets,
                    'percentage': round((assets / total_assets * 100) if total_assets > 0 else 0, 2)
                })
        
        return jsonify({
            'global_metrics': {
                'total_assets': total_assets,
                'cmdb_coverage': round(cmdb_coverage_pct, 2),
                'url_fqdn_coverage': round(url_fqdn_coverage_pct, 2),
                'regions_covered': len(regions),
                'countries_covered': len(countries),
                'datacenters': len(datacenters),
                'cloud_regions': len(cloud_regions)
            },
            'regional_breakdown': regions,
            'country_breakdown': countries,
            'datacenter_breakdown': datacenters,
            'cloud_breakdown': cloud_regions[:10]
        })
        
    except Exception as e:
        logger.error(f"Global view summary error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/infrastructure_type/breakdown')
def infrastructure_breakdown():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(infrastructure_type, 'Unknown') as infra_type,
                COUNT(DISTINCT host) as total_assets,
                SUM(CASE WHEN LOWER(present_in_cmdb) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_registered,
                SUM(CASE WHEN LOWER(tanium_coverage) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_deployed,
                SUM(CASE WHEN LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%' THEN 1 ELSE 0 END) as splunk_logging,
                SUM(CASE WHEN LOWER(presence_in_crowdstrike) LIKE '%yes%' OR LOWER(presence_in_crowdstrike) LIKE '%crowdstrike%' THEN 1 ELSE 0 END) as crowdstrike_edr
            FROM universal_cmdb
            GROUP BY infrastructure_type
            ORDER BY total_assets DESC
        """).fetchall()
        
        infrastructure_data = []
        type_aggregates = defaultdict(lambda: {'total': 0, 'cmdb': 0, 'tanium': 0, 'splunk': 0, 'crowdstrike': 0})
        
        for row in result:
            infra_type_str, total, cmdb, tanium, splunk, crowdstrike = row
            infra_types = parse_pipe_separated(infra_type_str)
            
            for infra_type in infra_types:
                type_aggregates[infra_type]['total'] += total
                type_aggregates[infra_type]['cmdb'] += cmdb
                type_aggregates[infra_type]['tanium'] += tanium
                type_aggregates[infra_type]['splunk'] += splunk
                type_aggregates[infra_type]['crowdstrike'] += crowdstrike
        
        category_totals = defaultdict(lambda: {'total': 0, 'cmdb': 0, 'tanium': 0, 'splunk': 0, 'crowdstrike': 0})
        
        for infra_type, data in type_aggregates.items():
            total = data['total']
            
            category = 'Other'
            infra_lower = infra_type.lower()
            if any(x in infra_lower for x in ['on-prem', 'onprem', 'on_prem', 'datacenter', 'physical', 'server']):
                category = 'On-Premise'
            elif 'cloud' in infra_lower or any(x in infra_lower for x in ['aws', 'azure', 'gcp']):
                category = 'Cloud'
            elif 'saas' in infra_lower or 'application' in infra_lower:
                category = 'SaaS'
            elif 'api' in infra_lower:
                category = 'API'
            
            visibility_score = ((data['cmdb'] + data['tanium'] + data['splunk'] + data['crowdstrike']) / (total * 4) * 100) if total > 0 else 0
            
            infrastructure_data.append({
                'type': infra_type,
                'category': category,
                'total_assets': total,
                'visibility_metrics': {
                    'cmdb': round((data['cmdb'] / total * 100) if total > 0 else 0, 2),
                    'tanium': round((data['tanium'] / total * 100) if total > 0 else 0, 2),
                    'splunk': round((data['splunk'] / total * 100) if total > 0 else 0, 2),
                    'crowdstrike': round((data['crowdstrike'] / total * 100) if total > 0 else 0, 2)
                },
                'overall_visibility': round(visibility_score, 2),
                'risk_level': 'CRITICAL' if visibility_score < 30 else 'HIGH' if visibility_score < 60 else 'MEDIUM' if visibility_score < 80 else 'LOW'
            })
            
            category_totals[category]['total'] += total
            category_totals[category]['cmdb'] += data['cmdb']
            category_totals[category]['tanium'] += data['tanium']
            category_totals[category]['splunk'] += data['splunk']
            category_totals[category]['crowdstrike'] += data['crowdstrike']
        
        infrastructure_data.sort(key=lambda x: x['total_assets'], reverse=True)
        
        category_summary = []
        for cat, totals in category_totals.items():
            if totals['total'] > 0:
                category_summary.append({
                    'category': cat,
                    'total_assets': totals['total'],
                    'cmdb_coverage': round((totals['cmdb'] / totals['total'] * 100), 2),
                    'tanium_coverage': round((totals['tanium'] / totals['total'] * 100), 2),
                    'splunk_coverage': round((totals['splunk'] / totals['total'] * 100), 2),
                    'crowdstrike_coverage': round((totals['crowdstrike'] / totals['total'] * 100), 2),
                    'overall_visibility': round((totals['cmdb'] + totals['tanium'] + totals['splunk'] + totals['crowdstrike']) / (totals['total'] * 4) * 100, 2)
                })
        
        conn.close()
        
        return jsonify({
            'infrastructure_breakdown': infrastructure_data[:20],
            'category_summary': category_summary,
            'total_types': len(infrastructure_data)
        })
        
    except Exception as e:
        logger.error(f"Infrastructure breakdown error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/bu_application/breakdown')
def bu_application_breakdown():
    try:
        conn = get_db_connection()
        
        bu_result = conn.execute("""
            SELECT 
                COALESCE(business_unit, 'Unknown') as bu,
                COALESCE(cio, 'Unknown') as cio,
                COALESCE(class, 'Unknown') as app_class,
                COUNT(DISTINCT host) as total_assets,
                SUM(CASE WHEN LOWER(present_in_cmdb) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_registered,
                SUM(CASE WHEN LOWER(tanium_coverage) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_deployed,
                SUM(CASE WHEN LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%' THEN 1 ELSE 0 END) as splunk_logging
            FROM universal_cmdb
            GROUP BY business_unit, cio, class
            ORDER BY total_assets DESC
        """).fetchall()
        
        bu_aggregates = defaultdict(lambda: {
            'total_assets': 0,
            'cio_owners': set(),
            'app_classes': set(),
            'cmdb_registered': 0,
            'tanium_deployed': 0,
            'splunk_logging': 0
        })
        
        app_class_totals = defaultdict(int)
        cio_totals = defaultdict(int)
        
        for row in bu_result:
            bu_str, cio_str, app_class_str, total, cmdb, tanium, splunk = row
            
            bus = parse_comma_separated(bu_str)
            if not bus:
                bus = parse_pipe_separated(bu_str)
            if not bus:
                bus = [bu_str]
            
            for bu in bus:
                bu_aggregates[bu]['total_assets'] += total
                bu_aggregates[bu]['cmdb_registered'] += cmdb
                bu_aggregates[bu]['tanium_deployed'] += tanium
                bu_aggregates[bu]['splunk_logging'] += splunk
                
                if cio_str and cio_str != 'Unknown':
                    cio_values = parse_pipe_separated(cio_str)
                    for cio in cio_values:
                        if cio and not cio.isdigit():
                            bu_aggregates[bu]['cio_owners'].add(cio)
                            cio_totals[cio] += total
                
                if app_class_str and app_class_str != 'Unknown':
                    import re
                    class_matches = re.findall(r'class\s*(\d+)', app_class_str.lower())
                    for match in class_matches:
                        class_name = f"Class {match}"
                        bu_aggregates[bu]['app_classes'].add(class_name)
                        app_class_totals[class_name] += total
        
        business_units = []
        for bu, data in bu_aggregates.items():
            if data['total_assets'] > 0:
                visibility_score = ((data['cmdb_registered'] + data['tanium_deployed'] + data['splunk_logging']) / 
                                  (data['total_assets'] * 3) * 100)
                
                business_units.append({
                    'business_unit': bu,
                    'total_assets': data['total_assets'],
                    'cio_count': len(data['cio_owners']),
                    'app_class_count': len(data['app_classes']),
                    'visibility_metrics': {
                        'cmdb': round((data['cmdb_registered'] / data['total_assets'] * 100), 2),
                        'tanium': round((data['tanium_deployed'] / data['total_assets'] * 100), 2),
                        'splunk': round((data['splunk_logging'] / data['total_assets'] * 100), 2)
                    },
                    'overall_visibility': round(visibility_score, 2),
                    'risk_level': 'CRITICAL' if visibility_score < 30 else 'HIGH' if visibility_score < 60 else 'MEDIUM' if visibility_score < 80 else 'LOW'
                })
        
        business_units.sort(key=lambda x: x['total_assets'], reverse=True)
        
        app_classes = [{'class': cls, 'total_assets': total} for cls, total in app_class_totals.items()]
        app_classes.sort(key=lambda x: x['total_assets'], reverse=True)
        
        cio_list = [{'cio': cio, 'total_assets': total} for cio, total in cio_totals.items()]
        cio_list.sort(key=lambda x: x['total_assets'], reverse=True)
        
        conn.close()
        
        return jsonify({
            'business_units': business_units[:20],
            'application_classes': app_classes[:15],
            'cio_ownership': cio_list[:10],
            'total_business_units': len(business_units),
            'total_app_classes': len(app_classes),
            'total_cios': len(cio_list)
        })
        
    except Exception as e:
        logger.error(f"BU Application breakdown error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/system_classification/breakdown')
def system_classification_breakdown():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(system_classification, 'Unknown') as system_class,
                COUNT(DISTINCT host) as total_assets,
                SUM(CASE WHEN LOWER(present_in_cmdb) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_registered,
                SUM(CASE WHEN LOWER(tanium_coverage) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_deployed
            FROM universal_cmdb
            GROUP BY system_classification
            ORDER BY total_assets DESC
        """).fetchall()
        
        system_aggregates = defaultdict(lambda: {'total': 0, 'cmdb': 0, 'tanium': 0})
        system_categories = defaultdict(lambda: {'total': 0, 'cmdb': 0, 'tanium': 0})
        
        for row in result:
            system_str, total, cmdb, tanium = row
            systems = parse_pipe_separated(system_str)
            
            for system in systems:
                system_aggregates[system]['total'] += total
                system_aggregates[system]['cmdb'] += cmdb
                system_aggregates[system]['tanium'] += tanium
                
                category = 'Other'
                system_lower = system.lower()
                if 'windows' in system_lower:
                    category = 'Windows Server'
                elif 'linux' in system_lower:
                    category = 'Linux Server'
                elif any(x in system_lower for x in ['aix', 'solaris', 'unix']):
                    category = '*Nix'
                elif 'mainframe' in system_lower:
                    category = 'Mainframe'
                elif 'database' in system_lower:
                    category = 'Database'
                elif any(x in system_lower for x in ['fw', 'ndr', 'switch', 'router']):
                    category = 'Network Appliance'
                
                system_categories[category]['total'] += total
                system_categories[category]['cmdb'] += cmdb
                system_categories[category]['tanium'] += tanium
        
        system_data = []
        for system, data in system_aggregates.items():
            if data['total'] > 0:
                visibility_score = ((data['cmdb'] + data['tanium']) / (data['total'] * 2) * 100)
                
                system_data.append({
                    'system': system,
                    'total_assets': data['total'],
                    'cmdb_coverage': round((data['cmdb'] / data['total'] * 100), 2),
                    'tanium_coverage': round((data['tanium'] / data['total'] * 100), 2),
                    'overall_visibility': round(visibility_score, 2)
                })
        
        system_data.sort(key=lambda x: x['total_assets'], reverse=True)
        
        category_summary = []
        for cat, data in system_categories.items():
            if data['total'] > 0:
                category_summary.append({
                    'category': cat,
                    'total_assets': data['total'],
                    'cmdb_coverage': round((data['cmdb'] / data['total'] * 100), 2),
                    'tanium_coverage': round((data['tanium'] / data['total'] * 100), 2)
                })
        
        category_summary.sort(key=lambda x: x['total_assets'], reverse=True)
        
        conn.close()
        
        return jsonify({
            'system_breakdown': system_data[:20],
            'category_summary': category_summary,
            'total_systems': len(system_data)
        })
        
    except Exception as e:
        logger.error(f"System classification breakdown error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/security_control/coverage')
def security_control_coverage():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COUNT(DISTINCT host) as total_assets,
                SUM(CASE WHEN LOWER(tanium_coverage) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium,
                SUM(CASE WHEN LOWER(dlp_agent_coverage) LIKE '%dlp%' OR LOWER(dlp_agent_coverage) LIKE '%agent%' THEN 1 ELSE 0 END) as dlp,
                SUM(CASE WHEN LOWER(presence_in_crowdstrike) LIKE '%yes%' OR LOWER(presence_in_crowdstrike) LIKE '%crowdstrike%' THEN 1 ELSE 0 END) as crowdstrike,
                SUM(CASE WHEN LOWER(ssc_coverage) IS NOT NULL AND LOWER(ssc_coverage) != '' THEN 1 ELSE 0 END) as ssc
            FROM universal_cmdb
        """).fetchone()
        
        total, tanium, dlp, crowdstrike, ssc = result
        
        regional_coverage = conn.execute("""
            SELECT 
                COALESCE(region, 'Unknown') as region,
                COUNT(DISTINCT host) as total,
                SUM(CASE WHEN LOWER(tanium_coverage) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium,
                SUM(CASE WHEN LOWER(dlp_agent_coverage) LIKE '%dlp%' OR LOWER(dlp_agent_coverage) LIKE '%agent%' THEN 1 ELSE 0 END) as dlp,
                SUM(CASE WHEN LOWER(presence_in_crowdstrike) LIKE '%yes%' OR LOWER(presence_in_crowdstrike) LIKE '%crowdstrike%' THEN 1 ELSE 0 END) as crowdstrike
            FROM universal_cmdb
            GROUP BY region
            ORDER BY total DESC
        """).fetchall()
        
        regional_aggregates = defaultdict(lambda: {'total': 0, 'tanium': 0, 'dlp': 0, 'crowdstrike': 0})
        
        for region, reg_total, reg_tanium, reg_dlp, reg_crowdstrike in regional_coverage:
            normalized = normalize_region(region)
            regional_aggregates[normalized]['total'] += reg_total
            regional_aggregates[normalized]['tanium'] += reg_tanium
            regional_aggregates[normalized]['dlp'] += reg_dlp
            regional_aggregates[normalized]['crowdstrike'] += reg_crowdstrike
        
        regional_data = []
        for region, data in regional_aggregates.items():
            if data['total'] > 0:
                regional_data.append({
                    'region': region,
                    'total_assets': data['total'],
                    'tanium_coverage': round((data['tanium'] / data['total'] * 100), 2),
                    'dlp_coverage': round((data['dlp'] / data['total'] * 100), 2),
                    'crowdstrike_coverage': round((data['crowdstrike'] / data['total'] * 100), 2)
                })
        
        regional_data.sort(key=lambda x: x['total_assets'], reverse=True)
        
        conn.close()
        
        overall_coverage = {
            'tanium': {'deployed': tanium, 'coverage': round((tanium / total * 100) if total > 0 else 0, 2)},
            'dlp': {'deployed': dlp, 'coverage': round((dlp / total * 100) if total > 0 else 0, 2)},
            'crowdstrike': {'deployed': crowdstrike, 'coverage': round((crowdstrike / total * 100) if total > 0 else 0, 2)},
            'ssc': {'deployed': ssc, 'coverage': round((ssc / total * 100) if total > 0 else 0, 2)}
        }
        
        return jsonify({
            'total_assets': total,
            'overall_coverage': overall_coverage,
            'regional_coverage': regional_data,
            'security_maturity': 'ADVANCED' if min(c['coverage'] for c in overall_coverage.values()) >= 80 else 
                               'INTERMEDIATE' if min(c['coverage'] for c in overall_coverage.values()) >= 60 else 'BASIC'
        })
        
    except Exception as e:
        logger.error(f"Security control coverage error: {e}")
        return jsonify({'error': str(e)}), 500

# Add these additional API endpoints to your app.py file

@app.route('/api/source_tables')
def api_source_tables():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(source_tables, 'unknown') as source_tables,
                COUNT(*) as frequency
            FROM universal_cmdb 
            GROUP BY source_tables
            ORDER BY frequency DESC
        """).fetchall()
        
        source_intelligence = {}
        total_mentions = 0
        
        for row in result:
            source_tables, frequency = row
            if source_tables and source_tables != 'unknown':
                source_values = [s.strip() for s in str(source_tables).split(',') if s.strip()]
                for source in source_values:
                    source_intelligence[source] = source_intelligence.get(source, 0) + frequency
                    total_mentions += frequency
        
        conn.close()
        
        return jsonify({
            'source_intelligence': source_intelligence,
            'unique_sources': len(source_intelligence),
            'total_mentions': total_mentions
        })
    except Exception as e:
        logger.error(f"Source tables error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/domain_metrics')
def api_domain_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(domain, '') as domain,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY domain
        """).fetchall()
        
        domain_analysis = {'1dc': 0, 'fead': 0, 'other': 0}
        
        for row in result:
            domain, count = row
            if domain:
                domain_values = [d.strip() for d in str(domain).split('|') if d.strip()]
                for d in domain_values:
                    if '1dc' in d.lower():
                        domain_analysis['1dc'] += count
                    elif 'fead' in d.lower():
                        domain_analysis['fead'] += count
                    else:
                        domain_analysis['other'] += count
        
        conn.close()
        
        return jsonify({
            'domain_analysis': domain_analysis
        })
    except Exception as e:
        logger.error(f"Domain metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/infrastructure_type')
def api_infrastructure_type():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY infrastructure_type
            ORDER BY count DESC
        """).fetchall()
        
        infrastructure_matrix = {}
        
        for row in result:
            infra_type, count = row
            if infra_type and infra_type != 'unknown':
                infra_values = [i.strip() for i in str(infra_type).split('|') if i.strip()]
                for i_type in infra_values:
                    infrastructure_matrix[i_type] = infrastructure_matrix.get(i_type, 0) + count
        
        conn.close()
        
        return jsonify({
            'infrastructure_matrix': infrastructure_matrix
        })
    except Exception as e:
        logger.error(f"Infrastructure type error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/region_metrics')
def api_region_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(region, 'unknown') as region,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY region
            ORDER BY count DESC
        """).fetchall()
        
        global_surveillance = {}
        total_coverage = 0
        
        for row in result:
            region, count = row
            if region and region != 'unknown':
                normalized = normalize_region(region)
                global_surveillance[normalized] = global_surveillance.get(normalized, 0) + count
                total_coverage += count
        
        conn.close()
        
        return jsonify({
            'global_surveillance': global_surveillance,
            'total_coverage': total_coverage
        })
    except Exception as e:
        logger.error(f"Region metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/country_metrics')
def api_country_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(country, 'unknown') as country,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY country
            ORDER BY count DESC
        """).fetchall()
        
        global_intelligence = {}
        total_countries = 0
        
        for row in result:
            country, count = row
            if country and country != 'unknown':
                normalized = country.lower().strip()
                global_intelligence[normalized] = count
                total_countries += 1
        
        conn.close()
        
        return jsonify({
            'global_intelligence': global_intelligence,
            'total_countries': total_countries
        })
    except Exception as e:
        logger.error(f"Country metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/data_center_metrics')
def api_data_center_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(data_center, 'unknown') as data_center,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY data_center
            ORDER BY count DESC
        """).fetchall()
        
        facility_intelligence = {}
        
        for row in result:
            data_center, count = row
            if data_center and data_center != 'unknown':
                first_word = str(data_center).split()[0] if str(data_center).split() else str(data_center)
                facility_intelligence[first_word] = facility_intelligence.get(first_word, 0) + count
        
        conn.close()
        
        return jsonify({
            'facility_intelligence': facility_intelligence
        })
    except Exception as e:
        logger.error(f"Data center metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cloud_region_metrics')
def api_cloud_region_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT DISTINCT 
                COALESCE(cloud_region, 'unknown') as cloud_region
            FROM universal_cmdb
            WHERE cloud_region IS NOT NULL AND cloud_region != ''
        """).fetchall()
        
        cloud_matrix = []
        
        for row in result:
            cloud_region = row[0]
            if cloud_region and cloud_region != 'unknown':
                cloud_values = [c.strip() for c in str(cloud_region).split('|') if c.strip()]
                for cr in cloud_values:
                    if cr not in cloud_matrix:
                        cloud_matrix.append(cr)
        
        conn.close()
        
        return jsonify({
            'cloud_matrix': cloud_matrix
        })
    except Exception as e:
        logger.error(f"Cloud region metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/class_metrics')
def api_class_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(class, 'unknown') as class,
                COUNT(*) as count
            FROM universal_cmdb
            WHERE class IS NOT NULL AND class != ''
            GROUP BY class
            ORDER BY count DESC
        """).fetchall()
        
        classification_matrix = {}
        
        for row in result:
            class_name, count = row
            if class_name and class_name != 'unknown':
                import re
                class_numbers = re.findall(r'class\s*(\d+)', str(class_name).lower())
                if class_numbers:
                    for class_num in class_numbers:
                        key = f"class {class_num}"
                        classification_matrix[key] = classification_matrix.get(key, 0) + count
                else:
                    classification_matrix[str(class_name)] = count
        
        conn.close()
        
        return jsonify({
            'classification_matrix': classification_matrix
        })
    except Exception as e:
        logger.error(f"Class metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/system_classification_metrics')
def api_system_classification_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(system, 'unknown') as system,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY system
            ORDER BY count DESC
        """).fetchall()
        
        system_matrix = {}
        
        for row in result:
            system_name, count = row
            if system_name and system_name != 'unknown':
                system_values = [s.strip() for s in str(system_name).split('|') if s.strip()]
                for s in system_values:
                    system_matrix[s] = system_matrix.get(s, 0) + count
        
        conn.close()
        
        return jsonify({
            'system_matrix': system_matrix
        })
    except Exception as e:
        logger.error(f"System classification error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/business_unit_metrics')
def api_business_unit_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(business_unit, 'unknown') as business_unit,
                COUNT(*) as count
            FROM universal_cmdb
            GROUP BY business_unit
            ORDER BY count DESC
        """).fetchall()
        
        business_intelligence = {}
        
        for row in result:
            bu_name, count = row
            if bu_name and bu_name != 'unknown':
                # Parse both comma and pipe separated values
                separators = [',', '|']
                units = [bu_name]
                
                for sep in separators:
                    new_units = []
                    for unit in units:
                        new_units.extend([u.strip() for u in str(unit).split(sep) if u.strip()])
                    units = new_units
                
                for unit in units:
                    if unit:
                        business_intelligence[unit] = business_intelligence.get(unit, 0) + count
        
        conn.close()
        
        return jsonify({
            'business_intelligence': business_intelligence
        })
    except Exception as e:
        logger.error(f"Business unit metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cio_metrics')
def api_cio_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(cio, 'unknown') as cio,
                COUNT(*) as count
            FROM universal_cmdb
            WHERE cio IS NOT NULL AND cio != ''
            GROUP BY cio
            ORDER BY count DESC
        """).fetchall()
        
        operative_intelligence = {}
        
        for row in result:
            cio_name, count = row
            if cio_name and cio_name != 'unknown':
                cio_values = [c.strip() for c in str(cio_name).split('|') if c.strip()]
                for c in cio_values:
                    # Only include if it's not a number and has reasonable length
                    if c and not c.isdigit() and len(c) > 1:
                        operative_intelligence[c] = operative_intelligence.get(c, 0) + count
        
        conn.close()
        
        return jsonify({
            'operative_intelligence': operative_intelligence
        })
    except Exception as e:
        logger.error(f"CIO metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tanium_coverage')
def api_tanium_coverage():
    try:
        conn = get_db_connection()
        
        tanium_count = conn.execute("""
            SELECT COUNT(*) 
            FROM universal_cmdb 
            WHERE LOWER(COALESCE(tanium_coverage, '')) LIKE '%tanium%'
        """).fetchone()[0]
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        
        coverage_percentage = (tanium_count / total_count * 100) if total_count > 0 else 0
        
        conn.close()
        
        return jsonify({
            'tanium_deployed': tanium_count,
            'total_assets': total_count,
            'coverage_percentage': round(coverage_percentage, 2)
        })
    except Exception as e:
        logger.error(f"Tanium coverage error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cmdb_presence')
def api_cmdb_presence():
    try:
        conn = get_db_connection()
        
        yes_count = conn.execute("""
            SELECT COUNT(*) 
            FROM universal_cmdb 
            WHERE LOWER(COALESCE(present_in_cmdb, '')) LIKE '%yes%'
        """).fetchone()[0]
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        
        registration_rate = (yes_count / total_count * 100) if total_count > 0 else 0
        
        conn.close()
        
        return jsonify({
            'cmdb_registered': yes_count,
            'total_assets': total_count,
            'registration_rate': round(registration_rate, 2)
        })
    except Exception as e:
        logger.error(f"CMDB presence error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/advanced_analytics')
def api_advanced_analytics():
    try:
        conn = get_db_connection()
        
        # Get correlation analysis
        result = conn.execute("""
            SELECT 
                COALESCE(region, 'unknown') as region,
                COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
                SUM(CASE WHEN LOWER(COALESCE(present_in_cmdb, '')) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_count,
                SUM(CASE WHEN LOWER(COALESCE(tanium_coverage, '')) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_count,
                COUNT(*) as total_count
            FROM universal_cmdb
            GROUP BY region, infrastructure_type
            ORDER BY total_count DESC
            LIMIT 20
        """).fetchall()
        
        correlation_analysis = []
        high_risk_combinations = []
        
        for row in result:
            region, infra_type, cmdb_count, tanium_count, total = row
            
            cmdb_coverage = (cmdb_count / total * 100) if total > 0 else 0
            tanium_coverage = (tanium_count / total * 100) if total > 0 else 0
            security_score = (cmdb_coverage + tanium_coverage) / 2
            
            analysis_entry = {
                'region': region,
                'infrastructure_type': infra_type,
                'cmdb_coverage': round(cmdb_coverage, 2),
                'tanium_coverage': round(tanium_coverage, 2),
                'security_score': round(security_score, 2),
                'asset_count': total,
                'business_unit_diversity': 1,  # Simplified
                'datacenter_diversity': 1,     # Simplified
                'risk_category': 'LOW' if security_score >= 75 else 'MEDIUM' if security_score >= 50 else 'HIGH'
            }
            
            correlation_analysis.append(analysis_entry)
            
            if security_score < 50 and total > 10:
                high_risk_combinations.append(analysis_entry)
        
        # Trend analysis by region
        trend_analysis = {}
        regions = conn.execute("""
            SELECT DISTINCT COALESCE(region, 'unknown') as region
            FROM universal_cmdb
            LIMIT 10
        """).fetchall()
        
        for (region,) in regions:
            if region != 'unknown':
                region_stats = conn.execute("""
                    SELECT 
                        COUNT(*) as total_assets,
                        SUM(CASE WHEN LOWER(COALESCE(tanium_coverage, '')) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_count
                    FROM universal_cmdb
                    WHERE region = ?
                """, [region]).fetchone()
                
                total_assets, tanium_count = region_stats
                avg_security_score = (tanium_count / total_assets * 100) if total_assets > 0 else 0
                
                trend_analysis[region] = {
                    'total_assets': total_assets,
                    'avg_security_score': round(avg_security_score, 2),
                    'high_risk_segments': 1 if avg_security_score < 50 else 0
                }
        
        conn.close()
        
        return jsonify({
            'correlation_analysis': correlation_analysis,
            'high_risk_combinations': high_risk_combinations,
            'trend_analysis': trend_analysis
        })
    except Exception as e:
        logger.error(f"Advanced analytics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/host_search')
def api_host_search():
    try:
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term required'}), 400
            
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(host, 'unknown') as host,
                COALESCE(region, 'unknown') as region,
                COALESCE(country, 'unknown') as country,
                COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
                COALESCE(present_in_cmdb, 'unknown') as present_in_cmdb,
                COALESCE(tanium_coverage, 'unknown') as tanium_coverage
            FROM universal_cmdb 
            WHERE LOWER(COALESCE(host, '')) LIKE LOWER(?) 
            OR LOWER(COALESCE(source_tables, '')) LIKE LOWER(?)
            ORDER BY host 
            LIMIT 100
        """, [f'%{search_term}%', f'%{search_term}%']).fetchall()
        
        hosts = []
        for row in result:
            hosts.append({
                'host': row[0],
                'region': row[1],
                'country': row[2],
                'infrastructure_type': row[3],
                'present_in_cmdb': row[4],
                'tanium_coverage': row[5]
            })
        
        conn.close()
        
        return jsonify({
            'hosts': hosts,
            'total_found': len(hosts),
            'search_term': search_term
        })
    except Exception as e:
        logger.error(f"Host search error: {e}")
        return jsonify({'error': str(e)}), 500
    
@app.route('/api/logging_compliance/breakdown')
def logging_compliance_breakdown():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COUNT(DISTINCT host) as total_assets,
                SUM(CASE WHEN LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%' THEN 1 ELSE 0 END) as splunk_yes,
                SUM(CASE WHEN LOWER(logging_in_gso) LIKE '%yes%' OR LOWER(logging_in_gso) LIKE '%gso%' THEN 1 ELSE 0 END) as gso_yes,
                SUM(CASE WHEN (LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%') 
                         AND (LOWER(logging_in_gso) LIKE '%yes%' OR LOWER(logging_in_gso) LIKE '%gso%') THEN 1 ELSE 0 END) as both_yes,
                SUM(CASE WHEN (LOWER(logging_in_splunk) NOT LIKE '%yes%' AND LOWER(logging_in_splunk) NOT LIKE '%splunk%')
                         AND (LOWER(logging_in_gso) NOT LIKE '%yes%' AND LOWER(logging_in_gso) NOT LIKE '%gso%') THEN 1 ELSE 0 END) as neither
            FROM universal_cmdb
        """).fetchone()
        
        total, splunk_yes, gso_yes, both_yes, neither = result
        
        platform_breakdown = {
            'splunk_only': splunk_yes - both_yes,
            'gso_only': gso_yes - both_yes,
            'both_platforms': both_yes,
            'no_logging': neither
        }
        
        compliance_by_region = conn.execute("""
            SELECT 
                COALESCE(region, 'Unknown') as region,
                COUNT(DISTINCT host) as total,
                SUM(CASE WHEN LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%' THEN 1 ELSE 0 END) as splunk,
                SUM(CASE WHEN LOWER(logging_in_gso) LIKE '%yes%' OR LOWER(logging_in_gso) LIKE '%gso%' THEN 1 ELSE 0 END) as gso
            FROM universal_cmdb
            GROUP BY region
            ORDER BY total DESC
        """).fetchall()
        
        regional_aggregates = defaultdict(lambda: {'total': 0, 'splunk': 0, 'gso': 0})
        
        for region, reg_total, reg_splunk, reg_gso in compliance_by_region:
            normalized = normalize_region(region)
            regional_aggregates[normalized]['total'] += reg_total
            regional_aggregates[normalized]['splunk'] += reg_splunk
            regional_aggregates[normalized]['gso'] += reg_gso
        
        regional_compliance = []
        for region, data in regional_aggregates.items():
            if data['total'] > 0:
                regional_compliance.append({
                    'region': region,
                    'total_assets': data['total'],
                    'splunk_coverage': round((data['splunk'] / data['total'] * 100), 2),
                    'gso_coverage': round((data['gso'] / data['total'] * 100), 2),
                    'any_logging': round(((data['splunk'] + data['gso'] - (data['splunk'] * data['gso'] / data['total'])) / data['total'] * 100), 2)
                })
        
        regional_compliance.sort(key=lambda x: x['total_assets'], reverse=True)
        
        conn.close()
        
        overall_compliance = round(((splunk_yes + gso_yes - both_yes) / total * 100) if total > 0 else 0, 2)
        
        return jsonify({
            'total_assets': total,
            'platform_breakdown': platform_breakdown,
            'platform_percentages': {
                'splunk_only': round((platform_breakdown['splunk_only'] / total * 100) if total > 0 else 0, 2),
                'gso_only': round((platform_breakdown['gso_only'] / total * 100) if total > 0 else 0, 2),
                'both_platforms': round((platform_breakdown['both_platforms'] / total * 100) if total > 0 else 0, 2),
                'no_logging': round((platform_breakdown['no_logging'] / total * 100) if total > 0 else 0, 2)
            },
            'regional_compliance': regional_compliance,
            'overall_compliance': overall_compliance,
            'compliance_status': 'COMPLIANT' if overall_compliance >= 95 else 'PARTIAL' if overall_compliance >= 80 else 'NON_COMPLIANT'
        })
        
    except Exception as e:
        logger.error(f"Logging compliance breakdown error: {e}")
        return jsonify({'error': str(e)}), 500

# FIXED: Only one domain_visibility_breakdown function now
@app.route('/api/domain_visibility/breakdown')
def domain_visibility_breakdown():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(host, 'unknown') as host,
                COALESCE(domain, '') as domain,
                LOWER(present_in_cmdb) LIKE '%yes%' as in_cmdb,
                LOWER(tanium_coverage) LIKE '%tanium%' as has_tanium,
                LOWER(logging_in_splunk) LIKE '%yes%' OR LOWER(logging_in_splunk) LIKE '%splunk%' as has_splunk
            FROM universal_cmdb
        """).fetchall()
        
        domain_stats = {'1dc': 0, 'fead': 0, 'both': 0, 'other': 0}
        domain_visibility = defaultdict(lambda: {'total': 0, 'cmdb': 0, 'tanium': 0, 'splunk': 0})
        host_domain_map = {}
        
        for host, domain_str, in_cmdb, has_tanium, has_splunk in result:
            domains = parse_pipe_separated(domain_str)
            has_1dc = False
            has_fead = False
            
            for domain in domains:
                domain_lower = domain.lower()
                if '1dc' in domain_lower:
                    has_1dc = True
                    domain_visibility['1dc']['total'] += 1
                    if in_cmdb:
                        domain_visibility['1dc']['cmdb'] += 1
                    if has_tanium:
                        domain_visibility['1dc']['tanium'] += 1
                    if has_splunk:
                        domain_visibility['1dc']['splunk'] += 1
                elif 'fead' in domain_lower:
                    has_fead = True
                    domain_visibility['fead']['total'] += 1
                    if in_cmdb:
                        domain_visibility['fead']['cmdb'] += 1
                    if has_tanium:
                        domain_visibility['fead']['tanium'] += 1
                    if has_splunk:
                        domain_visibility['fead']['splunk'] += 1
            
            if has_1dc and has_fead:
                domain_stats['both'] += 1
            elif has_1dc:
                domain_stats['1dc'] += 1
            elif has_fead:
                domain_stats['fead'] += 1
            else:
                domain_stats['other'] += 1
            
            host_domain_map[host] = {'1dc': has_1dc, 'fead': has_fead}
        
        total_hosts = len(host_domain_map)
        
        domain_distribution = {
            '1dc_only': domain_stats['1dc'],
            'fead_only': domain_stats['fead'],
            'both_domains': domain_stats['both'],
            'other': domain_stats['other']
        }
        
        domain_coverage = {}
        for domain, stats in domain_visibility.items():
            if stats['total'] > 0:
                domain_coverage[domain] = {
                    'total_assets': stats['total'],
                    'cmdb_coverage': round((stats['cmdb'] / stats['total'] * 100), 2),
                    'tanium_coverage': round((stats['tanium'] / stats['total'] * 100), 2),
                    'splunk_coverage': round((stats['splunk'] / stats['total'] * 100), 2)
                }
        
        conn.close()
        
        return jsonify({
            'total_hosts': total_hosts,
            'domain_distribution': domain_distribution,
            'domain_percentages': {
                '1dc_only': round((domain_distribution['1dc_only'] / total_hosts * 100) if total_hosts > 0 else 0, 2),
                'fead_only': round((domain_distribution['fead_only'] / total_hosts * 100) if total_hosts > 0 else 0, 2),
                'both_domains': round((domain_distribution['both_domains'] / total_hosts * 100) if total_hosts > 0 else 0, 2),
                'other': round((domain_distribution['other'] / total_hosts * 100) if total_hosts > 0 else 0, 2)
            },
            'domain_coverage': domain_coverage,
            'warfare_status': '1DC DOMINANT' if domain_stats['1dc'] > domain_stats['fead'] else 
                            'FEAD DOMINANT' if domain_stats['fead'] > domain_stats['1dc'] else 'BALANCED'
        })
        
    except Exception as e:
        logger.error(f"Domain visibility breakdown error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        conn = get_db_connection()
        result = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()
        conn.close()
        print(f"Database connected! Found {result[0]} records.")
        print("Starting Flask server on http://localhost:5000")
    except Exception as e:
        print(f"Database connection failed: {e}")
    
    app.run(debug=True, host='0.0.0.0', port=5000)