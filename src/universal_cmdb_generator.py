import duckdb
import random
import string
from datetime import datetime, timedelta
import os

# Configuration
DB_PATH = 'universal_cmdb.db'
NUM_ROWS = 100000
BATCH_SIZE = 5000

# Sample data pools
REGIONS = [
    'north america', 'emea', 'apac', 'latam',
    'us-east', 'us-west', 'us-central', 'europe-west', 'europe-north',
    'asia-pacific', 'south-america', 'middle-east', 'africa'
]

COUNTRIES = [
    'United States', 'Canada', 'Mexico', 'United Kingdom', 'Germany', 'France',
    'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic',
    'Japan', 'China', 'India', 'Australia', 'Singapore', 'South Korea',
    'Brazil', 'Argentina', 'Chile', 'Colombia', 'Israel', 'UAE',
    'South Africa', 'Russia', 'Turkey', 'Ireland', 'Portugal'
]

INFRASTRUCTURE_TYPES = [
    'Virtual Machine', 'Physical Server', 'Container', 'Cloud Instance',
    'Database Server', 'Web Server', 'Application Server', 'Storage Array',
    'Network Device', 'Load Balancer', 'Firewall', 'Legacy System',
    'Cloud Service', 'SaaS Application', 'Kubernetes Pod', 'Docker Container',
    'Serverless Function', 'Edge Device', 'IoT Device', 'Workstation'
]

SOURCE_TABLES = [
    'inventory_db', 'asset_mgmt', 'cmdb_primary', 'network_scan',
    'cloud_inventory', 'tanium_data', 'servicenow', 'azure_inventory',
    'aws_inventory', 'gcp_inventory', 'vmware_vcenter', 'active_directory',
    'dns_records', 'dhcp_logs', 'security_scan', 'patch_mgmt',
    'monitoring_system', 'backup_system', 'disaster_recovery', 'compliance_scan'
]

DOMAINS = [
    'corp.company.com', 'prod.company.com', 'dev.company.com', 'test.company.com',
    'staging.company.com', 'dr.company.com', 'cloud.company.com', 'azure.company.com',
    'aws.company.com', 'tdc.company.com', 'fead.company.com', 'internal.local',
    'dmz.company.com', 'external.company.com', 'partner.company.com'
]

DATA_CENTERS = [
    'NYC-DC01', 'NYC-DC02', 'LON-DC01', 'LON-DC02', 'FRA-DC01',
    'TOK-DC01', 'SYD-DC01', 'SIN-DC01', 'CHI-DC01', 'DAL-DC01',
    'SFO-DC01', 'LAX-DC01', 'TOR-DC01', 'PAR-DC01', 'AMS-DC01',
    'AWS-US-EAST-1', 'AWS-US-WEST-2', 'AWS-EU-WEST-1', 'AZURE-EAST-US',
    'AZURE-WEST-EUROPE', 'GCP-US-CENTRAL1', 'GCP-EUROPE-WEST1',
    'COLO-EQUINIX-NY', 'COLO-DIGITAL-REALTY', 'EDGE-LOCATION-01'
]

BUSINESS_UNITS = [
    'Finance', 'HR', 'IT', 'Marketing', 'Sales', 'Operations',
    'Engineering', 'Product', 'Customer Service', 'Legal', 'Compliance',
    'Research', 'Development', 'Security', 'Infrastructure', 'DevOps',
    'Data Science', 'Analytics', 'Supply Chain', 'Manufacturing',
    'Quality Assurance', 'Risk Management', 'Internal Audit', 'Procurement'
]

SYSTEMS = [
    'Windows Server 2019', 'Windows Server 2022', 'Windows Server 2016',
    'Windows 10', 'Windows 11', 'RHEL 8', 'RHEL 9', 'Ubuntu 20.04',
    'Ubuntu 22.04', 'CentOS 7', 'CentOS 8', 'Debian 11', 'SUSE Linux',
    'VMware ESXi 7.0', 'VMware ESXi 8.0', 'Oracle Linux', 'Amazon Linux',
    'Alpine Linux', 'MacOS Monterey', 'MacOS Ventura', 'AIX 7.2',
    'Solaris 11', 'FreeBSD 13', 'Windows Server 2012', 'Windows Server 2008'
]

CIO_NAMES = [
    'John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Williams', 'David Brown',
    'Emily Davis', 'Robert Miller', 'Jennifer Wilson', 'James Moore', 'Maria Garcia',
    'William Taylor', 'Elizabeth Anderson', 'Christopher Thomas', 'Jessica Martinez',
    'Daniel Jackson', 'Amanda White', 'Matthew Harris', 'Ashley Martin', 'Joseph Thompson'
]

CLASSES = [
    'Class 1 - Critical Infrastructure',
    'Class 2 - Production Systems',
    'Class 3 - Development Systems',
    'Class 4 - Test Systems',
    'Class 5 - Non-Critical Systems',
    'Class 6 - Decommissioned',
    'Class 7 - Archive',
    'Class 8 - Disaster Recovery',
    'Class 9 - High Security',
    'Class 10 - Public Facing'
]

