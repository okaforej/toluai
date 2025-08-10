/**
 * Mock Authentication Service
 * Provides demo authentication functionality when backend is not available
 */

import { User, AuthResponse } from '../types';

// Demo user accounts with different roles
const DEMO_USERS = {
  'admin@toluai.com': {
    password: 'Admin123!',
    user: {
      id: '1',
      email: 'admin@toluai.com',
      name: 'System Administrator',
      roles: ['system_admin', 'super_admin'],
      permissions: ['*'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  },
  'company.admin@acme.com': {
    password: 'CompanyAdmin123!',
    user: {
      id: '2',
      email: 'company.admin@acme.com',
      name: 'Company Administrator',
      roles: ['company_admin'],
      permissions: ['companies:*', 'users:*', 'assessments:*'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  },
  'risk.analyst@acme.com': {
    password: 'Analyst123!',
    user: {
      id: '3',
      email: 'risk.analyst@acme.com',
      name: 'Risk Analyst',
      roles: ['risk_analyst'],
      permissions: ['assessments:read', 'assessments:write', 'companies:read'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  },
  'underwriter@acme.com': {
    password: 'Underwriter123!',
    user: {
      id: '4',
      email: 'underwriter@acme.com',
      name: 'Underwriter',
      roles: ['underwriter'],
      permissions: ['assessments:read', 'assessments:approve', 'companies:read'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  },
  'compliance@acme.com': {
    password: 'Compliance123!',
    user: {
      id: '5',
      email: 'compliance@acme.com',
      name: 'Compliance Officer',
      roles: ['compliance_officer'],
      permissions: ['assessments:read', 'reports:read', 'companies:read'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  },
  'viewer@acme.com': {
    password: 'Viewer123!',
    user: {
      id: '6',
      email: 'viewer@acme.com',
      name: 'Read Only User',
      roles: ['viewer'],
      permissions: ['assessments:read', 'companies:read'],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    }
  }
};

/**
 * Generate a mock JWT token
 */
const generateMockToken = (userId: string): string => {
  // Create a mock JWT-like token (not cryptographically secure, just for demo)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    sub: userId, 
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
  }));
  const signature = btoa('mock-signature');
  return `${header}.${payload}.${signature}`;
};

/**
 * Mock login function
 */
export const mockLogin = async (email: string, password: string): Promise<AuthResponse> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Normalize email to lowercase
  const normalizedEmail = email.toLowerCase().trim();
  
  // Check if user exists
  const demoUser = DEMO_USERS[normalizedEmail as keyof typeof DEMO_USERS];
  
  if (!demoUser) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password
  if (demoUser.password !== password) {
    throw new Error('Invalid email or password');
  }
  
  // Generate mock tokens
  const accessToken = generateMockToken(demoUser.user.id);
  const refreshToken = generateMockToken(demoUser.user.id);
  
  // Return successful auth response
  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: demoUser.user as User,
    token_type: 'Bearer',
    expires_in: 86400 // 24 hours
  };
};

/**
 * Check if we should use mock authentication
 */
export const shouldUseMockAuth = (): boolean => {
  // Use mock auth if:
  // 1. We're in development mode
  // 2. Backend is not available
  // 3. A special flag is set
  
  // Check if backend is responding
  const checkBackend = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/v1/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  };
  
  // For now, we'll check localStorage for a flag or default to checking backend
  const forceMockAuth = localStorage.getItem('forceMockAuth') === 'true';
  
  return forceMockAuth || import.meta.env.DEV;
};

/**
 * Validate if a token is still valid
 */
export const isTokenValid = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return payload.exp > now;
  } catch {
    return false;
  }
};

/**
 * Get user from token
 */
export const getUserFromToken = (token: string): User | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    const userId = payload.sub;
    
    // Find user by ID
    for (const email in DEMO_USERS) {
      const demoUser = DEMO_USERS[email as keyof typeof DEMO_USERS];
      if (demoUser.user.id === userId) {
        return demoUser.user as User;
      }
    }
    
    return null;
  } catch {
    return null;
  }
};