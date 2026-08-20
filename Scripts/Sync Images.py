import csv
import os
import urllib.request
import ssl
import time

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {'User-Agent': 'Mozilla/5.0'}

csv_path = '/Users/dipanshudaga/Downloads/Stamp_collection_sanitized.csv'
images_dir = '/Users/dipanshudaga/Desktop/India_Postage_Stamps/stamps_images'

# Read CSV and collect expected images
expected_images = set()
rows_count = 0
missing_to_download = []

with open(csv_path, 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        rows_count += 1
        img_local = row.get('image_local', '')
        if img_local:
            expected_images.add(os.path.abspath(img_local))
            if not os.path.exists(img_local):
                missing_to_download.append((row['image_url'], img_local))

print(f"Total rows: {rows_count}")
print(f"Expected unique images: {len(expected_images)}")
print(f"Missing images to download: {len(missing_to_download)}")

# Download missing
for url, path in missing_to_download:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, context=ctx) as response, open(path, 'wb') as out:
            out.write(response.read())
        print(f"Downloaded {path}")
    except Exception as e:
        print(f"Failed {url}: {e}")
    time.sleep(0.5)

# Find existing images
existing_images = []
for root, _, files in os.walk(images_dir):
    for file in files:
        if file.lower().endswith(('.jpg', '.jpeg', '.png')):
            existing_images.append(os.path.abspath(os.path.join(root, file)))

# Delete duplicates/unused
unused_images = set(existing_images) - expected_images
print(f"Unused images found (duplicates/garbage): {len(unused_images)}")
for p in unused_images:
    os.remove(p)
    print(f"Removed unused: {p}")
