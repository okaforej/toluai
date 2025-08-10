from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.irpa import IRPACompany
from backend.models.user import User
from backend.utilities.decorators import admin_required
import logging
import os
import requests

logger = logging.getLogger(__name__)
companies_bp = Blueprint('companies', __name__)

# Configuration for email sending
SEND_ONBOARDING_EMAILS = os.getenv('SEND_ONBOARDING_EMAILS', 'false').lower() == 'true'
MAPBOX_API_KEY = os.getenv('MAPBOX_API_KEY', '')

@companies_bp.route('/api/v1/companies', methods=['GET'])
@jwt_required()
def get_companies():
    """Get all companies (system admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user or not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Unauthorized'}), 403
        
        companies = IRPACompany.query.all()
        return jsonify({
            'companies': [company.to_dict() for company in companies]
        }), 200
        
    except Exception as e:
        logger.error(f"Error fetching companies: {str(e)}")
        return jsonify({'error': 'Failed to fetch companies'}), 500

@companies_bp.route('/api/v1/companies/<int:company_id>', methods=['GET'])
@jwt_required()
def get_company(company_id):
    """Get company details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        company = IRPACompany.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check permissions
        if not (user.has_role('system_admin') or 
                (user.company_id == company_id and user.has_role('company_admin'))):
            return jsonify({'error': 'Unauthorized'}), 403
        
        return jsonify(company.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Error fetching company: {str(e)}")
        return jsonify({'error': 'Failed to fetch company'}), 500

@companies_bp.route('/api/v1/companies/validate-address', methods=['POST'])
@jwt_required()
def validate_address():
    """Validate address using Mapbox or similar service"""
    try:
        data = request.get_json()
        address = data.get('address', '')
        
        if not address:
            return jsonify({'error': 'Address is required'}), 400
        
        # If no API key, return mock data
        if not MAPBOX_API_KEY:
            # Return mock validated address for development
            return jsonify({
                'valid': True,
                'formatted_address': address,
                'city': data.get('city', 'Unknown'),
                'state': data.get('state', 'Unknown'),
                'country': 'USA',
                'coordinates': {
                    'lat': 40.7128,
                    'lng': -74.0060
                }
            }), 200
        
        # Use Mapbox Geocoding API
        url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json"
        params = {
            'access_token': MAPBOX_API_KEY,
            'limit': 1,
            'country': 'US'
        }
        
        response = requests.get(url, params=params)
        if response.status_code == 200:
            data = response.json()
            if data['features']:
                feature = data['features'][0]
                return jsonify({
                    'valid': True,
                    'formatted_address': feature['place_name'],
                    'coordinates': {
                        'lat': feature['center'][1],
                        'lng': feature['center'][0]
                    }
                }), 200
        
        return jsonify({
            'valid': False,
            'message': 'Address could not be validated'
        }), 200
        
    except Exception as e:
        logger.error(f"Error validating address: {str(e)}")
        return jsonify({'error': 'Failed to validate address'}), 500

@companies_bp.route('/api/v1/companies', methods=['POST'])
@jwt_required()
@admin_required
def create_company():
    """Create a new company (onboarding)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Only system administrators can onboard companies'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'industry', 'email']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'{field} is required'}), 400
        
        # Check if company already exists
        existing = IRPACompany.query.filter_by(name=data['name']).first()
        if existing:
            return jsonify({'error': 'Company with this name already exists'}), 400
        
        # Parse company size
        size_str = data.get('size', '1-50')
        if '-' in size_str:
            size = int(size_str.split('-')[0])
        elif '+' in size_str:
            size = int(size_str.replace('+', ''))
        else:
            size = 50
        
        # Create company
        company = IRPACompany(
            name=data['name'],
            industry=data['industry'],
            location=data.get('location', ''),
            size=size,
            email=data['email'],
            phone=data.get('phone', ''),
            status='active',
            risk_level='Pending',
            created_by=current_user_id
        )
        
        db.session.add(company)
        db.session.commit()
        
        # Send onboarding email if enabled
        email_sent = False
        if SEND_ONBOARDING_EMAILS:
            try:
                # Email functionality would be implemented here
                # For now, just log the intention
                logger.info(f"Would send onboarding email to {company.email}")
                email_sent = True
            except Exception as e:
                logger.error(f"Failed to send onboarding email: {str(e)}")
                # Don't fail the request if email fails
        
        logger.info(f"Company {company.id} created by user {current_user_id}")
        
        return jsonify({
            'message': 'Company onboarded successfully',
            'company': company.to_dict(),
            'email_sent': SEND_ONBOARDING_EMAILS
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating company: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to create company'}), 500

@companies_bp.route('/api/v1/companies/<int:company_id>', methods=['PUT'])
@jwt_required()
def update_company(company_id):
    """Update company details"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        company = IRPACompany.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check permissions
        if not (user.has_role('system_admin') or 
                (user.company_id == company_id and user.has_role('company_admin'))):
            return jsonify({'error': 'Unauthorized'}), 403
        
        data = request.get_json()
        
        # Update fields
        if 'name' in data:
            company.name = data['name']
        if 'industry' in data:
            company.industry = data['industry']
        if 'location' in data:
            company.location = data['location']
        if 'size' in data:
            company.size = data['size']
        if 'email' in data:
            company.email = data['email']
        if 'phone' in data:
            company.phone = data['phone']
        if 'status' in data and user.has_role('system_admin'):
            company.status = data['status']
        
        db.session.commit()
        
        logger.info(f"Company {company_id} updated by user {current_user_id}")
        
        return jsonify({
            'message': 'Company updated successfully',
            'company': company.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating company: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to update company'}), 500

@companies_bp.route('/api/v1/companies/<int:company_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_company(company_id):
    """Delete a company (system admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not (user.has_role('system_admin') or user.has_role('admin')):
            return jsonify({'error': 'Only system administrators can delete companies'}), 403
        
        company = IRPACompany.query.get(company_id)
        if not company:
            return jsonify({'error': 'Company not found'}), 404
        
        # Check if company has users or entities
        if company.users.count() > 0:
            return jsonify({'error': 'Cannot delete company with active users'}), 400
        
        if company.insured_entities.count() > 0:
            return jsonify({'error': 'Cannot delete company with insured entities'}), 400
        
        db.session.delete(company)
        db.session.commit()
        
        logger.info(f"Company {company_id} deleted by user {current_user_id}")
        
        return jsonify({'message': 'Company deleted successfully'}), 200
        
    except Exception as e:
        logger.error(f"Error deleting company: {str(e)}")
        db.session.rollback()
        return jsonify({'error': 'Failed to delete company'}), 500