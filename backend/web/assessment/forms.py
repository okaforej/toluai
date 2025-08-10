"""Risk assessment forms"""

from flask_wtf import FlaskForm
from wtforms import SelectField, TextAreaField, SubmitField, HiddenField, SelectMultipleField
from wtforms.validators import DataRequired, Optional, Length
from backend.models import Client


class AssessmentForm(FlaskForm):
    """Form for creating risk assessments"""
    
    client_id = SelectField('Client', coerce=int, validators=[DataRequired()],
                           render_kw={'class': 'form-select'})
    
    assessment_type = SelectField('Assessment Type', choices=[
        ('standard', 'Standard Assessment'),
        ('detailed', 'Detailed Assessment'),
        ('renewal', 'Renewal Assessment'),
        ('quick', 'Quick Assessment')
    ], default='standard')
    
    notes = TextAreaField('Notes', validators=[Optional(), Length(max=1000)],
                         render_kw={'rows': 4, 'placeholder': 'Additional notes about this assessment...'})
    
    submit = SubmitField('Run Risk Assessment')
    
    def __init__(self, *args, **kwargs):
        super(AssessmentForm, self).__init__(*args, **kwargs)
        # Populate client choices
        self.client_id.choices = [(0, 'Select a client')] + [
            (client.id, f"{client.name} ({client.email})") 
            for client in Client.query.filter_by(status='active').order_by(Client.name).all()
        ]


class QuickAssessmentForm(FlaskForm):
    """Quick assessment form with client ID already set"""
    
    client_id = HiddenField()
    assessment_type = SelectField('Assessment Type', choices=[
        ('standard', 'Standard'),
        ('detailed', 'Detailed'),
        ('quick', 'Quick')
    ], default='standard')
    
    notes = TextAreaField('Notes', validators=[Optional(), Length(max=500)],
                         render_kw={'rows': 3})
    
    submit = SubmitField('Run Assessment')


class AssessmentSearchForm(FlaskForm):
    """Form for searching and filtering assessments"""
    
    client = SelectField('Client', coerce=int, 
                        render_kw={'class': 'form-select'})
    
    risk_category = SelectField('Risk Category', choices=[
        ('', 'All Categories'),
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
        ('critical', 'Critical Risk')
    ])
    
    assessment_type = SelectField('Assessment Type', choices=[
        ('', 'All Types'),
        ('standard', 'Standard'),
        ('detailed', 'Detailed'),
        ('renewal', 'Renewal'),
        ('quick', 'Quick')
    ])
    
    status = SelectField('Status', choices=[
        ('', 'All Status'),
        ('draft', 'Draft'),
        ('completed', 'Completed'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved')
    ])
    
    submit = SubmitField('Filter')
    
    def __init__(self, *args, **kwargs):
        super(AssessmentSearchForm, self).__init__(*args, **kwargs)
        # Populate client choices
        self.client.choices = [(0, 'All Clients')] + [
            (client.id, client.name) 
            for client in Client.query.order_by(Client.name).all()
        ]


class RecommendationForm(FlaskForm):
    """Form for updating recommendations"""
    
    status = SelectField('Status', choices=[
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('dismissed', 'Dismissed')
    ])
    
    assigned_to = SelectField('Assign To', coerce=int, 
                             render_kw={'class': 'form-select'})
    
    notes = TextAreaField('Implementation Notes', 
                         validators=[Optional(), Length(max=500)],
                         render_kw={'rows': 3})
    
    submit = SubmitField('Update Recommendation')


class BulkAssessmentForm(FlaskForm):
    """Form for bulk assessment operations"""
    
    clients = SelectMultipleField('Select Clients', coerce=int,
                                 render_kw={'class': 'form-control', 'multiple': True, 'size': 10})
    
    assessment_type = SelectField('Assessment Type', choices=[
        ('standard', 'Standard Assessment'),
        ('renewal', 'Renewal Assessment'),
        ('quick', 'Quick Assessment')
    ], default='standard')
    
    notes = TextAreaField('Batch Notes', validators=[Optional(), Length(max=500)],
                         render_kw={'rows': 3, 'placeholder': 'Notes for all assessments in this batch...'})
    
    submit = SubmitField('Run Bulk Assessment')
    
    def __init__(self, *args, **kwargs):
        super(BulkAssessmentForm, self).__init__(*args, **kwargs)
        # Populate client choices
        self.clients.choices = [
            (client.id, f"{client.name} - {client.industry}") 
            for client in Client.query.filter_by(status='active').order_by(Client.name).all()
        ]