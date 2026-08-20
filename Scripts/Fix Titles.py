import csv
import os

def fix_titles():
    base_dir = '/Users/dipanshudaga/my projects/India in Stamps'
    collection_path = os.path.join(base_dir, 'Stamp collection.csv')
    raw_path = os.path.join(base_dir, 'Stamps Raw.csv')
    enriched_path = os.path.join(base_dir, 'Stamps Enriched.csv')

    # Load better-cased names from Stamp collection.csv
    better_names = []
    with open(collection_path, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.DictReader(f)
        for row in reader:
            better_names.append(row['name'])

    # Fix specific broken ones manually in the list
    # Row 1590 (index 1589) is empty -> '150 Years of India Post'
    # Row 2594 (index 2593) is 'India_iran5.jpg' -> 'India-Iran Joint Issue'
    if not better_names[1589].strip():
        better_names[1589] = '150 Years of India Post'
    if 'India_Iran' in better_names[2593] or 'India_iran' in better_names[2593]:
        better_names[2593] = 'India-Iran Joint Issue'

    # Apply to Stamps Raw.csv and Stamps Enriched.csv
    for filepath in [raw_path, enriched_path]:
        rows = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            for i, row in enumerate(reader):
                if i < len(better_names):
                    row['name'] = better_names[i]
                rows.append(row)

        tmp_path = filepath + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp_path, filepath)
        print(f"Successfully updated titles in {os.path.basename(filepath)}")

if __name__ == '__main__':
    fix_titles()
