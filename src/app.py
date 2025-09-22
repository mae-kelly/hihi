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

# ============================================================================
# GLOBAL VIEW - Overall visibility percentage across all hosts
# ============================================================================
@app.route('/api/global_visibility')
def global_visibility():
    """Calculate global visibility percentage - what % of hosts can we see"""
    try:
        conn = get_db_connection()
        
        # Total hosts in CMDB
        total_hosts = conn.execute("SELECT COUNT(DISTINCT host_s) FROM universal_cmdb").fetchone()[0]
        
        # Hosts visible in logging platforms (Splunk or Chronicle/GSO)
        visible_in_splunk = conn.execute("""
            SELECT COUNT(DISTINCT host_s) FROM universal_cmdb 
            WHERE LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
        """).fetchone()[0]
        
        visible_in_chronicle = conn.execute("""
            SELECT COUNT(DISTINCT host_s) FROM universal_cmdb 
            WHERE LOWER(logging_in_qso_s) IN ('enabled', 'partial')
        """).fetchone()[0]
        
        # Hosts visible in either platform
        visible_anywhere = conn.execute("""
            SELECT COUNT(DISTINCT host_s) FROM universal_cmdb 
            WHERE (LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                   OR LOWER(logging_in_qso_s) IN ('enabled', 'partial'))
        """).fetchone()[0]
        
        # Calculate percentages
        visibility_percentage = (visible_anywhere / total_hosts * 100) if total_hosts > 0 else 0
        splunk_percentage = (visible_in_splunk / total_hosts * 100) if total_hosts > 0 else 0
        chronicle_percentage = (visible_in_chronicle / total_hosts * 100) if total_hosts > 0 else 0
        
        # Invisible hosts (critical metric)
        invisible_hosts = total_hosts - visible_anywhere
        
        conn.close()
        
        return jsonify({
            'total_hosts': total_hosts,
            'visible_hosts': visible_anywhere,
            'invisible_hosts': invisible_hosts,
            'global_visibility_percentage': round(visibility_percentage, 2),
            'splunk_visibility_percentage': round(splunk_percentage, 2),
            'chronicle_visibility_percentage': round(chronicle_percentage, 2),
            'visibility_gap_percentage': round(100 - visibility_percentage, 2),
            'status': 'CRITICAL' if visibility_percentage < 50 else 'WARNING' if visibility_percentage < 80 else 'HEALTHY'
        })
        
    except Exception as e:
        logger.error(f"Global visibility error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# INFRASTRUCTURE VIEW - Visibility by infrastructure type
# ============================================================================
@app.route('/api/infrastructure_visibility')
def infrastructure_visibility():
    """Calculate visibility by infrastructure type (on-prem, cloud, etc)"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(infrastructure_type_s, 'unknown') as infra_type,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY infrastructure_type_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        infrastructure_breakdown = []
        total_all = 0
        visible_all = 0
        
        # Map infrastructure types to categories
        infra_categories = {
            'on_premise': ['physical', 'vmware', 'hyper-v'],
            'cloud': ['aws_ec2', 'azure_vm', 'gcp_compute'],
            'container': ['docker_container', 'kubernetes_pod', 'openshift'],
            'hybrid': ['hybrid_cloud'],
            'other': []
        }
        
        category_data = defaultdict(lambda: {'total': 0, 'visible': 0})
        
        for infra_type, total, visible in result:
            # Categorize
            category = 'other'
            for cat, types in infra_categories.items():
                if infra_type in types:
                    category = cat
                    break
            
            category_data[category]['total'] += total
            category_data[category]['visible'] += visible
            total_all += total
            visible_all += visible
            
            visibility_pct = (visible / total * 100) if total > 0 else 0
            
            infrastructure_breakdown.append({
                'infrastructure_type': infra_type,
                'category': category,
                'total_hosts': total,
                'visible_hosts': visible,
                'invisible_hosts': total - visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 30 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        # Category summaries
        category_summary = {}
        for category, data in category_data.items():
            if data['total'] > 0:
                category_summary[category] = {
                    'total_hosts': data['total'],
                    'visible_hosts': data['visible'],
                    'visibility_percentage': round(data['visible'] / data['total'] * 100, 2),
                    'status': 'CRITICAL' if (data['visible'] / data['total'] * 100) < 30 else 'WARNING' if (data['visible'] / data['total'] * 100) < 70 else 'HEALTHY'
                }
        
        overall_visibility = (visible_all / total_all * 100) if total_all > 0 else 0
        
        conn.close()
        
        return jsonify({
            'overall_infrastructure_visibility': round(overall_visibility, 2),
            'category_summary': category_summary,
            'detailed_breakdown': infrastructure_breakdown,
            'total_infrastructure_types': len(infrastructure_breakdown),
            'critical_gaps': [item for item in infrastructure_breakdown if item['visibility_percentage'] < 30]
        })
        
    except Exception as e:
        logger.error(f"Infrastructure visibility error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# REGIONAL/COUNTRY VIEW - Visibility by location
# ============================================================================
@app.route('/api/regional_visibility')
def regional_visibility():
    """Calculate visibility by region, country, data center, and cloud region"""
    try:
        conn = get_db_connection()
        
        # Regional visibility
        regional_result = conn.execute("""
            SELECT 
                COALESCE(region_s, 'unknown') as region,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY region_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Country visibility
        country_result = conn.execute("""
            SELECT 
                COALESCE(country_s, 'unknown') as country,
                COALESCE(region_s, 'unknown') as region,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY country_s, region_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Data center visibility
        datacenter_result = conn.execute("""
            SELECT 
                COALESCE(data_center_s, 'unknown') as data_center,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY data_center_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Cloud region visibility
        cloud_region_result = conn.execute("""
            SELECT 
                COALESCE(cloud_region_s, 'on-premises') as cloud_region,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            WHERE cloud_region_s IS NOT NULL AND cloud_region_s != 'on-premises'
            GROUP BY cloud_region_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Process results
        regional_data = []
        for region, total, visible in regional_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            regional_data.append({
                'region': region,
                'total_hosts': total,
                'visible_hosts': visible,
                'invisible_hosts': total - visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        country_data = []
        for country, region, total, visible in country_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            country_data.append({
                'country': country,
                'region': region,
                'total_hosts': total,
                'visible_hosts': visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        datacenter_data = []
        for dc, total, visible in datacenter_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            datacenter_data.append({
                'data_center': dc,
                'total_hosts': total,
                'visible_hosts': visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        cloud_region_data = []
        for cloud_region, total, visible in cloud_region_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            cloud_region_data.append({
                'cloud_region': cloud_region,
                'total_hosts': total,
                'visible_hosts': visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        conn.close()
        
        return jsonify({
            'regional_breakdown': regional_data,
            'country_breakdown': country_data[:20],  # Top 20 countries
            'datacenter_breakdown': datacenter_data,
            'cloud_region_breakdown': cloud_region_data,
            'worst_visibility_region': min(regional_data, key=lambda x: x['visibility_percentage']) if regional_data else None,
            'best_visibility_region': max(regional_data, key=lambda x: x['visibility_percentage']) if regional_data else None
        })
        
    except Exception as e:
        logger.error(f"Regional visibility error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# BUSINESS UNIT VIEW - Visibility by BU, CIO, APM, Application Class
# ============================================================================
@app.route('/api/business_unit_visibility')
def business_unit_visibility():
    """Calculate visibility by business unit, CIO, APM, and application class"""
    try:
        conn = get_db_connection()
        
        # Business Unit visibility
        bu_result = conn.execute("""
            SELECT 
                COALESCE(business_unit_s, 'unknown') as business_unit,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY business_unit_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # CIO visibility
        cio_result = conn.execute("""
            SELECT 
                COALESCE(cio_s, 'unknown') as cio,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY cio_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # APM visibility
        apm_result = conn.execute("""
            SELECT 
                COALESCE(apm_s, 'none') as apm,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY apm_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Application Class visibility (using class_s)
        class_result = conn.execute("""
            SELECT 
                COALESCE(class_s, 'unclassified') as app_class,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY class_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Process results
        bu_data = []
        for bu, total, visible in bu_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            bu_data.append({
                'business_unit': bu,
                'total_hosts': total,
                'visible_hosts': visible,
                'invisible_hosts': total - visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        cio_data = []
        for cio, total, visible in cio_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            cio_data.append({
                'cio': cio,
                'total_hosts': total,
                'visible_hosts': visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        apm_data = []
        for apm, total, visible in apm_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            apm_data.append({
                'apm': apm,
                'total_hosts': total,
                'visible_hosts': visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        class_data = []
        for app_class, total, visible in class_result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            class_data.append({
                'application_class': app_class,
                'total_hosts': total,
                'visible_hosts': visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        conn.close()
        
        return jsonify({
            'business_unit_breakdown': bu_data,
            'cio_breakdown': cio_data,
            'apm_breakdown': apm_data,
            'application_class_breakdown': class_data,
            'worst_visibility_bu': min(bu_data, key=lambda x: x['visibility_percentage']) if bu_data else None,
            'best_visibility_bu': max(bu_data, key=lambda x: x['visibility_percentage']) if bu_data else None
        })
        
    except Exception as e:
        logger.error(f"Business unit visibility error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# SYSTEM CLASSIFICATION - Visibility by system type
# ============================================================================
@app.route('/api/system_classification_visibility')
def system_classification_visibility():
    """Calculate visibility by system classification"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(system_classification_s, 'unknown') as system_class,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY system_classification_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        # Categorize systems
        system_categories = {
            'windows_servers': ['windows_server_2019', 'windows_server_2016', 'windows_server_2012', 'windows_server_2008'],
            'linux_servers': ['linux_ubuntu_20.04', 'linux_rhel_8', 'linux_centos_7', 'linux_centos_6'],
            'windows_workstations': ['windows_10_enterprise', 'windows_11_enterprise'],
            'mac_workstations': ['macos_monterey'],
            'virtualization': ['vmware_esxi_7', 'hyper-v'],
            'containers': ['docker_container', 'kubernetes_node'],
            'network_appliances': ['firewall', 'router', 'switch', 'load_balancer'],
            'databases': ['oracle', 'sql_server', 'mysql', 'postgresql'],
            'mainframes': ['ibm_mainframe', 'as400'],
            'unix_systems': ['aix', 'solaris', 'hp-ux']
        }
        
        category_data = defaultdict(lambda: {'total': 0, 'visible': 0, 'systems': []})
        
        system_breakdown = []
        for system_class, total, visible in result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            
            # Find category
            category = 'other'
            for cat, systems in system_categories.items():
                if any(sys in system_class.lower() for sys in systems):
                    category = cat
                    break
            
            category_data[category]['total'] += total
            category_data[category]['visible'] += visible
            category_data[category]['systems'].append(system_class)
            
            system_breakdown.append({
                'system_classification': system_class,
                'category': category,
                'total_hosts': total,
                'visible_hosts': visible,
                'invisible_hosts': total - visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
        
        # Category summaries
        category_summary = {}
        for category, data in category_data.items():
            if data['total'] > 0:
                visibility_pct = (data['visible'] / data['total'] * 100)
                category_summary[category] = {
                    'total_hosts': data['total'],
                    'visible_hosts': data['visible'],
                    'visibility_percentage': round(visibility_pct, 2),
                    'system_count': len(data['systems']),
                    'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
                }
        
        conn.close()
        
        return jsonify({
            'category_summary': category_summary,
            'detailed_breakdown': system_breakdown,
            'total_system_types': len(system_breakdown),
            'critical_systems': [item for item in system_breakdown if item['visibility_percentage'] < 30]
        })
        
    except Exception as e:
        logger.error(f"System classification visibility error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# SECURITY CONTROL COVERAGE - EDR, Tanium, DLP agent coverage
# ============================================================================
@app.route('/api/security_control_coverage')
def security_control_coverage():
    """Calculate security control coverage (EDR, Tanium, DLP)"""
    try:
        conn = get_db_connection()
        
        total_hosts = conn.execute("SELECT COUNT(DISTINCT host_s) FROM universal_cmdb").fetchone()[0]
        
        # EDR Coverage (CrowdStrike)
        edr_coverage = conn.execute("""
            SELECT 
                COUNT(DISTINCT CASE WHEN LOWER(present_in_crowdstrike_s) = 'enrolled' THEN host_s END) as enrolled,
                COUNT(DISTINCT CASE WHEN LOWER(edr_coverage_s) NOT IN ('not_protected', '') AND edr_coverage_s IS NOT NULL THEN host_s END) as edr_protected
            FROM universal_cmdb
        """).fetchone()
        
        # Tanium Coverage
        tanium_coverage = conn.execute("""
            SELECT 
                COUNT(DISTINCT CASE WHEN LOWER(tanium_coverage_s) = 'managed' THEN host_s END) as managed,
                COUNT(DISTINCT CASE WHEN LOWER(tanium_coverage_s) IN ('managed', 'maintenance_mode') THEN host_s END) as total_managed
            FROM universal_cmdb
        """).fetchone()
        
        # DLP Coverage
        dlp_coverage = conn.execute("""
            SELECT 
                COUNT(DISTINCT CASE WHEN LOWER(dlp_agent_coverage_s) NOT IN ('not_covered', '') AND dlp_agent_coverage_s IS NOT NULL THEN host_s END) as dlp_protected
            FROM universal_cmdb
        """).fetchone()[0]
        
        # Calculate percentages
        edr_percentage = (edr_coverage[1] / total_hosts * 100) if total_hosts > 0 else 0
        tanium_percentage = (tanium_coverage[0] / total_hosts * 100) if total_hosts > 0 else 0
        dlp_percentage = (dlp_coverage / total_hosts * 100) if total_hosts > 0 else 0
        
        # Combined coverage (hosts with all three)
        all_controls = conn.execute("""
            SELECT COUNT(DISTINCT host_s) FROM universal_cmdb
            WHERE LOWER(present_in_crowdstrike_s) = 'enrolled'
            AND LOWER(tanium_coverage_s) = 'managed'
            AND LOWER(dlp_agent_coverage_s) NOT IN ('not_covered', '')
            AND dlp_agent_coverage_s IS NOT NULL
        """).fetchone()[0]
        
        all_controls_percentage = (all_controls / total_hosts * 100) if total_hosts > 0 else 0
        
        # EDR vendor breakdown
        edr_vendors = conn.execute("""
            SELECT 
                COALESCE(edr_coverage_s, 'not_protected') as vendor,
                COUNT(DISTINCT host_s) as host_count
            FROM universal_cmdb
            GROUP BY edr_coverage_s
            ORDER BY host_count DESC
        """).fetchall()
        
        # DLP vendor breakdown
        dlp_vendors = conn.execute("""
            SELECT 
                COALESCE(dlp_agent_coverage_s, 'not_covered') as vendor,
                COUNT(DISTINCT host_s) as host_count
            FROM universal_cmdb
            GROUP BY dlp_agent_coverage_s
            ORDER BY host_count DESC
        """).fetchall()
        
        edr_vendor_breakdown = []
        for vendor, count in edr_vendors:
            if vendor and vendor != 'not_protected':
                edr_vendor_breakdown.append({
                    'vendor': vendor,
                    'host_count': count,
                    'percentage': round(count / total_hosts * 100, 2)
                })
        
        dlp_vendor_breakdown = []
        for vendor, count in dlp_vendors:
            if vendor and vendor != 'not_covered':
                dlp_vendor_breakdown.append({
                    'vendor': vendor,
                    'host_count': count,
                    'percentage': round(count / total_hosts * 100, 2)
                })
        
        conn.close()
        
        return jsonify({
            'total_hosts': total_hosts,
            'edr_coverage': {
                'protected_hosts': edr_coverage[1],
                'unprotected_hosts': total_hosts - edr_coverage[1],
                'coverage_percentage': round(edr_percentage, 2),
                'vendor_breakdown': edr_vendor_breakdown,
                'status': 'CRITICAL' if edr_percentage < 70 else 'WARNING' if edr_percentage < 90 else 'HEALTHY'
            },
            'tanium_coverage': {
                'managed_hosts': tanium_coverage[0],
                'unmanaged_hosts': total_hosts - tanium_coverage[0],
                'coverage_percentage': round(tanium_percentage, 2),
                'status': 'CRITICAL' if tanium_percentage < 70 else 'WARNING' if tanium_percentage < 90 else 'HEALTHY'
            },
            'dlp_coverage': {
                'protected_hosts': dlp_coverage,
                'unprotected_hosts': total_hosts - dlp_coverage,
                'coverage_percentage': round(dlp_percentage, 2),
                'vendor_breakdown': dlp_vendor_breakdown,
                'status': 'CRITICAL' if dlp_percentage < 50 else 'WARNING' if dlp_percentage < 80 else 'HEALTHY'
            },
            'all_controls_coverage': {
                'fully_protected_hosts': all_controls,
                'partially_protected_hosts': total_hosts - all_controls,
                'coverage_percentage': round(all_controls_percentage, 2),
                'status': 'CRITICAL' if all_controls_percentage < 40 else 'WARNING' if all_controls_percentage < 70 else 'HEALTHY'
            }
        })
        
    except Exception as e:
        logger.error(f"Security control coverage error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# LOGGING COMPLIANCE - Splunk and Chronicle visibility
# ============================================================================
@app.route('/api/logging_compliance')
def logging_compliance():
    """Calculate logging compliance (Splunk and Chronicle)"""
    try:
        conn = get_db_connection()
        
        total_hosts = conn.execute("SELECT COUNT(DISTINCT host_s) FROM universal_cmdb").fetchone()[0]
        
        # Splunk coverage breakdown
        splunk_result = conn.execute("""
            SELECT 
                COALESCE(logging_in_splunk_s, 'not_configured') as splunk_status,
                COUNT(DISTINCT host_s) as host_count
            FROM universal_cmdb
            GROUP BY logging_in_splunk_s
        """).fetchall()
        
        # Chronicle/QSO coverage breakdown
        chronicle_result = conn.execute("""
            SELECT 
                COALESCE(logging_in_qso_s, 'not_configured') as chronicle_status,
                COUNT(DISTINCT host_s) as host_count
            FROM universal_cmdb
            GROUP BY logging_in_qso_s
        """).fetchall()
        
        # Calculate visible hosts
        splunk_visible = 0
        splunk_breakdown = []
        for status, count in splunk_result:
            is_visible = status.lower() in ['forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer']
            if is_visible:
                splunk_visible += count
            splunk_breakdown.append({
                'status': status,
                'host_count': count,
                'percentage': round(count / total_hosts * 100, 2),
                'is_compliant': is_visible
            })
        
        chronicle_visible = 0
        chronicle_breakdown = []
        for status, count in chronicle_result:
            is_visible = status.lower() in ['enabled', 'partial']
            if is_visible:
                chronicle_visible += count
            chronicle_breakdown.append({
                'status': status,
                'host_count': count,
                'percentage': round(count / total_hosts * 100, 2),
                'is_compliant': is_visible
            })
        
        # Both platforms
        both_visible = conn.execute("""
            SELECT COUNT(DISTINCT host_s) FROM universal_cmdb
            WHERE LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
            AND LOWER(logging_in_qso_s) IN ('enabled', 'partial')
        """).fetchone()[0]
        
        # Either platform
        either_visible = conn.execute("""
            SELECT COUNT(DISTINCT host_s) FROM universal_cmdb
            WHERE LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
            OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
        """).fetchone()[0]
        
        # Neither platform
        neither_visible = total_hosts - either_visible
        
        splunk_percentage = (splunk_visible / total_hosts * 100) if total_hosts > 0 else 0
        chronicle_percentage = (chronicle_visible / total_hosts * 100) if total_hosts > 0 else 0
        both_percentage = (both_visible / total_hosts * 100) if total_hosts > 0 else 0
        either_percentage = (either_visible / total_hosts * 100) if total_hosts > 0 else 0
        
        conn.close()
        
        return jsonify({
            'total_hosts': total_hosts,
            'splunk_compliance': {
                'compliant_hosts': splunk_visible,
                'non_compliant_hosts': total_hosts - splunk_visible,
                'compliance_percentage': round(splunk_percentage, 2),
                'status_breakdown': splunk_breakdown,
                'status': 'CRITICAL' if splunk_percentage < 50 else 'WARNING' if splunk_percentage < 80 else 'HEALTHY'
            },
            'chronicle_compliance': {
                'compliant_hosts': chronicle_visible,
                'non_compliant_hosts': total_hosts - chronicle_visible,
                'compliance_percentage': round(chronicle_percentage, 2),
                'status_breakdown': chronicle_breakdown,
                'status': 'CRITICAL' if chronicle_percentage < 50 else 'WARNING' if chronicle_percentage < 80 else 'HEALTHY'
            },
            'combined_compliance': {
                'both_platforms': {
                    'host_count': both_visible,
                    'percentage': round(both_percentage, 2)
                },
                'either_platform': {
                    'host_count': either_visible,
                    'percentage': round(either_percentage, 2)
                },
                'neither_platform': {
                    'host_count': neither_visible,
                    'percentage': round((neither_visible / total_hosts * 100), 2)
                },
                'overall_status': 'CRITICAL' if either_percentage < 50 else 'WARNING' if either_percentage < 80 else 'HEALTHY'
            }
        })
        
    except Exception as e:
        logger.error(f"Logging compliance error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# DOMAIN VISIBILITY - Visibility by domain (tdc, lead, etc)
# ============================================================================
@app.route('/api/domain_visibility')
def domain_visibility():
    """Calculate visibility by domain"""
    try:
        conn = get_db_connection()
        
        result = conn.execute("""
            SELECT 
                COALESCE(domain_s, 'unknown') as domain,
                COUNT(DISTINCT host_s) as total_hosts,
                COUNT(DISTINCT CASE 
                    WHEN LOWER(logging_in_splunk_s) IN ('forwarding', 'heavy_forwarder', 'universal_forwarder', 'deployment_server', 'indexer')
                    OR LOWER(logging_in_qso_s) IN ('enabled', 'partial')
                    THEN host_s END) as visible_hosts
            FROM universal_cmdb
            GROUP BY domain_s
            ORDER BY total_hosts DESC
        """).fetchall()
        
        domain_breakdown = []
        total_all = 0
        visible_all = 0
        
        # Identify TDC and LEAD domains
        tdc_total = 0
        tdc_visible = 0
        lead_total = 0
        lead_visible = 0
        
        for domain, total, visible in result:
            visibility_pct = (visible / total * 100) if total > 0 else 0
            
            domain_breakdown.append({
                'domain': domain,
                'total_hosts': total,
                'visible_hosts': visible,
                'invisible_hosts': total - visible,
                'visibility_percentage': round(visibility_pct, 2),
                'status': 'CRITICAL' if visibility_pct < 40 else 'WARNING' if visibility_pct < 70 else 'HEALTHY'
            })
            
            total_all += total
            visible_all += visible
            
            # Check for TDC and LEAD domains
            if 'tdc' in domain.lower():
                tdc_total += total
                tdc_visible += visible
            elif 'lead' in domain.lower() or 'fead' in domain.lower():
                lead_total += total
                lead_visible += visible
        
        overall_visibility = (visible_all / total_all * 100) if total_all > 0 else 0
        tdc_visibility = (tdc_visible / tdc_total * 100) if tdc_total > 0 else 0
        lead_visibility = (lead_visible / lead_total * 100) if lead_total > 0 else 0
        
        conn.close()
        
        return jsonify({
            'overall_domain_visibility': round(overall_visibility, 2),
            'tdc_visibility': {
                'total_hosts': tdc_total,
                'visible_hosts': tdc_visible,
                'visibility_percentage': round(tdc_visibility, 2),
                'status': 'CRITICAL' if tdc_visibility < 50 else 'WARNING' if tdc_visibility < 80 else 'HEALTHY'
            },
            'lead_visibility': {
                'total_hosts': lead_total,
                'visible_hosts': lead_visible,
                'visibility_percentage': round(lead_visibility, 2),
                'status': 'CRITICAL' if lead_visibility < 50 else 'WARNING' if lead_visibility < 80 else 'HEALTHY'
            },
            'domain_breakdown': domain_breakdown,
            'total_domains': len(domain_breakdown),
            'critical_domains': [d for d in domain_breakdown if d['visibility_percentage'] < 40]
        })
        
    except Exception as e:
        logger.error(f"Domain visibility error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================================================
# Legacy endpoints for compatibility
# ============================================================================
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