# Command Breakdown: `batch_evaluate.py`

## Full Command
```bash
python backend\ml\batch_evaluate.py backend\ml\sample_batch.json --call-extractor --extractor-path backend\ml\skill_extractor.py
```

---

## Component Analysis

### 1. **Script**: `batch_evaluate.py`
**Purpose**: Evaluate skill extraction accuracy on multiple resumes

**Location**: `backend/ml/batch_evaluate.py`

---

### 2. **Input File**: `sample_batch.json`
**Location**: `backend/ml/sample_batch.json`

**Structure**: Array of resume objects with:
- `id`: Resume identifier
- `text`: Resume text content
- `gold`: Ground truth skills (what skills SHOULD be extracted)

**Example**:
```json
[
  {
    "id": "resume1",
    "text": "Experienced Python developer with Django, Flask, SQL...",
    "gold": ["python", "django", "flask", "sql", "aws", "docker", ...]
  },
  {
    "id": "resume2",
    "text": "Full-stack JavaScript developer with React, Node.js...",
    "gold": ["javascript", "react", "node", "mongodb", "html", "css", "git"]
  }
]
```

**Current Data**: 6 sample resumes

---

### 3. **Flag**: `--call-extractor`
**What it does**: Tells batch_evaluate.py to call the skill extractor to get predicted skills

**Without this flag**: batch_evaluate.py would expect predictions already in the JSON (`"predicted"` field)

**With this flag**: batch_evaluate.py will:
1. Read the JSON resumes (with only `text` and `gold` fields)
2. Call `skill_extractor.py` to extract predicted skills from the `text`
3. Compare predictions vs ground truth (`gold`)
4. Calculate accuracy metrics

---

### 4. **Flag**: `--extractor-path backend\ml\skill_extractor.py`
**What it does**: Specifies which skill extractor to use

**Default**: Uses `skill_extractor.py` in current directory

**Your case**: Explicitly points to `backend\ml\skill_extractor.py`

---

## Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Command Execution Flow                                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: batch_evaluate.py starts
        │
        └─→ Load sample_batch.json
            (6 resumes with "text" and "gold" fields)
            
Step 2: Parse command-line arguments
        --call-extractor: YES
        --extractor-path: backend\ml\skill_extractor.py
        
Step 3: Check if predictions missing
        Need to call extractor? YES (because --call-extractor flag)
        
Step 4: Create temporary JSONL file
        ┌──────────────────────────────────────┐
        │ Temp file (unnamed): each line has   │
        │ {"id": "resume1", "text": "..."}     │
        │ {"id": "resume2", "text": "..."}     │
        │ ...                                  │
        └──────────────────────────────────────┘
        
Step 5: Call skill_extractor.py subprocess
        └─→ python skill_extractor.py --input temp_file.jsonl
            
            ┌─────────────────────────────────────┐
            │ Inside skill_extractor.py:          │
            │                                     │
            │ For each resume text:               │
            │ 1. Normalize (lowercase)            │
            │ 2. Regex word-boundary match        │
            │    against skill vocabulary         │
            │ 3. Output JSON:                     │
            │    {"id": "...", "predicted": [...]}
            │                                     │
            │ Output to STDOUT (each line is JSON)│
            └─────────────────────────────────────┘
        
Step 6: Capture extractor output
        Results: List of {"id": "resume1", "predicted": [...]}
        
Step 7: Merge predictions back into original data
        original[0] = {"id": "resume1", "text": "...", "gold": [...], "predicted": [...]}
        original[1] = {"id": "resume2", "text": "...", "gold": [...], "predicted": [...]}
        
Step 8: Compute per-resume metrics
        For each resume:
        ├─ gold_set = {"python", "django", "flask", ...}
        ├─ pred_set = {"python", "sql", ...}  (from extractor)
        │
        ├─ TP (True Positive) = gold ∩ pred = {"python"}
        ├─ FP (False Positive) = pred - gold = {"sql"}
        ├─ FN (False Negative) = gold - pred = {"django", "flask"}
        │
        ├─ precision = TP / (TP + FP) = 1/2 = 50%
        ├─ recall = TP / (TP + FN) = 1/3 = 33%
        ├─ f1 = 2 × (precision × recall) / (precision + recall) = 40%
        └─ jaccard = TP / (TP + FP + FN) = 1/4 = 25%

