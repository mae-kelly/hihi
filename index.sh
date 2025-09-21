#!/usr/bin/env python3

import duckdb
import os
import random
from datetime import datetime, timedelta

def create_mock_database():
    # Get script directory and database path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    db_path = os.path.join(script_dir, "universal_cmdb.db")
    
    print(f"Creating mock DuckDB database with 100,000 rows...")
    print(f"Script directory: {script_dir}")
    print(f"Database will be created at: {db_path}")
    
    # Remove existing database if it exists
    if os.path.exists(db_path):
        os.remove(db_path)
    
    # Connect to DuckDB
    conn = duckdb.connect(db_path)
    
    print("Creating table schema...")
    
    # Create table
    conn.execute("""
    CREATE TABLE universal_cmdb (
        apm_s VARCHAR,
        business_unit_s VARCHAR,
        cio_s VARCHAR,
        class_s VARCHAR,
        cloud_region_s VARCHAR,
        country_s VARCHAR,
        created_at TIMESTAMP,
        data_center_s VARCHAR,
        data_quality_score DECIMAL(3,2),
        dlp_agent_coverage_s VARCHAR,
        domain_s VARCHAR,
        edr_coverage_s VARCHAR,
        first_seen TIMESTAMP,
        fqdn_s VARCHAR,
        host_s VARCHAR,
        infrastructure_type_s VARCHAR,
        ip_address_s VARCHAR,
        last_updated TIMESTAMP,
        logging_in_qso_s VARCHAR,
        logging_in_splunk_s VARCHAR,
        present_in_cmdb_s VARCHAR,
        present_in_crowdstrike_s VARCHAR,
        region_s VARCHAR,
        source_count INTEGER,
        source_tables_s VARCHAR,
        system_classification_s VARCHAR,
        tanium_coverage_s VARCHAR
    )
    """)
    
    print("Inserting 100,000 rows of mock data...")
    
    # Insert data using SQL with realistic variations
    conn.execute("""
    INSERT INTO universal_cmdb
    SELECT
        -- apm_s - Application Performance Monitoring
        CASE 
            WHEN random() < 0.15 THEN 'new_relic'
            WHEN random() < 0.30 THEN 'datadog'
            WHEN random() < 0.45 THEN 'dynatrace'
            WHEN random() < 0.60 THEN 'app_dynamics'
            WHEN random() < 0.75 THEN 'splunk_apm'
            WHEN random() < 0.85 THEN 'elastic_apm'
            WHEN random() < 0.95 THEN 'none'
            ELSE 'unknown'
        END,
        
        -- business_unit_s - Various business units
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
        
        -- class_s - Device/system classifications
        CASE 
            WHEN random() < 0.25 THEN 'windows_server'
            WHEN random() < 0.45 THEN 'linux_server'
            WHEN random() < 0.60 THEN 'windows_workstation'
            WHEN random() < 0.70 THEN 'mac_workstation'
            WHEN random() < 0.78 THEN 'network_switch'
            WHEN random() < 0.84 THEN 'network_router'
            WHEN random() < 0.89 THEN 'firewall'
            WHEN random() < 0.93 THEN 'storage_array'
            WHEN random() < 0.96 THEN 'database_server'
            WHEN random() < 0.98 THEN 'load_balancer'
            ELSE 'virtual_machine'
        END,
        
        -- cloud_region_s - AWS/Azure/GCP regions
        CASE 
            WHEN random() < 0.20 THEN 'us-east-1'
            WHEN random() < 0.35 THEN 'us-west-2'
            WHEN random() < 0.45 THEN 'eu-west-1'
            WHEN random() < 0.55 THEN 'ap-southeast-1'
            WHEN random() < 0.65 THEN 'us-central1'
            WHEN random() < 0.73 THEN 'eu-central-1'
            WHEN random() < 0.80 THEN 'ap-northeast-1'
            WHEN random() < 0.86 THEN 'ca-central-1'
            WHEN random() < 0.91 THEN 'ap-south-1'
            WHEN random() < 0.95 THEN 'sa-east-1'
            WHEN random() < 0.98 THEN 'on-premises'
            ELSE 'multi-region'
        END,
        
        -- country_s - Country codes
        CASE 
            WHEN random() < 0.40 THEN 'US'
            WHEN random() < 0.55 THEN 'UK'
            WHEN random() < 0.65 THEN 'DE'
            WHEN random() < 0.73 THEN 'JP'
            WHEN random() < 0.80 THEN 'CA'
            WHEN random() < 0.85 THEN 'AU'
            WHEN random() < 0.90 THEN 'FR'
            WHEN random() < 0.94 THEN 'SG'
            WHEN random() < 0.97 THEN 'IN'
            ELSE 'BR'
        END,
        
        -- created_at - Creation timestamps over past 4 years
        timestamp '2020-01-01' + interval (floor(random() * 1460)) day + 
        interval (floor(random() * 24)) hour + interval (floor(random() * 60)) minute,
        
        -- data_center_s - Data center locations
        CASE 
            WHEN random() < 0.15 THEN 'DC-NYC-01'
            WHEN random() < 0.30 THEN 'DC-SFO-02'
            WHEN random() < 0.40 THEN 'DC-LON-01'
            WHEN random() < 0.50 THEN 'DC-FRA-01'
            WHEN random() < 0.58 THEN 'DC-TOK-01'
            WHEN random() < 0.65 THEN 'DC-SYD-01'
            WHEN random() < 0.72 THEN 'DC-TOR-01'
            WHEN random() < 0.78 THEN 'DC-MIA-01'
            WHEN random() < 0.83 THEN 'DC-CHI-02'
            WHEN random() < 0.88 THEN 'DC-SEA-01'
            WHEN random() < 0.92 THEN 'DC-DUB-01'
            WHEN random() < 0.95 THEN 'DC-SIN-01'
            WHEN random() < 0.98 THEN 'DC-MUM-01'
            ELSE 'DC-SAO-01'
        END,
        
        -- data_quality_score - Realistic quality scores
        CASE 
            WHEN random() < 0.10 THEN round((random() * 2)::DECIMAL(3,2), 2)  -- Poor quality
            WHEN random() < 0.30 THEN round((2 + random() * 1.5)::DECIMAL(3,2), 2)  -- Below average
            WHEN random() < 0.70 THEN round((3.5 + random() * 1)::DECIMAL(3,2), 2)  -- Good quality
            ELSE round((4.5 + random() * 0.5)::DECIMAL(3,2), 2)  -- Excellent quality
        END,
        
        -- dlp_agent_coverage_s - Data Loss Prevention coverage
        CASE 
            WHEN random() < 0.60 THEN 'forcepoint'
            WHEN random() < 0.80 THEN 'symantec'
            WHEN random() < 0.90 THEN 'digital_guardian'
            WHEN random() < 0.95 THEN 'proofpoint'
            WHEN random() < 0.98 THEN 'mcafee'
            ELSE 'not_covered'
        END,
        
        -- domain_s - Corporate domains
        CASE 
            WHEN random() < 0.30 THEN 'corp.company.com'
            WHEN random() < 0.50 THEN 'prod.company.com'
            WHEN random() < 0.65 THEN 'dev.company.com'
            WHEN random() < 0.75 THEN 'test.company.com'
            WHEN random() < 0.83 THEN 'staging.company.com'
            WHEN random() < 0.89 THEN 'qa.company.com'
            WHEN random() < 0.94 THEN 'lab.company.com'
            WHEN random() < 0.97 THEN 'sandbox.company.com'
            ELSE 'demo.company.com'
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
        
        -- first_seen - First discovery timestamps
        timestamp '2018-01-01' + interval (floor(random() * 2190)) day + 
        interval (floor(random() * 24)) hour + interval (floor(random() * 60)) minute,
        
        -- fqdn_s - Fully Qualified Domain Names
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
                WHEN random() < 0.97 THEN 'monitor'
                ELSE 'proxy'
            END,
            lpad(floor(random() * 9999)::VARCHAR, 4, '0'),
            '.',
            CASE 
                WHEN random() < 0.40 THEN 'prod.company.com'
                WHEN random() < 0.65 THEN 'corp.company.com'
                WHEN random() < 0.80 THEN 'dev.company.com'
                WHEN random() < 0.90 THEN 'test.company.com'
                ELSE 'staging.company.com'
            END
        ),
        
        -- host_s - Hostnames
        concat(
            CASE 
                WHEN random() < 0.25 THEN 'srv'
                WHEN random() < 0.45 THEN 'host'
                WHEN random() < 0.60 THEN 'vm'
                WHEN random() < 0.73 THEN 'ws'
                WHEN random() < 0.83 THEN 'db'
                WHEN random() < 0.90 THEN 'web'
                WHEN random() < 0.95 THEN 'app'
                ELSE 'util'
            END,
            '-',
            CASE 
                WHEN random() < 0.30 THEN 'prod'
                WHEN random() < 0.50 THEN 'dev'
                WHEN random() < 0.65 THEN 'test'
                WHEN random() < 0.75 THEN 'stage'
                WHEN random() < 0.83 THEN 'qa'
                WHEN random() < 0.89 THEN 'lab'
                WHEN random() < 0.94 THEN 'demo'
                ELSE 'sandbox'
            END,
            '-',
            lpad(floor(random() * 9999)::VARCHAR, 4, '0')
        ),
        
        -- infrastructure_type_s - Infrastructure types
        CASE 
            WHEN random() < 0.35 THEN 'physical'
            WHEN random() < 0.65 THEN 'vmware'
            WHEN random() < 0.80 THEN 'aws_ec2'
            WHEN random() < 0.90 THEN 'azure_vm'
            WHEN random() < 0.95 THEN 'gcp_compute'
            WHEN random() < 0.98 THEN 'docker_container'
            ELSE 'kubernetes_pod'
        END,
        
        -- ip_address_s - Realistic IP addresses
        CASE 
            WHEN random() < 0.40 THEN concat('10.', floor(random() * 255)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
            WHEN random() < 0.70 THEN concat('172.', (floor(random() * 16) + 16)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
            WHEN random() < 0.85 THEN concat('192.168.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
            ELSE concat((floor(random() * 223) + 1)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', floor(random() * 255)::VARCHAR, '.', (floor(random() * 254) + 1)::VARCHAR)
        END,
        
        -- last_updated - Recent update timestamps
        timestamp '2024-01-01' + interval (floor(random() * 250)) day + 
        interval (floor(random() * 24)) hour + interval (floor(random() * 60)) minute,
        
        -- logging_in_qso_s - QSO logging status
        CASE 
            WHEN random() < 0.65 THEN 'enabled'
            WHEN random() < 0.85 THEN 'disabled'
            WHEN random() < 0.92 THEN 'partial'
            WHEN random() < 0.96 THEN 'error'
            ELSE 'unknown'
        END,
        
        -- logging_in_splunk_s - Splunk logging status
        CASE 
            WHEN random() < 0.70 THEN 'forwarding'
            WHEN random() < 0.85 THEN 'not_forwarding'
            WHEN random() < 0.92 THEN 'heavy_forwarder'
            WHEN random() < 0.96 THEN 'universal_forwarder'
            WHEN random() < 0.98 THEN 'deployment_server'
            ELSE 'indexer'
        END,
        
        -- present_in_cmdb_s - CMDB presence
        CASE 
            WHEN random() < 0.85 THEN 'yes'
            WHEN random() < 0.95 THEN 'no'
            ELSE 'pending'
        END,
        
        -- present_in_crowdstrike_s - CrowdStrike presence
        CASE 
            WHEN random() < 0.75 THEN 'enrolled'
            WHEN random() < 0.88 THEN 'not_enrolled'
            WHEN random() < 0.94 THEN 'pending_enrollment'
            WHEN random() < 0.97 THEN 'installation_failed'
            ELSE 'uninstalled'
        END,
        
        -- region_s - Geographic regions
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
        
        -- source_count - Number of data sources
        CASE 
            WHEN random() < 0.20 THEN 1
            WHEN random() < 0.45 THEN 2
            WHEN random() < 0.65 THEN 3
            WHEN random() < 0.80 THEN 4
            WHEN random() < 0.90 THEN 5
            WHEN random() < 0.95 THEN 6
            WHEN random() < 0.98 THEN 7
            ELSE floor(random() * 5) + 8
        END,
        
        -- source_tables_s - Combination of data sources
        CASE 
            WHEN random() < 0.15 THEN 'cmdb'
            WHEN random() < 0.25 THEN 'crowdstrike'
            WHEN random() < 0.32 THEN 'splunk'
            WHEN random() < 0.38 THEN 'tanium'
            WHEN random() < 0.48 THEN 'cmdb,crowdstrike'
            WHEN random() < 0.56 THEN 'cmdb,splunk'
            WHEN random() < 0.62 THEN 'cmdb,tanium'
            WHEN random() < 0.68 THEN 'crowdstrike,splunk'
            WHEN random() < 0.73 THEN 'cmdb,crowdstrike,splunk'
            WHEN random() < 0.78 THEN 'cmdb,crowdstrike,tanium'
            WHEN random() < 0.83 THEN 'cmdb,splunk,tanium'
            WHEN random() < 0.87 THEN 'crowdstrike,splunk,tanium'
            WHEN random() < 0.91 THEN 'cmdb,crowdstrike,splunk,tanium'
            WHEN random() < 0.94 THEN 'cmdb,ad,splunk'
            WHEN random() < 0.96 THEN 'cmdb,nessus,crowdstrike'
            WHEN random() < 0.98 THEN 'cmdb,lansweeper,tanium'
            ELSE 'cmdb,crowdstrike,splunk,tanium,ad,nessus'
        END,
        
        -- system_classification_s - System environment classification
        CASE 
            WHEN random() < 0.40 THEN 'production'
            WHEN random() < 0.60 THEN 'development'
            WHEN random() < 0.75 THEN 'staging'
            WHEN random() < 0.85 THEN 'test'
            WHEN random() < 0.90 THEN 'quality_assurance'
            WHEN random() < 0.94 THEN 'sandbox'
            WHEN random() < 0.97 THEN 'laboratory'
            ELSE 'demonstration'
        END,
        
        -- tanium_coverage_s - Tanium endpoint management
        CASE 
            WHEN random() < 0.65 THEN 'managed'
            WHEN random() < 0.80 THEN 'unmanaged'
            WHEN random() < 0.88 THEN 'pending_installation'
            WHEN random() < 0.93 THEN 'offline'
            WHEN random() < 0.96 THEN 'quarantined'
            WHEN random() < 0.98 THEN 'maintenance_mode'
            ELSE 'installation_failed'
        END

    FROM generate_series(1, 100000);
    """)
    
    print("Creating indexes for better query performance...")
    
    # Create indexes
    indexes = [
        "CREATE INDEX idx_host_s ON universal_cmdb(host_s)",
        "CREATE INDEX idx_class_s ON universal_cmdb(class_s)",
        "CREATE INDEX idx_business_unit_s ON universal_cmdb(business_unit_s)",
        "CREATE INDEX idx_last_updated ON universal_cmdb(last_updated)",
        "CREATE INDEX idx_infrastructure_type_s ON universal_cmdb(infrastructure_type_s)",
        "CREATE INDEX idx_system_classification_s ON universal_cmdb(system_classification_s)"
    ]
    
    for index_sql in indexes:
        conn.execute(index_sql)
    
    # Show statistics
    print("\nDatabase Statistics:")
    stats = conn.execute("""
        SELECT 
            COUNT(*) as total_rows,
            COUNT(DISTINCT class_s) as unique_classes,
            COUNT(DISTINCT business_unit_s) as unique_business_units,
            COUNT(DISTINCT country_s) as unique_countries,
            COUNT(DISTINCT infrastructure_type_s) as unique_infrastructure_types
        FROM universal_cmdb
    """).fetchone()
    
    print(f"Total rows: {stats[0]:,}")
    print(f"Unique classes: {stats[1]}")
    print(f"Unique business units: {stats[2]}")
    print(f"Unique countries: {stats[3]}")
    print(f"Unique infrastructure types: {stats[4]}")
    
    # Show sample data
    print("\nSample data:")
    sample = conn.execute("SELECT host_s, class_s, business_unit_s, country_s FROM universal_cmdb LIMIT 3").fetchall()
    for row in sample:
        print(f"  {row[0]} | {row[1]} | {row[2]} | {row[3]}")
    
    # Close connection
    conn.close()
    
    # Verify file was created
    if os.path.exists(db_path):
        file_size = os.path.getsize(db_path)
        file_size_mb = file_size / (1024 * 1024)
        
        print(f"\n✅ Database created successfully!")
        print(f"Location: {db_path}")
        print(f"File size: {file_size_mb:.1f} MB")
        print(f"\nTo query the database, run:")
        print(f"python3 -c \"import duckdb; conn = duckdb.connect('{db_path}'); print(conn.execute('SELECT COUNT(*) FROM universal_cmdb').fetchone())\"")
        print(f"\nOr install DuckDB CLI and run:")
        print(f"duckdb {db_path}")
        
        return True
    else:
        print(f"❌ Error: Database file was not created at {db_path}")
        return False

if __name__ == "__main__":
    create_mock_database()