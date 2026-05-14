# batch_evaluate.py vs Production: Complete Mapping

## The Answer: What is `batch_evaluate.py` in Production?

**`batch_evaluate.py` is a TESTING script - it's NOT used in production.**

Instead, production uses:
1. **`extract_resume.py`** - Extracts text from PDF/DOCX files
2. **JavaScript skill extraction in `user.controller.js`** - Extracts individual skills from resume text

---

## Side-by-Side Comparison

### TESTING: `batch_evaluate.py`
```
Purpose: Test accuracy of skill extraction on MULTIPLE resumes at once
Location: backend/ml/batch_evaluate.py
Input: sample_batch.json (6 sample resumes with gold truth skills)
Output: Accuracy metrics (F1 score, precision, recall, etc.)
Command: python batch_evaluate.py sample_batch.json --call-extractor
When Used: During development to measure extraction accuracy
```

### PRODUCTION: `extract_resume.py` + JavaScript Skill Extraction
```
Purpose: Extract text and skills from student's uploaded resume
Location: 
  - backend/ml/extract_resume.py (text extraction)
  - backend/controllers/user.controller.js (skill extraction)
Input: PDF or DOCX file uploaded by student
Output: Extracted text + extracted skills stored in database
When Used: When student uploads resume in app
```

---

## Production Flow (What Actually Happens)

```
┌─────────────────────────────────────────────────────────────────────┐
│ STUDENT UPLOADS RESUME IN APP                                      │
│ (File: resume.pdf or resume.docx)                                  │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ user.controller.js: updateProfile() function                        │
│                                                                     │
│ 1. Upload file to Cloudinary (cloud storage)                       │
│ 2. Save file to temp location: /tmp/resume-{timestamp}.{ext}       │
│ 3. Call extract_resume.py                                          │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ extract_resume.py (PRODUCTION TEXT EXTRACTOR)                       │
│                                                                     │
│ Input: /tmp/resume-{timestamp}.pdf or .docx                        │
│                                                                     │
│ Process:                                                            │
│ ├─ If PDF: Use pdfminer.six to extract text                        │
│ └─ If DOCX: Use python-docx to read paragraphs                     │
│                                                                     │
│ Output (JSON): {"text": "Experienced Python developer..."}         │
│ Returns to: user.controller.js                                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ user.controller.js: JavaScript Skill Extraction (PRODUCTION)        │
│                                                                     │
│ Skill Vocabulary (27 skills):                                      │
│ ['python','java','javascript','react','node','django','flask',    │
│  'sql','mongodb','aws','azure','docker','kubernetes','machine     │
│  learning','data science','c++','c#','php','html','css',          │
│  'typescript','tensorflow','pytorch','excel','git','rest',         │
│  'graphql']                                                        │
│                                                                     │
│ Process:                                                            │
│ ├─ Loop through each skill                                        │
│ ├─ Use regex word-boundary matching: \bskill\b                    │
│ ├─ Search resume text                                             │
│ └─ Collect all matched skills in an array                         │
│                                                                     │
│ Output: ["python", "django", "aws", "docker"]                     │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Create ResumeAnalysis Document (PRODUCTION DATABASE)                │
│                                                                     │
│ Stores:                                                             │
│ ├─ userId: "student123"                                           │
│ ├─ resumeUrl: "https://cloudinary.com/.../resume.pdf"             │
│ ├─ predicted: ["python", "django", "aws", "docker"]               │
│ ├─ resumeText: "Experienced Python developer..."                  │
│ └─ metrics: {} (empty until user confirms)                        │
│                                                                     │
│ Database: MongoDB ResumeAnalysis collection                        │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend Shows Skill Confirmation Dialog                            │
│                                                                     │
│ "We extracted these skills from your resume:"                      │
│ ☑ Python                                                           │
│ ☑ Django                                                           │
│ ☑ AWS                                                              │
│ ☑ Docker                                                           │
│                                                                     │
│ Student can edit and confirm                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│ STUDENT CONFIRMS SKILLS                                             │
│                                                                     │
│ Call: /profile/confirm-skills with confirmed skills               │
│                                                                     │
│ ├─ predicted: ["python", "django", "aws", "docker"]               │
│ └─ confirmed: ["python", "django", "aws"]  (student removed docker)│
│                                                                     │
│ skillEvaluationService.js computes metrics:                        │
│ ├─ TP = 3 (python, django, aws correctly identified)              │
│ ├─ FP = 0 (no wrong predictions)                                  │
│ ├─ FN = 0 (no missed skills this round)                           │
│ ├─ precision = 100%                                               │
│ ├─ recall = 100%                                                  │
│ └─ f1 = 100%                                                      │
│                                                                     │
│ Store in MongoDB ResumeAnalysis.metrics                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Code: What Actually Runs in Production

### Step 1: Call extract_resume.py
**File**: `backend/controllers/user.controller.js` (lines 320-340)

```javascript
// Save file to temp location
const tmpDir = os.tmpdir();
const ext = path.extname(file.originalname) || '.pdf';
const tmpPath = path.join(tmpDir, `resume-${Date.now()}${ext}`);
await writeFile(tmpPath, file.buffer);

