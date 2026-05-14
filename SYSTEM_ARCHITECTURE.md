# 🎯 System Architecture Diagrams

## Complete Skill Extraction System

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  JOB PORTAL SKILL EXTRACTION SYSTEM                     │
└─────────────────────────────────────────────────────────────────────────┘

                         ┌──────────────────────┐
                         │   SPACY NLP ENGINE   │
                         │  (Python 3.13.0)     │
                         │  (Spacy 3.8.11)      │
                         │  (Model: en_core...)  │
                         └──────────────────────┘
                                   ▲
                    ┌──────────────┴──────────────┐
                    │                             │
        ┌───────────▼──────────┐      ┌──────────▼─────────┐
        │  RESUME PROCESSING   │      │  JOB PROCESSING    │
        └──────────────────────┘      └────────────────────┘
             │                             │
        1. User uploads                1. Recruiter posts
           resume (PDF/DOCX)             job description
             │                             │
        2. Extract text                2. Extract text
           (pdfminer.six)                 (from description)
             │                             │
        3. Send to NLP                 3. Send to NLP
             │                             │
        4. Extract 50-70 skills        4. Extract 20-40 skills
             │                             │
        5. Confidence score            5. Confidence score
             │                             │
        6. Store results                6. Store results
             │                             │
             ▼                             ▼
        ResumeAnalysis              JobAnalysis
        MongoDB Collection          MongoDB Collection
             │                             │
        ┌────┴─────────────────────────────┴────┐
        │                                        │
        │   INTELLIGENT MATCHING ENGINE         │
        │   (Ready to Implement)                │
        │                                        │
        │   - Compare skills                    │
        │   - Calculate match %                 │
        │   - Rank candidates                   │
        │   - Send notifications                │
        │   - Recommendations                   │
        │                                        │
        └────────────────────────────────────────┘
```

---

## Resume Processing Flow

```
┌─────────────────────────────────────────────────────────┐
│          RESUME SKILL EXTRACTION FLOW                   │
└─────────────────────────────────────────────────────────┘

USER UPLOADS RESUME
        │
        ▼
┌─────────────────────────────────┐
│  Endpoint:                       │
│  PUT /api/v1/user/profile/update│
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Parse Resume File               │
│  (PDF or DOCX)                  │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Extract Text                    │
│  (pdfminer.six, python-docx)     │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Call Spacy NLP Module           │
│  (Python subprocess)             │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Spacy Processing:              │
│  • PhraseMatcher                │
│  • NER (Named Entity)           │
│  • Token matching               │
│  • Confidence scoring           │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Extract Results:               │
│  • 50-70 skills detected        │
│  • Entity categories            │
│  • Confidence scores            │
│  • Resume text preserved        │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Store in MongoDB               │
│  ResumeAnalysis Collection       │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  API Response:                  │
│  {                              │
│    skills: [...],               │
│    confidence: 0.95,            │
│    skillCount: 42               │
│  }                              │
└─────────────────────────────────┘
```

---

## Job Processing Flow (NEW)

```
┌─────────────────────────────────────────────────────────┐
│          JOB SKILL EXTRACTION FLOW (NEW!)              │
└─────────────────────────────────────────────────────────┘

RECRUITER POSTS JOB
        │
        ▼
┌─────────────────────────────────┐
│  Endpoint:                       │
│  POST /api/v1/jobs/post         │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Create Job in DB               │
│  (Immediate response)            │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Trigger Async Extraction       │
│  (Non-blocking)                 │
└─────────────────────────────────┘
        │
        ▼
    [IN BACKGROUND]
        │
        ▼
┌─────────────────────────────────┐
│  Combine Text:                  │
│  • Job title                    │
│  • Description                  │
│  • Requirements                 │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Call Spacy NLP Module           │
│  (Python subprocess)             │
│  (30-second timeout)             │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Spacy Processing:              │
│  • PhraseMatcher                │
│  • NER (Named Entity)           │
│  • Token matching               │
│  • Confidence scoring           │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Extract Results:               │
│  • 20-40 skills detected        │
│  • Entity categories            │
│  • Confidence scores            │
│  • Categorized by type          │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  If Spacy Fails:                │
│  → Use Rule-based Fallback      │
│  → Still get ~70% coverage      │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Store in MongoDB               │
│  JobAnalysis Collection          │
│  (upsert if already exists)      │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────┐
│  Available via API:             │
│  GET /api/v1/jobs/analysis/:id  │
└─────────────────────────────────┘
```

---

## Database Schema Relationship

```
┌─────────────────────────────────────────────────────────┐
│                    MONGODB COLLECTIONS                 │
└─────────────────────────────────────────────────────────┘

