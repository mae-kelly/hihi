from flask import Flask, jsonify, request
from flask_cors import CORS
import duckdb
import re
import os
from collections import Counter, defaultdict
from datetime import datetime
import logging

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    db_paths = [
        'universal_cmdb.db',
        './universal_cmdb.db',
        '../universal_cmdb.db',
        '/app/universal_cmdb.db',
        os.path.join(os.getcwd(), 'universal_cmdb.db')
    ]
    
    for db_path in db_paths:
        try:
            if os.path.exists(db_path):
                logger.info(f"Attempting to connect to: {db_path}")
                conn = duckdb.connect(db_path, read_only=True)
                
                tables = conn.execute("SHOW TABLES").fetchall()
                logger.info(f"Available tables: {tables}")
                
                if any('universal_cmdb' in str(table).lower() for table in tables):
                    logger.info(f"Successfully connected to DuckDB at: {db_path}")
                    return conn
                else:
                    conn.close()
        except Exception as e:
            logger.error(f"Failed to connect to {db_path}: {e}")
            continue
    
    error_msg = f"Database file 'universal_cmdb.db' not found!"
    raise Exception(error_msg)

def verify_table_structure(conn):
    try:
        result = conn.execute("DESCRIBE universal_cmdb").fetchall()
        columns = [row[0] for row in result]
        logger.info(f"Table columns: {columns}")
        
        row_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        logger.info(f"Total rows in universal_cmdb: {row_count}")
        
        return columns, row_count
    except Exception as e:
        logger.error(f"Error verifying table structure: {e}")
        return [], 0

def normalize_country(country):
    if not country:
        return 'unknown'
    
    country_mapping = {
        'us': 'united states', 'usa': 'united states', 'america': 'united states',
        'ca': 'canada', 'can': 'canada', 'mx': 'mexico', 'mex': 'mexico',
        'uk': 'united kingdom', 'gb': 'united kingdom', 'britain': 'united kingdom',
        'de': 'germany', 'deu': 'germany', 'fr': 'france', 'fra': 'france',
        'it': 'italy', 'ita': 'italy', 'es': 'spain', 'esp': 'spain',
        'nl': 'netherlands', 'nld': 'netherlands', 'be': 'belgium', 'bel': 'belgium',
        'ch': 'switzerland', 'che': 'switzerland', 'at': 'austria', 'aut': 'austria',
        'se': 'sweden', 'swe': 'sweden', 'no': 'norway', 'nor': 'norway',
        'dk': 'denmark', 'dnk': 'denmark', 'fi': 'finland', 'fin': 'finland',
        'ie': 'ireland', 'irl': 'ireland', 'pt': 'portugal', 'prt': 'portugal',
        'gr': 'greece', 'grc': 'greece', 'pl': 'poland', 'pol': 'poland',
        'cz': 'czech republic', 'cze': 'czech republic', 'sk': 'slovakia', 'svk': 'slovakia',
        'hu': 'hungary', 'hun': 'hungary', 'ro': 'romania', 'rou': 'romania',
        'bg': 'bulgaria', 'bgr': 'bulgaria', 'hr': 'croatia', 'hrv': 'croatia',
        'si': 'slovenia', 'svn': 'slovenia', 'lt': 'lithuania', 'ltu': 'lithuania',
        'lv': 'latvia', 'lva': 'latvia', 'ee': 'estonia', 'est': 'estonia',
        'ru': 'russia', 'rus': 'russia', 'tr': 'turkey', 'tur': 'turkey',
        'ua': 'ukraine', 'ukr': 'ukraine', 'il': 'israel', 'isr': 'israel',
        'ae': 'united arab emirates', 'are': 'united arab emirates', 'uae': 'united arab emirates',
        'sa': 'saudi arabia', 'sau': 'saudi arabia', 'eg': 'egypt', 'egy': 'egypt',
        'za': 'south africa', 'zaf': 'south africa', 'ng': 'nigeria', 'nga': 'nigeria',
        'ke': 'kenya', 'ken': 'kenya', 'ma': 'morocco', 'mar': 'morocco',
        'jp': 'japan', 'jpn': 'japan', 'cn': 'china', 'chn': 'china', 'prc': 'china',
        'kr': 'south korea', 'kor': 'south korea', 'in': 'india', 'ind': 'india',
        'au': 'australia', 'aus': 'australia', 'nz': 'new zealand', 'nzl': 'new zealand',
        'sg': 'singapore', 'sgp': 'singapore', 'my': 'malaysia', 'mys': 'malaysia',
        'th': 'thailand', 'tha': 'thailand', 'ph': 'philippines', 'phl': 'philippines',
        'vn': 'vietnam', 'vnm': 'vietnam',
        'bd': 'bangladesh', 'bgd': 'bangladesh', 'pk': 'pakistan', 'pak': 'pakistan',
        'lk': 'sri lanka', 'lka': 'sri lanka', 'mm': 'myanmar', 'mmr': 'myanmar',
        'kh': 'cambodia', 'khm': 'cambodia', 'la': 'laos', 'lao': 'laos',
        'tw': 'taiwan', 'twn': 'taiwan', 'hk': 'hong kong', 'hkg': 'hong kong',
        'br': 'brazil', 'bra': 'brazil', 'ar': 'argentina', 'arg': 'argentina',
        'cl': 'chile', 'chl': 'chile', 'co': 'colombia', 'col': 'colombia',
        'pe': 'peru', 'per': 'peru', 'ec': 'ecuador', 'ecu': 'ecuador',
        've': 'venezuela', 'ven': 'venezuela', 'uy': 'uruguay', 'ury': 'uruguay',
        'py': 'paraguay', 'pry': 'paraguay', 'bo': 'bolivia', 'bol': 'bolivia',
        'cr': 'costa rica', 'cri': 'costa rica', 'pa': 'panama', 'pan': 'panama'
    }
    
    country_lower = country.lower().strip()
    return country_mapping.get(country_lower, country_lower)

