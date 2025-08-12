import React, { useState, useEffect } from 'react';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowPathIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

interface RiskCategory {
  name: string;
  label: string;
  color: string;
  range: string;
}

interface ScoreBreakdown {
  industry: {
    score: number;
    factors: Record<string, number>;
  };
  professional: {
    score: number;
    factors: Record<string, number>;
  };
}

interface IRPAScore {
  irpa_cci_score: number;
  risk_category: string;
  risk_category_label: string;
  risk_category_color: string;
  risk_category_range: string;
  industry_component: number;
  professional_component: number;
  industry_weight: number;
  professional_weight: number;
  breakdown: ScoreBreakdown;
  methodology: string;
  timestamp: string;
}

const IRPAScoringPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scoreData, setScoreData] = useState<IRPAScore | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('industry');

  // 7-tier risk categories
  const riskCategories: RiskCategory[] = [
    { name: 'critical_high', label: 'Critical High Risk', color: '#7c2d12', range: '90-100' },
    { name: 'extremely_high', label: 'Extremely High Risk', color: '#991b1b', range: '80-89' },
    { name: 'very_high', label: 'Very High Risk', color: '#dc2626', range: '70-79' },
    { name: 'high', label: 'High Risk', color: '#ef4444', range: '50-69' },
    { name: 'moderate', label: 'Moderate Risk', color: '#f59e0b', range: '30-50' },
    { name: 'low', label: 'Low Risk', color: '#10b981', range: '20-30' },
    { name: 'very_low', label: 'Very Low Risk', color: '#059669', range: '1-20' },
  ];

  const calculateScore = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:5001/api/v2/irpa/calculate-score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Sample data - in real app, this would come from a form
          industry_type: 'Technology',
          operating_margin: 15,
          employee_count: 5000,
          company_age: 10,
          pe_ratio: 25,
          education_level: "Master's Degree",
          years_experience: 12,
          job_title: 'Senior Manager',
          job_tenure: 5,
          practice_field: 'Technology',
          age: 38,
          state: 'California',
          fico_score: 750,
          dti_ratio: 22,
          payment_history: 98,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to calculate score');
      }

      const data = await response.json();
      setScoreData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculateScore();
  }, []);

  const getRiskIcon = (category: string) => {
    switch (category) {
      case 'critical_high':
      case 'extremely_high':
        return <XCircleIcon className="w-5 h-5" />;
      case 'very_high':
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'moderate':
        return <InformationCircleIcon className="w-5 h-5" />;
      case 'low':
      case 'very_low':
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const formatFactorName = (name: string): string => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRiskLevel = (score: number): string => {
    if (score >= 0.9) return 'Very High';
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Medium';
    if (score >= 0.4) return 'Low';
    return 'Very Low';
  };

  const getRiskColor = (score: number): string => {
    if (score >= 0.9) return 'text-red-600';
    if (score >= 0.8) return 'text-orange-600';
    if (score >= 0.6) return 'text-yellow-600';
    if (score >= 0.4) return 'text-green-600';
    return 'text-green-700';
  };

  return (
    <div className="space-y-6">
      {/* Main Score Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">IRPA CCI Score</h2>
            <p className="text-sm text-gray-600">
              Insurance Risk Professional Assessment - Customer Credit Index
            </p>
          </div>
          <button
            onClick={calculateScore}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Recalculate
          </button>
        </div>
          {error && (
            <div className="p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              Error: {error}
            </div>
          )}

          {scoreData && (
            <div className="space-y-6">
              {/* Score Display */}
              <div className="text-center">
                <div className="mb-2">
                  <span
                    className="text-6xl font-bold"
                    style={{ color: scoreData.risk_category_color }}
                  >
                    {scoreData.irpa_cci_score.toFixed(1)}
                  </span>
                  <span className="text-2xl text-gray-500">/100</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  {getRiskIcon(scoreData.risk_category)}
                  <span
                    style={{ backgroundColor: scoreData.risk_category_color }}
                    className="inline-flex px-3 py-1 text-sm font-semibold text-white rounded-full"
                  >
                    {scoreData.risk_category_label}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Score Range: {scoreData.risk_category_range}
                </p>
              </div>

              {/* Risk Categories Visual */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Risk Category Scale</h4>
                <div className="flex gap-1">
                  {riskCategories.map((category) => (
                    <div
                      key={category.name}
                      className={`flex-1 h-8 rounded flex items-center justify-center text-xs text-white font-medium relative ${
                        scoreData.risk_category === category.name ? 'ring-2 ring-offset-2 ring-gray-800' : ''
                      }`}
                      style={{ backgroundColor: category.color }}
                      title={`${category.label} (${category.range})`}
                    >
                      {scoreData.risk_category === category.name && (
                        <span className="absolute -top-6 text-gray-800">▼</span>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1</span>
                  <span>20</span>
                  <span>30</span>
                  <span>50</span>
                  <span>70</span>
                  <span>80</span>
                  <span>90</span>
                  <span>100</span>
                </div>
              </div>

              {/* Component Scores */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Industry Risk</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-blue-700">
                      {scoreData.industry_component.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${scoreData.industry_component}%` }}
                      />
                    </div>
                    <p className="text-xs text-blue-600">
                      Weight: {(scoreData.industry_weight * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-5 h-5 text-purple-600" />
                    <h4 className="font-medium text-purple-900">Professional Risk</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-purple-700">
                      {scoreData.professional_component.toFixed(1)}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${scoreData.professional_component}%` }}
                      />
                    </div>
                    <p className="text-xs text-purple-600">
                      Weight: {(scoreData.professional_weight * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-4">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('industry')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'industry'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Industry Factors
                    </button>
                    <button
                      onClick={() => setActiveTab('professional')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'professional'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Professional Factors
                    </button>
                  </nav>
                </div>

                <div className="space-y-3 mt-4">
                  {activeTab === 'industry' && Object.entries(scoreData.breakdown.industry.factors).map(([factor, score]) => (
                    <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{formatFactorName(factor)}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getRiskColor(score)}`}>
                          {getRiskLevel(score)}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">
                          {(score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                  {activeTab === 'professional' && Object.entries(scoreData.breakdown.professional.factors).map(([factor, score]) => (
                    <div key={factor} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium">{formatFactorName(factor)}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${getRiskColor(score)}`}>
                          {getRiskLevel(score)}
                        </span>
                        <span className="inline-flex px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-200 rounded-full">
                          {(score * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology Info */}
              <div className="p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CalculatorIcon className="w-4 h-4" />
                  <span>Methodology: {scoreData.methodology}</span>
                  <span className="ml-auto">
                    Updated: {new Date(scoreData.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}
      </div>
    </div>
  );
};

export default IRPAScoringPanel;