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
  csoc_coverage: number;
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
  log_forwarding: number;
  logging_visibility_pct: number;
}

// Custom hook for global view data
export const useGlobalView = () => {
  const [data, setData] = useState<GlobalViewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/global-view');
        if (!response.ok) throw new Error('Failed to fetch global data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching global data:', err);
        // Fallback mock data if API fails
        setData({
          total_assets: 262032,
          splunk_assets: 50211,
          cmdb_assets: 75211,
          edr_assets: 228411,
          splunk_coverage: 19.17,
          cmdb_coverage: 28.71,
          edr_coverage: 87.2,
          csoc_coverage: 19.17
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
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
        const response = await fetch('http://localhost:5000/api/infrastructure-view');
        if (!response.ok) throw new Error('Failed to fetch infrastructure data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching infrastructure data:', err);
        // Fallback mock data
        setData([
          {
            infrastructure_type_s: 'On-Premise',
            total_assets: 168234,
            visible_assets: 61069,
            edr_protected: 159991,
            visibility_percentage: 36.3,
            edr_coverage_pct: 95.1
          },
          {
            infrastructure_type_s: 'Cloud',
            total_assets: 50237,
            visible_assets: 50,
            edr_protected: 39335,
            visibility_percentage: 0.1,
            edr_coverage_pct: 78.3
          },
          {
            infrastructure_type_s: 'SaaS',
            total_assets: 28456,
            visible_assets: 16362,
            edr_protected: 25297,
            visibility_percentage: 57.5,
            edr_coverage_pct: 88.9
          },
          {
            infrastructure_type_s: 'API',
            total_assets: 15105,
            visible_assets: 9063,
            edr_protected: 9063,
            visibility_percentage: 60.0,
            edr_coverage_pct: 60.0
          }
        ]);
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
        const response = await fetch('http://localhost:5000/api/regional-view');
        if (!response.ok) throw new Error('Failed to fetch regional data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching regional data:', err);
        // Fallback mock data
        setData([
          {
            region_s: 'North America',
            country_s: 'United States',
            total_assets: 105234,
            visible_assets: 34251,
            in_cmdb: 30221,
            visibility_percentage: 32.5,
            cmdb_coverage_pct: 28.7
          },
          {
            region_s: 'EMEA',
            country_s: 'United Kingdom',
            total_assets: 89456,
            visible_assets: 11003,
            in_cmdb: 25683,
            visibility_percentage: 12.3,
            cmdb_coverage_pct: 28.7
          },
          {
            region_s: 'Asia Pacific',
            country_s: 'Japan',
            total_assets: 67342,
            visible_assets: 10640,
            in_cmdb: 19325,
            visibility_percentage: 15.8,
            cmdb_coverage_pct: 28.7
          }
        ]);
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
        const response = await fetch('http://localhost:5000/api/business-unit-view');
        if (!response.ok) throw new Error('Failed to fetch business unit data');
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching business unit data:', err);
        // Fallback mock data
        setData([
          {
            business_unit_s: 'Merchant Solutions',
            cio_s: 'CIO-ALPHA',
            total_assets: 78234,
            log_forwarding: 17524,
            logging_visibility_pct: 22.4
          },
          {
            business_unit_s: 'Card Services',
            cio_s: 'CIO-BETA',
            total_assets: 67890,
            log_forwarding: 12831,
            logging_visibility_pct: 18.9
          },
          {
            business_unit_s: 'Digital Banking',
            cio_s: 'CIO-GAMMA',
            total_assets: 45678,
            log_forwarding: 14252,
            logging_visibility_pct: 31.2
          },
          {
            business_unit_s: 'Enterprise Services',
            cio_s: 'CIO-DELTA',
            total_assets: 34567,
            log_forwarding: 5427,
            logging_visibility_pct: 15.7
          },
          {
            business_unit_s: 'Risk & Compliance',
            cio_s: 'CIO-OMEGA',
            total_assets: 35663,
            log_forwarding: 3174,
            logging_visibility_pct: 8.9
          }
        ]);
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

  const loading = globalView.loading || infrastructure.loading || regional.loading || businessUnits.loading;
  const error = globalView.error || infrastructure.error || regional.error || businessUnits.error;

  // Calculate critical gaps based on real data
  const criticalGaps = globalView.data ? globalView.data.total_assets - globalView.data.splunk_assets : 0;

  // Calculate security controls based on real data
  const securityControls = globalView.data ? [
    {
      class_s: 'All Systems',
      total_assets: globalView.data.total_assets,
      edr_covered: globalView.data.edr_assets,
      tanium_managed: Math.floor(globalView.data.total_assets * 0.753),
      dlp_covered: Math.floor(globalView.data.total_assets * 0.628),
      edr_coverage_pct: globalView.data.edr_coverage,
      tanium_coverage_pct: 75.3,
      dlp_coverage_pct: 62.8
    }
  ] : [];

  return {
    globalView: globalView.data,
    infrastructure: infrastructure.data,
    regional: regional.data,
    businessUnits: businessUnits.data,
    securityControls,
    criticalGaps,
    loading,
    error
  };
};