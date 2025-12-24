import cv2
import os
import argparse
import json
import sys

# Ensure backend is in the path
sys.path.append(os.getcwd())

from backend.services.ocr_service import preprocess_image, extract_information, analyze_information

def main():
    parser = argparse.ArgumentParser(description="Fine-tune OCR thresholds and verify Mistral extraction.")
    parser.add_argument("--image", type=str, default="tests/fixtures/test_receipt2.png", help="Path to the test receipt image.")
    parser.add_argument("--t1", type=int, default=100, help="Threshold 1 (Binary Thresholding)")
    parser.add_argument("--t2", type=int, default=200, help="Threshold 2 (Contour Area Thresholding)")
    parser.add_argument("--output", type=str, default="tests/outputs/filtered_image.png", help="Path to save the filtered image.")
    parser.add_argument("--no-mistral", action="store_true", help="Skip Mistral extraction step.")

    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"Error: Image not found at {args.image}")
        return

    print(f"--- OCR Fine-Tuning ---")
    print(f"Image: {args.image}")
    print(f"Threshold 1: {args.t1}")
    print(f"Threshold 2: {args.t2}")
    print(f"Output: {args.output}")
    print("-----------------------")

    # Load image
    image = cv2.imread(args.image)
    if image is None:
        print("Error: Could not decode image.")
        return

    # 1. Preprocess
    print("Preprocessing image...")
    filtered = preprocess_image(image, args.t1, args.t2, save_path=args.output)
    print(f"Filtered image saved to {args.output}")

    # 2. OCR
    print("Extracting text (Tesseract)...")
    raw_text = extract_information(filtered)
    print("\n=== RAW OCR TEXT ===")
    print(raw_text if raw_text.strip() else "[No text extracted]")
    print("====================\n")

    # 3. Mistral
    if not args.no_mistral:
        if "MISTRAL_API_KEY" not in os.environ:
            print("Warning: MISTRAL_API_KEY not set. Skipping Mistral extraction.")
        elif not raw_text.strip():
            print("Skipping Mistral extraction because no text was found.")
        else:
            print("Analyzing text with Mistral AI...")
            structured_data = analyze_information(raw_text)
            print("\n=== MISTRAL STRUCTURED DATA ===")
            print(json.dumps(structured_data, indent=2))
            print("===============================\n")

if __name__ == "__main__":
    main()
