#!/usr/bin/env python
"""
Test production accuracy using extract_resume.py + matcher.py (same as production).

This script:
1. Loads test data with resumes and gold skills
2. Uses extract_resume.py to extract text from resume files
3. Uses matcher.py to match against test jobs
4. Computes accuracy metrics

Usage:
  python test_production_accuracy.py test_data.json
  
Input format (JSON):
{
  "resumes": [
    {
      "id": "resume1",
      "file": "path/to/resume.pdf",
      "gold_skills": ["python", "aws", "docker"]
    }
  ],
  "jobs": [
    {
      "id": "job1",
      "title": "Backend Developer",
      "description": "Python developer needed",
      "requirements": ["python", "django", "sql"]
    }
  ]
}

Or for skill extraction only (without job matching):
{
  "resumes": [
    {
      "id": "resume1", 
      "file": "path/to/resume.pdf",
      "gold_skills": ["python", "sql"]
    }
  ]
}
"""

import sys
import json
import subprocess
import os
from typing import List, Dict

def normalize_skill(s: str) -> str:
    return s.strip().lower()

def extract_resume_text(file_path: str) -> str:
    """Call extract_resume.py to get text from PDF/DOCX"""
    if not os.path.exists(file_path):
        print(f"Warning: File not found: {file_path}", file=sys.stderr)
        return ""
    
    cmd = [sys.executable, 'extract_resume.py', file_path]
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, check=True, cwd=os.path.dirname(__file__))
        data = json.loads(result.stdout)
        return data.get('text', '')
    except Exception as e:
        print(f"Error extracting {file_path}: {e}", file=sys.stderr)
        return ""

def match_resume_to_jobs(resume_text: str, jobs: List[Dict], top_n: int = 10) -> List[Dict]:
    """Call matcher.py to match resume with jobs"""
    input_data = {
        "resume_text": resume_text,
        "jobs": jobs,
        "top_n": top_n
    }
    
    cmd = [sys.executable, 'matcher.py']
    try:
        result = subprocess.run(
            cmd, 
            input=json.dumps(input_data), 
            capture_output=True, 
            text=True, 
            check=True,
            cwd=os.path.dirname(__file__)
        )
        data = json.loads(result.stdout)
        return data.get('matches', [])
    except Exception as e:
        print(f"Error in matcher: {e}", file=sys.stderr)
        return []

def extract_skills_from_text(text: str, known_skills: List[str]) -> List[str]:
    """Simple skill extraction (matches production JS logic)"""
    import re
    text_lower = text.lower()
    found = set()
    
    for skill in known_skills:
        skill_lower = skill.lower()
        if ' ' in skill_lower:
            # Multi-word skill: simple contains check
            if skill_lower in text_lower:
                found.add(skill)
        else:
            # Single word: word boundary match
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
            if re.search(pattern, text_lower):
                found.add(skill)
    
    return sorted(found)

def compute_skill_metrics(gold: List[str], predicted: List[str]) -> Dict:
    """Compute precision, recall, F1"""
    gold_set = set(normalize_skill(s) for s in gold)
    pred_set = set(normalize_skill(s) for s in predicted)
    
    TP = len(gold_set & pred_set)
    FP = len(pred_set - gold_set)
    FN = len(gold_set - pred_set)
    
    precision = TP / (TP + FP) if (TP + FP) else 0.0
    recall = TP / (TP + FN) if (TP + FN) else 0.0
    f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
    
    return {
        "TP": TP, "FP": FP, "FN": FN,
        "precision": precision, "recall": recall, "f1": f1
    }

