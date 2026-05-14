#!/usr/bin/env python
"""
Test job matching accuracy using matcher.py

This script evaluates how well the matcher.py performs at ranking jobs
that are relevant to different resume profiles.

Input: JSON file with test cases, each containing:
  - resume_text: Candidate's resume text
  - expected_matches: List of job IDs that SHOULD match (ground truth)
  - jobs: List of job objects with title, description, requirements

Output: Matching accuracy metrics
  - Recall@K: % of expected matches found in top K results
  - MRR (Mean Reciprocal Rank): How early expected jobs appear
  - NDCG: Ranking quality metric

Usage:
  python test_job_matching.py test_job_data.json
  python test_job_matching.py test_job_data.json --top-k 10
"""

import sys
import json
import subprocess
import tempfile
import os
from typing import List, Dict
import argparse

def load_json(path: str):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def call_matcher(resume_text: str, jobs: List[Dict], top_n: int = 10) -> List[Dict]:
    """
    Call matcher.py to get job matches
    Returns list of matched jobs with scores
    """
    input_data = {
        "resume_text": resume_text,
        "jobs": jobs,
        "top_n": top_n
    }
    
    try:
        p = subprocess.run(
            [sys.executable, 'matcher.py'],
            input=json.dumps(input_data),
            capture_output=True,
            text=True,
            check=True
        )
        result = json.loads(p.stdout)
        return result.get('matches', [])
    except subprocess.CalledProcessError as e:
        print(f"Error calling matcher.py: {e.stderr}")
        return []

def recall_at_k(expected_ids: List[str], predicted_matches: List[Dict], k: int) -> float:
    """
    Recall@K: Of the expected matches, how many are in top K predictions?
    
    Formula: |expected ∩ top_k| / |expected|
    
    Example:
    - Expected: ["job1", "job2", "job3"]
    - Top K matches: [job1 (score 0.95), job4 (score 0.87), job2 (score 0.82)]
    - Recall@3 = 2/3 = 0.667 (found 2 out of 3 expected)
    """
    if not expected_ids:
        return 1.0
    
    top_k_ids = [m['jobId'] for m in predicted_matches[:k]]
    found = sum(1 for eid in expected_ids if eid in top_k_ids)
    return found / len(expected_ids)

def reciprocal_rank(expected_ids: List[str], predicted_matches: List[Dict]) -> float:
    """
    Reciprocal Rank: Position of first expected match (1/rank)
    
    Example:
    - Expected: ["job1"]
    - Predicted: [job4 (rank 1), job2 (rank 2), job1 (rank 3), ...]
    - RR = 1/3 = 0.333
    """
    for rank, match in enumerate(predicted_matches, 1):
        if match['jobId'] in expected_ids:
            return 1.0 / rank
    return 0.0

def mean_reciprocal_rank(test_cases: List[Dict], predicted_results: List[List[Dict]]) -> float:
    """
    MRR: Average reciprocal rank across all test cases
    
    Higher is better (ideal = 1.0 when first match is always expected)
    """
    if not test_cases:
        return 0.0
    
    rr_scores = []
    for test_case, predictions in zip(test_cases, predicted_results):
        expected = test_case.get('expected_matches', [])
        rr = reciprocal_rank(expected, predictions)
        rr_scores.append(rr)
    
    return sum(rr_scores) / len(rr_scores) if rr_scores else 0.0

def dcg_at_k(expected_ids: List[str], predicted_matches: List[Dict], k: int) -> float:
    """
    DCG@K (Discounted Cumulative Gain)
    Relevance of ranked results, penalizing bad rankings early
    
    Formula: Σ(relevance_i / log2(i+1))
    
    Where relevance = 1 if job is in expected_matches, 0 otherwise
    """
    dcg = 0.0
    for i, match in enumerate(predicted_matches[:k], 1):
        relevance = 1.0 if match['jobId'] in expected_ids else 0.0
        dcg += relevance / (1 + __import__('math').log2(i + 1))
    return dcg

def idcg_at_k(num_expected: int, k: int) -> float:
    """
    IDCG@K (Ideal Discounted Cumulative Gain)
    Perfect ranking where all expected items come first
    """
    import math
    idcg = 0.0
    for i in range(min(num_expected, k)):
        idcg += 1.0 / (1 + math.log2(i + 2))
    return idcg

