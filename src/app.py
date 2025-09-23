from flask import Flask, jsonify, request
from flask_cors import CORS
import duckdb
import os
import sys
import logging
from datetime import datetime, timedelta
from collections import Counter, defaultdict
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def get_db_connection():
    """Get database connection with multiple fallback paths"""
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
                
                # Verify table exists and has data
                tables = conn.execute("SHOW TABLES").fetchall()
                if any('universal_cmdb' in str(table).lower() for table in tables):
                    logger.info(f"Successfully connected to DuckDB: {db_path}")
                    return conn
                else:
                    conn.close()
                    
        except Exception as e:
            logger.warning(f"Failed to connect to {db_path}: {e}")
            continue
    
    raise Exception("Database file 'universal_cmdb.db' not found!")

def verify_table_structure(conn):
    """Verify and return table structure"""
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

# Country and region mapping dictionaries
COUNTRY_MAPPING = {
    'us': 'united states', 'usa': 'united states', 'america': 'united states',
    'uk': 'united kingdom', 'gb': 'united kingdom', 'britain': 'united kingdom',
    'de': 'germany', 'deu': 'germany', 'fr': 'france', 'fra': 'france',
    'it': 'italy', 'ita': 'italy', 'es': 'spain', 'esp': 'spain',
    'ca': 'canada', 'can': 'canada', 'mx': 'mexico', 'mex': 'mexico',
    'jp': 'japan', 'jpn': 'japan', 'cn': 'china', 'chn': 'china',
    'kr': 'south korea', 'kor': 'south korea', 'in': 'india', 'ind': 'india',
    'au': 'australia', 'aus': 'australia', 'nz': 'new zealand',
    'br': 'brazil', 'bra': 'brazil', 'ar': 'argentina', 'arg': 'argentina',
    'sg': 'singapore', 'sgp': 'singapore', 'my': 'malaysia', 'mal': 'malaysia'
}

REGION_MAPPING = {
    'na': 'north america', 'emea': 'emea', 'eu': 'europe', 'apac': 'apac',
    'latam': 'latam', 'south america': 'latam', 'central america': 'latam',
    'north america': 'north america', 'europe': 'emea', 'middle east': 'emea',
    'africa': 'emea', 'asia': 'apac', 'pacific': 'apac', 'asia pacific': 'apac'
}

def normalize_country(country):
    """Normalize country names"""
    if not country or str(country).lower() in ['null', 'none', 'unknown', '']:
        return 'unknown'
    return COUNTRY_MAPPING.get(str(country).lower().strip(), str(country).lower())

def normalize_region(region):
    """Normalize region names"""
    if not region or str(region).lower() in ['null', 'none', 'unknown', '']:
        return 'unknown'
    return REGION_MAPPING.get(str(region).lower().strip(), str(region).lower())

def calculate_security_score(cmdb_pct, tanium_pct):
    """Calculate combined security score"""
    if cmdb_pct == 0 and tanium_pct == 0:
        return 0
    return round((cmdb_pct + tanium_pct) / 2, 2)

@app.route('/api/database_status')
def database_status():
    """Get database connection status and basic info"""
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

