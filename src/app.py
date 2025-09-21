#!/usr/bin/env python3

from flask import Flask, jsonify, request
from flask_cors import CORS
import duckdb
import re
import os
import sys
from collections import Counter, defaultdict
import logging
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection with multiple path attempts"""
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
                return conn
        except Exception as e:
            logger.error(f"Failed to connect to {db_path}: {e}")
            continue
    
    raise Exception("Database file 'universal_cmdb.db' not found!")

def verify_table_structure(conn):
    """Verify the universal_cmdb table exists and has expected columns"""
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
    """Normalize country names to standard format"""
    if not country:
        return 'unknown'
    
    country_mapping = {
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
        'th': 'thailand', 'tha': 'thailand', 'vn': 'vietnam', 'vnm': 'vietnam',
        'ph': 'philippines', 'phl': 'philippines', 'bd': 'bangladesh', 'bgd': 'bangladesh',
        'pk': 'pakistan', 'pak': 'pakistan', 'lk': 'sri lanka', 'lka': 'sri lanka',
        'mm': 'myanmar', 'mmr': 'myanmar', 'kh': 'cambodia', 'khm': 'cambodia',
        'la': 'laos', 'lao': 'laos', 'tw': 'taiwan', 'twn': 'taiwan', 'hk': 'hong kong',
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
    """Normalize region names to standard format"""
    if not region:
        return 'unknown'
    
    region_mapping = {
        'na': 'north america', 'usa': 'united states', 'america': 'united states',
        'emea': 'europe', 'eu': 'middle east', 'africa': 'uk', 'gb': 'britain', 'germany',
        'de': 'france', 'fr': 'italy', 'spain', 'netherlands', 'belgium', 'switzerland',
        'norway': 'denmark', 'finland', 'ireland', 'portugal', 'greece', 'poland', 'czech', 'slovakia',
        'norway', 'romania', 'bulgaria', 'croatia', 'slovenia', 'lithuania', 'estonia', 'russia',
        'hungary', 'romania', 'bulgaria', 'croatia', 'slovenia', 'lithuania', 'estonia', 'russia'
    }
    
    return region_mapping.get(region.lower().strip(), region.lower())

def parse_pipe_separated_values(value):
    """Parse pipe-separated values"""
    if not value or str(value).lower() in ['null', 'none', 'unknown', '']:
        return []
    return [v.strip() for v in str(value).split('|') if v.strip()]

def parse_comma_separated_values(value):
    """Parse comma-separated values"""
    if not value or str(value).lower() in ['null', 'none', 'unknown', '']:
        return []
    return [v.strip() for v in str(value).split(',') if v.strip()]

def extract_class_numbers(value):
    """Extract numeric values from classification strings"""
    if not value:
        return []
    matches = re.findall(r'class\s*(\d+)', str(value).lower())
    return [int(match) for match in matches]

@app.route('/api/database_status')
def database_status():
    """Check database connectivity and return basic stats"""
    try:
        conn = get_db_connection()
        columns, row_count = verify_table_structure(conn)
        conn.close()
        
        return jsonify({
            'status': 'connected',
            'table': 'universal_cmdb',
            'columns': columns,
            'row_count': row_count,
            'database_type': 'duckdb'
        })
    except Exception as e:
        logger.error(f"Database status error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/source_tables_metrics')
def source_tables_metrics():
    """Analyze source table distribution and intelligence"""
    try:
        conn = get_db_connection()
        
        # Query for source table analysis
        result = conn.execute("""
            SELECT 
                TRIM(value) as source_table,
                COUNT(*) as frequency,
                COUNT(DISTINCT host_s) as unique_hosts
            FROM (
                SELECT host_s, UNNESTING(STRING_SPLIT(source_tables_s, ',')) as value
                FROM universal_cmdb
                WHERE source_tables_s IS NOT NULL AND source_tables_s != ''
            ) as source_data
            WHERE TRIM(value) != ''
            GROUP BY TRIM(value)
            ORDER BY frequency DESC
        """).fetchall()
        
        if not result:
            logger.error("No source table data found")
            return jsonify({'error': 'No source table data found'}), 500
        
        # Calculate total mentions
        total_mentions = sum(row[1] for row in result)
        
        # Build detailed data
        detailed_data = []
        for source_name, frequency, unique_hosts in result:
            percentage = (frequency / total_mentions * 100) if total_mentions > 0 else 0
            detailed_data.append({
                'source': source_name,
                'frequency': frequency,
                'unique_hosts': unique_hosts,
                'percentage': round(percentage, 2)
            })
        
        # Sort by frequency descending
        detailed_data.sort(key=lambda x: x['frequency'], reverse=True)
        
        # Source intelligence analysis
        source_intelligence = {
            'data': detailed_data,
            'detailed_data': detailed_data[:10],  # Top 10
            'unique_sources': len(detailed_data),
            'total_instances': total_mentions,
            'top_10': detailed_data[:10],
            'risk_analysis': {
                'high_frequency': [d for d in detailed_data if d['percentage'] > 10],
                'medium_frequency': [d for d in detailed_data if 5 <= d['percentage'] <= 10],
                'low_frequency': [d for d in detailed_data if d['percentage'] < 5]
            }
        }
        
        conn.close()
        
        return jsonify({
            'source_intelligence': source_intelligence,
            'detailed_data': detailed_data,
            'unique_sources': len(detailed_data),
            'total_instances': total_mentions,
            'top_10': detailed_data[:10],
            'risk_analysis': source_intelligence['risk_analysis']
        })
        
    except Exception as e:
        logger.error(f"Source tables metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/domain_metrics')
def domain_metrics():
    """Analyze domain distribution and intelligence"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(domain_s, 'unknown') as domain,
                COUNT(*) as frequency,
                COUNT(DISTINCT host_s) as unique_hosts
            FROM universal_cmdb
            GROUP BY domain_s
            ORDER BY frequency DESC
        """).fetchall()
        
        domain_counter = Counter()
        host_domain_map = {}
        
        for domain, frequency, unique_hosts in result:
            if domain:
                domain_values = parse_pipe_separated_values(domain)
                host_domains = {'tdc': False, 'lead': False, 'other': False}
                
                for d in domain_values:
                    unique_domains = set()
                    if 'tdc' in d.lower():
                        host_domains['tdc'] = True
                    elif 'lead' in d.lower():
                        host_domains['lead'] = True
                    else:
                        host_domains['other'] = True
                
                for domain_type, present in host_domains.items():
                    if present:
                        domain_counter[domain_type] += 1
                        host_domain_map[domain] = domain_type
        
        total_analyzed = sum(domain_counter.values())
        
        domain_details = {}
        for domain_type, count in domain_counter.items():
            percentage = (count / total_analyzed * 100) if total_analyzed > 0 else 0
            domain_details[domain_type] = {
                'count': count,
                'percentage': round(percentage, 2)
            }
        
        multi_domain_hosts = len([h for h, d in host_domain_map.items() if len(h.split('|')) > 1 and 
                                 'tdc' in str(h).lower() and 'lead' in str(h).lower()])
        
        conn.close()
        
        return jsonify({
            'domain_analysis': domain_counter,
            'domain_details': domain_details,
            'unique_domains': list(unique_domains) if 'unique_domains' in locals() else [],
            'total_analyzed': total_analyzed,
            'multi_domain_assets': multi_domain_hosts,
            'domain_distribution': {
                'tdc_percentage': domain_details.get('tdc', {}).get('percentage', 0),
                'lead_percentage': domain_details.get('lead', {}).get('percentage', 0),
                'other_percentage': domain_details.get('other', {}).get('percentage', 0)
            },
            'warfare_intelligence': {
                'dominant_domain': max(domain_counter, key=domain_counter.get) if domain_counter else 'unknown',
                'domain_balance': abs(domain_counter.get('tdc', 0) - domain_counter.get('lead', 0)),
                'tactical_status': 'BALANCED' if abs(domain_counter.get('tdc', 0) - domain_counter.get('lead', 0)) < total_analyzed * 0.1 else 'DOMINANT'
            }
        })
        
    except Exception as e:
        logger.error(f"Domain metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/infrastructure_type')
def infrastructure_type_metrics():
    """Analyze infrastructure type distribution"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COUNT(*) as frequency,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(business_unit_s, 'unknown') as business_unit
            FROM universal_cmdb
            GROUP BY infrastructure_type_s, region_s, business_unit_s
            ORDER BY frequency DESC
        """).fetchall()
        
        infrastructure_matrix = {}
        infrastructure_by_region = defaultdict(lambda: defaultdict(int))
        infrastructure_by_bu = defaultdict(lambda: defaultdict(int))
        total_count = 0
        
        for infra_type, frequency, region, bu in result:
            infra_type, frequency, region, bu = row
            
            if infra_type not in infrastructure_matrix:
                infrastructure_matrix[infra_type] = infrastructure_matrix.get(infra_type, 0) + frequency
            
            total_count += frequency
            
            if region != 'unknown':
                infrastructure_by_region[normalize_region(region)][infra_type] += frequency
            
            if bu != 'unknown':
                infrastructure_by_bu[bu][infra_type] += frequency
        
        detailed_data = []
        for infra_type, frequency in infrastructure_matrix.items():
            percentage = (frequency / total_count * 100) if total_count > 0 else 0
            threat_level = 'CRITICAL' if percentage > 40 else 'HIGH' if percentage > 25 else 'MEDIUM' if percentage > 10 else 'LOW'
            
            detailed_data.append({
                'type': infra_type,
                'frequency': frequency,
                'percentage': round(percentage, 2),
                'threat_level': threat_level
            })
        
        detailed_data.sort(key=lambda x: x['frequency'], reverse=True)
        
        # Calculate modernization score
        modernization_score = 0
        for item in detailed_data:
            if 'cloud' in item['type'].lower() or 'saas' in item['type'].lower():
                modernization_score += item['frequency']
        
        modernization_percentage = (modernization_score / total_count * 100) if total_count > 0 else 0
        
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
                'legacy_systems': [item for item in detailed_data if 'legacy' in item['type'].lower()],
                'cloud_adoption': [item for item in detailed_data if 'cloud' in item['type'].lower()]
            }
        })
        
    except Exception as e:
        logger.error(f"Infrastructure type metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/region_metrics')  
def region_metrics():
    """Analyze regional security and coverage metrics"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(region_s, 'unknown') as region,
                COUNT(*) as frequency,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COALESCE(present_in_cmdb_s, 'unknown') as cmdb_status,
                COALESCE(tanium_coverage_s, 'unknown') as tanium_status
            FROM universal_cmdb
            GROUP BY region_s, infrastructure_type_s, present_in_cmdb_s, tanium_coverage_s
            ORDER BY frequency DESC
        """).fetchall()
        
        region_counter = Counter()
        region_details = defaultdict(lambda: defaultdict(int))
        regional_analytics = {}
        
        for region, frequency, infra_type, cmdb_status, tanium_status in result:
            if region and region != 'unknown':
                normalized = normalize_region(region)
                region_counter[normalized] += frequency
                
                # Track CMDB coverage
                if 'yes' in str(cmdb_status).lower():
                    region_details[normalized]['cmdb_registered'] += frequency
                
                # Track Tanium coverage  
                if 'managed' in str(tanium_status).lower() or 'tanium' in str(tanium_status).lower():
                    region_details[normalized]['tanium_deployed'] += frequency
                
                region_details[normalized]['total'] += frequency
        
        # Calculate regional analytics
        for region, count in region_counter.items():
            cmdb_data = region_details[region]['cmdb_registered']
            tanium_data = region_details[region]['tanium_deployed']  
            total = region_details[region]['total']
            
            cmdb_percentage = (cmdb_data / total * 100) if total > 0 else 0
            tanium_percentage = (tanium_data / total * 100) if total > 0 else 0
            
            regional_analytics[region] = {
                'count': count,
                'percentage': round(count / sum(region_counter.values()) * 100, 2) if region_counter else 0,
                'cmdb_coverage': round(cmdb_percentage, 2),
                'tanium_coverage': round(tanium_percentage, 2),
                'infrastructure_diversity': len(set([r[2] for r in result if normalize_region(r[0]) == region])),
                'security_score': round((cmdb_percentage + tanium_percentage) / 2, 2)
            }
        
        # Threat assessment
        threat_assessment = {
            'highest_risk_region': min(regional_analytics.keys(), key=lambda k: regional_analytics[k]['security_score']) if regional_analytics else None,
            'most_secure_region': max(regional_analytics.keys(), key=lambda k: regional_analytics[k]['security_score']) if regional_analytics else None,
            'geographic_balance': max(regional_analytics.values(), key=lambda x: x['percentage'])['percentage'] - min(regional_analytics.values(), key=lambda x: x['percentage'])['percentage'] if regional_analytics else 0
        }
        
        conn.close()
        
        return jsonify({
            'global_surveillance': region_counter,
            'region_details': dict(region_details),
            'regional_analytics': regional_analytics,
            'regional_infrastructure': dict(regional_analytics),
            'raw_regions': list(region_counter.keys()),
            'total_coverage': sum(region_counter.values()),
            'threat_assessment': threat_assessment
        })
        
    except Exception as e:
        logger.error(f"Region metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/country_metrics')
def country_metrics():
    """Analyze country-level security intelligence"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(country_s, 'unknown') as country,
                COUNT(*) as frequency,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(present_in_cmdb_s, 'unknown') as cmdb_status,
                COALESCE(tanium_coverage_s, 'unknown') as tanium_status
            FROM universal_cmdb
            GROUP BY country_s, region_s, present_in_cmdb_s, tanium_coverage_s
            ORDER BY frequency DESC
        """).fetchall()
        
        country_counter = Counter()
        country_regional_map = {}
        country_security_scores = {}
        
        for country, frequency, region, cmdb_status, tanium_status in result:
            if country and country != 'unknown':
                normalized = normalize_country(country)
                country_counter[normalized] += frequency
                country_regional_map[normalized] = normalize_region(region)
                
                # Calculate security scores
                cmdb_score = 50 if 'yes' in str(cmdb_status).lower() else 0
                tanium_score = 50 if 'managed' in str(tanium_status).lower() or 'tanium' in str(tanium_status).lower() else 0
                
                if normalized not in country_security_scores:
                    country_security_scores[normalized] = {'cmdb': 0, 'tanium': 0, 'total': 0}
                
                country_security_scores[normalized]['cmdb'] += cmdb_score
                country_security_scores[normalized]['tanium'] += tanium_score
                country_security_scores[normalized]['total'] += frequency
        
        total_assets = sum(country_counter.values())
        
        country_analysis = {}
        for country, count in country_counter.most_common():
            security_data = country_security_scores.get(country, {'cmdb': 0, 'tanium': 0, 'total': 1})
            
            cmdb_coverage = security_data['cmdb'] / security_data['total'] if security_data['total'] > 0 else 0
            tanium_coverage = security_data['tanium'] / security_data['total'] if security_data['total'] > 0 else 0
            overall_security = (cmdb_coverage + tanium_coverage) / 2
            
            threat_level = 'CRITICAL' if overall_security < 25 else 'HIGH' if overall_security < 50 else 'MEDIUM' if overall_security < 75 else 'LOW'
            
            country_analysis[country] = {
                'count': count,
                'percentage': round(count / total_assets * 100, 2) if total_assets > 0 else 0,
                'region': country_regional_map.get(country, 'unknown'),
                'security_score': round(overall_security, 2),
                'threat_level': threat_level
            }
        
        # Geographic intelligence
        geographic_concentration = country_analysis[max(country_counter, key=country_counter.get)]['percentage'] if country_counter else 0
        
        # Top threat countries
        high_threat_countries = {c: data for c, data in country_analysis.items() if data['threat_level'] == 'CRITICAL'}
        
        # Countries by security status
        compliant_regions = [c for c, data in country_analysis.items() if data['threat_level'] == 'LOW']
        urgent_infrastructure = [c for c, data in country_analysis.items() if data['threat_level'] == 'CRITICAL']
        
        conn.close()
        
        return jsonify({
            'total_countries': len(country_counter),
            'country_analysis': country_analysis,
            'country_distribution': dict(country_counter),
            'threat_intelligence': {
                'highest_threat_countries': [c for c, d in country_analysis.items() if d['threat_level'] == 'CRITICAL'][:5],
                'most_secure_countries': [c for c, d in country_analysis.items() if d['threat_level'] == 'LOW'][:5]
            },
            'geographic_concentration': geographic_concentration,
            'compliant_regions': compliant_regions,
            'urgent_infrastructure': urgent_infrastructure,
            'total_gap_assets': sum(d['count'] for d in country_analysis.values() if d['threat_level'] == 'CRITICAL')
        })
        
    except Exception as e:
        logger.error(f"Country metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/class_metrics')
def class_metrics():
    """Analyze security classification metrics"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(class_s, 'unknown') as class,
                COUNT(*) as frequency,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COALESCE(region_s, 'unknown') as region
            FROM universal_cmdb
            WHERE class_s IS NOT NULL AND class_s != ''
            GROUP BY class_s, infrastructure_type_s, region_s
            ORDER BY frequency DESC
        """).fetchall()
        
        classification_matrix = {}
        class_details = defaultdict(lambda: {
            'total': 0,
            'infrastructure_types': set(),
            'regions': set(),
            'risk_level': 'unknown'
        })
        
        for class_name, frequency, infra_type, region in result:
            if class_name and class_name != 'unknown':
                class_numbers = extract_class_numbers(class_name)
                
                if class_numbers:
                    for class_num in class_numbers:
                        classification_matrix[class_num] = classification_matrix.get(class_num, 0) + frequency
                        class_details[class_name]['total'] += frequency
                        class_details[class_name]['infrastructure_types'].add(infra_type)
                        class_details[class_name]['regions'].add(normalize_region(region))
                        
                        # Determine risk level
                        if class_num < 2:
                            class_details[class_name]['risk_level'] = 'CRITICAL'
                        elif class_num < 4:
                            class_details[class_name]['risk_level'] = 'HIGH'
                        elif class_num < 6:
                            class_details[class_name]['risk_level'] = 'MEDIUM'
                        else:
                            class_details[class_name]['risk_level'] = 'LOW'
                else:
                    classification_matrix[class_name] = classification_matrix.get(class_name, 0) + frequency
        
        total_classified_assets = sum(classification_matrix.values())
        
        class_analytics = {}
        for class_name, details in class_details.items():
            class_analytics[class_name] = {
                'total_assets': details['total'],
                'percentage': round(details['total'] / total_classified_assets * 100, 2) if total_classified_assets > 0 else 0,
                'infrastructure_diversity': len(details['infrastructure_types']),
                'geographic_spread': len(details['regions']),
                'risk_level': details['risk_level'],
                'infrastructure_types': list(details['infrastructure_types']),
                'regions': list(details['regions'])
            }
        
        # Risk distribution
        risk_distribution = defaultdict(int)
        for class_name, analytics in class_analytics.items():
            risk_distribution[analytics['risk_level']] += analytics['total_assets']
        
        # Classification intelligence
        classification_intelligence = {
            'total_classified_assets': total_classified_assets,
            'risk_distribution': dict(risk_distribution),
            'highest_risk_class': max(class_analytics.keys(), key=lambda k: class_analytics[k]['total_assets']) if class_analytics and any(class_analytics[k]['risk_level'] == 'CRITICAL' for k in class_analytics) else None,
            'unclassified_risk': risk_distribution.get('UNKNOWN', 0),
            'security_priority': sorted(class_analytics.items(), key=lambda x: x[1]['total_assets'] if x[1]['risk_level'] == 'CRITICAL' else 0, reverse=True)[:5]
        }
        
        # Compliance analysis
        compliance_analysis = {
            'critical_assets': sum(d['total_assets'] for d in class_analytics.values() if d['risk_level'] == 'CRITICAL'),
            'unclassified_risk': risk_distribution.get('UNKNOWN', 0),
            'security_priority': sorted(class_analytics.items(), key=lambda x: x[1]['total_assets'], reverse=True)[:5]
        }
        
        conn.close()
        
        return jsonify({
            'classification_matrix': classification_matrix,
            'class_analytics': class_analytics,
            'total_classes': len(classification_matrix),
            'classification_intelligence': classification_intelligence,
            'risk_distribution': dict(risk_distribution),
            'compliance_analysis': compliance_analysis
        })
        
    except Exception as e:
        logger.error(f"Class metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/system_classification_metrics')
def system_classification_metrics():
    """Analyze system classification and modernization"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(system_classification_s, 'unknown') as system,
                COUNT(*) as frequency,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(business_unit_s, 'unknown') as business_unit
            FROM universal_cmdb
            GROUP BY system_classification_s, infrastructure_type_s, region_s, business_unit_s
            ORDER BY frequency DESC
        """).fetchall()
        
        system_matrix = {}
        system_analytics = defaultdict(lambda: {
            'total': 0,
            'infrastructure_types': set(),
            'regions': set(),
            'business_units': set(),
            'os_family': 'unknown',
            'version_info': [],
            'security_category': 'unknown'
        })
        
        os_distribution = defaultdict(int)
        version_analysis = defaultdict(list)
        
        for system_name, frequency, infra_type, region, bu in result:
            if system_name and system_name != 'unknown':
                system_values = parse_pipe_separated_values(system_name)
                
                for s in system_values:
                    system_matrix[s] = system_matrix.get(s, 0) + frequency
                    system_analytics[s]['total'] += frequency
                    system_analytics[s]['infrastructure_types'].add(infra_type)
                    system_analytics[s]['regions'].add(normalize_region(region))
                    system_analytics[s]['business_units'].add(bu)
                    
                    s_lower = s.lower()
                    if 'windows' in s_lower:
                        system_analytics[s]['os_family'] = 'windows'
                        os_distribution['windows'] += frequency
                        
                        # Check for version patterns
                        version_match = re.search(r'(windows)(\d+|\s+\d+|server\s*\d+)', s_lower)
                        if version_match:
                            version_analysis['windows'].append(version_match.group(0))
                    elif 'linux' in s_lower:
                        system_analytics[s]['os_family'] = 'linux'
                        os_distribution['linux'] += frequency
                        
                        version_match = re.search(r'(ubuntu|centos|rhel|debian|suse)(\d+|\s+\d+)', s_lower)
                        if version_match:
                            version_analysis['linux'].append(version_match.group(0))
                    elif 'unix' in s_lower or 'aix' in s_lower or 'solaris' in s_lower:
                        system_analytics[s]['os_family'] = 'unix'
                        os_distribution['unix'] += frequency
                    elif 'vmware' in s_lower:
                        system_analytics[s]['os_family'] = 'virtual'
                        os_distribution['virtual'] += frequency
                    else:
                        system_analytics[s]['os_family'] = 'other'
                        os_distribution['other'] += frequency
                    
                    # Determine security category based on keywords
                    if any(keyword in s_lower for keyword in ['2008', '2012', '2016', 'xp', 'vista', '7', '8']):
                        system_analytics[s]['security_category'] = 'legacy'
                    elif any(keyword in s_lower for keyword in ['2019', '2022', '10', '11', 'latest']):
                        system_analytics[s]['security_category'] = 'modern'
                    else:
                        system_analytics[s]['security_category'] = 'standard'
        
        # Security and modernization analysis
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
            'system_matrix': system_matrix,
            'system_analytics': dict(system_analytics),
            'os_distribution': dict(os_distribution),
            'version_analysis': dict(version_analysis),
            'security_distribution': dict(security_distribution),
            'total_systems': total_systems,
            'modernization_analysis': {
                'legacy_systems': modernization_candidates,
                'legacy_assets': sum(c['count'] for c in modernization_candidates),
                'modernization_priority': sorted(modernization_candidates, key=lambda x: x['count'], reverse=True)[:10],
                'modernization_percentage': round(security_distribution.get('legacy', 0) / total_systems * 100, 2) if total_systems > 0 else 0
            },
            'taxonomy_intelligence': {
                'os_diversity': len(os_distribution),
                'dominant_os': max(os_distribution, key=os_distribution.get) if os_distribution else 'unknown',
                'system_sprawl': len(system_matrix),
                'standardization_score': round(max(os_distribution.values()) / total_systems * 100, 2) if total_systems > 0 and os_distribution else 0
            }
        })
        
    except Exception as e:
        logger.error(f"System classification metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/business_unit_metrics')
def business_unit_metrics():
    """Analyze business unit security and coverage"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(business_unit_s, 'unknown') as business_unit,
                COUNT(*) as frequency,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COALESCE(present_in_cmdb_s, 'unknown') as cmdb_status,
                COALESCE(tanium_coverage_s, 'unknown') as tanium_status
            FROM universal_cmdb
            GROUP BY business_unit_s, region_s, infrastructure_type_s, present_in_cmdb_s, tanium_status
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
        
        for bu_name, frequency, region, infra_type, cmdb_status, tanium_status in result:
            if bu_name and bu_name != 'unknown':
                separators = [',', '|']
                new_units = [bu_name]
                for sep in separators:
                    temp_units = []
                    for u in new_units:
                        temp_units.extend([unit.strip() for unit in u.split(sep) if unit.strip()])
                    new_units = temp_units
                
                for unit in new_units:
                    if unit:
                        business_intelligence[unit] = business_intelligence.get(unit, 0) + frequency
                        bu_analytics[unit]['total_assets'] += frequency
                        bu_analytics[unit]['regions'].add(normalize_region(region))
                        bu_analytics[unit]['infrastructure_types'].add(infra_type)
                        
                        if 'yes' in str(cmdb_status).lower():
                            bu_analytics[unit]['cmdb_registered'] += frequency
                        
                        if 'managed' in str(tanium_status).lower():
                            bu_analytics[unit]['tanium_deployed'] += frequency
                        
                        regional_bu_distribution[normalize_region(region)][unit] += frequency
        
        # Calculate security analysis for each BU
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
        
        # Security priority analysis
        security_priority = sorted(bu_security_analysis.items(), key=lambda x: 
                                 x[1]['security_score'] if x[1]['security_status'] == 'VULNERABLE' else 0, reverse=True)[:10]
        
        # Organizational analytics
        organizational_analysis = {
            'total_assets': total_bu_assets,
            'largest_bu': max(business_intelligence, key=business_intelligence.get) if business_intelligence else 'unknown',
            'most_distributed_bu': max(bu_security_analysis.keys(), key=lambda k: bu_security_analysis[k]['geographic_spread']) if bu_security_analysis else 'unknown',
            'security_leaders': [unit for unit, data in bu_security_analysis.items() if data['security_status'] == 'SECURE'],
            'vulnerable_units': [unit for unit, data in bu_security_analysis.items() if data['security_status'] == 'VULNERABLE'],
            'organizational_analytics': {
                'total_assets': total_bu_assets
            }
        }
        
        conn.close()
        
        return jsonify({
            'business_intelligence': business_intelligence,
            'bu_security_analysis': bu_security_analysis,
            'regional_distribution': dict(regional_bu_distribution),
            'organizational_metrics': {
                'largest_bu': max(business_intelligence, key=business_intelligence.get) if business_intelligence else 'unknown',
                'organizational_analytics': organizational_analysis['organizational_analytics']
            },
            'security_leaders': organizational_analysis['security_leaders'],
            'organizational_analytics': organizational_analysis
        })
        
    except Exception as e:
        logger.error(f"Business unit metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/cio_metrics')
def cio_metrics():
    """Analyze CIO leadership and governance metrics"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(cio_s, 'unknown') as cio,
                COUNT(*) as frequency,
                COALESCE(business_unit_s, 'unknown') as business_unit,
                COALESCE(region_s, 'unknown') as region
            FROM universal_cmdb
            WHERE cio_s IS NOT NULL AND cio_s != ''
            GROUP BY cio_s, business_unit_s, region_s
            ORDER BY frequency DESC
        """).fetchall()
        
        operative_intelligence = {}
        cio_analytics = defaultdict(lambda: {
            'total_assets': 0,
            'business_units': set(),
            'regions': set(),
            'span_of_control': 0
        })
        
        for cio_name, frequency, bu, region in result:
            if cio_name and cio_name != 'unknown':
                cio_values = parse_pipe_separated_values(cio_name)
                
                for c in cio_values:
                    c = c.strip()
                    if c and re.search(r'[a-zA-Z]', c) and not c.isdigit():
                        operative_intelligence[c] = operative_intelligence.get(c, 0) + frequency
                        cio_analytics[c]['total_assets'] += frequency
                        cio_analytics[c]['business_units'].add(bu)
                        cio_analytics[c]['regions'].add(normalize_region(region))
        
        # Leadership analysis
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
        
        # Governance metrics
        governance_metrics = {
            'executive_leaders': [cio for cio, data in leadership_analysis.items() if data['leadership_tier'] == 'EXECUTIVE'],
            'senior_leaders': [cio for cio, data in leadership_analysis.items() if data['leadership_tier'] == 'SENIOR'],
            'managers': [cio for cio, data in leadership_analysis.items() if data['leadership_tier'] == 'MANAGER'],
            'largest_portfolio': max(leadership_analysis.values(), key=lambda x: x['total_assets'])['total_assets'] if leadership_analysis else 0,
            'most_distributed': max(leadership_analysis.values(), key=lambda x: x['span_of_control'])['span_of_control'] if leadership_analysis else 0,
            'average_portfolio_size': round(total_cio_assets / len(operative_intelligence), 0) if operative_intelligence else 0
        }
        
        # Executive summary
        executive_summary = {
            'top_executives': sorted(leadership_analysis.items(), key=lambda x: x[1]['total_assets'], reverse=True)[:5],
            'most_distributed_leader': sorted(leadership_analysis.items(), key=lambda x: x[1]['span_of_control'], reverse=True)[:5],
            'leadership_effectiveness': [cio for cio, data in leadership_analysis.items() if data['span_of_control'] >= 5]
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
                'average_portfolio_size': round(total_cio_assets / len(operative_intelligence), 0) if operative_intelligence else 0
            },
            'executive_summary': executive_summary
        })
        
    except Exception as e:
        logger.error(f"CIO metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tanium_coverage')
def tanium_coverage():
    """Analyze Tanium endpoint management coverage"""
    try:
        conn = get_db_connection()
        
        # Query Tanium coverage data
        result = conn.execute("""
            SELECT 
                CASE 
                    WHEN LOWER(COALESCE(tanium_coverage_s, '')) LIKE '%tanium%' THEN 'deployed'
                    WHEN LOWER(COALESCE(tanium_coverage_s, '')) LIKE '%managed%' THEN 'deployed'
                    ELSE 'not_deployed'
                END as status,
                COUNT(*) as count,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COALESCE(business_unit_s, 'unknown') as business_unit
            FROM universal_cmdb
            GROUP BY 
                CASE 
                    WHEN LOWER(COALESCE(tanium_coverage_s, '')) LIKE '%tanium%' THEN 'deployed'
                    WHEN LOWER(COALESCE(tanium_coverage_s, '')) LIKE '%managed%' THEN 'deployed'
                    ELSE 'not_deployed'
                END,
                region_s, infrastructure_type_s, business_unit_s
            ORDER BY frequency DESC
        """).fetchall()
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        tanium_count = 0
        
        regional_coverage = defaultdict(lambda: {'deployed': 0, 'total': 0})
        infrastructure_coverage = defaultdict(lambda: {'deployed': 0, 'total': 0})  
        bu_coverage = defaultdict(lambda: {'deployed': 0, 'total': 0})
        status_breakdown = {'deployed': 0, 'not_deployed': 0}
        
        for status, count, region, infra_type, bu in result:
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
        
        # Regional analysis
        regional_analysis = {}
        for region, data in regional_coverage.items():
            coverage_pct = (data['deployed'] / data['total'] * 100) if data['total'] > 0 else 0
            regional_analysis[region] = {
                'deployed': data['deployed'],
                'total': data['total'],
                'coverage_percentage': round(coverage_pct, 2),
                'priority': 'HIGH' if coverage_pct < 50 else 'MEDIUM' if coverage_pct < 80 else 'LOW'
            }
        
        # Infrastructure analysis
        infrastructure_analysis = {}
        for infra_type, data in infrastructure_coverage.items():
            coverage_pct = (data['deployed'] / data['total'] * 100) if data['total'] > 0 else 0
            infrastructure_analysis[infra_type] = {
                'deployed': data['deployed'],
                'total': data['total'],
                'coverage_percentage': round(coverage_pct, 2),
                'priority': 'HIGH' if coverage_pct < 50 else 'MEDIUM' if coverage_pct < 80 else 'LOW'
            }
        
        # BU analysis
        bu_analysis = {}
        for bu, data in bu_coverage.items():
            coverage_pct = (data['deployed'] / data['total'] * 100) if data['total'] > 0 else 0
            bu_analysis[bu] = {
                'deployed': data['deployed'],
                'total': data['total'],
                'coverage_percentage': round(coverage_pct, 2),
                'risk_level': 'CRITICAL' if coverage_pct < 40 else 'HIGH' if coverage_pct < 70 else 'LOW'
            }
        
        # Deployment gaps
        deployment_gaps = {
            'unprotected_regions': [r for r, d in regional_analysis.items() if d['priority'] == 'CRITICAL'],
            'high_risk_infrastructure': [i for i, d in infrastructure_analysis.items() if d['priority'] == 'HIGH'],
            'vulnerable_business_units': [b for b, d in bu_analysis.items() if d['risk_level'] == 'CRITICAL'],
            'total_unprotected_assets': total_count - tanium_count
        }
        
        # Deployment recommendations
        deployment_recommendations = []
        for region, data in regional_analysis.items():
            if data['priority'] == 'HIGH':
                deployment_recommendations.append({
                    'type': 'regional',
                    'target': region,
                    'priority': 'HIGH',
                    'assets': data['total'] - data['deployed'],
                    'current_compliance': data['coverage_percentage'],
                    'target_compliance': 90
                })
        
        # Coverage status determination
        coverage_status = 'OPTIMAL' if coverage_percentage >= 80 else 'ACCEPTABLE' if coverage_percentage >= 60 else 'CRITICAL'
        
        conn.close()
        
        return jsonify({
            'tanium_deployed': tanium_count,
            'total_assets': total_count,
            'coverage_percentage': round(coverage_percentage, 2),
            'status_breakdown': status_breakdown,
            'regional_coverage': dict(regional_analysis),
            'infrastructure_coverage': dict(infrastructure_analysis),
            'business_unit_coverage': dict(bu_analysis),
            'deployment_gaps': deployment_gaps,
            'deployment_recommendations': deployment_recommendations,
            'deployment_analysis': {
                'coverage_status': coverage_status,
                'deployment_gap': total_count - tanium_count,
                'recommended_action': 'MAINTAIN' if coverage_percentage >= 80 else 'EXPAND' if coverage_percentage >= 60 else 'URGENT_DEPLOY',
                'security_risk_level': 'LOW' if coverage_percentage >= 80 else 'MEDIUM' if coverage_percentage >= 60 else 'HIGH'
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
    """Analyze CMDB registration and presence metrics"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                CASE 
                    WHEN LOWER(COALESCE(present_in_cmdb_s, '')) LIKE '%yes%' THEN 'registered'
                    ELSE 'not_registered'
                END as status,
                COUNT(*) as count,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type, 
                COALESCE(business_unit_s, 'unknown') as business_unit,
                COALESCE(data_center_s, 'unknown') as data_center
            FROM universal_cmdb
            GROUP BY 
                CASE 
                    WHEN LOWER(COALESCE(present_in_cmdb_s, '')) LIKE '%yes%' THEN 'registered'
                    ELSE 'not_registered'
                END,
                region_s, infrastructure_type_s, business_unit_s, data_center_s
            ORDER BY count DESC
        """).fetchall()
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        yes_count = 0
        
        regional_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        infrastructure_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        datacenter_presence = defaultdict(lambda: {'registered': 0, 'total': 0})
        status_breakdown = {'registered': 0, 'not_registered': 0}
        
        for status, count, region, infra_type, bu, dc in result:
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
            
            if dc != 'unknown':
                first_word = str(dc).split()[0] if str(dc).split() else str(dc)
                facility_intelligence[first_word] = facility_intelligence.get(first_word, 0) + frequency
                
                if status == 'registered':
                    datacenter_presence[first_word]['registered'] += count
                datacenter_presence[first_word]['total'] += count
        
        registration_rate = (yes_count / total_count * 100) if total_count > 0 else 0
        
        # Regional compliance
        regional_compliance = {}
        for region, data in regional_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            regional_compliance[region] = {
                'registered': data['registered'],
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'status': 'COMPLIANT' if compliance_pct >= 90 else 'PARTIAL' if compliance_pct >= 70 else 'NON_COMPLIANT'
            }
        
        # Infrastructure compliance  
        infrastructure_compliance = {}
        for infra_type, data in infrastructure_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            infrastructure_compliance[infra_type] = {
                'registered': data['registered'],
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'priority': 'URGENT' if compliance_pct < 60 else 'HIGH' if compliance_pct < 80 else 'MEDIUM'
            }
        
        # Data center compliance
        datacenter_compliance = {}
        for dc, data in datacenter_presence.items():
            compliance_pct = (data['registered'] / data['total'] * 100) if data['total'] > 0 else 0
            datacenter_compliance[dc] = {
                'registered': data['registered'], 
                'total': data['total'],
                'compliance_percentage': round(compliance_pct, 2),
                'facility_status': 'MANAGED' if compliance_pct >= 90 else 'UNMANAGED'
            }
        
        # Compliance gaps
        compliance_gaps = {
            'non_compliant_regions': [r for r, d in regional_compliance.items() if d['status'] == 'NON_COMPLIANT'],
            'urgent_infrastructure': [i for i, d in infrastructure_compliance.items() if d['priority'] == 'URGENT'],
            'unmanaged_datacenters': [dc for dc, d in datacenter_compliance.items() if d['facility_status'] == 'UNMANAGED'],
            'total_unregistered_assets': total_count - yes_count
        }
        
        # Improvement recommendations
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
        
        # Compliance analysis
        compliance_status = 'COMPLIANT' if registration_rate >= 90 else 'PARTIAL_COMPLIANCE' if registration_rate >= 70 else 'NON_COMPLIANT'
        
        conn.close()
        
        return jsonify({
            'cmdb_registered': yes_count,
            'total_assets': total_count,
            'registration_rate': round(registration_rate, 2),
            'status_breakdown': status_breakdown,
            'regional_compliance': dict(regional_compliance),
            'infrastructure_compliance': dict(infrastructure_compliance),
            'datacenter_compliance': dict(datacenter_compliance),
            'compliance_gaps': compliance_gaps,
            'improvement_recommendations': improvement_recommendations,
            'compliance_analysis': {
                'compliance_status': compliance_status,
                'improvement_needed': max(0, round(90 - registration_rate, 2)),
                'governance_maturity': 'MATURE' if registration_rate >= 95 else 'DEVELOPING' if registration_rate >= 85 else 'IMMATURE',
                'audit_readiness': {
                    'audit_score': round(registration_rate, 0),
                    'compliant_regions': len([r for r, d in regional_compliance.items() if d['status'] == 'COMPLIANT']),
                    'managed_facilities': len([dc for dc, d in datacenter_compliance.items() if d['facility_status'] == 'MANAGED']),
                    'governance_excellence': len([bu for bu, d in bu_compliance.items() if d['governance_status'] == 'EXCELLENT']) if 'bu_compliance' in locals() else 0
                }
            }
        })
        
    except Exception as e:
        logger.error(f"CMDB presence error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/host_search')
def host_search():
    """Search hosts with advanced filtering capabilities"""
    try:
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term required'}), 400
        
        conn = get_db_connection()
        
        # Build comprehensive search queries
        search_queries = [
            """
            SELECT 
                COALESCE(host_s, 'unknown') as host,
                COALESCE(region_s, 'unknown') as region,
                COALESCE(country_s, 'unknown') as country,
                COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
                COALESCE(source_tables_s, 'none') as source_tables,
                COALESCE(domain_s, 'none') as domain,
                COALESCE(data_center_s, 'unknown') as data_center,
                COALESCE(present_in_cmdb_s, 'unknown') as present_in_cmdb,
                COALESCE(tanium_coverage_s, 'unknown') as tanium_coverage,
                COALESCE(business_unit_s, 'unknown') as business_unit,
                COALESCE(system_classification_s, 'unknown') as system,
                COALESCE(class_s, 'unknown') as class
            FROM universal_cmdb
            WHERE LOWER(COALESCE(host_s, '')) LIKE LOWER(?)
            ORDER BY host_s
            LIMIT 500
            """
        ]
        
        result = None
        search_pattern = f'%{search_term}%'
        
        for i, query in enumerate(search_queries):
            try:
                if i == 0:
                    result = conn.execute(query, [search_pattern, search_pattern, search_pattern]).fetchall()
                else:
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
        
        # Search analytics
        search_analytics = {
            'regions': list(set([h['region'] for h in hosts if h['region'] != 'unknown'])),
            'countries': list(set([h['country'] for h in hosts if h['country'] != 'unknown'])),
            'infrastructure_types': list(set([h['infrastructure_type'] for h in hosts if h['infrastructure_type'] != 'unknown'])),
            'business_units': list(set([h['business_unit'] for h in hosts if h['business_unit'] != 'unknown'])),
            'data_centers': list(set([h['data_center'] for h in hosts if h['data_center'] != 'unknown'])),
            'cmdb_registered': len([h for h in hosts if 'yes' in str(h['present_in_cmdb']).lower()]),
            'tanium_deployed': len([h for h in hosts if 'tanium' in str(h['tanium_coverage']).lower()]),
            'security_coverage': 0
        }
        
        search_analytics['security_coverage'] = round(
            (search_analytics['cmdb_registered'] + search_analytics['tanium_deployed']) / 
            (len(hosts) * 2) * 100, 2
        ) if hosts else 0
        
        # Search scope
        search_scope = {
            'searched_fields': ['host', 'source_tables', 'domain'] if len(search_queries) > 1 else ['host'],
            'result_limit': 100,
            'total_matches': len(hosts)
        }
        
        conn.close()
        
        return jsonify({
            'hosts': hosts,
            'total_found': len(hosts),
            'search_term': search_term,
            'search_summary': search_analytics,
            'drill_down_available': len(hosts) > 100,
            'search_scope': search_scope
        })
        
    except Exception as e:
        logger.error(f"Host search error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/advanced_analytics')
def advanced_analytics():
    """Perform advanced correlation and predictive analytics"""
    try:
        conn = get_db_connection()
        
        correlation_query = """
        SELECT 
            COALESCE(region_s, 'unknown') as region,
            COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
            COUNT(*) as asset_count,
            SUM(CASE WHEN LOWER(COALESCE(present_in_cmdb_s, '')) LIKE '%yes%' THEN 1 ELSE 0 END) as cmdb_registered,
            SUM(CASE WHEN LOWER(COALESCE(tanium_coverage_s, '')) LIKE '%tanium%' THEN 1 ELSE 0 END) as tanium_deployed,
            COUNT(DISTINCT COALESCE(business_unit_s, 'unknown')) as unique_business_units,
            COUNT(DISTINCT COALESCE(data_center_s, 'unknown')) as unique_datacenters
        FROM universal_cmdb
        GROUP BY region_s, infrastructure_type_s
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
        
        # Trend analysis
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
        
        # Predictive insights
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
                'assets_at_risk': sum(item['asset_count'] for item in high_risk_combinations),
                'projected_incidents': round(sum(item['asset_count'] for item in high_risk_combinations) * 0.1, 0)
            }
        }
        
        conn.close()
        
        return jsonify({
            'correlation_analysis': correlation_analysis,
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
        
        logger.info(f"✅ Database connection successful!")
        logger.info(f"Location: universal_cmdb.db")
        logger.info(f"Found {row_count:,} rows with {len(columns)} columns")
        logger.info(f"🚀 Starting Flask server on http://localhost:5000")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        print(f"Please ensure your 'universal_cmdb.db' file exists in the project directory")
        sys.exit(1)
    
    app.run(debug=True, host='0.0.0.0', port=5000)