def generate_hostname(index):
    """Generate a realistic hostname"""
    prefixes = ['srv', 'vm', 'host', 'node', 'app', 'db', 'web', 'api', 'cache', 'proxy']
    locations = ['nyc', 'lon', 'fra', 'tok', 'syd', 'chi', 'dal', 'sfo', 'ams', 'sin']
    
    prefix = random.choice(prefixes)
    location = random.choice(locations)
    number = str(index).zfill(6)
    
    return f"{prefix}-{location}-{number}"

def generate_ip_address():
    """Generate a random private IP address"""
    octets = [
        random.choice([10, 172, 192]),
        random.randint(0, 255),
        random.randint(0, 255),
        random.randint(1, 254)
    ]
    return '.'.join(map(str, octets))

def generate_mac_address():
    """Generate a random MAC address"""
    mac = [random.randint(0x00, 0xff) for _ in range(6)]
    return ':'.join(map(lambda x: f"{x:02x}", mac))

def create_database():
    """Create the database and table"""
    # Remove existing database if it exists
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")
    
    conn = duckdb.connect(DB_PATH)
    
    # Create table with all columns
    create_table_query = """
    CREATE TABLE universal_cmdb (
        host VARCHAR PRIMARY KEY,
        ip_address VARCHAR,
        mac_address VARCHAR,
        region VARCHAR,
        country VARCHAR,
        infrastructure_type VARCHAR,
        source_tables VARCHAR,
        domain VARCHAR,
        data_center VARCHAR,
        present_in_cmdb VARCHAR,
        tanium_coverage VARCHAR,
        business_unit VARCHAR,
        system VARCHAR,
        cio VARCHAR,
        class VARCHAR,
        created_date TIMESTAMP,
        last_updated TIMESTAMP,
        last_seen TIMESTAMP,
        status VARCHAR,
        environment VARCHAR,
        criticality VARCHAR,
        owner VARCHAR,
        cost_center VARCHAR,
        serial_number VARCHAR,
        asset_tag VARCHAR
    )
    """
    
    conn.execute(create_table_query)
    print("Created table: universal_cmdb")
    
    return conn

def generate_batch(start_index, batch_size):
    """Generate a batch of mock data"""
    batch_data = []
    
    for i in range(start_index, min(start_index + batch_size, NUM_ROWS)):
        # Generate basic fields
        host = generate_hostname(i)
        ip_address = generate_ip_address()
        mac_address = generate_mac_address()
        region = random.choice(REGIONS)
        country = random.choice(COUNTRIES)
        infrastructure_type = random.choice(INFRASTRUCTURE_TYPES)
        
        # Generate source tables (can be multiple, pipe-separated)
        num_sources = random.randint(1, 3)
        source_tables = '|'.join(random.sample(SOURCE_TABLES, num_sources))
        
        # Generate domains (can be multiple, pipe-separated)
        num_domains = random.randint(1, 2)
        domain = '|'.join(random.sample(DOMAINS, num_domains))
        
        data_center = random.choice(DATA_CENTERS)
        
        # CMDB presence (70% chance of being registered)
        present_in_cmdb = 'yes' if random.random() < 0.7 else 'no'
        
        # Tanium coverage (60% chance of having coverage)
        tanium_coverage = 'tanium-deployed' if random.random() < 0.6 else 'not-deployed'
        
        # Business unit (can be multiple, pipe-separated)
        num_bus = random.randint(1, 2)
        business_unit = '|'.join(random.sample(BUSINESS_UNITS, num_bus))
        
        system = random.choice(SYSTEMS)
        
        # CIO (80% chance of having a CIO assigned)
        cio = random.choice(CIO_NAMES) if random.random() < 0.8 else None
        
        class_val = random.choice(CLASSES)
        
        # Generate dates
        created_date = datetime.now() - timedelta(days=random.randint(1, 1095))  # Up to 3 years ago
        last_updated = created_date + timedelta(days=random.randint(0, 365))
        last_seen = datetime.now() - timedelta(days=random.randint(0, 30))
        
        # Additional fields
        status = random.choice(['active', 'inactive', 'maintenance', 'decommissioned'])
        environment = random.choice(['production', 'staging', 'development', 'test', 'qa'])
        criticality = random.choice(['critical', 'high', 'medium', 'low'])
        owner = f"owner-{random.randint(1, 100)}@company.com"
        cost_center = f"CC-{random.randint(1000, 9999)}"
        serial_number = ''.join(random.choices(string.ascii_uppercase + string.digits, k=12))
        asset_tag = f"ASSET-{random.randint(100000, 999999)}"
        
        batch_data.append((
            host, ip_address, mac_address, region, country, infrastructure_type,
            source_tables, domain, data_center, present_in_cmdb, tanium_coverage,
            business_unit, system, cio, class_val, created_date, last_updated,
            last_seen, status, environment, criticality, owner, cost_center,
            serial_number, asset_tag
        ))
    
    return batch_data