Step 9: Aggregate metrics across all resumes
        ├─ Micro-average: sum all TP/FP/FN, then calculate
        ├─ Macro-average: average of individual F1 scores
        └─ exact_match_accuracy: % of resumes with 100% match

Step 10: Output results
        ├─ micro F1: 0.8571 (85.71% overall accuracy)
        ├─ macro F1: 0.8525
        ├─ exact_match_accuracy: 0.4 (40% of resumes had perfect extraction)
        ├─ num_samples: 5 (only 5 resumes had full gold data)
        └─ [Optional] Detailed JSON file (if --output specified)
```

---

## Skill Extraction Details

### What `skill_extractor.py` Does

**Vocabulary**: 27 predefined skills
```python
["python", "java", "javascript", "typescript", "react", "node", "django",
 "flask", "sql", "postgresql", "mysql", "aws", "azure", "docker", "kubernetes",
 "pandas", "numpy", "scikit-learn", "tensorflow", "keras", "git", "gitlab",
 "spark", "hadoop", "html", "css", "mongodb", "redis"]
```

**Extraction Method** (Rule-based):
1. **Word-boundary regex matching**: Searches for `\bskill\b` in resume text
   - Example: `\bpython\b` matches "python" but NOT "python3" or "mypython"

2. **Skills section parsing**: Looks for "Skills:" or "Skills-:" and extracts comma-separated skills
   - Example: "Skills: Python, SQL, Docker" → extracts all three

3. **Case-insensitive**: "PYTHON", "Python", "python" all match

---

## Metrics Explained

| Metric | Formula | Meaning |
|--------|---------|---------|
| **TP (True Positive)** | gold ∩ predicted | Skills correctly extracted |
| **FP (False Positive)** | predicted - gold | Skills extracted but shouldn't be |
| **FN (False Negative)** | gold - predicted | Skills missed (not extracted) |
| **Precision** | TP / (TP + FP) | Of extracted skills, how many are correct? |
| **Recall** | TP / (TP + FN) | Of actual skills, how many were found? |
| **F1 Score** | 2 × (P × R) / (P + R) | Harmonic mean of precision & recall |
| **Jaccard** | TP / (TP + FP + FN) | Set similarity (0-1 scale) |

### Example
```
Resume: "Python developer with SQL and Django experience"
Gold:   ["python", "sql", "django"]
Predicted: ["python", "sql"]

TP = 2 (python, sql)
FP = 0
FN = 1 (django missed)

Precision = 2/2 = 100% (all predictions are correct)
Recall    = 2/3 = 67% (found 2 out of 3 skills)
F1        = 2 × (1.0 × 0.67) / (1.0 + 0.67) = 80%
Jaccard   = 2/3 = 67%
```

---

## Actual Command Output (from your run)

```
Testing 5 resumes...
- micro F1: 0.8571 (85.7% accuracy)
- macro F1: 0.8525
- exact_match_accuracy: 0.4
- num_samples: 5
```

**Interpretation**:
- **85.7% overall accuracy** when combining all resume evaluations
- **40% perfect extraction** (2 out of 5 resumes had 100% skill extraction)
- **Average F1 across resumes: 85.25%**

---

## Why Use This Command?

✅ **Testing accuracy**: Validate skill extraction before using in production

✅ **Batch testing**: Evaluate multiple resumes at once (useful for 10, 100, 1000 resumes)

✅ **Metrics**: Get detailed precision/recall/F1 to understand extraction quality

✅ **Comparison**: Can test different extractors or parameters by changing `--extractor-path`

---

## Related Files in Your Project

| File | Purpose |
|------|---------|
| `skill_extractor.py` | Python skill extraction (TESTING ONLY) |
| `extract_resume.py` | Extract text from PDF/DOCX (PRODUCTION) |
| `matcher.py` | TF-IDF job matching (PRODUCTION) |
| `user.controller.js` | JS-based skill extraction (PRODUCTION) |
| `batch_evaluate.py` | Batch evaluation script (TESTING) |
| `test_production_accuracy.py` | Tests actual production code (TESTING) |

**Key Point**: `skill_extractor.py` and `batch_evaluate.py` are testing tools. Production uses the JavaScript extractor in `user.controller.js` + `extract_resume.py` for text extraction.
