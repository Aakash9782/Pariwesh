import re
import base64
import io
import os
import sys
from PIL import Image

def run():
    target_path = '../client/public/favicon.svg'
    if not os.path.exists(target_path):
        target_path = 'client/public/favicon.svg'
    if not os.path.exists(target_path):
        target_path = 'favicon.svg'
        
    print(f"Loading favicon from: {os.path.abspath(target_path)}")
    with open(target_path, 'r', encoding='utf-8') as f:
        data = f.read()

    # Find all base64 PNG data URLs
    # Search for both xlink:href and href
    pattern = r'(xlink:href|href)="data:image/png;base64,([A-Za-z0-9+/=\s\n\r]+)"'
    
    # We find all matches first
    matches = list(re.finditer(pattern, data))
    print(f"Found {len(matches)} image base64 blocks to process.")

    # Process matches in reverse order so string slicing index remains correct
    for i, match in reversed(list(enumerate(matches))):
        attr_name = match.group(1)
        b64_str = match.group(2).replace('\n', '').replace('\r', '').replace(' ', '')
        
        try:
            img_bytes = base64.b64decode(b64_str)
            img = Image.open(io.BytesIO(img_bytes))
            w, h = img.size
            
            # Constrain to 96px for high quality browser display as favicon
            max_dim = 96
            if w > max_dim or h > max_dim:
                ratio = min(max_dim / w, max_dim / h)
                nw, nh = int(w * ratio), int(h * ratio)
                if nw < 1: nw = 1
                if nh < 1: nh = 1
                
                img_resized = img.resize((nw, nh), Image.Resampling.LANCZOS)
                out_buf = io.BytesIO()
                img_resized.save(out_buf, format='PNG', optimize=True)
                new_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')
                
                new_attr_val = f'{attr_name}="data:image/png;base64,{new_b64}"'
                
                # Replace in the document string using slice
                start, end = match.span()
                data = data[:start] + new_attr_val + data[end:]
                print(f"Image {i+1}: Resized from {w}x{h} to {nw}x{nh}")
            else:
                print(f"Image {i+1}: Kept original size {w}x{h} (below threshold)")
        except Exception as e:
            print(f"Error processing image {i+1}: {e}")

    with open(target_path, 'w', encoding='utf-8') as f:
        f.write(data)
        
    final_size = os.path.getsize(target_path) / 1024
    print(f"Successfully wrote optimized favicon.svg! Final size: {final_size:.2f} KB")

if __name__ == '__main__':
    run()