def normalize_region(region):
    if not region:
        return 'unknown'
    
    region_lower = region.lower().strip()
    
    # Define indicators for each region
    na_indicators = ['north america', 'na', 'us', 'usa', 'united states', 'canada', 'ca', 'mexico', 'mx']
    emea_indicators = ['emea', 'europe', 'eu', 'middle east', 'africa', 'uk', 'gb', 'germany', 'de', 
                       'france', 'fr', 'italy', 'spain', 'netherlands', 'belgium', 'switzerland']
    latam_indicators = ['latam', 'latin america', 'south america', 'brazil', 'argentina', 'chile', 
                        'colombia', 'peru', 'venezuela', 'mexico']
    apac_indicators = ['apac', 'asia', 'pacific', 'japan', 'jp', 'china', 'cn', 'india', 'in', 
                       'australia', 'au', 'singapore', 'sg', 'korea', 'kr']
    
    if any(indicator in region_lower for indicator in na_indicators):
        return 'north america'
    elif any(indicator in region_lower for indicator in emea_indicators):
        return 'emea'  
    elif any(indicator in region_lower for indicator in latam_indicators):
        return 'latam'
    elif any(indicator in region_lower for indicator in apac_indicators):
        return 'apac'
    else:
        return region_lower

def parse_pipe_separated_values(value):
    if not value or str(value).lower() in ['null', 'none', 'unknown', '']:
        return []
    return [v.strip() for v in str(value).split('|') if v.strip()]

def parse_comma_separated_values(value):
    if not value or str(value).lower() in ['null', 'none', 'unknown', '']:
        return []
    return [v.strip() for v in str(value).split(',') if v.strip()]

def extract_class_numbers(value):
    if not value:
        return []
    matches = re.findall(r'class\s*(\d+)', str(value).lower())
    return [int(match) for match in matches]

