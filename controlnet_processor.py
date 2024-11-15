import cv2
import numpy as np
from PIL import Image
import json
from pathlib import Path
from controlnet_aux import LineartDetector
from controlnet_aux.util import HWC3
import torch


def save_features(features, output_path):
    with open(output_path, 'w') as f:
        json.dump({
            'levels': features
        }, f)

def process_image_hierarchical(image_path):
    # Load image
    image = cv2.imread(str(image_path))
    image = HWC3(image)
    original_height, original_width = image.shape[:2]
    original_aspect = original_width / original_height
    
    # Initialize detector
    lineart = LineartDetector.from_pretrained("lllyasviel/Annotators")
    
    resolutions = [512, 768, 1024]
    all_features = []
    debug_images = []
    
    # Get different levels of features using different thresholds
    with torch.no_grad():
        for detect_resolution in resolutions:
            # Calculate detection dimensions maintaining aspect ratio
            if original_width > original_height:
                detect_width = detect_resolution
                detect_height = int(detect_resolution / original_aspect)
            else:
                detect_height = detect_resolution
                detect_width = int(detect_resolution * original_aspect)
            
            # Get features at this resolution
            detected = lineart(image, 
                             detect_resolution=detect_resolution,
                             image_resolution=detect_resolution)
            detected = np.array(detected)
            
            if len(detected.shape) == 3:
                detected = cv2.cvtColor(detected, cv2.COLOR_RGB2GRAY)
            
            # Get actual dimensions of the detected image
            detected_height, detected_width = detected.shape[:2]
            
            # Scale factor to normalize back to original image size
            scale_x = original_width / detected_width
            scale_y = original_height / detected_height
            
            # Process paths and scale coordinates back to original size
            paths = extract_paths(
                detected,
                threshold=0.3,
                min_length=10 * (detect_resolution / 512),  # Scale min_length with resolution
                scale_x=scale_x,
                scale_y=scale_y
            )
            
            all_features.append(paths)
            debug_images.append(detected)
            
            print(f"Resolution {detect_resolution}:")
            print(f"Original dimensions: {original_width}x{original_height}")
            print(f"Detected dimensions: {detected_width}x{detected_height}")
            print(f"Scale factors: x={scale_x}, y={scale_y}")
    
    return all_features, debug_images

# Rest of the code remains the same...

def extract_paths(image, threshold=0.2, min_length=20, scale_x=1.0, scale_y=1.0):
    if len(image.shape) == 3:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
    
    image = image.astype(np.uint8)
    _, binary = cv2.threshold(image, int(threshold * 255), 255, cv2.THRESH_BINARY)
    
    # Remove small objects
    min_area = 50  # Adjust this threshold to control minimum object size
    nb_components, output, stats, centroids = cv2.connectedComponentsWithStats(binary, connectivity=8)
    sizes = stats[1:, -1]
    nb_components = nb_components - 1
    
    # Create a new image with only large enough components
    cleaned_binary = np.zeros((output.shape))
    for i in range(0, nb_components):
        if sizes[i] >= min_area:
            cleaned_binary[output == i + 1] = 255
    
    cleaned_binary = cleaned_binary.astype(np.uint8)
    
    # Find contours on cleaned image
    contours, _ = cv2.findContours(cleaned_binary, 
                                 cv2.RETR_LIST, 
                                 cv2.CHAIN_APPROX_NONE)
    
    paths = []
    for contour in contours:
        if cv2.arcLength(contour, False) > min_length:
            epsilon = 2.0
            approx = cv2.approxPolyDP(contour, epsilon, False)
            
            segments = []
            for i in range(len(approx) - 1):
                start = approx[i][0]
                end = approx[i + 1][0]
                segments.append({
                    'start': {
                        'x': float(start[0] * scale_x),
                        'y': float(start[1] * scale_y)
                    },
                    'end': {
                        'x': float(end[0] * scale_x),
                        'y': float(end[1] * scale_y)
                    }
                })
            
            if segments:
                paths.extend(segments)
    
    return paths

if __name__ == "__main__":
    image_path = "pile1.jpg"
    features, debug_images = process_image_hierarchical(image_path)
    
    # Save features
    save_features(features, "pile1_features.json")
    
    # Save debug images at different resolutions
    for i, debug_image in enumerate(debug_images):
        cv2.imwrite(f"debug_level_{i}.png", debug_image)
    
    print(f"Processed {len(features)} levels")
    for i, level in enumerate(features):
        print(f"Level {i} paths: {len(level)}")