import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { irpaAnalyticsAPI, irpaInsuredEntitiesAPI, irpaAssessmentsAPI } from '../services/irpaApi';
import { IRPARiskAssessment, RiskDistribution, AssessmentTrend } from '../types/irpa';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { mockInsuredEntities } from '../data/mockInsuredEntities';
import RiskHeatMap from '../components/Charts/RiskHeatMap';

interface DashboardStats {
  totalInsuredEntities: number;
  totalAssessments: number;
  highRiskEntities: number;
}

const IRPADashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalInsuredEntities: 0,
    totalAssessments: 0,
    highRiskEntities: 0,
  });
  const [riskDistribution, setRiskDistribution] = useState<
    RiskDistribution & { total_assessments: number }
  >({
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    total_assessments: 0,
  });
  const [assessmentTrends, setAssessmentTrends] = useState<AssessmentTrend[]>([]);
  const [recentAssessments, setRecentAssessments] = useState<IRPARiskAssessment[]>([]);
  const [zipCodeRiskData, setZipCodeRiskData] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      try {
        // Load basic stats
        const [entitiesResponse, assessmentsResponse] = await Promise.all([
          irpaInsuredEntitiesAPI.list({ per_page: 1 }),
          irpaAssessmentsAPI.list({ per_page: 1 }),
        ]);

        // Load recent data for display
        const recentAssessmentsResponse = await irpaAssessmentsAPI.list({
          per_page: 5,
          status: 'completed',
        });

        // Load analytics data
        const [riskDistributionResponse, trendsResponse] = await Promise.all([
          irpaAnalyticsAPI.getRiskDistribution(),
          irpaAnalyticsAPI.getAssessmentTrends({ days: 30 }),
        ]);

        // Load zip code risk data
        try {
          const zipCodeResponse = await fetch('/api/v2/irpa/analytics/zip-code-risk');
          if (zipCodeResponse.ok) {
            const zipCodeData = await zipCodeResponse.json();
            setZipCodeRiskData(zipCodeData.zip_code_data || []);
          }
        } catch (error) {
          console.log('Failed to load zip code risk data:', error);
        }

        // Calculate high risk entities
        const highRiskCount = recentAssessmentsResponse.assessments.filter(
          (assessment) =>
            assessment.risk_category === 'high' || assessment.risk_category === 'critical'
        ).length;

        setStats({
          totalInsuredEntities: entitiesResponse.pagination.total,
          totalAssessments: assessmentsResponse.pagination.total,
          highRiskEntities: highRiskCount,
        });

        setRecentAssessments(recentAssessmentsResponse.assessments);

        if (riskDistributionResponse.risk_distribution) {
          setRiskDistribution(riskDistributionResponse.risk_distribution);
        }

        if (trendsResponse.trends) {
          setAssessmentTrends(trendsResponse.trends);
        }
      } catch (error) {
        console.log('API failed, using mock data for dashboard:', error);

        // Use mock data as fallback
        const mockEntitiesWithRiskScores = mockInsuredEntities.map((entity) => ({
          ...entity,
          latest_risk_score: calculateMockRiskScore(entity),
        }));

        const highRiskCount = mockEntitiesWithRiskScores.filter(
          (e) => e.latest_risk_score > 70
        ).length;

        setStats({
          totalInsuredEntities: mockEntitiesWithRiskScores.length,
          totalAssessments: Math.floor(mockEntitiesWithRiskScores.length * 1.5),
          highRiskEntities: highRiskCount,
        });

        // Generate mock risk distribution
        const distribution = calculateMockRiskDistribution(mockEntitiesWithRiskScores);
        setRiskDistribution({
          ...distribution,
          total_assessments: mockEntitiesWithRiskScores.length,
        });

        // Generate mock assessment trends
        setAssessmentTrends(generateMockAssessmentTrends());

        // Generate mock recent assessments
        const mockAssessments: IRPARiskAssessment[] = mockEntitiesWithRiskScores
          .slice(0, 5)
          .map((entity, index) => ({
            id: index + 1,
            entity_id: entity.id,
            entity_name: entity.name,
            risk_score: entity.latest_risk_score,
            risk_category: getRiskCategory(entity.latest_risk_score),
            assessment_date: new Date(
              Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
            status: 'completed' as const,
            assessor_name: 'System',
            recommendations: [],
            risk_factors: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }));
        setRecentAssessments(mockAssessments);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMockRiskScore = (entity: any): number => {
    const baseScore = 50;
    let score = baseScore;

    if (entity.years_in_business < 2) score += 15;
    else if (entity.years_in_business < 5) score += 10;
    else if (entity.years_in_business > 10) score -= 10;

    if (entity.annual_revenue < 100000) score += 10;
    else if (entity.annual_revenue > 1000000) score -= 5;

    if (entity.education_level?.risk_factor) {
      score += entity.education_level.risk_factor * 10;
    }

    if (entity.job_title?.risk_factor) {
      score += entity.job_title.risk_factor * 5;
    }

    return Math.max(0, Math.min(100, score + (Math.random() * 20 - 10)));
  };

  const calculateMockRiskDistribution = (entities: any[]) => {
    const distribution = { low: 0, medium: 0, high: 0, critical: 0 };
    entities.forEach((entity) => {
      const score = entity.latest_risk_score;
      if (score <= 25) distribution.low++;
      else if (score <= 50) distribution.medium++;
      else if (score <= 75) distribution.high++;
      else distribution.critical++;
    });
    return distribution;
  };

  const getRiskCategory = (score: number): 'low' | 'medium' | 'high' | 'critical' => {
    if (score <= 25) return 'low';
    if (score <= 50) return 'medium';
    if (score <= 75) return 'high';
    return 'critical';
  };

  const generateMockAssessmentTrends = (): AssessmentTrend[] => {
    const trends: AssessmentTrend[] = [];
    const now = new Date();

    for (let i = 29; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const baseCount = Math.floor(Math.random() * 8) + 2;
      const avgScore = Math.random() * 20 + 70;

      trends.push({
        date: date.toISOString().split('T')[0],
        count: baseCount,
        avg_score: avgScore,
      });
    }

    return trends;
  };

  // Prepare chart data
  const riskDistributionData = [
    { name: 'Low Risk', value: riskDistribution.low, color: '#4caf50' },
    { name: 'Medium Risk', value: riskDistribution.medium, color: '#ff9800' },
    { name: 'High Risk', value: riskDistribution.high, color: '#f44336' },
    { name: 'Critical Risk', value: riskDistribution.critical, color: '#d32f2f' },
  ];

  const trendsData = assessmentTrends.map((trend) => ({
    date: format(new Date(trend.date), 'MMM dd'),
    assessments: trend.count,
    avgScore: trend.avg_score || 0,
  }));

  const getRiskChipColor = (category: string): string => {
    switch (category) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'critical':
        return 'bg-red-200 text-red-900';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IRPA Dashboard</h1>
          <p className="text-gray-600">
            Insurance Risk Professional Assessment - Comprehensive Risk Management
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            to="/irpa/companies/new"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Company
          </Link>
          <Link
            to="/irpa/assessments/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a4 4 0 014 0h1m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m6-4a2 2 0 100-4m0 4a2 2 0 100 4"
              />
            </svg>
            Run Assessment
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500 text-white mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalInsuredEntities}</div>
              <div className="text-sm text-gray-600">Insured Entities</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500 text-white mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.totalAssessments}</div>
              <div className="text-sm text-gray-600">Risk Assessments</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-500 text-white mr-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{stats.highRiskEntities}</div>
              <div className="text-sm text-gray-600">High Risk Entities</div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Heat Map */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-5 h-5 mr-2 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Risk Heat Map by Location</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Geographic distribution of risk levels across zip codes</p>
          <RiskHeatMap data={zipCodeRiskData} height={500} />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Risk Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-5 h-5 mr-2 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Risk Distribution</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Current portfolio risk breakdown</p>
          {riskDistribution.total_assessments > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [value, 'Entities']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-72">
              <p className="text-gray-500">No assessment data available</p>
            </div>
          )}
        </div>

        {/* Assessment Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            <svg
              className="w-5 h-5 mr-2 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">Assessment Trends</h3>
          </div>
          <p className="text-sm text-gray-600 mb-6">Last 30 days activity</p>
          {trendsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="assessments"
                  stroke="#8884d8"
                  name="Assessments"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="avgScore"
                  stroke="#82ca9d"
                  name="Avg Score"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex justify-center items-center h-72">
              <p className="text-gray-500">No trend data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Assessments Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Assessments</h3>
        </div>
        {recentAssessments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entity Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAssessments.map((assessment) => (
                  <tr key={assessment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {assessment.entity_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="text-sm font-bold text-gray-900">
                        {assessment.risk_score.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskChipColor(assessment.risk_category)}`}
                      >
                        {assessment.risk_category.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                      {format(new Date(assessment.assessment_date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${assessment.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {assessment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Link
                        to={`/irpa/assessments/${assessment.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-gray-500">No recent assessments</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default IRPADashboardPage;
