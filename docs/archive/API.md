# ToluAI API Documentation

## Overview

The ToluAI API provides comprehensive endpoints for managing insurance clients, risk assessments, and user authentication. The API follows RESTful principles and uses JSON for data exchange.

## Base URL

```
http://localhost:5000/api/v1
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "admin@toluai.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "admin@toluai.com",
    "first_name": "Admin",
    "last_name": "User",
    "roles": ["admin"]
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "access_token": "new_jwt_token_here"
}
```

#### Logout
```http
POST /auth/logout
```

**Headers:**
```
Authorization: Bearer <access_token>
```

## Client Management

### List Clients
```http
GET /clients?page=1&per_page=10&search=company&industry=technology
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `per_page` (optional): Items per page (default: 10)
- `search` (optional): Search term for client names
- `industry` (optional): Filter by industry

**Response:**
```json
{
  "clients": [
    {
      "id": 1,
      "name": "Tech Corp",
      "email": "contact@techcorp.com",
      "industry": "technology",
      "status": "active",
      "risk_category": "medium",
      "annual_revenue": 5000000,
      "employee_count": 150,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pages": 5,
    "per_page": 10,
    "total": 45
  }
}
```

### Create Client
```http
POST /clients
```

**Request Body:**
```json
{
  "name": "New Company Inc",
  "email": "contact@newcompany.com",
  "phone": "+1-555-123-4567",
  "industry": "technology",
  "annual_revenue": 2500000,
  "employee_count": 75,
  "address": "123 Business St",
  "city": "New York",
  "state": "NY",
  "zip_code": "10001",
  "country": "United States"
}
```

**Response:**
```json
{
  "message": "Client created successfully",
  "client": {
    "id": 15,
    "name": "New Company Inc",
    "email": "contact@newcompany.com",
    "status": "prospect",
    "created_at": "2024-01-15T14:30:00Z"
  }
}
```

### Get Client
```http
GET /clients/{id}
```

**Response:**
```json
{
  "id": 1,
  "name": "Tech Corp",
  "email": "contact@techcorp.com",
  "phone": "+1-555-123-4567",
  "website": "https://techcorp.com",
  "industry": "technology",
  "status": "active",
  "risk_category": "medium",
  "annual_revenue": 5000000,
  "employee_count": 150,
  "address": "123 Tech Blvd",
  "city": "San Francisco",
  "state": "CA",
  "zip_code": "94105",
  "country": "United States",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T16:45:00Z",
  "assessments": [
    {
      "id": 5,
      "risk_score": 65.5,
      "risk_category": "medium",
      "status": "completed",
      "created_at": "2024-01-20T16:45:00Z"
    }
  ]
}
```

### Update Client
```http
PUT /clients/{id}
```

**Request Body:** (same as create, all fields optional)

### Delete Client
```http
DELETE /clients/{id}
```

## Risk Assessment Management

### List Assessments
```http
GET /assessments?page=1&per_page=10&status=completed&client_id=5
```

**Query Parameters:**
- `page` (optional): Page number
- `per_page` (optional): Items per page
- `status` (optional): Filter by status (pending, in_progress, completed, failed)
- `client_id` (optional): Filter by client ID

### Create Assessment
```http
POST /assessments
```

**Request Body:**
```json
{
  "client_id": 1,
  "assessment_type": "comprehensive",
  "description": "Annual risk assessment for Tech Corp",
  "parameters": {
    "include_financial_analysis": true,
    "include_operational_risk": true,
    "historical_data_years": 3
  }
}
```

### Create Quick Assessment
```http
POST /assessments/quick/{client_id}
```

**Request Body:**
```json
{
  "description": "Quick risk assessment"
}
```

### Get Assessment
```http
GET /assessments/{id}
```

**Response:**
```json
{
  "id": 5,
  "client_id": 1,
  "client_name": "Tech Corp",
  "assessment_type": "comprehensive",
  "status": "completed",
  "risk_score": 65.5,
  "risk_category": "medium",
  "confidence_score": 85.2,
  "description": "Annual risk assessment",
  "created_at": "2024-01-20T10:00:00Z",
  "completed_at": "2024-01-20T16:45:00Z",
  "risk_factors": [
    {
      "id": 12,
      "factor_type": "financial",
      "name": "Revenue Volatility",
      "value": 15.3,
      "weight": 0.25,
      "impact": "medium",
      "description": "Revenue shows moderate volatility patterns"
    }
  ],
  "recommendations": [
    {
      "id": 8,
      "title": "Diversify Revenue Streams",
      "description": "Reduce dependency on single revenue sources",
      "priority": "high",
      "category": "financial",
      "estimated_impact": 15.2,
      "implementation_effort": "medium"
    }
  ]
}
```

### Update Assessment
```http
PUT /assessments/{id}
```

### Delete Assessment
```http
DELETE /assessments/{id}
```

## User Management (Admin Only)

### List Users
```http
GET /users
```

### Create User
```http
POST /users
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "password": "secure_password",
  "roles": ["underwriter"]
}
```

### Get User Profile
```http
GET /profile
```

### Update Profile
```http
PUT /profile
```

## Health Check

### System Health
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T16:45:00Z",
  "version": "1.0.0",
  "database": "connected",
  "redis": "connected"
}
```

## Error Responses

All API errors follow this format:

```json
{
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context if applicable"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limited
- `500` - Internal Server Error

## Rate Limiting

- General API: 100 requests per minute per IP
- Authentication endpoints: 5 requests per minute per IP
- Burst allowance: 50 additional requests

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Request limit per window
- `X-RateLimit-Remaining`: Requests remaining in window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Webhooks (Future)

The API will support webhooks for real-time notifications:

- Assessment completion
- Risk score changes
- Client status updates

## SDKs and Client Libraries

Official client libraries are planned for:
- Python
- JavaScript/Node.js
- C#/.NET