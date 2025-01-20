import cv2
import numpy as np

# Load and display image
img = cv2.imread('assets/images/pile1.jpg')
if img is None:
    print("Error: Could not load image")
else:
    print("Image loaded successfully")
    print("Image shape:", img.shape) 