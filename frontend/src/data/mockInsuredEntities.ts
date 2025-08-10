import { InsuredEntity } from '../types/irpa';

// US States with their zip code ranges and risk factors
const US_STATES = [
  {
    state_id: 1,
    state_code: 'AL',
    state_name: 'Alabama',
    risk_factor: 1.2,
    zip_ranges: ['35000-36999'],
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    state_id: 2,
    state_code: 'AK',
    state_name: 'Alaska',
    risk_factor: 1.5,
    zip_ranges: ['99500-99999'],
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    state_id: 3,
    state_code: 'AZ',
    state_name: 'Arizona',
    risk_factor: 1.1,
    zip_ranges: ['85000-86999'],
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    state_id: 4,
    state_code: 'AR',
    state_name: 'Arkansas',
    risk_factor: 1.3,
    zip_ranges: ['71600-72999'],
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    state_id: 5,
    state_code: 'CA',
    state_name: 'California',
    risk_factor: 0.9,
    zip_ranges: ['90000-96999'],
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    state_id: 6,
    state_code: 'CO',
    state_name: 'Colorado',
    risk_factor: 0.8,
    zip_ranges: ['80000-81999'],
  },
  {
    state_id: 7,
    state_code: 'CT',
    state_name: 'Connecticut',
    risk_factor: 0.7,
    zip_ranges: ['06000-06999'],
  },
  {
    state_id: 8,
    state_code: 'DE',
    state_name: 'Delaware',
    risk_factor: 0.8,
    zip_ranges: ['19700-19999'],
  },
  {
    state_id: 9,
    state_code: 'FL',
    state_name: 'Florida',
    risk_factor: 1.0,
    zip_ranges: ['32000-34999'],
  },
  {
    state_id: 10,
    state_code: 'GA',
    state_name: 'Georgia',
    risk_factor: 1.1,
    zip_ranges: ['30000-31999'],
  },
  {
    state_id: 11,
    state_code: 'HI',
    state_name: 'Hawaii',
    risk_factor: 0.9,
    zip_ranges: ['96700-96999'],
  },
  {
    state_id: 12,
    state_code: 'ID',
    state_name: 'Idaho',
    risk_factor: 1.0,
    zip_ranges: ['83200-83999'],
  },
  {
    state_id: 13,
    state_code: 'IL',
    state_name: 'Illinois',
    risk_factor: 1.0,
    zip_ranges: ['60000-62999'],
  },
  {
    state_id: 14,
    state_code: 'IN',
    state_name: 'Indiana',
    risk_factor: 1.0,
    zip_ranges: ['46000-47999'],
  },
  {
    state_id: 15,
    state_code: 'IA',
    state_name: 'Iowa',
    risk_factor: 0.9,
    zip_ranges: ['50000-52999'],
  },
  {
    state_id: 16,
    state_code: 'KS',
    state_name: 'Kansas',
    risk_factor: 1.0,
    zip_ranges: ['66000-67999'],
  },
  {
    state_id: 17,
    state_code: 'KY',
    state_name: 'Kentucky',
    risk_factor: 1.1,
    zip_ranges: ['40000-42999'],
  },
  {
    state_id: 18,
    state_code: 'LA',
    state_name: 'Louisiana',
    risk_factor: 1.4,
    zip_ranges: ['70000-71999'],
  },
  {
    state_id: 19,
    state_code: 'ME',
    state_name: 'Maine',
    risk_factor: 0.9,
    zip_ranges: ['04000-04999'],
  },
  {
    state_id: 20,
    state_code: 'MD',
    state_name: 'Maryland',
    risk_factor: 0.8,
    zip_ranges: ['20600-21999'],
  },
  {
    state_id: 21,
    state_code: 'MA',
    state_name: 'Massachusetts',
    risk_factor: 0.7,
    zip_ranges: ['01000-02999'],
  },
  {
    state_id: 22,
    state_code: 'MI',
    state_name: 'Michigan',
    risk_factor: 1.1,
    zip_ranges: ['48000-49999'],
  },
  {
    state_id: 23,
    state_code: 'MN',
    state_name: 'Minnesota',
    risk_factor: 0.8,
    zip_ranges: ['55000-56999'],
  },
  {
    state_id: 24,
    state_code: 'MS',
    state_name: 'Mississippi',
    risk_factor: 1.3,
    zip_ranges: ['38600-39999'],
  },
  {
    state_id: 25,
    state_code: 'MO',
    state_name: 'Missouri',
    risk_factor: 1.0,
    zip_ranges: ['63000-65999'],
  },
  {
    state_id: 26,
    state_code: 'MT',
    state_name: 'Montana',
    risk_factor: 1.0,
    zip_ranges: ['59000-59999'],
  },
  {
    state_id: 27,
    state_code: 'NE',
    state_name: 'Nebraska',
    risk_factor: 0.9,
    zip_ranges: ['68000-69999'],
  },
  {
    state_id: 28,
    state_code: 'NV',
    state_name: 'Nevada',
    risk_factor: 1.0,
    zip_ranges: ['89000-89999'],
  },
  {
    state_id: 29,
    state_code: 'NH',
    state_name: 'New Hampshire',
    risk_factor: 0.8,
    zip_ranges: ['03000-03999'],
  },
  {
    state_id: 30,
    state_code: 'NJ',
    state_name: 'New Jersey',
    risk_factor: 0.9,
    zip_ranges: ['07000-08999'],
  },
  {
    state_id: 31,
    state_code: 'NM',
    state_name: 'New Mexico',
    risk_factor: 1.1,
    zip_ranges: ['87000-88999'],
  },
  {
    state_id: 32,
    state_code: 'NY',
    state_name: 'New York',
    risk_factor: 0.8,
    zip_ranges: ['10000-14999'],
  },
  {
    state_id: 33,
    state_code: 'NC',
    state_name: 'North Carolina',
    risk_factor: 1.0,
    zip_ranges: ['27000-28999'],
  },
  {
    state_id: 34,
    state_code: 'ND',
    state_name: 'North Dakota',
    risk_factor: 0.9,
    zip_ranges: ['58000-58999'],
  },
  {
    state_id: 35,
    state_code: 'OH',
    state_name: 'Ohio',
    risk_factor: 1.0,
    zip_ranges: ['43000-45999'],
  },
  {
    state_id: 36,
    state_code: 'OK',
    state_name: 'Oklahoma',
    risk_factor: 1.1,
    zip_ranges: ['73000-74999'],
  },
  {
    state_id: 37,
    state_code: 'OR',
    state_name: 'Oregon',
    risk_factor: 0.9,
    zip_ranges: ['97000-97999'],
  },
  {
    state_id: 38,
    state_code: 'PA',
    state_name: 'Pennsylvania',
    risk_factor: 0.9,
    zip_ranges: ['15000-19999'],
  },
  {
    state_id: 39,
    state_code: 'RI',
    state_name: 'Rhode Island',
    risk_factor: 0.8,
    zip_ranges: ['02800-02999'],
  },
  {
    state_id: 40,
    state_code: 'SC',
    state_name: 'South Carolina',
    risk_factor: 1.1,
    zip_ranges: ['29000-29999'],
  },
  {
    state_id: 41,
    state_code: 'SD',
    state_name: 'South Dakota',
    risk_factor: 0.9,
    zip_ranges: ['57000-57999'],
  },
  {
    state_id: 42,
    state_code: 'TN',
    state_name: 'Tennessee',
    risk_factor: 1.0,
    zip_ranges: ['37000-38599'],
  },
  {
    state_id: 43,
    state_code: 'TX',
    state_name: 'Texas',
    risk_factor: 1.0,
    zip_ranges: ['73300-79999'],
  },
  {
    state_id: 44,
    state_code: 'UT',
    state_name: 'Utah',
    risk_factor: 0.8,
    zip_ranges: ['84000-84999'],
  },
  {
    state_id: 45,
    state_code: 'VT',
    state_name: 'Vermont',
    risk_factor: 0.8,
    zip_ranges: ['05000-05999'],
  },
  {
    state_id: 46,
    state_code: 'VA',
    state_name: 'Virginia',
    risk_factor: 0.9,
    zip_ranges: ['20100-24699'],
  },
  {
    state_id: 47,
    state_code: 'WA',
    state_name: 'Washington',
    risk_factor: 0.8,
    zip_ranges: ['98000-99499'],
  },
  {
    state_id: 48,
    state_code: 'WV',
    state_name: 'West Virginia',
    risk_factor: 1.2,
    zip_ranges: ['24700-26999'],
  },
  {
    state_id: 49,
    state_code: 'WI',
    state_name: 'Wisconsin',
    risk_factor: 0.9,
    zip_ranges: ['53000-54999'],
  },
  {
    state_id: 50,
    state_code: 'WY',
    state_name: 'Wyoming',
    risk_factor: 1.0,
    zip_ranges: ['82000-83199'],
  },
];

