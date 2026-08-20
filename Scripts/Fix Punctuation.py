import csv
import os

replacements = {
    "Purandaradasa 15/16th Century": "Purandaradasa 15-16th Century",
    "Indian Locomotives: F/1 1895": "Indian Locomotives: F-1 1895",
    "Indian Locomotives: WP/1 1963": "Indian Locomotives: WP-1 1963",
    "Kgmc/Csmmu, Lucknow, Academic Centenary Year": "KGMC - CSMMU, Lucknow, Academic Centenary Year",
    "Millepex 2000 - Endangered Species: Turtles- Batagur Terrapin & Olive Ridley": "Millepex 2000 - Endangered Species: Turtles - Batagur Terrapin & Olive Ridley",
    "India Israel- Joint Issue Festival of Lights - Deepavali": "India-Israel Joint Issue: Festival of Lights - Deepavali",
    "India Israel- Joint Issue Festival of Lights - Hanukkah": "India-Israel Joint Issue: Festival of Lights - Hanukkah",
    "Nabakalebara -2015": "Nabakalebara - 2015",
    "Valour & Sacrifice- 1965 War": "Valour & Sacrifice - 1965 War",
    "Allahabad High Court- Lucknow Bench": "Allahabad High Court - Lucknow Bench",
    "Icar- Central Plantation Crops Research Institute": "ICAR - Central Plantation Crops Research Institute"
}

def fix_punctuation():
    base_dir = '/Users/dipanshudaga/my projects/India in Stamps'
    raw_path = os.path.join(base_dir, 'Stamps Raw.csv')
    enriched_path = os.path.join(base_dir, 'Stamps Enriched.csv')

    for filepath in [raw_path, enriched_path]:
        rows = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            fieldnames = reader.fieldnames
            for row in reader:
                name = row['name']
                if name in replacements:
                    row['name'] = replacements[name]
                rows.append(row)

        tmp_path = filepath + '.tmp'
        with open(tmp_path, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(rows)
        os.replace(tmp_path, filepath)
        print(f"Successfully fixed punctuation in {os.path.basename(filepath)}")

if __name__ == '__main__':
    fix_punctuation()
