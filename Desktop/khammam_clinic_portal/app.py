from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3
import datetime

app = Flask(__name__)
CORS(app)

# SQLite Database Initialization
DB_NAME = "clinic_appointments.db"

def init_db():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS appointments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_name TEXT NOT NULL,
            patient_phone TEXT NOT NULL,
            doctor_name TEXT NOT NULL,
            speciality TEXT NOT NULL,
            booking_date TEXT NOT NULL,
            booking_time TEXT NOT NULL,
            notes TEXT,
            status TEXT DEFAULT 'Confirmed',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/api/book-appointment', methods=['POST'])
def book_appointment():
    try:
        data = request.get_json()
        name = data.get('name')
        phone = data.get('phone')
        doctor = data.get('doctor')
        speciality = data.get('speciality')
        date = data.get('date')
        time = data.get('time')
        notes = data.get('notes', '')

        if not all([name, phone, doctor, speciality, date, time]):
            return jsonify({'success': False, 'message': 'All required fields must be filled.'}), 400

        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO appointments (patient_name, patient_phone, doctor_name, speciality, booking_date, booking_time, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, phone, doctor, speciality, date, time, notes))
        conn.commit()
        booking_id = cursor.lastrowid
        conn.close()

        return jsonify({
            'success': True,
            'message': 'Appointment booked successfully!',
            'booking_id': booking_id
        }), 201

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# View all bookings (for clinic admin/receptionist)
@app.route('/api/appointments', methods=['GET'])
def get_appointments():
    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM appointments ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()

    appointments = []
    for r in rows:
        appointments.append({
            'id': r[0],
            'name': r[1],
            'phone': r[2],
            'doctor': r[3],
            'speciality': r[4],
            'date': r[5],
            'time': r[6],
            'notes': r[7],
            'status': r[8],
            'created_at': r[9]
        })

    return jsonify(appointments)

if __name__ == '__main__':
    app.run(debug=True, port=5000)