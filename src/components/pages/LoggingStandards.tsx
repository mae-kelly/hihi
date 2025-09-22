import React, { useState, useEffect } from 'react';
import { FileText, CheckCircle, XCircle, AlertCircle, Shield, Database, Network, Activity, Terminal, Lock, Layers, Server, Wifi, Cloud, AlertTriangle } from 'lucide-react';

const LoggingStandards: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [complianceScore, setComplianceScore] = useState(0);

  // ACTUAL DATA FROM AO1 REQUIREMENTS - Logging Standards and Requirements
  const loggingRoles = {
    'Network': {
      role: 'Network',
      status: 'partial',
      coverage: 45.2,
      logTypes: ['Firewall Traffic', 'IDS/IPS', 'NDR', 'Proxy', 'DNS', 'WAF'],
      commonDataFields: [
        'IP (source, target)',
        'Protocol',
        'Detection Signature',
        'Port',
        'DNS record/FQDN',
        'HTTP Headers'
      ],
      visibilityFactors: [
        { factor: 'URL/FQDN Coverage', status: 'partial', percentage: 67.8 },
        { factor: 'CMDB Asset Visibility', status: 'complete', percentage: 100 },
        { factor: 'Network Zones/spans', status: 'failed', percentage: 32.1 },
        { factor: 'IPAM Public IP Coverage', status: 'partial', percentage: 72.3 },
        { factor: 'Geolocation', status: 'partial', percentage: 58.9 },
        { factor: 'VPC', status: 'failed', percentage: 19.2 },
        { factor: '%log ingest volume', status: 'warning', percentage: 45.2 }
      ],
      gaps: 'Network appliances showing only 45.2% coverage - critical gap',
      recommendation: 'Enable SNMP and NetFlow on all network devices'
    },
    'Endpoint': {
      role: 'Endpoint',
      status: 'warning',
      coverage: 69.29,
      logTypes: ['OS logs (WinEVT, Linux syslog)', 'EDR', 'DLP', 'FIM'],
      commonDataFields: [
        'system name',
        'IP',
        'filename'
      ],
      visibilityFactors: [
        { factor: 'CMDB Asset Visibility', status: 'complete', percentage: 100 },
        { factor: 'Crowdstrike Agent Coverage', status: 'partial', percentage: 87.2 },
        { factor: '%log ingest volume', status: 'partial', percentage: 69.29 }
      ],
      gaps: 'Linux servers at 69.29% coverage - 30.71% missing',
      recommendation: 'Deploy syslog forwarding to all Linux systems'
    },
    'Cloud': {
      role: 'Cloud',
      status: 'critical',
      coverage: 19.17,
      logTypes: [
        'Cloud Event',
        'Cloud Load Balancer',
        'Cloud Config',
        'Theom',
        'WIZ',
        'Cloud Security'
      ],
      commonDataFields: [
        'VPC',
        'Instance ID',
        'Region',
        'Account ID',
        'Resource Tags'
      ],
      visibilityFactors: [
        { factor: 'VPC', status: 'failed', percentage: 19.17 },
        { factor: 'IPAM Public IP Coverage', status: 'failed', percentage: 23.4 },
        { factor: 'URL/FQDN coverage', status: 'failed', percentage: 28.7 },
        { factor: 'Crowdstrike Agent Coverage', status: 'partial', percentage: 62.3 }
      ],
      gaps: 'Cloud infrastructure at critical 19.17% coverage',
      recommendation: 'IMMEDIATE: Enable CloudTrail, VPC Flow Logs, and cloud-native logging'
    },
    'Application': {
      role: 'Application',
      status: 'warning',
      coverage: 42.8,
      logTypes: ['Web Logs (HTTP Access)', 'API Gateway'],
      commonDataFields: [
        'URL',
        'Method',
        'Status Code',
        'Response Time',
        'User Agent'
      ],
      visibilityFactors: [
        { factor: 'URL/FQDN coverage', status: 'partial', percentage: 67.2 },
        { factor: 'Control Coverage', status: 'failed', percentage: 42.8 }
      ],
      gaps: 'API Gateway logging incomplete',
      recommendation: 'Enable comprehensive API logging and monitoring'
    },
    'Identity & Authentication': {
      role: 'Identity and Authentication',
      status: 'active',
      coverage: 82.3,
      logTypes: [
        'Authentication attempts',
        'Privilege escalation',
        'Identity create/modify/destroy'
      ],
      commonDataFields: [
        'Username',
        'Domain',
        'Authentication Type',
        'Source IP',
        'Result'
      ],
      visibilityFactors: [
        { factor: 'Domain', status: 'complete', percentage: 95.2 },
        { factor: 'Internal', status: 'partial', percentage: 78.9 },
        { factor: 'External', status: 'partial', percentage: 72.8 },
        { factor: 'Controls', status: 'partial', percentage: 82.3 }
      ],
      gaps: 'External authentication not fully covered',
      recommendation: 'Integrate external IdP logging with SIEM'
    }
  };

  const loggingProcess = {
    'Configure': {
      step: 1,
      status: 'complete',
      completion: 100,
      description: 'Using concepts in Log Role Mapping table and Logging Standard, assets determined if they fall within scope',
      issues: [],
      action: 'Completed - all assets mapped'
    },
    'Collect': {
      step: 2,
      status: 'partial',
      completion: 75,
      description: 'Mechanism selected to collect logs from local systems and export to architected destinations',
      issues: [
        'Linux syslog collection incomplete',
        'Cloud collectors not deployed in all regions',
        'Network device collection gaps'
      ],
      action: 'Deploy missing collectors'
    },
    'Transport': {
      step: 3,
      status: 'partial',
      completion: 68,
      description: 'Transport layer ensures log data forwarded to SIEM - variety of transport methods',
      issues: [
        'Bandwidth constraints in APAC',
        'TLS encryption not enabled on all streams',
        'Kafka pipeline bottlenecks'
      ],
      action: 'Upgrade transport infrastructure'
    },
    'Ingest': {
      step: 4,
      status: 'warning',
      completion: 52,
      description: 'Data ingested into SIEM - transport flow, credentials, and latency reviewed',
      issues: [
        'High ingestion latency (>5 min)',
        'Chronicle ingestion failing for some sources',
        'Splunk license limits reached'
      ],
      action: 'Optimize ingestion pipeline'
    },
    'Normalize': {
      step: 5,
      status: 'failed',
      completion: 38,
      description: 'Data normalization requirement - many SIEMs need data properly parsed',
      issues: [
        'Custom log formats not parsed',
        'Field mapping incomplete',
        'Timestamp normalization failing'
      ],
      action: 'Implement parsing rules'
    }
  };

  const visibilityFactorMetrics = {
    'Host Parity': {
      description: 'Comparing host name covered in control/mapping visibility based on existence in CMDB',
      current: 87.3,
      target: 100,
      gap: 12.7,
      status: 'warning'
    },
    'URL/FQDN Coverage': {
      description: 'Every URL/FQDN covered in SIEM, cross reference with listed FQDN "external" flag',
      current: 67.8,
      target: 95,
      gap: 27.2,
      status: 'warning'
    },
    'Public IP Space': {
      description: 'How do we account for all public IP space, full list of CIDR',
      current: 72.3,
      target: 100,
      gap: 27.7,
      status: 'warning'
    }
  };

  // Calculate overall compliance
  useEffect(() => {
    const overallScore = Object.values(loggingRoles).reduce((sum, role) => sum + role.coverage, 0) / Object.keys(loggingRoles).length;
    setComplianceScore(overallScore);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'complete': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' };
      case 'active': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' };
      case 'partial': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500' };
      case 'warning': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' };
      case 'failed': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' };
      case 'critical': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500' };
      default: return { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'complete': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'partial': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-400" />;
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />;
      default: return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-black mb-3 holo-text">
          LOGGING STANDARDS & COMPLIANCE
        </h1>
        <p className="text-purple-300/60 uppercase tracking-widest text-sm">
          Fiserv Cybersecurity Logging Standard • Log Role Mapping • Process Compliance
        </p>
      </div>

      {/* Critical Alert */}
      <div className="mb-6 glass-panel rounded-xl p-4 border-red-500/50 bg-red-500/10">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 animate-pulse" />
          <div>
            <span className="text-red-400 font-bold">CRITICAL LOGGING FAILURE:</span>
            <span className="text-white ml-2">Cloud infrastructure at 19.17% - Network at 45.2% - Multiple standards violations</span>
          </div>
        </div>
      </div>

      {/* Overall Compliance Score */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="glass-panel rounded-xl p-6">
          <FileText className="w-6 h-6 text-cyan-400 mb-2" />
          <div className="text-3xl font-bold text-orange-400">{complianceScore.toFixed(1)}%</div>
          <div className="text-xs text-gray-400 uppercase">Overall Compliance</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Network className="w-6 h-6 text-red-400 mb-2" />
          <div className="text-3xl font-bold text-red-400">3/5</div>
          <div className="text-xs text-gray-400 uppercase">Failed Roles</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Activity className="w-6 h-6 text-yellow-400 mb-2" />
          <div className="text-3xl font-bold text-yellow-400">2/5</div>
          <div className="text-xs text-gray-400 uppercase">Process Steps Failed</div>
        </div>
        <div className="glass-panel rounded-xl p-6">
          <Shield className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-bold text-purple-400">HIGH</div>
          <div className="text-xs text-gray-400 uppercase">Risk Level</div>
        </div>
      </div>

      {/* Log Role Mapping */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-cyan-300 mb-4">LOG ROLE MAPPING</h2>
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(loggingRoles).map(([roleName, role]) => {
            const statusColors = getStatusColor(role.status);
            return (
              <div 
                key={roleName}
                className={`glass-panel rounded-2xl p-6 cursor-pointer transition-all ${statusColors.border} ${
                  selectedRole === roleName ? 'scale-101' : ''
                }`}
                onClick={() => setSelectedRole(roleName === selectedRole ? null : roleName)}
                style={{
                  boxShadow: selectedRole === roleName ? '0 0 40px rgba(192, 132, 252, 0.4)' : undefined
                }}
              >
                {/* Role Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {roleName === 'Network' && <Network className="w-6 h-6 text-cyan-400" />}
                    {roleName === 'Endpoint' && <Server className="w-6 h-6 text-purple-400" />}
                    {roleName === 'Cloud' && <Cloud className="w-6 h-6 text-pink-400" />}
                    {roleName === 'Application' && <Layers className="w-6 h-6 text-yellow-400" />}
                    {roleName === 'Identity & Authentication' && <Lock className="w-6 h-6 text-green-400" />}
                    <div>
                      <h3 className="text-xl font-bold text-white">{roleName}</h3>
                      <p className="text-sm text-gray-400">{role.logTypes.length} log types configured</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{
                      color: role.coverage < 30 ? '#ff0044' : 
                             role.coverage < 60 ? '#ffaa00' : 
                             role.coverage < 80 ? '#ffff00' :
                             '#00ff88'
                    }}>
                      {role.coverage}%
                    </div>
                    <div className="text-xs text-gray-400">Coverage</div>
                  </div>
                </div>

                {/* Coverage Bar */}
                <div className="mb-4">
                  <div className="h-4 bg-black/50 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${role.coverage}%`,
                        background: role.coverage < 30 ? 'linear-gradient(90deg, #ff0044, #ff00ff)' :
                                   role.coverage < 60 ? 'linear-gradient(90deg, #ffaa00, #ffff00)' :
                                   role.coverage < 80 ? 'linear-gradient(90deg, #ffff00, #00ffff)' :
                                   'linear-gradient(90deg, #00ff88, #00ffff)'
                      }}
                    />
                  </div>
                </div>

                {/* Log Types */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-2">Log Types</h4>
                  <div className="flex flex-wrap gap-2">
                    {role.logTypes.map(type => (
                      <span key={type} className="px-2 py-1 rounded bg-gray-700/50 text-xs text-gray-300">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedRole === roleName && (
                  <>
                    {/* Data Fields */}
                    <div className="mb-4 pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-semibold text-gray-400 mb-2">Common Data Fields</h4>
                      <div className="flex flex-wrap gap-2">
                        {role.commonDataFields.map(field => (
                          <span key={field} className="px-2 py-1 rounded bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-400">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Visibility Factors */}
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-400 mb-3">Visibility Factors</h4>
                      <div className="space-y-2">
                        {role.visibilityFactors.map(factor => (
                          <div key={factor.factor} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(factor.status)}
                              <span className="text-sm text-gray-300">{factor.factor}</span>
                            </div>
                            <span className={`text-sm font-mono font-bold ${
                              factor.percentage < 30 ? 'text-red-400' :
                              factor.percentage < 60 ? 'text-yellow-400' :
                              factor.percentage < 80 ? 'text-orange-400' :
                              'text-green-400'
                            }`}>
                              {factor.percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Gaps and Recommendations */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-red-500/10 border border-red-500/30 rounded">
                        <h4 className="text-sm font-semibold text-red-400 mb-1">Gap</h4>
                        <p className="text-xs text-gray-300">{role.gaps}</p>
                      </div>
                      <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded">
                        <h4 className="text-sm font-semibold text-yellow-400 mb-1">Action Required</h4>
                        <p className="text-xs text-gray-300">{role.recommendation}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Logging Process Pipeline */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-purple-300 mb-4">LOGGING PROCESS PIPELINE</h2>
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            {Object.entries(loggingProcess).map(([step, data], index) => (
              <React.Fragment key={step}>
                <div className="flex-1">
                  <div className={`text-center ${data.status === 'failed' ? 'animate-pulse' : ''}`}>
                    <div className={`w-16 h-16 mx-auto mb-2 rounded-full flex items-center justify-center ${
                      getStatusColor(data.status).bg
                    } ${getStatusColor(data.status).border} border-2`}>
                      {getStatusIcon(data.status)}
                    </div>
                    <h4 className="font-semibold text-white">{step}</h4>
                    <div className={`text-xs mt-1 ${getStatusColor(data.status).text}`}>
                      {data.completion}%
                    </div>
                  </div>
                </div>
                {index < Object.keys(loggingProcess).length - 1 && (
                  <div className={`flex-shrink-0 w-12 h-0.5 ${
                    data.status === 'complete' ? 'bg-green-400' :
                    data.status === 'partial' ? 'bg-yellow-400' :
                    'bg-red-400'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Process Details */}
          <div className="grid grid-cols-5 gap-4">
            {Object.entries(loggingProcess).map(([step, data]) => (
              <div key={step} className="text-center">
                <div className="glass-panel rounded-lg p-3">
                  <h5 className="text-xs font-semibold text-gray-400 mb-1">Step {data.step}</h5>
                  <p className="text-xs text-gray-300 mb-2">{data.description}</p>
                  {data.issues.length > 0 && (
                    <div className="text-xs text-red-400">
                      {data.issues.length} issues
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visibility Factor Metrics */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-cyan-300 mb-4">VISIBILITY FACTOR METRICS</h2>
        <div className="grid grid-cols-3 gap-6">
          {Object.entries(visibilityFactorMetrics).map(([factor, data]) => (
            <div key={factor} className="glass-panel rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-2">{factor}</h3>
              <p className="text-xs text-gray-400 mb-3">{data.description}</p>
              
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Current</span>
                <span className={`text-xl font-bold ${
                  data.current < 50 ? 'text-red-400' :
                  data.current < 80 ? 'text-yellow-400' :
                  'text-green-400'
                }`}>
                  {data.current}%
                </span>
              </div>
              
              <div className="h-2 bg-black/50 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full rounded-full"
                  style={{
                    width: `${data.current}%`,
                    background: data.current < 50 ? '#ff0044' :
                               data.current < 80 ? '#ffaa00' :
                               '#00ff88'
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Target: {data.target}%</span>
                <span className="text-red-400">Gap: {data.gap}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Plan */}
      <div className="glass-panel rounded-2xl p-6 bg-red-500/5 border border-red-500/30">
        <h3 className="text-xl font-bold text-red-400 mb-4">CRITICAL ACTIONS FOR LOGGING COMPLIANCE</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-black/50 rounded-lg">
            <div className="text-sm font-bold text-yellow-400 mb-2">IMMEDIATE: CLOUD LOGGING</div>
            <p className="text-xs text-gray-300">Enable CloudTrail, VPC Flow Logs, and cloud-native logging. Current 19.17% is critical.</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg">
            <div className="text-sm font-bold text-yellow-400 mb-2">URGENT: NETWORK DEVICES</div>
            <p className="text-xs text-gray-300">Configure SNMP/NetFlow on all devices. 45.2% coverage violates standards.</p>
          </div>
          <div className="p-4 bg-black/50 rounded-lg">
            <div className="text-sm font-bold text-yellow-400 mb-2">PRIORITY: NORMALIZATION</div>
            <p className="text-xs text-gray-300">Fix parsing rules for custom logs. 38% completion blocking compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoggingStandards;