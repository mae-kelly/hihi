import { DashboardData, LogSource, SystemVisibility, ThreatMetric, VisibilityGap, ComplianceMetric } from '@/types';

export const mockLogSources: LogSource[] = [
  {
    id: 'ls-001',
    name: 'Firewall Cluster Alpha',
    type: 'network',
    status: 'active',
    eventsPerSecond: 15420,
    coverage: 100,
    compliance: { csoc: true, splunk: true, chronicle: true, average: true }
  },
  {
    id: 'ls-002',
    name: 'EDR Sentinel Network',
    type: 'endpoint',
    status: 'active',
    eventsPerSecond: 8930,
    coverage: 87,
    compliance: { csoc: true, splunk: true, chronicle: false, average: true }
  },
  {
    id: 'ls-003',
    name: 'Cloud Shield AWS',
    type: 'cloud',
    status: 'active',
    eventsPerSecond: 12350,
    coverage: 93,
    compliance: { csoc: true, splunk: true, chronicle: true, average: false }
  },
  {
    id: 'ls-004',
    name: 'API Gateway Nexus',
    type: 'application',
    status: 'error',
    eventsPerSecond: 0,
    coverage: 45,
    compliance: { csoc: false, splunk: false, chronicle: false, average: false }
  },
  {
    id: 'ls-005',
    name: 'Identity Matrix',
    type: 'identity',
    status: 'active',
    eventsPerSecond: 3240,
    coverage: 78,
    compliance: { csoc: true, splunk: false, chronicle: true, average: true }
  }
];

export const mockSystems: SystemVisibility[] = [
  {
    name: 'AIS Server',
    coverage: 100,
    status: 'secure',
    lastScan: '2025-01-20T10:30:00Z',
    threats: 0
  },
  {
    name: 'Citrix Netscaler',
    coverage: 100,
    status: 'secure',
    lastScan: '2025-01-20T10:15:00Z',
    threats: 0
  },
  {
    name: 'ESX Server',
    coverage: 100,
    status: 'warning',
    lastScan: '2025-01-20T09:45:00Z',
    threats: 2
  },
  {
    name: 'F5 BIG-IP',
    coverage: 100,
    status: 'secure',
    lastScan: '2025-01-20T10:00:00Z',
    threats: 0
  },
  {
    name: 'Firewall Hardware',
    coverage: 100,
    status: 'secure',
    lastScan: '2025-01-20T10:25:00Z',
    threats: 0
  },
  {
    name: 'Hyper-V Server',
    coverage: 100,
    status: 'critical',
    lastScan: '2025-01-20T08:30:00Z',
    threats: 5
  },
  {
    name: 'IBM Frame',
    coverage: 99.1,
    status: 'secure',
    lastScan: '2025-01-20T10:20:00Z',
    threats: 0
  },
  {
    name: 'IBM HMC Server',
    coverage: 100,
    status: 'secure',
    lastScan: '2025-01-20T10:10:00Z',
    threats: 0
  }
];

export const mockThreats: ThreatMetric[] = [
  {
    id: 'threat-001',
    severity: 'critical',
    type: 'Ransomware Detection',
    source: 'Hyper-V Server',
    timestamp: '2025-01-20T08:30:00Z',
    status: 'active',
    affectedSystems: 3
  },
  {
    id: 'threat-002',
    severity: 'high',
    type: 'Privilege Escalation',
    source: 'ESX Server',
    timestamp: '2025-01-20T09:15:00Z',
    status: 'investigating',
    affectedSystems: 1
  },
  {
    id: 'threat-003',
    severity: 'medium',
    type: 'Suspicious Network Activity',
    source: 'Firewall Cluster Alpha',
    timestamp: '2025-01-20T10:00:00Z',
    status: 'mitigated',
    affectedSystems: 0
  },
  {
    id: 'threat-004',
    severity: 'critical',
    type: 'Data Exfiltration Attempt',
    source: 'Cloud Shield AWS',
    timestamp: '2025-01-20T10:20:00Z',
    status: 'active',
    affectedSystems: 2
  },
  {
    id: 'threat-005',
    severity: 'low',
    type: 'Failed Login Attempts',
    source: 'Identity Matrix',
    timestamp: '2025-01-20T10:25:00Z',
    status: 'mitigated',
    affectedSystems: 0
  }
];

