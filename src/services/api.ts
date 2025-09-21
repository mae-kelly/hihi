// src/services/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Helper function for API calls
async function apiCall<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}/api${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    throw error;
  }
}

// Database Status
export interface DatabaseStatus {
  status: string;
  table: string;
  columns: string[];
  row_count: number;
  database_type: string;
}

// Global View Types
export interface GlobalViewData {
  cmdb_registered: number;
  total_assets: number;
  registration_rate: number;
  status_breakdown: {
    registered: number;
    not_registered: number;
  };
  regional_compliance: Record<string, {
    registered: number;
    total: number;
    compliance_percentage: number;
    status: string;
  }>;
}

// Infrastructure Types
export interface InfrastructureData {
  infrastructure_matrix: Record<string, number>;
  detailed_data: Array<{
    type: string;
    frequency: number;
    percentage: number;
    threat_level: string;
  }>;
  regional_analysis: Record<string, Record<string, number>>;
  business_unit_analysis: Record<string, Record<string, number>>;
  total_types: number;
  modernization_analysis: {
    modernization_score: number;
    modernization_percentage: number;
    legacy_systems: any[];
    cloud_adoption: any[];
  };
}

// Regional Types
export interface RegionalData {
  global_surveillance: Record<string, number>;
  region_details: Record<string, any>;
  regional_analytics: Record<string, {
    count: number;
    percentage: number;
    cmdb_coverage: number;
    tanium_coverage: number;
    infrastructure_diversity: number;
    security_score: number;
  }>;
  threat_assessment: {
    highest_risk_region: string;
    most_secure_region: string;
    geographic_balance: number;
  };
}

// Country Types
export interface CountryData {
  total_countries: number;
  country_analysis: Record<string, {
    count: number;
    percentage: number;
    region: string;
    security_score: number;
    threat_level: string;
  }>;
  threat_intelligence: {
    highest_threat_countries: string[];
    most_secure_countries: string[];
  };
  geographic_concentration: number;
  compliant_regions: string[];
  urgent_infrastructure: string[];
  total_gap_assets: number;
}

// Business Unit Types
export interface BusinessUnitData {
  business_intelligence: Record<string, number>;
  bu_security_analysis: Record<string, {
    total_assets: number;
    geographic_spread: number;
    infrastructure_diversity: number;
    cmdb_coverage: number;
    tanium_coverage: number;
    security_score: number;
    regions: string[];
    infrastructure_types: string[];
    security_status: string;
  }>;
  organizational_analytics: {
    total_assets: number;
    largest_bu: string;
    most_distributed_bu: string;
    security_leaders: string[];
    vulnerable_units: string[];
  };
}

// CIO Types
export interface CIOData {
  operative_intelligence: Record<string, number>;
  leadership_analysis: Record<string, {
    total_assets: number;
    business_units: number;
    geographic_regions: number;
    span_of_control: number;
    business_unit_list: string[];
    region_list: string[];
    leadership_tier: string;
  }>;
  total_cio_entries: number;
  governance_analytics: {
    total_assets_under_management: number;
    unique_leaders: number;
    governance_distribution: any;
    average_portfolio_size: number;
  };
}

// System Classification Types
export interface SystemClassificationData {
  system_matrix: Record<string, number>;
  system_analytics: Record<string, any>;
  os_distribution: Record<string, number>;
  version_analysis: Record<string, string[]>;
  security_distribution: Record<string, number>;
  total_systems: number;
  modernization_analysis: {
    legacy_systems: Array<{
      system: string;
      count: number;
      regions: string[];
    }>;
    legacy_assets: number;
    modernization_priority: any[];
    modernization_percentage: number;
  };
  taxonomy_intelligence: {
    os_diversity: number;
    dominant_os: string;
    system_sprawl: number;
    standardization_score: number;
  };
}

