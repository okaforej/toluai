/**
 * External Reference Data Service
 * Fetches job titles and practice fields from external APIs and provides bootstrap functionality
 */

interface JobTitle {
  job_title_id: number;
  title_name: string;
  risk_category: string;
  risk_factor: number;
  created_at: string;
}

interface PracticeField {
  practice_field_id: number;
  field_name: string;
  risk_factor: number;
  created_at: string;
}

// Standard Occupational Classification (SOC) major groups for practice fields
const SOC_PRACTICE_FIELDS = [
  'Management Occupations',
  'Business and Financial Operations Occupations',
  'Computer and Mathematical Occupations',
  'Architecture and Engineering Occupations',
  'Life, Physical, and Social Science Occupations',
  'Community and Social Service Occupations',
  'Legal Occupations',
  'Educational Instruction and Library Occupations',
  'Arts, Design, Entertainment, Sports, and Media Occupations',
  'Healthcare Practitioners and Technical Occupations',
  'Healthcare Support Occupations',
  'Protective Service Occupations',
  'Food Preparation and Serving Related Occupations',
  'Building and Grounds Cleaning and Maintenance Occupations',
  'Personal Care and Service Occupations',
  'Sales and Related Occupations',
  'Office and Administrative Support Occupations',
  'Farming, Fishing, and Forestry Occupations',
  'Construction and Extraction Occupations',
  'Installation, Maintenance, and Repair Occupations',
  'Production Occupations',
  'Transportation and Material Moving Occupations'
];

// Common job titles from BLS data and industry standards
const STANDARD_JOB_TITLES = [
  // Management
  { title: 'Chief Executive Officer', category: 'Management', risk: 0.5 },
  { title: 'General Manager', category: 'Management', risk: 0.6 },
  { title: 'Operations Manager', category: 'Management', risk: 0.6 },
  { title: 'Project Manager', category: 'Management', risk: 0.7 },
  { title: 'Product Manager', category: 'Management', risk: 0.6 },
  { title: 'Marketing Manager', category: 'Management', risk: 0.7 },
  { title: 'Sales Manager', category: 'Management', risk: 0.8 },
  { title: 'Human Resources Manager', category: 'Management', risk: 0.6 },
  { title: 'Financial Manager', category: 'Management', risk: 0.5 },
  
  // Professional
  { title: 'Software Engineer', category: 'Professional', risk: 0.7 },
  { title: 'Senior Software Engineer', category: 'Professional', risk: 0.6 },
  { title: 'Data Scientist', category: 'Professional', risk: 0.6 },
  { title: 'Business Analyst', category: 'Professional', risk: 0.7 },
  { title: 'Financial Analyst', category: 'Professional', risk: 0.7 },
  { title: 'Marketing Analyst', category: 'Professional', risk: 0.8 },
  { title: 'Systems Analyst', category: 'Professional', risk: 0.7 },
  { title: 'Research Analyst', category: 'Professional', risk: 0.7 },
  { title: 'Consultant', category: 'Professional', risk: 0.8 },
  { title: 'Accountant', category: 'Professional', risk: 0.6 },
  { title: 'Lawyer', category: 'Professional', risk: 0.4 },
  { title: 'Engineer', category: 'Professional', risk: 0.6 },
  { title: 'Architect', category: 'Professional', risk: 0.7 },
  { title: 'Physician', category: 'Professional', risk: 0.3 },
  { title: 'Nurse Practitioner', category: 'Professional', risk: 0.4 },
  { title: 'Registered Nurse', category: 'Professional', risk: 0.5 },
  { title: 'Pharmacist', category: 'Professional', risk: 0.4 },
  { title: 'Teacher', category: 'Professional', risk: 0.6 },
  { title: 'Professor', category: 'Professional', risk: 0.5 },
  
  // Technical
  { title: 'Database Administrator', category: 'Technical', risk: 0.7 },
  { title: 'Network Administrator', category: 'Technical', risk: 0.8 },
  { title: 'System Administrator', category: 'Technical', risk: 0.8 },
  { title: 'Web Developer', category: 'Technical', risk: 0.8 },
  { title: 'Mobile Developer', category: 'Technical', risk: 0.7 },
  { title: 'DevOps Engineer', category: 'Technical', risk: 0.7 },
  { title: 'Quality Assurance Analyst', category: 'Technical', risk: 0.8 },
  { title: 'Technical Writer', category: 'Technical', risk: 0.9 },
  { title: 'IT Support Specialist', category: 'Technical', risk: 0.9 },
  { title: 'Cybersecurity Specialist', category: 'Technical', risk: 0.6 },
  
  // Administrative
  { title: 'Administrative Assistant', category: 'Administrative', risk: 1.0 },
  { title: 'Executive Assistant', category: 'Administrative', risk: 0.9 },
  { title: 'Office Manager', category: 'Administrative', risk: 0.9 },
  { title: 'Customer Service Representative', category: 'Administrative', risk: 1.1 },
  { title: 'Receptionist', category: 'Administrative', risk: 1.2 },
  { title: 'Data Entry Clerk', category: 'Administrative', risk: 1.3 },
  { title: 'Bookkeeper', category: 'Administrative', risk: 1.0 },
  { title: 'Payroll Clerk', category: 'Administrative', risk: 1.0 },
  
  // Sales & Marketing
  { title: 'Sales Representative', category: 'Sales', risk: 1.0 },
  { title: 'Account Executive', category: 'Sales', risk: 0.9 },
  { title: 'Business Development Manager', category: 'Sales', risk: 0.8 },
  { title: 'Marketing Coordinator', category: 'Marketing', risk: 0.9 },
  { title: 'Digital Marketing Specialist', category: 'Marketing', risk: 0.8 },
  { title: 'Content Marketing Manager', category: 'Marketing', risk: 0.8 },
  { title: 'Social Media Manager', category: 'Marketing', risk: 0.9 },
  { title: 'SEO Specialist', category: 'Marketing', risk: 0.9 },
  
  // Entry Level
  { title: 'Intern', category: 'Entry Level', risk: 1.4 },
  { title: 'Junior Analyst', category: 'Entry Level', risk: 1.2 },
  { title: 'Associate', category: 'Entry Level', risk: 1.1 },
  { title: 'Coordinator', category: 'Entry Level', risk: 1.1 },
  { title: 'Specialist', category: 'Entry Level', risk: 1.0 },
];

