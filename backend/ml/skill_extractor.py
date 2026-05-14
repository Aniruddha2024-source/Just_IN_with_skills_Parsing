#!/usr/bin/env python
"""
Simple rule-based skill extractor.
Input: JSON lines from stdin or via --input file with each entry containing `id` and `text`.
Output: JSON lines to stdout with `id`, `text`, and `predicted` (list of skills).

This extractor uses an internal vocabulary (can be extended) and simple token matching.
"""
import sys
import json
import argparse
import re

# Small default skills vocabulary. Extend as needed by passing --skills-file (one-per-line).
DEFAULT_SKILLS = [
    "python", "java", "javascript", "typescript", "react", "node", "django",
    "flask", "sql", "postgresql", "mysql", "aws", "azure", "docker", "kubernetes",
    "pandas", "numpy", "scikit-learn", "tensorflow", "keras", "git", "gitlab",
    "spark", "hadoop", "html", "css", "mongodb", "redis"
]

def load_skills_file(path):
    skills = []
    try:
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                s = line.strip()
                if s:
                    skills.append(s.lower())
    except Exception:
        pass
    return skills

def normalize(text):
    return text.lower()

def extract_from_text(text, skills_vocab):
    if not text:
        return []
    t = normalize(text)
    found = set()
    # Word boundary match for each skill (escape special chars)
    for skill in skills_vocab:
        if not skill:
            continue
        pattern = r"\b" + re.escape(skill.lower()) + r"\b"
        if re.search(pattern, t):
            found.add(skill)
    # Also try to split comma-separated skills like "Skills: a, b, c"
    m = re.search(r"skills?[:\-]\s*(.+)$", text, flags=re.IGNORECASE)
    if m:
        tail = m.group(1)
        parts = re.split(r",|;|\\n", tail)
        for p in parts:
            p = p.strip()
            if not p:
                continue
            pn = p.lower()
            # if part contains multi-word token, try to match any vocab skill inside it
            for skill in skills_vocab:
                if skill in pn:
                    found.add(skill)
    return sorted(found)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', '-i', help='input JSONL file (each line: {"id":"...","text":"...","gold":[...]})')
    parser.add_argument('--skills-file', help='optional skills file (one skill per line)')
    args = parser.parse_args()

    skills_vocab = DEFAULT_SKILLS.copy()
    if args.skills_file:
        skills_vocab = load_skills_file(args.skills_file) or skills_vocab

    def process_item(item):
        text = item.get('text') or item.get('resume_text') or ''
        preds = extract_from_text(text, skills_vocab)
        out = {
            'id': item.get('id') or item.get('resume_id') or item.get('name') or None,
            'text': text,
            'predicted': preds
        }
        # Preserve gold if present
        if 'gold' in item:
            out['gold'] = item['gold']
        return out

    if args.input:
        with open(args.input, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                except Exception:
                    continue
                print(json.dumps(process_item(item), ensure_ascii=False))
    else:
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except Exception:
                continue
            print(json.dumps(process_item(item), ensure_ascii=False))

if __name__ == '__main__':
    main()