// Call Python extractor
const scriptPath = path.normalize(path.join(process.cwd(), 'ml', 'extract_resume.py'));
const py = spawn('python', [scriptPath, tmpPath], { stdio: ['ignore', 'pipe', 'pipe'] });

// Capture output
let out = '';
py.stdout.on('data', (d) => { out += d.toString(); });

py.on('close', async (exitCode) => {
  if (exitCode === 0) {
    const parsed = JSON.parse(out);
    const resumeText = parsed.text;  // ← Extracted text from resume
```

### Step 2: JavaScript Skill Extraction
**File**: `backend/controllers/user.controller.js` (lines 360-375)

```javascript
// PRODUCTION SKILL VOCABULARY
const knownSkills = [
  'python','java','javascript','react','node','django','flask','sql',
  'mongodb','aws','azure','docker','kubernetes','machine learning',
  'data science','c++','c#','php','html','css','typescript','tensorflow',
  'pytorch','excel','git','rest','graphql'
];

// Extract skills using regex word-boundary matching
const lowered = parsed.text.toLowerCase();
const found = new Set();

for (const s of knownSkills) {
  const key = s.toLowerCase();
  
  // Multi-word skills: exact match (e.g., "machine learning")
  if (key.includes(' ')) {
    if (lowered.includes(key)) found.add(s);
  } 
  // Single-word skills: word boundary regex (e.g., \bpython\b)
  else {
    const re = new RegExp('\\b' + key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
    if (re.test(parsed.text)) found.add(s);
  }
}

const skillList = Array.from(found);  // ← Final extracted skills
```

### Step 3: Store in ResumeAnalysis (Database)
**File**: `backend/controllers/user.controller.js` (lines 380-390)

```javascript
const analysisRecord = await ResumeAnalysis.create({
  userId: user._id,
  resumeUrl: cloudResponse.secure_url,
  resumeText: parsed.text,
  predicted: skillList,  // ← From JavaScript extraction above
  confirmed: [],         // ← Will be filled when student confirms
  metrics: {}            // ← Will be filled with accuracy metrics later
});
```

---

## Testing: What `batch_evaluate.py` Does

**File**: `backend/ml/batch_evaluate.py`

### Input: `sample_batch.json`
```json
[
  {
    "id": "resume1",
    "text": "Experienced Python developer...",
    "gold": ["python", "django", "flask", "sql", "aws", "docker"]  ← Ground truth
  },
  ...
]
```

### Process
1. **Load 6 sample resumes** from `sample_batch.json`
2. **Call skill_extractor.py** to extract skills from each resume
3. **Compare predictions vs ground truth**:
   - Extract predicted: `["python", "django", "aws"]`
   - Compare with gold: `["python", "django", "flask", "sql", "aws", "docker"]`
   - Calculate: TP=3, FP=0, FN=3
   - Compute metrics: precision, recall, F1

### Output
```
Testing 5 resumes...
- micro F1: 0.8571 (85.7% overall accuracy)
- macro F1: 0.8525
- exact_match_accuracy: 0.4
- num_samples: 5
```

---

## Key Differences: Testing vs Production

| Aspect | batch_evaluate.py (Testing) | Production (extract_resume.py + JS) |
|--------|-------|---------|
| **Used In** | Measuring accuracy only | Actual student resume uploads |
| **Runs When** | Developer manually runs command | Student uploads resume in app |
| **Skill Extractor** | `skill_extractor.py` (Python) | JavaScript in `user.controller.js` |
| **Input** | JSON file with sample resumes | Uploaded PDF/DOCX file |
| **Evaluates Against** | `gold` (ground truth) | User confirmation (later) |
| **Output** | Accuracy metrics (F1, precision, recall) | Database record + metrics |
| **Database** | No database interaction | Stores in MongoDB ResumeAnalysis |
| **Samples** | Batch of 5-100 resumes at once | One resume per upload |

---

## Summary

### Direct Answer to Your Question
**`batch_evaluate.py` = Testing tool**  
**Production equivalent = `extract_resume.py` + JavaScript skill extraction in `user.controller.js`**

They do the SAME JOB but in different ways:

| Aspect | Test | Production |
|--------|------|-----------|
| Text Extraction | `skill_extractor.py` reads text from sample_batch.json | `extract_resume.py` extracts from PDF/DOCX file |
| Skill Extraction | `skill_extractor.py` (Python regex matching) | JavaScript regex matching in controller |
| Comparison | Against `gold` field in JSON | Against user confirmation |
| Automation | Manual command | Automatic on upload |

---

## When to Use Each

✅ **Use `batch_evaluate.py` when:**
- You want to test accuracy on multiple resumes
- You have sample data with known correct skills
- You want to measure extraction quality before deploying

✅ **Use Production (`extract_resume.py` + JS) when:**
- Student uploads resume in the app
- Need real-time skill extraction
- Need to store results in database
- Need user to confirm/validate skills
