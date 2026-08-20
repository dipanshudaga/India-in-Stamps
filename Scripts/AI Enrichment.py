import csv
import json
import time
import os
import re
from google import genai
from google.genai import types

if not os.environ.get('GEMINI_API_KEY'):
    raise RuntimeError('Set GEMINI_API_KEY in your environment before running this script.')
client = genai.Client()

output_csv = '/Users/dipanshudaga/my projects/India in Stamps/Stamps Enriched.csv'

# Read existing enriched rows
rows = []
with open(output_csv, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    fieldnames = list(reader.fieldnames)
    rows = list(reader)

def process_batch(batch):
    prompt = "You are an expert on Indian History, Philately (Stamps), and General Knowledge.\n"
    prompt += "I will provide a JSON array of stamp records. For each stamp, provide:\n"
    prompt += "1. 'corrected_title': Fix casing, formatting, acronyms (e.g. 'iit (bhu)' to 'IIT (BHU)'). Do not change the fundamental meaning.\n"
    prompt += "2. 'description': A 1-2 sentence description explaining the historical context, person, or event.\n"
    prompt += "3. 'tags': A list of 1 to 3 highly relevant semantic tags (e.g. ['Wildlife', 'Conservation'], ['Personality', 'Freedom Fighter'], etc.).\n\n"
    prompt += "Respond ONLY with a valid JSON array of objects, containing exactly these keys: 'id', 'corrected_title', 'description', 'tags'.\n\n"
    
    input_data = []
    for i, r in enumerate(batch):
        input_data.append({
            "id": i,
            "title": r['name'],
            "year": r['year'],
            "type": r['type']
        })
    
    prompt += json.dumps(input_data)
    
    for attempt in range(5):
        try:
            response = client.models.generate_content(
                model='gemini-3.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2
                )
            )
            text = response.text
            match = re.search(r'\[.*\]', text, re.DOTALL)
            if match:
                json_str = match.group(0)
                results = json.loads(json_str)
                if len(results) == len(batch):
                    return results
            print("Failed to parse JSON properly, retrying...", flush=True)
        except Exception as e:
            print(f"API Error on attempt {attempt+1}: {e}", flush=True)
            if "429" in str(e):
                print("Hit rate limit. Sleeping for 30s...", flush=True)
                time.sleep(30)
        time.sleep(10)
    
    # Fallback if it completely fails
    print(f"BATCH COMPLETELY FAILED after 5 attempts.", flush=True)
    fallback = []
    for i, r in enumerate(batch):
        fallback.append({
            "id": i,
            "corrected_title": r['name'],
            "description": "Information not available.",
            "tags": r['tags'].split(', ') if r.get('tags') else ['General']
        })
    return fallback

BATCH_SIZE = 40

# First, fix any existing rows that have "Information not available."
fixed_count = 0
for i in range(0, len(rows), BATCH_SIZE):
    batch = rows[i:i+BATCH_SIZE]
    needs_processing = any(r['description'] == 'Information not available.' for r in batch)
    if needs_processing:
        print(f"Refixing batch starting at {i}...", flush=True)
        results = process_batch(batch)
        for r_in, r_out in zip(batch, results):
            # Keep original name: r_in['name'] remains unchanged
            r_in['description'] = r_out.get('description', '')
            tags_list = r_out.get('tags', [])
            if isinstance(tags_list, list):
                r_in['tags'] = ', '.join(tags_list)
            else:
                r_in['tags'] = str(tags_list)
        fixed_count += 1
        time.sleep(5)

# Then load the original CSV to process the rest
input_csv = '/Users/dipanshudaga/my projects/India in Stamps/Stamps Raw.csv'
original_rows = []
with open(input_csv, 'r', encoding='utf-8') as f:
    original_reader = csv.DictReader(f)
    for row in original_reader:
        if not row['name'].strip() and '04, October, 2004' in row['issue_date']:
            row['name'] = '150 Years of India Post'
        if not row['name'].strip() or row['name'].lower() == 'unknown title':
            row['name'] = os.path.basename(row['image_local']).replace('.jpg','').replace('.jpeg','').replace('_', ' ')
        original_rows.append(row)

remaining_rows = original_rows[len(rows):]
print(f"Fixed {fixed_count} batches. Remaining rows to process: {len(remaining_rows)}", flush=True)

# Process remaining
batches_processed = 0
for i in range(0, len(remaining_rows), BATCH_SIZE):
    if batches_processed >= 22:
        print("Reached 22 batches (~900 rows) daily limit. Exiting gracefully.", flush=True)
        break
        
    batch = remaining_rows[i:i+BATCH_SIZE]
    print(f"Processing new rows {i + len(rows)} to {i + len(rows) + len(batch) - 1}...", flush=True)
    results = process_batch(batch)
    
    for r_in, r_out in zip(batch, results):
        r_in['name'] = r_out.get('corrected_title', r_in['name'])
        r_in['description'] = r_out.get('description', '')
        tags_list = r_out.get('tags', [])
        if isinstance(tags_list, list):
            r_in['tags'] = ', '.join(tags_list)
        else:
            r_in['tags'] = str(tags_list)
            
        # Append to our in-memory list
        rows.append(r_in)
        
    # Overwrite the entire file incrementally to save progress (using atomic write)
    tmp_output = output_csv + '.tmp'
    with open(tmp_output, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    os.replace(tmp_output, output_csv)
    
    batches_processed += 1
    time.sleep(5)

print("Finished processing all rows!", flush=True)
