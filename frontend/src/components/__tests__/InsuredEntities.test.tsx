import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import InsuredEntitiesSplitView from '../../pages/InsuredEntitiesSplitView';

// Mock the API
vi.mock('../../services/api', () => ({
  mockAPI: {
    getInsuredEntities: vi.fn(() => Promise.resolve({
      data: [
        {
          insured_id: 'INS-001',
          name: 'John Doe',
          fico_score: 750,
          dti_ratio: 0.35,
          company: 'Acme Corp',
          job_title: 'Software Engineer',
          risk_score: 450,
          status: 'active'
        }
      ],
      meta: { total: 1, page: 1 }
    })),
    createInsuredEntity: vi.fn((data) => Promise.resolve({ 
      success: true, 
      data: { ...data, insured_id: 'INS-002' } 
    }))
  }
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <InsuredEntitiesSplitView />
    </BrowserRouter>
  );
};

describe('InsuredEntitiesSplitView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the split view layout', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText(/Insured Entities/i)).toBeInTheDocument();
    });
  });

  it('displays entity data in the table', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('750')).toBeInTheDocument();
    });
  });

  it('opens Add Entity modal when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const addButton = await screen.findByText(/Add Entity/i);
    await user.click(addButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Add New Insured Entity/i)).toBeInTheDocument();
    });
  });

  it('handles form submission in Add Entity modal', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Open modal
    const addButton = await screen.findByText(/Add Entity/i);
    await user.click(addButton);
    
    // Fill form
    const nameInput = screen.getByLabelText(/Full Name/i);
    await user.type(nameInput, 'Jane Smith');
    
    const ficoInput = screen.getByLabelText(/FICO Score/i);
    await user.type(ficoInput, '800');
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Save Entity/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByText(/Add New Insured Entity/i)).not.toBeInTheDocument();
    });
  });

  it('calculates PRA score when button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    // Open modal
    const addButton = await screen.findByText(/Add Entity/i);
    await user.click(addButton);
    
    // Fill required fields
    const ficoInput = screen.getByLabelText(/FICO Score/i);
    await user.type(ficoInput, '750');
    
    const dtiInput = screen.getByLabelText(/DTI Ratio/i);
    await user.type(dtiInput, '0.30');
    
    // Calculate PRA
    const calculateButton = screen.getByText(/Calculate PRA Score/i);
    await user.click(calculateButton);
    
    await waitFor(() => {
      expect(screen.getByText(/Professional Risk Score/i)).toBeInTheDocument();
    });
  });

  it('filters entities when search is used', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText(/Search/i);
    await user.type(searchInput, 'Jane');
    
    await waitFor(() => {
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  it('selects entity when row is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();
    
    const entityRow = await screen.findByText('John Doe');
    await user.click(entityRow.closest('tr')!);
    
    await waitFor(() => {
      expect(entityRow.closest('tr')).toHaveClass('bg-blue-50');
    });
  });
});