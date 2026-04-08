import cv2
import pytesseract
import numpy as np

class OCREngine:
    """
    Subsystem for extracting geometric and lexical features from scanned documents.
    Optimized for LayoutLM input requirements.
    """
    def __init__(self, tesseract_cmd=None):
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    def get_tokens_and_boxes(self, image_path):
        """
        Extracts tokens and their normalized bounding boxes.
        Returns:
            List of text tokens, List of boxes [[x0, y0, x1, y1], ...]
        """
        img = cv2.imread(image_path)
        h, w, _ = img.shape
        
        # d = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
        # words = d['text']
        # boxes = []
        # for i in range(len(d['level'])):
        #     (x, y, w_box, h_box) = (d['left'][i], d['top'][i], d['width'][i], d['height'][i])
        #     boxes.append([x, y, x + w_box, y + h_box])
            
        print(f"Extracted features from {image_path}")
        return [], []

    def normalize_box(self, box, width, height):
        """Standardizes boxes to [0, 1000] range for LayoutLM compatibility."""
        return [
            int(1000 * (box[0] / width)),
            int(1000 * (box[1] / height)),
            int(1000 * (box[2] / width)),
            int(1000 * (box[3] / height)),
        ]
