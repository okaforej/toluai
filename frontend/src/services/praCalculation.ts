/**
 * Professional Risk Assessment (PRA) Score Calculation Service
 * Calculates risk scores based on entity and company data
 */

export interface PRAScoreInputs {
  // Personal factors
  fico_score?: number;
  dti_ratio?: number;
  years_experience?: number;
  entity_type?: string;
  
  // Company factors
  company_industry?: string;
  company_risk_factor?: number;
  company_type?: string;
  company_employees?: number;
  company_founded?: number;
}

export interface PRAScoreResult {
  overall_score: number;  // Aggregate PRA score
  ipra_score: number;  // Individual Professional Risk Assessment
  financial_risk_score: number;
  professional_risk_score: number;
  industry_risk_score: number;
  company_risk_score: number;
  risk_category: 'low' | 'medium' | 'high' | 'critical';
  confidence_level: number;
  weighted_components: {
    financial_weight: number;
    professional_weight: number;
    industry_weight: number;
    company_weight: number;
  };
  factors: {
    positive: string[];
    negative: string[];
    recommendations: string[];
  };
}

class PRACalculationService {
  /**
   * Calculate comprehensive PRA score
   */
  calculatePRAScore(inputs: PRAScoreInputs): PRAScoreResult {
    // Calculate individual component scores
    const financialScore = this.calculateFinancialRiskScore(inputs);
    const professionalScore = this.calculateProfessionalRiskScore(inputs);
    const industryScore = this.calculateIndustryRiskScore(inputs);
    const companyScore = this.calculateCompanyRiskScore(inputs);
    
    // Calculate IPRA (Individual Professional Risk Assessment)
    // IPRA focuses on individual factors: financial (50%) + professional (50%)
    const ipraScore = Math.round(
      financialScore * 0.5 +
      professionalScore * 0.5
    );
    
    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidenceLevel(inputs);
    
    // Calculate weighted components for aggregate PRA
    const weights = {
      financial_weight: 0.30,
      professional_weight: 0.25,
      industry_weight: 0.20,
      company_weight: 0.25
    };
    
    // Calculate aggregate PRA score (weighted average of all components)
    const overallScore = Math.round(
      financialScore * weights.financial_weight +
      professionalScore * weights.professional_weight +
      industryScore * weights.industry_weight +
      companyScore * weights.company_weight
    );
    
    // Determine risk category based on overall score
    const riskCategory = this.determineRiskCategory(overallScore);
    
    // Generate factors analysis
    const factors = this.analyzeFactors(inputs, {
      financialScore,
      professionalScore,
      industryScore,
      companyScore,
      overallScore,
      ipraScore
    });
    
    return {
      overall_score: overallScore,
      ipra_score: ipraScore,
      financial_risk_score: financialScore,
      professional_risk_score: professionalScore,
      industry_risk_score: industryScore,
      company_risk_score: companyScore,
      risk_category: riskCategory,
      confidence_level: confidence,
      weighted_components: weights,
      factors
    };
  }
  
