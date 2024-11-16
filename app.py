from flask import Flask, send_file, send_from_directory
from pathlib import Path
import os

app = Flask(__name__)

# Assuming your files are in the same directory as this script
BASE_DIR = Path(__file__).parent

@app.route('/')
def serve_html():
    return send_file('index.html')

@app.route('/<path:filename>')
def serve_file(filename):
    return send_file(filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)