// Domain Visibility Types
export interface DomainData {
  domain_analysis: Record<string, number>;
  domain_details: Record<string, {
    count: number;
    percentage: number;
  }>;
  unique_domains: string[];
  total_analyzed: number;
  multi_domain_assets: number;
  domain_distribution: {
    tdc_percentage: number;
    lead_percentage: number;
    other_percentage: number;
  };
  warfare_intelligence: {
    dominant_domain: string;
    domain_balance: number;
    tactical_status: string;
  };
}

// Class Metrics Types
export interface ClassMetricsData {
  classification_matrix: Record<string, number>;
  class_analytics: Record<string, {
    total_assets: number;
    percentage: number;
    infrastructure_diversity: number;
    geographic_spread: number;
    risk_level: string;
    infrastructure_types: string[];
    regions: string[];
  }>;
  total_classes: number;
  classification_intelligence: {
    total_classified_assets: number;
    risk_distribution: Record<string, number>;
    highest_risk_class: string;
    unclassified_risk: number;
    security_priority: any[];
  };
  compliance_analysis: {
    critical_assets: number;
    unclassified_risk: number;
    security_priority: any[];
  };
}

// Source Tables Types
export interface SourceTablesData {
  source_intelligence: {
    data: Array<{
      source: string;
      frequency: number;
      unique_hosts: number;
      percentage: number;
    }>;
    detailed_data: any[];
    unique_sources: number;
    total_instances: number;
    top_10: any[];
    risk_analysis: {
      high_frequency: any[];
      medium_frequency: any[];
      low_frequency: any[];
    };
  };
  detailed_data: any[];
  unique_sources: number;
  total_instances: number;
  top_10: any[];
  risk_analysis: any;
}

// Tanium Coverage Types
export interface TaniumCoverageData {
  tanium_deployed: number;
  total_assets: number;
  coverage_percentage: number;
  status_breakdown: {
    deployed: number;
    not_deployed: number;
  };
  regional_coverage: Record<string, {
    deployed: number;
    total: number;
    coverage_percentage: number;
    priority: string;
  }>;
  infrastructure_coverage: Record<string, {
    deployed: number;
    total: number;
    coverage_percentage: number;
    priority: string;
  }>;
  business_unit_coverage: Record<string, {
    deployed: number;
    total: number;
    coverage_percentage: number;
    risk_level: string;
  }>;
  deployment_gaps: {
    unprotected_regions: string[];
    high_risk_infrastructure: string[];
    vulnerable_business_units: string[];
    total_unprotected_assets: number;
  };
  deployment_analysis: {
    coverage_status: string;
    deployment_gap: number;
    recommended_action: string;
    security_risk_level: string;
  };
}

// CMDB Presence Types
export interface CMDBPresenceData {
  cmdb_registered: number;
  total_assets: number;
  registration_rate: number;
  status_breakdown: {
    registered: number;
    not_registered: number;
  };
  regional_compliance: Record<string, {
    registered: number;
    total: number;
    compliance_percentage: number;
    status: string;
  }>;
  infrastructure_compliance: Record<string, {
    registered: number;
    total: number;
    compliance_percentage: number;
    priority: string;
  }>;
  compliance_analysis: {
    compliance_status: string;
    improvement_needed: number;
    governance_maturity: string;
    audit_readiness: {
      audit_score: number;
      compliant_regions: number;
      managed_facilities: number;
      governance_excellence: number;
    };
  };
}

// Host Search Types
export interface HostSearchData {
  hosts: Array<{
    host: string;
    region: string;
    country: string;
    infrastructure_type: string;
    source_tables: string;
    domain: string;
    data_center: string;
    present_in_cmdb: string;
    tanium_coverage: string;
    business_unit: string;
    system: string;
    class: string;
  }>;
  total_found: number;
  search_term: string;
  search_summary: {
    regions: string[];
    countries: string[];
    infrastructure_types: string[];
    business_units: string[];
    data_centers: string[];
    cmdb_registered: number;
    tanium_deployed: number;
    security_coverage: number;
  };
  drill_down_available: boolean;
  search_scope: {
    searched_fields: string[];
    result_limit: number;
    total_matches: number;
  };
}

