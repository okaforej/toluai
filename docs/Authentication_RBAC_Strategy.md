# Authentication & Authorization System Guide

## Overview

The ToluAI platform uses a unified Role-Based Access Control (RBAC) system with JWT authentication. This guide explains the implementation, setup, and testing procedures.

## Architecture


## System Roles

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **system_admin** | Full system access | All permissions (*) | System admin should have option to impersonate tenant_admin
| **tenant_admin** | Company-level administrator | Manage users, settings within company| for loggedin Tenant |
| **risk_analyst** | Risk assessment specialist | Create/edit assessments, view reports|for loggedin Tenant |
| **underwriter** | Insurance underwriter | Review and approve assessments | for loggedin Tenant
| **compliance_officer** | Compliance monitoring | View audit logs, compliance reports | for loggedin Tenant
| **read_only** | View-only access | Read-only access to company data | for loggedin Tenant



Overview

Design a multi-tenant Flask backend with React front-end using JWT-based authentication and role-based access control (RBAC). Users authenticate via a login endpoint, receive a signed JWT containing their user ID, roles, company_id (tenant), and an array of permissions. Each request carries the token for backend middleware to validate. The backend enforces access by checking the token’s signature, expiration, roles/permissions, and tenant ID. The front-end reads the user’s roles/permissions from the token (or a secure store) to conditionally render UI elements, but never trusts the client alone for security ￼. All sensitive checks happen server-side. Libraries like Flask-JWT-Extended (for JWT handling) and Flask-Limiter (for rate limiting) can streamline implementation, though the team should evaluate trade-offs for its own codebase.

User Authentication Flow
	•	Login Endpoint: POST /login with email and password. On receipt, the server:
	1.	Lookup the user by email; verify the hashed password (using a strong hashing library like Passlib with bcrypt or Argon2).
	2.	Enforce security policies: check password strength/expiration and whether the account is locked (e.g. via a failed_login_attempts counter in the user row). Implement rate limiting on the login endpoint (e.g. 5 requests/minute) using Flask-Limiter to block brute-force attempts ￼. After too many failures, lock the account.
	3.	(Optional) MFA step: if the user has Multi-Factor Auth enabled (TOTP or SMS), issue an MFA challenge (via PyOTP or an external service) and verify it before finalizing login.
	4.	On success, aggregate the user’s roles and permissions: query the user_roles join table (for multi-role support) and the role_permissions table to collect all permission strings for the user’s roles.
	5.	Generate tokens: Create a short-lived access token (JWT) embedding:

{
  "sub": "<user_id>",
  "roles": ["role1","role2"],      
  "company_id": "<company_id or null for system_admin>",
  "permissions": ["perm1","perm2",...],
  "iat": <issued_at>, 
  "exp": <expiry>
}

This token is signed (e.g. with RS256 and a strong private key ￼). Also issue a refresh token (a long-lived JWT or opaque token) for session continuation. Store or send the refresh token securely (e.g. as an HttpOnly secure cookie ￼).

	6.	Log the event: Record successful (or failed) logins in an audit_logs table with user ID, IP address, timestamp, and outcome. For example:

INSERT INTO audit_logs(user_id, log_type, details, ip_address) 
VALUES (<user_id>, 'access', '{"action":"login"}', '<request_ip>');


All communication must use HTTPS ￼. The JWT secret/keys are kept safely in environment variables or a secrets manager.

JWT Strategy and Token Lifecycle
	•	Token Contents: The access JWT includes minimal necessary claims – user ID, roles, tenant ID, and permissions. Avoid sensitive PII in tokens since JWTs are easily decoded by clients ￼.
	•	Expiry: Use short expiration (e.g. 15–30 minutes) on access tokens ￼ to limit exposure if stolen. Maintain an expiration (exp) claim and validate it on each request.
	•	Refresh Tokens: Issue a separate refresh token (longer-lived) to the client. The frontend can use it to obtain new access tokens when needed. On refresh, the server re-checks the user’s current roles/permissions (in case they changed). Flask-JWT-Extended supports this pattern out of the box ￼. For example:

access_token  = create_access_token(identity=user_id, fresh=True)
refresh_token = create_refresh_token(identity=user_id)


	•	Storage: Store the refresh token in a secure HttpOnly cookie or client-side store. Always mark session cookies with HttpOnly and Secure flags ￼ (and SameSite=Lax/Strict) to mitigate XSS/CSRF risks.
	•	Revocation: Because JWTs are stateless, implement a revocation mechanism: include a unique JWT ID (jti) claim and keep a token blacklist (e.g. in Redis or a DB). On logout or password change, add the token’s jti to the blacklist and reject any matching tokens ￼. Similarly, if invalidating an access token, revoke corresponding refresh tokens as well ￼. Store active refresh tokens in a table (with revoked flag) for extra control.

