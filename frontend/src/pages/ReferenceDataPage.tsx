import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TagIcon,
  MapPinIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';
import { 
  mockReferenceDataMap, 
  createMockResponse, 
  bootstrapMockData, 
  enrichReferenceData 
} from '../services/mockReferenceData';

interface ReferenceDataItem {
  id: number;
  name: string;
  description?: string;
  risk_factor?: number;
  risk_category?: string;
  [key: string]: any;
}

interface ReferenceDataSection {
  id: string;
  title: string;
  icon: React.ReactElement;
  endpoint: string;
  dataKey: string;
  fields: {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select';
    required: boolean;
    options?: string[];
  }[];
  idField: string;
}

const ReferenceDataPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string>('industry-types');
  const [data, setData] = useState<{ [key: string]: ReferenceDataItem[] }>({});
  const [selectedItems, setSelectedItems] = useState<{ [key: string]: number[] }>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ReferenceDataItem | null>(null);
  const [modalData, setModalData] = useState<{ [key: string]: any }>({});
  const [usingMockData, setUsingMockData] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  // Check if user is super admin
  const isSuperAdmin = () => {
    return user?.roles?.includes('system_admin') || 
           user?.roles?.includes('admin') || 
           user?.roles?.includes('super_admin') ||
           user?.email?.includes('admin@toluai.com');
  };

  // Check if section should be read-only
  const isSectionReadOnly = (sectionId: string) => {
    if (usingMockData) return true; // Demo mode is always read-only
    if (sectionId === 'states' && !isSuperAdmin()) return true; // States only editable by super admins
    return false;
  };

  const sections: ReferenceDataSection[] = [
    {
      id: 'industry-types',
      title: 'Industry Types',
      icon: <TagIcon className="w-5 h-5" />,
      endpoint: '/api/v2/irpa/reference/industry-types',
      dataKey: 'industry_types',
      idField: 'industry_type_id',
      fields: [
        { key: 'industry_name', label: 'Industry Name', type: 'text', required: true },
        {
          key: 'risk_category',
          label: 'Risk Category',
          type: 'select',
          required: true,
          options: ['Low', 'Medium', 'High', 'Critical', 'Commodity', 'Cyclical', 'Defensive'],
        },
        { key: 'base_risk_factor', label: 'Base Risk Factor', type: 'number', required: true },
      ],
    },
    {
      id: 'states',
      title: 'States',
      icon: <MapPinIcon className="w-5 h-5" />,
      endpoint: '/api/v2/irpa/reference/states',
      dataKey: 'states',
      idField: 'state_id',
      fields: [
        { key: 'state_code', label: 'State Code', type: 'text', required: true },
        { key: 'state_name', label: 'State Name', type: 'text', required: true },
        { key: 'risk_factor', label: 'Risk Factor', type: 'number', required: true },
      ],
    },
    {
      id: 'education-levels',
      title: 'Education Levels',
      icon: <AcademicCapIcon className="w-5 h-5" />,
      endpoint: '/api/v2/irpa/reference/education-levels',
      dataKey: 'education_levels',
      idField: 'education_level_id',
      fields: [
        { key: 'level_name', label: 'Level Name', type: 'text', required: true },
        { key: 'risk_factor', label: 'Risk Factor', type: 'number', required: true },
      ],
    },
    {
      id: 'job-titles',
      title: 'Job Titles',
      icon: <BriefcaseIcon className="w-5 h-5" />,
      endpoint: '/api/v2/irpa/reference/job-titles',
      dataKey: 'job_titles',
      idField: 'job_title_id',
      fields: [
        { key: 'title_name', label: 'Title Name', type: 'text', required: true },
        {
          key: 'risk_category',
          label: 'Risk Category',
          type: 'select',
          required: true,
          options: ['Professional', 'Administrative', 'Technical', 'Management', 'Entry Level'],
        },
        { key: 'risk_factor', label: 'Risk Factor', type: 'number', required: true },
      ],
    },
    {
      id: 'practice-fields',
      title: 'Practice Fields',
      icon: <ChartBarIcon className="w-5 h-5" />,
      endpoint: '/api/v2/irpa/reference/practice-fields',
      dataKey: 'practice_fields',
      idField: 'practice_field_id',
      fields: [
        { key: 'field_name', label: 'Field Name', type: 'text', required: true },
        { key: 'risk_factor', label: 'Risk Factor', type: 'number', required: true },
      ],
    },
    {
      id: 'roles',
      title: 'Roles',
      icon: <UserGroupIcon className="w-5 h-5" />,
      endpoint: '/api/v1/roles',
      dataKey: 'roles',
      idField: 'id',
      fields: [
        { key: 'name', label: 'Role Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'text', required: false },
      ],
    },
    {
      id: 'permissions',
      title: 'Permissions',
      icon: <ShieldCheckIcon className="w-5 h-5" />,
      endpoint: '/api/v1/permissions',
      dataKey: 'permissions',
      idField: 'id',
      fields: [
        { key: 'name', label: 'Permission Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'text', required: false },
      ],
    },
  ];

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');

      if (!token) {
        toast.error('Authentication token not found. Please log in again.');
        return;
      }

      const newData: { [key: string]: ReferenceDataItem[] } = {};

      for (const section of sections) {
        try {
          const response = await fetch(`http://localhost:5175${section.endpoint}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const result = await response.json();
            newData[section.id] = result[section.dataKey] || [];
          } else {
            console.warn(`API failed for ${section.title}, using mock data`);
            // Use mock data as fallback
            const mockResponse = createMockResponse(section.id, section.dataKey);
            newData[section.id] = (mockResponse[section.dataKey] || []) as ReferenceDataItem[];
            setUsingMockData(true);
          }
        } catch (error) {
          console.warn(`Network error for ${section.title}, using mock data:`, error);
          // Use mock data as fallback when network fails
          const mockResponse = createMockResponse(section.id, section.dataKey);
          newData[section.id] = (mockResponse[section.dataKey] || []) as ReferenceDataItem[];
          setUsingMockData(true);
        }
      }

      setData(newData);
    } catch (error) {
      console.warn('Failed to load from API, using mock data:', error);
      // Load all mock data as ultimate fallback
      const mockData: { [key: string]: ReferenceDataItem[] } = {};
      sections.forEach(section => {
        const mockResponse = createMockResponse(section.id, section.dataKey);
        mockData[section.id] = (mockResponse[section.dataKey] || []) as ReferenceDataItem[];
      });
      setData(mockData);
      setUsingMockData(true);
      toast.success('Loaded demo reference data');
    } finally {
      setLoading(false);
    }
  };

  const loadSectionData = async (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5175${section.endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setData((prev) => ({
          ...prev,
          [sectionId]: result[section.dataKey] || [],
        }));
      } else {
        // Use mock data as fallback
        const mockResponse = createMockResponse(section.id, section.dataKey);
        setData((prev) => ({
          ...prev,
          [sectionId]: (mockResponse[section.dataKey] || []) as ReferenceDataItem[],
        }));
      }
    } catch (error) {
      console.warn(`Error reloading ${section.title}, using mock data:`, error);
      // Use mock data as fallback
      const mockResponse = createMockResponse(section.id, section.dataKey);
      setData((prev) => ({
        ...prev,
        [sectionId]: (mockResponse[section.dataKey] || []) as ReferenceDataItem[],
      }));
    }
  };

  const handleCreate = () => {
    const section = sections.find((s) => s.id === selectedSection);
    if (!section) return;

    setEditingItem(null);
    setModalData({});
    setIsModalOpen(true);
  };

  const handleEdit = (item: ReferenceDataItem) => {
    setEditingItem(item);
    setModalData(item);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const section = sections.find((s) => s.id === selectedSection);
    if (!section) return;

    try {
      const token = localStorage.getItem('access_token');
      const isEditing = editingItem !== null;
      const url = isEditing
        ? `http://localhost:5175${section.endpoint}/${editingItem[section.idField]}`
        : `http://localhost:5175${section.endpoint}`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(modalData),
      });

      if (response.ok) {
        toast.success(`${section.title} ${isEditing ? 'updated' : 'created'} successfully`);
        setIsModalOpen(false);
        await loadSectionData(selectedSection);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${isEditing ? 'update' : 'create'} ${section.title}`);
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Save error:', error);
    }
  };

  const handleDelete = async (item: ReferenceDataItem) => {
    const section = sections.find((s) => s.id === selectedSection);
    if (!section) return;

    if (!confirm(`Are you sure you want to delete this ${section.title.toLowerCase()}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:5175${section.endpoint}/${item[section.idField]}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        toast.success(`${section.title} deleted successfully`);
        await loadSectionData(selectedSection);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to delete ${section.title}`);
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Delete error:', error);
    }
  };

  const handleBulkDelete = async () => {
    const section = sections.find((s) => s.id === selectedSection);
    if (!section) return;

    const selected = selectedItems[selectedSection] || [];
    if (selected.length === 0) {
      toast.error('No items selected');
      return;
    }

    if (
      !confirm(`Are you sure you want to delete ${selected.length} ${section.title.toLowerCase()}?`)
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:5175${section.endpoint}/bulk-delete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selected }),
      });

      if (response.ok) {
        toast.success(`${selected.length} ${section.title.toLowerCase()} deleted successfully`);
        setSelectedItems((prev) => ({ ...prev, [selectedSection]: [] }));
        await loadSectionData(selectedSection);
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to delete ${section.title.toLowerCase()}`);
      }
    } catch (error) {
      toast.error('An error occurred');
      console.error('Bulk delete error:', error);
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItems((prev) => {
      const current = prev[selectedSection] || [];
      const updated = current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId];

      return {
        ...prev,
        [selectedSection]: updated,
      };
    });
  };

  const handleSelectAll = () => {
    const currentData = data[selectedSection] || [];
    const section = sections.find((s) => s.id === selectedSection);
    if (!section) return;

    const allIds = currentData.map((item) => item[section.idField]);
    const current = selectedItems[selectedSection] || [];

    if (current.length === allIds.length) {
      // Deselect all
      setSelectedItems((prev) => ({ ...prev, [selectedSection]: [] }));
    } else {
      // Select all
      setSelectedItems((prev) => ({ ...prev, [selectedSection]: allIds }));
    }
  };

  const handleBootstrap = async () => {
    if (bootstrapping) return;
    
    setBootstrapping(true);
    try {
      toast.loading('Bootstrapping reference data from external sources...');
      
      const result = await bootstrapMockData();
      
      if (result.success) {
        toast.success('Reference data bootstrapped successfully!');
        // Reload all data to show the new bootstrapped data
        await loadAllData();
      } else {
        toast.error('Bootstrap failed: ' + result.message);
      }
    } catch (error) {
      toast.error('Bootstrap process failed');
      console.error('Bootstrap error:', error);
    } finally {
      setBootstrapping(false);
    }
  };

  const handleEnrichData = async () => {
    if (bootstrapping) return;
    
    setBootstrapping(true);
    try {
      toast.loading('Enriching reference data with external sources...');
      
      const result = await enrichReferenceData(data);
      
      if (result.success) {
        toast.success(result.message);
        // Reload all data to show the enriched data
        await loadAllData();
      } else {
        toast.error('Data enrichment failed: ' + result.message);
      }
    } catch (error) {
      toast.error('Data enrichment process failed');
      console.error('Data enrichment error:', error);
    } finally {
      setBootstrapping(false);
    }
  };

  const renderFormField = (field: any, value: any, onChange: (value: any) => void) => {
    if (field.type === 'select') {
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {field.options?.map((option: string) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    } else if (field.type === 'number') {
      return (
        <input
          type="number"
          step="0.1"
          value={value || ''}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required={field.required}
        />
      );
    } else {
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          required={field.required}
        />
      );
    }
  };

  const currentSection = sections.find((s) => s.id === selectedSection);
  const currentData = data[selectedSection] || [];
  const selectedCount = selectedItems[selectedSection]?.length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reference Data</h1>
        <p className="text-gray-600 mt-1">Manage system reference data and lookup tables</p>
        {usingMockData && (
          <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-amber-800">
                  <strong>Demo Mode:</strong> Displaying sample reference data. Backend API not available.
                </p>
              </div>
            </div>
          </div>
        )}
        {selectedSection === 'states' && !isSuperAdmin() && !usingMockData && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-800">
                  <strong>Read-Only:</strong> States data can only be modified by Super Administrators.
                </p>
              </div>
            </div>
          </div>
        )}
        {(selectedSection === 'job-titles' || selectedSection === 'practice-fields') && (
          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-green-800">
                  <strong>External Data Available:</strong> This data can be bootstrapped from external sources for comprehensive coverage.
                </p>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={handleBootstrap}
                  disabled={bootstrapping || loading}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    bootstrapping || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  title="Replace current data with fresh external data"
                >
                  {bootstrapping ? 'Loading...' : 'Bootstrap'}
                </button>
                <button
                  onClick={handleEnrichData}
                  disabled={bootstrapping || loading}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    bootstrapping || loading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  title="Add new entries from external sources to existing data"
                >
                  {bootstrapping ? 'Loading...' : 'Enrich'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
            {sections.map((section) => {
              const sectionData = data[section.id] || [];
              const isActive = selectedSection === section.id;

              return (
                <button
                  key={section.id}
                  onClick={() => setSelectedSection(section.id)}
                  className={`${
                    isActive
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  } whitespace-nowrap py-4 px-3 border-b-2 font-medium text-sm flex items-center space-x-2 transition-all duration-200 rounded-t-md`}
                >
                  <span className={isActive ? 'text-primary-600' : 'text-gray-400'}>
                    {section.icon}
                  </span>
                  <span className="hidden sm:inline">{section.title}</span>
                  <span
                    className={`${
                      isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                    } py-0.5 px-2 rounded-full text-xs font-medium`}
                  >
                    {sectionData.length}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section Content */}
        <div className="p-6">
          {sectionLoading ? (
            <div className="flex items-center justify-center h-64">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            currentSection && (
              <>
                {/* Section Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    {currentSection.icon}
                    <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
                    <span className="bg-gray-100 text-gray-600 py-1 px-3 rounded-full text-sm">
                      {currentData.length} items
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    {selectedCount > 0 && (
                      <button
                        onClick={handleBulkDelete}
                        disabled={isSectionReadOnly(selectedSection)}
                        className={`flex items-center px-3 py-2 border rounded-md text-sm ${
                          isSectionReadOnly(selectedSection)
                            ? 'border-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'border-red-300 text-red-700 hover:bg-red-50'
                        }`}
                        title={
                          usingMockData ? 'Not available in demo mode' :
                          selectedSection === 'states' && !isSuperAdmin() ? 'States can only be modified by Super Administrators' :
                          ''
                        }
                      >
                        <TrashIcon className="w-4 h-4 mr-2" />
                        Delete Selected ({selectedCount})
                      </button>
                    )}

                    <button
                      onClick={handleCreate}
                      disabled={isSectionReadOnly(selectedSection)}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        isSectionReadOnly(selectedSection)
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                      title={
                        usingMockData ? 'Not available in demo mode' :
                        selectedSection === 'states' && !isSuperAdmin() ? 'States can only be modified by Super Administrators' :
                        ''
                      }
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add New {currentSection.title.slice(0, -1)}
                    </button>
                  </div>
                </div>

                {/* Data Table */}
                {currentData.length > 0 ? (
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                              <input
                                type="checkbox"
                                checked={
                                  selectedCount === currentData.length && currentData.length > 0
                                }
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                              />
                            </th>
                            {currentSection.fields.map((field) => (
                              <th
                                key={field.key}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {field.label}
                              </th>
                            ))}
                            <th scope="col" className="relative px-6 py-3">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentData.map((item) => (
                            <tr
                              key={item[currentSection.idField]}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                                <input
                                  type="checkbox"
                                  checked={
                                    selectedItems[selectedSection]?.includes(
                                      item[currentSection.idField]
                                    ) || false
                                  }
                                  onChange={() => handleSelectItem(item[currentSection.idField])}
                                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                              </td>
                              {currentSection.fields.map((field) => (
                                <td key={field.key} className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {field.type === 'number' &&
                                    item[field.key] !== null &&
                                    item[field.key] !== undefined
                                      ? parseFloat(item[field.key]).toFixed(1)
                                      : item[field.key] || '-'}
                                  </div>
                                </td>
                              ))}
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end space-x-2">
                                  <button
                                    onClick={() => handleEdit(item)}
                                    disabled={isSectionReadOnly(selectedSection)}
                                    className={`transition-colors duration-150 p-1 ${
                                      isSectionReadOnly(selectedSection)
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-primary-600 hover:text-primary-900'
                                    }`}
                                    title={
                                      usingMockData ? 'Not available in demo mode' :
                                      selectedSection === 'states' && !isSuperAdmin() ? 'States can only be modified by Super Administrators' :
                                      'Edit'
                                    }
                                  >
                                    <PencilIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(item)}
                                    disabled={isSectionReadOnly(selectedSection)}
                                    className={`transition-colors duration-150 p-1 ${
                                      isSectionReadOnly(selectedSection)
                                        ? 'text-gray-400 cursor-not-allowed' 
                                        : 'text-red-600 hover:text-red-900'
                                    }`}
                                    title={
                                      usingMockData ? 'Not available in demo mode' :
                                      selectedSection === 'states' && !isSuperAdmin() ? 'States can only be modified by Super Administrators' :
                                      'Delete'
                                    }
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <div className="text-gray-400 mb-4 flex justify-center">
                      <div className="w-12 h-12 flex items-center justify-center">
                        {currentSection.icon}
                      </div>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No {currentSection.title.toLowerCase()} yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Get started by adding your first{' '}
                      {currentSection.title.slice(0, -1).toLowerCase()}
                    </p>
                    <button
                      onClick={handleCreate}
                      disabled={usingMockData}
                      className={`inline-flex items-center px-4 py-2 rounded-md transition-colors duration-200 ${
                        usingMockData 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'bg-primary-600 text-white hover:bg-primary-700'
                      }`}
                      title={usingMockData ? 'Not available in demo mode' : ''}
                    >
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add First {currentSection.title.slice(0, -1)}
                    </button>
                  </div>
                )}
              </>
            )
          )}
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {isModalOpen && currentSection && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Edit' : 'Create'} {currentSection.title.slice(0, -1)}
              </h3>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSave();
                }}
                className="space-y-4"
              >
                {currentSection.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {renderFormField(field, modalData[field.key], (value) =>
                      setModalData((prev) => ({ ...prev, [field.key]: value }))
                    )}
                  </div>
                ))}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferenceDataPage;
