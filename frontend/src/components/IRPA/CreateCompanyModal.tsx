import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { IndustryType, State, CreateCompanyForm } from '../../types/irpa';
import Button from '../UI/Button';

interface CreateCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCompanyForm) => Promise<void>;
  industryTypes: IndustryType[];
  states: State[];
}

const CreateCompanyModal: React.FC<CreateCompanyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  industryTypes,
  states,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyForm>({
    company_name: '',
    industry_type_id: undefined,
    operating_margin: undefined,
    company_size: undefined,
    company_age: undefined,
    pe_ratio: undefined,
    state_id: undefined,
    registration_date: '',
    legal_structure: '',
    address_line1: '',
    address_line2: '',
    city: '',
    zip_code: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }

    if (!formData.registration_date) {
      newErrors.registration_date = 'Registration date is required';
    }

    if (
      formData.operating_margin !== undefined &&
      (formData.operating_margin < -100 || formData.operating_margin > 100)
    ) {
      newErrors.operating_margin = 'Operating margin must be between -100% and 100%';
    }

    if (formData.company_size !== undefined && formData.company_size < 0) {
      newErrors.company_size = 'Company size must be positive';
    }

    if (formData.company_age !== undefined && formData.company_age < 0) {
      newErrors.company_age = 'Company age must be positive';
    }

    if (formData.pe_ratio !== undefined && formData.pe_ratio < 0) {
      newErrors.pe_ratio = 'P/E ratio must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Clean up form data - remove empty values
      const submitData: CreateCompanyForm = {
        company_name: formData.company_name.trim(),
        registration_date: formData.registration_date,
        industry_type_id: formData.industry_type_id || undefined,
        operating_margin: formData.operating_margin || undefined,
        company_size: formData.company_size || undefined,
        company_age: formData.company_age || undefined,
        pe_ratio: formData.pe_ratio || undefined,
        state_id: formData.state_id || undefined,
        legal_structure: formData.legal_structure?.trim() || undefined,
        address_line1: formData.address_line1?.trim() || undefined,
        address_line2: formData.address_line2?.trim() || undefined,
        city: formData.city?.trim() || undefined,
        zip_code: formData.zip_code?.trim() || undefined,
      };

      await onSubmit(submitData);

      // Reset form
      setFormData({
        company_name: '',
        industry_type_id: undefined,
        operating_margin: undefined,
        company_size: undefined,
        company_age: undefined,
        pe_ratio: undefined,
        state_id: undefined,
        registration_date: '',
        legal_structure: '',
        address_line1: '',
        address_line2: '',
        city: '',
        zip_code: '',
      });
      setErrors({});
    } catch (error) {
      // Error handled in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue: any = value;

    // Convert numeric fields
    if (['industry_type_id', 'company_size', 'company_age', 'state_id'].includes(name)) {
      processedValue = value ? parseInt(value, 10) : undefined;
    } else if (['operating_margin', 'pe_ratio'].includes(name)) {
      processedValue = value ? parseFloat(value) : undefined;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const legalStructures = [
    'Corporation',
    'LLC',
    'Partnership',
    'Sole Proprietorship',
    'Non-Profit',
    'Other',
  ];

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog onClose={onClose} className="relative z-50">
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Add New Company
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-8">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="company_name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Company Name *
                        </label>
                        <input
                          type="text"
                          name="company_name"
                          id="company_name"
                          required
                          value={formData.company_name}
                          onChange={handleChange}
                          className={`input w-full ${errors.company_name ? 'input-error' : ''}`}
                          placeholder="Enter company name"
                        />
                        {errors.company_name && (
                          <p className="text-red-500 text-xs mt-1">{errors.company_name}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="registration_date"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Registration Date *
                        </label>
                        <input
                          type="date"
                          name="registration_date"
                          id="registration_date"
                          required
                          value={formData.registration_date}
                          onChange={handleChange}
                          className={`input w-full ${errors.registration_date ? 'input-error' : ''}`}
                        />
                        {errors.registration_date && (
                          <p className="text-red-500 text-xs mt-1">{errors.registration_date}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="industry_type_id"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Industry Type
                        </label>
                        <select
                          name="industry_type_id"
                          id="industry_type_id"
                          value={formData.industry_type_id || ''}
                          onChange={handleChange}
                          className="input w-full"
                        >
                          <option value="">Select an industry</option>
                          {industryTypes.map((industry) => (
                            <option
                              key={industry.industry_type_id}
                              value={industry.industry_type_id}
                            >
                              {industry.industry_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="legal_structure"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Legal Structure
                        </label>
                        <select
                          name="legal_structure"
                          id="legal_structure"
                          value={formData.legal_structure}
                          onChange={handleChange}
                          className="input w-full"
                        >
                          <option value="">Select structure</option>
                          {legalStructures.map((structure) => (
                            <option key={structure} value={structure}>
                              {structure}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">
                      Financial Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label
                          htmlFor="operating_margin"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Operating Margin (%)
                        </label>
                        <input
                          type="number"
                          name="operating_margin"
                          id="operating_margin"
                          value={formData.operating_margin || ''}
                          onChange={handleChange}
                          className={`input w-full ${errors.operating_margin ? 'input-error' : ''}`}
                          placeholder="e.g., 15.5"
                          step="0.01"
                          min="-100"
                          max="100"
                        />
                        {errors.operating_margin && (
                          <p className="text-red-500 text-xs mt-1">{errors.operating_margin}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="pe_ratio"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          P/E Ratio
                        </label>
                        <input
                          type="number"
                          name="pe_ratio"
                          id="pe_ratio"
                          value={formData.pe_ratio || ''}
                          onChange={handleChange}
                          className={`input w-full ${errors.pe_ratio ? 'input-error' : ''}`}
                          placeholder="e.g., 18.5"
                          step="0.01"
                          min="0"
                        />
                        {errors.pe_ratio && (
                          <p className="text-red-500 text-xs mt-1">{errors.pe_ratio}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="company_size"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Company Size (Employees)
                        </label>
                        <input
                          type="number"
                          name="company_size"
                          id="company_size"
                          value={formData.company_size || ''}
                          onChange={handleChange}
                          className={`input w-full ${errors.company_size ? 'input-error' : ''}`}
                          placeholder="e.g., 150"
                          min="0"
                        />
                        {errors.company_size && (
                          <p className="text-red-500 text-xs mt-1">{errors.company_size}</p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="company_age"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Company Age (Years)
                        </label>
                        <input
                          type="number"
                          name="company_age"
                          id="company_age"
                          value={formData.company_age || ''}
                          onChange={handleChange}
                          className={`input w-full ${errors.company_age ? 'input-error' : ''}`}
                          placeholder="e.g., 5"
                          min="0"
                        />
                        {errors.company_age && (
                          <p className="text-red-500 text-xs mt-1">{errors.company_age}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label
                          htmlFor="address_line1"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          name="address_line1"
                          id="address_line1"
                          value={formData.address_line1}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="address_line2"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="address_line2"
                          id="address_line2"
                          value={formData.address_line2}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="Apartment, suite, etc."
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="city"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="City name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="state_id"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          State
                        </label>
                        <select
                          name="state_id"
                          id="state_id"
                          value={formData.state_id || ''}
                          onChange={handleChange}
                          className="input w-full"
                        >
                          <option value="">Select a state</option>
                          {states.map((state) => (
                            <option key={state.state_id} value={state.state_id}>
                              {state.state_name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="zip_code"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          ZIP Code
                        </label>
                        <input
                          type="text"
                          name="zip_code"
                          id="zip_code"
                          value={formData.zip_code}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="12345"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={!formData.company_name || !formData.registration_date}
                    >
                      Create Company
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CreateCompanyModal;
