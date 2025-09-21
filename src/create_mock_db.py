#!/usr/bin/env python3

import duckdb
import os
import random
from datetime import datetime, timedelta

def create_mock_database():
    """Create a realistic mock DuckDB database with 100,000+ rows optimized for cybersecurity analytics"""
    
    # Get script directory and database path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, "universal_cmdb.db")
    
    print(f"Creating comprehensive mock DuckDB database with 100,000+ rows...")
    print(f"Script directory: {script_dir}")
    print(f"Database will be created at: {db_path}")
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
        print("Removed existing database")
    
    # Connect to DuckDB
    conn = duckdb.connect(db_path)
    
    print("Creating optimized table schema...")
    
    # Create table with all necessary columns for the analytics
    conn.execute("""
    CREATE TABLE universal_cmdb (
        host_s VARCHAR,
        fqdn_s VARCHAR,
        ip_address_s VARCHAR,
        region_s VARCHAR,
        country_s VARCHAR,
        business_unit_s VARCHAR,
        cio_s VARCHAR,
        data_center_s VARCHAR,
        infrastructure_type_s VARCHAR,
        class_s VARCHAR,
        system_classification_s VARCHAR,
        source_tables_s VARCHAR,
        domain_s VARCHAR,
        present_in_cmdb_s VARCHAR,
        tanium_coverage_s VARCHAR,
        present_in_crowdstrike_s VARCHAR,
        edr_coverage_s VARCHAR,
        dlp_agent_coverage_s VARCHAR,
        logging_in_splunk_s VARCHAR,
        logging_in_qso_s VARCHAR,
        apm_s VARCHAR,
        cloud_region_s VARCHAR,
        created_at TIMESTAMP,
        first_seen TIMESTAMP,
        last_updated TIMESTAMP,
        data_quality_score DECIMAL(4,2),
        source_count INTEGER
    )
    """)
    
    print("Generating 100,000 rows of highly realistic cybersecurity data...")
    
    # More comprehensive data generation with realistic distributions
    conn.execute("""
    INSERT INTO universal_cmdb
    SELECT
        -- host_s - Realistic hostname patterns
        concat(
            CASE 
                WHEN random() < 0.25 THEN 'srv'
                WHEN random() < 0.45 THEN 'host'
                WHEN random() < 0.60 THEN 'vm'
                WHEN random() < 0.73 THEN 'ws'
                WHEN random() < 0.83 THEN 'db'
                WHEN random() < 0.90 THEN 'web'
                WHEN random() < 0.95 THEN 'app'
                ELSE 'dc'
            END,
            '-',
            CASE 
                WHEN random() < 0.40 THEN 'prod'
                WHEN random() < 0.60 THEN 'dev'
                WHEN random() < 0.75 THEN 'test'
                WHEN random() < 0.85 THEN 'stage'
                WHEN random() < 0.92 THEN 'qa'
                WHEN random() < 0.96 THEN 'lab'
                ELSE 'demo'
            END,
            '-',
            lpad(floor(random() * 9999)::VARCHAR, 4, '0')
        ),
        
        -- fqdn_s - Fully qualified domain names
        concat(
            CASE 
                WHEN random() < 0.20 THEN 'web'
                WHEN random() < 0.35 THEN 'app'
                WHEN random() < 0.50 THEN 'db'
                WHEN random() < 0.65 THEN 'api'
                WHEN random() < 0.75 THEN 'cache'
                WHEN random() < 0.83 THEN 'mail'
                WHEN random() < 0.89 THEN 'file'
                WHEN random() < 0.94 THEN 'backup'
                ELSE 'monitor'
            END,
            lpad(floor(random() * 999)::VARCHAR, 3, '0'),
            '.',
            CASE 
                WHEN random() < 0.30 THEN 'corp'
                WHEN random() < 0.50 THEN 'prod'
                WHEN random() < 0.65 THEN 'dev'
                WHEN random() < 0.75 THEN 'test'
                WHEN random() < 0.83 THEN 'staging'
                WHEN random() < 0.89 THEN 'qa'
                WHEN random() < 0.94 THEN 'lab'
                ELSE 'demo'
            END,
            '.company.com'
        ),
        
        -- ip_address_s - Realistic IP distributions
        CASE 
            WHEN random() < 0.45 THEN concat('10.', floor(random() * 255)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
            WHEN random() < 0.75 THEN concat('172.', (floor(random() * 16) + 16)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
            WHEN random() < 0.90 THEN concat('192.168.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
            ELSE concat((floor(random() * 223) + 1)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
        END,
        
        -- region_s - Geographic regions with realistic distribution
        CASE 
            WHEN random() < 0.35 THEN 'North America'
            WHEN random() < 0.55 THEN 'Europe'
            WHEN random() < 0.70 THEN 'Asia Pacific'
            WHEN random() < 0.80 THEN 'Latin America'
            WHEN random() < 0.88 THEN 'Middle East'
            WHEN random() < 0.94 THEN 'Africa'
            WHEN random() < 0.97 THEN 'Oceania'
            ELSE 'Global'
        END,
        
        -- country_s - Country codes with realistic enterprise distribution
        CASE 
            WHEN random() < 0.40 THEN 'US'
            WHEN random() < 0.52 THEN 'UK'
            WHEN random() < 0.62 THEN 'DE'
            WHEN random() < 0.70 THEN 'JP'
            WHEN random() < 0.76 THEN 'CA'
            WHEN random() < 0.81 THEN 'AU'
            WHEN random() < 0.85 THEN 'FR'
            WHEN random() < 0.88 THEN 'SG'
            WHEN random() < 0.91 THEN 'IN'
            WHEN random() < 0.93 THEN 'BR'
            WHEN random() < 0.95 THEN 'MX'
            WHEN random() < 0.97 THEN 'NL'
            ELSE 'CH'
        END,
        
        -- business_unit_s - Realistic business units
        CASE 
            WHEN random() < 0.20 THEN 'Engineering'
            WHEN random() < 0.35 THEN 'Finance'
            WHEN random() < 0.45 THEN 'Marketing'
            WHEN random() < 0.60 THEN 'Operations'
            WHEN random() < 0.70 THEN 'Human Resources'
            WHEN random() < 0.80 THEN 'Sales'
            WHEN random() < 0.88 THEN 'Information Technology'
            WHEN random() < 0.93 THEN 'Legal'
            WHEN random() < 0.97 THEN 'Research and Development'
            ELSE 'Customer Support'
        END,
        
        -- cio_s - Chief Information Officers
        CASE 
            WHEN random() < 0.15 THEN 'Jennifer Martinez'
            WHEN random() < 0.30 THEN 'Michael Chen'
            WHEN random() < 0.45 THEN 'Sarah Johnson'
            WHEN random() < 0.60 THEN 'David Rodriguez'
            WHEN random() < 0.75 THEN 'Lisa Thompson'
            WHEN random() < 0.85 THEN 'Robert Kim'
            WHEN random() < 0.93 THEN 'Amanda Wilson'
            ELSE 'Carlos Patel'
        END,
        
        -- data_center_s - Data center locations
        CASE 
            WHEN random() < 0.15 THEN 'DC-NYC-01'
            WHEN random() < 0.28 THEN 'DC-SFO-02'
            WHEN random() < 0.38 THEN 'DC-LON-01'
            WHEN random() < 0.47 THEN 'DC-FRA-01'
            WHEN random() < 0.55 THEN 'DC-TOK-01'
            WHEN random() < 0.62 THEN 'DC-SYD-01'
            WHEN random() < 0.68 THEN 'DC-TOR-01'
            WHEN random() < 0.74 THEN 'DC-MIA-01'
            WHEN random() < 0.79 THEN 'DC-CHI-02'
            WHEN random() < 0.84 THEN 'DC-SEA-01'
            WHEN random() < 0.88 THEN 'DC-DUB-01'
            WHEN random() < 0.92 THEN 'DC-SIN-01'
            WHEN random() < 0.95 THEN 'DC-MUM-01'
            WHEN random() < 0.97 THEN 'DC-SAO-01'
            ELSE 'DC-AMS-01'
        END,
        
        -- infrastructure_type_s - Infrastructure types with cloud migration trends
        CASE 
            WHEN random() < 0.25 THEN 'physical'
            WHEN random() < 0.45 THEN 'vmware'
            WHEN random() < 0.65 THEN 'aws_ec2'
            WHEN random() < 0.78 THEN 'azure_vm'
            WHEN random() < 0.87 THEN 'gcp_compute'
            WHEN random() < 0.92 THEN 'docker_container'
            WHEN random() < 0.96 THEN 'kubernetes_pod'
            WHEN random() < 0.98 THEN 'openshift'
            ELSE 'hybrid_cloud'
        END,
        
        -- class_s - Security classifications with numeric patterns
        CASE 
            WHEN random() < 0.05 THEN 'unclassified'
            WHEN random() < 0.15 THEN 'class1_restricted'
            WHEN random() < 0.25 THEN 'class2_confidential'
            WHEN random() < 0.40 THEN 'class3_internal'
            WHEN random() < 0.60 THEN 'class4_public'
            WHEN random() < 0.75 THEN 'class5_partner'
            WHEN random() < 0.85 THEN 'class6_vendor'
            WHEN random() < 0.92 THEN 'class7_guest'
            WHEN random() < 0.96 THEN 'class8_archive'
            WHEN random() < 0.98 THEN 'class9_deprecated'
            ELSE 'class10_legacy'
        END,
        
        -- system_classification_s - Operating systems and platforms with version info
        CASE 
            WHEN random() < 0.20 THEN 'windows_server_2019'
            WHEN random() < 0.35 THEN 'windows_server_2016'
            WHEN random() < 0.42 THEN 'windows_server_2012'
            WHEN random() < 0.46 THEN 'windows_server_2008'
            WHEN random() < 0.60 THEN 'linux_ubuntu_20.04'
            WHEN random() < 0.70 THEN 'linux_rhel_8'
            WHEN random() < 0.77 THEN 'linux_centos_7'
            WHEN random() < 0.83 THEN 'windows_10_enterprise'
            WHEN random() < 0.87 THEN 'windows_11_enterprise'
            WHEN random() < 0.90 THEN 'macos_monterey'
            WHEN random() < 0.93 THEN 'vmware_esxi_7'
            WHEN random() < 0.95 THEN 'docker_container'
            WHEN random() < 0.97 THEN 'kubernetes_node'
            ELSE 'unknown_system'
        END,
        
        -- source_tables_s - Data source combinations (critical for source analysis)
        CASE 
            WHEN random() < 0.10 THEN 'cmdb'
            WHEN random() < 0.18 THEN 'crowdstrike'
            WHEN random() < 0.25 THEN 'splunk'
            WHEN random() < 0.32 THEN 'tanium'
            WHEN random() < 0.38 THEN 'nessus'
            WHEN random() < 0.44 THEN 'lansweeper'
            WHEN random() < 0.52 THEN 'cmdb,crowdstrike'
            WHEN random() < 0.58 THEN 'cmdb,splunk'
            WHEN random() < 0.64 THEN 'cmdb,tanium'
            WHEN random() < 0.69 THEN 'crowdstrike,splunk'
            WHEN random() < 0.74 THEN 'cmdb,crowdstrike,splunk'
            WHEN random() < 0.78 THEN 'cmdb,crowdstrike,tanium'
            WHEN random() < 0.82 THEN 'cmdb,splunk,tanium'
            WHEN random() < 0.85 THEN 'crowdstrike,splunk,tanium'
            WHEN random() < 0.88 THEN 'cmdb,crowdstrike,splunk,tanium'
            WHEN random() < 0.91 THEN 'cmdb,ad,splunk'
            WHEN random() < 0.94 THEN 'cmdb,nessus,crowdstrike'
            WHEN random() < 0.96 THEN 'cmdb,lansweeper,tanium'
            WHEN random() < 0.98 THEN 'cmdb,crowdstrike,splunk,tanium,ad'
            ELSE 'cmdb,crowdstrike,splunk,tanium,ad,nessus,lansweeper'
        END,
        
        -- domain_s - Corporate domains with TLD patterns for domain analysis
        CASE 
            WHEN random() < 0.25 THEN 'corp.company.com'
            WHEN random() < 0.40 THEN 'prod.company.com'
            WHEN random() < 0.50 THEN 'tdc.company.com'
            WHEN random() < 0.60 THEN 'lead.company.com'
            WHEN random() < 0.68 THEN 'dev.company.com'
            WHEN random() < 0.75 THEN 'test.company.com'
            WHEN random() < 0.81 THEN 'staging.company.com'
            WHEN random() < 0.86 THEN 'qa.company.com'
            WHEN random() < 0.90 THEN 'lab.company.com'
            WHEN random() < 0.93 THEN 'sandbox.company.com'
            WHEN random() < 0.95 THEN 'demo.company.com'
            WHEN random() < 0.97 THEN 'partner.company.com'
            ELSE 'vendor.company.com'
        END,
        
        -- present_in_cmdb_s - CMDB registration status (critical for compliance analysis)
        CASE 
            WHEN random() < 0.82 THEN 'yes'
            WHEN random() < 0.94 THEN 'no'
            WHEN random() < 0.97 THEN 'pending'
            ELSE 'unknown'
        END,
        
        -- tanium_coverage_s - Tanium endpoint management (critical for coverage analysis)
        CASE 
            WHEN random() < 0.68 THEN 'managed'
            WHEN random() < 0.78 THEN 'unmanaged'
            WHEN random() < 0.84 THEN 'pending_installation'
            WHEN random() < 0.88 THEN 'offline'
            WHEN random() < 0.92 THEN 'quarantined'
            WHEN random() < 0.95 THEN 'maintenance_mode'
            WHEN random() < 0.97 THEN 'installation_failed'
            ELSE 'deployment_pending'
        END,
        
        -- present_in_crowdstrike_s - CrowdStrike EDR coverage
        CASE 
            WHEN random() < 0.72 THEN 'enrolled'
            WHEN random() < 0.85 THEN 'not_enrolled'
            WHEN random() < 0.91 THEN 'pending_enrollment'
            WHEN random() < 0.95 THEN 'installation_failed'
            WHEN random() < 0.97 THEN 'uninstalled'
            ELSE 'sensor_offline'
        END,
        
        -- edr_coverage_s - Endpoint Detection and Response
        CASE 
            WHEN random() < 0.40 THEN 'crowdstrike'
            WHEN random() < 0.65 THEN 'sentinelone'
            WHEN random() < 0.80 THEN 'carbon_black'
            WHEN random() < 0.90 THEN 'microsoft_defender'
            WHEN random() < 0.95 THEN 'cylance'
            WHEN random() < 0.98 THEN 'cortex_xdr'
            ELSE 'not_protected'
        END,
        
        -- dlp_agent_coverage_s - Data Loss Prevention
        CASE 
            WHEN random() < 0.58 THEN 'forcepoint'
            WHEN random() < 0.75 THEN 'symantec'
            WHEN random() < 0.85 THEN 'digital_guardian'
            WHEN random() < 0.92 THEN 'proofpoint'
            WHEN random() < 0.96 THEN 'mcafee'
            ELSE 'not_covered'
        END,
        
        -- logging_in_splunk_s - Splunk logging status
        CASE 
            WHEN random() < 0.70 THEN 'forwarding'
            WHEN random() < 0.83 THEN 'not_forwarding'
            WHEN random() < 0.90 THEN 'heavy_forwarder'
            WHEN random() < 0.95 THEN 'universal_forwarder'
            WHEN random() < 0.98 THEN 'deployment_server'
            ELSE 'indexer'
        END,
        
        -- logging_in_qso_s - QSO logging status
        CASE 
            WHEN random() < 0.62 THEN 'enabled'
            WHEN random() < 0.80 THEN 'disabled'
            WHEN random() < 0.88 THEN 'partial'
            WHEN random() < 0.93 THEN 'error'
            WHEN random() < 0.96 THEN 'configuring'
            ELSE 'unknown'
        END,
        
        -- apm_s - Application Performance Monitoring
        CASE 
            WHEN random() < 0.15 THEN 'new_relic'
            WHEN random() < 0.30 THEN 'datadog'
            WHEN random() < 0.45 THEN 'dynatrace'
            WHEN random() < 0.60 THEN 'app_dynamics'
            WHEN random() < 0.75 THEN 'splunk_apm'
            WHEN random() < 0.85 THEN 'elastic_apm'
            WHEN random() < 0.92 THEN 'none'
            WHEN random() < 0.96 THEN 'honeycomb'
            ELSE 'custom_solution'
        END,
        
        -- cloud_region_s - Cloud regions for modernization analysis
        CASE 
            WHEN random() < 0.22 THEN 'us-east-1'
            WHEN random() < 0.38 THEN 'us-west-2'
            WHEN random() < 0.48 THEN 'eu-west-1'
            WHEN random() < 0.56 THEN 'ap-southeast-1'
            WHEN random() < 0.63 THEN 'us-central1'
            WHEN random() < 0.69 THEN 'eu-central-1'
            WHEN random() < 0.74 THEN 'ap-northeast-1'
            WHEN random() < 0.78 THEN 'ca-central-1'
            WHEN random() < 0.82 THEN 'ap-south-1'
            WHEN random() < 0.85 THEN 'sa-east-1'
            WHEN random() < 0.88 THEN 'eu-north-1'
            WHEN random() < 0.91 THEN 'ap-southeast-2'
            WHEN random() < 0.94 THEN 'on-premises'
            WHEN random() < 0.97 THEN 'multi-region'
            ELSE 'edge_location'
        END,
        
        -- created_at - Asset creation timestamps over past 4 years
        timestamp '2020-01-01' + interval (floor(random() * 1460)) day + 
        interval (floor(random() * 24)) hour + interval (floor(random() * 60)) minute,
        
        -- first_seen - First discovery timestamps
        timestamp '2018-01-01' + interval (floor(random() * 2190)) day + 
        interval (floor(random() * 24)) hour + interval (floor(random() * 60)) minute,
        
        -- last_updated - Recent update timestamps for freshness analysis
        timestamp '2024-01-01' + interval (floor(random() * 250)) day + 
        interval (floor(random() * 24)) hour + interval (floor(random() * 60)) minute,
        
        -- data_quality_score - Realistic quality scores with proper distribution
        CASE 
            WHEN random() < 0.08 THEN round((random() * 2)::DECIMAL(4,2), 2)
            WHEN random() < 0.25 THEN round((2 + random() * 1.5)::DECIMAL(4,2), 2)
            WHEN random() < 0.75 THEN round((3.5 + random() * 1)::DECIMAL(4,2), 2)
            ELSE round((4.5 + random() * 0.5)::DECIMAL(4,2), 2)
        END,
        
        -- source_count - Number of data sources per asset
        CASE 
            WHEN random() < 0.15 THEN 1
            WHEN random() < 0.35 THEN 2
            WHEN random() < 0.55 THEN 3
            WHEN random() < 0.70 THEN 4
            WHEN random() < 0.82 THEN 5
            WHEN random() < 0.90 THEN 6
            WHEN random() < 0.95 THEN 7
            WHEN random() < 0.98 THEN 8
            ELSE floor(random() * 4) + 9
        END

    FROM generate_series(1, 100000);
    """)
    
    print("Creating optimized indexes for query performance...")
    
    # Create comprehensive indexes for all analytics queries
    indexes = [
        "CREATE INDEX idx_host_s ON universal_cmdb(host_s)",
        "CREATE INDEX idx_region_s ON universal_cmdb(region_s)",
        "CREATE INDEX idx_country_s ON universal_cmdb(country_s)",
        "CREATE INDEX idx_business_unit_s ON universal_cmdb(business_unit_s)",
        "CREATE INDEX idx_infrastructure_type_s ON universal_cmdb(infrastructure_type_s)",
        "CREATE INDEX idx_class_s ON universal_cmdb(class_s)",
        "CREATE INDEX idx_system_classification_s ON universal_cmdb(system_classification_s)",
        "CREATE INDEX idx_present_in_cmdb_s ON universal_cmdb(present_in_cmdb_s)",
        "CREATE INDEX idx_tanium_coverage_s ON universal_cmdb(tanium_coverage_s)",
        "CREATE INDEX idx_source_tables_s ON universal_cmdb(source_tables_s)",
        "CREATE INDEX idx_domain_s ON universal_cmdb(domain_s)",
        "CREATE INDEX idx_data_center_s ON universal_cmdb(data_center_s)",
        "CREATE INDEX idx_cio_s ON universal_cmdb(cio_s)",
        "CREATE INDEX idx_last_updated ON universal_cmdb(last_updated)",
        "CREATE INDEX idx_created_at ON universal_cmdb(created_at)",
        "CREATE INDEX idx_cloud_region_s ON universal_cmdb(cloud_region_s)",
        # Composite indexes for complex analytics
        "CREATE INDEX idx_region_infra ON universal_cmdb(region_s, infrastructure_type_s)",
        "CREATE INDEX idx_cmdb_tanium ON universal_cmdb(present_in_cmdb_s, tanium_coverage_s)",
        "CREATE INDEX idx_bu_region ON universal_cmdb(business_unit_s, region_s)",
        "CREATE INDEX idx_class_region ON universal_cmdb(class_s, region_s)"
    ]
    
    for index_sql in indexes:
        try:
            conn.execute(index_sql)
        except Exception as e:
            print(f"Warning: Failed to create index: {e}")
    
    print("Generating additional sample variations for better analytics...")
    
    # Add some additional records with specific patterns for testing edge cases
    conn.execute("""
    INSERT INTO universal_cmdb
    SELECT
        concat('critical-', lpad(floor(random() * 100)::VARCHAR, 3, '0')),
        concat('critical', floor(random() * 100)::VARCHAR, '.high.security.com'),
        concat('172.16.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR),
        'North America',
        'US',
        'Security Operations',
        'Jennifer Martinez',
        'DC-NYC-01',
        'physical',
        'class1_restricted',
        'production',
        'cmdb,crowdstrike,splunk,tanium,nessus',
        'tdc.company.com',
        'yes',
        'managed',
        'enrolled',
        'crowdstrike',
        'forcepoint',
        'forwarding',
        'enabled',
        'datadog',
        'us-east-1',
        timestamp '2023-01-01' + interval (floor(random() * 365)) day,
        timestamp '2022-01-01' + interval (floor(random() * 730)) day,
        timestamp '2024-06-01' + interval (floor(random() * 120)) day,
        4.8 + random() * 0.2,
        7
    FROM generate_series(1, 500);
    """)
    
    # Add some legacy systems for modernization analysis
    conn.execute("""
    INSERT INTO universal_cmdb
    SELECT
        concat('legacy-', lpad(floor(random() * 100)::VARCHAR, 3, '0')),
        concat('legacy', floor(random() * 100)::VARCHAR, '.old.company.com'),
        concat('10.0.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR),
        CASE WHEN random() < 0.5 THEN 'Europe' ELSE 'Asia Pacific' END,
        CASE WHEN random() < 0.5 THEN 'DE' ELSE 'JP' END,
        CASE WHEN random() < 0.5 THEN 'Finance' ELSE 'Operations' END,
        'David Rodriguez',
        CASE WHEN random() < 0.5 THEN 'DC-FRA-01' ELSE 'DC-TOK-01' END,
        'physical',
        'class8_archive',
        CASE 
            WHEN random() < 0.4 THEN 'windows_server_2008'
            WHEN random() < 0.7 THEN 'windows_server_2012'
            ELSE 'linux_centos_6'
        END,
        'cmdb,lansweeper',
        'corp.company.com',
        CASE WHEN random() < 0.6 THEN 'yes' ELSE 'no' END,
        CASE WHEN random() < 0.4 THEN 'managed' ELSE 'unmanaged' END,
        'not_enrolled',
        'not_protected',
        'not_covered',
        'not_forwarding',
        'disabled',
        'none',
        'on-premises',
        timestamp '2018-01-01' + interval (floor(random() * 1095)) day,
        timestamp '2017-01-01' + interval (floor(random() * 1095)) day,
        timestamp '2024-01-01' + interval (floor(random() * 60)) day,
        1.0 + random() * 2.0,
        2
    FROM generate_series(1, 300);
    """)
    
    print("Running comprehensive database statistics...")
    
    # Show detailed statistics
    print("\n=== DATABASE ANALYTICS SUMMARY ===")
    
    stats_queries = [
        ("Total Records", "SELECT COUNT(*) FROM universal_cmdb"),
        ("Unique Hosts", "SELECT COUNT(DISTINCT host_s) FROM universal_cmdb"),
        ("Unique Regions", "SELECT COUNT(DISTINCT region_s) FROM universal_cmdb"),
        ("Unique Countries", "SELECT COUNT(DISTINCT country_s) FROM universal_cmdb"),
        ("Unique Business Units", "SELECT COUNT(DISTINCT business_unit_s) FROM universal_cmdb"),
        ("Unique Infrastructure Types", "SELECT COUNT(DISTINCT infrastructure_type_s) FROM universal_cmdb"),
        ("CMDB Registered (%)", "SELECT ROUND(SUM(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) FROM universal_cmdb"),
        ("Tanium Managed (%)", "SELECT ROUND(SUM(CASE WHEN tanium_coverage_s = 'managed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) FROM universal_cmdb"),
        ("Source Combinations", "SELECT COUNT(DISTINCT source_tables_s) FROM universal_cmdb"),
        ("Classification Levels", "SELECT COUNT(DISTINCT class_s) FROM universal_cmdb")
    ]
    
    for description, query in stats_queries:
        try:
            result = conn.execute(query).fetchone()[0]
            print(f"{description:.<30} {result}")
        except Exception as e:
            print(f"{description:.<30} Error: {e}")
    
    print("\n=== SAMPLE DATA PREVIEW ===")
    sample = conn.execute("""
        SELECT host_s, region_s, business_unit_s, infrastructure_type_s, 
               present_in_cmdb_s, tanium_coverage_s, class_s 
        FROM universal_cmdb 
        LIMIT 3
    """).fetchall()
    
    for row in sample:
        print(f"Host: {row[0]} | Region: {row[1]} | BU: {row[2]} | Infra: {row[3]} | CMDB: {row[4]} | Tanium: {row[5]} | Class: {row[6]}")
    
    print("\n=== REGIONAL DISTRIBUTION ===")
    regional_dist = conn.execute("""
        SELECT region_s, COUNT(*) as count, 
               ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM universal_cmdb), 2) as percentage
        FROM universal_cmdb 
        GROUP BY region_s 
        ORDER BY count DESC
    """).fetchall()
    
    for region, count, percentage in regional_dist:
        print(f"{region:.<25} {count:>6} ({percentage}%)")
    
    print("\n=== SOURCE TABLE COMBINATIONS (Top 10) ===")
    source_dist = conn.execute("""
        SELECT source_tables_s, COUNT(*) as count
        FROM universal_cmdb 
        GROUP BY source_tables_s 
        ORDER BY count DESC 
        LIMIT 10
    """).fetchall()
    
    for source, count in source_dist:
        print(f"{source:.<35} {count:>6}")
    
    # Close connection
    conn.close()
    
    # Verify file creation and provide usage instructions
    if os.path.exists(db_path):
        file_size = os.path.getsize(db_path)
        file_size_mb = file_size / (1024 * 1024)
        
        print(f"\n🎉 SUCCESS! Comprehensive cybersecurity database created!")
        print(f"📍 Location: {db_path}")
        print(f"📦 File size: {file_size_mb:.1f} MB")
        print(f"📊 Records: 100,800+ rows optimized for analytics")
        
        print(f"\n🚀 NEXT STEPS:")
        print(f"1. Run the Flask app: python3 app.py")
        print(f"2. Open browser: http://localhost:5000/api/database_status")
        print(f"3. Test analytics endpoints:")
        
        endpoints = [
            "/api/source_tables_metrics",
            "/api/domain_metrics", 
            "/api/region_metrics",
            "/api/country_metrics",
            "/api/infrastructure_type",
            "/api/class_metrics",
            "/api/system_classification_metrics",
            "/api/business_unit_metrics",
            "/api/cio_metrics",
            "/api/tanium_coverage",
            "/api/cmdb_presence",
            "/api/advanced_analytics"
        ]
        
        for endpoint in endpoints:
            print(f"   - http://localhost:5000{endpoint}")
        
        print(f"\n🔍 MANUAL DATABASE INSPECTION:")
        print(f"python3 -c \"import duckdb; conn = duckdb.connect('{db_path}'); print('Rows:', conn.execute('SELECT COUNT(*) FROM universal_cmdb').fetchone()[0])\"")
        
        return True
    else:
        print(f"❌ ERROR: Database file was not created at {db_path}")
        return False

if __name__ == "__main__":
    success = create_mock_database()
    if success:
        print(f"\n✅ Database generation completed successfully!")
        print(f"📋 Ready for comprehensive cybersecurity analytics testing!")
    else:
        print(f"\n❌ Database generation failed!")
        exit(1)