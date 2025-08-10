"""
Input validation utilities for ToluAI backend.

Provides comprehensive validation functions for different data types
with proper error handling and security considerations.
"""

import re
import json
from typing import Any, Dict, List, Optional, Union
from email_validator import validate_email as _validate_email, EmailNotValidError
from backend.utilities.exceptions import ValidationError


# Regular expressions for validation
PHONE_REGEX = re.compile(r'^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$')
ZIP_CODE_REGEX = re.compile(r'^\d{5}(-\d{4})?$')
URL_REGEX = re.compile(
    r'^https?://'  # http:// or https://
    r'(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6}\.?|'  # domain...
    r'localhost|'  # localhost...
    r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})'  # ...or ip
    r'(?::\d+)?'  # optional port
    r'(?:/?|[/?]\S+)$', re.IGNORECASE
)


def validate_email(email: str) -> str:
    """
    Validate email address format.
    
    Args:
        email: Email address to validate
        
    Returns:
        Normalized email address
        
    Raises:
        ValidationError: If email is invalid
    """
    if not email or not isinstance(email, str):
        raise ValidationError("Email is required", {'email': ['Email is required']})
    
    try:
        # Use email-validator library for comprehensive validation
        valid = _validate_email(email.strip())
        return valid.email
    except EmailNotValidError as e:
        raise ValidationError("Invalid email format", {'email': [str(e)]})


def validate_phone(phone: str) -> Optional[str]:
    """
    Validate phone number format.
    
    Args:
        phone: Phone number to validate
        
    Returns:
        Normalized phone number or None if empty
        
    Raises:
        ValidationError: If phone number is invalid
    """
    if not phone:
        return None
    
    if not isinstance(phone, str):
        raise ValidationError("Phone must be a string", {'phone': ['Phone must be a string']})
    
    # Remove all non-digit characters for validation
    digits_only = re.sub(r'\D', '', phone)
    
    if len(digits_only) < 10:
        raise ValidationError("Phone number too short", {'phone': ['Phone number must be at least 10 digits']})
    
    if len(digits_only) > 15:
        raise ValidationError("Phone number too long", {'phone': ['Phone number must be at most 15 digits']})
    
    # Check if it matches common US phone number patterns
    if not PHONE_REGEX.match(phone.strip()):
        raise ValidationError("Invalid phone number format", {'phone': ['Invalid phone number format']})
    
    return phone.strip()


def validate_url(url: str) -> Optional[str]:
    """
    Validate URL format.
    
    Args:
        url: URL to validate
        
    Returns:
        Normalized URL or None if empty
        
    Raises:
        ValidationError: If URL is invalid
    """
    if not url:
        return None
    
    if not isinstance(url, str):
        raise ValidationError("URL must be a string", {'url': ['URL must be a string']})
    
    url = url.strip()
    
    # Add protocol if missing
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    
    if not URL_REGEX.match(url):
        raise ValidationError("Invalid URL format", {'url': ['Invalid URL format']})
    
    return url


def validate_zip_code(zip_code: str) -> Optional[str]:
    """
    Validate US ZIP code format.
    
    Args:
        zip_code: ZIP code to validate
        
    Returns:
        Normalized ZIP code or None if empty
        
    Raises:
        ValidationError: If ZIP code is invalid
    """
    if not zip_code:
        return None
    
    if not isinstance(zip_code, str):
        raise ValidationError("ZIP code must be a string", {'zip_code': ['ZIP code must be a string']})
    
    zip_code = zip_code.strip()
    
    if not ZIP_CODE_REGEX.match(zip_code):
        raise ValidationError("Invalid ZIP code format", {'zip_code': ['Invalid ZIP code format (use 12345 or 12345-6789)']})
    
    return zip_code


def validate_json(data: str) -> Dict[str, Any]:
    """
    Validate and parse JSON string.
    
    Args:
        data: JSON string to validate
        
    Returns:
        Parsed JSON data
        
    Raises:
        ValidationError: If JSON is invalid
    """
    if not data:
        return {}
    
    if not isinstance(data, str):
        raise ValidationError("JSON data must be a string", {'json': ['JSON data must be a string']})
    
    try:
        return json.loads(data)
    except json.JSONDecodeError as e:
        raise ValidationError("Invalid JSON format", {'json': [f'Invalid JSON: {str(e)}']})


def validate_required_fields(data: Dict[str, Any], required_fields: List[str]) -> None:
    """
    Validate that required fields are present and not empty.
    
    Args:
        data: Data dictionary to validate
        required_fields: List of required field names
        
    Raises:
        ValidationError: If required fields are missing
    """
    errors = {}
    
    for field in required_fields:
        if field not in data or data[field] is None or data[field] == '':
            errors[field] = [f'{field.replace("_", " ").title()} is required']
    
    if errors:
        raise ValidationError("Required fields missing", errors)


def validate_string_length(
    value: str, 
    field_name: str, 
    min_length: int = None, 
    max_length: int = None
) -> str:
    """
    Validate string length constraints.
    
    Args:
        value: String value to validate
        field_name: Name of the field for error messages
        min_length: Minimum allowed length
        max_length: Maximum allowed length
        
    Returns:
        Validated string value
        
    Raises:
        ValidationError: If length constraints are violated
    """
    if not isinstance(value, str):
        raise ValidationError(f"{field_name} must be a string", {field_name: [f'{field_name} must be a string']})
    
    value = value.strip()
    length = len(value)
    
    errors = []
    
    if min_length is not None and length < min_length:
        errors.append(f'{field_name} must be at least {min_length} characters long')
    
    if max_length is not None and length > max_length:
        errors.append(f'{field_name} must be at most {max_length} characters long')
    
    if errors:
        raise ValidationError(f"Invalid {field_name} length", {field_name: errors})
    
    return value