def insert_data(conn):
    """Insert mock data in batches"""
    print(f"Generating and inserting {NUM_ROWS} rows in batches of {BATCH_SIZE}...")
    
    insert_query = """
    INSERT INTO universal_cmdb VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    total_inserted = 0
    for start_index in range(0, NUM_ROWS, BATCH_SIZE):
        batch_data = generate_batch(start_index, BATCH_SIZE)
        
        # Insert batch
        conn.executemany(insert_query, batch_data)
        conn.commit()
        
        total_inserted += len(batch_data)
        progress = (total_inserted / NUM_ROWS) * 100
        print(f"Progress: {total_inserted}/{NUM_ROWS} rows ({progress:.1f}%)")
    
    print(f"✅ Successfully inserted {total_inserted} rows")

def verify_data(conn):
    """Verify the inserted data"""
    print("\n📊 Verifying data...")
    
    # Count total rows
    total_rows = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
    print(f"Total rows: {total_rows}")
    
    # Check CMDB presence
    cmdb_stats = conn.execute("""
        SELECT 
            SUM(CASE WHEN present_in_cmdb = 'yes' THEN 1 ELSE 0 END) as registered,
            SUM(CASE WHEN present_in_cmdb = 'no' THEN 1 ELSE 0 END) as not_registered
        FROM universal_cmdb
    """).fetchone()
    print(f"CMDB registered: {cmdb_stats[0]}, Not registered: {cmdb_stats[1]}")
    
    # Check Tanium coverage
    tanium_stats = conn.execute("""
        SELECT 
            SUM(CASE WHEN tanium_coverage = 'tanium-deployed' THEN 1 ELSE 0 END) as deployed,
            SUM(CASE WHEN tanium_coverage = 'not-deployed' THEN 1 ELSE 0 END) as not_deployed
        FROM universal_cmdb
    """).fetchone()
    print(f"Tanium deployed: {tanium_stats[0]}, Not deployed: {tanium_stats[1]}")
    
    # Check region distribution
    region_stats = conn.execute("""
        SELECT region, COUNT(*) as count
        FROM universal_cmdb
        GROUP BY region
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()
    print("\nTop 5 regions:")
    for region, count in region_stats:
        print(f"  {region}: {count}")
    
    # Check infrastructure types
    infra_stats = conn.execute("""
        SELECT infrastructure_type, COUNT(*) as count
        FROM universal_cmdb
        GROUP BY infrastructure_type
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()
    print("\nTop 5 infrastructure types:")
    for infra_type, count in infra_stats:
        print(f"  {infra_type}: {count}")
    
    # Check business units
    bu_stats = conn.execute("""
        SELECT COUNT(DISTINCT business_unit) as unique_bus
        FROM universal_cmdb
    """).fetchone()
    print(f"\nUnique business unit combinations: {bu_stats[0]}")
    
    # Sample data
    print("\n📝 Sample data (first 3 rows):")
    sample_data = conn.execute("""
        SELECT host, region, infrastructure_type, present_in_cmdb, tanium_coverage
        FROM universal_cmdb
        LIMIT 3
    """).fetchall()
    for row in sample_data:
        print(f"  Host: {row[0]}, Region: {row[1]}, Type: {row[2]}, CMDB: {row[3]}, Tanium: {row[4]}")

def create_indexes(conn):
    """Create indexes for better query performance"""
    print("\n🔧 Creating indexes...")
    
    indexes = [
        "CREATE INDEX idx_region ON universal_cmdb(region)",
        "CREATE INDEX idx_country ON universal_cmdb(country)",
        "CREATE INDEX idx_infrastructure_type ON universal_cmdb(infrastructure_type)",
        "CREATE INDEX idx_business_unit ON universal_cmdb(business_unit)",
        "CREATE INDEX idx_present_in_cmdb ON universal_cmdb(present_in_cmdb)",
        "CREATE INDEX idx_tanium_coverage ON universal_cmdb(tanium_coverage)",
        "CREATE INDEX idx_data_center ON universal_cmdb(data_center)",
        "CREATE INDEX idx_system ON universal_cmdb(system)",
        "CREATE INDEX idx_status ON universal_cmdb(status)",
        "CREATE INDEX idx_environment ON universal_cmdb(environment)"
    ]
    
    for index_query in indexes:
        conn.execute(index_query)
    
    print(f"Created {len(indexes)} indexes")

def main():
    """Main function to generate mock data"""
    print("🚀 Universal CMDB Mock Data Generator")
    print("=" * 50)
    
    try:
        # Create database and table
        conn = create_database()
        
        # Insert mock data
        insert_data(conn)
        
        # Create indexes
        create_indexes(conn)
        
        # Verify data
        verify_data(conn)
        
        # Close connection
        conn.close()
        
        print("\n✅ Mock data generation completed successfully!")
        print(f"Database file: {DB_PATH}")
        print(f"Total size: {os.path.getsize(DB_PATH) / (1024*1024):.2f} MB")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    main()