const FIRST_NAMES = [
  'James',
  'Mary',
  'John',
  'Patricia',
  'Robert',
  'Jennifer',
  'Michael',
  'Linda',
  'David',
  'Elizabeth',
  'William',
  'Barbara',
  'Richard',
  'Susan',
  'Joseph',
  'Jessica',
  'Thomas',
  'Sarah',
  'Christopher',
  'Karen',
  'Charles',
  'Nancy',
  'Daniel',
  'Lisa',
  'Matthew',
  'Betty',
  'Anthony',
  'Helen',
  'Mark',
  'Sandra',
  'Donald',
  'Donna',
  'Steven',
  'Carol',
  'Paul',
  'Ruth',
  'Andrew',
  'Sharon',
  'Joshua',
  'Michelle',
  'Kenneth',
  'Laura',
  'Kevin',
  'Sarah',
  'Brian',
  'Kimberly',
  'George',
  'Deborah',
  'Timothy',
  'Dorothy',
  'Ronald',
  'Lisa',
  'Jason',
  'Nancy',
  'Edward',
  'Karen',
];

const LAST_NAMES = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
  'Gomez',
  'Phillips',
  'Evans',
  'Turner',
  'Diaz',
  'Parker',
];

const JOB_TITLES = [
  {
    job_title_id: 1,
    title_name: 'Senior Software Engineer',
    risk_category: 'Professional',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 2,
    title_name: 'Financial Analyst',
    risk_category: 'Professional',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 3,
    title_name: 'Marketing Manager',
    risk_category: 'Management',
    risk_factor: 0.6,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 4,
    title_name: 'Registered Nurse',
    risk_category: 'Professional',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 5,
    title_name: 'Project Manager',
    risk_category: 'Management',
    risk_factor: 0.6,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 6,
    title_name: 'Data Analyst',
    risk_category: 'Technical',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 7,
    title_name: 'Sales Representative',
    risk_category: 'Administrative',
    risk_factor: 1.2,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 8,
    title_name: 'Operations Manager',
    risk_category: 'Management',
    risk_factor: 0.5,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 9,
    title_name: 'Software Developer',
    risk_category: 'Technical',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    job_title_id: 10,
    title_name: 'Business Analyst',
    risk_category: 'Professional',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z',
  },
];

