import json
import duckdb
import os
import re
from google.cloud import bigquery
from google.oauth2 import service_account
from typing import Dict, List, Set, Tuple, Optional
import logging
from collections import defaultdict
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import platform
import subprocess

logging.basicConfig(level=logging.INFO, format='%(asctime)s | %(message)s', datefmt='%H:%M:%S')
logger = logging.getLogger(__name__)

class OptimizedCMDBProcessor:
    def __init__(self, json_file_path: str, duckdb_path: str = "universal_cmdb.db"):
        print("\n" + "=" * 80)
        print("OPTIMIZED CMDB PROCESSOR - ENHANCED VERSION")
        print("=" * 80 + "\n")
        
        self.json_file_path = json_file_path
        self.duckdb_path = duckdb_path
        self.db_lock = threading.Lock()
        
        self.column_mapping = {
            'fqdn': 'fqdn', 'domain': 'domain', 'host': 'host',
            'hostname': 'host', 'infrastructure_type': 'infrastructure_type',
            'infra_type': 'infrastructure_type', 'region': 'region',
            'country': 'country', 'data_center': 'data_center',
            'datacenter': 'data_center', 'cloud_region': 'cloud_region',
            'ip_address': 'ip_address', 'ip': 'ip_address', 'class': 'class',
            'system_classification': 'system_classification',
            'business_unit': 'business_unit', 'bu': 'business_unit',
            'apm': 'apm', 'cio': 'cio', 'edr_coverage': 'edr_coverage',
            'tanium_coverage': 'tanium_coverage',
            'dlp_agent_coverage': 'dlp_agent_coverage',
            'logging_in_splunk': 'logging_in_splunk',
            'logging_in_gso': 'logging_in_gso'
        }
        
        self.hostname_patterns = [
            'host', 'hostname', 'fqdn', 'server_name', 'node_name', 'device_name',
            'endpoint_name', 'splunk_host', 'app_host', 'computer_name', 'machine_name',
            'chronicle_device_hostname', 'endpointdomain_name', 'asset_name'
        ]
        
        self.advanced_patterns = {
            'business_unit': ['business_unit', 'bu', 'business', 'department', 'division', 'org_unit'],
            'region': ['region', 'location', 'site', 'area', 'zone', 'geographic_region'],
            'country': ['country', 'nation', 'country_code', 'geo_country'],
            'infrastructure_type': ['infrastructure_type', 'infra_type', 'server_type', 'system_type', 'platform', 'environment', 'env'],
            'data_center': ['datacenter', 'data_center', 'dc', 'facility', 'center'],
            'cloud_region': ['cloud_region', 'aws_region', 'azure_region', 'gcp_region'],
            'ip_address': ['ip_address', 'ip', 'ipv4', 'ipv6', 'host_ip'],
            'class': ['class', 'classification', 'tier', 'level'],
            'system_classification': ['system_classification', 'security_classification'],
            'apm': ['apm', 'monitoring', 'application_monitoring'],
            'cio': ['cio', 'owner', 'responsible', 'contact'],
            'edr_coverage': ['edr_coverage', 'edr', 'endpoint_detection'],
            'tanium_coverage': ['tanium_coverage', 'tanium', 'tanium_agent'],
            'dlp_agent_coverage': ['dlp_agent_coverage', 'dlp', 'data_loss_prevention'],
            'logging_in_splunk': ['logging_in_splunk', 'splunk', 'splunk_logging'],
            'logging_in_gso': ['logging_in_gso', 'gso', 'gso_logging'],
            'domain': ['domain', 'dns_domain', 'ad_domain'],
            'fqdn': ['fqdn', 'full_name', 'qualified_name']
        }
        
        self.stats = defaultdict(int)
        self.existing_hosts = {}
        
        self._init_bigquery()
        self.duck_conn = duckdb.connect(duckdb_path)
        self._create_table()
        self._load_existing_hosts()
        
        print(f"Loaded {len(self.existing_hosts)} existing hosts\n")
    
    def _init_bigquery(self):
        service_account_file = os.getenv('GCP_SERVICE_ACCOUNT_FILE', 'gcp/gcp_prod_key.json')
        if os.path.exists(service_account_file):
            credentials = service_account.Credentials.from_service_account_file(service_account_file)
            self.bq_client = bigquery.Client(project="chronicle-fisv", credentials=credentials)
        else:
            self.bq_client = bigquery.Client(project="chronicle-fisv")
    
    def _create_table(self):
        create_sql = """
        CREATE TABLE IF NOT EXISTS universal_cmdb (
            host VARCHAR PRIMARY KEY,
            source_tables TEXT,
            fqdn TEXT,
            domain TEXT,
            infrastructure_type TEXT,
            region TEXT,
            country TEXT,
            data_center TEXT,
            cloud_region TEXT,
            ip_address TEXT,
            class TEXT,
            system_classification TEXT,
            business_unit TEXT,
            apm TEXT,
            cio TEXT,
            edr_coverage TEXT,
            tanium_coverage TEXT,
            dlp_agent_coverage TEXT,
            logging_in_splunk TEXT,
            logging_in_gso TEXT,
            present_in_crowdstrike TEXT,
            present_in_cmdb TEXT,
            data_quality_score FLOAT DEFAULT 1.0,
            source_count INTEGER DEFAULT 1,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        """
        self.duck_conn.execute(create_sql)
        
        try:
            self.duck_conn.execute("CREATE INDEX IF NOT EXISTS idx_host ON universal_cmdb(host)")
        except:
            pass
    
    def _load_existing_hosts(self):
        try:
            query = """
            SELECT host, source_tables, fqdn, domain,
                   infrastructure_type, region, country, data_center, cloud_region,
                   ip_address, class, system_classification, business_unit, apm,
                   cio, edr_coverage, tanium_coverage, dlp_agent_coverage,
                   logging_in_splunk, logging_in_gso, present_in_crowdstrike,
                   present_in_cmdb, source_count
            FROM universal_cmdb
            """
            for row in self.duck_conn.execute(query).fetchall():
                self.existing_hosts[row[0]] = {
                    'source_tables': row[1],
                    'fqdn': row[2],
                    'domain': row[3],
                    'infrastructure_type': row[4],
                    'region': row[5],
                    'country': row[6],
                    'data_center': row[7],
                    'cloud_region': row[8],
                    'ip_address': row[9],
                    'class': row[10],
                    'system_classification': row[11],
                    'business_unit': row[12],
                    'apm': row[13],
                    'cio': row[14],
                    'edr_coverage': row[15],
                    'tanium_coverage': row[16],
                    'dlp_agent_coverage': row[17],
                    'logging_in_splunk': row[18],
                    'logging_in_gso': row[19],
                    'present_in_crowdstrike': row[20],
                    'present_in_cmdb': row[21],
                    'source_count': row[22]
                }
        except:
            pass
    
    def normalize_hostname(self, hostname: str) -> str:
        """Normalize hostname for use as primary key"""
        if not hostname or not isinstance(hostname, str) or hostname.strip() == '*Undefined':
            return ""
        normalized = hostname.lower().strip()
        if '.' in normalized:
            normalized = normalized.split('.')[0]
        normalized = normalized.replace('-', '')
        normalized = re.sub(r'[^a-z0-9]', '', normalized)
        return normalized if len(normalized) > 1 else ""
    
    def normalize_fqdn(self, fqdn: str) -> str:
        """Normalize FQDN by converting to lowercase"""
        if not fqdn or not isinstance(fqdn, str) or fqdn.strip() == '*Undefined':
            return ""
        return fqdn.lower().strip()
    
    def normalize_region(self, region: str) -> str:
        """Normalize region values"""
        if not region or not isinstance(region, str):
            return region
        
        region = region.strip().lower()  # Apply lowercase here
        # Convert NA to North America (but lowercase)
        if region.upper() in ['NA', 'N.A.', 'N/A']:
            return 'north america'
        elif region == 'north america':
            return 'north america'
        return region
    
    def normalize_country(self, country: str) -> str:
        """Normalize country values"""
        if not country or not isinstance(country, str):
            return country
        
        country = country.strip().lower()  # Apply lowercase here
        # Convert USA to United States (but lowercase)
        if country.upper() in ['USA', 'U.S.A.', 'US', 'U.S.']:
            return 'united states'
        elif country == 'united states':
            return 'united states'
        return country
    
    def normalize_value(self, value: str) -> str:
        """Normalize any string value by converting to lowercase"""
        if not value or not isinstance(value, str):
            return value
        return value.strip().lower()
    
    def is_valid_value(self, value) -> bool:
        if not value:
            return False
        if isinstance(value, str):
            stripped = value.strip()
            return stripped != '' and stripped != '*Undefined' and stripped.lower() not in ['null', 'none', 'undefined']
        return True
    
    def identify_column_type(self, column_name: str, column_type) -> Optional[str]:
        column_lower = column_name.lower()
        type_lower = str(column_type).lower() if column_type else ""
        
        if isinstance(column_type, str) and type_lower in self.column_mapping:
            return self.column_mapping[type_lower]
        
        for pattern in self.hostname_patterns:
            if pattern in column_lower:
                return 'host'
        
        for target_type, patterns in self.advanced_patterns.items():
            for pattern in patterns:
                if pattern in column_lower or pattern in type_lower:
                    return target_type
        
        return None
    
    def load_metadata(self) -> Dict:
        print("Loading metadata...")
        with open(self.json_file_path, 'r') as f:
            metadata = json.load(f)
        if 'columns' in metadata:
            print(f"Found {len(metadata['columns'])} tables\n")
        return metadata
    
    def discover_columns(self, metadata: Dict) -> List[Tuple[str, str, str]]:
        print("Discovering columns...")
        discovered = []
        
        for table_name, columns in metadata.get('columns', {}).items():
            for column_name, column_type in columns.items():
                mapped_type = self.identify_column_type(column_name, column_type)
                if mapped_type:
                    discovered.append((table_name, column_name, mapped_type))
        
        print(f"Discovered {len(discovered)} relevant columns\n")
        return discovered
    
    def process_table(self, table_name: str, table_columns: List[Tuple[str, str, str]]) -> int:
        hostname_cols = [(col, ctype) for _, col, ctype in table_columns if ctype == 'host']
        attribute_cols = [(col, ctype) for _, col, ctype in table_columns if ctype != 'host']
        
        if not hostname_cols:
            return 0
        
        primary_hostname_col = hostname_cols[0][0]
        all_columns = [primary_hostname_col] + [col for col, _ in attribute_cols]
        attribute_types = [ctype for _, ctype in attribute_cols]
        
        print(f"Processing {table_name}: {len(all_columns)} columns")
        
        # Optimize query with LIMIT for very large tables
        query = f"""
        SELECT {', '.join(f'`{col}`' for col in all_columns)}
        FROM `{table_name}`
        WHERE `{primary_hostname_col}` IS NOT NULL 
        AND `{primary_hostname_col}` != ''
        AND `{primary_hostname_col}` != '*Undefined'
        """
        
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                query_job = self.bq_client.query(query)
                return self.process_results(query_job, table_name, attribute_types)
            except Exception as e:
                retry_count += 1
                error_msg = str(e)
                
                if "timeout" in error_msg.lower() or "deadline" in error_msg.lower():
                    print(f"Timeout processing {table_name}, retry {retry_count}/{max_retries}")
                    time.sleep(2 ** retry_count)  # Exponential backoff
                    continue
                elif retry_count == max_retries:
                    print(f"Failed to process {table_name} after {max_retries} retries: {error_msg[:100]}")
                    return 0
                else:
                    print(f"Error processing {table_name}: {error_msg[:100]}")
                    return 0
        
        return 0
    
    def process_results(self, query_job, table_name: str, attribute_types: List[str]) -> int:
        records_processed = 0
        batch_records = []
        batch_size = 5000  # Increased batch size for better performance
        duplicates_found = 0
        
        special_tables = {
            'prj-fisv-p-gcss-sas-dl9dd0f1df.SAS_BI.V_DIM_ENDPOINTAGENT': 'present_in_crowdstrike',
            'prj-fisv-p-gcss-sas-dl9dd0f1df.SAS_BI.V_DIM_ENDPOINT': 'present_in_cmdb',
            'prj-fisv-p-gcss-sas-dl9dd0f1df.SAS_BI.V_SPL_ENDPOINT_LOG': 'logging_in_splunk'
        }
        
        special_column = special_tables.get(table_name)
        
        try:
            for row in query_job:
                records_processed += 1
                
                if records_processed % 25000 == 0:
                    print(f"  Processed {records_processed:,} rows from {table_name}")
                
                if not row[0] or not self.is_valid_value(row[0]):
                    continue
                
                normalized_host = self.normalize_hostname(row[0])
                if not normalized_host:
                    continue
                
                record_data = {
                    'host': normalized_host,
                    'table_name': table_name
                }
                
                if special_column:
                    record_data[special_column] = 'yes'
                
                for i, attr_type in enumerate(attribute_types, 1):
                    if i < len(row) and self.is_valid_value(row[i]):
                        value = str(row[i]).strip()
                        
                        # Apply normalizations - now all values get lowercased
                        if attr_type == 'fqdn':
                            value = self.normalize_fqdn(value)
                        elif attr_type == 'region':
                            value = self.normalize_region(value)
                        elif attr_type == 'country':
                            value = self.normalize_country(value)
                        elif attr_type == 'logging_in_splunk' and table_name == 'prj-fisv-p-gcss-sas-dl9dd0f1df.SAS_BI.V_SPL_ENDPOINT_LOG':
                            value = 'yes'
                        else:
                            # Apply lowercase normalization to all other string values
                            value = self.normalize_value(value)
                        
                        record_data[attr_type] = value
                
                batch_records.append(record_data)
                
                if len(batch_records) >= batch_size:
                    dups = self.save_batch(batch_records)
                    duplicates_found += dups
                    batch_records = []
            
            # Process remaining records
            if batch_records:
                dups = self.save_batch(batch_records)
                duplicates_found += dups
            
            print(f"  Completed {table_name}: {records_processed:,} rows, {duplicates_found:,} duplicates merged")
            
        except Exception as e:
            print(f"  Error processing results for {table_name}: {str(e)[:100]}")
            # Save any remaining records before error
            if batch_records:
                try:
                    dups = self.save_batch(batch_records)
                    duplicates_found += dups
                except:
                    pass
        
        self.stats['total_records_processed'] += records_processed
        self.stats['duplicate_hosts_found'] += duplicates_found
        
        return records_processed
    
    def save_batch(self, records: List[Dict]) -> int:
        duplicates = 0
        
        with self.db_lock:
            # Start transaction for better performance
            self.duck_conn.execute("BEGIN TRANSACTION")
            
            try:
                for record in records:
                    host = record['host']
                    
                    if host in self.existing_hosts:
                        duplicates += 1
                        self.update_existing_host(host, record)
                    else:
                        self.insert_new_host(record)
                        self.existing_hosts[host] = self.build_host_data(record)
                
                self.duck_conn.execute("COMMIT")
            except Exception as e:
                self.duck_conn.execute("ROLLBACK")
                print(f"Batch save error: {e}")
                raise
        
        return duplicates
    
    def build_host_data(self, record: Dict) -> Dict:
        return {
            'source_tables': record['table_name'],
            'fqdn': record.get('fqdn'),
            'domain': record.get('domain'),
            'infrastructure_type': record.get('infrastructure_type'),
            'region': record.get('region'),
            'country': record.get('country'),
            'data_center': record.get('data_center'),
            'cloud_region': record.get('cloud_region'),
            'ip_address': record.get('ip_address'),
            'class': record.get('class'),
            'system_classification': record.get('system_classification'),
            'business_unit': record.get('business_unit'),
            'apm': record.get('apm'),
            'cio': record.get('cio'),
            'edr_coverage': record.get('edr_coverage'),
            'tanium_coverage': record.get('tanium_coverage'),
            'dlp_agent_coverage': record.get('dlp_agent_coverage'),
            'logging_in_splunk': record.get('logging_in_splunk'),
            'logging_in_gso': record.get('logging_in_gso'),
            'present_in_crowdstrike': record.get('present_in_crowdstrike'),
            'present_in_cmdb': record.get('present_in_cmdb'),
            'source_count': 1
        }
    
    def insert_new_host(self, record: Dict):
        columns = ['host', 'source_tables', 'source_count']
        values = [record['host'], record['table_name'], 1]
        
        attribute_columns = [
            'fqdn', 'domain', 'infrastructure_type', 'region', 'country',
            'data_center', 'cloud_region', 'ip_address', 'class', 'system_classification',
            'business_unit', 'apm', 'cio', 'edr_coverage', 'tanium_coverage',
            'dlp_agent_coverage', 'logging_in_splunk', 'logging_in_gso',
            'present_in_crowdstrike', 'present_in_cmdb'
        ]
        
        for col in attribute_columns:
            if col in record and record[col]:
                columns.append(col)
                values.append(record[col])
        
        placeholders = ', '.join(['?' for _ in values])
        insert_sql = f"INSERT INTO universal_cmdb ({', '.join(columns)}) VALUES ({placeholders})"
        
        try:
            self.duck_conn.execute(insert_sql, values)
            self.stats['hosts_created'] += 1
        except Exception as e:
            if "duplicate" not in str(e).lower():
                print(f"Insert error: {e}")
    
    def update_existing_host(self, host: str, record: Dict):
        existing = self.existing_hosts[host]
        updates = []
        values = []
        
        current_tables = existing.get('source_tables', '')
        table_name = record['table_name']
        
        if table_name not in current_tables:
            new_tables = f"{current_tables}, {table_name}" if current_tables else table_name
            updates.append("source_tables = ?")
            values.append(new_tables)
            existing['source_tables'] = new_tables
            
            new_count = existing.get('source_count', 0) + 1
            updates.append("source_count = ?")
            values.append(new_count)
            existing['source_count'] = new_count
        
        attribute_columns = [
            'fqdn', 'domain', 'infrastructure_type', 'region', 'country',
            'data_center', 'cloud_region', 'ip_address', 'class', 'system_classification',
            'business_unit', 'apm', 'cio', 'edr_coverage', 'tanium_coverage',
            'dlp_agent_coverage', 'logging_in_splunk', 'logging_in_gso',
            'present_in_crowdstrike', 'present_in_cmdb'
        ]
        
        for col in attribute_columns:
            if col in record and record[col]:
                new_value = record[col]
                existing_value = existing.get(col)
                
                if col in ['present_in_crowdstrike', 'present_in_cmdb'] and new_value == 'yes':
                    if existing_value != 'yes':
                        updates.append(f"{col} = ?")
                        values.append('yes')
                        existing[col] = 'yes'
                elif col == 'logging_in_splunk' and new_value == 'yes':
                    if existing_value != 'yes':
                        updates.append(f"{col} = ?")
                        values.append('yes')
                        existing[col] = 'yes'
                elif existing_value and new_value != existing_value:
                    if new_value not in str(existing_value):
                        merged_value = f"{existing_value} | {new_value}"
                        updates.append(f"{col} = ?")
                        values.append(merged_value)
                        existing[col] = merged_value
                elif not existing_value:
                    updates.append(f"{col} = ?")
                    values.append(new_value)
                    existing[col] = new_value
        
        if updates:
            updates.append("last_updated = CURRENT_TIMESTAMP")
            values.append(host)
            
            update_sql = f"UPDATE universal_cmdb SET {', '.join(updates)} WHERE host = ?"
            
            try:
                self.duck_conn.execute(update_sql, values)
                self.stats['hosts_updated'] += 1
            except Exception as e:
                print(f"Update error: {e}")
    
    def process_all(self):
        print("Starting CMDB processing...\n")
        start_time = time.time()
        
        metadata = self.load_metadata()
        discovered_columns = self.discover_columns(metadata)
        
        if not discovered_columns:
            print("No processable columns found")
            return
        
        columns_by_table = defaultdict(list)
        for table_name, column_name, column_type in discovered_columns:
            columns_by_table[table_name].append((table_name, column_name, column_type))
        
        print(f"Processing {len(columns_by_table)} tables\n")
        
        # Process tables with ThreadPoolExecutor for better parallelism
        max_workers = 3  # Adjust based on BigQuery quotas
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            
            for idx, (table_name, table_columns) in enumerate(columns_by_table.items(), 1):
                print(f"\n[{idx}/{len(columns_by_table)}] Submitting {table_name}")
                future = executor.submit(self.process_table, table_name, table_columns)
                futures.append((future, table_name))
                self.stats['tables_processed'] += 1
            
            # Wait for all futures to complete
            for future, table_name in futures:
                try:
                    result = future.result(timeout=600)  # 10 minute timeout per table
                except Exception as e:
                    print(f"Failed to process {table_name}: {e}")
        
        # Ensure all data is committed
        self.duck_conn.execute("CHECKPOINT")
        
        self.generate_report()
        self.export_csv()
        
        total_time = time.time() - start_time
        print(f"\nProcessing complete in {total_time:.2f} seconds")
    
    def generate_report(self):
        print("\n" + "=" * 60)
        print("FINAL REPORT")
        print("=" * 60)
        
        total_hosts = self.duck_conn.execute("SELECT COUNT(*) FROM universal_cmdb").fetchone()[0]
        
        print(f"\nTotal unique hosts: {total_hosts:,}")
        print(f"Tables processed: {self.stats['tables_processed']}")
        print(f"Records processed: {self.stats['total_records_processed']:,}")
        print(f"New hosts created: {self.stats['hosts_created']:,}")
        print(f"Existing hosts updated: {self.stats['hosts_updated']:,}")
        print(f"Duplicate hosts merged: {self.stats['duplicate_hosts_found']:,}")
        
        print("\nColumn coverage:")
        
        columns = [
            'host', 'fqdn', 'domain', 'business_unit', 'region', 
            'infrastructure_type', 'country', 'data_center', 'cloud_region',
            'ip_address', 'class', 'system_classification', 'apm', 'cio',
            'edr_coverage', 'tanium_coverage', 'dlp_agent_coverage',
            'logging_in_splunk', 'logging_in_gso', 'present_in_crowdstrike', 
            'present_in_cmdb'
        ]
        
        for col in columns:
            count_query = f"SELECT COUNT(*) FROM universal_cmdb WHERE {col} IS NOT NULL AND {col} != ''"
            count = self.duck_conn.execute(count_query).fetchone()[0]
            if count > 0:
                percentage = (count / total_hosts * 100) if total_hosts > 0 else 0
                print(f"  {col}: {count:,} ({percentage:.1f}%)")
        
        print("\nSpecial table coverage:")
        
        crowdstrike_count = self.duck_conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE present_in_crowdstrike = 'yes'").fetchone()[0]
        cmdb_count = self.duck_conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE present_in_cmdb = 'yes'").fetchone()[0]
        splunk_log_count = self.duck_conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE logging_in_splunk = 'yes'").fetchone()[0]
        
        print(f"  Hosts in CrowdStrike: {crowdstrike_count:,}")
        print(f"  Hosts in CMDB: {cmdb_count:,}")
        print(f"  Hosts logging to Splunk: {splunk_log_count:,}")
        
        # Check for normalized values (now lowercase)
        print("\nNormalization statistics:")
        
        na_region_count = self.duck_conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE region = 'north america'").fetchone()[0]
        us_country_count = self.duck_conn.execute("SELECT COUNT(*) FROM universal_cmdb WHERE country = 'united states'").fetchone()[0]
        
        print(f"  Hosts with region 'north america': {na_region_count:,}")
        print(f"  Hosts with country 'united states': {us_country_count:,}")
    
    def export_csv(self, filename: str = "universal_cmdb_export.csv"):
        print(f"\nExporting to {filename}...")
        
        export_query = f"""
        COPY (
            SELECT * FROM universal_cmdb 
            ORDER BY source_count DESC, host
        ) TO '{filename}' (HEADER, DELIMITER ',')
        """
        
        self.duck_conn.execute(export_query)
        print(f"Export complete: {filename}")
    
    def close(self):
        try:
            self.duck_conn.close()
        except:
            pass

if __name__ == "__main__":
    processor = None
    
    try:
        processor = OptimizedCMDBProcessor("reviewed_labeled_columns.json", "universal_cmdb.db")
        processor.process_all()
        
    except KeyboardInterrupt:
        print("\n\nInterrupted by user")
        
    except Exception as e:
        print(f"\n\nError: {str(e)}")
        import traceback
        traceback.print_exc()
        
    finally:
        if processor:
            processor.close()