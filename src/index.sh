#!/bin/bash

# =====================================
# LOG LENS - Quick Start Script
# For existing Next.js project
# =====================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}    LOG LENS - Quick Start for Existing App    ${NC}"
echo -e "${BLUE}================================================${NC}"

# Step 1: Setup Python Backend
echo -e "\n${YELLOW}[1/5] Setting up Python backend...${NC}"

# Create backend directory if it doesn't exist
mkdir -p backend
cd backend

# Check if venv exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --quiet flask flask-cors duckdb

# Step 2: Create database if it doesn't exist
if [ ! -f "universal_cmdb.db" ]; then
    echo -e "\n${YELLOW}[2/5] Creating database with 262,032 records...${NC}"
    
    python3 << 'PYTHON_EOF'
import duckdb
print("Creating database...")
conn = duckdb.connect('universal_cmdb.db')

conn.execute("""
CREATE TABLE universal_cmdb (
    host_s VARCHAR, fqdn_s VARCHAR, region_s VARCHAR, country_s VARCHAR,
    business_unit_s VARCHAR, cio_s VARCHAR, infrastructure_type_s VARCHAR,
    class_s VARCHAR, system_classification_s VARCHAR, source_tables_s VARCHAR,
    domain_s VARCHAR, present_in_cmdb_s VARCHAR, tanium_coverage_s VARCHAR,
    edr_coverage_s VARCHAR, dlp_agent_coverage_s VARCHAR,
    logging_in_splunk_s VARCHAR, logging_in_qso_s VARCHAR,
    data_quality_score DECIMAL(4,2), source_count INTEGER,
    last_updated TIMESTAMP
)
""")

print("Generating 262,032 records (this may take 30-60 seconds)...")
conn.execute("""
INSERT INTO universal_cmdb
SELECT
    'host-' || (100000 + rowid)::VARCHAR,
    'server' || rowid::VARCHAR || '.company.com',
    CASE WHEN random() < 0.40 THEN 'North America'
         WHEN random() < 0.60 THEN 'EMEA'
         WHEN random() < 0.80 THEN 'Asia Pacific'
         ELSE 'Latin America' END,
    CASE WHEN random() < 0.35 THEN 'United States'
         WHEN random() < 0.50 THEN 'United Kingdom'
         WHEN random() < 0.65 THEN 'Germany'
         WHEN random() < 0.75 THEN 'Japan'
         WHEN random() < 0.85 THEN 'Singapore'
         ELSE 'Australia' END,
    CASE WHEN random() < 0.30 THEN 'Merchant Solutions'
         WHEN random() < 0.50 THEN 'Card Services'
         WHEN random() < 0.65 THEN 'Digital Banking'
         WHEN random() < 0.80 THEN 'Enterprise Services'
         ELSE 'Risk & Compliance' END,
    'CIO-' || ['ALPHA','BETA','GAMMA','DELTA','OMEGA'][floor(random()*5)+1],
    CASE WHEN random() < 0.642 THEN 'On-Premise'
         WHEN random() < 0.834 THEN 'Cloud'
         WHEN random() < 0.943 THEN 'SaaS'
         ELSE 'API' END,
    'class' || (floor(random()*5)+1)::VARCHAR,
    CASE WHEN random() < 0.259 THEN 'Windows'
         WHEN random() < 0.557 THEN 'Linux'
         WHEN random() < 0.630 THEN 'Network'
         WHEN random() < 0.804 THEN 'Container'
         ELSE 'Cloud' END,
    'cmdb,splunk',
    CASE WHEN random() < 0.35 THEN 'tdc.company.com'
         WHEN random() < 0.65 THEN 'lead.company.com'
         ELSE 'corp.company.com' END,
    CASE WHEN random() < 0.287 THEN 'yes' ELSE 'no' END,
    CASE WHEN random() < 0.753 THEN 'managed' ELSE 'unmanaged' END,
    CASE WHEN random() < 0.872 THEN 'protected' ELSE 'not_protected' END,
    CASE WHEN random() < 0.628 THEN 'covered' ELSE 'not_covered' END,
    CASE WHEN random() < 0.1917 THEN 'forwarding' ELSE 'not_forwarding' END,
    CASE WHEN random() < 0.6393 THEN 'enabled' ELSE 'disabled' END,
    round((random() * 4 + 1)::DECIMAL(4,2), 2),
    floor(random() * 5) + 1,
    current_timestamp
FROM generate_series(1, 262032) AS s(rowid);
""")

conn.close()
print("✓ Database created successfully!")
PYTHON_EOF
else
    echo -e "${GREEN}✓ Database already exists${NC}"
fi

# Step 3: Create Flask API server
echo -e "\n${YELLOW}[3/5] Creating Flask API server...${NC}"

cat > app.py << 'EOF'
from flask import Flask, jsonify
from flask_cors import CORS
import duckdb

app = Flask(__name__)
CORS(app)

@app.route('/api/global-view')
def global_view():
    conn = duckdb.connect('universal_cmdb.db', read_only=True)
    result = conn.execute("""
        SELECT 
            COUNT(*) as total_assets,
            COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as splunk_assets,
            COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) as cmdb_assets,
            COUNT(CASE WHEN edr_coverage_s = 'protected' THEN 1 END) as edr_assets,
            ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as splunk_coverage,
            ROUND((COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) * 100.0 / COUNT(*)), 2) as cmdb_coverage,
            ROUND((COUNT(CASE WHEN edr_coverage_s = 'protected' THEN 1 END) * 100.0 / COUNT(*)), 2) as edr_coverage
        FROM universal_cmdb
    """).fetchone()
    conn.close()
    
    return jsonify({
        'total_assets': result[0],
        'splunk_assets': result[1],
        'cmdb_assets': result[2],
        'edr_assets': result[3],
        'splunk_coverage': float(result[4]),
        'cmdb_coverage': float(result[5]),
        'edr_coverage': float(result[6]),
        'csoc_coverage': 19.17
    })

