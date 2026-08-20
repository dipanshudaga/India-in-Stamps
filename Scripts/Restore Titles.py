import csv
import os

def main():
    base_dir = '/Users/dipanshudaga/my projects/India in Stamps'
    raw_csv = os.path.join(base_dir, 'Stamps Raw.csv')
    enriched_csv = os.path.join(base_dir, 'Stamps Enriched.csv')

    # Load all raw names by URL or ID (we can just use index since order should be identical)
    # But just in case, let's use the image_url as a unique key
    raw_names = {}
    with open(raw_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            raw_names[row['image_url']] = row['name']
            
    # Now update enriched CSV
    enriched_rows = []
    with open(enriched_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            url = row['image_url']
            if url in raw_names:
                row['name'] = raw_names[url]
            enriched_rows.append(row)
            
    # Save back safely
    tmp_path = enriched_csv + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(enriched_rows)
        
    os.replace(tmp_path, enriched_csv)
    print("Titles successfully restored!")

if __name__ == '__main__':
    main()