USERS
├── _id: ObjectId
├── fullname: String
├── email: String
├── profile: {
│   └── resumeText: String
├── resumeAnalysis: [Ref → ResumeAnalysis]
└── savedJobs: [Ref → Job]

RESUMEANALYSIS
├── _id: ObjectId
├── user: Ref → User ─────────┐
├── predicted: [String]       │ 50-70 SKILLS
├── extractorUsed: String     │ FROM RESUME
├── confidence: Number        │
├── resumeText: String        │
└── timestamps                │
                              │
JOBANALYSIS ◄──────────────┐  │
├── _id: ObjectId           │  │
├── job: Ref → Job ─────────┼──┼─────┐
├── company: Ref → Company  │  │     │
├── extractedSkills: [String] ├──┼─┐ 20-40 SKILLS
├── entities: {...}         │  │ │ FROM JOB
├── confidence: Number      │  │ │
├── skillCount: Number      │  │ │
├── matchingResumes: [...]  │  │ │ USED FOR MATCHING
└── timestamps              │  │ │
                            │  │ │
        ┌───────────────────┘  │ │
        │                      │ │
JOBS    └──────────────────────┘ │
├── _id: ObjectId              │ │
├── title: String              │ │
├── description: String        ├─┘
├── requirements: [String]     │
├── company: Ref → Company     │
├── created_by: Ref → User     │
├── applications: [Ref]        │
└── timestamps                 │

COMPANIES
├── _id: ObjectId
├── name: String
├── jobs: [Ref → Job]
└── jobAnalysis: [Ref → JobAnalysis]
```

---

## API Endpoint Flow

```
┌──────────────────────────────────────────────────────────┐
│                   API ENDPOINTS                          │
└──────────────────────────────────────────────────────────┘

RESUME SIDE:

PUT /api/v1/user/profile/update
├── Input: Resume file + user data
├── Process: Extract text → Spacy NLP → Store
├── Output: Success response
└── Background: Skills extracted to ResumeAnalysis


POST /api/v1/user/profile/extract-skills
├── Input: Resume file
├── Process: Spacy NLP skill extraction
├── Output: Skills list
└── Background: Stored in ResumeAnalysis


JOB SIDE (NEW):

POST /api/v1/jobs/post
├── Input: Job details (title, description, requirements)
├── Process: Create job → Trigger async extraction
├── Output: Job created successfully
└── Background: Spacy extracts skills to JobAnalysis
     (Immediate response, extraction happens async)


GET /api/v1/jobs/analysis/:jobId
├── Input: Job ID
├── Process: Lookup JobAnalysis
├── Output: Extracted skills + entities + metadata
└── Example: Get skills for job-candidate matching
```

---

## Data Processing Pipeline

```
┌────────────────────────────────────────────────────┐
│          DATA PROCESSING PIPELINE                  │
└────────────────────────────────────────────────────┘

INPUT DATA
    │
    ├─────────────────────┬──────────────────────┐
    ▼                     ▼                      ▼
 Resume File        Job Description        Requirements
    │                     │                      │
    ├─────────────────────┴──────────────────────┤
    │
    ▼
┌──────────────────────────────┐
│ TEXT EXTRACTION              │
│ ├─ PDF parsing              │
│ ├─ DOCX parsing             │
│ ├─ Text cleaning            │
│ └─ Normalization            │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ SPACY NLP PROCESSING          │
│ ├─ Tokenization             │
│ ├─ POS tagging              │
│ ├─ NER                       │
│ ├─ Dependency parsing        │
│ ├─ PhraseMatcher            │
│ └─ Skill matching           │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ RESULTS GENERATION            │
│ ├─ Skills list              │
│ ├─ Entity categories        │
│ ├─ Confidence scores        │
│ └─ Entity relations         │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ FALLBACK HANDLING             │
│ ├─ If Spacy fails           │
│ ├─ Use rule-based           │
│ ├─ Keyword matching         │
│ └─ Return results anyway    │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ MONGODB STORAGE               │
│ ├─ ResumeAnalysis            │
│ ├─ JobAnalysis               │
│ └─ Timestamps                │
└──────────────────────────────┘
    │
    ▼
OUTPUT DATA
├─ Extracted skills
├─ Confidence scores
├─ Entity categories
└─ Ready for matching
```

---

## Skill Matching Example

```
┌─────────────────────────────────────────────────┐
│     SKILL MATCHING (Ready to Implement)        │
└─────────────────────────────────────────────────┘

USER RESUME                          JOB POSTING
┌──────────────────┐               ┌──────────────────┐
│ Extracted Skills │               │ Required Skills  │
├──────────────────┤               ├──────────────────┤
│ • Python         │─ MATCH        │ • Python         │
│ • JavaScript     │               │ • JavaScript     │
│ • React          │─ MATCH        │ • React          │
│ • Node.js        │─ MATCH        │ • Node.js        │
│ • PostgreSQL     │               │ • PostgreSQL     │
│ • MongoDB        │               │ • AWS            │
│ • Docker         │               │ • Docker         │
│ • Vue.js         │ NO MATCH      │ • Kubernetes     │
│ • Git            │               │ • CI/CD          │
└──────────────────┘               └──────────────────┘

CALCULATION:
Matched Skills: 7 (Python, JavaScript, React, Node.js, 
                   PostgreSQL, Docker, Git)
Total Required: 9
Match Percentage: 7/9 = 77.8%

OUTPUT:
┌────────────────────────────────────┐
│ Match: 77.8%                       │
│ Matched Skills: 7                  │
│ Missing Skills: 2 (AWS, Kubernetes)│
│ Status: HIGHLY QUALIFIED           │
│ Action: Send notification          │
└────────────────────────────────────┘
```

---

## System Components

```
┌──────────────────────────────────────────────────────┐
│              SYSTEM COMPONENTS                       │
└──────────────────────────────────────────────────────┘

┌─ FRONTEND ──────────────────────────────────────┐
│ • React app                                     │
│ • Job posting form                             │
│ • Resume upload                                │
│ • Skill display (ready to implement)           │
└────────────────────────────────────────────────┘
                    ▲
                    │ HTTP/JSON
                    ▼
┌─ BACKEND ──────────────────────────────────────┐
│ • Node.js/Express                              │
│ • Routes (job.route.js, user.route.js)        │
│ • Controllers (job.controller.js,              │
│   user.controller.js)                          │
│ • Models (Job, User, ResumeAnalysis,          │
│   JobAnalysis)                                 │
│ • Services (jobMatchingService,                │
│   skillEvaluationService)                      │
└────────────────────────────────────────────────┘
                    ▲
                    │ Async spawn
                    ▼
┌─ ML ENGINE ────────────────────────────────────┐
│ • Python 3.13                                  │
│ • Spacy 3.8.11                                 │
│ • spacy_skill_extractor.py (412 lines)        │
│ • 100+ skill vocabulary                        │
│ • Rule-based fallback                          │
└────────────────────────────────────────────────┘
                    ▲
                    │ Models & Data
                    ▼
┌─ DATABASE ─────────────────────────────────────┐
│ • MongoDB                                      │
│ • Collections:                                 │
│   - users                                      │
│   - resumeanalysis (50-70 skills)             │
│   - jobs                                       │
│   - jobanalysis (20-40 skills) [NEW]          │
│   - companies                                  │
│   - applications                               │
│   - (+2 other collections)                    │
└────────────────────────────────────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│          DEPLOYMENT ARCHITECTURE                │
└─────────────────────────────────────────────────┘

┌─ DEVELOPMENT (Current) ───────────────┐
│ Machine: Windows 11                    │
│ Python: 3.13.0 (C:\Users\aniru\...)   │
│ Spacy: 3.8.11 (local pip)             │
│ Backend: npm start (localhost:8000)    │
│ Database: MongoDB (local)              │
│ Status: ✅ RUNNING                     │
└────────────────────────────────────────┘
                    │
                    │ Deploy to production
                    ▼
┌─ PRODUCTION (Future) ─────────────────┐
│ Server: Linux/Docker                   │
│ Python: 3.13+ (server path)            │
│ Spacy: 3.8.11 (Docker layer)          │
│ Backend: PM2/systemd (production)      │
│ Database: MongoDB (cloud)              │
│ Status: 🟡 READY TO DEPLOY            │
│ Note: Update Python path in config    │
└────────────────────────────────────────┘
```

---

**Diagrams Created**: January 1, 2025
**Completeness**: Full system coverage
**Ready for**: Reference & Planning
