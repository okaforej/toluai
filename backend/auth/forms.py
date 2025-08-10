"""Authentication forms for ToluAI"""

from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, SelectField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from backend.models import User


class LoginForm(FlaskForm):
    """User login form"""
    email = StringField('Email', validators=[DataRequired(), Email()],
                       render_kw={'placeholder': 'Enter your email'})
    password = PasswordField('Password', validators=[DataRequired()],
                            render_kw={'placeholder': 'Enter your password'})
    remember_me = BooleanField('Remember Me')
    submit = SubmitField('Sign In')


class RegistrationForm(FlaskForm):
    """User registration form"""
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)],
                      render_kw={'placeholder': 'Enter your full name'})
    email = StringField('Email', validators=[DataRequired(), Email()],
                       render_kw={'placeholder': 'Enter your email address'})
    company = StringField('Company', validators=[Length(max=100)],
                         render_kw={'placeholder': 'Company name (optional)'})
    job_title = StringField('Job Title', validators=[Length(max=100)],
                           render_kw={'placeholder': 'Your job title (optional)'})
    password = PasswordField('Password', validators=[
        DataRequired(),
        Length(min=8, message='Password must be at least 8 characters long')
    ], render_kw={'placeholder': 'Create a strong password'})
    password_confirm = PasswordField('Confirm Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ], render_kw={'placeholder': 'Confirm your password'})
    submit = SubmitField('Create Account')

    def validate_email(self, email):
        """Check if email is already registered"""
        user = User.query.filter_by(email=email.data).first()
        if user:
            raise ValidationError('This email is already registered. Please use a different email.')


class PasswordResetRequestForm(FlaskForm):
    """Password reset request form"""
    email = StringField('Email', validators=[DataRequired(), Email()],
                       render_kw={'placeholder': 'Enter your email address'})
    submit = SubmitField('Send Reset Link')


class PasswordResetForm(FlaskForm):
    """Password reset form"""
    password = PasswordField('New Password', validators=[
        DataRequired(),
        Length(min=8, message='Password must be at least 8 characters long')
    ], render_kw={'placeholder': 'Enter your new password'})
    password_confirm = PasswordField('Confirm New Password', validators=[
        DataRequired(),
        EqualTo('password', message='Passwords must match')
    ], render_kw={'placeholder': 'Confirm your new password'})
    submit = SubmitField('Reset Password')


class ChangePasswordForm(FlaskForm):
    """Change password form for logged-in users"""
    current_password = PasswordField('Current Password', validators=[DataRequired()],
                                   render_kw={'placeholder': 'Enter current password'})
    new_password = PasswordField('New Password', validators=[
        DataRequired(),
        Length(min=8, message='Password must be at least 8 characters long')
    ], render_kw={'placeholder': 'Enter new password'})
    confirm_password = PasswordField('Confirm New Password', validators=[
        DataRequired(),
        EqualTo('new_password', message='Passwords must match')
    ], render_kw={'placeholder': 'Confirm new password'})
    submit = SubmitField('Change Password')


class ProfileForm(FlaskForm):
    """User profile form"""
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Phone Number', validators=[Length(max=20)])
    company = StringField('Company', validators=[Length(max=100)])
    job_title = StringField('Job Title', validators=[Length(max=100)])
    submit = SubmitField('Update Profile')

    def __init__(self, original_email, *args, **kwargs):
        super(ProfileForm, self).__init__(*args, **kwargs)
        self.original_email = original_email

    def validate_email(self, email):
        """Check if email is already taken by another user"""
        if email.data != self.original_email:
            user = User.query.filter_by(email=email.data).first()
            if user:
                raise ValidationError('This email is already registered.')


class AdminUserForm(FlaskForm):
    """Admin form for managing users"""
    name = StringField('Full Name', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    phone = StringField('Phone Number', validators=[Length(max=20)])
    company = StringField('Company', validators=[Length(max=100)])
    job_title = StringField('Job Title', validators=[Length(max=100)])
    active = BooleanField('Active')
    roles = SelectField('Primary Role', choices=[
        ('user', 'User'),
        ('underwriter', 'Underwriter'),
        ('admin', 'Administrator')
    ])
    submit = SubmitField('Save User')