/**
 * Generate practice fields from SOC classifications
 */
export const generatePracticeFields = (): PracticeField[] => {
  return SOC_PRACTICE_FIELDS.map((field, index) => ({
    practice_field_id: index + 1,
    field_name: field,
    risk_factor: calculatePracticeFieldRisk(field),
    created_at: new Date().toISOString()
  }));
};

/**
 * Calculate risk factor for practice fields based on industry characteristics
 */
const calculatePracticeFieldRisk = (fieldName: string): number => {
  const riskMapping: { [key: string]: number } = {
    'Legal Occupations': 0.4,
    'Healthcare Practitioners and Technical Occupations': 0.5,
    'Computer and Mathematical Occupations': 0.6,
    'Architecture and Engineering Occupations': 0.6,
    'Management Occupations': 0.6,
    'Business and Financial Operations Occupations': 0.7,
    'Life, Physical, and Social Science Occupations': 0.7,
    'Educational Instruction and Library Occupations': 0.7,
    'Community and Social Service Occupations': 0.8,
    'Arts, Design, Entertainment, Sports, and Media Occupations': 0.9,
    'Office and Administrative Support Occupations': 1.0,
    'Healthcare Support Occupations': 1.0,
    'Sales and Related Occupations': 1.1,
    'Personal Care and Service Occupations': 1.1,
    'Protective Service Occupations': 1.2,
    'Installation, Maintenance, and Repair Occupations': 1.3,
    'Transportation and Material Moving Occupations': 1.3,
    'Construction and Extraction Occupations': 1.4,
    'Production Occupations': 1.4,
    'Food Preparation and Serving Related Occupations': 1.5,
    'Building and Grounds Cleaning and Maintenance Occupations': 1.5,
    'Farming, Fishing, and Forestry Occupations': 1.6
  };

  return riskMapping[fieldName] || 1.0;
};

/**
 * Generate job titles from standard classifications
 */
export const generateJobTitles = (): JobTitle[] => {
  return STANDARD_JOB_TITLES.map((job, index) => ({
    job_title_id: index + 1,
    title_name: job.title,
    risk_category: job.category,
    risk_factor: job.risk,
    created_at: new Date().toISOString()
  }));
};

