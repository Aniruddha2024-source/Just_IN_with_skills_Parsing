# Production Accuracy Testing Guide

## Overview
Test your production skill extraction and job matching accuracy using the same code that runs in production (`extract_resume.py` + `matcher.py`).

## Files Created
- `test_production_accuracy.py` - Main testing script
- `test_data.json` - Sample test data format

## Usage

### Basic Command
```powershell
python backend\ml\test_production_accuracy.py backend\ml\test_data.json
```

### What It Does
1. Uses `extract_resume.py` to extract text from PDF/DOCX files (production code)
2. Extracts skills using same logic as production (JavaScript regex matching)
3. Uses `matcher.py` to match resume with jobs (production code)
4. Computes accuracy metrics (precision, recall, F1)
5. Saves detailed results to `production_test_results.json`

## Input Format

Create a JSON file with your test data:

```json
{
  "resumes": [
    {
      "id": "resume1",
      "file": "path/to/resume.pdf",
      "gold_skills": ["python", "sql", "aws"]
    },
    {
      "id": "resume2",
      "file": "path/to/resume2.docx",
      "gold_skills": ["java", "kubernetes"]
    }
  ],
  "jobs": [
    {
      "_id": "job1",
      "title": "Backend Developer",
      "description": "Python developer needed with cloud experience",
      "requirements": ["python", "django", "aws"]
    }
  ]
}
```

### Fields Explained
- `resumes[].id` - Unique identifier for the resume
- `resumes[].file` - Path to PDF/DOCX file (relative to backend/ml/ folder)
- `resumes[].gold_skills` - Ground truth skills (human-labeled)
- `jobs[]` - (Optional) Test job matching accuracy
- `jobs[]._id` - Job ID
- `jobs[].requirements` - Required skills for the job

## Output

### Terminal Output
```
Processing resume1...
  Gold skills: ['python', 'javascript', 'aws']
  Predicted: ['aws', 'javascript', 'python']
  Metrics: P=100.00% R=100.00% F1=100.00%
  Top match: Backend Developer (score: 0.250)

============================================================
AGGREGATE METRICS:
  Resumes tested: 1
  Micro - P: 100.00%, R: 100.00%, F1: 100.00%
  Macro - P: 100.00%, R: 100.00%, F1: 100.00%
============================================================
```

### JSON Output File
Results saved to `production_test_results.json`:

```json
{
  "summary": {
    "num_resumes": 1,
    "micro": {
      "TP": 3,
      "FP": 0,
      "FN": 0,
      "precision": 1.0,
      "recall": 1.0,
      "f1": 1.0
    },
    "macro": {
      "precision": 1.0,
      "recall": 1.0,
      "f1": 1.0
    }
  },
  "results": [...]
}
```

## Testing with 100 Resumes

1. Create `my_100_resumes_test.json`:
```json
{
  "resumes": [
    {"id": "r1", "file": "resumes/resume1.pdf", "gold_skills": ["python", "sql"]},
    {"id": "r2", "file": "resumes/resume2.pdf", "gold_skills": ["java", "aws"]},
    ...
  ],
  "jobs": [...]
}
```

2. Run test:
```powershell
python backend\ml\test_production_accuracy.py backend\ml\my_100_resumes_test.json
```

3. Check results:
   - Terminal shows aggregate metrics
   - `production_test_results.json` has per-resume breakdown

## Metrics Explained

- **TP (True Positives)**: Skills correctly extracted
- **FP (False Positives)**: Skills extracted but not in gold set
- **FN (False Negatives)**: Gold skills that were missed
- **Precision**: What % of extracted skills are correct
- **Recall**: What % of gold skills were found
- **F1**: Harmonic mean of precision and recall (main accuracy metric)

### Micro vs Macro
- **Micro**: Aggregate all TP/FP/FN across resumes, then compute metrics
- **Macro**: Average of per-resume metrics

## Tips for Better Accuracy

1. **Expand skill vocabulary** in production code (`user.controller.js` lines 370-375)
2. **Add synonyms**: Map "JS" → "JavaScript", "K8s" → "Kubernetes"
3. **Use more test data**: 100+ labeled resumes give stable metrics
4. **Check false positives/negatives** in output JSON to identify patterns

## Differences from `batch_evaluate.py`

| Feature | test_production_accuracy.py | batch_evaluate.py |
|---------|----------------------------|-------------------|
| Uses production code | ✅ YES | ❌ NO (uses skill_extractor.py) |
| Tests extract_resume.py | ✅ YES | ❌ NO |
| Tests matcher.py | ✅ YES | ❌ NO |
| Requires resume files | ✅ YES (PDF/DOCX) | ❌ NO (just text) |
| Tests job matching | ✅ YES | ❌ NO |

**Use `test_production_accuracy.py` to test what actually runs in production!**