def validate_numeric_range(
    value: Union[int, float], 
    field_name: str, 
    min_value: Union[int, float] = None, 
    max_value: Union[int, float] = None
) -> Union[int, float]:
    """
    Validate numeric value range constraints.
    
    Args:
        value: Numeric value to validate
        field_name: Name of the field for error messages
        min_value: Minimum allowed value
        max_value: Maximum allowed value
        
    Returns:
        Validated numeric value
        
    Raises:
        ValidationError: If range constraints are violated
    """
    if not isinstance(value, (int, float)):
        raise ValidationError(f"{field_name} must be a number", {field_name: [f'{field_name} must be a number']})
    
    errors = []
    
    if min_value is not None and value < min_value:
        errors.append(f'{field_name} must be at least {min_value}')
    
    if max_value is not None and value > max_value:
        errors.append(f'{field_name} must be at most {max_value}')
    
    if errors:
        raise ValidationError(f"Invalid {field_name} range", {field_name: errors})
    
    return value


def validate_choice(value: Any, field_name: str, choices: List[Any]) -> Any:
    """
    Validate that value is one of the allowed choices.
    
    Args:
        value: Value to validate
        field_name: Name of the field for error messages
        choices: List of allowed choices
        
    Returns:
        Validated value
        
    Raises:
        ValidationError: If value is not in choices
    """
    if value not in choices:
        raise ValidationError(
            f"Invalid {field_name} choice", 
            {field_name: [f'{field_name} must be one of: {", ".join(map(str, choices))}']}
        )
    
    return value


def sanitize_html(text: str) -> str:
    """
    Basic HTML sanitization to prevent XSS attacks.
    
    Args:
        text: Text to sanitize
        
    Returns:
        Sanitized text
    """
    if not text:
        return text
    
    # Basic HTML entity encoding
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    text = text.replace('"', '&quot;')
    text = text.replace("'", '&#x27;')
    
    return text


def validate_client_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate client creation/update data.
    
    Args:
        data: Client data to validate
        
    Returns:
        Validated and sanitized client data
        
    Raises:
        ValidationError: If validation fails
    """
    # Required fields for client creation
    required_fields = ['name', 'email']
    validate_required_fields(data, required_fields)
    
    # Validate and sanitize individual fields
    validated_data = {}
    
    # Name validation
    validated_data['name'] = validate_string_length(
        sanitize_html(data['name']), 'name', min_length=2, max_length=100
    )
    
    # Email validation
    validated_data['email'] = validate_email(data['email'])
    
    # Optional fields
    if 'phone' in data:
        validated_data['phone'] = validate_phone(data['phone'])
    
    if 'website' in data:
        validated_data['website'] = validate_url(data['website'])
    
    if 'zip_code' in data:
        validated_data['zip_code'] = validate_zip_code(data['zip_code'])
    
    # String fields with length limits
    string_fields = {
        'address': 200,
        'city': 50,
        'state': 50,
        'country': 50,
        'industry': 50,
        'sub_industry': 50,
        'business_structure': 50,
        'source': 50,
        'notes': 1000
    }
    
    for field, max_length in string_fields.items():
        if field in data and data[field]:
            validated_data[field] = validate_string_length(
                sanitize_html(data[field]), field, max_length=max_length
            )
    
    # Numeric fields
    if 'annual_revenue' in data and data['annual_revenue'] is not None:
        validated_data['annual_revenue'] = validate_numeric_range(
            data['annual_revenue'], 'annual_revenue', min_value=0
        )
    
    if 'employee_count' in data and data['employee_count'] is not None:
        validated_data['employee_count'] = validate_numeric_range(
            data['employee_count'], 'employee_count', min_value=1
        )
    
    if 'years_in_business' in data and data['years_in_business'] is not None:
        validated_data['years_in_business'] = validate_numeric_range(
            data['years_in_business'], 'years_in_business', min_value=0, max_value=200
        )
    
    return validated_data


def validate_assessment_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate risk assessment data.
    
    Args:
        data: Assessment data to validate
        
    Returns:
        Validated assessment data
        
    Raises:
        ValidationError: If validation fails
    """
    # Required fields
    required_fields = ['client_id']
    validate_required_fields(data, required_fields)
    
    validated_data = {}
    
    # Client ID validation
    validated_data['client_id'] = validate_numeric_range(
        data['client_id'], 'client_id', min_value=1
    )
    
    # Assessment type validation
    if 'assessment_type' in data:
        validated_data['assessment_type'] = validate_choice(
            data['assessment_type'], 
            'assessment_type', 
            ['standard', 'detailed', 'quick', 'renewal']
        )
    
    # Notes validation
    if 'notes' in data and data['notes']:
        validated_data['notes'] = validate_string_length(
            sanitize_html(data['notes']), 'notes', max_length=2000
        )
    
    # Additional data validation (JSON)
    if 'additional_data' in data and data['additional_data']:
        validated_data['additional_data'] = validate_json(data['additional_data'])
    
    return validated_data