def ndcg_at_k(expected_ids: List[str], predicted_matches: List[Dict], k: int) -> float:
    """
    NDCG@K (Normalized Discounted Cumulative Gain)
    Ranking quality metric (0-1 scale)
    
    Formula: DCG@K / IDCG@K
    
    1.0 = perfect ranking (all expected first)
    0.0 = worst ranking (no expected matches)
    """
    if not expected_ids:
        return 1.0
    
    dcg = dcg_at_k(expected_ids, predicted_matches, k)
    idcg = idcg_at_k(len(expected_ids), k)
    
    return dcg / idcg if idcg > 0 else 0.0

def compute_classification_metrics(expected_ids: List[str], predicted_matches: List[Dict], k: int) -> Dict:
    """
    Compute Precision, Recall, F1, and Jaccard metrics for job matching
    
    Precision: Of the predicted matches, how many are relevant?
    Recall: Of the relevant jobs, how many were predicted?
    F1: Harmonic mean of precision and recall
    Jaccard: Intersection over union
    
    Example:
    - Expected: ["job1", "job2", "job3"]
    - Predicted (top K): ["job1", "job3", "job5"]
    - TP = 2 (job1, job3)
    - FP = 1 (job5)
    - FN = 1 (job2)
    - Precision = 2/3 = 0.667
    - Recall = 2/3 = 0.667
    - F1 = 0.667
    - Jaccard = 2/4 = 0.5
    """
    expected_set = set(expected_ids)
    predicted_set = set(m['jobId'] for m in predicted_matches[:k])
    
    # True Positive: jobs in both expected and predicted
    tp = len(expected_set & predicted_set)
    
    # False Positive: jobs in predicted but not expected
    fp = len(predicted_set - expected_set)
    
    # False Negative: jobs in expected but not predicted
    fn = len(expected_set - predicted_set)
    
    # Precision: TP / (TP + FP)
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    
    # Recall: TP / (TP + FN)
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    
    # F1: Harmonic mean
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
    
    # Jaccard: TP / (TP + FP + FN)
    jaccard = tp / (tp + fp + fn) if (tp + fp + fn) > 0 else 0.0
    
    return {
        "tp": tp,
        "fp": fp,
        "fn": fn,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "jaccard": jaccard
    }

