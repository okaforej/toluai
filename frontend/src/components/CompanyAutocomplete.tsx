import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MagnifyingGlassIcon,
  BuildingOfficeIcon,
  GlobeAltIcon,
  MapPinIcon,
  UserGroupIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { companyEnrichmentService, CompanySearchResult, EnrichedCompanyData } from '../services/companyEnrichment';
import LoadingSpinner from './UI/LoadingSpinner';
import { debounce } from 'lodash';

interface CompanyAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCompanySelect: (company: EnrichedCompanyData) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const CompanyAutocomplete: React.FC<CompanyAutocompleteProps> = ({
  value,
  onChange,
  onCompanySelect,
  placeholder = 'Start typing company name...',
  required = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanySearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsOpen(false);
        return;
      }

      setIsSearching(true);
      setError(null);
      
      try {
        const results = await companyEnrichmentService.searchCompanies(query, 8);
        setSearchResults(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Company search error:', err);
        setError('Failed to search companies');
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedCompany(null);
    
    if (newValue.length >= 2) {
      debouncedSearch(newValue);
    } else {
      setSearchResults([]);
      setIsOpen(false);
    }
  };

  // Handle company selection
  const handleCompanySelect = async (company: CompanySearchResult) => {
    setSelectedCompany(company);
    onChange(company.displayName || company.name);
    setIsOpen(false);
    setIsEnriching(true);

    try {
      // Get enriched data
      const enrichedData = await companyEnrichmentService.getEnrichedCompanyData(company.name);
      
      if (enrichedData) {
        onCompanySelect(enrichedData);
      }
    } catch (err) {
      console.error('Company enrichment error:', err);
      setError('Failed to get company details');
    } finally {
      setIsEnriching(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format large numbers
  const formatNumber = (num?: number): string => {
    if (!num) return 'N/A';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  // Get company type badge color
  const getTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'public': return 'bg-blue-100 text-blue-800';
      case 'private': return 'bg-gray-100 text-gray-800';
      case 'nonprofit': return 'bg-green-100 text-green-800';
      case 'government': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          className={`w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${className}`}
          autoComplete="off"
        />
        
        {/* Search Icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <div className="w-4 h-4">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Status Icon */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isEnriching && (
            <div className="w-4 h-4">
              <LoadingSpinner size="sm" />
            </div>
          )}
          {selectedCompany && !isEnriching && (
            <CheckCircleIcon className="w-5 h-5 text-green-500" />
          )}
          {error && (
            <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {searchResults.map((company, index) => (
            <div
              key={`${company.name}-${index}`}
              className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
              onClick={() => handleCompanySelect(company)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Company Name and Type */}
                  <div className="flex items-center gap-2 mb-1">
                    <BuildingOfficeIcon className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="font-medium text-gray-900">
                      {company.displayName || company.name}
                    </span>
                    {company.type && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getTypeBadgeColor(company.type)}`}>
                        {company.type.charAt(0).toUpperCase() + company.type.slice(1)}
                      </span>
                    )}
                    {company.ticker && (
                      <span className="text-xs text-gray-500 font-mono">
                        {company.ticker}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {company.description && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {company.description}
                    </p>
                  )}

                  {/* Company Details */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                    {/* Industry */}
                    {company.industry && (
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Industry:</span>
                        <span>{company.industry}</span>
                      </div>
                    )}

                    {/* Location */}
                    {company.headquarters && (
                      <div className="flex items-center gap-1">
                        <MapPinIcon className="w-3 h-3" />
                        <span>
                          {[
                            company.headquarters.city,
                            company.headquarters.state,
                            company.headquarters.country
                          ].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Employees */}
                    {company.employees && (
                      <div className="flex items-center gap-1">
                        <UserGroupIcon className="w-3 h-3" />
                        <span>{formatNumber(company.employees)} employees</span>
                      </div>
                    )}

                    {/* Founded */}
                    {company.founded && (
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="w-3 h-3" />
                        <span>Founded {company.founded}</span>
                      </div>
                    )}

                    {/* Website */}
                    {company.website && (
                      <div className="flex items-center gap-1">
                        <GlobeAltIcon className="w-3 h-3" />
                        <span className="text-primary-600">{company.domain}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Metrics */}
                  {(company.revenue || company.operatingMargin || company.marketCap) && (
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      {company.revenue && (
                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <div className="font-medium text-gray-900">${formatNumber(company.revenue)}</div>
                        </div>
                      )}
                      {company.operatingMargin !== undefined && (
                        <div>
                          <span className="text-gray-500">Op. Margin:</span>
                          <div className="font-medium text-gray-900">{(company.operatingMargin * 100).toFixed(1)}%</div>
                        </div>
                      )}
                      {company.marketCap && (
                        <div>
                          <span className="text-gray-500">Market Cap:</span>
                          <div className="font-medium text-gray-900">${formatNumber(company.marketCap)}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Confidence Score */}
                {company.confidence !== undefined && (
                  <div className="ml-4 flex-shrink-0">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${
                        company.confidence >= 0.8 ? 'text-green-600' :
                        company.confidence >= 0.5 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {Math.round(company.confidence * 100)}%
                      </div>
                      <div className="text-xs text-gray-500">Match</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && searchResults.length === 0 && !isSearching && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-500 text-center">
            No companies found matching "{value}"
          </p>
          <p className="text-xs text-gray-400 text-center mt-1">
            Try entering a different company name
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute z-40 w-full mt-1">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default CompanyAutocomplete;