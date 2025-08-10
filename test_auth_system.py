#!/usr/bin/env python3
"""
Test Authentication System
Verify that all roles and permissions work correctly
"""

import requests
import json
import sys
from typing import Dict, Optional

# API base URL
BASE_URL = "http://localhost:5000/api/v1"

# Test credentials
TEST_USERS = {
    "system_admin": {
        "email": "admin@toluai.com",
        "password": "Admin123!",
        "expected_roles": ["system_admin"],
        "test_endpoints": [
            ("GET", "/users", 200),
            ("GET", "/companies", 200),
            ("GET", "/roles", 200),
        ]
    },
    "company_admin": {
        "email": "company.admin@acme.com",
        "password": "CompanyAdmin123!",
        "expected_roles": ["company_admin"],
        "test_endpoints": [
            ("GET", "/users", 200),
            ("GET", "/companies", 403),  # Can only see own company
            ("GET", "/roles", 200),
        ]
    },
    "risk_analyst": {
        "email": "risk.analyst@acme.com",
        "password": "Analyst123!",
        "expected_roles": ["risk_analyst"],
        "test_endpoints": [
            ("GET", "/assessments", 200),
            ("POST", "/assessments", 200),  # Can create assessments
            ("GET", "/users", 403),  # Cannot manage users
        ]
    },
    "underwriter": {
        "email": "underwriter@acme.com",
        "password": "Underwriter123!",
        "expected_roles": ["underwriter"],
        "test_endpoints": [
            ("GET", "/assessments", 200),
            ("POST", "/assessments/1/approve", 200),  # Can approve
            ("POST", "/assessments", 403),  # Cannot create
        ]
    },
    "compliance_officer": {
        "email": "compliance@acme.com",
        "password": "Compliance123!",
        "expected_roles": ["compliance_officer"],
        "test_endpoints": [
            ("GET", "/audit/logs", 200),
            ("GET", "/compliance/reports", 200),
            ("POST", "/users", 403),  # Cannot create users
        ]
    },
    "read_only": {
        "email": "viewer@acme.com",
        "password": "Viewer123!",
        "expected_roles": ["read_only"],
        "test_endpoints": [
            ("GET", "/assessments", 200),
            ("POST", "/assessments", 403),  # Cannot create
            ("PUT", "/clients/1", 403),  # Cannot edit
        ]
    }
}

class AuthTester:
    def __init__(self, base_url: str = BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.current_token: Optional[str] = None
        self.current_user: Optional[Dict] = None
    
    def login(self, email: str, password: str) -> bool:
        """Test login endpoint"""
        print(f"\n🔐 Testing login for: {email}")
        
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        
        if response.status_code == 200:
            data = response.json()
            self.current_token = data.get("access_token")
            self.current_user = data.get("user")
            
            # Set authorization header for future requests
            self.session.headers.update({
                "Authorization": f"Bearer {self.current_token}"
            })
            
            print(f"  ✓ Login successful")
            print(f"    User: {self.current_user.get('name')}")
            print(f"    Roles: {self.current_user.get('roles')}")
            print(f"    Company: {self.current_user.get('company', 'N/A')}")
            
            # Check permissions endpoint
            perm_response = self.session.get(f"{self.base_url}/auth/permissions")
            if perm_response.status_code == 200:
                perms = perm_response.json()
                print(f"    Permissions count: {len(perms.get('permissions', []))}")
            
            return True
        else:
            print(f"  ✗ Login failed: {response.status_code}")
            if response.content:
                print(f"    Error: {response.json().get('error', 'Unknown error')}")
            return False
    
    def test_endpoint(self, method: str, endpoint: str, expected_status: int) -> bool:
        """Test a specific endpoint"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            if method == "GET":
                response = self.session.get(url)
            elif method == "POST":
                response = self.session.post(url, json={})
            elif method == "PUT":
                response = self.session.put(url, json={})
            elif method == "DELETE":
                response = self.session.delete(url)
            else:
                print(f"  ⚠️  Unknown method: {method}")
                return False
            
            success = response.status_code == expected_status
            symbol = "✓" if success else "✗"
            
            print(f"  {symbol} {method:6} {endpoint:30} - Expected: {expected_status}, Got: {response.status_code}")
            
            if not success and response.content:
                try:
                    error = response.json().get('error', 'Unknown error')
                    print(f"           Error: {error}")
                except:
                    pass
            
            return success
        except Exception as e:
            print(f"  ✗ {method:6} {endpoint:30} - Error: {str(e)}")
            return False
    
    def test_user_role(self, role_name: str, user_config: Dict) -> Dict:
        """Test a specific user role"""
        print(f"\n{'='*60}")
        print(f"Testing Role: {role_name.upper()}")
        print(f"{'='*60}")
        
        results = {
            "role": role_name,
            "login": False,
            "endpoints": [],
            "passed": 0,
            "failed": 0
        }
        
        # Test login
        if self.login(user_config["email"], user_config["password"]):
            results["login"] = True
            
            # Verify roles
            user_roles = self.current_user.get("roles", [])
            expected_roles = user_config["expected_roles"]
            
            if set(expected_roles).issubset(set(user_roles)):
                print(f"  ✓ Role verification passed")
            else:
                print(f"  ✗ Role mismatch - Expected: {expected_roles}, Got: {user_roles}")
            
            # Test endpoints
            print(f"\n  Testing endpoint access:")
            for method, endpoint, expected_status in user_config.get("test_endpoints", []):
                success = self.test_endpoint(method, endpoint, expected_status)
                results["endpoints"].append({
                    "method": method,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "success": success
                })
                
                if success:
                    results["passed"] += 1
                else:
                    results["failed"] += 1
        
        return results

def main():
    """Run all authentication tests"""
    print("="*60)
    print("AUTHENTICATION SYSTEM TEST")
    print("="*60)
    
    tester = AuthTester()
    all_results = []
    
    # Test each role
    for role_name, user_config in TEST_USERS.items():
        results = tester.test_user_role(role_name, user_config)
        all_results.append(results)
    
    # Print summary
    print(f"\n{'='*60}")
    print("TEST SUMMARY")
    print(f"{'='*60}")
    
    total_passed = sum(r["passed"] for r in all_results)
    total_failed = sum(r["failed"] for r in all_results)
    total_tests = total_passed + total_failed
    
    print(f"\nRole Test Results:")
    for result in all_results:
        login_status = "✓" if result["login"] else "✗"
        print(f"  {result['role']:20} - Login: {login_status}, Tests: {result['passed']}/{result['passed'] + result['failed']} passed")
    
    print(f"\nOverall Results:")
    print(f"  Total Tests: {total_tests}")
    print(f"  Passed: {total_passed}")
    print(f"  Failed: {total_failed}")
    
    if total_tests > 0:
        success_rate = (total_passed / total_tests) * 100
        print(f"  Success Rate: {success_rate:.1f}%")
    
    if total_failed == 0:
        print(f"\n✓ All tests passed! Authentication system is working correctly.")
        return 0
    else:
        print(f"\n✗ Some tests failed. Please review the authentication configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())