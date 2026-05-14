# Spacy NLP Skills Extraction - Integration Guide

## Overview

This document explains the integration of **Spacy NLP** for advanced skills extraction from resumes in your Job Portal application. The system uses Spacy's Named Entity Recognition (NER) and pattern matching to identify technical and soft skills with high accuracy.

## What is Spacy?

[Spacy](https://spacy.io/) is an industrial-strength NLP library for Python that provides:
- **Named Entity Recognition (NER)**: Identifies people, organizations, products, skills in text
- **Tokenization**: Breaks text into meaningful tokens
- **Pattern Matching**: Uses PhraseMatcher for multi-word skill detection
- **Lemmatization**: Normalizes words to base forms

## Setup & Installation

### 1. Install Python Dependencies

```bash
cd backend
pip install -r ml/requirements.txt
```

**Key packages added:**
- `spacy>=3.5.0` - Main NLP library
- `pdfminer.six` - PDF text extraction
- `python-docx` - DOCX text extraction

### 2. Download Spacy Language Model

```bash
python -m spacy download en_core_web_sm
```

This downloads the English language model (~40MB) which includes:
- Pre-trained NER models
- Tokenizer and lemmatizer
- Vocabulary and word vectors

## Architecture

### Resume Upload Flow

```
User uploads resume
        ↓
[extract_resume.py] → Extracts text from PDF/DOCX
        ↓
[spacy_skill_extractor.py] → Uses Spacy NLP to extract skills
        ↓
[MongoDB] → Stores skills & metrics in ResumeAnalysis
        ↓
User Profile Updated → Skills available for job matching
```

### Skill Extraction Process

1. **Text Extraction**: PDF/DOCX → Plain text
2. **Spacy Processing**: Text → Tokenization & NER
3. **PhraseMatcher**: Multi-word skills (e.g., "Spring Boot", "Machine Learning")
4. **Token Matching**: Single-word skills (e.g., "Python", "Java")
5. **Pattern Matching**: Regex for "Skills:" sections
6. **Deduplication**: Normalize and combine results

## API Endpoints

### 1. Profile Update with Resume (Automatic Skill Extraction)

**Endpoint**: `POST /api/v1/user/profile/update`

**Multipart Request**:
```
FormData:
  - file: [resume.pdf or resume.docx]
  - fullname: "John Doe" (optional)
  - email: "john@example.com" (optional)
  - bio: "Experienced developer" (optional)
  - skills: "Python, Java" (optional - manual override)
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully...",
  "user": {
    "_id": "...",
    "profile": {
      "resume": "https://cloudinary.com/...",
      "skills": ["python", "javascript", "react", "nodejs", ...],
      "resumeText": "Full resume text content...",
      "lastResumeAnalysis": "analysis_id"
    }
  }
}
```

### 2. Manual Skill Extraction from Resume Text

**Endpoint**: `POST /api/v1/user/profile/extract-skills`

**Request Body**:
```json
{
  "resumeText": "Experienced full-stack developer with 5+ years in Python, JavaScript, React..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Skills extracted successfully using Spacy NLP",
  "data": {
    "analysisId": "mongo_id",
    "skills": ["python", "javascript", "react", "nodejs", "docker", ...],
    "entities": {
      "ORG": ["Google", "Microsoft"],
      "PRODUCT": ["React", "Django"]
    },
    "confidence": 0.85,
    "metrics": {
      "precision": "92.5%",
      "recall": "88.3%",
      "f1": "90.3%",
      "jaccard": "82.1%"
    }
  }
}
```

### 3. Confirm Skills & Store Ground Truth

**Endpoint**: `POST /api/v1/user/profile/confirm-skills`

**Request Body**:
```json
{
  "analysisId": "mongo_id",
  "confirmed": ["python", "javascript", "react", "nodejs"]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Skills confirmed and evaluated",
  "metrics": {
    "TP": 4,
    "FP": 1,
    "FN": 0,
    "precision": 0.8,
    "recall": 1.0,
    "f1": 0.889,
    "jaccard": 0.8
  },
  "analysisId": "mongo_id"
}
```

### 4. Get Resume Analysis History

**Endpoint**: `GET /api/v1/user/profile/resume-analysis/:id`

**Response**:
```json
{
  "success": true,
  "analysis": {
    "_id": "mongo_id",
    "user": "user_id",
    "resumeUrl": "https://...",
    "resumeOriginalName": "resume.pdf",
    "extractor": "spacy-v1",
    "predicted": ["python", "javascript", ...],
    "confirmed": ["python", "javascript", ...],
    "resumeText": "...",
    "metrics": {
      "TP": 10,
      "FP": 2,
      "FN": 1,
      "precision": 0.833,
      "recall": 0.909,
      "f1": 0.870,
      "jaccard": 0.769
    },
    "createdAt": "2025-12-30T...",
    "updatedAt": "2025-12-30T..."
  }
}
```

## Supported Skills

### Technical Skills (100+)

**Programming Languages**:
Python, Java, JavaScript, TypeScript, C++, C#, Ruby, PHP, Golang, Rust, Swift, Kotlin, Scala, R, MATLAB, Perl, Groovy, Dart, Julia

**Frontend**:
React, Vue, Angular, Svelte, HTML, CSS, Tailwind, Bootstrap, Webpack, Vite, Next.js, Nuxt, Gatsby, Astro, jQuery, SASS, LESS

**Backend & Frameworks**:
Node, Django, Flask, FastAPI, Express, Spring, Spring Boot, Rails, Laravel, ASP.NET, NestJS, Koa, Hapi, Tornado, AioHTTP

**Databases**:
SQL, MySQL, PostgreSQL, MongoDB, Redis, Elasticsearch, DynamoDB, Cassandra, CouchDB, Firestore, Firebase, MariaDB, Oracle, SQLServer, Neo4j, Memcached, InfluxDB, TimeScaleDB

**Cloud & DevOps**:
AWS, Azure, GCP, Google Cloud, Docker, Kubernetes, Jenkins, GitLab CI, GitHub Actions, Terraform, Ansible, CloudFormation, Helm, ArgoCD, CircleCI, TravisCI, OpenStack, Heroku

**Data Science & ML**:
Pandas, NumPy, Scikit-Learn, TensorFlow, Keras, PyTorch, Machine Learning, Deep Learning, NLP, Computer Vision, Jupyter, Anaconda, OpenCV, Matplotlib, Seaborn, Plotly, XGBoost, LightGBM, Hugging Face, Transformers, BERT, GPT, LLM

**APIs & Integration**:
REST, GraphQL, gRPC, SOAP, OAuth, JWT, WebSocket, MQTT, RabbitMQ, Kafka, Apache Kafka, AWS SNS, AWS SQS

**Testing & QA**:
Pytest, Jest, Mocha, Chai, RSpec, JUnit, TestNG, Selenium, Cypress, Playwright, Postman, JMeter, Cucumber, Behave

**Version Control**: Git, GitHub, GitLab, Bitbucket, Subversion, SVN

**Other Tools**:
Linux, Unix, Windows, macOS, Shell, Bash, PowerShell, Docker Compose, Vim, VS Code, IntelliJ, PyCharm, Eclipse, Jira, Confluence, Slack, Trello, Asana

**Big Data**: Spark, Hadoop, Hive, Pig, MapReduce, Flink, Storm

**Mobile**: Android, iOS, React Native, Flutter, Xamarin

### Soft Skills
Communication, Leadership, Teamwork, Collaboration, Problem Solving, Critical Thinking, Analytical, Time Management, Project Management, Agile Methodology, Scrum, Mentoring, Training, Presentation, Public Speaking, Negotiation, Stakeholder Management

## Data Model

### ResumeAnalysis Schema

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  resumeUrl: String,
  resumeOriginalName: String,
  extractor: String, // 'spacy-v1' or 'rule-v1'
  predicted: [String], // Skills extracted by algorithm
  confirmed: [String], // Skills confirmed by user
  resumeText: String, // Full extracted text
  metrics: {
    TP: Number,        // True Positives
    FP: Number,        // False Positives
    FN: Number,        // False Negatives
    precision: Number, // TP / (TP + FP)
    recall: Number,    // TP / (TP + FN)
    f1: Number,        // Harmonic mean of precision & recall
    jaccard: Number    // TP / (TP + FP + FN)
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Error Handling

### Common Issues

1. **Spacy Model Not Downloaded**
   ```bash
   python -m spacy download en_core_web_sm
   ```

2. **Python Not Found**
   - Ensure Python 3.7+ is in PATH
   - On Windows: Add Python to PATH environment variable

3. **Module Import Errors**
   ```bash
   pip install -r backend/ml/requirements.txt
   ```

4. **Permission Denied (Temp File)**
   - Ensure write permissions to `os.tmpdir()`
   - Linux: Check `/tmp` permissions

## Performance Notes

- **First Run**: Initial Spacy model load takes ~2-3 seconds
- **Subsequent Runs**: ~0.5-1 second per resume (cached model)
- **Memory Usage**: Spacy model consumes ~150MB RAM
- **Scalability**: Process resumes asynchronously for high volume

## Frontend Integration Examples

### React Hook for Resume Upload

```javascript
import { useState } from 'react';

export const useResumeUpload = () => {
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState(null);

  const uploadResume = async (file) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/v1/user/profile/update', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        setSkills(data.user.profile.skills);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { uploadResume, skills, loading, error };
};
```

## Testing

### Manual Test

```bash
# Test skill extraction with sample resume
python backend/ml/spacy_skill_extractor.py --input backend/ml/sample_resume.jsonl

# Output:
# {"id": "...", "predicted": ["python", "javascript", ...], "confidence": 0.85}
```

### Unit Test

```python
from backend.ml.spacy_skill_extractor import SpacySkillExtractor

extractor = SpacySkillExtractor()
text = "5+ years experience with Python, JavaScript, React, and Docker"
result = extractor.extract_skills(text)
print(result['skills'])  # ['python', 'javascript', 'react', 'docker']
print(result['confidence'])  # 0.95+
```

## Production Checklist

- [ ] Spacy model downloaded: `python -m spacy download en_core_web_sm`
- [ ] Dependencies installed: `pip install -r ml/requirements.txt`
- [ ] API tested with sample resume
- [ ] MongoDB ResumeAnalysis collection created
- [ ] Cloudinary upload configured
- [ ] Error logging in place
- [ ] Load testing for concurrent resume uploads
- [ ] Metrics monitoring (accuracy, latency)

## Future Enhancements

1. **Custom Skills Vocabulary**: Load industry-specific skills
2. **Multilingual Support**: Support resumes in multiple languages
3. **Skill Confidence Scores**: Per-skill confidence from Spacy
4. **Skill Grouping**: Group similar skills (e.g., "React" + "Vue" → "Frontend")
5. **Job Matching Optimization**: Use extracted skills for better job recommendations
6. **Batch Processing**: Async skill extraction for bulk resume uploads
7. **ML Model Retraining**: Fine-tune Spacy model with labeled resume data

## Support & Debugging

### Enable Debug Logging

```javascript
// In user.controller.js
console.log('Spacy extraction result:', spacyResult);
console.log('Extracted skills:', skillList);
console.log('Confidence score:', confidence);
```

### Check Spacy Installation

```bash
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Spacy ready')"
```

### View Extracted Skills in MongoDB

```javascript
db.resumeanalyses.find({ extractor: "spacy-v1" }).pretty()
```

## References

- [Spacy Documentation](https://spacy.io/)
- [Named Entity Recognition](https://spacy.io/usage/spacy-101#annotations-ner)
- [PhraseMatcher](https://spacy.io/api/phrasematcher)
- [Models & Pipelines](https://spacy.io/models)
