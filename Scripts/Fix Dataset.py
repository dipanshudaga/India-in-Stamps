import csv
import os
import re

anna_map = {
    '0.06': '1 Anna',
    '0.09': '1.5 Annas',
    '0.12': '2 Annas',
    '0.19': '3 Annas',  # Just in case 3 Annas exists
    '0.22': '3.5 Annas',
    '0.25': '4 Annas',
    '0.28': '4.5 Annas',
    '0.38': '6 Annas',
    '0.50': '8 Annas',
    '0.75': '12 Annas',
    '0.88': '14 Annas'
}

def fix_image_path(path_str):
    # Old path: /Users/dipanshudaga/Desktop/Indian Postage Stamps/stamps_images/1947/...
    # New path: /Users/dipanshudaga/my projects/India in Stamps/Stamps Images/1947/...
    # Let's just find the part after stamps_images/ or Stamps Images/ and build a clean absolute path.
    if not path_str:
        return path_str
        
    # Replace backward slashes with forward slashes if any
    path_str = path_str.replace('\\', '/')
    
    # Try to extract the year and filename part
    match = re.search(r'(stamps_images|Stamps Images)/(.+)$', path_str)
    if match:
        relative_part = match.group(2)
        return f"/Users/dipanshudaga/my projects/India in Stamps/Stamps Images/{relative_part}"
    
    return path_str

def process_file(file_path, is_raw):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        return
    
    print(f"Processing {file_path}...")
    rows = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames)
        
        if is_raw and 'tags' in fieldnames:
            fieldnames.remove('tags')
            
        for row in reader:
            # 1. Fix broken image paths
            if 'image_local' in row:
                row['image_local'] = fix_image_path(row['image_local'])
                
            # 2. Raw File Reversions
            if is_raw:
                # Remove tags
                if 'tags' in row:
                    del row['tags']
                    
                # Revert Annas for years <= 1957
                if 'year' in row and 'denomination_inr' in row:
                    try:
                        year = int(row['year'])
                        if year <= 1957:
                            val = str(row['denomination_inr']).strip()
                            if val in anna_map:
                                row['denomination_inr'] = anna_map[val]
                    except ValueError:
                        pass
                        
            rows.append(row)
            
    tmp_path = file_path + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    os.replace(tmp_path, file_path)
    print(f"Finished {file_path}.")

def main():
    base_dir = '/Users/dipanshudaga/my projects/India in Stamps'
    raw = os.path.join(base_dir, 'Stamps Raw.csv')
    enriched = os.path.join(base_dir, 'Stamps Enriched.csv')
    
    process_file(raw, is_raw=True)
    process_file(enriched, is_raw=False)

if __name__ == '__main__':
    main()
