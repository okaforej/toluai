import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Client } from '../../types';
import Button from '../UI/Button';
import { referenceDataAPI } from '../../services/api';

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Client>) => Promise<void>;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [industries, setIndustries] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    industry_type_id: '',
    annual_revenue: '',
    employee_count: '',
    address: '',
    city: '',
    state_id: '',
    zip_code: '',
    country: 'United States',
  });

  useEffect(() => {
    // Fetch reference data when modal opens
    if (isOpen) {
      fetchReferenceData();
    }
  }, [isOpen]);

  const fetchReferenceData = async () => {
    try {
      const [industriesData, statesData] = await Promise.all([
        referenceDataAPI.getIndustryTypes(),
        referenceDataAPI.getStates(),
      ]);
      setIndustries(industriesData);
      setStates(statesData);
    } catch (error) {
      console.error('Error fetching reference data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const submitData: Partial<Client> = {
        ...formData,
        industry_type_id: formData.industry_type_id
          ? parseInt(formData.industry_type_id)
          : undefined,
        state_id: formData.state_id ? parseInt(formData.state_id) : undefined,
        annual_revenue: formData.annual_revenue ? parseFloat(formData.annual_revenue) : undefined,
        employee_count: formData.employee_count ? parseInt(formData.employee_count) : undefined,
      };

      // Remove empty strings
      Object.keys(submitData).forEach((key) => {
        if (submitData[key as keyof typeof submitData] === '') {
          delete submitData[key as keyof typeof submitData];
        }
      });

      await onSubmit(submitData);

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        website: '',
        industry_type_id: '',
        annual_revenue: '',
        employee_count: '',
        address: '',
        city: '',
        state_id: '',
        zip_code: '',
        country: 'United States',
      });
    } catch (error) {
      // Error handled in parent component
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    Add New Client
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6 text-gray-400" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Company Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          id="name"
                          required
                          value={formData.name}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="Enter company name"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="contact@company.com"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="website"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Website
                        </label>
                        <input
                          type="url"
                          name="website"
                          id="website"
                          value={formData.website}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="https://company.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Business Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="industry_type_id"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Industry
                        </label>
                        <select
                          name="industry_type_id"
                          id="industry_type_id"
                          value={formData.industry_type_id}
                          onChange={handleChange}
                          className="input w-full"
                        >
                          <option value="">Select an industry</option>
                          {industries.map((industry) => (
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
                          htmlFor="employee_count"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Number of Employees
                        </label>
                        <input
                          type="number"
                          name="employee_count"
                          id="employee_count"
                          value={formData.employee_count}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="50"
                          min="1"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor="annual_revenue"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Annual Revenue
                        </label>
                        <input
                          type="number"
                          name="annual_revenue"
                          id="annual_revenue"
                          value={formData.annual_revenue}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="5000000"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-4">Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label
                          htmlFor="address"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Street Address
                        </label>
                        <input
                          type="text"
                          name="address"
                          id="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="input w-full"
                          placeholder="123 Business St"
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
                          placeholder="New York"
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
                          value={formData.state_id}
                          onChange={handleChange}
                          className="input w-full"
                        >
                          <option value="">Select a state</option>
                          {states.map((state) => (
                            <option key={state.state_id} value={state.state_id}>
                              {state.state_name} ({state.state_code})
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
                          placeholder="10001"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="country"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          id="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="input w-full"
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
                      disabled={!formData.name || !formData.email}
                    >
                      Create Client
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

export default CreateClientModal;
