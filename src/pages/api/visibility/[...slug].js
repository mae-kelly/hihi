// pages/api/visibility/[...slug].js
import UniversalCMDBAPI from '../../../api/database.js';

const api = new UniversalCMDBAPI();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { slug } = req.query;
    const endpoint = Array.isArray(slug) ? slug.join('/') : slug;

    let data;

    switch (endpoint) {
      case 'global':
        data = await api.getGlobalView();
        break;
      
      case 'infrastructure':
        data = await api.getInfrastructureView();
        break;
      
      case 'regional':
        data = await api.getRegionalCountryView();
        break;
      
      case 'business-units':
        data = await api.getBusinessUnitView();
        break;
      
      case 'system-classification':
        data = await api.getSystemClassification();
        break;
      
      case 'security-controls':
        data = await api.getSecurityControlCoverage();
        break;
      
      case 'domains':
        data = await api.getDomainVisibility();
        break;
      
      case 'compliance':
        data = await api.getComplianceMatrix();
        break;
      
      case 'gaps':
        data = await api.getCriticalGaps();
        break;
      
      case 'data-quality':
        data = await api.getDataQualityMetrics();
        break;
      
      default:
        return res.status(404).json({ error: 'Endpoint not found' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}