const EDUCATION_LEVELS = [
  {
    education_level_id: 1,
    level_name: 'High School',
    risk_factor: 1.5,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    education_level_id: 2,
    level_name: 'Associate Degree',
    risk_factor: 1.2,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    education_level_id: 3,
    level_name: 'Bachelor Degree',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    education_level_id: 4,
    level_name: 'Master Degree',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    education_level_id: 5,
    level_name: 'PhD/Doctorate',
    risk_factor: 0.6,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    education_level_id: 6,
    level_name: 'Professional Certification',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z',
  },
];

const PRACTICE_FIELDS = [
  {
    practice_field_id: 1,
    field_name: 'Information Technology',
    risk_factor: 0.8,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 2,
    field_name: 'Healthcare',
    risk_factor: 0.9,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 3,
    field_name: 'Finance & Banking',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 4,
    field_name: 'Marketing & Sales',
    risk_factor: 1.1,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 5,
    field_name: 'Operations & Management',
    risk_factor: 0.6,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 6,
    field_name: 'Legal Services',
    risk_factor: 0.5,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 7,
    field_name: 'Engineering',
    risk_factor: 0.7,
    created_at: '2023-01-01T00:00:00.000Z',
  },
  {
    practice_field_id: 8,
    field_name: 'Education',
    risk_factor: 1.0,
    created_at: '2023-01-01T00:00:00.000Z',
  },
];

