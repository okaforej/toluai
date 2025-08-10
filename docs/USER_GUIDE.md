# ToluAI User Guide

## Overview

ToluAI is an advanced insurance risk assessment platform that helps you analyze client risk profiles and generate actionable recommendations. This guide will walk you through using the platform effectively.

## Getting Started

### First Login

1. Navigate to the ToluAI application at `http://localhost:3000`
2. Use your provided credentials to log in
3. If you're an administrator, the default credentials are:
   - Email: `admin@toluai.com`
   - Password: `admin123`

### Dashboard Overview

Upon logging in, you'll see the main dashboard with:

- **Quick Stats**: Overview of total clients, assessments, and system metrics
- **Recent Activity**: Latest assessments and client updates
- **Risk Distribution**: Visual breakdown of client risk levels
- **Performance Metrics**: Charts showing assessment trends

## Managing Clients

### Adding a New Client

1. Navigate to the **Clients** page
2. Click the **"Add Client"** button
3. Fill out the client information form:
   - **Basic Information**: Company name, email, phone, website
   - **Business Information**: Industry, employee count, annual revenue
   - **Address**: Complete address information
4. Click **"Create Client"** to save

### Viewing Client Details

1. Go to the **Clients** page
2. Click on a client name or use the view icon (👁️)
3. Review the client profile including:
   - Contact information
   - Business details
   - Assessment history
   - Current risk level

### Searching and Filtering Clients

- Use the **search bar** to find clients by name
- Filter by **industry** using the dropdown menu
- Results update automatically as you type

### Client Status Management

Clients can have the following statuses:
- **Prospect**: Potential client, not yet active
- **Active**: Current client with active policies
- **Inactive**: Former client or suspended account

## Risk Assessments

### Understanding Risk Levels

ToluAI categorizes risk into four levels:

- **Low Risk** (Green): Minimal risk factors, stable profile
- **Medium Risk** (Yellow): Some risk factors present, manageable
- **High Risk** (Orange): Significant risk factors, requires attention
- **Critical Risk** (Red): Severe risk factors, immediate action needed

### Running a Quick Assessment

1. From the **Clients** page, find your target client
2. Click the **document icon** (📄) in the Actions column
3. The system will run a quick risk assessment automatically
4. View results in the client's profile

### Creating a Comprehensive Assessment

1. Navigate to **Assessments** → **Create New**
2. Select the client from the dropdown
3. Choose assessment type:
   - **Quick**: Basic risk evaluation
   - **Comprehensive**: Detailed analysis with recommendations
   - **Custom**: Specify custom parameters
4. Add description and any special notes
5. Click **"Start Assessment"**

### Interpreting Assessment Results

Each assessment provides:

#### Risk Score
- Numerical score from 0-100
- Higher scores indicate higher risk
- Color-coded based on risk category

#### Risk Factors
- Individual risk components
- Weight and impact of each factor
- Detailed explanations

#### Recommendations
- Prioritized action items
- Implementation effort estimates
- Expected impact on risk reduction

### Assessment History

View all assessments for a client:
1. Go to client details
2. Scroll to **Assessment History**
3. Click on any assessment to view details
4. Compare scores over time to track improvements

## User Roles and Permissions

### Admin Users
- Full system access
- User management
- System configuration
- All assessment types

### Underwriter Users
- Client and assessment management
- Create and run assessments
- View all client data
- Generate reports

### Standard Users
- View assigned clients only
- Run basic assessments
- View assessment results
- Limited administrative functions

## Reporting and Analytics

### Dashboard Charts
- **Risk Distribution**: Pie chart showing client risk levels
- **Assessment Trends**: Line chart of assessments over time
- **Client Growth**: Bar chart of client acquisition

### Exporting Data
1. Navigate to the data you want to export
2. Look for the **Export** button (usually top-right)
3. Choose format (CSV, PDF, Excel)
4. Download will start automatically

## Tips for Effective Use

### Best Practices for Assessments

1. **Regular Updates**: Run assessments quarterly or after major client changes
2. **Complete Information**: Ensure client data is up-to-date before assessments
3. **Document Changes**: Add notes explaining any significant changes
4. **Follow Recommendations**: Track implementation of suggested improvements

### Maintaining Client Data

- **Keep Contact Info Current**: Update email and phone regularly
- **Annual Revenue Updates**: Update financial data yearly
- **Industry Changes**: Monitor for client business model changes
- **Address Updates**: Maintain current business locations

### Workflow Optimization

1. **Batch Processing**: Group similar tasks for efficiency
2. **Use Filters**: Narrow down client lists for focused work
3. **Quick Actions**: Utilize quick assessment for routine checks
4. **Regular Reviews**: Schedule periodic client portfolio reviews

## Troubleshooting Common Issues

### Login Problems
- Verify email and password are correct
- Check caps lock status
- Clear browser cache and cookies
- Contact administrator if account is locked

### Assessment Failures
- Ensure client has complete information
- Check for system maintenance notifications
- Try refreshing the page
- Contact support if errors persist

### Performance Issues
- Close unnecessary browser tabs
- Clear browser cache
- Check internet connection
- Use supported browsers (Chrome, Firefox, Safari, Edge)

### Data Synchronization
- Allow time for updates to propagate
- Refresh the page to see latest data
- Check if you have sufficient permissions
- Verify network connectivity

## Keyboard Shortcuts

- `Ctrl/Cmd + K`: Quick search
- `Ctrl/Cmd + N`: New client (when on clients page)
- `Ctrl/Cmd + R`: Refresh current page
- `Esc`: Close modal dialogs

## Getting Help

### Documentation
- **API Guide**: Technical documentation for developers
- **Admin Guide**: System administration instructions
- **FAQ**: Frequently asked questions

### Support Channels
- **Email**: support@toluai.com
- **In-App Help**: Click the help icon in the top navigation
- **User Forums**: Community support and discussions

### Training Resources
- **Video Tutorials**: Step-by-step video guides
- **Webinars**: Live training sessions
- **User Manual**: Comprehensive platform guide

## Security and Privacy

### Account Security
- Use strong, unique passwords
- Enable two-factor authentication when available
- Log out when finished, especially on shared computers
- Report suspicious activity immediately

### Data Privacy
- Client data is encrypted in transit and at rest
- Access is logged for audit purposes
- Only authorized personnel can view client information
- Data retention follows industry standards

### Compliance Features
- GDPR compliance for EU clients
- SOC 2 Type II certification
- Regular security audits
- Incident response procedures

## Platform Updates

### Feature Releases
- New features are announced via email
- In-app notifications highlight new capabilities
- Training materials are updated accordingly
- Beta features available for early testing

### Maintenance Windows
- Scheduled maintenance is announced 48 hours in advance
- Typically occurs during off-peak hours
- System status page provides real-time updates
- Emergency maintenance may occur with shorter notice