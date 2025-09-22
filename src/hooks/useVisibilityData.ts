import { useState, useEffect } from 'react';

interface VisibilityData {
  percentage: number;
  total: number;
  visible: number;
  invisible: number;
  status: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

interface MetricsData {
  global?: VisibilityData;
  infrastructure?: VisibilityData;
  regional?: VisibilityData;
  businessUnit?: VisibilityData;
  system?: VisibilityData;
  security?: VisibilityData;
  logging?: VisibilityData;
  domain?: VisibilityData;
  overall?: number;
  criticalCount?: number;
}

export const useVisibilityMetrics = () => {
  const [data, setData] = useState<MetricsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        
        // Fetch all visibility endpoints in parallel
        const endpoints = [
          'global_visibility',
          'infrastructure_visibility',
          'regional_visibility',
          'business_unit_visibility',
          'system_classification_visibility',
          'security_control_coverage',
          'logging_compliance',
          'domain_visibility'
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint => 
            fetch(`http://localhost:5000/api/${endpoint}`)
              .then(res => res.json())
              .catch(err => {
                console.error(`Error fetching ${endpoint}:`, err);
                return null;
              })
          )
        );

        const [global, infra, regional, bu, system, security, logging, domain] = responses;

        // Process each response into standardized format
        const processedData: MetricsData = {};

        if (global) {
          processedData.global = {
            percentage: global.global_visibility_percentage || 0,
            total: global.total_hosts || 0,
            visible: global.visible_hosts || 0,
            invisible: global.invisible_hosts || 0,
            status: global.status || 'CRITICAL'
          };
        }

        if (infra) {
          processedData.infrastructure = {
            percentage: infra.overall_infrastructure_visibility || 0,
            total: infra.total_infrastructure_types || 0,
            visible: infra.category_summary ? 
              Object.values(infra.category_summary).filter((c: any) => c.visibility_percentage > 50).length : 0,
            invisible: infra.critical_gaps ? infra.critical_gaps.length : 0,
            status: infra.overall_infrastructure_visibility < 30 ? 'CRITICAL' : 
                   infra.overall_infrastructure_visibility < 70 ? 'WARNING' : 'HEALTHY'
          };
        }

        if (regional) {
          const avgVisibility = regional.regional_breakdown ? 
            regional.regional_breakdown.reduce((sum: number, r: any) => sum + r.visibility_percentage, 0) / regional.regional_breakdown.length : 0;
          
          processedData.regional = {
            percentage: avgVisibility,
            total: regional.regional_breakdown ? regional.regional_breakdown.length : 0,
            visible: regional.regional_breakdown ? 
              regional.regional_breakdown.filter((r: any) => r.visibility_percentage > 50).length : 0,
            invisible: regional.regional_breakdown ? 
              regional.regional_breakdown.filter((r: any) => r.visibility_percentage <= 50).length : 0,
            status: avgVisibility < 40 ? 'CRITICAL' : avgVisibility < 70 ? 'WARNING' : 'HEALTHY'
          };
        }

        if (bu) {
          const avgVisibility = bu.business_unit_breakdown ? 
            bu.business_unit_breakdown.reduce((sum: number, b: any) => sum + b.visibility_percentage, 0) / bu.business_unit_breakdown.length : 0;
          
          processedData.businessUnit = {
            percentage: avgVisibility,
            total: bu.business_unit_breakdown ? bu.business_unit_breakdown.length : 0,
            visible: bu.business_unit_breakdown ? 
              bu.business_unit_breakdown.filter((b: any) => b.visibility_percentage > 50).length : 0,
            invisible: bu.business_unit_breakdown ? 
              bu.business_unit_breakdown.filter((b: any) => b.visibility_percentage <= 50).length : 0,
            status: avgVisibility < 40 ? 'CRITICAL' : avgVisibility < 70 ? 'WARNING' : 'HEALTHY'
          };
        }

        if (system) {
          const avgVisibility = system.category_summary ? 
            Object.values(system.category_summary).reduce((sum: number, s: any) => sum + s.visibility_percentage, 0) / 
            Object.keys(system.category_summary).length : 0;
          
          processedData.system = {
            percentage: avgVisibility,
            total: system.total_system_types || 0,
            visible: system.critical_systems ? 
              system.total_system_types - system.critical_systems.length : 0,
            invisible: system.critical_systems ? system.critical_systems.length : 0,
            status: avgVisibility < 40 ? 'CRITICAL' : avgVisibility < 70 ? 'WARNING' : 'HEALTHY'
          };
        }

        if (security) {
          processedData.security = {
            percentage: security.all_controls_coverage ? security.all_controls_coverage.coverage_percentage : 0,
            total: security.total_hosts || 0,
            visible: security.all_controls_coverage ? security.all_controls_coverage.fully_protected_hosts : 0,
            invisible: security.all_controls_coverage ? security.all_controls_coverage.partially_protected_hosts : 0,
            status: security.all_controls_coverage?.status || 'CRITICAL'
          };
        }

        if (logging) {
          processedData.logging = {
            percentage: logging.combined_compliance ? logging.combined_compliance.either_platform.percentage : 0,
            total: logging.total_hosts || 0,
            visible: logging.combined_compliance ? logging.combined_compliance.either_platform.host_count : 0,
            invisible: logging.combined_compliance ? logging.combined_compliance.neither_platform.host_count : 0,
            status: logging.combined_compliance?.overall_status || 'CRITICAL'
          };
        }

        if (domain) {
          processedData.domain = {
            percentage: domain.overall_domain_visibility || 0,
            total: domain.total_domains || 0,
            visible: domain.critical_domains ? 
              domain.total_domains - domain.critical_domains.length : domain.total_domains,
            invisible: domain.critical_domains ? domain.critical_domains.length : 0,
            status: domain.overall_domain_visibility < 40 ? 'CRITICAL' : 
                   domain.overall_domain_visibility < 70 ? 'WARNING' : 'HEALTHY'
          };
        }

        // Calculate overall visibility
        const visibilityValues = Object.values(processedData)
          .filter(d => d && typeof d.percentage === 'number')
          .map(d => d.percentage);
        
        if (visibilityValues.length > 0) {
          processedData.overall = visibilityValues.reduce((sum, v) => sum + v, 0) / visibilityValues.length;
          processedData.criticalCount = Object.values(processedData)
            .filter(d => d && d.status === 'CRITICAL').length;
        }

        setData(processedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch visibility metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
};

// Hook for individual page metrics
export const usePageVisibility = (page: string) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const endpointMap: Record<string, string> = {
          'global': 'global_visibility',
          'infrastructure': 'infrastructure_visibility',
          'regional': 'regional_visibility',
          'business-unit': 'business_unit_visibility',
          'system': 'system_classification_visibility',
          'security': 'security_control_coverage',
          'logging': 'logging_compliance',
          'domain': 'domain_visibility'
        };

        const endpoint = endpointMap[page];
        if (!endpoint) {
          throw new Error(`Unknown page: ${page}`);
        }

        const response = await fetch(`http://localhost:5000/api/${endpoint}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${endpoint}`);
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [page]);

  return { data, loading, error };
};

// Export utility functions
export const getVisibilityColor = (percentage: number): string => {
  if (percentage >= 80) return '#00d4ff'; // cyan
  if (percentage >= 50) return '#c084fc'; // purple
  return '#ff00ff'; // pink
};

export const getStatusColor = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'HEALTHY':
      return '#00d4ff';
    case 'WARNING':
      return '#c084fc';
    case 'CRITICAL':
      return '#ff00ff';
    default:
      return '#ffffff';
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};