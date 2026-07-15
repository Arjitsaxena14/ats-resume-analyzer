import os
import tempfile
import time
import re
import threading
from collections import defaultdict
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

from database import init_db, save_analysis, get_history, get_analysis, delete_analysis
from resume_parser import extract_text
from ai_analyzer import analyze_resume_with_gemini

app = Flask(__name__)

# Configure CORS with standard safety settings (allowing development host)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

# Limit upload request body size to 10MB to prevent DoS attacks
app.config['MAX_CONTENT_LENGTH'] = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

# Thread-safe in-memory store for rate limiting (IP-based)
IP_LIMITS = defaultdict(list)
limiter_lock = threading.Lock()

def rate_limit(limit=60, period=60):
    """
    OWASP-compliant thread-safe rate limiter.
    limit: Max requests allowed in the period
    period: Window size in seconds
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.remote_addr or "127.0.0.1"
            # Fallback for proxies
            if request.headers.getlist("X-Forwarded-For"):
                ip = request.headers.getlist("X-Forwarded-For")[0]
                
            with limiter_lock:
                now = time.time()
                # Remove timestamps older than the rate limit window
                IP_LIMITS[ip] = [t for t in IP_LIMITS[ip] if now - t < period]
                
                if len(IP_LIMITS[ip]) >= limit:
                    return jsonify({
                        "error": "Too Many Requests",
                        "message": f"Rate limit exceeded. Maximum {limit} requests per {period} seconds."
                    }), 429
                    
                IP_LIMITS[ip].append(now)
            return f(*args, **kwargs)
        return wrapped
    return decorator

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/analyze', methods=['POST'])
@rate_limit(limit=5, period=60) # Strict rate limit on heavy AI processing
def analyze_resume():
    # 1. Strict Request Schema Validation (Unexpected Fields checks)
    allowed_form_keys = {'job_description'}
    if not set(request.form.keys()).issubset(allowed_form_keys):
        return jsonify({'error': 'Bad Request', 'message': 'Unexpected fields in form data.'}), 400
        
    allowed_files_keys = {'file'}
    if not set(request.files.keys()).issubset(allowed_files_keys):
        return jsonify({'error': 'Bad Request', 'message': 'Unexpected fields in files payload.'}), 400

    if 'file' not in request.files:
        return jsonify({'error': 'Bad Request', 'message': 'Missing file payload.'}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Bad Request', 'message': 'No file selected for analysis.'}), 400
        
    # 2. Strict Input validation & File verification
    if not allowed_file(file.filename):
        return jsonify({'error': 'Unsupported Media Type', 'message': 'Invalid file extension. Only PDF and DOCX files are allowed.'}), 415

    # Check file size explicitly to prevent buffer exhaustion before processing
    try:
        file.seek(0, os.SEEK_END)
        file_length = file.tell()
        file.seek(0) # Reset stream pointer
        
        if file_length > 10 * 1024 * 1024:
            return jsonify({'error': 'Payload Too Large', 'message': 'File size exceeds the 10MB safety limit.'}), 413
    except Exception:
        return jsonify({'error': 'Internal Server Error', 'message': 'Failed to inspect file payload size.'}), 500

    # 3. Form input sanitization and length validation
    job_description = request.form.get('job_description', '')
    if not isinstance(job_description, str):
        return jsonify({'error': 'Bad Request', 'message': 'Job description field must be a valid text string.'}), 400
        
    if len(job_description) > 5000:
        return jsonify({'error': 'Bad Request', 'message': 'Job description text exceeds maximum allowed length of 5000 characters.'}), 400

    # Strip dangerous HTML tags to prevent cross-site scripting (XSS)
    job_description = re.sub(r'<[^>]*>', '', job_description)

    # 4. Safe temp file handling and execution
    filename = secure_filename(file.filename)
    temp_dir = tempfile.gettempdir()
    temp_path = os.path.join(temp_dir, filename)
    
    try:
        file.save(temp_path)
        
        # Extract text from file securely
        text_content = extract_text(temp_path, filename)
        if not text_content or text_content.strip() == "":
            return jsonify({'error': 'Unprocessable Entity', 'message': 'Could not parse text content. Ensure document is not encrypted or blank.'}), 422
            
        # Perform AI Analysis
        analysis = analyze_resume_with_gemini(text_content, job_description)
        
        # Save record to SQLite securely (using parameterised query backend database.py)
        analysis_id = save_analysis(filename, text_content, analysis)
        
        return jsonify({
            'id': analysis_id,
            'filename': filename,
            'analysis': analysis
        }), 200
        
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': f'Processing error: {str(e)}'}), 500
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass

@app.route('/api/history', methods=['GET'])
@rate_limit(limit=30, period=60)
def get_all_history():
    try:
        history = get_history()
        return jsonify(history), 200
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@app.route('/api/history/<int:analysis_id>', methods=['GET'])
@rate_limit(limit=30, period=60)
def get_history_by_id(analysis_id):
    try:
        # Route parameters type checking is enforced by Flask routing rule (<int:analysis_id>)
        record = get_analysis(analysis_id)
        if record:
            return jsonify(record), 200
        else:
            return jsonify({'error': 'Not Found', 'message': 'No analysis report matches the requested ID.'}), 404
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

@app.route('/api/history/<int:analysis_id>', methods=['DELETE'])
@rate_limit(limit=15, period=60)
def delete_history_by_id(analysis_id):
    try:
        deleted = delete_analysis(analysis_id)
        if deleted:
            return jsonify({'success': True, 'message': 'Record deleted successfully'}), 200
        else:
            return jsonify({'error': 'Not Found', 'message': 'No analysis report matches the requested ID.'}), 404
    except Exception as e:
        return jsonify({'error': 'Internal Server Error', 'message': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='127.0.0.1', port=5000, debug=True)
