import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import CompanyAutocomplete from '../CompanyAutocomplete';

// Mock the company enrichment service
vi.mock('../../services/companyEnrichment', () => ({
  companyEnrichmentService: {
    searchCompanies: vi.fn(() => Promise.resolve([])),
    enrichCompany: vi.fn(() => Promise.resolve(null))
  }
}));

describe('CompanyAutocomplete', () => {
  const mockOnSelect = vi.fn();
  const mockOnChange = vi.fn();

  it('renders the autocomplete input', () => {
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onCompanySelect={mockOnSelect}
      />
    );
    
    expect(screen.getByPlaceholderText(/Start typing company name/i)).toBeInTheDocument();
  });

  it('displays the search icon', () => {
    const { container } = render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onCompanySelect={mockOnSelect}
      />
    );
    
    // Check for the search icon SVG
    const searchIcon = container.querySelector('svg');
    expect(searchIcon).toBeInTheDocument();
  });

  it('accepts custom placeholder text', () => {
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onCompanySelect={mockOnSelect}
        placeholder="Search for a company"
      />
    );
    
    expect(screen.getByPlaceholderText(/Search for a company/i)).toBeInTheDocument();
  });

  it('displays the provided value', () => {
    render(
      <CompanyAutocomplete
        value="Test Company"
        onChange={mockOnChange}
        onCompanySelect={mockOnSelect}
      />
    );
    
    const input = screen.getByPlaceholderText(/Start typing company name/i) as HTMLInputElement;
    expect(input.value).toBe('Test Company');
  });

  it('applies custom className', () => {
    const { container } = render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onCompanySelect={mockOnSelect}
        className="custom-class"
      />
    );
    
    const input = container.querySelector('input');
    expect(input?.className).toContain('custom-class');
  });

  it('sets required attribute when specified', () => {
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onCompanySelect={mockOnSelect}
        required={true}
      />
    );
    
    const input = screen.getByPlaceholderText(/Start typing company name/i) as HTMLInputElement;
    expect(input.required).toBe(true);
  });
});