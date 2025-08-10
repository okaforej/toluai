"""
Client management API endpoints
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.app import db
from backend.models.client import Client
from backend.models.user import User
import logging

logger = logging.getLogger(__name__)

def register_client_routes(bp: Blueprint):
    """Register client-related routes with the given blueprint"""
    
    @bp.route('/clients', methods=['GET'])
    @jwt_required()
    def get_clients():
        """Get all clients"""
        try:
            # Add pagination
            page = request.args.get('page', 1, type=int)
            per_page = request.args.get('per_page', 20, type=int)
            
            clients = Client.query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
            
            return jsonify({
                'clients': [client.to_dict() for client in clients.items],
                'total': clients.total,
                'page': page,
                'pages': clients.pages
            }), 200
            
        except Exception as e:
            logger.error(f"Error fetching clients: {str(e)}")
            return jsonify({'error': 'Failed to fetch clients'}), 500
    
    @bp.route('/clients/<int:client_id>', methods=['GET'])
    @jwt_required()
    def get_client(client_id):
        """Get specific client details"""
        try:
            client = Client.query.get(client_id)
            if not client:
                return jsonify({'error': 'Client not found'}), 404
            
            return jsonify(client.to_dict()), 200
            
        except Exception as e:
            logger.error(f"Error fetching client: {str(e)}")
            return jsonify({'error': 'Failed to fetch client'}), 500
    
    @bp.route('/clients', methods=['POST'])
    @jwt_required()
    def create_client():
        """Create a new client"""
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['name', 'email']
            for field in required_fields:
                if not data.get(field):
                    return jsonify({'error': f'{field} is required'}), 400
            
            # Check if email already exists
            existing = Client.query.filter_by(email=data['email']).first()
            if existing:
                return jsonify({'error': 'Client with this email already exists'}), 400
            
            client = Client(
                name=data['name'],
                email=data['email'],
                phone=data.get('phone'),
                website=data.get('website'),
                address=data.get('address'),
                city=data.get('city'),
                state=data.get('state'),
                zip_code=data.get('zip_code'),
                country=data.get('country', 'United States'),
                industry=data.get('industry'),
                sub_industry=data.get('sub_industry'),
                annual_revenue=data.get('annual_revenue'),
                employee_count=data.get('employee_count'),
                years_in_business=data.get('years_in_business'),
                business_structure=data.get('business_structure')
            )
            
            db.session.add(client)
            db.session.commit()
            
            return jsonify({
                'message': 'Client created successfully',
                'client': client.to_dict()
            }), 201
            
        except Exception as e:
            logger.error(f"Error creating client: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to create client'}), 500
    
    @bp.route('/clients/<int:client_id>', methods=['PUT'])
    @jwt_required()
    def update_client(client_id):
        """Update client details"""
        try:
            client = Client.query.get(client_id)
            if not client:
                return jsonify({'error': 'Client not found'}), 404
            
            data = request.get_json()
            
            # Update fields
            for field in ['name', 'email', 'phone', 'website', 'address', 'city', 
                         'state', 'zip_code', 'country', 'industry', 'sub_industry',
                         'annual_revenue', 'employee_count', 'years_in_business',
                         'business_structure', 'status']:
                if field in data:
                    setattr(client, field, data[field])
            
            db.session.commit()
            
            return jsonify({
                'message': 'Client updated successfully',
                'client': client.to_dict()
            }), 200
            
        except Exception as e:
            logger.error(f"Error updating client: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to update client'}), 500
    
    @bp.route('/clients/<int:client_id>', methods=['DELETE'])
    @jwt_required()
    def delete_client(client_id):
        """Delete a client"""
        try:
            client = Client.query.get(client_id)
            if not client:
                return jsonify({'error': 'Client not found'}), 404
            
            db.session.delete(client)
            db.session.commit()
            
            return jsonify({'message': 'Client deleted successfully'}), 200
            
        except Exception as e:
            logger.error(f"Error deleting client: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to delete client'}), 500