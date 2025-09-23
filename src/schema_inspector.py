import duckdb
import os

def inspect_existing_database():
    """Inspect the existing database schema to understand the actual column structure"""
    
    db_files = ['universal_cmdb.db', './universal_cmdb.db']
    
    for db_file in db_files:
        if os.path.exists(db_file):
            print(f"Found database: {db_file}")
            try:
                conn = duckdb.connect(db_file, read_only=True)
                
                # Show all tables
                tables = conn.execute("SHOW TABLES").fetchall()
                print(f"Tables found: {tables}")
                
                # Describe the universal_cmdb table structure
                try:
                    schema = conn.execute("DESCRIBE universal_cmdb").fetchall()
                    print("\nCurrent table schema:")
                    print("-" * 50)
                    for col_name, col_type, null, key, default, extra in schema:
                        print(f"{col_name:<30} {col_type:<15} {null}")
                    
                    # Show a few sample records
                    sample = conn.execute("SELECT * FROM universal_cmdb LIMIT 3").fetchall()
                    print(f"\nSample records (showing {len(sample)} rows):")
                    print("-" * 50)
                    
                    # Get column names for header
                    columns = [desc[0] for desc in schema]
                    print(" | ".join(columns))
                    print("-" * 50)
                    
                    for row in sample:
                        print(" | ".join(str(cell)[:20] + "..." if len(str(cell)) > 20 else str(cell) for cell in row))
                    
                    # Get row count
                    count = conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
                    print(f"\nTotal records: {count:,}")
                    
                    conn.close()
                    return columns
                    
                except Exception as e:
                    print(f"Error reading table structure: {e}")
                    conn.close()
                    
            except Exception as e:
                print(f"Error connecting to database: {e}")
    
    print("No existing database found or unable to read schema")
    return None

if __name__ == "__main__":
    inspect_existing_database()