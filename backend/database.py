import sqlite3
import json
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'resumes.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            text_content TEXT NOT NULL,
            analysis_json TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

def save_analysis(filename, text_content, analysis_dict):
    conn = get_db_connection()
    cursor = conn.cursor()
    analysis_str = json.dumps(analysis_dict)
    cursor.execute(
        "INSERT INTO resumes (filename, text_content, analysis_json) VALUES (?, ?, ?)",
        (filename, text_content, analysis_str)
    )
    conn.commit()
    last_id = cursor.lastrowid
    conn.close()
    return last_id

def get_history():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, uploaded_at, analysis_json FROM resumes ORDER BY uploaded_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        try:
            analysis_data = json.loads(row['analysis_json'])
        except Exception:
            analysis_data = {}
        history.append({
            'id': row['id'],
            'filename': row['filename'],
            'uploaded_at': row['uploaded_at'],
            'analysis': analysis_data
        })
    return history

def get_analysis(analysis_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, filename, uploaded_at, text_content, analysis_json FROM resumes WHERE id = ?", (analysis_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        try:
            analysis_data = json.loads(row['analysis_json'])
        except Exception:
            analysis_data = {}
        return {
            'id': row['id'],
            'filename': row['filename'],
            'uploaded_at': row['uploaded_at'],
            'text_content': row['text_content'],
            'analysis': analysis_data
        }
    return None

def delete_analysis(analysis_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM resumes WHERE id = ?", (analysis_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted
