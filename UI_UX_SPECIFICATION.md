# 🎨 ToluAI UI/UX Complete Specification & Replication Guide

## Overview

ToluAI is a comprehensive **Insurance Risk Professional Assessment (IRPA)** platform featuring a modern React-based dashboard with sophisticated risk management capabilities. The interface follows a **professional enterprise design** with emphasis on data visualization, user accessibility, and role-based access control.

---

## 🏗️ Architecture & Technical Stack

### Frontend Framework
- **React 18** with TypeScript
- **React Router v6** for navigation
- **Tailwind CSS** for styling
- **Headless UI** for accessible components
- **Heroicons** for consistent iconography
- **Recharts** for data visualization
- **React Hot Toast** for notifications

### Design System
- **Color Palette**: Professional blue/indigo gradient with semantic colors
- **Typography**: Clean, readable fonts optimized for data-heavy interfaces
- **Spacing**: Consistent 8px grid system
- **Components**: Modular, reusable design system

---

## 🔐 Authentication Flow & User Experience

### 1. **Login Page** (`/login`)

**Visual Design:**
```
Layout: Full-screen gradient background (indigo-500 to purple-600)
Card: White translucent card (98% opacity) with rounded-3xl corners
Logo: Blue circular badge with "T" in center (16x16 size)
Header: "Welcome back" with subtitle
Form: Clean input fields with focus states
```

**Interactive Elements:**
- Email and password inputs with validation
- Show/hide password toggle
- Loading state with spinner during authentication
- Demo accounts dropdown for testing
- Toast notifications for success/error states

**User Flow:**
1. User lands on login page
2. If already authenticated → redirect to dashboard
3. Enter credentials or select demo account
4. Form validation (client-side)
5. API authentication call
6. Store JWT tokens in localStorage
7. Set user context and redirect to dashboard
8. Show welcome toast notification

**Demo Accounts Available:**
```javascript
- admin@toluai.com (System Admin) - Purple badge
- company.admin@acme.com (Company Admin) - Blue badge  
- risk.analyst@acme.com (Risk Analyst) - Green badge
- underwriter@acme.com (Underwriter) - Yellow badge
- compliance@acme.com (Compliance) - Cyan badge
- viewer@acme.com (Read Only) - Gray badge
```

---

## 🧭 Navigation & Layout System

### **App Layout Structure**

```
┌─────────────────────────────────────────────┐
│                 Header                       │ ← Fixed top (64px height)
├─────────┬───────────────────────────────────┤
│         │                                   │
│ Sidebar │           Main Content            │ ← Dynamic width based on sidebar
│         │                                   │
│ (240px  │         <Outlet />               │
│ or 64px)│                                  │
│         │                                   │
└─────────┴───────────────────────────────────┘
```

### **Sidebar Navigation** (`AppSidebar`)

**Behavior:**
- **Desktop**: Persistent sidebar, toggles between 240px (expanded) and 64px (collapsed)
- **Smooth transitions**: 300ms ease-sharp animation

**Navigation Structure:**
```
📊 Dashboard
👤 Insured (The data subject (person or company) whose insurance risk is assessed
N/A (does not interact directly with platform))
📋 Risk Assessments (hide this)
🛡️ External Risk Signals (hide this)
   ├── 🐛 Cybersecurity Incidents
   ├── ⚖️ Regulatory Compliance
   └── 📈 Market Indicators
🏢 Companies (Admin only)
👥 Users (Admin only)
📁 Reference Data
   ├── 🏷️ Industry Types
   ├── 📍 States
   ├── 🎓 Education Levels
   ├── 💼 Job Titles
   ├── 📊 Practice Fields
   ├── 👨‍👩‍👧‍👦 Roles
   └── 🛡️ Permissions
🔍 Audit Logs  (hide this)
   ├── 👤 User Activity
   ├── 📊 Data Access
   └── 📡 API Usage
⚙️ Settings
🔐 Administration
   ├── 👥 Roles Management
   └── 📋 Rules Management
```

**Visual States:**
- **Active**: Bold text with colored icon (solid variant)
- **Inactive**: Normal text with outline icon
- **Hover**: Background highlight with smooth transition
- **Expandable sections**: Chevron icon rotates, smooth expand/collapse

---

## 📊 Dashboard Page (`IRPADashboardPage`)

### **Layout Grid System**
```
┌─────────────┬─────────────┬─────────────┐
│    Stats    │    Stats    │    Stats    │ ← 3-column stats cards
├─────────────┴─────────────┴─────────────┤
│            Risk Distribution             │ ← Pie chart
├─────────────────────┬───────────────────┤
│ Assessment Trends   │ Recent Activity   │ ← 2-column bottom
└─────────────────────┴───────────────────┘
```

### **Key Metrics Cards**
**Design Pattern:**
- White cards with subtle shadow
- Large number (2xl font) with trend indicators
- Icon with semantic color coding
- Subtle background gradients

**Metrics Displayed:**
1. **Total Insured Entities** - User icon, blue theme
2. **Total Assessments** - Chart icon, green theme  
3. **High Risk Entities** - Warning icon, red theme

### **Data Visualizations**

**1. Risk Distribution (Pie Chart)**
```javascript
Colors: {
  low: '#10b981',     // Green
  medium: '#f59e0b',  // Yellow  
  high: '#ef4444',    // Red
  critical: '#7c2d12' // Dark red
}
```

**2. Assessment Trends (Line Chart)**
- 30-day trend line
- Gradient fill under curve
- Interactive tooltips with dates
- Responsive container

**3. Recent Assessments Table**
- Last 5 completed assessments
- Status badges with semantic colors
- Clickable rows for drill-down
- Date formatting with relative time

### **Loading & Error States**
- **Loading**: Skeleton components while data loads
- **Error**: Graceful fallback to mock data with toast notification
- **Empty State**: Friendly message with action buttons

---

## 🏢 Data Management Pages

### **Companies Page** (`CompaniesPage`)

**Permission Gate**: Requires `system_admin` or `admin` role

**Layout Components:**
```
┌─────────────────────────────────────────────┐
│  Search Bar | Filter | Add Company Button   │ ← Action bar
├─────────────────────────────────────────────┤
│                                             │
│           Companies Data Table              │ ← Main content
│   (Name, Industry, Size, Status, Risk)     │
│                                             │
└─────────────────────────────────────────────┘
```

**Interactive Features:**
- **Real-time search**: Filter by company name
- **Status filters**: All, Active, Inactive, Pending
- **Sortable columns**: Name, industry, risk level
- **Row actions**: View, Edit, Delete (with confirmation)
- **Bulk operations**: Multi-select with bulk actions
- **Add Company Modal**: Multi-step form with validation

**Data Display:**
- **Status badges**: Colored pills (green/active, red/inactive, yellow/pending)
- **Risk indicators**: Color-coded risk levels
- **Industry categorization**: Grouped display options
- **Responsive table**: Collapses to cards on mobile

### **Reference Data Page** (`ReferenceDataPage`)

**Tabbed Interface Design:**
```
┌─────────────────────────────────────────────┐
│ 🏷️Industry │ 📍States │ 🎓Education │ ... │ ← Tab navigation
├─────────────────────────────────────────────┤
│  Search | Bulk Actions | Add New            │ ← Action toolbar
├─────────────────────────────────────────────┤
│                                             │
│              Data Table                     │ ← Tab content
│   □ Name          Risk Factor  Actions      │
│   □ Technology    0.5          [Edit][Del]  │
│                                             │
└─────────────────────────────────────────────┘
```

**Section Types:**
1. **Industry Types**: Name, Risk Category, Base Risk Factor
2. **States**: Code, Name, Risk Factor  
3. **Education Levels**: Level Name, Risk Factor
4. **Job Titles**: Title, Risk Category, Risk Factor
5. **Practice Fields**: Field Name, Risk Factor
6. **Roles**: Name, Description
7. **Permissions**: Name, Description

**CRUD Operations:**
- **Create**: Modal form with field validation
- **Read**: Searchable, sortable table view
- **Update**: Inline editing or modal form
- **Delete**: Single or bulk delete with confirmation
- **Bulk Operations**: Select all, bulk delete, bulk edit

---

## 👤 User Management Pages

### **Users Page** (`UsersPage`)
- **Role-based filtering**: View users by role
- **Company scoping**: Company admins see only their company's users
- **Status management**: Active/inactive user toggles
- **Role assignment**: Multi-select role assignment interface

### **Insured Entities Page** (`InsuredEntitiesPage`)
**Complex Data Form:**
- **Personal Information**: Name, DOB, Contact details
- **Professional Data**: Education, Experience, Job title, Practice field
- **Financial Information**: FICO score, DTI ratio, Payment history
- **Risk Scoring**: Automated calculation display
- **Data Completeness**: Progress indicator showing % complete

---

## 🛡️ Risk Assessment Interface

### **Risk Assessments Page** (`RiskAssessmentsPage`)

**Assessment Card Design:**
```
┌─────────────────────────────────────────────┐
│  Entity Name                    Risk Badge   │
│  Industry • Experience • Location            │
│                                             │
│  IRPA CCI Score: 78.5/100     [View Detail] │
│  ████████████████████░░░░░░ 78%             │
│                                             │
│  📊 Industry: 65  👤 Professional: 82      │
│  💰 Financial: 72  🛡️ External: 45         │
└─────────────────────────────────────────────┘
```

