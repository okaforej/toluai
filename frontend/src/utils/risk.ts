// Risk scoring utilities
export const getRiskLevel = (score: number): string => {
  if (score <= 20) return 'Low Risk';
  if (score <= 40) return 'Moderate-Low Risk';
  if (score <= 60) return 'Moderate Risk';
  if (score <= 80) return 'Moderate-High Risk';
  return 'High Risk';
};

export const getRiskColor = (score: number): string => {
  if (score <= 20) return 'text-success-600 bg-success-50 border-success-200';
  if (score <= 40) return 'text-success-700 bg-success-100 border-success-300';
  if (score <= 60) return 'text-warning-700 bg-warning-100 border-warning-300';
  if (score <= 80) return 'text-warning-800 bg-warning-200 border-warning-400';
  return 'text-error-700 bg-error-100 border-error-300';
};

export const getRiskColorClass = (score: number): string => {
  if (score <= 20) return 'success';
  if (score <= 40) return 'success';
  if (score <= 60) return 'warning';
  if (score <= 80) return 'warning';
  return 'error';
};

export const getRiskBadgeColor = (riskLevel: string): string => {
  switch (riskLevel.toLowerCase()) {
    case 'low':
    case 'low risk':
      return 'bg-success-100 text-success-800 border-success-200';
    case 'moderate-low':
    case 'moderate-low risk':
      return 'bg-success-200 text-success-900 border-success-300';
    case 'moderate':
    case 'moderate risk':
      return 'bg-warning-100 text-warning-800 border-warning-300';
    case 'moderate-high':
    case 'moderate-high risk':
      return 'bg-warning-200 text-warning-900 border-warning-400';
    case 'high':
    case 'high risk':
      return 'bg-error-100 text-error-800 border-error-300';
    case 'critical':
    case 'critical risk':
      return 'bg-error-200 text-error-900 border-error-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const formatRiskScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'N/A';
  return Math.round(score).toString();
};

export const getProgressBarColor = (score: number): string => {
  if (score <= 20) return 'bg-success-500';
  if (score <= 40) return 'bg-success-600';
  if (score <= 60) return 'bg-warning-500';
  if (score <= 80) return 'bg-warning-600';
  return 'bg-error-500';
};

// Status utilities
export const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
    case 'completed':
    case 'approved':
    case 'compliant':
      return 'bg-success-100 text-success-800 border-success-200';
    case 'pending':
    case 'in_progress':
    case 'under_review':
      return 'bg-warning-100 text-warning-800 border-warning-300';
    case 'inactive':
    case 'rejected':
    case 'failed':
    case 'non_compliant':
      return 'bg-error-100 text-error-800 border-error-300';
    case 'draft':
    case 'new':
      return 'bg-primary-100 text-primary-800 border-primary-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Format utilities
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  return new Intl.NumberFormat('en-US').format(num);
};

export const formatPercentage = (num: number | null | undefined): string => {
  if (num === null || num === undefined) return 'N/A';
  return `${num}%`;
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'N/A';
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Company size utilities
export const getCompanySizeLabel = (size?: number): string => {
  if (!size) return 'Not specified';
  if (size < 50) return 'Small';
  if (size < 500) return 'Medium';
  if (size < 5000) return 'Large';
  return 'Enterprise';
};

export const getCompanySizeColor = (size?: number): string => {
  if (!size) return 'bg-gray-100 text-gray-800 border-gray-300';
  if (size < 50) return 'bg-primary-100 text-primary-800 border-primary-300';
  if (size < 500) return 'bg-success-100 text-success-800 border-success-300';
  if (size < 5000) return 'bg-warning-100 text-warning-800 border-warning-300';
  return 'bg-secondary-100 text-secondary-800 border-secondary-300';
};
