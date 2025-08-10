"""Test API endpoints"""

import pytest
import json
from app.models import Client, RiskAssessment


class TestClientAPI:
    """Test Client API endpoints"""
    
    def test_get_clients(self, client, auth_headers, test_client):
        """Test GET /api/v1/clients"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.get('/api/v1/clients', headers=auth_headers)
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'clients' in data
        assert len(data['clients']) >= 1
    
    def test_get_client_detail(self, client, auth_headers, test_client):
        """Test GET /api/v1/clients/<id>"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.get(f'/api/v1/clients/{test_client.id}', headers=auth_headers)
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['id'] == test_client.id
        assert data['name'] == test_client.name
        assert data['email'] == test_client.email
    
    def test_create_client(self, client, auth_headers):
        """Test POST /api/v1/clients"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        client_data = {
            'name': 'API Test Company',
            'email': 'apitest@company.com',
            'industry': 'Technology',
            'annual_revenue': 750000,
            'employee_count': 30
        }
        
        response = client.post('/api/v1/clients', 
                              json=client_data, 
                              headers=auth_headers)
        assert response.status_code == 201
        
        data = response.get_json()
        assert data['name'] == client_data['name']
        assert data['email'] == client_data['email']
    
    def test_update_client(self, client, auth_headers, test_client):
        """Test PUT /api/v1/clients/<id>"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        update_data = {
            'name': 'Updated Company Name',
            'annual_revenue': 1200000
        }
        
        response = client.put(f'/api/v1/clients/{test_client.id}',
                             json=update_data,
                             headers=auth_headers)
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['name'] == update_data['name']
        assert data['annual_revenue'] == update_data['annual_revenue']
    
    def test_delete_client(self, client, auth_headers, test_client):
        """Test DELETE /api/v1/clients/<id>"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.delete(f'/api/v1/clients/{test_client.id}',
                                headers=auth_headers)
        assert response.status_code == 204
        
        # Verify client is deleted
        response = client.get(f'/api/v1/clients/{test_client.id}',
                             headers=auth_headers)
        assert response.status_code == 404
    
    def test_client_validation(self, client, auth_headers):
        """Test client creation validation"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        # Missing required fields
        invalid_data = {
            'name': 'Incomplete Company'
            # Missing email
        }
        
        response = client.post('/api/v1/clients',
                              json=invalid_data,
                              headers=auth_headers)
        assert response.status_code == 400
        
        data = response.get_json()
        assert 'errors' in data or 'message' in data


class TestAssessmentAPI:
    """Test Risk Assessment API endpoints"""
    
    def test_get_assessments(self, client, auth_headers, test_assessment):
        """Test GET /api/v1/assessments"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.get('/api/v1/assessments', headers=auth_headers)
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'assessments' in data
        assert len(data['assessments']) >= 1
    
    def test_get_assessment_detail(self, client, auth_headers, test_assessment):
        """Test GET /api/v1/assessments/<id>"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.get(f'/api/v1/assessments/{test_assessment.id}',
                             headers=auth_headers)
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['id'] == test_assessment.id
        assert data['risk_score'] == test_assessment.risk_score
        assert data['risk_category'] == test_assessment.risk_category
    
    def test_create_assessment(self, client, auth_headers, test_client):
        """Test POST /api/v1/assessments"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        assessment_data = {
            'client_id': test_client.id,
            'assessment_type': 'standard',
            'notes': 'API test assessment'
        }
        
        response = client.post('/api/v1/assessments',
                              json=assessment_data,
                              headers=auth_headers)
        assert response.status_code == 201
        
        data = response.get_json()
        assert data['client_id'] == test_client.id
        assert 'risk_score' in data
        assert 'risk_category' in data


class TestRateLimiting:
    """Test API rate limiting"""
    
    def test_rate_limit_enforcement(self, client, auth_headers):
        """Test rate limiting kicks in after many requests"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        # Make many requests quickly
        responses = []
        for i in range(60):  # Should exceed rate limit
            response = client.get('/api/v1/clients', headers=auth_headers)
            responses.append(response.status_code)
            
            if response.status_code == 429:  # Rate limited
                break
        
        # Should eventually get rate limited
        assert 429 in responses


class TestAPIErrorHandling:
    """Test API error handling"""
    
    def test_not_found_error(self, client, auth_headers):
        """Test 404 error handling"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        response = client.get('/api/v1/clients/99999', headers=auth_headers)
        assert response.status_code == 404
        
        data = response.get_json()
        assert 'error' in data
    
    def test_validation_error(self, client, auth_headers):
        """Test validation error handling"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        # Invalid data
        response = client.post('/api/v1/clients',
                              json={'invalid': 'data'},
                              headers=auth_headers)
        assert response.status_code == 400
        
        data = response.get_json()
        assert 'error' in data or 'errors' in data
    
    def test_unauthorized_error(self, client):
        """Test unauthorized access handling"""
        response = client.get('/api/v1/clients')
        assert response.status_code == 401
        
        data = response.get_json()
        assert 'error' in data
    
    def test_forbidden_error(self, client, auth_headers):
        """Test forbidden access handling"""
        if not auth_headers:
            pytest.skip("No auth headers available")
        
        # Try to access admin endpoint with regular user
        response = client.get('/api/v1/admin/users', headers=auth_headers)
        assert response.status_code == 403
        
        data = response.get_json()
        assert 'error' in data


class TestAPIDocumentation:
    """Test API documentation endpoints"""
    
    def test_api_spec_endpoint(self, client):
        """Test API specification endpoint"""
        response = client.get('/api/v1/spec')
        assert response.status_code == 200
        
        # Should return OpenAPI spec
        data = response.get_json()
        assert 'openapi' in data or 'swagger' in data
    
    def test_api_docs_endpoint(self, client):
        """Test API documentation page"""
        response = client.get('/api/v1/docs')
        assert response.status_code == 200
        
        # Should return HTML documentation
        assert b'html' in response.data.lower() or response.content_type.startswith('text/html')