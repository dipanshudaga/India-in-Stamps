import csv
import re

raw_path = "/Users/dipanshudaga/my projects/India in Stamps/Stamps Raw.csv"
enriched_path = "/Users/dipanshudaga/my projects/India in Stamps/Stamps Enriched.csv"

def convert_denomination(raw_val):
    if not raw_val:
        return ""
    
    parts = [p.strip() for p in raw_val.split(',')]
    converted_parts = []
    
    for part in parts:
        if not part:
            continue
            
        part_lower = part.lower()
        
        # Annas
        if 'anna' in part_lower:
            num_match = re.search(r'([\d.]+)', part)
            if num_match:
                num = float(num_match.group(1))
                val = num / 16.0
                val_str = f"{val:.3f}".rstrip('0').rstrip('.')
                converted_parts.append(val_str)
            else:
                converted_parts.append(part)
                
        # Paise (p)
        elif ' p' in part_lower:
            num_match = re.search(r'([\d.]+)', part)
            if num_match:
                num = float(num_match.group(1))
                val = num / 100.0
                val_str = f"{val:.2f}".rstrip('0').rstrip('.')
                if not val_str:
                    val_str = "0"
                converted_parts.append(val_str)
            else:
                converted_parts.append(part)
                
        # Rupees (₹)
        elif '₹' in part:
            num_match = re.search(r'([\d.]+)', part)
            if num_match:
                num = float(num_match.group(1))
                val_str = f"{num:g}"
                converted_parts.append(val_str)
            else:
                converted_parts.append(part)
                
        # Default
        else:
            num_match = re.search(r'([\d.]+)', part)
            if num_match:
                converted_parts.append(f"{float(num_match.group(1)):g}")
            else:
                converted_parts.append(part)
                
    return ", ".join(converted_parts)

raw_data = []
with open(raw_path, 'r', encoding='utf-8') as f:
    raw_data = list(csv.DictReader(f))

enriched_data = []
fieldnames = []
with open(enriched_path, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    enriched_data = list(reader)

changes = 0
for raw_row, enriched_row in zip(raw_data, enriched_data):
    raw_denom = raw_row.get('denomination_inr', '')
    converted = convert_denomination(raw_denom)
    
    if enriched_row.get('denomination_inr') != converted:
        enriched_row['denomination_inr'] = converted
        changes += 1

with open(enriched_path, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(enriched_data)

print(f"Updated {changes} rows with converted denominations.")

print("\nSample Conversions:")
test_cases = ['3.5 Annas', '15 p', '₹5', '₹5, ₹4', '₹1.5', '90 p', '₹10']
for t in test_cases:
    print(f"{t} -> {convert_denomination(t)}")
