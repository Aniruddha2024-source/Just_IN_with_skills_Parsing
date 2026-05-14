#!/usr/bin/env python
"""
Evaluate skill extraction predictions.

Usage:
  - If you already have predictions: provide a JSONL file where each line contains
    {"id":..., "gold": [..], "predicted": [..] }
  - If you only have gold text entries ({"id":..., "text":..., "gold": [...]})
    the script can call the simple `skill_extractor.py` to produce predictions
    and then compute metrics.

Examples:
  python evaluate_skills.py sample_gold.jsonl
  python evaluate_skills.py sample_gold.jsonl --call-extractor

Outputs JSON summary to stdout.
"""
import sys
import json
import argparse
import subprocess
from typing import List

def load_jsonl(path: str):
    items = []
    with open(path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            items.append(json.loads(line))
    return items

def normalize_skill(s: str) -> str:
    return s.strip().lower()

def set_metrics(gold_sets: List[List[str]], pred_sets: List[List[str]]):
    TP = 0
    FP = 0
    FN = 0
    exact_matches = 0
    jaccard_sum = 0.0

    for g, p in zip(gold_sets, pred_sets):
        gi = set(normalize_skill(x) for x in (g or []))
        pi = set(normalize_skill(x) for x in (p or []))
        inter = gi & pi
        union = gi | pi
        TP += len(inter)
        FP += len(pi - gi)
        FN += len(gi - pi)
        if gi == pi:
            exact_matches += 1
        jaccard_sum += (len(inter) / len(union)) if union else 1.0

    precision = TP / (TP + FP) if (TP + FP) else 0.0
    recall = TP / (TP + FN) if (TP + FN) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    exact_acc = exact_matches / len(gold_sets) if gold_sets else 0.0
    mean_jaccard = jaccard_sum / len(gold_sets) if gold_sets else 0.0
    return {
        "TP": TP, "FP": FP, "FN": FN,
        "precision": precision, "recall": recall, "f1": f1,
        "exact_match_accuracy": exact_acc, "mean_jaccard": mean_jaccard
    }

def call_extractor_on_file(input_path: str, extractor_path: str = 'skill_extractor.py'):
    # Runs the extractor and returns list of dicts with id,text,predicted,gold?
    cmd = [sys.executable, extractor_path, '--input', input_path]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        print(json.dumps({"error": f"Extractor failed: {e.stderr or e.stdout}"}))
        sys.exit(2)

    results = []
    for line in p.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            results.append(json.loads(line))
        except Exception:
            continue
    return results

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('input', help='input JSONL file with gold data (see README)')
    parser.add_argument('--call-extractor', action='store_true', help='call local skill_extractor.py to create predictions')
    parser.add_argument('--extractor-path', default='skill_extractor.py', help='path to skill_extractor.py')
    args = parser.parse_args()

    data = load_jsonl(args.input)

    # If entries already contain 'predicted', use them. Otherwise optionally call extractor.
    need_extraction = any('predicted' not in d for d in data)

    if args.call_extractor and need_extraction:
        # Write a temporary file with same input lines so extractor can read text
        import tempfile
        with tempfile.NamedTemporaryFile('w', delete=False, encoding='utf-8', suffix='.jsonl') as tf:
            tmp_path = tf.name
            for d in data:
                # ensure extractor has 'text' field
                out = { 'id': d.get('id'), 'text': d.get('text') or d.get('resume_text') or '' }
                if 'gold' in d:
                    out['gold'] = d['gold']
                tf.write(json.dumps(out, ensure_ascii=False) + "\n")

        extracted = call_extractor_on_file(tmp_path, args.extractor_path)
        # Merge predictions back into data preserving order by id if present
        pred_map = { (e.get('id') or i): e.get('predicted', []) for i,e in enumerate(extracted) }
        for i,d in enumerate(data):
            key = d.get('id') or i
            d['predicted'] = pred_map.get(key, [])

    # Prepare gold and predicted lists
    gold_sets = [d.get('gold', []) for d in data]
    pred_sets = [d.get('predicted', []) for d in data]

    summary = set_metrics(gold_sets, pred_sets)

    # Print human-friendly output
    print(json.dumps({ 'summary': summary, 'num_samples': len(data) }, indent=2))

if __name__ == '__main__':
    main()
