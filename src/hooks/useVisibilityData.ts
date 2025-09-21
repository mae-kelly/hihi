// src/hooks/useVisibilityData.ts
import { useState, useEffect } from 'react';

interface GlobalViewData {
  total_assets: number;
  splunk_assets: number;
  cmdb_assets: number;
  edr_assets: number;
  splunk_coverage: number;
  cmdb_coverage: number;
  edr_coverage: number;
}

interface InfrastructureData {
  infrastructure_type_s: string;
  total_assets: number;
  visible_assets: number;
  edr_protected: number;
  visibility_percentage: number;
  edr_coverage_pct: number;
}

interface RegionalData {
  region_s: string;
  country_s: string;
  total_assets: number;
  visible_assets: number;
  in_cmdb: number;
  visibility_percentage: number;
  cmdb_coverage_pct: number;
}

interface BusinessUnitData {
  business_unit_s: string;
  cio_s: string;
  total_assets: number;
  apm_monitored: number;
  log_forwarding: number;
  logging_visibility_pct: number;
  apm_coverage_pct: number;
}

interface SecurityControlData {
  class_s: string;
  total_assets: number;
  edr_covered: number;
  tanium_managed: number;
  dlp_covered: number;
  edr_coverage_pct: number;
  tanium_coverage_pct: number;
  dlp_coverage_pct: number;
}

interface CriticalGap {
  host_s: string;
  fqdn_s: string;
  business_unit_s: string;
  class_s: string;
  system_classification_s: string;
  infrastructure_type_s: string;
  logging_in_splunk_s: string;
  edr_coverage_s: string;
  present_in_cmdb_s: string;
  data_quality_score: number;
  last_updated: string;
}

// Custom hook for global view data
export const useGlobalView = () => {
  const [data, setData] = useState<GlobalViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visibility/global');
        if (!response.ok) throw new Error('Failed to fetch global data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Custom hook for infrastructure data
export const useInfrastructureView = () => {
  const [data, setData] = useState<InfrastructureData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visibility/infrastructure');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Custom hook for regional data
export const useRegionalView = () => {
  const [data, setData] = useState<RegionalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visibility/regional');
        if (!response.ok) throw new Error('Failed to fetch regional data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Custom hook for business unit data
export const useBusinessUnitView = () => {
  const [data, setData] = useState<BusinessUnitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visibility/business-units');
        if (!response.ok) throw new Error('Failed to fetch business unit data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Custom hook for security controls data
export const useSecurityControls = () => {
  const [data, setData] = useState<SecurityControlData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visibility/security-controls');
        if (!response.ok) throw new Error('Failed to fetch security controls data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Custom hook for critical gaps
export const useCriticalGaps = () => {
  const [data, setData] = useState<CriticalGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/visibility/gaps');
        if (!response.ok) throw new Error('Failed to fetch critical gaps data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
};

// Main hook that combines all data for dashboard
export const useVisibilityDashboard = () => {
  const globalView = useGlobalView();
  const infrastructure = useInfrastructureView();
  const regional = useRegionalView();
  const businessUnits = useBusinessUnitView();
  const securityControls = useSecurityControls();
  const criticalGaps = useCriticalGaps();

  const loading = globalView.loading || infrastructure.loading || regional.loading || 
                 businessUnits.loading || securityControls.loading || criticalGaps.loading;

  const error = globalView.error || infrastructure.error || regional.error || 
               businessUnits.error || securityControls.error || criticalGaps.error;

  return {
    globalView: globalView.data,
    infrastructure: infrastructure.data,
    regional: regional.data,
    businessUnits: businessUnits.data,
    securityControls: securityControls.data,
    criticalGaps: criticalGaps.data,
    loading,
    error
  };
};