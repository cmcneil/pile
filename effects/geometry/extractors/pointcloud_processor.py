import cv2
import numpy as np
import json
from pathlib import Path
from controlnet_aux import LineartDetector, HEDdetector
from controlnet_aux.util import HWC3
import torch
import os
import sys

def extract_points(image_path, num_points=5000, detect_resolution=512):
    """
    Extract points using HED edge detection.
    """
    # Read image
    image = cv2.imread(str(image_path))
    image = HWC3(image)
    original_height, original_width = image.shape[:2]
    
    # Calculate detection dimensions maintaining aspect ratio
    if original_width > original_height:
        detect_width = detect_resolution
        detect_height = int(detect_resolution * original_height / original_width)
    else:
        detect_height = detect_resolution
        detect_width = int(detect_resolution * original_width / original_height)

    print(f"Detection dimensions: {detect_width}x{detect_height}")
    
    # Initialize HED detector
    hed = HEDdetector.from_pretrained("lllyasviel/Annotators")
    
    # Get edge detection
    with torch.no_grad():
        hed_detection = hed(image, detect_resolution=detect_width, image_resolution=detect_width)
    
    # Convert to numpy array and ensure grayscale
    hed_detection = np.array(hed_detection)
    if len(hed_detection.shape) == 3:
        hed_detection = cv2.cvtColor(hed_detection, cv2.COLOR_RGB2GRAY)
    
    # Resize to detection dimensions
    hed_detection = cv2.resize(hed_detection, (detect_width, detect_height))
    
    # Normalize and enhance edges
    prob_map = hed_detection / 255.0
    # Enhance contrast to make edges more prominent
    prob_map = np.power(prob_map, 0.7)  # Adjust power for edge enhancement
    
    # Normalize probability map
    prob_map = prob_map / prob_map.sum()
    
    # Flatten for sampling
    flat_prob = prob_map.flatten()
    indices = np.arange(len(flat_prob))
    
    # Sample points based on probability
    sampled_indices = np.random.choice(
        indices, 
        size=num_points, 
        p=flat_prob,
        replace=True
    )
    
    # Convert indices back to 2D coordinates in detection resolution
    y_coords = sampled_indices // detect_width
    x_coords = sampled_indices % detect_width
    
    # Scale coordinates back to original image size
    scale_x = original_width / detect_width
    scale_y = original_height / detect_height
    
    # Create points list with scaled coordinates
    points = [
        {
            "x": float(x * scale_x),
            "y": float(y * scale_y)
        }
        for x, y in zip(x_coords, y_coords)
    ]
    
    # Save debug visualizations
    cv2.imwrite('debug_hed.png', (hed_detection).astype(np.uint8))
    cv2.imwrite('debug_prob_map.png', (prob_map * 255).astype(np.uint8))
    
    # Create visualization of point distribution
    point_viz = np.zeros((original_height, original_width), dtype=np.uint8)
    for point in points:
        cv2.circle(point_viz, 
                  (int(point['x']), int(point['y'])), 
                  1, 255, -1)
    cv2.imwrite('debug_points.png', point_viz)
    
    return {
        "points": points,
        "dimensions": {
            "width": original_width,
            "height": original_height
        }
    }


if __name__ == "__main__":
    image_path = sys.argv[1]
    fname = os.path.basename(image_path).split('.')[0]
    output_path = Path(f"assets/geometry/pointcloud/{fname}.json")
    
    # Create output directory if it doesn't exist
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Extract and save points
    point_data = extract_points(
        image_path,
        num_points=2500,  # Increased point count
        # edge_weight=0.8,    # Strong emphasis on edges
        detect_resolution=768
    )
    
    with open(output_path, 'w') as f:
        json.dump(point_data, f)