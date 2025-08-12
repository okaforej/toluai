# API Usage Analysis Report

## Frontend API Calls (Currently Used)

### Authentication APIs ✅
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Token refresh  
- `POST /api/v1/auth/logout` - User logout

### IRPA Core APIs (v2) ✅
**Companies:**
- `GET /api/v2/irpa/companies` - List companies with pagination
- `POST /api/v2/irpa/companies` - Create company
- `GET /api/v2/irpa/companies/{id}` - Get company details
- `PUT /api/v2/irpa/companies/{id}` - Update company
- `DELETE /api/v2/irpa/companies/{id}` - Delete company

**Insured Entities:**
- `GET /api/v2/irpa/insured-entities` - List entities
- `POST /api/v2/irpa/insured-entities` - Create entity
- `GET /api/v2/irpa/insured-entities/{id}` - Get entity
- `PUT /api/v2/irpa/insured-entities/{id}` - Update entity
- `DELETE /api/v2/irpa/insured-entities/{id}` - Delete entity

**Risk Assessments:**
- `GET /api/v2/irpa/assessments` - List assessments
- `POST /api/v2/irpa/assessments` - Run new assessment
- `GET /api/v2/irpa/assessments/{id}` - Get assessment
- `PUT /api/v2/irpa/assessments/{id}` - Update assessment
- `DELETE /api/v2/irpa/assessments/{id}` - Delete assessment

**Reference Data:**
- `GET /api/v2/irpa/reference/industry-types` - Get industries
- `GET /api/v2/irpa/reference/states` - Get states
- `GET /api/v2/irpa/reference/education-levels` - Education levels
- `GET /api/v2/irpa/reference/job-titles` - Job titles
- `GET /api/v2/irpa/reference/practice-fields` - Practice fields

**Analytics:**
- `GET /api/v2/irpa/analytics/risk-distribution` - Risk charts
- `GET /api/v2/irpa/analytics/assessment-trends` - Trend analysis

### Legacy APIs (v1) ⚠️ Partially Used
- `GET /api/v1/clients` - Old client list (redundant with companies)
- `POST /api/v1/clients` - Old client creation
- `GET /api/v1/assessments` - Old assessment list
- `POST /api/v1/assessments` - Old assessment creation

## Backend APIs (Available but Unused) ❌

### Audit & Logging APIs (Not Used)
- `GET /api/v2/irpa/audit/activity` - Activity logs
- `GET /api/v2/irpa/audit/data-access` - Data access logs

### External Risk APIs (Not Used)
- `GET /api/v2/irpa/external-risk/cybersecurity-incidents`
- `GET /api/v2/irpa/external-risk/regulatory-compliance`

### Dashboard API (Not Used)
- `GET /api/v1/dashboard` - Dashboard data endpoint

### Admin APIs (Not Used)
- `GET /api/admin/*` - Admin panel routes
- Role management endpoints
- Permission management endpoints

### Web UI Routes (Not Used in React)
- `/web/*` - Server-side rendered pages
- `/assessment/*` - Old assessment UI
- `/client/*` - Old client UI

## Cleanup Recommendations

### 1. Remove Duplicate APIs
**Action:** Delete v1 endpoints that duplicate v2 functionality
- Remove `/api/v1/clients` (use `/api/v2/irpa/companies`)
- Remove `/api/v1/assessments` (use `/api/v2/irpa/assessments`)

### 2. Remove Unused Web Routes
**Action:** Delete server-side templates and routes
- Remove `/backend/web/` directory
- Remove template-based routes
- Keep only API endpoints

### 3. Consolidate API Versions
**Action:** Standardize on v2 API
- Move auth endpoints to v2: `/api/v2/auth/*`
- Deprecate v1 completely
- Update frontend to use only v2

### 4. Activate or Remove Unused Features
**Decision Required:**
- **Audit Logs:** Implement in UI or remove backend code
- **External Risk:** Implement in UI or remove backend code
- **Admin Panel:** Implement React admin UI or remove Flask admin

### 5. Code Organization
**Action:** Simplify backend structure
```
backend/
├── api/
│   └── v2/
│       ├── auth.py
│       ├── companies.py
│       ├── entities.py
│       ├── assessments.py
│       ├── reference.py
│       └── analytics.py
├── models/
├── services/
└── app.py
```

## Implementation Priority

1. **High Priority (Breaking Changes)**
   - Remove v1 API endpoints
   - Update frontend API calls to v2
   - Remove web/template routes

2. **Medium Priority (Clean Code)**
   - Consolidate API route files
   - Remove unused model methods
   - Clean up imports

3. **Low Priority (Future Features)**
   - Decide on audit log implementation
   - Decide on external risk features
   - Decide on admin panel approach

## Files to Delete

```bash
# Web UI routes (not used by React)
backend/web/
backend/templates/
backend/static/

# Duplicate v1 API files
backend/api/v1/clients.py
backend/api/v1/assessments.py

# Unused admin routes
backend/admin/routes.py (if not implementing Flask admin)
```

## Frontend Updates Required

1. Update `api.ts` to remove v1 client/assessment calls
2. Consolidate API base URLs to use only v2
3. Remove mock auth fallback (backend is stable now)
4. Clean up unused API service methods

## Estimated Impact

- **Code Reduction:** ~40% fewer API endpoints
- **Maintenance:** Simpler, single API version
- **Performance:** Faster startup, less memory usage
- **Testing:** Fewer endpoints to test
- **Documentation:** Clearer API surface