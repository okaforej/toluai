/**
 * Company Data Enrichment Service
 * Fetches and enriches company information from multiple sources
 */

import { IRPACompany } from '../types/irpa';

// Industry classification mapping (NAICS/SIC codes to readable names)
const INDUSTRY_CLASSIFICATIONS = {
  // Technology
  '5112': 'Software Publishers',
  '5182': 'Data Processing & Hosting',
  '5415': 'Computer Systems Design',
  '3341': 'Computer & Electronic Manufacturing',
  '5179': 'Telecommunications',
  
  // Finance & Insurance
  '5221': 'Banking',
  '5222': 'Credit & Lending',
  '5223': 'Investment Services',
  '5241': 'Insurance Carriers',
  '5242': 'Insurance Agencies & Brokerages',
  
  // Healthcare
  '6211': 'Medical Offices',
  '6221': 'Hospitals',
  '6223': 'Nursing & Residential Care',
  '3254': 'Pharmaceutical Manufacturing',
  '3391': 'Medical Equipment Manufacturing',
  
  // Retail & E-commerce
  '4541': 'E-commerce & Online Retail',
  '4521': 'Department Stores',
  '4451': 'Grocery Stores',
  '4481': 'Clothing Stores',
  
  // Professional Services
  '5411': 'Legal Services',
  '5412': 'Accounting & Tax Services',
  '5413': 'Architecture & Engineering',
  '5416': 'Management Consulting',
  '5418': 'Advertising & Marketing',
  
  // Real Estate
  '5311': 'Real Estate Lessors',
  '5312': 'Real Estate Agents & Brokers',
  '5313': 'Real Estate Property Managers',
  
  // Manufacturing
  '3361': 'Motor Vehicle Manufacturing',
  '3121': 'Beverage Manufacturing',
  '3152': 'Apparel Manufacturing',
  '3251': 'Chemical Manufacturing',
  
  // Transportation
  '4811': 'Air Transportation',
  '4841': 'Freight Trucking',
  '4931': 'Warehousing & Storage',
  '4921': 'Courier & Express Delivery',
};

// Risk factors by industry
const INDUSTRY_RISK_FACTORS: Record<string, number> = {
  'Banking': 0.7,
  'Insurance Carriers': 0.6,
  'Software Publishers': 0.8,
  'Medical Offices': 0.9,
  'Legal Services': 1.2,
  'Real Estate': 1.0,
  'Manufacturing': 1.1,
  'Transportation': 1.3,
  'Retail': 0.9,
  'Consulting': 0.8,
};

export interface CompanySearchResult {
  name: string;
  displayName: string;
  domain?: string;
  description?: string;
  industry?: string;
  industryCode?: string;
  employees?: number;
  founded?: number;
  headquarters?: {
    city?: string;
    state?: string;
    country?: string;
    address?: string;
  };
  // Financial Data
  revenue?: number;
  revenueGrowth?: number;
  operatingMargin?: number;
  netMargin?: number;
  ebitda?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  cashOnHand?: number;
  debtToEquity?: number;
  currentRatio?: number;
  marketCap?: number;
  peRatio?: number;
  // Other
  website?: string;
  linkedin?: string;
  ticker?: string;
  type?: 'public' | 'private' | 'nonprofit' | 'government';
  confidence?: number;
}

export interface EnrichedCompanyData extends CompanySearchResult {
  riskFactor?: number;
  creditRating?: string;
  naicsCode?: string;
  sicCode?: string;
  ein?: string;
  duns?: string;
  registrationDate?: string;
  legalStructure?: string;
  subsidiaries?: string[];
  competitors?: string[];
  // Risk Indicators
  bankruptcyRisk?: number;
  liquidityRisk?: number;
  operationalRisk?: number;
}

// Cache for company data (in production, use Redis)
const companyCache = new Map<string, EnrichedCompanyData>();

class CompanyEnrichmentService {
  private abortController: AbortController | null = null;