// Advanced Analytics Types
export interface AdvancedAnalyticsData {
  correlation_analysis: Array<{
    region: string;
    infrastructure_type: string;
    asset_count: number;
    cmdb_coverage: number;
    tanium_coverage: number;
    security_score: number;
    business_unit_diversity: number;
    datacenter_diversity: number;
    risk_category: string;
  }>;
  trend_analysis: Record<string, {
    total_assets: number;
    avg_security_score: number;
    infrastructure_types: number;
    high_risk_segments: number;
  }>;
  high_risk_combinations: any[];
  predictive_insights: {
    security_trends: {
      improving_regions: string[];
      declining_regions: string[];
      stable_regions: string[];
    };
    infrastructure_modernization: {
      cloud_adoption_leaders: string[];
      legacy_infrastructure_regions: string[];
      hybrid_environments: string[];
    };
    risk_predictions: {
      high_priority_remediation: number;
      assets_at_risk: number;
      projected_incidents: number;
    };
  };
  analytics_summary: {
    total_correlations_analyzed: number;
    high_risk_segments: number;
    coverage_gaps_identified: number;
    modernization_opportunities: number;
  };
}

// API Service Class
class CMDBAPIService {
  // Database Status
  async getDatabaseStatus(): Promise<DatabaseStatus> {
    return apiCall<DatabaseStatus>('/database_status');
  }

  // Source Tables
  async getSourceTablesMetrics(): Promise<SourceTablesData> {
    return apiCall<SourceTablesData>('/source_tables_metrics');
  }

  // Domain Metrics
  async getDomainMetrics(): Promise<DomainData> {
    return apiCall<DomainData>('/domain_metrics');
  }

  // Infrastructure
  async getInfrastructureType(): Promise<InfrastructureData> {
    return apiCall<InfrastructureData>('/infrastructure_type');
  }

  // Regional
  async getRegionMetrics(): Promise<RegionalData> {
    return apiCall<RegionalData>('/region_metrics');
  }

  // Country
  async getCountryMetrics(): Promise<CountryData> {
    return apiCall<CountryData>('/country_metrics');
  }

  // Class Metrics
  async getClassMetrics(): Promise<ClassMetricsData> {
    return apiCall<ClassMetricsData>('/class_metrics');
  }

  // System Classification
  async getSystemClassificationMetrics(): Promise<SystemClassificationData> {
    return apiCall<SystemClassificationData>('/system_classification_metrics');
  }

  // Business Units
  async getBusinessUnitMetrics(): Promise<BusinessUnitData> {
    return apiCall<BusinessUnitData>('/business_unit_metrics');
  }

  // CIO Metrics
  async getCIOMetrics(): Promise<CIOData> {
    return apiCall<CIOData>('/cio_metrics');
  }

  // Tanium Coverage
  async getTaniumCoverage(): Promise<TaniumCoverageData> {
    return apiCall<TaniumCoverageData>('/tanium_coverage');
  }

  // CMDB Presence
  async getCMDBPresence(): Promise<CMDBPresenceData> {
    return apiCall<CMDBPresenceData>('/cmdb_presence');
  }

  // Host Search
  async searchHosts(query: string): Promise<HostSearchData> {
    return apiCall<HostSearchData>(`/host_search?q=${encodeURIComponent(query)}`);
  }

  // Advanced Analytics
  async getAdvancedAnalytics(): Promise<AdvancedAnalyticsData> {
    return apiCall<AdvancedAnalyticsData>('/advanced_analytics');
  }
}

// Export singleton instance
export const cmdbAPI = new CMDBAPIService();

// Export types
export type { DatabaseStatus, GlobalViewData, InfrastructureData, RegionalData, CountryData };