  /**
   * Calculate financial risk score based on FICO and DTI
   */
  private calculateFinancialRiskScore(inputs: PRAScoreInputs): number {
    let score = 50; // Base score
    
    // FICO Score impact (0-50 points)
    if (inputs.fico_score) {
      if (inputs.fico_score >= 800) score += 50;
      else if (inputs.fico_score >= 740) score += 40;
      else if (inputs.fico_score >= 670) score += 30;
      else if (inputs.fico_score >= 580) score += 20;
      else if (inputs.fico_score >= 500) score += 10;
      else score += 5;
    }
    
    // DTI Ratio impact (0-50 points, lower is better)
    if (inputs.dti_ratio !== undefined) {
      const dtiPercent = inputs.dti_ratio * 100;
      if (dtiPercent <= 20) score += 50;
      else if (dtiPercent <= 30) score += 40;
      else if (dtiPercent <= 40) score += 30;
      else if (dtiPercent <= 50) score += 20;
      else if (dtiPercent <= 60) score += 10;
      else score += 0;
    }
    
    // Normalize to 0-100
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Calculate professional risk score
   */
  private calculateProfessionalRiskScore(inputs: PRAScoreInputs): number {
    let score = 50; // Base score
    
    // Years of experience impact (0-30 points)
    if (inputs.years_experience !== undefined) {
      if (inputs.years_experience >= 15) score += 30;
      else if (inputs.years_experience >= 10) score += 25;
      else if (inputs.years_experience >= 5) score += 20;
      else if (inputs.years_experience >= 3) score += 15;
      else if (inputs.years_experience >= 1) score += 10;
      else score += 5;
    }
    
    // Entity type impact (0-20 points)
    if (inputs.entity_type) {
      if (inputs.entity_type === 'Corporate') score += 20;
      else if (inputs.entity_type === 'Individual') score += 15;
    }
    
    // Company size impact (0-30 points)
    if (inputs.company_employees) {
      if (inputs.company_employees >= 10000) score += 30;
      else if (inputs.company_employees >= 1000) score += 25;
      else if (inputs.company_employees >= 100) score += 20;
      else if (inputs.company_employees >= 10) score += 15;
      else score += 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Calculate company risk score
   */
  private calculateCompanyRiskScore(inputs: PRAScoreInputs): number {
    let score = 50; // Base score
    
    // Company risk factor (primary indicator)
    if (inputs.company_risk_factor !== undefined) {
      // Lower risk factor is better (inverse relationship)
      if (inputs.company_risk_factor <= 0.5) score = 95;
      else if (inputs.company_risk_factor <= 0.8) score = 85;
      else if (inputs.company_risk_factor <= 1.0) score = 75;
      else if (inputs.company_risk_factor <= 1.2) score = 65;
      else if (inputs.company_risk_factor <= 1.5) score = 55;
      else score = 45;
    }
    
    // Company type adjustment
    if (inputs.company_type === 'public') {
      score += 10; // Public companies generally more stable
    } else if (inputs.company_type === 'nonprofit') {
      score += 5;
    }
    
    // Company size adjustment
    if (inputs.company_employees) {
      if (inputs.company_employees >= 10000) score += 10;
      else if (inputs.company_employees >= 1000) score += 5;
      else if (inputs.company_employees < 50) score -= 5;
    }
    
    // Company age adjustment
    if (inputs.company_founded) {
      const age = new Date().getFullYear() - inputs.company_founded;
      if (age >= 50) score += 10;
      else if (age >= 20) score += 5;
      else if (age < 5) score -= 10;
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Calculate industry risk score
   */
  private calculateIndustryRiskScore(inputs: PRAScoreInputs): number {
    let score = 70; // Base score
    
    // Industry-specific adjustments
    const industryScores: Record<string, number> = {
      'Banking': 85,
      'Insurance Carriers': 80,
      'Software Publishers': 75,
      'Medical Offices': 85,
      'Legal Services': 60,
      'Real Estate': 70,
      'Manufacturing': 65,
      'Transportation': 60,
      'Retail': 70,
      'Consulting': 75,
      'E-commerce & Online Retail': 70,
      'Computer & Electronic Manufacturing': 75,
      'Pharmaceutical Manufacturing': 80,
    };
    
    if (inputs.company_industry && industryScores[inputs.company_industry]) {
      score = industryScores[inputs.company_industry];
    }
    
    return Math.min(100, Math.max(0, score));
  }
  
  /**
   * Calculate confidence level based on data completeness
   */
  private calculateConfidenceLevel(inputs: PRAScoreInputs): number {
    let dataPoints = 0;
    let totalPoints = 0;
    
    // Check personal data
    if (inputs.fico_score !== undefined) dataPoints += 2;
    totalPoints += 2;
    
    if (inputs.dti_ratio !== undefined) dataPoints += 2;
    totalPoints += 2;
    
    if (inputs.years_experience !== undefined) dataPoints += 1;
    totalPoints += 1;
    
    if (inputs.entity_type) dataPoints += 1;
    totalPoints += 1;
    
    // Check company data
    if (inputs.company_industry) dataPoints += 1;
    totalPoints += 1;
    
    if (inputs.company_risk_factor !== undefined) dataPoints += 1;
    totalPoints += 1;
    
    if (inputs.company_type) dataPoints += 0.5;
    totalPoints += 0.5;
    
    if (inputs.company_employees !== undefined) dataPoints += 0.5;
    totalPoints += 0.5;
    
    if (inputs.company_founded !== undefined) dataPoints += 0.5;
    totalPoints += 0.5;
    
    return Math.round((dataPoints / totalPoints) * 100);
  }
  
  /**
   * Determine risk category based on overall score
   */
  private determineRiskCategory(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 75) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 25) return 'high';
    return 'critical';
  }
  
  /**
   * Analyze factors contributing to the score
   */
  private analyzeFactors(
    inputs: PRAScoreInputs,
    scores: {
      financialScore: number;
      professionalScore: number;
      industryScore: number;
      companyScore: number;
      overallScore: number;
      ipraScore: number;
    }
  ): {
    positive: string[];
    negative: string[];
    recommendations: string[];
  } {
    const positive: string[] = [];
    const negative: string[] = [];
    const recommendations: string[] = [];
    
    // Financial factors
    if (inputs.fico_score) {
      if (inputs.fico_score >= 740) {
        positive.push(`Excellent FICO score (${inputs.fico_score})`);
      } else if (inputs.fico_score < 670) {
        negative.push(`Below average FICO score (${inputs.fico_score})`);
        recommendations.push('Consider credit improvement strategies');
      }
    } else {
      recommendations.push('Provide FICO score for better assessment');
    }
    
    if (inputs.dti_ratio !== undefined) {
      const dtiPercent = inputs.dti_ratio * 100;
      if (dtiPercent <= 30) {
        positive.push(`Low DTI ratio (${dtiPercent.toFixed(2)}%)`);
      } else if (dtiPercent > 50) {
        negative.push(`High DTI ratio (${dtiPercent.toFixed(2)}%)`);
        recommendations.push('Consider debt reduction strategies');
      }
    } else {
      recommendations.push('Provide DTI ratio for complete financial assessment');
    }
    
    // Professional factors
    if (inputs.years_experience) {
      if (inputs.years_experience >= 10) {
        positive.push(`Extensive experience (${inputs.years_experience} years)`);
      } else if (inputs.years_experience < 3) {
        negative.push(`Limited experience (${inputs.years_experience} years)`);
      }
    }
    
    // Industry factors
    if (inputs.company_industry) {
      if (scores.industryScore >= 75) {
        positive.push(`Low-risk industry (${inputs.company_industry})`);
      } else if (scores.industryScore < 50) {
        negative.push(`Higher-risk industry (${inputs.company_industry})`);
      }
    }
    
    if (inputs.company_type === 'public') {
      positive.push('Publicly traded company');
    }
    
    if (inputs.company_founded) {
      const age = new Date().getFullYear() - inputs.company_founded;
      if (age >= 20) {
        positive.push(`Established company (${age} years)`);
      } else if (age < 5) {
        negative.push(`Relatively new company (${age} years)`);
      }
    }
    
    // Overall recommendations
    if (scores.overallScore < 50) {
      recommendations.push('Consider additional risk mitigation measures');
    }
    
    if (scores.financialScore < scores.professionalScore - 20) {
      recommendations.push('Focus on improving financial metrics');
    }
    
    if (scores.professionalScore < scores.industryScore - 20) {
      recommendations.push('Consider professional development opportunities');
    }
    
    return { positive, negative, recommendations };
  }
}

// Export singleton instance
export const praCalculationService = new PRACalculationService();