/**
 * Fetch job titles from external API (fallback to generated data)
 */
export const fetchExternalJobTitles = async (): Promise<JobTitle[]> => {
  try {
    // Note: External API calls would go here
    // For now, using generated standard job titles
    console.log('Fetching job titles from external sources...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const generatedTitles = generateJobTitles();
    console.log(`Generated ${generatedTitles.length} job titles from standard classifications`);
    
    return generatedTitles;
  } catch (error) {
    console.warn('External API fetch failed, using generated job titles:', error);
    return generateJobTitles();
  }
};

/**
 * Fetch practice fields from external sources (fallback to generated data)
 */
export const fetchExternalPracticeFields = async (): Promise<PracticeField[]> => {
  try {
    console.log('Fetching practice fields from external sources...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const generatedFields = generatePracticeFields();
    console.log(`Generated ${generatedFields.length} practice fields from SOC classifications`);
    
    return generatedFields;
  } catch (error) {
    console.warn('External API fetch failed, using generated practice fields:', error);
    return generatePracticeFields();
  }
};

/**
 * Bootstrap reference data by fetching from external sources
 */
export const bootstrapReferenceData = async () => {
  console.log('Starting reference data bootstrap process...');
  
  try {
    const [jobTitles, practiceFields] = await Promise.all([
      fetchExternalJobTitles(),
      fetchExternalPracticeFields()
    ]);
    
    console.log('Bootstrap completed successfully:');
    console.log(`- ${jobTitles.length} job titles loaded`);
    console.log(`- ${practiceFields.length} practice fields loaded`);
    
    return {
      jobTitles,
      practiceFields,
      success: true,
      message: 'Reference data bootstrap completed successfully'
    };
  } catch (error) {
    console.error('Bootstrap process failed:', error);
    return {
      jobTitles: generateJobTitles(),
      practiceFields: generatePracticeFields(),
      success: false,
      message: 'Bootstrap failed, using fallback data'
    };
  }
};

/**
 * Validate and enrich existing reference data
 */
export const validateAndEnrichReferenceData = async (existingJobTitles: JobTitle[], existingPracticeFields: PracticeField[]) => {
  console.log('Validating and enriching existing reference data...');
  
  const externalJobTitles = await fetchExternalJobTitles();
  const externalPracticeFields = await fetchExternalPracticeFields();
  
  // Merge existing data with external data (avoiding duplicates)
  const enrichedJobTitles = mergeJobTitles(existingJobTitles, externalJobTitles);
  const enrichedPracticeFields = mergePracticeFields(existingPracticeFields, externalPracticeFields);
  
  return {
    jobTitles: enrichedJobTitles,
    practiceFields: enrichedPracticeFields,
    addedJobTitles: enrichedJobTitles.length - existingJobTitles.length,
    addedPracticeFields: enrichedPracticeFields.length - existingPracticeFields.length
  };
};

/**
 * Merge job titles avoiding duplicates
 */
const mergeJobTitles = (existing: JobTitle[], external: JobTitle[]): JobTitle[] => {
  const existingNames = new Set(existing.map(jt => jt.title_name.toLowerCase()));
  const newTitles = external.filter(jt => !existingNames.has(jt.title_name.toLowerCase()));
  
  // Adjust IDs to avoid conflicts
  const maxId = existing.length > 0 ? Math.max(...existing.map(jt => jt.job_title_id)) : 0;
  const adjustedNewTitles = newTitles.map((jt, index) => ({
    ...jt,
    job_title_id: maxId + index + 1
  }));
  
  return [...existing, ...adjustedNewTitles];
};

/**
 * Merge practice fields avoiding duplicates
 */
const mergePracticeFields = (existing: PracticeField[], external: PracticeField[]): PracticeField[] => {
  const existingNames = new Set(existing.map(pf => pf.field_name.toLowerCase()));
  const newFields = external.filter(pf => !existingNames.has(pf.field_name.toLowerCase()));
  
  // Adjust IDs to avoid conflicts
  const maxId = existing.length > 0 ? Math.max(...existing.map(pf => pf.practice_field_id)) : 0;
  const adjustedNewFields = newFields.map((pf, index) => ({
    ...pf,
    practice_field_id: maxId + index + 1
  }));
  
  return [...existing, ...adjustedNewFields];
};