Authorization & Role-Based Access Control
	•	Database Schema: Define tables for roles, permissions, and join tables: role_permissions(role_id, permission_id). For multi-role users, use a user_roles(user_id, role_id) join table ￼. The given schema shows a single users.role_id, but you can extend it so a user may have multiple roles.
	•	Loading Claims: At login, fetch all of a user’s roles (and optionally, company-specific roles) and aggregate permissions. Include all roles and permissions in the JWT payload.
	•	Per-Request Checks: In Flask middleware (or route decorators):
	1.	Decode and verify the JWT signature and expiry.
	2.	Attach user info to the request context (e.g., g.current_user = { id, roles, company_id, permissions }).
	3.	Tenant Isolation: If the user is not a super-admin, verify the request’s target resource belongs to g.current_user.company_id. For example, if the endpoint has a company_id URL param, reject if it differs.
	4.	Permission Enforcement: Check that the user’s permissions (from the token) include all required permissions for this endpoint. For example, use a decorator like:

from functools import wraps
from flask import request, jsonify, g

def require_permissions(*required_perms):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            user = g.current_user
            if user.role == "system_admin":
                return func(*args, **kwargs)
            if not set(required_perms).issubset(set(user.permissions)):
                return jsonify({"error": "Forbidden: insufficient permissions"}), 403
            res_co = kwargs.get("company_id") or request.view_args.get("company_id")
            if res_co and res_co != user.company_id:
                return jsonify({"error": "Forbidden: company mismatch"}), 403
            return func(*args, **kwargs)
        return wrapper
    return decorator

This enforces that only users with the given permissions (and matching tenant) can access the view.

	5.	Deny by default: Any missing permission or token validity issues result in a 403 Forbidden. Always verify permissions on the server side – the client’s UI checks are only for convenience ￼.

	•	Policy Management UI: Build an admin React interface (accessible only to super-admins) to create/edit roles and permissions. Backend APIs should allow CRUD on roles/permissions and assigning roles to users. Protect those APIs with the same RBAC checks. Store each user’s assigned roles in the database so that changing a role’s permissions immediately affects all users (no code redeploy needed) ￼.

Front-End (React) Handling
	•	Token Storage: After login, store the access token (e.g. in memory or an Authorization header) and the refresh token (ideally in an HttpOnly cookie ￼). Configure axios/fetch to send the access token with each API call.
	•	Conditional Rendering: Use the token’s roles or permissions claims in React state/context to show/hide components or routes. For instance, only render the “Admin Panel” link if roles includes company_admin. Some libraries offer route guards (e.g. requiring certain roles). Example:

function AdminButton({ userRoles }) {
  if (!userRoles.includes("company_admin")) return null;
  return <button>Admin Settings</button>;
}

However, do not rely on UI checks for security – always re-validate on the backend ￼.

	•	Logouts and Token Refresh: The front end should call a /refresh endpoint when the access token is expired (catch 401 responses and retry with a new token). On logout, call a /logout API that blacklists the tokens server-side and clears front-end state.

Multi-Tenancy Considerations
	•	Company Isolation: Each user (except global admins) is tied to a single company_id. All data entities (e.g. insured_entities, risk_assessments) should include a company_id FK. The backend must always filter queries by company_id = user.company_id. This prevents cross-tenant data leaks.
	•	System Admin: A special “system_admin” role (perhaps with company_id = NULL) can bypass tenant checks. In code, detect this role first and allow full access.
	•	Schema Design: The provided schema includes company_id on the users and other tables. Ensure your Flask models and APIs use this to scope queries. The JWT should carry company_id as a claim (as shown) so middleware can enforce tenant-based routing ￼.

Password Policy & MFA
	•	Strong Passwords: Enforce minimum length/complexity at registration and on password change. Store only hashes (e.g. using passlib’s bcrypt/argon2).
	•	Account Lockout: Track failed logins (e.g. a failed_login_attempts column). After N failures, lock the account until admin reset or timeout.
	•	Multi-Factor Authentication (MFA): Integrate TOTP (e.g. with PyOTP) or SMS. After password verification, if the user has mfa_enabled, require the second factor before issuing tokens. Flask-Security-Too can help implement 2FA.
	•	Rate Limiting: Protect against brute force by rate-limiting the login endpoint. For example, using Flask-Limiter:

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
limiter = Limiter(get_remote_address, app=app, default_limits=["200/day", "50/hour"])
@app.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    # authentication logic...

This ensures no more than ~5 attempts/minute per IP ￼, greatly reducing brute-force risk.

Session Management & Token Revocation
	•	Refresh Tokens: Store issued refresh tokens in a database table (refresh_tokens) with fields (token_id, user_id, token_hash, expires_at, revoked flag). On every /refresh request, verify the token’s presence and validity before issuing a new access token. Invalidate refresh tokens on logout or password reset (set revoked = TRUE). Flask-JWT-Extended can help manage refresh tokens ￼.
	•	Blacklist / Revocation: Whenever a user logs out or an admin revokes access, add the token’s jti to a blacklist (in Redis or SQL). On every protected request, check the jti against this list. This “deny list” approach is a common revocation strategy ￼. Alternatively, use short-lived access tokens so revocation delays are short.
	•	Session Fixation Prevention: Always issue a new JWT on login and avoid reusing old tokens. Use JWT_REFRESH_TOKEN_EXPIRES and rotate keys periodically.

