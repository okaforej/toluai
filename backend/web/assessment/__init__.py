from flask import Blueprint

assessment_bp = Blueprint('assessment', __name__)

from backend.web.assessment import routes