/**
 * Mock Reference Data Service
 * Provides fallback data for reference data tables when backend is not available
 * Enhanced with external data integration and bootstrap capabilities
 */

import { 
  bootstrapReferenceData, 
  validateAndEnrichReferenceData, 
  generateJobTitles, 
  generatePracticeFields 
} from './externalReferenceData';

// Industry Types Mock Data
export const mockIndustryTypes = [
  {
    industry_type_id: 1,
    industry_name: 'Information Technology',
    risk_category: 'Low',
    base_risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    industry_type_id: 2,
    industry_name: 'Healthcare',
    risk_category: 'Medium',
    base_risk_factor: 1.2,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    industry_type_id: 3,
    industry_name: 'Financial Services',
    risk_category: 'High',
    base_risk_factor: 1.5,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    industry_type_id: 4,
    industry_name: 'Manufacturing',
    risk_category: 'Medium',
    base_risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    industry_type_id: 5,
    industry_name: 'Retail',
    risk_category: 'Low',
    base_risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  }
];

// States Mock Data - All 50 US States
export const mockStates = [
  {
    state_id: 1,
    state_code: 'AL',
    state_name: 'Alabama',
    risk_factor: 1.2,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 2,
    state_code: 'AK',
    state_name: 'Alaska',
    risk_factor: 1.5,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 3,
    state_code: 'AZ',
    state_name: 'Arizona',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 4,
    state_code: 'AR',
    state_name: 'Arkansas',
    risk_factor: 1.3,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 5,
    state_code: 'CA',
    state_name: 'California',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 6,
    state_code: 'CO',
    state_name: 'Colorado',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 7,
    state_code: 'CT',
    state_name: 'Connecticut',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 8,
    state_code: 'DE',
    state_name: 'Delaware',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 9,
    state_code: 'FL',
    state_name: 'Florida',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 10,
    state_code: 'GA',
    state_name: 'Georgia',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 11,
    state_code: 'HI',
    state_name: 'Hawaii',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 12,
    state_code: 'ID',
    state_name: 'Idaho',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 13,
    state_code: 'IL',
    state_name: 'Illinois',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 14,
    state_code: 'IN',
    state_name: 'Indiana',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 15,
    state_code: 'IA',
    state_name: 'Iowa',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 16,
    state_code: 'KS',
    state_name: 'Kansas',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 17,
    state_code: 'KY',
    state_name: 'Kentucky',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 18,
    state_code: 'LA',
    state_name: 'Louisiana',
    risk_factor: 1.4,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 19,
    state_code: 'ME',
    state_name: 'Maine',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 20,
    state_code: 'MD',
    state_name: 'Maryland',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 21,
    state_code: 'MA',
    state_name: 'Massachusetts',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 22,
    state_code: 'MI',
    state_name: 'Michigan',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 23,
    state_code: 'MN',
    state_name: 'Minnesota',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 24,
    state_code: 'MS',
    state_name: 'Mississippi',
    risk_factor: 1.3,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 25,
    state_code: 'MO',
    state_name: 'Missouri',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 26,
    state_code: 'MT',
    state_name: 'Montana',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 27,
    state_code: 'NE',
    state_name: 'Nebraska',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 28,
    state_code: 'NV',
    state_name: 'Nevada',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 29,
    state_code: 'NH',
    state_name: 'New Hampshire',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 30,
    state_code: 'NJ',
    state_name: 'New Jersey',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 31,
    state_code: 'NM',
    state_name: 'New Mexico',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 32,
    state_code: 'NY',
    state_name: 'New York',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 33,
    state_code: 'NC',
    state_name: 'North Carolina',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 34,
    state_code: 'ND',
    state_name: 'North Dakota',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 35,
    state_code: 'OH',
    state_name: 'Ohio',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 36,
    state_code: 'OK',
    state_name: 'Oklahoma',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 37,
    state_code: 'OR',
    state_name: 'Oregon',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 38,
    state_code: 'PA',
    state_name: 'Pennsylvania',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 39,
    state_code: 'RI',
    state_name: 'Rhode Island',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 40,
    state_code: 'SC',
    state_name: 'South Carolina',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 41,
    state_code: 'SD',
    state_name: 'South Dakota',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 42,
    state_code: 'TN',
    state_name: 'Tennessee',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 43,
    state_code: 'TX',
    state_name: 'Texas',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 44,
    state_code: 'UT',
    state_name: 'Utah',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 45,
    state_code: 'VT',
    state_name: 'Vermont',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 46,
    state_code: 'VA',
    state_name: 'Virginia',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 47,
    state_code: 'WA',
    state_name: 'Washington',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 48,
    state_code: 'WV',
    state_name: 'West Virginia',
    risk_factor: 1.2,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 49,
    state_code: 'WI',
    state_name: 'Wisconsin',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    state_id: 50,
    state_code: 'WY',
    state_name: 'Wyoming',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  }
];

