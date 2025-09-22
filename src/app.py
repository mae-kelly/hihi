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
        'us': 'united states', 'usa': 'united states',
        'uk': 'united kingdom', 'gb': 'united kingdom',
        'de': 'germany', 'jp': 'japan', 'cn': 'china',
        'fr': 'france', 'ca': 'canada', 'au': 'australia',
        'in': 'india', 'br': 'brazil', 'mx': 'mexico'
    }
    
    country_lower = country.lower().strip()
    return country_mapping.get(country_lower, country_lower)

def normalize_region(region):
    """Normalize region names to standard format"""
    if not region:
        return 'unknown'
    
    region_lower = region.lower().strip()
    return region_lower

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
        
        # Fixed query with proper UNNEST syntax
        result = conn.execute("""
            SELECT 
                TRIM(value) as source_table,
                COUNT(*) as frequency,
                COUNT(DISTINCT host_s) as unique_hosts
            FROM (
                SELECT host_s, UNNEST(STRING_SPLIT(source_tables_s, ',')) as value
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
        domain_details = {}
        
        for domain, frequency, unique_hosts in result:
            if domain and domain != 'unknown':
                domain_counter[domain] += frequency
                domain_details[domain] = {
                    'count': frequency,
                    'unique_hosts': unique_hosts,
                    'percentage': 0  # Will calculate after
                }
        
        total_analyzed = sum(domain_counter.values())
        
        # Calculate percentages
        for domain, details in domain_details.items():
            details['percentage'] = round((details['count'] / total_analyzed * 100) if total_analyzed > 0 else 0, 2)
        
        conn.close()
        
        return jsonify({
            'domain_analysis': dict(domain_counter),
            'domain_details': domain_details,
            'unique_domains': list(domain_counter.keys()),
            'total_analyzed': total_analyzed,
            'domain_distribution': {
                'tdc_percentage': sum(d['percentage'] for k, d in domain_details.items() if 'tdc' in k.lower()),
                'lead_percentage': sum(d['percentage'] for k, d in domain_details.items() if 'lead' in k.lower()),
                'other_percentage': sum(d['percentage'] for k, d in domain_details.items() if 'tdc' not in k.lower() and 'lead' not in k.lower())
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
                COUNT(*) as frequency
            FROM universal_cmdb
            GROUP BY infrastructure_type_s
            ORDER BY frequency DESC
        """).fetchall()
        
        infrastructure_matrix = {}
        total_count = 0
        
        for infra_type, frequency in result:
            infrastructure_matrix[infra_type] = frequency
            total_count += frequency
        
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
        modernization_score = sum(item['frequency'] for item in detailed_data if 'cloud' in item['type'].lower() or 'container' in item['type'].lower() or 'kubernetes' in item['type'].lower())
        modernization_percentage = (modernization_score / total_count * 100) if total_count > 0 else 0
        
        conn.close()
        
        return jsonify({
            'infrastructure_matrix': infrastructure_matrix,
            'detailed_data': detailed_data,
            'total_types': len(infrastructure_matrix),
            'modernization_analysis': {
                'modernization_score': modernization_score,
                'modernization_percentage': round(modernization_percentage, 2),
                'legacy_systems': [item for item in detailed_data if 'physical' in item['type'].lower() or 'vmware' in item['type'].lower()],
                'cloud_adoption': [item for item in detailed_data if 'cloud' in item['type'].lower() or 'aws' in item['type'].lower() or 'azure' in item['type'].lower() or 'gcp' in item['type'].lower()]
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
                SUM(CASE WHEN LOWER(present_in_cmdb_s) = 'yes' THEN 1 ELSE 0 END) as cmdb_registered,
                SUM(CASE WHEN LOWER(tanium_coverage_s) = 'managed' THEN 1 ELSE 0 END) as tanium_deployed
            FROM universal_cmdb
            GROUP BY region_s
            ORDER BY frequency DESC
        """).fetchall()
        
        regional_analytics = {}
        total_coverage = 0
        
        for region, count, cmdb_registered, tanium_deployed in result:
            if region and region != 'unknown':
                normalized = normalize_region(region)
                
                cmdb_percentage = (cmdb_registered / count * 100) if count > 0 else 0
                tanium_percentage = (tanium_deployed / count * 100) if count > 0 else 0
                security_score = (cmdb_percentage + tanium_percentage) / 2
                
                regional_analytics[normalized] = {
                    'count': count,
                    'percentage': 0,  # Will calculate after
                    'cmdb_coverage': round(cmdb_percentage, 2),
                    'tanium_coverage': round(tanium_percentage, 2),
                    'infrastructure_diversity': 0,  # Placeholder
                    'security_score': round(security_score, 2)
                }
                total_coverage += count
        
        # Calculate percentages
        for region, data in regional_analytics.items():
            data['percentage'] = round(data['count'] / total_coverage * 100, 2) if total_coverage > 0 else 0
        
        # Threat assessment
        threat_assessment = {
            'highest_risk_region': min(regional_analytics.keys(), key=lambda k: regional_analytics[k]['security_score']) if regional_analytics else None,
            'most_secure_region': max(regional_analytics.keys(), key=lambda k: regional_analytics[k]['security_score']) if regional_analytics else None,
            'geographic_balance': max(regional_analytics.values(), key=lambda x: x['percentage'])['percentage'] - min(regional_analytics.values(), key=lambda x: x['percentage'])['percentage'] if regional_analytics else 0
        }
        
        conn.close()
        
        return jsonify({
            'global_surveillance': {k: v['count'] for k, v in regional_analytics.items()},
            'regional_analytics': regional_analytics,
            'total_coverage': total_coverage,
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
                COALESCE(region_s, 'unknown') as region,
                COUNT(*) as frequency,
                SUM(CASE WHEN LOWER(present_in_cmdb_s) = 'yes' THEN 1 ELSE 0 END) as cmdb_count,
                SUM(CASE WHEN LOWER(tanium_coverage_s) = 'managed' THEN 1 ELSE 0 END) as tanium_count
            FROM universal_cmdb
            GROUP BY country_s, region_s
            ORDER BY frequency DESC
        """).fetchall()
        
        country_analysis = {}
        total_assets = 0
        
        for country, region, frequency, cmdb_count, tanium_count in result:
            if country and country != 'unknown':
                normalized = normalize_country(country)
                
                if normalized not in country_analysis:
                    country_analysis[normalized] = {
                        'count': 0,
                        'cmdb_total': 0,
                        'tanium_total': 0,
                        'region': normalize_region(region)
                    }
                
                country_analysis[normalized]['count'] += frequency
                country_analysis[normalized]['cmdb_total'] += cmdb_count
                country_analysis[normalized]['tanium_total'] += tanium_count
                total_assets += frequency
        
        # Calculate metrics for each country
        for country, data in country_analysis.items():
            cmdb_coverage = (data['cmdb_total'] / data['count'] * 100) if data['count'] > 0 else 0
            tanium_coverage = (data['tanium_total'] / data['count'] * 100) if data['count'] > 0 else 0
            security_score = (cmdb_coverage + tanium_coverage) / 2
            
            threat_level = 'CRITICAL' if security_score < 25 else 'HIGH' if security_score < 50 else 'MEDIUM' if security_score < 75 else 'LOW'
            
            data['percentage'] = round(data['count'] / total_assets * 100, 2) if total_assets > 0 else 0
            data['security_score'] = round(security_score, 2)
            data['threat_level'] = threat_level
            
            # Remove intermediate calculation fields
            del data['cmdb_total']
            del data['tanium_total']
        
        # Geographic intelligence
        geographic_concentration = max(country_analysis.values(), key=lambda x: x['percentage'])['percentage'] if country_analysis else 0
        
        compliant_regions = [c for c, data in country_analysis.items() if data['threat_level'] == 'LOW']
        urgent_infrastructure = [c for c, data in country_analysis.items() if data['threat_level'] == 'CRITICAL']
        total_gap_assets = sum(data['count'] for data in country_analysis.values() if data['threat_level'] == 'CRITICAL')
        
        conn.close()
        
        return jsonify({
            'total_countries': len(country_analysis),
            'country_analysis': country_analysis,
            'geographic_concentration': geographic_concentration,
            'compliant_regions': compliant_regions,
            'urgent_infrastructure': urgent_infrastructure,
            'total_gap_assets': total_gap_assets,
            'threat_intelligence': {
                'highest_threat_countries': urgent_infrastructure[:5],
                'most_secure_countries': compliant_regions[:5]
            }
        })
        
    except Exception as e:
        logger.error(f"Country metrics error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/tanium_coverage')
def tanium_coverage():
    """Analyze Tanium endpoint management coverage"""
    try:
        conn = get_db_connection()
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        tanium_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE LOWER(tanium_coverage_s) = 'managed'").fetchone()[0]
        
        coverage_percentage = (tanium_count / total_count * 100) if total_count > 0 else 0
        
        status_breakdown = {
            'deployed': tanium_count,
            'not_deployed': total_count - tanium_count
        }
        
        # Regional coverage
        regional_result = conn.execute("""
            SELECT 
                COALESCE(region_s, 'unknown') as region,
                COUNT(*) as total,
                SUM(CASE WHEN LOWER(tanium_coverage_s) = 'managed' THEN 1 ELSE 0 END) as deployed
            FROM universal_cmdb
            GROUP BY region_s
        """).fetchall()
        
        regional_coverage = {}
        for region, total, deployed in regional_result:
            if region != 'unknown':
                coverage_pct = (deployed / total * 100) if total > 0 else 0
                regional_coverage[normalize_region(region)] = {
                    'deployed': deployed,
                    'total': total,
                    'coverage_percentage': round(coverage_pct, 2),
                    'priority': 'HIGH' if coverage_pct < 50 else 'MEDIUM' if coverage_pct < 80 else 'LOW'
                }
        
        conn.close()
        
        deployment_gap = total_count - tanium_count
        coverage_status = 'OPTIMAL' if coverage_percentage >= 80 else 'ACCEPTABLE' if coverage_percentage >= 60 else 'CRITICAL'
        
        return jsonify({
            'tanium_deployed': tanium_count,
            'total_assets': total_count,
            'coverage_percentage': round(coverage_percentage, 2),
            'status_breakdown': status_breakdown,
            'regional_coverage': regional_coverage,
            'deployment_gaps': {
                'total_unprotected_assets': deployment_gap
            },
            'deployment_analysis': {
                'coverage_status': coverage_status,
                'deployment_gap': deployment_gap,
                'recommended_action': 'MAINTAIN' if coverage_percentage >= 80 else 'EXPAND' if coverage_percentage >= 60 else 'URGENT_DEPLOY',
                'security_risk_level': 'LOW' if coverage_percentage >= 80 else 'MEDIUM' if coverage_percentage >= 60 else 'HIGH'
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
        
        total_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        yes_count = conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE LOWER(present_in_cmdb_s) = 'yes'").fetchone()[0]
        
        registration_rate = (yes_count / total_count * 100) if total_count > 0 else 0
        
        status_breakdown = {
            'registered': yes_count,
            'not_registered': total_count - yes_count
        }
        
        compliance_status = 'COMPLIANT' if registration_rate >= 90 else 'PARTIAL_COMPLIANCE' if registration_rate >= 70 else 'NON_COMPLIANT'
        
        conn.close()
        
        return jsonify({
            'cmdb_registered': yes_count,
            'total_assets': total_count,
            'registration_rate': round(registration_rate, 2),
            'status_breakdown': status_breakdown,
            'compliance_analysis': {
                'compliance_status': compliance_status,
                'improvement_needed': max(0, round(90 - registration_rate, 2)),
                'governance_maturity': 'MATURE' if registration_rate >= 95 else 'DEVELOPING' if registration_rate >= 85 else 'IMMATURE'
            }
        })
        
    except Exception as e:
        logger.error(f"CMDB presence error: {e}")
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