#!/usr/bin/env python
"""
Batch evaluate skill extraction on multiple resumes.

Input: JSON file with array of resume objects:
[
  {"id": "resume1", "text": "...", "gold": ["python", "sql"]},
  {"id": "resume2", "text": "...", "gold": ["java", "aws"]},
  ...
]

Or JSONL where each line is one resume object.

Output: JSON with per-resume metrics and aggregate summary.

Usage:
  python batch_evaluate.py resumes.json
  python batch_evaluate.py resumes.jsonl --format jsonl
  python batch_evaluate.py resumes.json --call-extractor
"""

import sys
import json
import argparse
import subprocess
import tempfile
import os
from typing import List, Dict

def load_json(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

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

def compute_metrics(gold_list: List[str], pred_list: List[str]) -> Dict:
    gold = set(normalize_skill(x) for x in (gold_list or []))
    pred = set(normalize_skill(x) for x in (pred_list or []))
    inter = gold & pred
    TP = len(inter)
    FP = len(pred - gold)
    FN = len(gold - pred)
    precision = TP / (TP + FP) if (TP + FP) else 0.0
    recall = TP / (TP + FN) if (TP + FN) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    union = gold | pred
    jaccard = len(inter) / len(union) if union else 1.0
    return {
        "TP": TP, "FP": FP, "FN": FN,
        "precision": precision, "recall": recall, "f1": f1, "jaccard": jaccard
    }

def call_extractor(items: List[Dict], extractor_path: str = 'skill_extractor.py'):
    # write items to temp file
    with tempfile.NamedTemporaryFile('w', delete=False, encoding='utf-8', suffix='.jsonl') as tf:
        tmp_path = tf.name
        for item in items:
            out = {
                'id': item.get('id') or item.get('resume_id'),
                'text': item.get('text') or item.get('resume_text') or ''
            }
            if 'gold' in item:
                out['gold'] = item['gold']
            tf.write(json.dumps(out, ensure_ascii=False) + '\n')

    cmd = [sys.executable, extractor_path, '--input', tmp_path]
    try:
        p = subprocess.run(cmd, capture_output=True, text=True, check=True)
    except subprocess.CalledProcessError as e:
        print(json.dumps({"error": f"Extractor failed: {e.stderr or e.stdout}"}), file=sys.stderr)
        sys.exit(2)
    finally:
        try:
            os.unlink(tmp_path)
        except:
            pass

    results = []
    for line in p.stdout.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            results.append(json.loads(line))
        except:
            continue
    return results

def main():
    parser = argparse.ArgumentParser(description='Batch evaluate skill extraction')
    parser.add_argument('input', help='Input JSON or JSONL file with resume data')
    parser.add_argument('--format', choices=['json', 'jsonl'], default='json', help='Input format')
    parser.add_argument('--call-extractor', action='store_true', help='Call skill_extractor.py to get predictions')
    parser.add_argument('--extractor-path', default='skill_extractor.py', help='Path to skill extractor')
    parser.add_argument('--output', help='Optional output JSON file for detailed results')
    args = parser.parse_args()

    # Load input
    if args.format == 'jsonl':
        items = load_jsonl(args.input)
    else:
        data = load_json(args.input)
        if isinstance(data, list):
            items = data
        else:
            items = data.get('resumes') or data.get('items') or []

    if not items:
        print(json.dumps({"error": "No resumes found in input"}))
        sys.exit(1)

    # If predictions not present, call extractor
    need_extraction = any('predicted' not in d for d in items)
    if args.call_extractor and need_extraction:
        extracted = call_extractor(items, args.extractor_path)
        # merge predictions back by id
        pred_map = {(e.get('id') or i): e.get('predicted', []) for i, e in enumerate(extracted)}
        for i, item in enumerate(items):
            key = item.get('id') or i
            item['predicted'] = pred_map.get(key, [])

    # Compute per-resume metrics
    results = []
    for item in items:
        gold = item.get('gold', [])
        pred = item.get('predicted', [])
        m = compute_metrics(gold, pred)
        results.append({
            "id": item.get('id'),
            "gold": gold,
            "predicted": pred,
            "metrics": m
        })

    # Aggregate metrics (micro-average: sum TP/FP/FN then compute)
    total_TP = sum(r['metrics']['TP'] for r in results)
    total_FP = sum(r['metrics']['FP'] for r in results)
    total_FN = sum(r['metrics']['FN'] for r in results)
    micro_precision = total_TP / (total_TP + total_FP) if (total_TP + total_FP) else 0.0
    micro_recall = total_TP / (total_TP + total_FN) if (total_TP + total_FN) else 0.0
    micro_f1 = (2 * micro_precision * micro_recall / (micro_precision + micro_recall)) if (micro_precision + micro_recall) else 0.0

    # Macro-average: average per-resume metrics
    macro_precision = sum(r['metrics']['precision'] for r in results) / len(results)
    macro_recall = sum(r['metrics']['recall'] for r in results) / len(results)
    macro_f1 = sum(r['metrics']['f1'] for r in results) / len(results)
    macro_jaccard = sum(r['metrics']['jaccard'] for r in results) / len(results)

    # Exact-match accuracy
    exact_matches = sum(1 for r in results if r['metrics']['jaccard'] == 1.0)
    exact_accuracy = exact_matches / len(results)

    summary = {
        "num_resumes": len(results),
        "micro": {
            "TP": total_TP, "FP": total_FP, "FN": total_FN,
            "precision": micro_precision, "recall": micro_recall, "f1": micro_f1
        },
        "macro": {
            "precision": macro_precision, "recall": macro_recall, "f1": macro_f1, "jaccard": macro_jaccard
        },
        "exact_match_accuracy": exact_accuracy
    }

    output = {
        "summary": summary,
        "results": results if args.output else None
    }

    # Print summary to stdout (human-friendly)
    print(json.dumps(summary, indent=2))

    # Optionally save full results to file
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print(f"\nFull results saved to {args.output}", file=sys.stderr)

if __name__ == '__main__':
    main()
