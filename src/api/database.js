// api/database.js
import Database from 'duckdb';
import path from 'path';

class UniversalCMDBAPI {
  constructor() {
    // Path to your database file
    this.dbPath = path.join(process.cwd(), 'universal_cmdb.db');
    this.db = null;
    this.connection = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.db = new Database.Database(this.dbPath);
      this.connection = this.db.connect();
      resolve();
    });
  }

  async query(sql, params = []) {
    if (!this.connection) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      this.connection.all(sql, params, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // ACTUAL AO1 VISIBILITY QUERIES
  async getGlobalView() {
    const sql = `
      SELECT 
        COUNT(*) as total_assets,
        COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as splunk_assets,
        COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) as cmdb_assets,
        COUNT(CASE WHEN edr_coverage_s != 'not_protected' THEN 1 END) as edr_assets,
        ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as splunk_coverage,
        ROUND((COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) * 100.0 / COUNT(*)), 2) as cmdb_coverage,
        ROUND((COUNT(CASE WHEN edr_coverage_s != 'not_protected' THEN 1 END) * 100.0 / COUNT(*)), 2) as edr_coverage
      FROM universal_cmdb
    `;
    
    const result = await this.query(sql);
    return result[0];
  }

  async getInfrastructureView() {
    const sql = `
      SELECT 
        infrastructure_type_s,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as visible_assets,
        COUNT(CASE WHEN edr_coverage_s != 'not_protected' THEN 1 END) as edr_protected,
        ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as visibility_percentage,
        ROUND((COUNT(CASE WHEN edr_coverage_s != 'not_protected' THEN 1 END) * 100.0 / COUNT(*)), 2) as edr_coverage_pct
      FROM universal_cmdb
      GROUP BY infrastructure_type_s
      ORDER BY total_assets DESC
    `;
    
    return await this.query(sql);
  }

  async getRegionalCountryView() {
    const sql = `
      SELECT 
        region_s,
        country_s,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as visible_assets,
        COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) as in_cmdb,
        ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as visibility_percentage,
        ROUND((COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) * 100.0 / COUNT(*)), 2) as cmdb_coverage_pct
      FROM universal_cmdb
      GROUP BY region_s, country_s
      ORDER BY region_s, visibility_percentage DESC
    `;
    
    return await this.query(sql);
  }

  async getBusinessUnitView() {
    const sql = `
      SELECT 
        business_unit_s,
        cio_s,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN apm_s NOT IN ('none', 'unknown') THEN 1 END) as apm_monitored,
        COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as log_forwarding,
        ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as logging_visibility_pct,
        ROUND((COUNT(CASE WHEN apm_s NOT IN ('none', 'unknown') THEN 1 END) * 100.0 / COUNT(*)), 2) as apm_coverage_pct
      FROM universal_cmdb
      GROUP BY business_unit_s, cio_s
      ORDER BY logging_visibility_pct DESC
    `;
    
    return await this.query(sql);
  }

  async getSystemClassification() {
    const sql = `
      SELECT 
        system_classification_s,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as visible_assets,
        COUNT(CASE WHEN edr_coverage_s != 'not_protected' THEN 1 END) as edr_protected,
        ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as logging_visibility_pct,
        ROUND((COUNT(CASE WHEN edr_coverage_s != 'not_protected' THEN 1 END) * 100.0 / COUNT(*)), 2) as edr_coverage_pct
      FROM universal_cmdb
      GROUP BY system_classification_s
      ORDER BY 
        CASE system_classification_s 
          WHEN 'production' THEN 1 
          WHEN 'staging' THEN 2 
          ELSE 3 
        END
    `;
    
    return await this.query(sql);
  }

  async getSecurityControlCoverage() {
    const sql = `
      SELECT 
        class_s,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN edr_coverage_s NOT IN ('not_protected', 'unprotected') THEN 1 END) as edr_covered,
        COUNT(CASE WHEN tanium_coverage_s = 'managed' THEN 1 END) as tanium_managed,
        COUNT(CASE WHEN dlp_agent_coverage_s != 'not_covered' THEN 1 END) as dlp_covered,
        ROUND((COUNT(CASE WHEN edr_coverage_s NOT IN ('not_protected', 'unprotected') THEN 1 END) * 100.0 / COUNT(*)), 2) as edr_coverage_pct,
        ROUND((COUNT(CASE WHEN tanium_coverage_s = 'managed' THEN 1 END) * 100.0 / COUNT(*)), 2) as tanium_coverage_pct,
        ROUND((COUNT(CASE WHEN dlp_agent_coverage_s != 'not_covered' THEN 1 END) * 100.0 / COUNT(*)), 2) as dlp_coverage_pct
      FROM universal_cmdb
      GROUP BY class_s
      ORDER BY total_assets DESC
    `;
    
    return await this.query(sql);
  }

  async getDomainVisibility() {
    const sql = `
      SELECT 
        domain_s,
        COUNT(*) as total_assets,
        COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) as visible_assets,
        COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) as in_cmdb,
        ROUND((COUNT(CASE WHEN logging_in_splunk_s = 'forwarding' THEN 1 END) * 100.0 / COUNT(*)), 2) as visibility_percentage,
        ROUND((COUNT(CASE WHEN present_in_cmdb_s = 'yes' THEN 1 END) * 100.0 / COUNT(*)), 2) as cmdb_coverage_pct
      FROM universal_cmdb
      GROUP BY domain_s
      ORDER BY total_assets DESC
    `;
    
    return await this.query(sql);
  }

  async getComplianceMatrix() {
    const sql = `
      SELECT 
        CASE 
          WHEN logging_in_qso_s = 'enabled' AND logging_in_splunk_s = 'forwarding' THEN 'Full Compliance'
          WHEN logging_in_qso_s = 'enabled' OR logging_in_splunk_s = 'forwarding' THEN 'Partial Compliance'
          ELSE 'Non-Compliant'
        END as compliance_status,
        COUNT(*) as asset_count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM universal_cmdb)), 2) as percentage
      FROM universal_cmdb
      GROUP BY 
        CASE 
          WHEN logging_in_qso_s = 'enabled' AND logging_in_splunk_s = 'forwarding' THEN 'Full Compliance'
          WHEN logging_in_qso_s = 'enabled' OR logging_in_splunk_s = 'forwarding' THEN 'Partial Compliance'
          ELSE 'Non-Compliant'
        END
      ORDER BY asset_count DESC
    `;
    
    return await this.query(sql);
  }

  async getCriticalGaps() {
    const sql = `
      SELECT 
        host_s,
        fqdn_s,
        business_unit_s,
        class_s,
        system_classification_s,
        infrastructure_type_s,
        logging_in_splunk_s,
        edr_coverage_s,
        present_in_cmdb_s,
        data_quality_score,
        last_updated
      FROM universal_cmdb
      WHERE (
        logging_in_splunk_s NOT IN ('forwarding', 'heavy_forwarder', 'universal_forwarder')
        OR edr_coverage_s IN ('not_protected', 'unprotected')
        OR present_in_cmdb_s != 'yes'
      )
      AND system_classification_s IN ('production', 'staging')
      ORDER BY 
        CASE system_classification_s WHEN 'production' THEN 1 ELSE 2 END,
        data_quality_score ASC,
        last_updated DESC
      LIMIT 100
    `;
    
    return await this.query(sql);
  }

  async getDataQualityMetrics() {
    const sql = `
      SELECT 
        source_count,
        source_tables_s,
        COUNT(*) as asset_count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM universal_cmdb)), 2) as percentage,
        AVG(data_quality_score) as avg_quality_score
      FROM universal_cmdb
      GROUP BY source_count, source_tables_s
      ORDER BY source_count DESC, asset_count DESC
    `;
    
    return await this.query(sql);
  }

  async close() {
    if (this.connection) {
      this.connection.close();
    }
    if (this.db) {
      this.db.close();
    }
  }
}

export default UniversalCMDBAPI;