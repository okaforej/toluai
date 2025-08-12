import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanyAutocomplete from '../CompanyAutocomplete';

// Mock the company enrichment service
vi.mock('../../services/companyEnrichment', () => ({
  companyEnrichmentService: {
    searchCompanies: vi.fn((query) => 
      Promise.resolve([
        {
          name: 'Acme Corporation',
          displayName: 'Acme Corporation',
          industry: 'Technology',
          revenue: 1000000,
          employees: 100,
          riskScore: 450
        },
        {
          name: 'Tech Solutions Inc',
          displayName: 'Tech Solutions Inc',
          industry: 'Software',
          revenue: 500000,
          employees: 50,
          riskScore: 380
        }
      ])
    )
  }
}));

describe('CompanyAutocomplete', () => {
  const mockOnSelect = vi.fn();
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the autocomplete input', () => {
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );
    
    expect(screen.getByLabelText(/Company/i)).toBeInTheDocument();
  });

  it('shows suggestions when typing', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );
    
    const input = screen.getByLabelText(/Company/i);
    await user.type(input, 'Acme');
    
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
      expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument();
    });
  });

  it('calls onSelect when company is selected', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );
    
    const input = screen.getByLabelText(/Company/i);
    await user.type(input, 'Acme');
    
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });
    
    const suggestion = screen.getByText('Acme Corporation');
    await user.click(suggestion);
    
    expect(mockOnSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Acme Corporation',
        industry: 'Technology'
      })
    );
  });

  it('displays company financial data in suggestions', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );
    
    const input = screen.getByLabelText(/Company/i);
    await user.type(input, 'Tech');
    
    await waitFor(() => {
      expect(screen.getByText(/Revenue: \$500,000/i)).toBeInTheDocument();
      expect(screen.getByText(/50 employees/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );
    
    const input = screen.getByLabelText(/Company/i);
    await user.type(input, 'A');
    
    expect(screen.getByText(/Searching/i)).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <CompanyAutocomplete
        value=""
        onChange={mockOnChange}
        onSelect={mockOnSelect}
      />
    );
    
    const input = screen.getByLabelText(/Company/i);
    await user.type(input, 'Acme');
    
    await waitFor(() => {
      expect(screen.getByText('Acme Corporation')).toBeInTheDocument();
    });
    
    // Press down arrow
    await user.keyboard('{ArrowDown}');
    
    // Press enter to select
    await user.keyboard('{Enter}');
    
    expect(mockOnSelect).toHaveBeenCalled();
  });
});