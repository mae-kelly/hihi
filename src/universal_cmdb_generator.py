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
    'North America', 'EMEA', 'APAC', 'LATAM',
    'US East', 'US West', 'Europe', 'Asia', 'Middle East', 'Africa'
]

COUNTRIES = [
    'United States', 'Canada', 'United Kingdom', 'Germany', 'France',
    'Japan', 'China', 'India', 'Australia', 'Brazil', 'Mexico'
]

INFRASTRUCTURE_TYPES = [
    'On-Premise', 'Cloud', 'SaaS', 'Virtual Machine', 'Physical Server',
    'Container', 'Database Server', 'Web Server', 'Application Server',
    'Network Device', 'Load Balancer', 'Firewall', 'API Gateway'
]

BUSINESS_UNITS = [
    'Finance', 'HR', 'IT', 'Marketing', 'Sales', 'Operations',
    'Engineering', 'Product', 'Customer Service', 'Legal'
]

SYSTEMS = [
    'Windows Server 2019', 'Windows Server 2022', 'RHEL 8', 'Ubuntu 20.04',
    'Ubuntu 22.04', 'CentOS 7', 'VMware ESXi 7.0', 'Amazon Linux'
]

CIO_NAMES = [
    'John Smith', 'Jane Doe', 'Michael Johnson', 'Sarah Williams',
    'David Brown', 'Emily Davis', 'Robert Miller', 'Jennifer Wilson'
]

def generate_unique_hostname(index, used_hosts):
    """Generate a unique hostname"""
    while True:
        if random.random() < 0.3 and index > 1000:  # Some URLs after initial batch
            subdomains = ['app', 'api', 'web', 'portal', 'service', 'admin', 'data', 'secure']
            domains = ['company.com', 'internal.net', 'corp.local', 'cloud.io']
            host = f"https://{random.choice(subdomains)}{random.randint(1,999)}.{random.choice(domains)}"
        else:
            prefixes = ['srv', 'vm', 'host', 'node', 'app', 'db', 'web', 'api', 'cache', 'proxy']
            locations = ['nyc', 'lon', 'fra', 'tok', 'syd', 'chi', 'dal', 'sfo', 'ams', 'sin']
            number = str(index + random.randint(1, 10000)).zfill(6)
            host = f"{random.choice(prefixes)}-{random.choice(locations)}-{number}"
        
        if host not in used_hosts:
            used_hosts.add(host)
            return host

def create_database():
    """Create the database and table"""
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"Removed existing database: {DB_PATH}")
    
    conn = duckdb.connect(DB_PATH)
    
    create_table_query = """
    CREATE TABLE universal_cmdb (
        host VARCHAR PRIMARY KEY,
        region VARCHAR,
        country VARCHAR,
        infrastructure_type VARCHAR,
        source_tables VARCHAR,
        domain VARCHAR,
        data_center VARCHAR,
        cloud_region VARCHAR,
        present_in_cmdb VARCHAR,
        tanium_coverage VARCHAR,
        logging_in_splunk VARCHAR,
        logging_in_gso VARCHAR,
        presence_in_crowdstrike VARCHAR,
        dlp_agent_coverage VARCHAR,
        ssc_coverage VARCHAR,
        business_unit VARCHAR,
        system VARCHAR,
        system_classification VARCHAR,
        cio VARCHAR,
        class VARCHAR
    )
    """
    
    conn.execute(create_table_query)
    print("Created table: universal_cmdb")
    
    return conn

def generate_batch(start_index, batch_size, used_hosts):
    """Generate a batch of mock data"""
    batch_data = []
    
    for i in range(start_index, min(start_index + batch_size, NUM_ROWS)):
        host = generate_unique_hostname(i, used_hosts)
        region = random.choice(REGIONS)
        country = random.choice(COUNTRIES)
        
        # Infrastructure type - single value
        infrastructure_type = random.choice(INFRASTRUCTURE_TYPES)
        
        # Source tables - pipe separated
        num_sources = random.randint(1, 3)
        source_tables = '|'.join([f"source_{j}" for j in range(num_sources)])
        
        # Domain - important for domain visibility
        domain_choice = random.random()
        if domain_choice < 0.3:
            domain = '1dc.company.com'
        elif domain_choice < 0.6:
            domain = 'fead.company.com'
        elif domain_choice < 0.8:
            domain = '1dc|fead'  # Both domains
        else:
            domain = 'other.company.com'
        
        # Data center
        data_center = f"DC-{random.choice(['NYC', 'LON', 'TOK', 'SYD'])}-{random.randint(1,3)}"
        
        # Cloud region - can be empty or pipe-separated
        if random.random() < 0.4:
            cloud_regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1']
            cloud_region = '|'.join(random.sample(cloud_regions, random.randint(1, 2)))
        else:
            cloud_region = ''
        
        # CMDB presence - YES/NO for compatibility
        present_in_cmdb = 'yes' if random.random() < 0.65 else 'no'
        
        # Tanium coverage
        tanium_coverage = 'tanium-deployed' if random.random() < 0.55 else 'not-deployed'
        
        # Logging platforms - IMPORTANT for compliance matrix
        logging_in_splunk = 'yes' if random.random() < 0.5 else 'no'
        logging_in_gso = 'yes' if random.random() < 0.4 else 'no'
        
        # Security controls
        presence_in_crowdstrike = 'yes' if random.random() < 0.6 else 'no'
        dlp_agent_coverage = 'dlp-installed' if random.random() < 0.45 else 'no'
        ssc_coverage = 'covered' if random.random() < 0.5 else ''
        
        # Business unit - single or pipe-separated
        num_bus = random.randint(1, 2)
        business_unit = '|'.join(random.sample(BUSINESS_UNITS, num_bus))
        
        system = random.choice(SYSTEMS)
        
        # System classification
        system_classification = f"{system.split()[0]}|Production"
        
        # CIO
        cio = random.choice(CIO_NAMES) if random.random() < 0.75 else ''
        
        # Class
        class_val = f"Class {random.randint(1, 10)}"
        
        batch_data.append((
            host, region, country, infrastructure_type, source_tables,
            domain, data_center, cloud_region, present_in_cmdb, tanium_coverage,
            logging_in_splunk, logging_in_gso, presence_in_crowdstrike,
            dlp_agent_coverage, ssc_coverage, business_unit, system,
            system_classification, cio, class_val
        ))
    
    return batch_data

