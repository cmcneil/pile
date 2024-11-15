import cv2
import numpy as np
import json
from pathlib import Path

def process_image(image_path):
    # Read the image
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Apply more subtle bilateral filter
    filtered = cv2.bilateralFilter(gray, 5, 50, 50)
    
    # Get edges using Canny with more sensitive thresholds
    edges = cv2.Canny(filtered, 30, 150)
    
    # Slight dilation to connect very close lines
    kernel = np.ones((2,2), np.uint8)
    edges = cv2.dilate(edges, kernel, iterations=1)
    
    # Find contours with more detail preservation
    contours, hierarchy = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_TC89_L1)
    
    # Process contours into a format suitable for PixiJS
    processed_contours = []
    min_contour_length = 20  # Reduced minimum length to capture more detail
    
    height, width = img.shape[:2]
    border_margin = 5  # Pixels to ignore around the border
    
    for contour in contours:
        # Skip contours that are too close to the border
        if np.any(contour[:, 0, 0] < border_margin) or \
           np.any(contour[:, 0, 0] > width - border_margin) or \
           np.any(contour[:, 0, 1] < border_margin) or \
           np.any(contour[:, 0, 1] > height - border_margin):
            continue
            
        # Only process contours that are long enough
        if cv2.arcLength(contour, True) > min_contour_length:
            # Use much gentler simplification
            epsilon = 0.001 * cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, epsilon, True)
            
            # Convert to list of points
            points = []
            for point in approx:
                x, y = point[0]
                points.append({'x': int(x), 'y': int(y)})
            
            if len(points) > 2:  # Only include contours with at least 3 points
                processed_contours.append(points)
    
    # Get dimensions
    result = {
        'dimensions': {'width': width, 'height': height},
        'contours': processed_contours
    }
    
    # Save to JSON
    output_path = Path(image_path).with_suffix('.json')
    with open(output_path, 'w') as f:
        json.dump(result, f)
    
    print(f"Processed {len(processed_contours)} contours")
    return result

if __name__ == "__main__":
    # Example usage
    process_image("pile1.jpg")