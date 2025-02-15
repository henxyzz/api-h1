import sys
import cv2
import numpy as np
import rembg

# Ambil input dan output dari argument
input_path = sys.argv[1]
output_path = sys.argv[2]

# Buka video
cap = cv2.VideoCapture(input_path)
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out = cv2.VideoWriter(output_path, fourcc, cap.get(cv2.CAP_PROP_FPS), 
                      (int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))), True)

# Proses setiap frame
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break
    
    # Hapus background
    frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    removed_bg = rembg.remove(frame_rgb)
    
    # Simpan hasil
    out.write(cv2.cvtColor(removed_bg, cv2.COLOR_RGB2BGR))

cap.release()
out.release()
print("Done")