Admin UI & Management
	•	Build a Roles/Permissions Admin Panel in React (visible only to system admins). It should allow:
	•	Creating, editing, deleting roles and permissions.
	•	Assigning permissions to roles (backed by the role_permissions table).
	•	Assigning/removing roles to/from users (user_roles or users.role_id).
	•	Viewing audit logs (with filters by user, date, type).
These operations call protected Flask APIs (/roles, /permissions, /user_roles, etc.) that themselves require appropriate permissions (e.g. only “super_admin” can CRUD roles). The design is entirely data-driven – adding a new role or permission updates the system’s behavior without code changes ￼.

Audit Logging & Monitoring
	•	Log all security-relevant events: logins, logouts, permission/role changes, CRUD on sensitive data, etc. Use a structured format (JSON or separate fields) including user_id, action, timestamp, IP, and resource. Write to the audit_logs table.
	•	Use a logging framework (like Python’s structlog or the standard logging) and consider shipping logs to a centralized system (ELK Stack, Graylog, Datadog). This enables monitoring and forensic analysis.

Future-Proofing (SSO/Federation & Encryption)
	•	Federated Login (SSO/OAuth2): Plan to support enterprise SSO (e.g. Google, Azure AD, Okta) via OpenID Connect/OAuth2. Libraries like Authlib or Flask-Dance can handle the OAuth flow. For example, Authlib can register a Google provider and automatically parse the returned id_token to get user info ￼. Map the federated identity to an internal user (creating one if needed). This allows seamless single sign-on and external MFA.
	•	Data Encryption: For sensitive fields (PII like addresses or SSNs), use field-level encryption (e.g. SQLAlchemy-Utils EncryptedType with a strong key) or full-disk/cloud managed encryption. This ensures data is encrypted at rest.
	•	Compliance: Enforce data privacy (GDPR/CCPA) by allowing user data export/deletion. Only store minimal personal data in the token. Regularly audit permission assignments and access logs for compliance.

Security Best Practices
	•	HTTPS Everywhere: Serve all endpoints over TLS ￼. Use SESSION_COOKIE_SECURE=True in Flask config if storing JWT in cookies.
	•	Secure Cookies: If storing refresh tokens in cookies, use HttpOnly and Secure flags to prevent theft via XSS ￼. Also set SameSite=Lax or Strict.
	•	Strong JWT Signing: Use a strong key and algorithm (e.g. RS256 or ES256) for JWTs ￼. Rotate keys periodically. Explicitly verify the token’s algorithm to avoid “alg=none” attacks.
	•	CORS & CSRF: For API-only backends serving React, enable CORS carefully (allow only your front-end domain). If using cookies, include CSRF tokens on state-changing endpoints. The recommended pattern is to use stateless JWTs (Bearer tokens) to eliminate CSRF concerns.
	•	Keep Dependencies Updated: Regularly update Flask, its extensions, and all libraries to get the latest security fixes.
	•	Harden Headers: Use Flask-Talisman or a reverse proxy to set security headers (HSTS, X-Frame-Options, Content-Security-Policy, etc.).
	•	Least Privilege: Assign users only the permissions they need. Regularly review role definitions and remove unused roles. According to industry studies, routine role audits reduce permission-related incidents by ~30% ￼.

Recommended Libraries/Tools
	•	Authentication & JWT: Flask-JWT-Extended (handles tokens, refresh, decorators) or PyJWT for custom flows.
	•	Rate Limiting: Flask-Limiter for throttling endpoints (e.g. login) ￼.
	•	Password Hashing: passlib (with bcrypt/argon2 schemes).
	•	MFA: PyOTP for TOTP; or Flask-Security-Too which includes 2FA.
	•	OAuth/SSO: Authlib or Flask-Dance for OAuth2/OpenID Connect.
	•	RBAC/ACL: The custom schema above is sufficient, but for complex policies consider a library like Casbin or OPA if you outgrow RBAC.
	•	Audit Logging: Python’s structlog for structured logs. For storage/analysis use ELK (Elasticsearch/Logstash/Kibana) or a managed logging service.
	•	Encryption: SQLAlchemy-Utils EncryptedType for field encryption.

This holistic design ensures secure, flexible authentication and RBAC. All constraints – multi-tenancy, role management, token security, and auditability – are addressed. The suggested libraries can speed development, but evaluate whether a custom approach or other framework (like Django with Django-Rest-Framework) better fits the team’s expertise and future needs.

Sources: Best practices and examples from Flask/JWT docs and security guides ￼ ￼ ￼ ￼ ￼ ￼ ￼.