@app.route('/api/infrastructure-view')
def infrastructure_view():
    conn = duckdb.connect('universal_cmdb.db', read_only=True)
    result = conn.execute("""
        SELECT 
            infrastructure_type_s,
            COUNT(*) as total_assets,
            COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as visible_assets,
            COUNT(CASE WHEN edr_coverage_s = 'protected' THEN 1 END) as edr_protected
        FROM universal_cmdb
        GROUP BY infrastructure_type_s
        ORDER BY total_assets DESC
    """).fetchall()
    conn.close()
    
    data = []
    for row in result:
        total = row[1]
        visible = row[2]
        protected = row[3]
        data.append({
            'infrastructure_type_s': row[0],
            'total_assets': total,
            'visible_assets': visible,
            'edr_protected': protected,
            'visibility_percentage': round(visible * 100.0 / total, 2) if total > 0 else 0,
            'edr_coverage_pct': round(protected * 100.0 / total, 2) if total > 0 else 0
        })
    
    return jsonify(data)

@app.route('/api/regional-view')
def regional_view():
    conn = duckdb.connect('universal_cmdb.db', read_only=True)
    result = conn.execute("""
        SELECT 
            region_s, country_s,
            COUNT(*) as total_assets,
            COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as visible_assets,
            COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) as in_cmdb
        FROM universal_cmdb
        GROUP BY region_s, country_s
        ORDER BY region_s, total_assets DESC
        LIMIT 20
    """).fetchall()
    conn.close()
    
    data = []
    for row in result:
        total = row[2]
        visible = row[3]
        cmdb = row[4]
        data.append({
            'region_s': row[0],
            'country_s': row[1],
            'total_assets': total,
            'visible_assets': visible,
            'in_cmdb': cmdb,
            'visibility_percentage': round(visible * 100.0 / total, 2) if total > 0 else 0,
            'cmdb_coverage_pct': round(cmdb * 100.0 / total, 2) if total > 0 else 0
        })
    
    return jsonify(data)

@app.route('/api/business-unit-view')
def business_unit_view():
    conn = duckdb.connect('universal_cmdb.db', read_only=True)
    result = conn.execute("""
        SELECT 
            business_unit_s, MAX(cio_s) as cio_s,
            COUNT(*) as total_assets,
            COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as log_forwarding
        FROM universal_cmdb
        GROUP BY business_unit_s
        ORDER BY total_assets DESC
    """).fetchall()
    conn.close()
    
    data = []
    for row in result:
        total = row[2]
        forwarding = row[3]
        data.append({
            'business_unit_s': row[0],
            'cio_s': row[1],
            'total_assets': total,
            'log_forwarding': forwarding,
            'logging_visibility_pct': round(forwarding * 100.0 / total, 2) if total > 0 else 0
        })
    
    return jsonify(data)

if __name__ == '__main__':
    print("\n" + "="*50)
    print("Flask API Server Running")
    print("="*50)
    print("Endpoints available:")
    print("  http://localhost:5000/api/global-view")
    print("  http://localhost:5000/api/infrastructure-view")
    print("  http://localhost:5000/api/regional-view")
    print("  http://localhost:5000/api/business-unit-view")
    print("="*50 + "\n")
    app.run(debug=False, host='0.0.0.0', port=5000)
EOF

cd ..  # Back to project root

# Step 4: Update Next.js configuration
echo -e "\n${YELLOW}[4/5] Configuring Next.js...${NC}"

# Update next.config.js to proxy API requests
if [ ! -f "next.config.js" ]; then
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
EOF
fi

# Step 5: Create run script
echo -e "\n${YELLOW}[5/5] Creating run script...${NC}"

cat > run.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Starting Log Lens Dashboard...${NC}"

# Kill any existing Python processes on port 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

# Start Python backend
echo -e "${YELLOW}Starting Python API server...${NC}"
cd backend
source venv/bin/activate
python3 app.py &
PYTHON_PID=$!
cd ..

# Wait for Python server
sleep 2

# Check if Python server started
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Python API server started${NC}"
else
    echo -e "${RED}✗ Failed to start Python API server${NC}"
    exit 1
fi

# Start Next.js
echo -e "${YELLOW}Starting Next.js frontend...${NC}"
npm run dev &
NEXT_PID=$!

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}    LOG LENS DASHBOARD IS RUNNING!             ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend API:${NC} http://localhost:5000"
echo ""
echo -e "${YELLOW}Test API endpoints:${NC}"
echo "  curl http://localhost:5000/api/global-view"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
trap "echo 'Stopping services...'; kill $PYTHON_PID $NEXT_PID 2>/dev/null; exit" INT TERM
wait
EOF

chmod +x run.sh

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}    SETUP COMPLETE!                            ${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${YELLOW}Database created with 262,032 records${NC}"
echo ""
echo -e "${BLUE}To run the application:${NC}"
echo -e "  ${GREEN}./run.sh${NC}"
echo ""
echo -e "${BLUE}Or run services separately:${NC}"
echo -e "  Terminal 1: ${GREEN}cd backend && source venv/bin/activate && python3 app.py${NC}"
echo -e "  Terminal 2: ${GREEN}npm run dev${NC}"
echo ""
echo -e "${BLUE}Dashboard will be available at:${NC}"
echo -e "  ${GREEN}http://localhost:3000${NC}"
echo ""

# Start the application automatically
read -p "Start the application now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./run.sh
fi