def main():
    parser = argparse.ArgumentParser(description='Test job matching accuracy')
    parser.add_argument('input', help='Input JSON file with test cases')
    parser.add_argument('--top-k', type=int, default=10, help='Top K matches to consider')
    parser.add_argument('--output', help='Output JSON file with detailed results')
    args = parser.parse_args()

    # Load test data
    test_data = load_json(args.input)
    
    if isinstance(test_data, dict):
        test_cases = test_data.get('test_cases', [])
    else:
        test_cases = test_data

    if not test_cases:
        print(json.dumps({"error": "No test cases found"}))
        sys.exit(1)

    print(f"\nTesting job matching on {len(test_cases)} test cases...")
    print(f"Evaluating top {args.top_k} matches\n")

    # Run matcher on each test case
    all_results = []
    all_recall_scores = []
    all_mrr_scores = []
    all_ndcg_scores = []
    all_precision_scores = []
    all_f1_scores = []
    all_jaccard_scores = []

    for i, test_case in enumerate(test_cases, 1):
        resume_text = test_case.get('resume_text', '')
        jobs = test_case.get('jobs', [])
        expected_matches = test_case.get('expected_matches', [])
        test_name = test_case.get('name', f'Test Case {i}')

        # Call matcher
        matches = call_matcher(resume_text, jobs, args.top_k)

        # Compute ranking metrics
        recall_k = recall_at_k(expected_matches, matches, args.top_k)
        rr = reciprocal_rank(expected_matches, matches)
        ndcg_k = ndcg_at_k(expected_matches, matches, args.top_k)
        
        # Compute classification metrics
        class_metrics = compute_classification_metrics(expected_matches, matches, args.top_k)
        precision = class_metrics['precision']
        recall = class_metrics['recall']
        f1 = class_metrics['f1']
        jaccard = class_metrics['jaccard']

        all_recall_scores.append(recall_k)
        all_mrr_scores.append(rr)
        all_ndcg_scores.append(ndcg_k)
        all_precision_scores.append(precision)
        all_f1_scores.append(f1)
        all_jaccard_scores.append(jaccard)

        result = {
            "name": test_name,
            "resume": resume_text[:100] + "...",
            "expected_matches": expected_matches,
            "predicted_matches": matches,
            "metrics": {
                "ranking": {
                    "recall_at_k": round(recall_k, 4),
                    "mrr": round(rr, 4),
                    "ndcg_at_k": round(ndcg_k, 4)
                },
                "classification": {
                    "tp": class_metrics['tp'],
                    "fp": class_metrics['fp'],
                    "fn": class_metrics['fn'],
                    "precision": round(precision, 4),
                    "recall": round(recall, 4),
                    "f1": round(f1, 4),
                    "jaccard": round(jaccard, 4)
                }
            }
        }
        all_results.append(result)

        # Print individual result
        print(f"[{i}/{len(test_cases)}] {test_name}")
        print(f"  Expected: {expected_matches}")
        print(f"  Found (top {args.top_k}): {[m['jobId'] for m in matches[:3]]}")
        print(f"  Classification Metrics:")
        print(f"    Precision: {precision:.4f} ({precision:.1%})")
        print(f"    Recall: {recall:.4f} ({recall:.1%})")
        print(f"    F1: {f1:.4f}")
        print(f"    Jaccard: {jaccard:.4f}")
        print()

    # Aggregate metrics
    avg_recall = sum(all_recall_scores) / len(all_recall_scores) if all_recall_scores else 0.0
    avg_mrr = sum(all_mrr_scores) / len(all_mrr_scores) if all_mrr_scores else 0.0
    avg_ndcg = sum(all_ndcg_scores) / len(all_ndcg_scores) if all_ndcg_scores else 0.0
    avg_precision = sum(all_precision_scores) / len(all_precision_scores) if all_precision_scores else 0.0
    avg_f1 = sum(all_f1_scores) / len(all_f1_scores) if all_f1_scores else 0.0
    avg_jaccard = sum(all_jaccard_scores) / len(all_jaccard_scores) if all_jaccard_scores else 0.0

    print("=" * 70)
    print("AGGREGATE METRICS")
    print("=" * 70)
    print(f"\nRANKING METRICS:")
    print(f"Recall@{args.top_k} (average): {avg_recall:.1%}")
    print(f"  Interpretation: On average, {avg_recall:.1%} of expected matches appear in top {args.top_k}")
    print()
    print(f"MRR (Mean Reciprocal Rank): {avg_mrr:.4f}")
    print(f"  Interpretation: Expected jobs appear at position 1/{1/avg_mrr:.1f} on average")
    print(f"  (1.0 = always first, 0.5 = always second, 0.33 = always third)")
    print()
    print(f"NDCG@{args.top_k} (normalized): {avg_ndcg:.4f}")
    print(f"  Interpretation: Ranking quality is {avg_ndcg:.1%} of perfect (1.0)")
    print()
    
    print(f"\nCLASSIFICATION METRICS (Like Skill Extraction):")
    print(f"Precision: {avg_precision:.4f} ({avg_precision:.1%})")
    print(f"Recall: {avg_recall:.4f} ({avg_recall:.1%})")
    print(f"F1: {avg_f1:.4f}")
    print(f"Jaccard: {avg_jaccard:.4f}")
    print()

    # Output to file if requested
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump({
                "num_test_cases": len(test_cases),
                "top_k": args.top_k,
                "aggregate_metrics": {
                    "ranking": {
                        "recall_at_k": round(avg_recall, 4),
                        "mrr": round(avg_mrr, 4),
                        "ndcg_at_k": round(avg_ndcg, 4)
                    },
                    "classification": {
                        "precision": round(avg_precision, 4),
                        "recall": round(avg_recall, 4),
                        "f1": round(avg_f1, 4),
                        "jaccard": round(avg_jaccard, 4)
                    }
                },
                "per_test_case": all_results
            }, f, indent=2, ensure_ascii=False)
        print(f"Detailed results saved to: {args.output}")

if __name__ == '__main__':
    main()
