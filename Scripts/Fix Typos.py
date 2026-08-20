import csv
import re
import os

def fix_title(title):
    # 1. Fix missing spaces between lowercase and uppercase letters (e.g. Gandhi'sReturn -> Gandhi's Return)
    # Be careful not to break acronyms like "McCartney" or "O'Brien", but it's rare in Indian stamps.
    # We can use a regex: lowercase followed by Uppercase
    title = re.sub(r"([a-z])([A-Z])", r"\1 \2", title)
    
    # 2. Fix capitalization of common prepositions (In -> in, Of -> of, And -> and)
    # We do this for whole words only.
    words = title.split()
    lower_words = {'In', 'Of', 'And', 'The', 'For', 'To', 'On', 'With', 'By', 'At'}
    
    for i in range(1, len(words)): # Don't lower the very first word
        word_clean = re.sub(r'[^\w]', '', words[i]) # Strip punctuation for checking
        if word_clean in lower_words:
            # Replace exactly that word, preserving punctuation
            words[i] = words[i].replace(word_clean, word_clean.lower())
            
    title = ' '.join(words)
    
    # 3. Fix missing spaces around hyphens and ampersands
    title = title.replace(' & ', ' & ').replace('&', ' & ').replace('  ', ' ')
    
    # Clean up double spaces
    title = ' '.join(title.split())
    return title

def main():
    base_dir = '/Users/dipanshudaga/my projects/India in Stamps'
    enriched_path = os.path.join(base_dir, 'Stamps Enriched.csv')

    rows = []
    with open(enriched_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        for row in reader:
            if 'name' in row:
                row['name'] = fix_title(row['name'])
            rows.append(row)

    tmp_path = enriched_path + '.tmp'
    with open(tmp_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    os.replace(tmp_path, enriched_path)
    print("Successfully fixed spacing and casing typos in Stamps Enriched.csv!")

if __name__ == '__main__':
    main()
