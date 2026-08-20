import csv
import re
import os

def convert_anna_to_inr(val):
    if not val:
        return val
    
    val_str = str(val).strip()
    # Handle fractions like "1 1/2 Anna" or "1/2 Anna"
    if 'anna' in val_str.lower() or 'annas' in val_str.lower():
        num = 0.0
        # Check for fractions
        if '/' in val_str:
            parts = val_str.split()
            for p in parts:
                if '/' in p:
                    num_den = p.split('/')
                    if len(num_den) == 2 and num_den[0].isdigit() and num_den[1].isdigit():
                        num += float(num_den[0]) / float(num_den[1])
                elif p.isdigit():
                    num += float(p)
        else:
            match = re.search(r'([\d\.]+)', val_str)
            if match:
                num = float(match.group(1))
                
        if num > 0:
            inr_val = num / 16.0
            return f"{inr_val:.2f}"
    return val

def process_file(file_path):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, not found.")
        return
    
    print(f"Processing {file_path}...")
    rows = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if 'denomination_inr' in row:
                old_val = row['denomination_inr']
                new_val = convert_anna_to_inr(old_val)
                if old_val != new_val:
                    row['denomination_inr'] = new_val
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
    files = [
        'all_stamps_combined.csv',
        'all_stamps_combined_enriched.csv'
    ]
    
    for fname in files:
        process_file(os.path.join(base_dir, fname))

if __name__ == '__main__':
    main()