@app.route('/api/cmdb_presence')
def cmdb_presence():
    """CMDB registration analysis using actual column names"""
    try:
        conn = get_db_connection()
        
        # Count total records and registered records
        total_query = "SELECT COUNT(*) FROM universal_cmdb"
        total_count = conn.execute(total_query).fetchone()[0]
        
        # Count CMDB registered (present_in_cmdb_s = 'yes')
        registered_query = """
        SELECT COUNT(*) FROM universal_cmdb 
        WHERE LOWER(present_in_cmdb_s) = 'yes'
        """
        registered_count = conn.execute(registered_query).fetchone()[0]
        
        registration_rate = (registered_count / total_count * 100) if total_count > 0 else 0
        
        # Regional breakdown
        regional_query = """
        SELECT 
            COALESCE(region_s, 'unknown') as region,
            COUNT(*) as total,
            SUM(CASE WHEN LOWER(present_in_cmdb_s) = 'yes' THEN 1 ELSE 0 END) as registered
        FROM universal_cmdb
        GROUP BY region_s
        ORDER BY total DESC
        """
        
        regional_results = conn.execute(regional_query).fetchall()
        regional_compliance = {}
        
        for region, total, registered in regional_results:
            normalized_region = normalize_region(region)
            compliance_pct = (registered / total * 100) if total > 0 else 0
            status = 'EXCELLENT' if compliance_pct >= 95 else 'GOOD' if compliance_pct >= 85 else 'POOR'
            
            regional_compliance[normalized_region] = {
                'registered': registered,
                'total': total,
                'compliance_percentage': round(compliance_pct, 2),
                'governance_status': status
            }
        
        # Compliance status
        compliance_status = 'COMPLIANT' if registration_rate >= 90 else 'PARTIAL_COMPLIANCE' if registration_rate >= 70 else 'NON_COMPLIANT'
        
        conn.close()
        
        return jsonify({
            'cmdb_registered': registered_count,
            'total_assets': total_count,
            'registration_rate': round(registration_rate, 2),
            'status_breakdown': {'registered': registered_count, 'not_registered': total_count - registered_count},
            'regional_compliance': regional_compliance,
            'compliance_analysis': {
                'compliance_status': compliance_status,
                'improvement_needed': max(0, 90 - registration_rate),
                'governance_maturity': 'MATURE' if registration_rate >= 95 else 'DEVELOPING' if registration_rate >= 85 else 'IMMATURE'
            }
        })
        
    except Exception as e:
        logger.error(f"CMDB presence error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/infrastructure_type')
def infrastructure_type_metrics():
    """Analyze infrastructure types using actual column names"""
    try:
        conn = get_db_connection()
        
        query = """
        SELECT 
            COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
            COUNT(*) as frequency,
            COALESCE(region_s, 'unknown') as region
        FROM universal_cmdb
        GROUP BY infrastructure_type_s, region_s
        ORDER BY frequency DESC
        """
        
        result = conn.execute(query).fetchall()
        conn.close()
        
        if not result:
            return jsonify({'error': 'No infrastructure type data found'}), 500
        
        # Process data
        infrastructure_matrix = defaultdict(int)
        infrastructure_by_region = defaultdict(lambda: defaultdict(int))
        total_count = sum(row[1] for row in result)
        
        for infra_type, frequency, region in result:
            normalized_region = normalize_region(region)
            infrastructure_matrix[infra_type] += frequency
            infrastructure_by_region[normalized_region][infra_type] += frequency
        
        detailed_data = []
        for infra_type, frequency in infrastructure_matrix.items():
            percentage = round(frequency / total_count * 100, 2) if total_count > 0 else 0
            threat_level = 'CRITICAL' if percentage > 40 else 'HIGH' if percentage > 25 else 'MEDIUM' if percentage > 10 else 'LOW'
            
            detailed_data.append({
                'type': infra_type,
                'frequency': frequency,
                'percentage': percentage,
                'threat_level': threat_level
            })
        
        detailed_data.sort(key=lambda x: x['frequency'], reverse=True)
        
        # Calculate modernization score
        modernization_score = 0
        legacy_keywords = ['legacy', 'mainframe', 'unix', 'solaris', 'physical']
        cloud_keywords = ['cloud', 'saas', 'paas', 'aws', 'azure', 'gcp', 'kubernetes']
        
        for item in detailed_data:
            if any(keyword in item['type'].lower() for keyword in cloud_keywords):
                modernization_score += item['percentage']
            elif any(keyword in item['type'].lower() for keyword in legacy_keywords):
                modernization_score -= item['percentage'] * 0.5
        
        modernization_percentage = max(0, min(100, modernization_score))
        
        return jsonify({
            'infrastructure_matrix': dict(infrastructure_matrix),
            'detailed_data': detailed_data,
            'regional_analysis': dict(infrastructure_by_region),
            'total_instances': total_count,
            'modernization_analysis': {
                'modernization_score': round(modernization_score, 2),
                'modernization_percentage': round(modernization_percentage, 2),
                'legacy_systems': [item for item in detailed_data if any(k in item['type'].lower() for k in legacy_keywords)],
                'cloud_adoption': [item for item in detailed_data if any(k in item['type'].lower() for k in cloud_keywords)]
            }
        })
        
    except Exception as e:
        logger.error(f"Infrastructure type error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/region_metrics')
def region_metrics():
    """Comprehensive regional analysis using actual column names"""
    try:
        conn = get_db_connection()
        
        query = """
        SELECT 
            COALESCE(region_s, 'unknown') as region,
            COUNT(*) as frequency,
            COALESCE(infrastructure_type_s, 'unknown') as infrastructure_type,
            COALESCE(present_in_cmdb_s, 'unknown') as cmdb_status,
            COALESCE(tanium_coverage_s, 'unknown') as tanium_status
        FROM universal_cmdb
        GROUP BY region_s, infrastructure_type_s, present_in_cmdb_s, tanium_coverage_s
        ORDER BY frequency DESC
        """
        
        result = conn.execute(query).fetchall()
        conn.close()
        
        if not result:
            return jsonify({'error': 'No regional data found'}), 500
        
        # Process regional data
        region_counter = defaultdict(int)
        region_details = defaultdict(lambda: {
            'total_assets': 0,
            'infrastructure_types': defaultdict(int),
            'cmdb_registered': 0,
            'tanium_deployed': 0
        })
        
        for region, frequency, infra_type, cmdb_status, tanium_status in result:
            normalized_region = normalize_region(region)
            region_counter[normalized_region] += frequency
            
            details = region_details[normalized_region]
            details['total_assets'] += frequency
            details['infrastructure_types'][infra_type] += frequency
            
            if str(cmdb_status).lower() == 'yes':
                details['cmdb_registered'] += frequency
            if str(tanium_status).lower() in ['managed', 'deployed']:
                details['tanium_deployed'] += frequency
        
        # Calculate analytics
        regional_analytics = []
        for region, count in region_counter.items():
            details = region_details[region]
            total_assets = details['total_assets']
            
            cmdb_percentage = round((details['cmdb_registered'] / total_assets * 100), 2) if total_assets > 0 else 0
            tanium_percentage = round((details['tanium_deployed'] / total_assets * 100), 2) if total_assets > 0 else 0
            security_score = calculate_security_score(cmdb_percentage, tanium_percentage)
            
            risk_category = 'HIGH' if security_score < 40 else 'MEDIUM' if security_score < 70 else 'LOW'
            
            regional_analytics.append({
                'region': region,
                'count': count,
                'percentage': round(count / sum(region_counter.values()) * 100, 2),
                'cmdb_coverage': cmdb_percentage,
                'tanium_coverage': tanium_percentage,
                'security_score': security_score,
                'risk_category': risk_category,
                'infrastructure_diversity': len(details['infrastructure_types']),
                'infrastructure_types': list(details['infrastructure_types'].keys())
            })
        
        regional_analytics.sort(key=lambda x: x['count'], reverse=True)
        
        # Threat assessment
        threat_intelligence = {
            'highest_risk_region': min(regional_analytics, key=lambda x: x['security_score'])['region'] if regional_analytics else 'unknown',
            'most_secure_region': max(regional_analytics, key=lambda x: x['security_score'])['region'] if regional_analytics else 'unknown',
            'geographic_balance': max(regional_analytics, key=lambda x: x['percentage'])['percentage'] - min(regional_analytics, key=lambda x: x['percentage'])['percentage'] if regional_analytics else 0
        }
        
        return jsonify({
            'global_surveillance': region_counter,
            'region_details': regional_analytics,
            'regional_analytics': regional_analytics,
            'regional_infrastructure': dict(region_details),
            'threat_intelligence': threat_intelligence
        })
        
    except Exception as e:
        logger.error(f"Region metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/country_metrics')
def country_metrics():
    """Country-level intelligence analysis using actual column names"""
    try:
        conn = get_db_connection()
        
        query = """
        SELECT 
            COALESCE(country_s, 'unknown') as country,
            COUNT(*) as frequency,
            COALESCE(region_s, 'unknown') as region,
            COALESCE(present_in_cmdb_s, 'unknown') as cmdb_status,
            COALESCE(tanium_coverage_s, 'unknown') as tanium_status
        FROM universal_cmdb
        GROUP BY country_s, region_s, present_in_cmdb_s, tanium_coverage_s
        ORDER BY frequency DESC
        """
        
        result = conn.execute(query).fetchall()
        conn.close()
        
        country_counter = Counter()
        country_regional_map = {}
        country_security_scores = {}
        
        for country, frequency, region, cmdb_status, tanium_status in result:
            normalized_country = normalize_country(country)
            normalized_region = normalize_region(region)
            
            country_counter[normalized_country] += frequency
            country_regional_map[normalized_country] = normalized_region
            
            # Initialize if not exists
            if normalized_country not in country_security_scores:
                country_security_scores[normalized_country] = {'cmdb': 0, 'tanium': 0, 'total': 0}
            
            country_security_scores[normalized_country]['total'] += frequency
            if str(cmdb_status).lower() == 'yes':
                country_security_scores[normalized_country]['cmdb'] += frequency
            if str(tanium_status).lower() in ['managed', 'deployed']:
                country_security_scores[normalized_country]['tanium'] += frequency
        
        # Calculate country analysis
        country_analysis = []
        total_assets = sum(country_counter.values())
        
        for country, count in country_counter.most_common():
            security_data = country_security_scores.get(country, {'cmdb': 0, 'tanium': 0, 'total': count})
            
            cmdb_coverage = (security_data['cmdb'] / security_data['total'] * 100) if security_data['total'] > 0 else 0
            tanium_coverage = (security_data['tanium'] / security_data['total'] * 100) if security_data['total'] > 0 else 0
            overall_security = calculate_security_score(cmdb_coverage, tanium_coverage)
            
            threat_level = 'CRITICAL' if overall_security < 25 else 'HIGH' if overall_security < 50 else 'MEDIUM' if overall_security < 75 else 'LOW'
            
            country_analysis.append({
                'country': country,
                'count': count,
                'percentage': round(count / total_assets * 100, 2),
                'region': country_regional_map.get(country, 'unknown'),
                'security_score': round(overall_security, 2),
                'threat_level': threat_level
            })
        
        # Threat intelligence
        threat_intelligence = {
            'highest_threat_countries': [c for c in country_analysis if c['threat_level'] == 'CRITICAL'][:5],
            'most_secure_countries': [c for c in country_analysis if c['threat_level'] == 'LOW'][:5],
            'geographic_concentration': country_analysis[0]['percentage'] if country_analysis else 0,
            'countries_at_risk': len([c for c in country_analysis if c['threat_level'] in ['CRITICAL', 'HIGH']])
        }
        
        return jsonify({
            'total_countries': len(country_counter),
            'country_analysis': country_analysis,
            'country_distribution': dict(country_counter.most_common()),
            'threat_intelligence': threat_intelligence
        })
        
    except Exception as e:
        logger.error(f"Country metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/security_control_coverage')
def security_control_coverage():
    """Security control coverage analysis using actual column names"""
    try:
        conn = get_db_connection()
        
        # Total hosts
        total_hosts = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        
        # EDR Coverage (edr_coverage_s)
        edr_query = """
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN edr_coverage_s IN ('sentinelone', 'crowdstrike', 'defender') THEN 1 ELSE 0 END) as protected
        FROM universal_cmdb
        """
        edr_result = conn.execute(edr_query).fetchone()
        edr_coverage = (edr_result[1] / edr_result[0] * 100) if edr_result[0] > 0 else 0
        edr_status = 'GOOD' if edr_coverage > 70 else 'WARNING' if edr_coverage > 40 else 'CRITICAL'
        
        # Tanium Coverage (tanium_coverage_s)
        tanium_query = """
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN tanium_coverage_s = 'managed' THEN 1 ELSE 0 END) as managed
        FROM universal_cmdb
        """
        tanium_result = conn.execute(tanium_query).fetchone()
        tanium_coverage = (tanium_result[1] / tanium_result[0] * 100) if tanium_result[0] > 0 else 0
        tanium_status = 'GOOD' if tanium_coverage > 70 else 'WARNING' if tanium_coverage > 40 else 'CRITICAL'
        
        # DLP Coverage (dlp_agent_coverage_s)
        dlp_query = """
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN dlp_agent_coverage_s IN ('forcepoint', 'symantec', 'mcafee') THEN 1 ELSE 0 END) as protected
        FROM universal_cmdb
        """
        dlp_result = conn.execute(dlp_query).fetchone()
        dlp_coverage = (dlp_result[1] / dlp_result[0] * 100) if dlp_result[0] > 0 else 0
        dlp_status = 'GOOD' if dlp_coverage > 70 else 'WARNING' if dlp_coverage > 40 else 'CRITICAL'
        
        # All controls coverage
        all_controls_query = """
        SELECT 
            COUNT(*) as total,
            SUM(CASE 
                WHEN edr_coverage_s IN ('sentinelone', 'crowdstrike', 'defender')
                AND tanium_coverage_s = 'managed'
                AND dlp_agent_coverage_s IN ('forcepoint', 'symantec', 'mcafee')
                THEN 1 ELSE 0 
            END) as fully_protected
        FROM universal_cmdb
        """
        all_result = conn.execute(all_controls_query).fetchone()
        all_coverage = (all_result[1] / all_result[0] * 100) if all_result[0] > 0 else 0
        all_status = 'GOOD' if all_coverage > 50 else 'WARNING' if all_coverage > 25 else 'CRITICAL'
        
        conn.close()
        
        return jsonify({
            'total_hosts': total_hosts,
            'edr_coverage': {
                'coverage_percentage': round(edr_coverage, 2),
                'protected_hosts': edr_result[1],
                'status': edr_status
            },
            'tanium_coverage': {
                'coverage_percentage': round(tanium_coverage, 2),
                'managed_hosts': tanium_result[1],
                'status': tanium_status
            },
            'dlp_coverage': {
                'coverage_percentage': round(dlp_coverage, 2),
                'protected_hosts': dlp_result[1],
                'status': dlp_status
            },
            'all_controls_coverage': {
                'coverage_percentage': round(all_coverage, 2),
                'fully_protected_hosts': all_result[1],
                'status': all_status
            }
        })
        
    except Exception as e:
        logger.error(f"Security control coverage error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/host_search')
def host_search():
    """Enhanced host search functionality using actual column names"""
    search_term = request.args.get('q', '')
    if not search_term:
        return jsonify({'error': 'Search term required'}), 400
    
    try:
        conn = get_db_connection()
        
        # Build search query with actual column names
        search_query = f"""
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
        WHERE LOWER(COALESCE(host_s, '')) LIKE LOWER('%{search_term}%')
           OR LOWER(COALESCE(source_tables_s, '')) LIKE LOWER('%{search_term}%')
           OR LOWER(COALESCE(domain_s, '')) LIKE LOWER('%{search_term}%')
        ORDER BY host_s
        LIMIT 500
        """
        
        result = conn.execute(search_query).fetchall()
        conn.close()
        
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
                'system': row[10],
                'class': row[11]
            }
            hosts.append(host_data)
        
        # Calculate search analytics
        search_analytics = {
            'regions': list(set([h['region'] for h in hosts if h['region'] != 'unknown'])),
            'countries': list(set([h['country'] for h in hosts if h['country'] != 'unknown'])),
            'infrastructure_types': list(set([h['infrastructure_type'] for h in hosts if h['infrastructure_type'] != 'unknown'])),
            'business_units': list(set([h['business_unit'] for h in hosts if h['business_unit'] != 'unknown'])),
            'data_centers': list(set([h['data_center'] for h in hosts if h['data_center'] != 'unknown'])),
            'cmdb_registered': len([h for h in hosts if 'yes' in str(h['present_in_cmdb']).lower()]),
            'tanium_deployed': len([h for h in hosts if h['tanium_coverage'] == 'managed']),
            'security_coverage': 0
        }
        
        if hosts:
            search_analytics['security_coverage'] = round(
                (search_analytics['cmdb_registered'] + search_analytics['tanium_deployed']) / (2 * len(hosts)) * 100, 2
            )
        
        return jsonify({
            'hosts': hosts,
            'total_found': len(hosts),
            'search_term': search_term,
            'search_summary': search_analytics,
            'drill_down_available': len(hosts) > 100,
            'search_scope': {
                'searched_fields': ['host_s', 'source_tables_s', 'domain_s'],
                'result_limit': 500,
                'total_matches': len(hosts)
            }
        })
        
    except Exception as e:
        logger.error(f"Host search error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    try:
        conn = get_db_connection()
        columns, row_count = verify_table_structure(conn)
        conn.close()
        logger.info(f"✅ Database connection successful! Found {row_count} rows with {len(columns)} columns.")
        print(f"🚀 Starting Flask server on http://localhost:5000")
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        print(f"⚠️  Please ensure your 'universal_cmdb.db' file exists in the project directory")
        
    app.run(debug=True, host='0.0.0.0', port=5000)