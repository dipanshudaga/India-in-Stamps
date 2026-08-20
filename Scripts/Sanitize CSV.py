import csv
import re
from datetime import datetime

input_file = '/Users/dipanshudaga/Downloads/Stamp collection.csv'
output_file = '/Users/dipanshudaga/Downloads/Stamp_collection_sanitized.csv'

def title_case(s):
    # basic title case
    words = s.split()
    lower_words = {'of', 'the', 'and', 'in', 'on', 'at', 'to', 'for', 'a', 'an'}
    res = []
    for i, w in enumerate(words):
        # preserve all-caps if it's an acronym maybe? No, let's just capitalize
        if i != 0 and w.lower() in lower_words:
            res.append(w.lower())
        else:
            res.append(w.capitalize())
    return ' '.join(res)

def clean_name(name):
    name = name.strip()
    if name.startswith('http'):
        # extract from url
        m = re.search(r'[^/]+\.jpg$', name, re.I)
        if m:
            name = m.group(0).replace('.jpg', '').replace('_', ' ')
        else:
            name = "Unknown Title"
    
    # remove 'set of X stamps'
    name = re.sub(r'\(?set of \d+ stamps?\)?', '', name, flags=re.I)
    
    # remove trailing dates like 14-4-76
    name = re.sub(r'\b\d{1,2}-\d{1,2}-\d{2,4}\b', '', name)
    
    # fix initials like B R Ambedkar -> B. R. Ambedkar
    name = re.sub(r'\b([A-Za-z])\s+([A-Za-z])\b', r'\1. \2.', name)
    # the above might match "A B" but also words. Let's be careful.
    # Better: single uppercase letter standing alone
    name = re.sub(r'\b([A-Z])\s+(?=[A-Z]\b|[A-Z][a-z])', r'\1. ', name)
    
    name = title_case(name)
    
    # fix roman numerals (xix, xx, etc.)
    def roman_upper(match):
        return match.group(0).upper()
    name = re.sub(r'\b(ii|iii|iv|vi|vii|viii|ix|xi|xii|xiii|xiv|xv|xvi|xvii|xviii|xix|xx|xxi)\b', roman_upper, name, flags=re.I)
    
    # fix colons after astrological signs
    name = re.sub(r'(Zodiac Signs?)\s+([A-Za-z]+)', r'\1: \2', name, flags=re.I)
    
    return re.sub(r'\s+', ' ', name).strip()

def clean_date(d):
    # try parsing
    d = d.replace(',', ' ').strip()
    d = re.sub(r'\s+', ' ', d)
    try:
        dt = datetime.strptime(d, "%d %B %Y")
        return f"{dt.day:02d}, {dt.strftime('%B')}, {dt.year}"
    except:
        return d

def clean_denom(val, year):
    # val can be comma separated e.g. "₹5, ₹25"
    if not val: return ''
    parts = val.split(',')
    res = []
    for p in parts:
        p = p.strip()
        if p.startswith('₹'):
            num_str = p[1:]
            try:
                num = float(num_str)
                if year and int(year) < 1957:
                    if num < 1.0:
                        # Convert back to annas
                        annas = num * 16
                        # round to nearest 0.5 or nice number
                        annas = round(annas * 2) / 2
                        res.append(f"{annas:g} Annas")
                    else:
                        res.append(f"₹{num:g}")
                else:
                    if num < 1.0:
                        # Convert to Paisa
                        paisa = round(num * 100)
                        res.append(f"{paisa} p")
                    else:
                        res.append(f"₹{num:g}")
            except:
                res.append(p)
        else:
            res.append(p)
    return ", ".join(res)

def generate_tags(name):
    tags = []
    nl = name.lower()
    if 'centenary' in nl or 'anniversary' in nl or 'jubilee' in nl: tags.append('Anniversary')
    if 'game' in nl or 'olympic' in nl or 'cup' in nl or 'sport' in nl: tags.append('Sports')
    if 'wild life' in nl or 'animal' in nl or 'bird' in nl or 'tiger' in nl or 'elephant' in nl: tags.append('Wildlife')
    if 'festival' in nl or 'diwali' in nl or 'christmas' in nl: tags.append('Festival')
    if 'university' in nl or 'college' in nl or 'school' in nl or 'institute' in nl: tags.append('Education')
    if 'conference' in nl or 'congress' in nl or 'summit' in nl: tags.append('Event')
    if 'flag' in nl or 'republic' in nl or 'independence' in nl: tags.append('National')
    
    # if no tags, maybe personality
    if not tags and len(name.split()) >= 2:
        tags.append('Personality')
    elif not tags:
        tags.append('Thematic')
        
    return ", ".join(tags[:3])

with open(input_file, 'r') as fin, open(output_file, 'w', newline='') as fout:
    reader = csv.DictReader(fin)
    fieldnames = reader.fieldnames
    if 'tags' not in fieldnames:
        fieldnames.append('tags')
    writer = csv.DictWriter(fout, fieldnames=fieldnames)
    writer.writeheader()
    
    for row in reader:
        # Check empty
        if not any(v.strip() for k,v in row.items() if v):
            continue
            
        row['name'] = clean_name(row.get('name', ''))
        row['issue_date'] = clean_date(row.get('issue_date', ''))
        year = row.get('year', '')
        row['denomination_inr'] = clean_denom(row.get('denomination_inr', ''), year)
        row['tags'] = generate_tags(row['name'])
        
        writer.writerow(row)

print("Done sanitizing")
