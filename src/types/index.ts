export interface SystemVisibility {
  name: string;
  coverage: number;
  status: 'secure' | 'warning' | 'critical' | 'offline';
  lastScan: string;
  threats: number;
}

export interface LogSource {
  id: string;
  name: string;
  type: 'network' | 'endpoint' | 'cloud' | 'application' | 'identity';
  status: 'active' | 'inactive' | 'error';
  eventsPerSecond: number;
  coverage: number;
  compliance: {
    csoc: boolean;
    splunk: boolean;
    chronicle: boolean;
    average: boolean;
  };
}

export interface ThreatMetric {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  source: string;
  timestamp: string;
  status: 'active' | 'mitigated' | 'investigating';
  affectedSystems: number;
}

export interface VisibilityGap {
  id: string;
  system: string;
  type: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  estimatedCoverage: number;
}

export interface ComplianceMetric {
  framework: string;
  score: number;
  gaps: number;
  requirements: {
    total: number;
    met: number;
    partial: number;
    failed: number;
  };
}

export interface DashboardData {
  overallVisibility: number;
  systemsMonitored: number;
  activeThreats: number;
  complianceScore: number;
  logSources: LogSource[];
  systems: SystemVisibility[];
  threats: ThreatMetric[];
  visibilityGaps: VisibilityGap[];
  compliance: ComplianceMetric[];
  metrics: {
    eventsPerSecond: number;
    dataIngested: string;
    alertsGenerated: number;
    mttr: number; // Mean time to respond in minutes
  };
}

export interface User {
  id: string;
  username: string;
  clearanceLevel: 'alpha' | 'beta' | 'gamma' | 'omega';
  department: string;
  lastAccess: string;
}