**Risk Scoring Components:**
- **Overall IRPA CCI Score**: 0-100 scale with progress bar
- **Component Scores**: Industry (35%), Professional (40%), Financial (25%)
- **Sub-component Breakdown**: Detailed factor analysis
- **Risk Category**: Low/Medium/High/Critical with color coding
- **Assessment Date**: Timestamp with relative time display

### **External Risk Signals**

**Cybersecurity Incidents Page:**
- **Incident Timeline**: Chronological incident display
- **Severity Indicators**: 1-5 scale with color gradients
- **Resolution Tracking**: Days to resolution metrics
- **Impact Assessment**: Financial impact visualization

---

## 🎨 Design System Specifications

### **Color Palette**
```scss
// Primary Colors
$primary-50:  #eff6ff;
$primary-500: #3b82f6;
$primary-600: #2563eb;
$primary-700: #1d4ed8;

// Semantic Colors  
$success: #10b981;
$warning: #f59e0b;
$error:   #ef4444;
$info:    #06b6d4;

// Gray Scale
$gray-50:  #f9fafb;
$gray-100: #f3f4f6;
$gray-500: #6b7280;
$gray-900: #111827;

// Risk Level Colors
$risk-low:      #10b981; // Green
$risk-medium:   #f59e0b; // Yellow
$risk-high:     #ef4444; // Red  
$risk-critical: #7c2d12; // Dark Red
```

### **Typography Scale**
```scss
$text-xs:   0.75rem;  // 12px
$text-sm:   0.875rem; // 14px
$text-base: 1rem;     // 16px
$text-lg:   1.125rem; // 18px
$text-xl:   1.25rem;  // 20px
$text-2xl:  1.5rem;   // 24px
$text-3xl:  1.875rem; // 30px
```

### **Component Patterns**

**1. Cards**
```scss
.card {
  @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply text-lg font-semibold text-gray-900;
}
```

**2. Buttons**
```scss
.btn-primary {
  @apply bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg;
  @apply transition-colors duration-200 font-medium;
}

.btn-secondary {
  @apply bg-gray-100 hover:bg-gray-200 text-gray-900;
}

.btn-danger {
  @apply bg-red-600 hover:bg-red-700 text-white;
}
```

**3. Form Elements**
```scss
.form-input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md;
  @apply focus:ring-2 focus:ring-blue-500 focus:border-blue-500;
  @apply transition-colors duration-200;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-2;
}

.form-error {
  @apply text-sm text-red-600 mt-1;
}
```

**4. Status Badges**
```scss
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-success { @apply bg-green-100 text-green-800; }
.badge-warning { @apply bg-yellow-100 text-yellow-800; }
.badge-error   { @apply bg-red-100 text-red-800; }
.badge-info    { @apply bg-blue-100 text-blue-800; }
```

---

## 🔄 User Interaction Patterns

### **Navigation Flow**
1. **Login** → Dashboard (authenticated users)
2. **Dashboard** → Any module via sidebar
3. **Breadcrumbs** → Show current location
4. **Deep linking** → All pages support direct URLs
5. **Back/Forward** → Browser navigation supported

### **Data Interaction Patterns**

**1. Table Interactions**
- **Sorting**: Click column headers (visual indicators)
- **Filtering**: Real-time search with debouncing  
- **Selection**: Checkboxes for bulk operations
- **Row actions**: Hover reveals action buttons
- **Pagination**: Page numbers with prev/next

**2. Modal Workflows**
- **Create/Edit**: Modal forms with validation
- **Confirmation**: Destructive actions require confirmation
- **Multi-step**: Complex forms split into steps
- **Auto-save**: Draft saving for long forms

**3. Form Validation**
- **Real-time**: Validation on blur/change
- **Visual feedback**: Error states with colored borders
- **Error messages**: Specific, actionable feedback
- **Success states**: Green indicators for valid fields

### **Loading & Feedback States**

**1. Loading Indicators**
```scss
// Page-level loading
.loading-page {
  @apply flex justify-center items-center min-h-screen;
}

// Component-level loading  
.loading-spinner {
  @apply animate-spin rounded-full border-2 border-gray-300;
  border-top-color: theme('colors.blue.600');
}

// Skeleton loading
.skeleton {
  @apply bg-gray-200 rounded animate-pulse;
}
```

**2. Toast Notifications**
- **Success**: Green with checkmark icon
- **Error**: Red with X icon  
- **Warning**: Yellow with warning icon
- **Info**: Blue with info icon
- **Position**: Top-right corner
- **Duration**: 4 seconds default
- **Dismissible**: Click to close

---

## 📱 Responsive Design Specifications

### **Breakpoints**
```scss
$mobile:  0px;    // 0-768px
$tablet:  768px;  // 768-1024px  
$desktop: 1024px; // 1024px+
```

### **Mobile Adaptations**

**1. Navigation**
- Sidebar becomes full-screen overlay
- Hamburger menu in header
- Touch-friendly tap targets (min 44px)

**2. Tables → Cards**
```
Desktop Table:
┌─────────┬──────────┬──────────┬─────────┐
│ Name    │ Industry │ Risk     │ Actions │
│ Acme    │ Tech     │ Medium   │ [...]   │
└─────────┴──────────┴──────────┴─────────┘

Mobile Cards:  
┌─────────────────────────────────────────┐
│ Acme Corp                    [Actions]  │
│ Technology • Medium Risk               │
│ Last assessed: 2 days ago              │
└─────────────────────────────────────────┘
```

**3. Modal Forms**
- Full-screen on mobile
- Slide-up animation
- Touch-optimized inputs

---

## 🔐 Role-Based Access Control UI

### **Permission Gates**
```jsx
// Route-level protection
<ProtectedRoute permissions={['company.read']}>
  <CompaniesPage />
</ProtectedRoute>

// Component-level protection  
<PermissionGuard permission="user.create">
  <AddUserButton />
</PermissionGuard>

// Conditional rendering
{hasPermission('data.delete') && (
  <DeleteButton />
)}
```

### **Role-Based UI Elements**

**1. System Admin**
- Full access to all features
- Company management
- User role assignment
- System configuration

**2. Company Admin**  
- Company-scoped data access
- User management within company
- Assessment creation/editing
- Report generation

**3. Risk Analyst**
- Assessment creation/editing
- Risk analysis tools
- Report viewing
- Data analysis features

**4. Underwriter**
- Assessment viewing
- Risk scoring tools
- Decision support features
- Limited editing capabilities

**5. Compliance Officer**
- Audit trail access
- Compliance reporting
- Risk monitoring
- Read-only assessments

**6. Read-Only User**
- View-only access
- No editing capabilities
- Basic reporting
- Limited data access

---

## 🎯 Replication Prompt for AI

**Use this prompt to replicate the ToluAI interface:**

```
Create a professional insurance risk assessment dashboard with the following specifications:

LAYOUT:
- Fixed header (64px) with logo, user menu, and notifications
- Collapsible sidebar (240px/64px) with multi-level navigation
- Main content area with responsive grid layouts
- Clean white background with subtle shadows and borders

DESIGN SYSTEM:
- Color palette: Blue primary (#3b82f6), semantic colors for risk levels
- Typography: Clean, readable fonts with consistent scale
- Components: Cards, forms, tables, badges, buttons with Tailwind CSS
- Icons: Heroicons for consistent iconography

DASHBOARD FEATURES:
1. Key metrics cards (3-column grid)
2. Risk distribution pie chart (green/yellow/red/dark red)
3. Assessment trends line chart 
4. Recent activity table with status badges

DATA TABLES:
- Searchable and sortable columns
- Bulk selection with checkboxes
- Row hover actions (view/edit/delete)
- Mobile-responsive card layout
- Pagination controls

FORMS & MODALS:
- Multi-step forms with validation
- Real-time error feedback
- Auto-save capabilities
- Confirmation dialogs for destructive actions

NAVIGATION:
- Role-based menu items with permission guards
- Breadcrumb navigation
- Active state highlighting
- Smooth transitions and animations

RESPONSIVE BEHAVIOR:
- Mobile sidebar overlay
- Table-to-card transformations
- Touch-friendly interactions
- Adaptive layouts for all screen sizes

Include authentication flow, role-based access control, loading states, error handling, and toast notifications. Use React, TypeScript, Tailwind CSS, and modern UI patterns.
```

---

## 🚀 Implementation Checklist

**Phase 1: Foundation**
- [ ] Set up React + TypeScript + Tailwind
- [ ] Implement authentication flow
- [ ] Create base layout components
- [ ] Set up routing structure

**Phase 2: Core Pages**
- [ ] Dashboard with charts and metrics
- [ ] Data management tables
- [ ] Form components with validation
- [ ] Modal system

**Phase 3: Advanced Features**  
- [ ] Role-based access control
- [ ] Real-time updates
- [ ] Advanced data visualizations
- [ ] Mobile responsiveness

**Phase 4: Polish**
- [ ] Loading states and animations
- [ ] Error boundaries and fallbacks
- [ ] Performance optimization
- [ ] Accessibility compliance

This specification provides everything needed to replicate the ToluAI interface with complete fidelity to the original design and functionality.