def insert_data(conn):
    """Insert mock data in batches"""
    print(f"Generating and inserting {NUM_ROWS} rows...")
    
    insert_query = """
    INSERT INTO universal_cmdb VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """
    
    used_hosts = set()
    total_inserted = 0
    
    for start_index in range(0, NUM_ROWS, BATCH_SIZE):
        batch_data = generate_batch(start_index, BATCH_SIZE, used_hosts)
        
        conn.executemany(insert_query, batch_data)
        conn.commit()
        
        total_inserted += len(batch_data)
        progress = (total_inserted / NUM_ROWS) * 100
        print(f"Progress: {total_inserted}/{NUM_ROWS} rows ({progress:.1f}%)")
    
    print(f"✅ Successfully inserted {total_inserted} rows")

def verify_data(conn):
    """Verify the data matches what Flask API expects"""
    print("\n📊 Data Summary:")
    
    # Total rows
    total = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
    print(f"Total assets: {total}")
    
    # CMDB Coverage
    cmdb = conn.execute("""
        SELECT 
            COUNT(CASE WHEN present_in_cmdb = 'yes' THEN 1 END) as registered,
            ROUND(COUNT(CASE WHEN present_in_cmdb = 'yes' THEN 1 END) * 100.0 / COUNT(*), 2) as percentage
        FROM universal_cmdb
    """).fetchone()
    print(f"CMDB Coverage: {cmdb[0]} assets ({cmdb[1]}%)")
    
    # Tanium Coverage  
    tanium = conn.execute("""
        SELECT 
            COUNT(CASE WHEN tanium_coverage LIKE '%tanium%' THEN 1 END) as deployed,
            ROUND(COUNT(CASE WHEN tanium_coverage LIKE '%tanium%' THEN 1 END) * 100.0 / COUNT(*), 2) as percentage
        FROM universal_cmdb
    """).fetchone()
    print(f"Tanium Coverage: {tanium[0]} assets ({tanium[1]}%)")
    
    # Logging Compliance
    logging = conn.execute("""
        SELECT 
            COUNT(CASE WHEN logging_in_splunk = 'yes' THEN 1 END) as splunk,
            COUNT(CASE WHEN logging_in_gso = 'yes' THEN 1 END) as gso,
            COUNT(CASE WHEN logging_in_splunk = 'yes' AND logging_in_gso = 'yes' THEN 1 END) as both
        FROM universal_cmdb
    """).fetchone()
    print(f"Logging: Splunk={logging[0]}, GSO={logging[1]}, Both={logging[2]}")
    
    # Domain Distribution
    domains = conn.execute("""
        SELECT 
            COUNT(CASE WHEN domain LIKE '%1dc%' THEN 1 END) as tdc,
            COUNT(CASE WHEN domain LIKE '%fead%' THEN 1 END) as fead
        FROM universal_cmdb
    """).fetchone()
    print(f"Domains: 1DC={domains[0]}, FEAD={domains[1]}")
    
    # Regional Distribution
    print("\nTop Regions:")
    regions = conn.execute("""
        SELECT region, COUNT(*) as count
        FROM universal_cmdb
        GROUP BY region
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()
    for region, count in regions:
        print(f"  {region}: {count}")
    
    # Infrastructure Types
    print("\nTop Infrastructure Types:")
    infra = conn.execute("""
        SELECT infrastructure_type, COUNT(*) as count
        FROM universal_cmdb
        GROUP BY infrastructure_type
        ORDER BY count DESC
        LIMIT 5
    """).fetchall()
    for infra_type, count in infra:
        print(f"  {infra_type}: {count}")

def create_indexes(conn):
    """Create indexes for performance"""
    print("\n🔧 Creating indexes...")
    
    indexes = [
        "CREATE INDEX idx_region ON universal_cmdb(region)",
        "CREATE INDEX idx_infrastructure_type ON universal_cmdb(infrastructure_type)",
        "CREATE INDEX idx_present_in_cmdb ON universal_cmdb(present_in_cmdb)",
        "CREATE INDEX idx_tanium_coverage ON universal_cmdb(tanium_coverage)",
        "CREATE INDEX idx_domain ON universal_cmdb(domain)",
        "CREATE INDEX idx_business_unit ON universal_cmdb(business_unit)"
    ]
    
    for idx in indexes:
        conn.execute(idx)
    
    print(f"Created {len(indexes)} indexes")

def main():
    print("🚀 Universal CMDB Data Generator")
    print("=" * 50)
    
    try:
        conn = create_database()
        insert_data(conn)
        create_indexes(conn)
        verify_data(conn)
        conn.close()
        
        print("\n✅ Database created successfully!")
        print(f"📁 File: {DB_PATH}")
        print(f"📊 Size: {os.path.getsize(DB_PATH) / (1024*1024):.2f} MB")
        print("\n🎯 Ready for Flask API at http://localhost:5000")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    main()