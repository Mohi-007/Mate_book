import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'matebook.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("SELECT id, username, email FROM users;")
    rows = cursor.fetchall()
    print(f"Users found: {len(rows)}")
    for row in rows:
        print(f"ID: {row[0]}, Username: {row[1]}, Email: {row[2]}")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
