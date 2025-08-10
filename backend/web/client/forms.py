"""Client management forms"""

from flask_wtf import FlaskForm
from wtforms import StringField, SelectField, FloatField, IntegerField, TextAreaField, SubmitField
from wtforms.validators import DataRequired, Email, Length, Optional, NumberRange, ValidationError
from backend.models import Client


class ClientForm(FlaskForm):
    """Form for creating/editing clients"""
    
    # Basic Information
    name = StringField('Company Name', validators=[DataRequired(), Length(min=2, max=100)],
                      render_kw={'placeholder': 'Enter company name'})
    email = StringField('Email', validators=[DataRequired(), Email()],
                       render_kw={'placeholder': 'company@example.com'})
    phone = StringField('Phone', validators=[Optional(), Length(max=20)],
                       render_kw={'placeholder': '+1 (555) 123-4567'})
    website = StringField('Website', validators=[Optional(), Length(max=200)],
                         render_kw={'placeholder': 'https://company.com'})
    
    # Address Information
    address = StringField('Address', validators=[Optional(), Length(max=200)],
                         render_kw={'placeholder': '123 Business Street'})
    city = StringField('City', validators=[Optional(), Length(max=50)],
                      render_kw={'placeholder': 'City'})
    state = StringField('State', validators=[Optional(), Length(max=50)],
                       render_kw={'placeholder': 'State'})
    zip_code = StringField('ZIP Code', validators=[Optional(), Length(max=20)],
                          render_kw={'placeholder': '12345'})
    country = StringField('Country', validators=[Optional(), Length(max=50)],
                         render_kw={'placeholder': 'United States'})
    
    # Business Information
    # TODO: This should come from a predefined database industry.
    industry = SelectField('Industry', choices=[
        ('', 'Select Industry'),
        ('technology', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('finance', 'Finance'),
        ('manufacturing', 'Manufacturing'),
        ('retail', 'Retail'),
        ('construction', 'Construction'),
        ('transportation', 'Transportation'),
        ('energy', 'Energy'),
        ('education', 'Education'),
        ('hospitality', 'Hospitality'),
        ('real_estate', 'Real Estate'),
        ('agriculture', 'Agriculture'),
        ('other', 'Other')
    ])
    
    sub_industry = StringField('Sub-Industry', validators=[Optional(), Length(max=100)],
                              render_kw={'placeholder': 'Specific sector within industry'})
    
    annual_revenue = FloatField('Annual Revenue ($)', validators=[Optional(), NumberRange(min=0)],
                               render_kw={'placeholder': '1000000'})
    
    employee_count = IntegerField('Number of Employees', validators=[Optional(), NumberRange(min=0)],
                                 render_kw={'placeholder': '50'})
    
    years_in_business = IntegerField('Years in Business', validators=[Optional(), NumberRange(min=0)],
                                    render_kw={'placeholder': '10'})
    
    # TODO: move this to a separate model for business structure or configurable optioons
    business_structure = SelectField('Business Structure', choices=[
        ('', 'Select Structure'),
        ('sole_proprietorship', 'Sole Proprietorship'),
        ('partnership', 'Partnership'),
        ('llc', 'LLC'),
        ('corporation', 'Corporation'),
        ('s_corporation', 'S-Corporation'),
        ('nonprofit', 'Non-Profit'),
        ('other', 'Other')
    ])

    
    # Insurance Information
    current_insurance_provider = StringField('Current Insurance Provider', 
                                           validators=[Optional(), Length(max=100)],
                                           render_kw={'placeholder': 'Current provider name'})
    
    current_premium = FloatField('Current Annual Premium ($)', 
                                validators=[Optional(), NumberRange(min=0)],
                                render_kw={'placeholder': '25000'})
    
    coverage_amount = FloatField('Coverage Amount ($)', 
                                validators=[Optional(), NumberRange(min=0)],
                                render_kw={'placeholder': '1000000'})
    
    # Risk Factors
    previous_claims = SelectField('Previous Claims', choices=[
        ('', 'Select'),
        ('true', 'Yes'),
        ('false', 'No')
    ])
    
    claims_count_5years = IntegerField('Claims in Last 5 Years', 
                                      validators=[Optional(), NumberRange(min=0, max=100)],
                                      render_kw={'placeholder': '0'})
    
    safety_programs = SelectField('Safety Programs in Place', choices=[
        ('', 'Select'),
        ('true', 'Yes'),
        ('false', 'No')
    ])
    
    # Additional Information
    notes = TextAreaField('Additional Notes', validators=[Optional(), Length(max=1000)],
                         render_kw={'rows': 4, 'placeholder': 'Any additional information...'})
    
    submit = SubmitField('Save Client')
    
    def __init__(self, original_email=None, *args, **kwargs):
        super(ClientForm, self).__init__(*args, **kwargs)
        self.original_email = original_email
    
    def validate_email(self, email):
        """Check if email is already taken by another client"""
        if self.original_email and email.data == self.original_email:
            return
            
        client = Client.query.filter_by(email=email.data).first()
        if client:
            raise ValidationError('This email is already registered to another client.')


class ClientSearchForm(FlaskForm):
    """Form for searching clients"""
    search = StringField('Search', validators=[Optional()],
                        render_kw={'placeholder': 'Search by name, email, or industry...'})
    industry = SelectField('Industry', choices=[
        ('', 'All Industries'),
        ('technology', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('finance', 'Finance'),
        ('manufacturing', 'Manufacturing'),
        ('retail', 'Retail'),
        ('construction', 'Construction'),
        ('transportation', 'Transportation'),
        ('energy', 'Energy'),
        ('education', 'Education'),
        ('hospitality', 'Hospitality'),
        ('real_estate', 'Real Estate'),
        ('agriculture', 'Agriculture'),
        ('other', 'Other')
    ])
    
    status = SelectField('Status', choices=[
        ('', 'All Status'),
        ('active', 'Active'),
        ('inactive', 'Inactive')
    ])
    
    client_type = SelectField('Type', choices=[
        ('', 'All Types'),
        ('prospect', 'Prospect'),
        ('customer', 'Customer'),
        ('former', 'Former')
    ])
    
    submit = SubmitField('Search')


class QuickClientForm(FlaskForm):
    """Quick form for adding basic client info"""
    name = StringField('Company Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    industry = SelectField('Industry', choices=[
        ('', 'Select Industry'),
        ('technology', 'Technology'),
        ('healthcare', 'Healthcare'),
        ('finance', 'Finance'),
        ('manufacturing', 'Manufacturing'),
        ('retail', 'Retail'),
        ('construction', 'Construction'),
        ('transportation', 'Transportation'),
        ('other', 'Other')
    ])
    submit = SubmitField('Add Client')