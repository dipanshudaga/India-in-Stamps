import csv
import os
import urllib.request
import urllib.parse
import json
import time

def search_wikipedia(query):
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={urllib.parse.quote(query)}&utf8=&format=json"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'IndiaStampsProjectBot/1.0 (dipanshudaga@example.com)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())
            search_results = data.get('query', {}).get('search', [])
            if search_results:
                return search_results[0]['title']
    except Exception as e:
        print(f"  Wiki Search Error: {e}")
    return None

def get_page_image(title):
    url = f"https://en.wikipedia.org/w/api.php?action=query&titles={urllib.parse.quote(title)}&prop=pageimages&format=json&pithumbsize=800"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'IndiaStampsProjectBot/1.0 (dipanshudaga@example.com)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read())
            pages = data.get('query', {}).get('pages', {})
            for page_id, page_info in pages.items():
                if 'thumbnail' in page_info:
                    return page_info['thumbnail']['source']
    except Exception as e:
        print(f"  Wiki Image Error: {e}")
    return None

def download_image(url, save_path):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'IndiaStampsProjectBot/1.0 (dipanshudaga@example.com)'})
        with urllib.request.urlopen(req, timeout=10) as response:
            with open(save_path, 'wb') as f:
                f.write(response.read())
        return True
    except Exception as e:
        print(f"  Download Error: {e}")
        return False

def main():
    base_dir = '/Users/dipanshudaga/my projects/India in Stamps'
    raw_path = os.path.join(base_dir, 'Stamps Raw.csv')

    rows = []
    with open(raw_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    missing_count = 0
    success_count = 0

    for row in rows:
        local_path = row.get('image_local', '')
        if local_path and not os.path.exists(local_path):
            missing_count += 1
            name = row.get('name', '')
            year = row.get('year', '')
            print(f"\n[{missing_count}/53] Missing: {name} ({year})")
            
            # Ensure directory exists
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            # Try to fetch from Wikipedia
            query = f"{name} stamp India"
            page_title = search_wikipedia(query)
            
            if page_title:
                img_url = get_page_image(page_title)
                if img_url:
                    print(f"  Found image on Wiki: {img_url}")
                    if download_image(img_url, local_path):
                        print(f"  ✅ Successfully downloaded.")
                        success_count += 1
                        time.sleep(3) # Wait 3 seconds to avoid rate limit
                        continue
            
            print(f"  ❌ Failed to find or download.")
            time.sleep(3) # Wait 3 seconds on fail to avoid rate limit

    print(f"\n--- Finished ---")
    print(f"Successfully recovered {success_count} out of 53 missing images.")

if __name__ == '__main__':
    main()
