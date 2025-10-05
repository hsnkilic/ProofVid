from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from datetime import datetime
import sqlite3
import os
import secrets

app = Flask(__name__)
CORS(app)

DATABASE = 'proofvid.db'

def init_db():
    """Initialize the database with certificates table"""
    conn = sqlite3.connect(DATABASE)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS certificates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            video_hash TEXT UNIQUE NOT NULL,
            certificate_id TEXT UNIQUE NOT NULL,
            timestamp TEXT NOT NULL,
            device_info TEXT,
            location TEXT,
            metadata TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    """Serve the verification webpage"""
    return render_template('index.html')

@app.route('/api/register', methods=['POST'])
def register_hash():
    """Register a video hash and issue a certificate"""
    data = request.get_json()
    
    if not data or 'hash' not in data:
        return jsonify({'error': 'Video hash is required'}), 400
    
    video_hash = data['hash']
    device_info = data.get('device_info', '')
    location = data.get('location', '')
    metadata = data.get('metadata', '')
    
    # Generate unique certificate ID
    certificate_id = secrets.token_urlsafe(16)
    timestamp = datetime.utcnow().isoformat() + 'Z'
    
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('''
            INSERT INTO certificates (video_hash, certificate_id, timestamp, device_info, location, metadata)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (video_hash, certificate_id, timestamp, device_info, location, metadata))
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'certificate_id': certificate_id,
            'hash': video_hash,
            'timestamp': timestamp,
            'message': 'Video hash registered successfully'
        }), 201
        
    except sqlite3.IntegrityError:
        return jsonify({
            'error': 'This video hash has already been registered',
            'hash': video_hash
        }), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify/<video_hash>', methods=['GET'])
def verify_hash(video_hash):
    """Verify if a video hash exists in the database"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM certificates WHERE video_hash = ?', (video_hash,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return jsonify({
                'verified': True,
                'certificate_id': result['certificate_id'],
                'hash': result['video_hash'],
                'timestamp': result['timestamp'],
                'device_info': result['device_info'],
                'location': result['location'],
                'metadata': result['metadata']
            })
        else:
            return jsonify({
                'verified': False,
                'message': 'No certificate found for this video hash'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/certificate/<certificate_id>', methods=['GET'])
def get_certificate(certificate_id):
    """Get certificate details by certificate ID"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT * FROM certificates WHERE certificate_id = ?', (certificate_id,))
        result = c.fetchone()
        conn.close()
        
        if result:
            return jsonify({
                'found': True,
                'certificate_id': result['certificate_id'],
                'hash': result['video_hash'],
                'timestamp': result['timestamp'],
                'device_info': result['device_info'],
                'location': result['location'],
                'metadata': result['metadata']
            })
        else:
            return jsonify({
                'found': False,
                'message': 'Certificate not found'
            }), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics about registered videos"""
    try:
        conn = get_db()
        c = conn.cursor()
        c.execute('SELECT COUNT(*) as total FROM certificates')
        result = c.fetchone()
        conn.close()
        
        return jsonify({
            'total_certificates': result['total']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)