// Education Levels Mock Data
export const mockEducationLevels = [
  {
    education_level_id: 1,
    level_name: 'High School',
    risk_factor: 1.5,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    education_level_id: 2,
    level_name: 'Associate Degree',
    risk_factor: 1.2,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    education_level_id: 3,
    level_name: 'Bachelor Degree',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    education_level_id: 4,
    level_name: 'Master Degree',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    education_level_id: 5,
    level_name: 'PhD/Doctorate',
    risk_factor: 0.6,
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    education_level_id: 6,
    level_name: 'Professional Certification',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z'
  }
];

// Job Titles Mock Data - Enhanced with external data
export const mockJobTitles = generateJobTitles();

// Practice Fields Mock Data - Enhanced with external data
export const mockPracticeFields = generatePracticeFields();

// Roles Mock Data
export const mockRoles = [
  {
    id: 'system_admin',
    name: 'system_admin',
    display_name: 'System Administrator',
    description: 'Full system access and management',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'company_admin',
    name: 'company_admin',
    display_name: 'Company Administrator',
    description: 'Company-level administration and management',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'risk_analyst',
    name: 'risk_analyst',
    display_name: 'Risk Analyst',
    description: 'Risk assessment and analysis',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'underwriter',
    name: 'underwriter',
    display_name: 'Underwriter',
    description: 'Insurance underwriting and approval',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'compliance_officer',
    name: 'compliance_officer',
    display_name: 'Compliance Officer',
    description: 'Compliance monitoring and reporting',
    created_at: '2023-01-01T00:00:00.000Z'
  }
];

// Permissions Mock Data
export const mockPermissions = [
  {
    id: 'users:read',
    name: 'users:read',
    description: 'Read user information',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'users:write',
    name: 'users:write',
    description: 'Create and update users',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'companies:read',
    name: 'companies:read',
    description: 'Read company information',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'companies:write',
    name: 'companies:write',
    description: 'Create and update companies',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'assessments:read',
    name: 'assessments:read',
    description: 'Read risk assessments',
    created_at: '2023-01-01T00:00:00.000Z'
  },
  {
    id: 'assessments:write',
    name: 'assessments:write',
    description: 'Create and update risk assessments',
    created_at: '2023-01-01T00:00:00.000Z'
  }
];

// Mock data mapping
export const mockReferenceDataMap: { [key: string]: any[] } = {
  'industry-types': mockIndustryTypes,
  'states': mockStates,
  'education-levels': mockEducationLevels,
  'job-titles': mockJobTitles,
  'practice-fields': mockPracticeFields,
  'roles': mockRoles,
  'permissions': mockPermissions,
};

// Mock API response structure
export const createMockResponse = (sectionId: string, dataKey: string) => {
  return {
    [dataKey]: mockReferenceDataMap[sectionId] || [],
    success: true,
    message: `Mock ${dataKey} data loaded successfully`
  };
};

// Bootstrap functionality for reference data
export const bootstrapMockData = async () => {
  try {
    console.log('Bootstrapping reference data from external sources...');
    const result = await bootstrapReferenceData();
    
    if (result.success) {
      // Update mock data with bootstrapped data
      mockReferenceDataMap['job-titles'] = result.jobTitles;
      mockReferenceDataMap['practice-fields'] = result.practiceFields;
    }
    
    return result;
  } catch (error) {
    console.error('Bootstrap failed:', error);
    return {
      jobTitles: mockJobTitles,
      practiceFields: mockPracticeFields,
      success: false,
      message: 'Bootstrap failed, using fallback data'
    };
  }
};

// Enrich existing data with external sources
export const enrichReferenceData = async (existingData: any) => {
  try {
    const existingJobTitles = existingData['job-titles'] || mockJobTitles;
    const existingPracticeFields = existingData['practice-fields'] || mockPracticeFields;
    
    const enriched = await validateAndEnrichReferenceData(existingJobTitles, existingPracticeFields);
    
    // Update mock data with enriched data
    mockReferenceDataMap['job-titles'] = enriched.jobTitles;
    mockReferenceDataMap['practice-fields'] = enriched.practiceFields;
    
    return {
      success: true,
      message: `Enriched data: ${enriched.addedJobTitles} job titles, ${enriched.addedPracticeFields} practice fields added`,
      addedJobTitles: enriched.addedJobTitles,
      addedPracticeFields: enriched.addedPracticeFields
    };
  } catch (error) {
    console.error('Data enrichment failed:', error);
    return {
      success: false,
      message: 'Data enrichment failed',
      addedJobTitles: 0,
      addedPracticeFields: 0
    };
  }
};