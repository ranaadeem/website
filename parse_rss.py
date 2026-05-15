import xml.etree.ElementTree as ET
import json
import re
import sys

def strip_html(text):
    return re.sub(r'<[^>]+>', '', text or '').strip()

def clean_spaces(text):
    return re.sub(r'\s+', ' ', text).strip()

try:
    tree = ET.parse('feed.xml')
    root = tree.getroot()
except ET.ParseError as e:
    print(f"XML parse error: {e}")
    sys.exit(1)

ns = {'content': 'http://purl.org/rss/1.0/modules/content/'}

posts = []
for item in root.findall('.//item'):
    title   = item.findtext('title', '').strip()
    link    = item.findtext('link', '').strip()
    pubDate = item.findtext('pubDate', '').strip()
    desc    = item.findtext('description', '') or ''
    content = item.findtext('content:encoded', '', ns) or ''
    plain   = clean_spaces(strip_html(desc or content))
    posts.append({
        'title':   title,
        'link':    link,
        'pubDate': pubDate,
        'excerpt': plain[:300]
    })

with open('posts.json', 'w', encoding='utf-8') as f:
    json.dump(posts, f, ensure_ascii=False, indent=2)

print(f"SUCCESS: Saved {len(posts)} posts to posts.json")
for p in posts:
    print(f"  - {p['title']} ({p['pubDate']})")