export const mockVisibilityGaps: VisibilityGap[] = [
  {
    id: 'gap-001',
    system: 'API Gateway',
    type: 'Logging Configuration',
    impact: 'critical',
    recommendation: 'Enable comprehensive API logging and integrate with SIEM',
    estimatedCoverage: 45
  },
  {
    id: 'gap-002',
    system: 'Cloud Infrastructure',
    type: 'Container Monitoring',
    impact: 'high',
    recommendation: 'Deploy container security monitoring solution',
    estimatedCoverage: 60
  },
  {
    id: 'gap-003',
    system: 'Network Perimeter',
    type: 'DNS Logging',
    impact: 'medium',
    recommendation: 'Implement DNS query logging and analysis',
    estimatedCoverage: 75
  },
  {
    id: 'gap-004',
    system: 'Endpoint Protection',
    type: 'Mobile Device Coverage',
    impact: 'high',
    recommendation: 'Extend EDR coverage to mobile devices',
    estimatedCoverage: 30
  }
];

export const mockCompliance: ComplianceMetric[] = [
  {
    framework: 'ISO 27001',
    score: 92,
    gaps: 3,
    requirements: {
      total: 114,
      met: 105,
      partial: 6,
      failed: 3
    }
  },
  {
    framework: 'NIST CSF',
    score: 88,
    gaps: 5,
    requirements: {
      total: 98,
      met: 86,
      partial: 7,
      failed: 5
    }
  },
  {
    framework: 'SOC 2',
    score: 95,
    gaps: 2,
    requirements: {
      total: 64,
      met: 61,
      partial: 1,
      failed: 2
    }
  }
];

export const generateMockDashboardData = (): DashboardData => {
  return {
    overallVisibility: 87.3,
    systemsMonitored: 142,
    activeThreats: 7,
    complianceScore: 91.7,
    logSources: mockLogSources,
    systems: mockSystems,
    threats: mockThreats,
    visibilityGaps: mockVisibilityGaps,
    compliance: mockCompliance,
    metrics: {
      eventsPerSecond: 39940,
      dataIngested: '2.4 TB',
      alertsGenerated: 156,
      mttr: 12.5
    }
  };
};

// Generate time series data for charts
export const generateTimeSeriesData = (hours: number = 24) => {
  const data = [];
  const now = new Date();
  
  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toISOString(),
      events: Math.floor(Math.random() * 50000) + 30000,
      threats: Math.floor(Math.random() * 10),
      visibility: Math.floor(Math.random() * 10) + 85,
      compliance: Math.floor(Math.random() * 5) + 90
    });
  }
  
  return data;
};

// Generate network topology data
export const generateNetworkTopology = () => {
  return {
    nodes: [
      { id: 'core', label: 'Core Network', type: 'router', x: 50, y: 50 },
      { id: 'fw1', label: 'Firewall Alpha', type: 'firewall', x: 30, y: 30 },
      { id: 'fw2', label: 'Firewall Beta', type: 'firewall', x: 70, y: 30 },
      { id: 'dmz', label: 'DMZ', type: 'zone', x: 50, y: 20 },
      { id: 'internal', label: 'Internal Network', type: 'zone', x: 50, y: 70 },
      { id: 'cloud', label: 'Cloud Services', type: 'cloud', x: 80, y: 50 },
      { id: 'endpoints', label: 'Endpoint Fleet', type: 'endpoint', x: 20, y: 70 }
    ],
    edges: [
      { source: 'core', target: 'fw1' },
      { source: 'core', target: 'fw2' },
      { source: 'fw1', target: 'dmz' },
      { source: 'fw2', target: 'dmz' },
      { source: 'core', target: 'internal' },
      { source: 'core', target: 'cloud' },
      { source: 'internal', target: 'endpoints' }
    ]
  };
};