def main():
    if len(sys.argv) < 2:
        print("Usage: python test_production_accuracy.py test_data.json")
        sys.exit(1)
    
    # Load test data
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        test_data = json.load(f)
    
    resumes = test_data.get('resumes', [])
    jobs = test_data.get('jobs', [])
    
    # Default skill vocabulary (same as production)
    default_skills = [
        'python', 'java', 'javascript', 'react', 'node', 'django',
        'flask', 'sql', 'mongodb', 'aws', 'azure', 'docker', 'kubernetes',
        'machine learning', 'data science', 'c++', 'c#', 'php', 'html', 
        'css', 'typescript', 'tensorflow', 'pytorch', 'excel', 'git', 
        'rest', 'graphql', 'postgresql', 'mysql'
    ]
    
    results = []
    
    print(f"Testing {len(resumes)} resumes...\n")
    
    for resume in resumes:
        resume_id = resume.get('id', 'unknown')
        file_path = resume.get('file')
        gold_skills = resume.get('gold_skills', [])
        
        print(f"Processing {resume_id}...")
        
        # Step 1: Extract text using extract_resume.py (production)
        resume_text = extract_resume_text(file_path)
        
        if not resume_text:
            print(f"  ⚠ Failed to extract text from {file_path}")
            continue
        
        # Step 2: Extract skills (mimics production JS logic)
        predicted_skills = extract_skills_from_text(resume_text, default_skills)
        
        # Step 3: Compute skill extraction metrics
        skill_metrics = compute_skill_metrics(gold_skills, predicted_skills)
        
        print(f"  Gold skills: {gold_skills}")
        print(f"  Predicted: {predicted_skills}")
        print(f"  Metrics: P={skill_metrics['precision']:.2%} R={skill_metrics['recall']:.2%} F1={skill_metrics['f1']:.2%}")
        
        result = {
            "id": resume_id,
            "gold_skills": gold_skills,
            "predicted_skills": predicted_skills,
            "skill_metrics": skill_metrics,
            "resume_text_length": len(resume_text)
        }
        
        # Step 4: If jobs provided, test matching using matcher.py (production)
        if jobs:
            matches = match_resume_to_jobs(resume_text, jobs, top_n=5)
            result['job_matches'] = matches
            if matches:
                print(f"  Top match: {matches[0]['title']} (score: {matches[0]['score']:.3f})")
        
        results.append(result)
        print()
    
    # Aggregate metrics
    if results:
        total_TP = sum(r['skill_metrics']['TP'] for r in results)
        total_FP = sum(r['skill_metrics']['FP'] for r in results)
        total_FN = sum(r['skill_metrics']['FN'] for r in results)
        
        micro_precision = total_TP / (total_TP + total_FP) if (total_TP + total_FP) else 0.0
        micro_recall = total_TP / (total_TP + total_FN) if (total_TP + total_FN) else 0.0
        micro_f1 = (2 * micro_precision * micro_recall / (micro_precision + micro_recall)) if (micro_precision + micro_recall) else 0.0
        
        macro_precision = sum(r['skill_metrics']['precision'] for r in results) / len(results)
        macro_recall = sum(r['skill_metrics']['recall'] for r in results) / len(results)
        macro_f1 = sum(r['skill_metrics']['f1'] for r in results) / len(results)
        
        summary = {
            "num_resumes": len(results),
            "micro": {
                "TP": total_TP, "FP": total_FP, "FN": total_FN,
                "precision": micro_precision,
                "recall": micro_recall,
                "f1": micro_f1
            },
            "macro": {
                "precision": macro_precision,
                "recall": macro_recall,
                "f1": macro_f1
            }
        }
        
        print("="*60)
        print("AGGREGATE METRICS:")
        print(f"  Resumes tested: {summary['num_resumes']}")
        print(f"  Micro - P: {summary['micro']['precision']:.2%}, R: {summary['micro']['recall']:.2%}, F1: {summary['micro']['f1']:.2%}")
        print(f"  Macro - P: {summary['macro']['precision']:.2%}, R: {summary['macro']['recall']:.2%}, F1: {summary['macro']['f1']:.2%}")
        print("="*60)
        
        # Save detailed results
        output = {
            "summary": summary,
            "results": results
        }
        
        output_file = 'production_test_results.json'
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        
        print(f"\nDetailed results saved to: {output_file}")

if __name__ == '__main__':
    main()
