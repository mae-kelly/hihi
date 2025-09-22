// Visibility Data Types for Universal CMDB Dashboard

export interface GlobalVisibility {
  total_hosts: number;
  visible_hosts: number;
  invisible_hosts: number;
  global_visibility_percentage: number;
  splunk_visibility_percentage: number;
  chronicle_visibility_percentage: number;
  visibility_gap_percentage: number;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

export interface InfrastructureVisibility {
  overall_infrastructure_visibility: number;
  category_summary: Record<string, {
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  detailed_breakdown: Array<{
    infrastructure_type: string;
    category: string;
    total_hosts: number;
    visible_hosts: number;
    invisible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  total_infrastructure_types: number;
  critical_gaps: Array<{
    infrastructure_type: string;
    visibility_percentage: number;
  }>;
}

export interface RegionalVisibility {
  regional_breakdown: Array<{
    region: string;
    total_hosts: number;
    visible_hosts: number;
    invisible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  country_breakdown: Array<{
    country: string;
    region: string;
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  datacenter_breakdown: Array<{
    data_center: string;
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  cloud_region_breakdown: Array<{
    cloud_region: string;
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  worst_visibility_region?: {
    region: string;
    visibility_percentage: number;
  };
  best_visibility_region?: {
    region: string;
    visibility_percentage: number;
  };
}

export interface BusinessUnitVisibility {
  business_unit_breakdown: Array<{
    business_unit: string;
    total_hosts: number;
    visible_hosts: number;
    invisible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  cio_breakdown: Array<{
    cio: string;
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  apm_breakdown: Array<{
    apm: string;
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  application_class_breakdown: Array<{
    application_class: string;
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  worst_visibility_bu?: {
    business_unit: string;
    visibility_percentage: number;
  };
  best_visibility_bu?: {
    business_unit: string;
    visibility_percentage: number;
  };
}

export interface SystemClassificationVisibility {
  category_summary: Record<string, {
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    system_count: number;
    status: string;
  }>;
  detailed_breakdown: Array<{
    system_classification: string;
    category: string;
    total_hosts: number;
    visible_hosts: number;
    invisible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  total_system_types: number;
  critical_systems: Array<{
    system_classification: string;
    visibility_percentage: number;
  }>;
}

export interface SecurityControlCoverage {
  total_hosts: number;
  edr_coverage: {
    protected_hosts: number;
    unprotected_hosts: number;
    coverage_percentage: number;
    vendor_breakdown: Array<{
      vendor: string;
      host_count: number;
      percentage: number;
    }>;
    status: string;
  };
  tanium_coverage: {
    managed_hosts: number;
    unmanaged_hosts: number;
    coverage_percentage: number;
    status: string;
  };
  dlp_coverage: {
    protected_hosts: number;
    unprotected_hosts: number;
    coverage_percentage: number;
    vendor_breakdown: Array<{
      vendor: string;
      host_count: number;
      percentage: number;
    }>;
    status: string;
  };
  all_controls_coverage: {
    fully_protected_hosts: number;
    partially_protected_hosts: number;
    coverage_percentage: number;
    status: string;
  };
}

export interface LoggingCompliance {
  total_hosts: number;
  splunk_compliance: {
    compliant_hosts: number;
    non_compliant_hosts: number;
    compliance_percentage: number;
    status_breakdown: Array<{
      status: string;
      host_count: number;
      percentage: number;
      is_compliant: boolean;
    }>;
    status: string;
  };
  chronicle_compliance: {
    compliant_hosts: number;
    non_compliant_hosts: number;
    compliance_percentage: number;
    status_breakdown: Array<{
      status: string;
      host_count: number;
      percentage: number;
      is_compliant: boolean;
    }>;
    status: string;
  };
  combined_compliance: {
    both_platforms: {
      host_count: number;
      percentage: number;
    };
    either_platform: {
      host_count: number;
      percentage: number;
    };
    neither_platform: {
      host_count: number;
      percentage: number;
    };
    overall_status: string;
  };
}

export interface DomainVisibility {
  overall_domain_visibility: number;
  tdc_visibility: {
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  };
  lead_visibility: {
    total_hosts: number;
    visible_hosts: number;
    visibility_percentage: number;
    status: string;
  };
  domain_breakdown: Array<{
    domain: string;
    total_hosts: number;
    visible_hosts: number;
    invisible_hosts: number;
    visibility_percentage: number;
    status: string;
  }>;
  total_domains: number;
  critical_domains: Array<{
    domain: string;
    visibility_percentage: number;
  }>;
}

export interface VisibilityMetric {
  dimension: string;
  percentage: number;
  total: number;
  visible: number;
  invisible: number;
  trend: number;
  status: 'critical' | 'warning' | 'healthy';
  lastUpdated: string;
}

export interface OverallVisibility {
  global: GlobalVisibility;
  infrastructure: InfrastructureVisibility;
  regional: RegionalVisibility;
  businessUnit: BusinessUnitVisibility;
  systemClassification: SystemClassificationVisibility;
  securityControl: SecurityControlCoverage;
  logging: LoggingCompliance;
  domain: DomainVisibility;
  overallPercentage: number;
  criticalDimensions: number;
  totalHosts: number;
  visibleHosts: number;
  invisibleHosts: number;
}

// Utility type for API responses
export interface APIResponse<T> {
  data?: T;
  error?: string;
  timestamp: string;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  timestamp: string;
  value: number;
  dimension?: string;
}

// Filter types
export interface VisibilityFilter {
  dimension?: string[];
  status?: ('critical' | 'warning' | 'healthy')[];
  threshold?: {
    min?: number;
    max?: number;
  };
  timeRange?: {
    start?: Date;
    end?: Date;
  };
}

// Export status helpers
export const VisibilityStatus = {
  CRITICAL: 'CRITICAL' as const,
  WARNING: 'WARNING' as const,
  HEALTHY: 'HEALTHY' as const,
};

export const getVisibilityStatus = (percentage: number): typeof VisibilityStatus[keyof typeof VisibilityStatus] => {
  if (percentage < 30) return VisibilityStatus.CRITICAL;
  if (percentage < 70) return VisibilityStatus.WARNING;
  return VisibilityStatus.HEALTHY;
};

export const getVisibilityColor = (status: string): string => {
  switch (status) {
    case VisibilityStatus.CRITICAL:
      return '#ff00ff'; // pink
    case VisibilityStatus.WARNING:
      return '#c084fc'; // purple
    case VisibilityStatus.HEALTHY:
      return '#00d4ff'; // cyan
    default:
      return '#ffffff'; // white
  }
};