# Your Job Portal Accuracy Summary

## Skill Extraction vs Job Matching Accuracy

### SKILL EXTRACTION ACCURACY
**Tested by**: `batch_evaluate.py` on `sample_batch.json`

```
Precision: 0.7500 (75%)
Recall:    0.8571 (85.71%)
F1:        0.8009 (80.09%)
Jaccard:   0.6667 (66.67%)
```

**What this means**:
- **Precision 75%**: Of the skills extracted, 75% are actually correct
- **Recall 85.71%**: Of all skills in the resume, the algorithm found 85.71%
- **F1 80.09%**: Balanced accuracy (harmonic mean of precision and recall)
- **Jaccard 66.67%**: Similarity between predicted and actual skills

---

### JOB MATCHING ACCURACY
**Tested by**: `test_job_matching.py` on `test_job_data.json`

```
Precision: 0.6000 (60%)
Recall:    1.0000 (100%)
F1:        0.7500 (75%)
Jaccard:   0.6000 (60%)
```

**What this means**:
- **Precision 60%**: Of the top 5 matches shown, 60% are relevant (3 out of 5)
- **Recall 100%**: All relevant jobs are found in the top 5 matches
- **F1 75%**: Balanced accuracy between precision and recall
- **Jaccard 60%**: Similarity between predicted and relevant jobs

---

## Side-by-Side Comparison

| Metric | Skill Extraction | Job Matching |
|--------|------------------|--------------|
| **Precision** | 75% ✅ | 60% ✅ |
| **Recall** | 85.71% ✅ | 100% ✅ |
| **F1 Score** | 80.09% ✅ | 75% ✅ |
| **Jaccard** | 66.67% | 60% |

---

## What Precision/Recall Mean in Your App

### SKILL EXTRACTION
```
Resume: "Python developer with Django, Flask, SQL, AWS"

Predicted Skills: ["python", "django", "sql", "aws"]
Actual Skills: ["python", "django", "flask", "sql", "aws"]

TP (True Positive): 4 (python, django, sql, aws)
FP (False Positive): 0
FN (False Negative): 1 (flask)

Precision = 4/4 = 100% (all predictions correct)
Recall = 4/5 = 80% (found 4 out of 5 skills)
F1 = 2 × (1.0 × 0.8) / (1.0 + 0.8) = 89%
```

### JOB MATCHING
```
Resume: "Python developer with Django and AWS"
Expected Relevant Jobs: [job1, job2, job3]
Top 5 Matches: [job1, job2, job3, job4, job5]

TP (True Positive): 3 (job1, job2, job3)
FP (False Positive): 2 (job4, job5)
FN (False Negative): 0

Precision = 3/5 = 60% (3 out of 5 matches are relevant)
Recall = 3/3 = 100% (found all relevant jobs)
F1 = 2 × (0.6 × 1.0) / (0.6 + 1.0) = 75%
```

---

## How This Works in Your Production App

```
┌─────────────────────────────────────────────────┐
│ STUDENT UPLOADS RESUME                          │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ SKILL EXTRACTION (80.09% F1 Accuracy)           │
│                                                 │
│ Input: Resume PDF/DOCX                          │
│ Output: ["python", "django", "sql", "aws"]      │
│                                                 │
│ Precision: 75% - Most extracted skills correct  │
│ Recall: 85.71% - Finds most skills in resume   │
│                                                 │
│ Quality: ✅ GOOD - Few false positives/negatives│
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ JOB MATCHING (75% F1 Accuracy)                  │
│                                                 │
│ Input: Resume + All job postings                │
│ Output: Ranked jobs (top 5 matches)             │
│                                                 │
│ Precision: 60% - 3 out of 5 matches relevant   │
│ Recall: 100% - All relevant jobs are found      │
│                                                 │
│ Quality: ✅ GOOD - Finds all relevant jobs      │
│                      but shows some irrelevant  │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│ STUDENT SEES RECOMMENDED JOBS                   │
│                                                 │
│ ✅ [job1] Python Django Developer (Relevant)    │
│ ✅ [job2] Python Data Scientist (Relevant)      │
│ ✅ [job3] DevOps Engineer (Relevant)            │
│ ❌ [job4] Java Backend (Not Relevant)           │
│ ❌ [job5] React Developer (Not Relevant)        │
│                                                 │
│ → Student finds relevant jobs but needs to     │
│   filter some irrelevant ones                  │
└─────────────────────────────────────────────────┘
```

---

## How to Run Tests

### Test Skill Extraction Accuracy
```bash
cd backend/ml
python batch_evaluate.py sample_batch.json --call-extractor --extractor-path skill_extractor.py
```

**Output**:
```
Precision: ~75%
Recall: ~85.71%
F1: ~80.09%
Jaccard: ~66.67%
```

---

### Test Job Matching Accuracy
```bash
cd backend/ml
python test_job_matching.py test_job_data.json --top-k 5
```

**Output**:
```
Precision: 60.0%
Recall: 100.0%
F1: 0.7500
Jaccard: 0.6000
```

---

## Why Precision and Recall are Different

### Why Job Matching Has Lower Precision (60% vs 75%)
```
When you search for top 5 matching jobs:
- You find 3 relevant jobs
- But also 2 irrelevant jobs
- Precision = 3/5 = 60%

This is because:
- Job matching uses text similarity (TF-IDF)
- Some unrelated jobs have similar keywords
- Example: "Python" appears in both data scientist and backend jobs
```

### Why Job Matching Has Perfect Recall (100%)
```
When you need to find relevant jobs:
- All 3 relevant jobs are in top 5
- None are missed
- Recall = 3/3 = 100%

This is good! It means:
- Students see all relevant opportunities
- Won't miss any job they could be matched for
```

---

## Summary Table

| Aspect | Skill Extraction | Job Matching |
|--------|------------------|--------------|
| **Purpose** | Extract skills from resume text | Match resume with job postings |
| **Process** | Regex + vocabulary matching | TF-IDF + cosine similarity |
| **Input** | Resume (PDF/DOCX) | Resume + All jobs |
| **Output** | List of skills | Ranked job list |
| **Precision** | 75% | 60% |
| **Recall** | 85.71% | 100% |
| **F1** | 80.09% | 75% |
| **Meaning** | Good accuracy at extracting skills | Good at finding relevant jobs (but some irrelevant ones) |

---

## Rating Your System

✅ **Skill Extraction: B+ (80% F1)**
- Misses ~14% of skills (recall issue)
- Extracts ~75% accurate skills (precision good)
- Good enough for matching, but could be improved

✅ **Job Matching: B (75% F1)**
- Finds 100% of relevant jobs (perfect recall) 
- But shows 40% irrelevant jobs (precision issue)
- Good user experience but could filter better

**Overall**: Your system works well! Both components have good F1 scores and complement each other.