@app.route('/api/database_status')
def database_status():
    try:
        conn = get_db_connection()
        columns, row_count = verify_table_structure(conn)
        
        # Get sample data
        sample_data = conn.execute("SELECT * FROM universal_cmdb LIMIT 5").fetchall()
        conn.close()
        
        return jsonify({
            'status': 'connected',
            'columns': columns,
            'row_count': row_count,
            'sample_rows': len(sample_data)
        })
    except Exception as e:
        logger.error(f"Database status error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/source_tables_metrics')
def source_tables_metrics():
    try:
        conn = get_db_connection()
        
        # Get total rows for percentage calculation
        total_rows = conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE source_tables IS NOT NULL AND source_tables != ''").fetchone()[0]
        
        queries_to_try = [
            """
            SELECT 
                TRIM(value) as source_table,
                COUNT(*) as frequency,
                COUNT(DISTINCT host) as unique_hosts
            FROM (
                SELECT host, UNNEST(STRING_SPLIT(source_tables, '|')) as value
                FROM universal_cmdb
                WHERE source_tables IS NOT NULL AND source_tables != ''
            )
            WHERE TRIM(value) != ''
            GROUP BY TRIM(value)
            ORDER BY frequency DESC
            """,
            """
            SELECT 
                source_tables as source_table,
                COUNT(*) as frequency,
                COUNT(DISTINCT host) as unique_hosts
            FROM universal_cmdb
            WHERE source_tables IS NOT NULL AND source_tables != ''
            GROUP BY source_tables
            ORDER BY frequency DESC
            """
        ]
        
        result = None
        for i, query in enumerate(queries_to_try):
            try:
                logger.info(f"Trying query ({i+1}) for source tables")
                result = conn.execute(query).fetchall()
                if result:
                    logger.info(f"Query ({i+1}) succeeded with {len(result)} results")
                    break
            except Exception as e:
                logger.warning(f"Query ({i+1}) failed: {e}")
                continue
        
        if not result:
            logger.error("All source table queries failed")
            conn.close()
            return jsonify({'error': 'No source table data found'}), 500
        
        # Calculate metrics
        total_mentions = sum([row[1] for row in result])
        
        detailed_data = []
        for source_name, frequency, unique_hosts in result:
            percentage = (frequency / total_mentions * 100) if total_mentions > 0 else 0
            detailed_data.append({
                'source': source_name,
                'frequency': frequency,
                'unique_hosts': unique_hosts,
                'percentage': round(percentage, 2)
            })
        
        detailed_data.sort(key=lambda x: x['frequency'], reverse=True)
        
        conn.close()
        
        return jsonify({
            'detailed_data': detailed_data,
            'unique_sources': len(detailed_data),
            'total_mentions': total_mentions,
            'unique_hosts_with_sources': total_rows,
            'top_10': detailed_data[:10],
            'risk_analysis': {
                'high_frequency': [d for d in detailed_data if d['percentage'] > 10],
                'medium_frequency': [d for d in detailed_data if 5 <= d['percentage'] <= 10],
                'low_frequency': [d for d in detailed_data if d['percentage'] < 5]
            }
        })
    except Exception as e:
        logger.error(f"Source tables metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/domain_metrics')
def domain_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            COALESCE(host, 'unknown') as host,
            COALESCE(domain, '') as domain
        FROM universal_cmdb
        WHERE host IS NOT NULL AND domain IS NOT NULL
        """).fetchall()
        
        domain_counter = Counter()
        unique_domains = set()
        host_domain_map = {}
        
        for row in result:
            host, domain = row
            
            if domain:
                domain_values = parse_pipe_separated_values(domain)
                host_domains = {'tdc': False, 'fead': False, 'other': False}
                
                for d in domain_values:
                    unique_domains.add(d)
                    if 'tdc' in d.lower():
                        host_domains['tdc'] = True
                    elif 'fead' in d.lower():
                        host_domains['fead'] = True
                    else:
                        host_domains['other'] = True
                
                for domain_type, present in host_domains.items():
                    if present:
                        domain_counter[domain_type] += 1
                        host_domain_map[host] = domain_type
        
        total_analyzed = sum(domain_counter.values())
        
        domain_details = {}
        for domain_type, count in domain_counter.items():
            percentage = (count / total_analyzed * 100) if total_analyzed > 0 else 0
            domain_details[domain_type] = {
                'count': count,
                'percentage': round(percentage, 2)
            }
        
        # Count multi-domain hosts
        multi_domain_hosts = 0
        for host in host_domain_map:
            if host_domain_map.get(host) == 'tdc' and host_domain_map.get(host) == 'fead':
                multi_domain_hosts += 1
        
        conn.close()
        
        return jsonify({
            'domain_analysis': dict(domain_counter),
            'domain_details': domain_details,
            'unique_domains': list(unique_domains)[:100],
            'total_analyzed': total_analyzed,
            'multi_domain_hosts': multi_domain_hosts,
            'domain_distribution': {
                'tdc_percentage': domain_details.get('tdc', {}).get('percentage', 0),
                'fead_percentage': domain_details.get('fead', {}).get('percentage', 0),
                'other_percentage': domain_details.get('other', {}).get('percentage', 0)
            },
            'warfare_intelligence': {
                'dominant_domain': max(domain_counter, key=domain_counter.get) if domain_counter else 'unknown',
                'domain_balance': abs(domain_counter.get('tdc', 0) - domain_counter.get('fead', 0)),
                'tactical_status': 'BALANCED' if abs(domain_counter.get('tdc', 0) - 
                domain_counter.get('fead', 0)) < total_analyzed * 0.1 else 'DOMINANT'
            }
        })
    except Exception as e:
        logger.error(f"Domain metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/infrastructure_type_metrics')
def infrastructure_type_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COUNT(*) as frequency,
            COALESCE(region, 'unknown') as region,
            COALESCE(business_unit, 'unknown') as business_unit
        FROM universal_cmdb
        GROUP BY infrastructure_type, region, business_unit
        ORDER BY frequency DESC
        """).fetchall()
        
        infrastructure_matrix = {}
        infrastructure_by_region = defaultdict(lambda: defaultdict(int))
        infrastructure_by_bu = defaultdict(lambda: defaultdict(int))
        total_count = 0
        
        for row in result:
            infra_type, frequency, region, bu = row
            if infra_type and infra_type != 'unknown':
                if infra_type not in infrastructure_matrix:
                    infrastructure_matrix[infra_type] = 0
                infrastructure_matrix[infra_type] += frequency
                total_count += frequency
                
                if region != 'unknown':
                    infrastructure_by_region[normalize_region(region)][infra_type] += frequency
                
                if bu != 'unknown':
                    infrastructure_by_bu[bu][infra_type] += frequency
        
        detailed_data = []
        for infra_type, frequency in infrastructure_matrix.items():
            percentage = (frequency / total_count * 100) if total_count > 0 else 0
            detailed_data.append({
                'type': infra_type,
                'frequency': frequency,
                'percentage': round(percentage, 2),
                'threat_level': 'CRITICAL' if percentage > 40 else 'HIGH' if percentage > 25 else 
                              'MEDIUM' if percentage > 10 else 'LOW'
            })
        
        detailed_data.sort(key=lambda x: x['frequency'], reverse=True)
        
        modernization_score = sum(1 for item in detailed_data if 'cloud' in 
                                item['type'].lower() or 'saas' in item['type'].lower())
        modernization_percentage = (modernization_score / len(detailed_data) * 100) if detailed_data else 0
        
        conn.close()
        
        return jsonify({
            'infrastructure_matrix': infrastructure_matrix,
            'detailed_data': detailed_data,
            'regional_analysis': dict(infrastructure_by_region),
            'business_unit_analysis': dict(infrastructure_by_bu),
            'total_types': len(infrastructure_matrix),
            'modernization_analysis': {
                'modernization_score': modernization_score,
                'modernization_percentage': round(modernization_percentage, 2),
                'legacy_systems': len([item for item in detailed_data if 'legacy' in 
                                     item['type'].lower()]),
                'cloud_adoption': len([item for item in detailed_data if 'cloud' in 
                                     item['type'].lower()])
            },
            'distribution': {
                'top_5': detailed_data[:5],
                'total_instances': total_count,
                'diversity_score': len(infrastructure_matrix),
                'concentration_risk': detailed_data[0]['percentage'] if detailed_data else 0
            }
        })
    except Exception as e:
        logger.error(f"Infrastructure type metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/region_metrics')
def region_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            COALESCE(region, 'unknown') as region,
            COUNT(*) as frequency,
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COALESCE(present_in_cmdb, 'unknown') as cmdb_status,
            COALESCE(tanium_coverage, 'unknown') as tanium_status
        FROM universal_cmdb
        GROUP BY region, infrastructure_type, cmdb_status, tanium_status
        ORDER BY frequency DESC
        """).fetchall()
        
        region_counter = Counter()
        region_details = defaultdict(list)
        total_analyzed = 0
        raw_regions = []
        
        for row in result:
            region, frequency, infra_type, cmdb_status, tanium_status = row
            if region and region != 'unknown':
                raw_regions.append({'region': region, 'frequency': frequency})
                
                region_values = parse_pipe_separated_values(region)
                for r in region_values:
                    normalized = normalize_region(r)
                    region_counter[normalized] += frequency
                    region_details[normalized].append({
                        'original': r,
                        'frequency': frequency,
                        'infrastructure': infra_type
                    })
                total_analyzed += frequency
        
        # Create region analytics
        region_analytics = {}
        for region, count in region_counter.items():
            percentage = (count / total_analyzed * 100) if total_analyzed > 0 else 0
            region_analytics[region] = {
                'count': count,
                'percentage': round(percentage, 2),
                'details': region_details[region][:10]  # Top 10 details for each region
            }
        
        conn.close()
        
        return jsonify({
            'region_distribution': dict(region_counter),
            'region_analytics': region_analytics,
            'total_analyzed': total_analyzed,
            'raw_regions': raw_regions[:100]  # Top 100 raw regions
        })
    except Exception as e:
        logger.error(f"Region metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/system_classification')
def system_classification():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            COALESCE(system, 'unknown') as system,
            COUNT(*) as frequency,
            COALESCE(region, 'unknown') as region,
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COALESCE(business_unit, 'unknown') as business_unit
        FROM universal_cmdb
        GROUP BY system, region, infrastructure_type, business_unit
        ORDER BY frequency DESC
        """).fetchall()
        
        system_matrix = Counter()
        system_analytics = defaultdict(lambda: {
            'total': 0,
            'infrastructure_types': set(),
            'regions': set(),
            'business_units': set(),
            'security_category': 'standard'
        })
        
        os_distribution = Counter()
        version_analysis = defaultdict(list)
        
        for row in result:
            system_name, frequency, region, infra_type, bu = row
            if system_name and system_name != 'unknown':
                system_matrix[system_name] += frequency
                system_analytics[system_name]['total'] += frequency
                system_analytics[system_name]['infrastructure_types'].add(infra_type)
                system_analytics[system_name]['regions'].add(normalize_region(region))
                system_analytics[system_name]['business_units'].add(bu)
                
                # Categorize OS
                s_lower = system_name.lower()
                if 'windows' in s_lower:
                    os_distribution['Windows'] += frequency
                elif 'linux' in s_lower or 'ubuntu' in s_lower or 'centos' in s_lower or 'rhel' in s_lower:
                    os_distribution['Linux'] += frequency
                elif 'mac' in s_lower or 'osx' in s_lower:
                    os_distribution['MacOS'] += frequency
                elif 'unix' in s_lower or 'aix' in s_lower or 'solaris' in s_lower:
                    os_distribution['Unix'] += frequency
                else:
                    os_distribution['Other'] += frequency
                
                # Extract version numbers
                version_match = re.search(r'\d+(\.\d+)*', system_name)
                if version_match:
                    version_analysis[version_match.group()].append(system_name)
                
                # Security categorization
                if any(keyword in s_lower for keyword in ['2008', '2012', '2016', 'xp', 'vista', '7', '8']):
                    system_analytics[system_name]['security_category'] = 'legacy'
                elif any(keyword in s_lower for keyword in ['2019', '2022', '10', '11', 'latest']):
                    system_analytics[system_name]['security_category'] = 'modern'
        
        security_distribution = defaultdict(int)
        modernization_candidates = []
        
        for system_name, analytics in system_analytics.items():
            analytics['infrastructure_types'] = list(analytics['infrastructure_types'])
            analytics['regions'] = list(analytics['regions'])
            analytics['business_units'] = list(analytics['business_units'])
            
            security_distribution[analytics['security_category']] += analytics['total']
            
            if analytics['security_category'] == 'legacy':
                modernization_candidates.append({
                    'system': system_name,
                    'count': analytics['total'],
                    'regions': analytics['regions']
                })
        
        total_systems = sum(system_matrix.values())
        
        conn.close()
        
        return jsonify({
            'system_matrix': dict(system_matrix),
            'system_analytics': dict(system_analytics),
            'os_distribution': dict(os_distribution),
            'version_analysis': {k: v[:5] for k, v in version_analysis.items()},  # Top 5 systems per version
            'security_distribution': dict(security_distribution),
            'total_systems': len(system_matrix),
            'modernization_analysis': {
                'legacy_systems': len(modernization_candidates),
                'legacy_assets': sum([c['count'] for c in modernization_candidates]),
                'modernization_priority': sorted(modernization_candidates, key=lambda x: 
                x['count'], reverse=True)[:10],
                'security_risk_level': round((security_distribution.get('legacy', 0) / 
                total_systems * 100), 2) if total_systems > 0 else 0
            },
            'taxonomy_intelligence': {
                'os_diversity': len(os_distribution),
                'dominant_os': max(os_distribution, key=os_distribution.get) if os_distribution else 'unknown',
                'system_sprawl': len(system_matrix),
                'standardization_score': round(max(os_distribution.values()) / total_systems * 
                100, 2) if os_distribution and total_systems > 0 else 0
            }
        })
    except Exception as e:
        logger.error(f"System classification error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/business_unit_metrics')  
def business_unit_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            COALESCE(business_unit, 'unknown') as business_unit,
            COUNT(*) as frequency,
            COALESCE(region, 'unknown') as region,
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COALESCE(present_in_cmdb, 'unknown') as cmdb_status,
            COALESCE(tanium_coverage, 'unknown') as tanium_status
        FROM universal_cmdb
        GROUP BY business_unit, region, infrastructure_type, cmdb_status, tanium_status
        ORDER BY frequency DESC
        """).fetchall()
        
        business_intelligence = {}
        bu_analytics = defaultdict(lambda: {
            'total_assets': 0,
            'regions': set(),
            'infrastructure_types': set(),
            'cmdb_registered': 0,
            'tanium_deployed': 0,
            'security_score': 0
        })
        
        regional_bu_distribution = defaultdict(lambda: defaultdict(int))
        
        for row in result:
            bu_name, frequency, region, infra_type, cmdb_status, tanium_status = row
            if bu_name and bu_name != 'unknown':
                separators = [';', '|']
                units = [bu_name]
                
                for sep in separators:
                    new_units = []
                    for u in units:
                        new_units.extend([u.strip() for u in str(u).split(sep) if u.strip()])
                    units = new_units
                
                for unit in units:
                    if unit:
                        business_intelligence[unit] = business_intelligence.get(unit, 0) + frequency
                        bu_analytics[unit]['total_assets'] += frequency
                        bu_analytics[unit]['regions'].add(normalize_region(region))
                        bu_analytics[unit]['infrastructure_types'].add(infra_type)
                        
                        if 'yes' in str(cmdb_status).lower():
                            bu_analytics[unit]['cmdb_registered'] += frequency
                        
                        if 'tanium' in str(tanium_status).lower():
                            bu_analytics[unit]['tanium_deployed'] += frequency
                        
                        regional_bu_distribution[normalize_region(region)][unit] += frequency
        
        bu_security_analysis = {}
        for unit, analytics in bu_analytics.items():
            total = analytics['total_assets']
            cmdb_percentage = (analytics['cmdb_registered'] / total * 100) if total > 0 else 0
            tanium_percentage = (analytics['tanium_deployed'] / total * 100) if total > 0 else 0
            security_score = (cmdb_percentage + tanium_percentage) / 2
            
            bu_security_analysis[unit] = {
                'total_assets': total,
                'geographic_spread': len(analytics['regions']),
                'infrastructure_diversity': len(analytics['infrastructure_types']),
                'cmdb_coverage': round(cmdb_percentage, 2),
                'tanium_coverage': round(tanium_percentage, 2),
                'security_score': round(security_score, 2),
                'regions': list(analytics['regions']),
                'infrastructure_types': list(analytics['infrastructure_types']),
                'security_status': 'SECURE' if security_score >= 80 else 'AT_RISK' if security_score >= 50 else 'VULNERABLE'
            }
        
        total_bu_assets = sum(business_intelligence.values())
        
        security_priority = sorted(bu_security_analysis.items(), key=lambda x: (x[1]['security_score'], -x[1]['total_assets']))
        
        conn.close()
        
        return jsonify({
            'business_intelligence': business_intelligence,
            'bu_security_analysis': bu_security_analysis,
            'regional_distribution': dict(regional_bu_distribution),
            'total_business_units': len(business_intelligence),
            'organizational_analytics': {
                'total_assets': total_bu_assets,
                'largest_bu': max(business_intelligence, key=business_intelligence.get) if business_intelligence else 'unknown',
                'most_distributed_bu': max(bu_security_analysis.keys(), key=lambda k: 
                bu_security_analysis[k]['geographic_spread']) if bu_security_analysis else 'unknown',
                'security_leaders': [unit for unit, data in bu_security_analysis.items() if 
                data['security_status'] == 'SECURE'],
                'vulnerable_units': [unit for unit, data in bu_security_analysis.items() if 
                data['security_status'] == 'VULNERABLE'],
                'risk_assessment': {
                    'high_risk_units': [unit for unit, data in bu_security_analysis.items() if 
                    data['security_score'] < 50],
                    'assets_at_risk': sum([data['total_assets'] for unit, data in 
                    bu_security_analysis.items() if data['security_score'] < 50]),
                    'security_priority_list': [{'unit': unit, 'assets': data['total_assets'], 'score': 
                    data['security_score']} for unit, data in security_priority[:10]]
                }
            }
        })
    except Exception as e:
        logger.error(f"Business unit metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cio_metrics')
def cio_metrics():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            COALESCE(cio, 'unknown') as cio,
            COUNT(*) as frequency,
            COALESCE(business_unit, 'unknown') as business_unit,
            COALESCE(region, 'unknown') as region
        FROM universal_cmdb
        WHERE cio IS NOT NULL AND cio != ''
        GROUP BY cio, business_unit, region
        ORDER BY frequency DESC
        """).fetchall()
        
        operative_intelligence = {}
        cio_analytics = defaultdict(lambda: {
            'total_assets': 0,
            'business_units': set(),
            'regions': set(),
            'span_of_control': 0
        })
        
        for row in result:
            cio_name, frequency, bu, region = row
            if cio_name and cio_name != 'unknown':
                cio_values = parse_pipe_separated_values(cio_name)
                
                for c in cio_values:
                    c = c.strip()
                    if c and re.search(r'[a-zA-Z]', c) and not c.isdigit():
                        operative_intelligence[c] = operative_intelligence.get(c, 0) + frequency
                        cio_analytics[c]['total_assets'] += frequency
                        cio_analytics[c]['business_units'].add(bu)
                        cio_analytics[c]['regions'].add(normalize_region(region))
        
        leadership_analysis = {}
        for cio, analytics in cio_analytics.items():
            span_of_control = len(analytics['business_units']) * len(analytics['regions'])
            
            leadership_analysis[cio] = {
                'total_assets': analytics['total_assets'],
                'business_units': len(analytics['business_units']),
                'geographic_regions': len(analytics['regions']),
                'span_of_control': span_of_control,
                'business_unit_list': list(analytics['business_units']),
                'region_list': list(analytics['regions']),
                'leadership_tier': 'EXECUTIVE' if span_of_control >= 10 else 'SENIOR' if span_of_control >= 5 else 'MANAGER'
            }
        
        total_cio_assets = sum(operative_intelligence.values())
        
        governance_metrics = {
            'executive_leaders': len([cio for cio, data in leadership_analysis.items() if 
            data['leadership_tier'] == 'EXECUTIVE']),
            'senior_leaders': len([cio for cio, data in leadership_analysis.items() if 
            data['leadership_tier'] == 'SENIOR']),
            'managers': len([cio for cio, data in leadership_analysis.items() if 
            data['leadership_tier'] == 'MANAGER']),
            'largest_portfolio': max(leadership_analysis.values(), key=lambda x: 
            x['total_assets'])['total_assets'] if leadership_analysis else 0,
            'most_distributed': max(leadership_analysis.values(), key=lambda x: 
            x['span_of_control'])['span_of_control'] if leadership_analysis else 0,
            'average_portfolio_size': round(total_cio_assets / len(operative_intelligence), 0) if 
            operative_intelligence else 0
        }
        
        executive_summary = {
            'top_executives': sorted(leadership_analysis.items(), key=lambda x: 
            x[1]['total_assets'], reverse=True)[:5],
            'most_distributed_leaders': sorted(leadership_analysis.items(), key=lambda x: 
            x[1]['span_of_control'], reverse=True)[:5],
            'leadership_effectiveness': len([cio for cio, data in leadership_analysis.items() if 
            data['span_of_control'] >= 5])
        }
        
        conn.close()
        
        return jsonify({
            'operative_intelligence': operative_intelligence,
            'leadership_analysis': leadership_analysis,
            'total_cio_entries': len(operative_intelligence),
            'governance_analytics': {
                'total_assets_under_management': total_cio_assets,
                'unique_leaders': len(operative_intelligence),
                'governance_distribution': governance_metrics,
                'average_portfolio_size': governance_metrics['average_portfolio_size']
            },
            'executive_summary': executive_summary
        })
    except Exception as e:
        logger.error(f"CIO metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tanium_coverage')
def tanium_coverage():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            CASE 
                WHEN LOWER(COALESCE(tanium_coverage, '')) LIKE '%tanium%' THEN 'deployed'
                ELSE 'not_deployed'
            END as status,
            COUNT(*) as count,
            COALESCE(region, 'unknown') as region,
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COALESCE(business_unit, 'unknown') as business_unit
        FROM universal_cmdb
        GROUP BY 
            CASE WHEN LOWER(COALESCE(tanium_coverage, '')) LIKE '%tanium%' THEN 'deployed' ELSE 'not_deployed' END,
            region, infrastructure_type, business_unit
        """).fetchall()
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        tanium_count = 0
        
        regional_coverage = defaultdict(lambda: {'deployed': 0, 'total': 0})
        infrastructure_coverage = defaultdict(lambda: {'deployed': 0, 'total': 0})
        bu_coverage = defaultdict(lambda: {'deployed': 0, 'total': 0})
        status_breakdown = {'deployed': 0, 'not_deployed': 0}
        
        for row in result:
            status, count, region, infra_type, bu = row
            
            status_breakdown[status] += count
            if status == 'deployed':
                tanium_count += count
            
            normalized_region = normalize_region(region)
            regional_coverage[normalized_region]['total'] += count
            if status == 'deployed':
                regional_coverage[normalized_region]['deployed'] += count
            
            infrastructure_coverage[infra_type]['total'] += count
            if status == 'deployed':
                infrastructure_coverage[infra_type]['deployed'] += count
            
            bu_coverage[bu]['total'] += count
            if status == 'deployed':
                bu_coverage[bu]['deployed'] += count
        
        coverage_percentage = (tanium_count / total_count * 100) if total_count > 0 else 0
        
        regional_analysis = {}
        for region, data in regional_coverage.items():
            coverage_pct = (data['deployed'] / data['total'] * 100) if data['total'] > 0 else 0
            regional_analysis[region] = {
                'deployed': data['deployed'],
                'total': data['total'],
                'coverage_percentage': round(coverage_pct, 2),
                'priority': 'HIGH' if coverage_pct < 50 else 'MEDIUM' if coverage_pct < 80 else 'LOW',
                'status': 'CRITICAL' if coverage_pct < 30 else 'WARNING' if coverage_pct < 60 else 'GOOD'
            }
        
        infrastructure_analysis = {}
        for infra_type, data in infrastructure_coverage.items():
            coverage_pct = (data['deployed'] / data['total'] * 100) if data['total'] > 0 else 0
            infrastructure_analysis[infra_type] = {
                'deployed': data['deployed'],
                'total': data['total'],
                'coverage_percentage': round(coverage_pct, 2),
                'priority': 'HIGH' if coverage_pct < 60 else 'MEDIUM' if coverage_pct < 85 else 'LOW'
            }
        
        bu_analysis = {}
        for bu, data in bu_coverage.items():
            coverage_pct = (data['deployed'] / data['total'] * 100) if data['total'] > 0 else 0
            bu_analysis[bu] = {
                'deployed': data['deployed'],
                'total': data['total'],
                'coverage_percentage': round(coverage_pct, 2),
                'risk_level': 'CRITICAL' if coverage_pct < 40 else 'HIGH' if coverage_pct < 70 else 'LOW'
            }
        
        deployment_gaps = {
            'unprotected_regions': len([r for r, d in regional_analysis.items() if d['status'] == 'CRITICAL']),
            'high_risk_infrastructure': len([i for i, d in infrastructure_analysis.items() if d['priority'] == 'HIGH']),
            'vulnerable_business_units': len([b for b, d in bu_analysis.items() if d['risk_level'] == 'CRITICAL']),
            'total_unprotected_assets': total_count - tanium_count
        }
        
        deployment_recommendations = []
        
        for region, data in regional_analysis.items():
            if data['status'] == 'CRITICAL':
                deployment_recommendations.append({
                    'type': 'regional',
                    'target': region,
                    'priority': 'HIGH',
                    'assets': data['total'] - data['deployed'],
                    'reason': f"Only {data['coverage_percentage']}% coverage in {region}"
                })
        
        for infra_type, data in infrastructure_analysis.items():
            if data['priority'] == 'HIGH':
                deployment_recommendations.append({
                    'type': 'infrastructure',
                    'target': infra_type,
                    'priority': 'HIGH',
                    'assets': data['total'] - data['deployed'],
                    'reason': f"Critical infrastructure type with {data['coverage_percentage']}% coverage"
                })
        
        conn.close()
        
        return jsonify({
            'tanium_deployed': tanium_count,
            'total_assets': total_count,
            'coverage_percentage': round(coverage_percentage, 2),
            'status_breakdown': status_breakdown,
            'regional_coverage': regional_analysis,
            'infrastructure_coverage': infrastructure_analysis,
            'business_unit_coverage': bu_analysis,
            'deployment_gaps': deployment_gaps,
            'deployment_recommendations': sorted(deployment_recommendations, 
            key=lambda x: x['assets'], reverse=True)[:10],
            'deployment_analysis': {
                'coverage_status': 'OPTIMAL' if coverage_percentage >= 80 else 'ACCEPTABLE' if 
                coverage_percentage >= 60 else 'CRITICAL',
                'deployment_gap': total_count - tanium_count,
                'recommended_action': 'MAINTAIN' if coverage_percentage >= 80 else 'EXPAND' if 
                coverage_percentage >= 60 else 'URGENT_DEPLOY',
                'security_risk_level': 'LOW' if coverage_percentage >= 80 else 'MEDIUM' if 
                coverage_percentage >= 60 else 'HIGH'
            },
            'trend_analysis': {
                'coverage_trend': 'improving',
                'deployment_velocity': 'steady',
                'risk_trajectory': 'decreasing' if coverage_percentage >= 70 else 'increasing'
            }
        })
    except Exception as e:
        logger.error(f"Tanium coverage error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cmdb_presence')
def cmdb_presence():
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
        SELECT
            CASE 
                WHEN LOWER(COALESCE(present_in_cmdb, '')) LIKE '%yes%' THEN 'registered'
                ELSE 'not_registered'
            END as status,
            COUNT(*) as count,
            COALESCE(region, 'unknown') as region,
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COALESCE(business_unit, 'unknown') as business_unit,
            COALESCE(data_center, 'unknown') as data_center
        FROM universal_cmdb
        GROUP BY 
            CASE WHEN LOWER(COALESCE(present_in_cmdb, '')) LIKE '%yes%' THEN 'registered' ELSE 'not_registered' END,
            region, infrastructure_type, business_unit, data_center
        """).fetchall()
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        yes_count = 0
        
        regional_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        infrastructure_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        bu_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        datacenter_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        status_breakdown = {'registered': 0, 'not_registered': 0}
        
        for row in result:
            status, count, region, infra_type, bu, dc = row
            
            status_breakdown[status] += count
            if status == 'registered':
                yes_count += count
            
            normalized_region = normalize_region(region)
            regional_presence[normalized_region]['total'] += count
            if status == 'registered':
                regional_presence[normalized_region]['registered'] += count
            
            infrastructure_presence[infra_type]['total'] += count
            if status == 'registered':
                infrastructure_presence[infra_type]['registered'] += count
            
            bu_presence[bu]['total'] += count
            if status == 'registered':
                bu_presence[bu]['registered'] += count
            
            if dc != 'unknown':
                first_word = str(dc).split()[0] if str(dc).split() else str(dc)
                datacenter_presence[first_word]['total'] += count
                if status == 'registered':
                    datacenter_presence[first_word]['registered'] += count
        
        registration_rate = (yes_count / total_count * 100) if total_count > 0 else 0
        
        regional_compliance = {}
        for region, data in regional_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            regional_compliance[region] = {
                'registered': data['registered'],
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'governance_status': 'EXCELLENT' if compliance_pct >= 95 else 'GOOD' if compliance_pct >= 85 else 'POOR',
                'status': 'COMPLIANT' if compliance_pct >= 90 else 'PARTIAL' if compliance_pct >= 70 else 'NON_COMPLIANT'
            }
        
        infrastructure_compliance = {}
        for infra_type, data in infrastructure_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            infrastructure_compliance[infra_type] = {
                'registered': data['registered'],
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'priority': 'URGENT' if compliance_pct < 60 else 'HIGH' if compliance_pct < 80 else 'MEDIUM'
            }
        
        bu_compliance = {}
        for bu, data in bu_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            bu_compliance[bu] = {
                'registered': data['registered'],
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'governance_status': 'EXCELLENT' if compliance_pct >= 95 else 'GOOD' if compliance_pct >= 85 else 'POOR'
            }
        
        datacenter_compliance = {}
        for dc, data in datacenter_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            datacenter_compliance[dc] = {
                'registered': data['registered'],
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'facility_status': 'MANAGED' if compliance_pct >= 90 else 'UNMANAGED'
            }
        
        compliance_gaps = {
            'non_compliant_regions': len([r for r, d in regional_compliance.items() if d['status'] == 'NON_COMPLIANT']),
            'urgent_infrastructure': len([i for i, d in infrastructure_compliance.items() if d['priority'] == 'URGENT']),
            'vulnerable_business_units': len([b for b, d in bu_compliance.items() if d['governance_status'] == 'POOR']),
            'unmanaged_datacenters': len([dc for dc, d in datacenter_compliance.items() if d['facility_status'] == 'UNMANAGED']),
            'total_unregistered_assets': total_count - yes_count
        }
        
        improvement_recommendations = []
        
        for region, data in regional_compliance.items():
            if data['status'] == 'NON_COMPLIANT':
                improvement_recommendations.append({
                    'type': 'regional',
                    'target': region,
                    'priority': 'CRITICAL',
                    'assets_to_register': data['total'] - data['registered'],
                    'current_compliance': data['compliance_percentage'],
                    'target_compliance': 90
                })
        
        for bu, data in bu_compliance.items():
            if data['governance_status'] == 'POOR':
                improvement_recommendations.append({
                    'type': 'business_unit',
                    'target': bu,
                    'priority': 'HIGH',
                    'assets_to_register': data['total'] - data['registered'],
                    'current_compliance': data['compliance_percentage'],
                    'target_compliance': 85
                })
        
        conn.close()
        
        return jsonify({
            'cmdb_registered': yes_count,
            'total_assets': total_count,
            'registration_rate': round(registration_rate, 2),
            'status_breakdown': status_breakdown,
            'regional_compliance': regional_compliance,
            'infrastructure_compliance': infrastructure_compliance,
            'business_unit_compliance': bu_compliance,
            'datacenter_compliance': datacenter_compliance,
            'compliance_gaps': compliance_gaps,
            'improvement_recommendations': sorted(improvement_recommendations, 
            key=lambda x: x['assets_to_register'], reverse=True)[:10],
            'compliance_analysis': {
                'compliance_status': 'COMPLIANT' if registration_rate >= 90 else 
                'PARTIAL_COMPLIANCE' if registration_rate >= 70 else 'NON_COMPLIANT',
                'improvement_needed': max(0, round(90 - registration_rate, 2)),
                'governance_maturity': 'MATURE' if registration_rate >= 95 else 'DEVELOPING' if 
                registration_rate >= 50 else 'IMMATURE',
                'audit_readiness': {
                    'audit_score': round(registration_rate, 0),
                    'compliant_regions': len([r for r, d in regional_compliance.items() if d['status'] == 'COMPLIANT']),
                    'managed_facilities': len([dc for dc, d in datacenter_compliance.items() if d['facility_status'] == 'MANAGED']),
                    'governance_excellence': len([bu for bu, d in bu_compliance.items() if d['governance_status'] == 'EXCELLENT'])
                }
            }
        })
    except Exception as e:
        logger.error(f"CMDB presence error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/host_search')
def host_search():
    try:
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term required'}), 400
        
        conn = get_db_connection()
        
        search_queries = [
            """
            SELECT
                COALESCE(host, 'unknown') as host,
                COALESCE(region, 'unknown') as region,
                COALESCE(country, 'unknown') as country,
                COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
                COALESCE(source_tables, 'none') as source_tables,
                COALESCE(domain, 'none') as domain,
                COALESCE(data_center, 'unknown') as data_center,
                COALESCE(present_in_cmdb, 'unknown') as present_in_cmdb,
                COALESCE(tanium_coverage, 'unknown') as tanium_coverage,
                COALESCE(business_unit, 'unknown') as business_unit,
                COALESCE(system, 'unknown') as system,
                COALESCE(class, 'unknown') as class
            FROM universal_cmdb
            WHERE LOWER(COALESCE(host, '')) LIKE LOWER(?)
            ORDER BY host
            LIMIT 500
            """
        ]
        
        result = None
        search_pattern = f'%{search_term}%'
        
        for i, query in enumerate(search_queries):
            try:
                result = conn.execute(query, [search_pattern]).fetchall()
                
                if result:
                    logger.info(f"Search query ({i+1}) returned {len(result)} results")
                    break
            except Exception as e:
                logger.warning(f"Search query ({i+1}) failed: {e}")
                continue
        
        if not result:
            conn.close()
            return jsonify({'hosts': [], 'total_found': 0, 'search_term': search_term})
        
        hosts = []
        for row in result:
            host_data = {
                'host': row[0],
                'region': row[1],
                'country': row[2],
                'infrastructure_type': row[3],
                'source_tables': row[4],
                'domain': row[5],
                'data_center': row[6],
                'present_in_cmdb': row[7],
                'tanium_coverage': row[8],
                'business_unit': row[9],
                'system': row[10] if len(row) > 10 else 'unknown',
                'class': row[11] if len(row) > 11 else 'unknown'
            }
            hosts.append(host_data)
        
        search_analytics = {
            'regions': list(set([h['region'] for h in hosts if h['region'] != 'unknown']))[:20],
            'countries': list(set([h['country'] for h in hosts if h['country'] != 'unknown']))[:20],
            'infrastructure_types': list(set([h['infrastructure_type'] for h in hosts if h['infrastructure_type'] != 'unknown']))[:20],
            'business_units': list(set([h['business_unit'] for h in hosts if h['business_unit'] != 'unknown']))[:20],
            'data_centers': list(set([h['data_center'] for h in hosts if h['data_center'] != 'unknown']))[:20],
            'cmdb_registered': len([h for h in hosts if 'yes' in str(h['present_in_cmdb']).lower()]),
            'tanium_deployed': len([h for h in hosts if 'tanium' in str(h['tanium_coverage']).lower()]),
            'security_coverage': 0
        }
        
        search_analytics['security_coverage'] = round(
            (search_analytics['cmdb_registered'] + search_analytics['tanium_deployed']) / (2 * len(hosts)) * 100, 2
        ) if hosts else 0
        
        conn.close()
        
        return jsonify({
            'hosts': hosts[:100],  # Limit to 100 results for frontend
            'total_found': len(hosts),
            'search_term': search_term,
            'search_summary': search_analytics,
            'drill_down_available': len(hosts) > 100,
            'search_scope': {
                'searched_fields': ['host'],
                'result_limit': 100,
                'total_matches': len(hosts)
            }
        })
    except Exception as e:
        logger.error(f"Host search error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/advanced_analytics')
def advanced_analytics():
    try:
        conn = get_db_connection()
        
        correlation_query = """
        SELECT
            COALESCE(region, 'unknown') as region,
            COALESCE(infrastructure_type, 'unknown') as infrastructure_type,
            COUNT(*) as asset_count,
            SUM(CASE WHEN LOWER(COALESCE(present_in_cmdb, '')) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_registered,
            SUM(CASE WHEN LOWER(COALESCE(tanium_coverage, '')) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_deployed,
            COUNT(DISTINCT COALESCE(business_unit, 'unknown')) as unique_business_units,
            COUNT(DISTINCT COALESCE(data_center, 'unknown')) as unique_datacenters
        FROM universal_cmdb
        GROUP BY region, infrastructure_type
        HAVING COUNT(*) >= 10
        ORDER BY asset_count DESC
        """
        
        result = conn.execute(correlation_query).fetchall()
        
        correlation_analysis = []
        total_correlations = 0
        high_risk_combinations = []
        
        for row in result:
            region, infra_type, asset_count, cmdb_count, tanium_count, bu_count, dc_count = row
            
            cmdb_percentage = (cmdb_count / asset_count * 100) if asset_count > 0 else 0
            tanium_percentage = (tanium_count / asset_count * 100) if asset_count > 0 else 0
            combined_security_score = (cmdb_percentage + tanium_percentage) / 2
            
            correlation_data = {
                'region': normalize_region(region),
                'infrastructure_type': infra_type,
                'asset_count': asset_count,
                'cmdb_coverage': round(cmdb_percentage, 2),
                'tanium_coverage': round(tanium_percentage, 2),
                'security_score': round(combined_security_score, 2),
                'business_unit_diversity': bu_count,
                'datacenter_diversity': dc_count,
                'risk_category': 'HIGH' if combined_security_score < 50 else 'MEDIUM' if combined_security_score < 80 else 'LOW'
            }
            
            correlation_analysis.append(correlation_data)
            total_correlations += 1
            
            if combined_security_score < 40:
                high_risk_combinations.append(correlation_data)
        
        trend_analysis = {}
        for item in correlation_analysis:
            region = item['region']
            if region not in trend_analysis:
                trend_analysis[region] = {
                    'total_assets': 0,
                    'avg_security_score': 0,
                    'infrastructure_types': 0,
                    'high_risk_segments': 0
                }
            
            trend_analysis[region]['total_assets'] += item['asset_count']
            trend_analysis[region]['avg_security_score'] += item['security_score'] * item['asset_count']
            trend_analysis[region]['infrastructure_types'] += 1
            if item['risk_category'] == 'HIGH':
                trend_analysis[region]['high_risk_segments'] += 1
        
        for region, data in trend_analysis.items():
            if data['total_assets'] > 0:
                data['avg_security_score'] = round(data['avg_security_score'] / data['total_assets'], 2)
        
        predictive_insights = {
            'security_trends': {
                'improving_regions': [r for r, d in trend_analysis.items() if d['avg_security_score'] >= 80],
                'declining_regions': [r for r, d in trend_analysis.items() if d['avg_security_score'] < 50],
                'stable_regions': [r for r, d in trend_analysis.items() if 50 <= d['avg_security_score'] < 80]
            },
            'infrastructure_modernization': {
                'cloud_adoption_leaders': [],
                'legacy_infrastructure_regions': [],
                'hybrid_environments': []
            },
            'risk_predictions': {
                'high_priority_remediation': len(high_risk_combinations),
                'assets_at_risk': sum([item['asset_count'] for item in high_risk_combinations]),
                'projected_incidents': round(sum([item['asset_count'] for item in high_risk_combinations]) * 0.1, 0)
            }
        }
        
        conn.close()
        
        return jsonify({
            'correlation_analysis': correlation_analysis[:50],  # Limit for performance
            'trend_analysis': trend_analysis,
            'high_risk_combinations': sorted(high_risk_combinations, key=lambda x: x['asset_count'], reverse=True),
            'predictive_insights': predictive_insights,
            'analytics_summary': {
                'total_correlations_analyzed': total_correlations,
                'high_risk_segments': len(high_risk_combinations),
                'coverage_gaps_identified': len([item for item in correlation_analysis if item['security_score'] < 70]),
                'modernization_opportunities': len([item for item in correlation_analysis if 'legacy' in item['infrastructure_type'].lower()])
            }
        })
    except Exception as e:
        logger.error(f"Advanced analytics error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        conn = get_db_connection()
        columns, row_count = verify_table_structure(conn)
        conn.close()
        logger.info(f"Database initialized successfully. Columns: {len(columns)}, Rows: {row_count}")
        print(f"✅ Database connection successful! Found {row_count} rows with {len(columns)} columns.")
        print("🚀 Starting Flask server on http://localhost:5000")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        print(f"❌ Database connection failed: {e}")
        print("Please ensure your 'universal_cmdb.db' file exists in the project directory.")
    
    app.run(debug=True, host='0.0.0.0', port=5000)