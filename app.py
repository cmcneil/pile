from flask import Flask, request, jsonify, send_from_directory, render_template
from werkzeug.utils import secure_filename
from pathlib import Path
import json
import os
import shutil

# Import our geometry processors
from effects.geometry.extractors.pointcloud_processor import extract_points
from effects.geometry.extractors.lineart_processor import extract_paths

app = Flask(__name__)

# Configure paths
BASE_DIR = Path(__file__).parent
ASSETS_DIR = BASE_DIR / 'assets'
IMAGES_DIR = ASSETS_DIR / 'images'
GEOMETRY_DIR = ASSETS_DIR / 'geometry'
SCENES_DIR = BASE_DIR / 'scenes' / 'configs'

# Ensure directories exist
IMAGES_DIR.mkdir(parents=True, exist_ok=True)
GEOMETRY_DIR.mkdir(parents=True, exist_ok=True)
SCENES_DIR.mkdir(parents=True, exist_ok=True)

# Configure allowed files
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/scene/<scene_id>')
def view_scene(scene_id):
    """Serve the scene viewer with a specific scene"""
    return render_template('index.html', scene_id=scene_id)

@app.route('/')
def serve_index():
    """Serve the scene viewer with default scene"""
    return render_template('index.html')

# Config tool routes
@app.route('/config')
def serve_tool():
    """Serve the configuration tool"""
    return send_from_directory('tools', 'config.html')

@app.route('/tools/<path:filename>')
def serve_tool_files(filename):
    return send_from_directory('tools', filename)

@app.route('/core/<path:filename>')
def serve_core_files(filename):
    return send_from_directory('core', filename)

@app.route('/effects/<path:filename>')
def serve_effects_files(filename):
    return send_from_directory('effects', filename)

@app.route('/scenes/<path:filename>')
def serve_scenes_files(filename):
    return send_from_directory('scenes', filename)

@app.route('/assets/<path:filename>')
def serve_assets(filename):
    return send_from_directory('assets', filename)

@app.route('/api/scenes', methods=['GET'])
def list_scenes():
    scenes = []
    for config_file in SCENES_DIR.glob('*.json'):
        with open(config_file) as f:
            scene_data = json.load(f)
            scenes.append({
                'id': scene_data['id'],
                'image': scene_data['image']['path']
            })
    return jsonify(scenes)

@app.route('/api/scenes/<scene_id>', methods=['GET'])
def get_scene(scene_id):
    config_path = SCENES_DIR / f"{scene_id}.json"
    if not config_path.exists():
        return jsonify({'error': 'Scene not found'}), 404
    
    with open(config_path) as f:
        return jsonify(json.load(f))

@app.route('/api/scenes', methods=['POST'])
def save_scene():
    scene_data = request.json
    scene_id = scene_data['id']
    
    # Handle geometry processing if needed
    if 'geometry' in scene_data['image']:
        image_path = IMAGES_DIR / scene_data['image']['path']
        geometry_type = scene_data['image']['geometry']['type']
        
        # Create geometry subdirectory if it doesn't exist
        geometry_subdir = GEOMETRY_DIR / geometry_type
        geometry_subdir.mkdir(exist_ok=True)
        
        # Generate geometry data
        if geometry_type == 'pointcloud':
            geometry_data = extract_points(
                str(image_path),
                num_points=10000,  # Could make these configurable
                edge_weight=0.8
            )
        elif geometry_type == 'lineart':
            geometry_data = extract_paths(str(image_path))
        else:
            return jsonify({'error': 'Unknown geometry type'}), 400
        
        # Save geometry data
        geometry_path = geometry_subdir / scene_data['image']['geometry']['data']
        with open(geometry_path, 'w') as f:
            json.dump(geometry_data, f)
    
    # Save scene config
    config_path = SCENES_DIR / f"{scene_id}.json"
    with open(config_path, 'w') as f:
        json.dump(scene_data, f, indent=2)
    
    return jsonify({'success': True})

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        save_path = IMAGES_DIR / filename
        
        # Save the file
        file.save(str(save_path))
        
        # Return the filename
        return jsonify({
            'success': True,
            'filename': filename
        })
    
    return jsonify({'error': 'Invalid file type'}), 400

@app.route('/api/geometry-types', methods=['GET'])
def get_geometry_types():
    """Return available geometry types and their options"""
    return jsonify({
        'pointcloud': {
            'name': 'Point Cloud',
            'description': 'Extracts points from image edges',
            'options': {
                'num_points': {
                    'type': 'number',
                    'default': 10000,
                    'min': 1000,
                    'max': 50000
                },
                'edge_weight': {
                    'type': 'number',
                    'default': 0.8,
                    'min': 0,
                    'max': 1
                }
            }
        },
        'lineart': {
            'name': 'Line Art',
            'description': 'Extracts vector lines from image'
        }
    })

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)