  /**
   * Search for companies by name with autocomplete
   */
  async searchCompanies(query: string, limit = 10): Promise<CompanySearchResult[]> {
    if (query.length < 2) return [];

    // Cancel previous search if still running
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    try {
      // Try multiple sources in parallel
      const results = await Promise.allSettled([
        this.searchOpenCorporates(query, limit),
        this.searchClearbit(query),
        this.searchGooglePlaces(query, limit),
        this.searchLocalDatabase(query, limit),
      ]);

      // Combine and deduplicate results
      const allResults: CompanySearchResult[] = [];
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          allResults.push(...result.value);
        }
      });

      // Deduplicate by name similarity
      return this.deduplicateCompanies(allResults).slice(0, limit);
    } catch (error) {
      console.error('Company search error:', error);
      return this.getFallbackCompanies(query, limit);
    }
  }

  /**
   * Get enriched data for a specific company
   */
  async getEnrichedCompanyData(companyName: string): Promise<EnrichedCompanyData | null> {
    // Check cache first
    const cached = companyCache.get(companyName.toLowerCase());
    if (cached) return cached;

    try {
      // Search for the company first
      const searchResults = await this.searchCompanies(companyName, 1);
      if (searchResults.length === 0) return null;

      const company = searchResults[0];
      
      // Enrich with additional data
      const enriched: EnrichedCompanyData = {
        ...company,
        riskFactor: this.calculateRiskFactor(company),
        operatingMargin: this.estimateOperatingMargin(company.industry),
        peRatio: this.estimatePERatio(company.industry),
        naicsCode: this.getNAICSCode(company.industry),
        legalStructure: this.determineLegalStructure(company.type),
        registrationDate: this.estimateRegistrationDate(company.founded),
      };

      // Cache the result
      companyCache.set(companyName.toLowerCase(), enriched);
      
      return enriched;
    } catch (error) {
      console.error('Company enrichment error:', error);
      return null;
    }
  }

  /**
   * Search OpenCorporates API (free tier)
   */
  private async searchOpenCorporates(query: string, limit: number): Promise<CompanySearchResult[]> {
    try {
      // OpenCorporates API (free tier allows 500 requests/month)
      const response = await fetch(
        `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(query)}&per_page=${limit}`,
        { signal: this.abortController?.signal }
      );

      if (!response.ok) throw new Error('OpenCorporates API error');

      const data = await response.json();
      
      return data.results?.companies?.map((item: any) => ({
        name: item.company.name,
        displayName: item.company.name,
        domain: item.company.source?.url,
        industry: item.company.industry_codes?.[0]?.description,
        industryCode: item.company.industry_codes?.[0]?.code,
        founded: item.company.incorporation_date ? new Date(item.company.incorporation_date).getFullYear() : undefined,
        headquarters: {
          city: item.company.registered_address?.locality,
          state: item.company.registered_address?.region,
          country: item.company.jurisdiction_code,
        },
        type: item.company.company_type?.includes('PUBLIC') ? 'public' : 'private',
        confidence: 0.8,
      })) || [];
    } catch (error) {
      console.log('OpenCorporates search failed:', error);
      return [];
    }
  }

  /**
   * Search Clearbit API (limited free tier)
   */
  private async searchClearbit(query: string): Promise<CompanySearchResult[]> {
    try {
      // Note: Requires API key - using mock for now
      // const response = await fetch(
      //   `https://company.clearbit.com/v1/domains/find?name=${encodeURIComponent(query)}`,
      //   {
      //     headers: { 'Authorization': `Bearer ${CLEARBIT_API_KEY}` },
      //     signal: this.abortController?.signal
      //   }
      // );
      
      // Mock response for demonstration
      return [];
    } catch (error) {
      console.log('Clearbit search failed:', error);
      return [];
    }
  }

  /**
   * Search Google Places API
   */
  private async searchGooglePlaces(query: string, limit: number): Promise<CompanySearchResult[]> {
    try {
      // Note: Requires API key - using mock for now
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=establishment&key=${GOOGLE_API_KEY}`,
      //   { signal: this.abortController?.signal }
      // );
      
      // Mock response for demonstration
      return [];
    } catch (error) {
      console.log('Google Places search failed:', error);
      return [];
    }
  }

  /**
   * Search local database of known companies
   */
  private async searchLocalDatabase(query: string, limit: number): Promise<CompanySearchResult[]> {
    // Common Fortune 500 companies for demonstration
    const knownCompanies: CompanySearchResult[] = [
      {
        name: 'Apple Inc.',
        displayName: 'Apple Inc.',
        domain: 'apple.com',
        description: 'Technology company that designs, manufactures, and markets consumer electronics',
        industry: 'Computer & Electronic Manufacturing',
        industryCode: '3341',
        employees: 164000,
        founded: 1976,
        headquarters: { city: 'Cupertino', state: 'CA', country: 'US' },
        revenue: 394328000000,
        revenueGrowth: 0.033,
        operatingMargin: 0.298,
        netMargin: 0.253,
        ebitda: 129557000000,
        totalAssets: 352755000000,
        totalLiabilities: 290437000000,
        cashOnHand: 62555000000,
        debtToEquity: 1.95,
        currentRatio: 0.94,
        marketCap: 3000000000000,
        peRatio: 31.5,
        website: 'https://www.apple.com',
        ticker: 'AAPL',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Microsoft Corporation',
        displayName: 'Microsoft Corporation',
        domain: 'microsoft.com',
        description: 'Technology company that develops and sells computer software, consumer electronics, and personal computers',
        industry: 'Software Publishers',
        industryCode: '5112',
        employees: 221000,
        founded: 1975,
        headquarters: { city: 'Redmond', state: 'WA', country: 'US' },
        revenue: 211915000000,
        revenueGrowth: 0.117,
        operatingMargin: 0.421,
        netMargin: 0.361,
        ebitda: 105673000000,
        totalAssets: 411976000000,
        totalLiabilities: 205753000000,
        cashOnHand: 111262000000,
        debtToEquity: 0.71,
        currentRatio: 1.77,
        marketCap: 2800000000000,
        peRatio: 35.8,
        website: 'https://www.microsoft.com',
        ticker: 'MSFT',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Amazon.com Inc.',
        displayName: 'Amazon.com Inc.',
        domain: 'amazon.com',
        description: 'E-commerce and cloud computing company',
        industry: 'E-commerce & Online Retail',
        industryCode: '4541',
        employees: 1608000,
        founded: 1994,
        headquarters: { city: 'Seattle', state: 'WA', country: 'US' },
        revenue: 574785000000,
        website: 'https://www.amazon.com',
        ticker: 'AMZN',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Google LLC',
        displayName: 'Google LLC (Alphabet Inc.)',
        domain: 'google.com',
        description: 'Technology company specializing in Internet services and products',
        industry: 'Software Publishers',
        industryCode: '5112',
        employees: 190234,
        founded: 1998,
        headquarters: { city: 'Mountain View', state: 'CA', country: 'US' },
        revenue: 307394000000,
        website: 'https://www.google.com',
        ticker: 'GOOGL',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'JPMorgan Chase & Co.',
        displayName: 'JPMorgan Chase & Co.',
        domain: 'jpmorganchase.com',
        description: 'Financial services and investment banking company',
        industry: 'Banking',
        industryCode: '5221',
        employees: 309926,
        founded: 1799,
        headquarters: { city: 'New York', state: 'NY', country: 'US' },
        revenue: 154792000000,
        revenueGrowth: 0.223,
        operatingMargin: 0.395,
        netMargin: 0.308,
        totalAssets: 4100000000000,
        totalLiabilities: 3748000000000,
        cashOnHand: 1525000000000,
        debtToEquity: 1.42,
        currentRatio: 1.12,
        marketCap: 500000000000,
        peRatio: 11.2,
        website: 'https://www.jpmorganchase.com',
        ticker: 'JPM',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Berkshire Hathaway Inc.',
        displayName: 'Berkshire Hathaway Inc.',
        domain: 'berkshirehathaway.com',
        description: 'Multinational conglomerate holding company',
        industry: 'Insurance Carriers',
        industryCode: '5241',
        employees: 383000,
        founded: 1839,
        headquarters: { city: 'Omaha', state: 'NE', country: 'US' },
        revenue: 364482000000,
        website: 'https://www.berkshirehathaway.com',
        ticker: 'BRK.A',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Meta Platforms Inc.',
        displayName: 'Meta Platforms Inc. (Facebook)',
        domain: 'meta.com',
        description: 'Social media and technology company',
        industry: 'Software Publishers',
        industryCode: '5112',
        employees: 86482,
        founded: 2004,
        headquarters: { city: 'Menlo Park', state: 'CA', country: 'US' },
        revenue: 134902000000,
        website: 'https://www.meta.com',
        ticker: 'META',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Tesla Inc.',
        displayName: 'Tesla Inc.',
        domain: 'tesla.com',
        description: 'Electric vehicle and clean energy company',
        industry: 'Motor Vehicle Manufacturing',
        industryCode: '3361',
        employees: 140473,
        founded: 2003,
        headquarters: { city: 'Austin', state: 'TX', country: 'US' },
        revenue: 96773000000,
        website: 'https://www.tesla.com',
        ticker: 'TSLA',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Johnson & Johnson',
        displayName: 'Johnson & Johnson',
        domain: 'jnj.com',
        description: 'Pharmaceutical and medical device company',
        industry: 'Pharmaceutical Manufacturing',
        industryCode: '3254',
        employees: 152700,
        founded: 1886,
        headquarters: { city: 'New Brunswick', state: 'NJ', country: 'US' },
        revenue: 85159000000,
        website: 'https://www.jnj.com',
        ticker: 'JNJ',
        type: 'public',
        confidence: 1.0,
      },
      {
        name: 'Walmart Inc.',
        displayName: 'Walmart Inc.',
        domain: 'walmart.com',
        description: 'Retail corporation operating hypermarkets, discount stores, and grocery stores',
        industry: 'Department Stores',
        industryCode: '4521',
        employees: 2100000,
        founded: 1962,
        headquarters: { city: 'Bentonville', state: 'AR', country: 'US' },
        revenue: 648125000000,
        website: 'https://www.walmart.com',
        ticker: 'WMT',
        type: 'public',
        confidence: 1.0,
      },
    ];

    // Filter by query (case-insensitive fuzzy match)
    const queryLower = query.toLowerCase();
    const filtered = knownCompanies.filter(company => 
      company.name.toLowerCase().includes(queryLower) ||
      company.displayName.toLowerCase().includes(queryLower) ||
      company.domain?.toLowerCase().includes(queryLower)
    );

    return filtered.slice(0, limit);
  }

  /**
   * Fallback companies when APIs fail
   */
  private getFallbackCompanies(query: string, limit: number): CompanySearchResult[] {
    return this.searchLocalDatabase(query, limit);
  }

  /**
   * Deduplicate companies by name similarity
   */
  private deduplicateCompanies(companies: CompanySearchResult[]): CompanySearchResult[] {
    const seen = new Map<string, CompanySearchResult>();
    
    companies.forEach(company => {
      const key = company.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!seen.has(key) || (company.confidence || 0) > (seen.get(key)?.confidence || 0)) {
        seen.set(key, company);
      }
    });

    return Array.from(seen.values()).sort((a, b) => 
      (b.confidence || 0) - (a.confidence || 0)
    );
  }

  /**
   * Calculate risk factor based on company data
   */
  private calculateRiskFactor(company: CompanySearchResult): number {
    let riskFactor = 1.0;

    // Industry risk
    if (company.industry) {
      riskFactor = INDUSTRY_RISK_FACTORS[company.industry] || 1.0;
    }

    // Adjust by company age
    if (company.founded) {
      const age = new Date().getFullYear() - company.founded;
      if (age > 50) riskFactor *= 0.9;
      else if (age > 20) riskFactor *= 0.95;
      else if (age < 5) riskFactor *= 1.2;
    }

    // Adjust by company size
    if (company.employees) {
      if (company.employees > 10000) riskFactor *= 0.9;
      else if (company.employees > 1000) riskFactor *= 0.95;
      else if (company.employees < 50) riskFactor *= 1.1;
    }

    // Public companies typically have lower risk
    if (company.type === 'public') {
      riskFactor *= 0.85;
    }

    return Math.round(riskFactor * 100) / 100;
  }

  /**
   * Estimate operating margin by industry
   */
  private estimateOperatingMargin(industry?: string): number {
    const margins: Record<string, number> = {
      'Software Publishers': 25,
      'Banking': 30,
      'Insurance Carriers': 15,
      'Pharmaceutical Manufacturing': 22,
      'E-commerce & Online Retail': 5,
      'Department Stores': 3,
      'Motor Vehicle Manufacturing': 7,
      'Computer & Electronic Manufacturing': 12,
    };

    return margins[industry || ''] || 10;
  }

  /**
   * Estimate P/E ratio by industry
   */
  private estimatePERatio(industry?: string): number {
    const ratios: Record<string, number> = {
      'Software Publishers': 35,
      'Banking': 12,
      'Insurance Carriers': 14,
      'Pharmaceutical Manufacturing': 18,
      'E-commerce & Online Retail': 40,
      'Department Stores': 15,
      'Motor Vehicle Manufacturing': 20,
      'Computer & Electronic Manufacturing': 25,
    };

    return ratios[industry || ''] || 20;
  }

  /**
   * Get NAICS code for industry
   */
  private getNAICSCode(industry?: string): string | undefined {
    if (!industry) return undefined;
    
    for (const [code, name] of Object.entries(INDUSTRY_CLASSIFICATIONS)) {
      if (name === industry) return code;
    }
    
    return undefined;
  }

  /**
   * Determine legal structure from company type
   */
  private determineLegalStructure(type?: string): string {
    switch (type) {
      case 'public': return 'Public Corporation';
      case 'private': return 'Private Corporation';
      case 'nonprofit': return 'Nonprofit Organization';
      case 'government': return 'Government Entity';
      default: return 'Corporation';
    }
  }

  /**
   * Estimate registration date from founded year
   */
  private estimateRegistrationDate(founded?: number): string | undefined {
    if (!founded) return undefined;
    return `${founded}-01-01`;
  }
}

// Export singleton instance
export const companyEnrichmentService = new CompanyEnrichmentService();