// Main company that 90% of records belong to
const MAIN_COMPANY_ID = 'company-001';

// Generate random zip code based on state
// function generateZipCode(state: typeof US_STATES[0]): string {
//   const ranges = state.zip_ranges[0].split('-');
//   const min = parseInt(ranges[0]);
//   const max = parseInt(ranges[1]);
//   const randomZip = Math.floor(Math.random() * (max - min + 1)) + min;
//   return randomZip.toString().padStart(5, '0');
// }

// Generate random date within range
function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

// Generate random number within range
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate random decimal within range
function randomFloat(min: number, max: number, decimals: number = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Generate random element from array
function randomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate FICO score with realistic distribution
function generateFicoScore(): number {
  const rand = Math.random();
  if (rand < 0.1) return randomInt(300, 579); // Poor: 10%
  if (rand < 0.27) return randomInt(580, 669); // Fair: 17%
  if (rand < 0.48) return randomInt(670, 739); // Good: 21%
  if (rand < 0.73) return randomInt(740, 799); // Very Good: 25%
  return randomInt(800, 850); // Exceptional: 27%
}

export function generateMockInsuredEntities(): InsuredEntity[] {
  const entities: InsuredEntity[] = [];
  const now = new Date();
  const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());

  for (let i = 1; i <= 100; i++) {
    const state = randomElement(US_STATES);
    const jobTitle = randomElement(JOB_TITLES);
    const educationLevel = randomElement(EDUCATION_LEVELS);
    const practiceField = randomElement(PRACTICE_FIELDS);
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);

    // 90% belong to main company, 10% to different companies
    const companyId =
      Math.random() < 0.9
        ? MAIN_COMPANY_ID
        : `company-${randomInt(2, 11).toString().padStart(3, '0')}`;

    // Generate age between 22-65
    const age = randomInt(22, 65);
    const birthYear = now.getFullYear() - age;
    const dateOfBirth = randomDate(new Date(birthYear, 0, 1), new Date(birthYear, 11, 31));

    const entity: InsuredEntity = {
      insured_id: `insured-${i.toString().padStart(3, '0')}`,
      company_id: companyId,
      name: `${firstName} ${lastName}`,
      entity_type: 'Individual Professional',

      // Education
      education_level_id: educationLevel.education_level_id,
      education_level: educationLevel,

      // Professional experience
      years_experience: randomInt(1, Math.min(age - 18, 40)),
      job_title_id: jobTitle.job_title_id,
      job_title: jobTitle,
      job_tenure: randomInt(6, 120), // months
      practice_field_id: practiceField.practice_field_id,
      practice_field: practiceField,

      // Personal info
      date_of_birth: dateOfBirth,
      age: age,

      // Location
      state_id: state.state_id,
      state: state,

      // Financial info
      fico_score: generateFicoScore(),
      dti_ratio: randomFloat(0.1, 0.8, 2), // Debt-to-income ratio
      payment_history: randomElement(['Excellent', 'Good', 'Fair', 'Poor']),

      // Metadata
      created_at: randomDate(twoYearsAgo, now),
      updated_at: randomDate(twoYearsAgo, now),
      data_completeness_score: randomFloat(0.7, 1.0, 2),

      // Optional company reference for display
      company: {
        company_id: companyId,
        company_name:
          companyId === MAIN_COMPANY_ID
            ? 'TechCorp Solutions'
            : `Company ${companyId.split('-')[1]}`,
        industry_type: {
          industry_type_id: 1,
          industry_name: 'Technology',
          risk_category: 'Low',
          base_risk_factor: 0.8,
          created_at: '2023-01-01T00:00:00Z',
        },
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
        registration_date: '2023-01-01',
      } as any,
    };

    entities.push(entity);
  }

  // Sort by creation date (newest first)
  return entities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export const mockInsuredEntities = generateMockInsuredEntities();
