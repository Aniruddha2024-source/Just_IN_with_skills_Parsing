# 🎯 SPACY NLP INTEGRATION - DEPLOYMENT CHECKLIST

## Pre-Deployment Setup

### Environment Setup
- [ ] Python 3.7+ installed
- [ ] pip package manager available
- [ ] Git repository up to date
- [ ] MongoDB connection verified
- [ ] Cloudinary API configured

### Dependency Installation
```bash
# Windows
cd backend
setup_spacy.bat

# Linux/Mac
cd backend
bash setup_spacy.sh
```

- [ ] Run setup script
- [ ] Verify "✓ Setup complete!" message
- [ ] Check no error messages

### Spacy Model Verification
```bash
python -m spacy download en_core_web_sm
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Ready')"
```

- [ ] Model downloads successfully (~40MB)
- [ ] Import test passes
- [ ] No "Module not found" errors

### Code Verification
- [ ] `backend/ml/spacy_skill_extractor.py` exists (412 lines)
- [ ] `backend/controllers/user.controller.js` has Spacy integration
- [ ] `backend/routes/user.route.js` has new endpoint
- [ ] `backend/ml/requirements.txt` includes spacy>=3.5.0

---

## Testing

### Unit Tests
```bash
# Test with sample resumes
python backend/ml/spacy_skill_extractor.py --input backend/ml/sample_resumes.jsonl
```

- [ ] Command runs without errors
- [ ] Returns JSON output with skills
- [ ] Produces 3 results for 3 resumes
- [ ] Skills detected: python, django, tensorflow, swift, etc.

### Manual Testing
```bash
# Test skill extraction
echo '{"id":"test", "text":"Senior developer with Python and React"}' | python backend/ml/spacy_skill_extractor.py
```

- [ ] Returns skills: ["python", "react"]
- [ ] Confidence score between 0-1
- [ ] Valid JSON output

### API Testing

#### 1. Upload Resume Test
```bash
curl -X POST http://localhost:3000/api/v1/user/profile/update \
  -F "file=@resume.pdf" \
  -H "Authorization: Bearer TOKEN"
```

- [ ] 200 response
- [ ] profile.skills populated
- [ ] profile.lastResumeAnalysis set
- [ ] Log shows "spacy-v1" extractor

#### 2. Manual Extraction Test
```bash
curl -X POST http://localhost:3000/api/v1/user/profile/extract-skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"resumeText":"Python expert with 10 years experience"}'
```

- [ ] 200 response
- [ ] data.skills contains "python"
- [ ] data.confidence > 0.5
- [ ] data.metrics present

#### 3. Confirm Skills Test
```bash
curl -X POST http://localhost:3000/api/v1/user/profile/confirm-skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"analysisId":"mongo_id", "confirmed":["python","react"]}'
```

- [ ] 200 response
- [ ] metrics updated
- [ ] f1 score calculated

### Database Testing
```javascript
// Check ResumeAnalysis collection
db.resumeanalyses.find().limit(1).pretty()
```

- [ ] Document has extractor: "spacy-v1"
- [ ] predicted array populated
- [ ] metrics object complete
- [ ] timestamps present

---

## Performance Testing

### Load Testing
```bash
# Test with 10 concurrent resume uploads
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/user/profile/update \
    -F "file=@resume.pdf" \
    -H "Authorization: Bearer TOKEN" &
done
```

- [ ] Server handles 10 concurrent requests
- [ ] No crashes or memory leaks
- [ ] Response times <5 seconds each
- [ ] All uploads successful

### Memory Monitoring
```bash
# Monitor server memory during processing
top -p $(pgrep -f "npm start") -b -d 1
```

- [ ] Memory usage stays <500MB
- [ ] Spacy model cached after first load
- [ ] No continuous memory growth

### Response Time
- [ ] First resume: 2-3 seconds (model load)
- [ ] Subsequent resumes: 0.5-1 second
- [ ] Average confidence: >0.85

---

## Error Handling Verification

### Test Error Cases

#### Missing File
```bash
curl -X POST http://localhost:3000/api/v1/user/profile/update \
  -H "Authorization: Bearer TOKEN"
```

- [ ] Returns 400 error
- [ ] Error message: "Profile photo is required"

#### Invalid Resume Text
```bash
curl -X POST http://localhost:3000/api/v1/user/profile/extract-skills \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"resumeText":""}'
```

- [ ] Returns 400 error
- [ ] Error message: "Resume text is required"

#### Missing Analysis
```bash
curl -X GET http://localhost:3000/api/v1/user/profile/resume-analysis/invalid_id \
  -H "Authorization: Bearer TOKEN"
```

- [ ] Returns 404 error
- [ ] Error message: "analysis not found"

#### Spacy Failure (Graceful Fallback)
- [ ] If Spacy fails, falls back to rule-based extraction
- [ ] Skills still extracted successfully
- [ ] extractor marked as "rule-v1" in database
- [ ] No 500 errors

---

## Data Quality Checks

### Skills Validation
```javascript
// Check skills are lowercase and deduplicated
db.resumeanalyses.findOne({}, {predicted: 1}).predicted
// Should be: ["python", "javascript", "react"] (no duplicates, lowercase)
```

- [ ] All skills are lowercase
- [ ] No duplicates in predicted array
- [ ] All skills are in vocabulary (or recognized)

### Metrics Validation
```javascript
// Check metrics are valid
db.resumeanalyses.findOne({}, {metrics: 1}).metrics
// Should have: TP, FP, FN, precision, recall, f1, jaccard
```

- [ ] All metric fields present
- [ ] Values are numbers
- [ ] precision, recall, f1 between 0-1
- [ ] TP + FP + FN = total skills (approximately)

### Text Preservation
- [ ] resumeText field not empty
- [ ] Text matches original resume content
- [ ] UTF-8 encoding preserved
- [ ] No data truncation

---

## Security Checks

### Authentication
- [ ] All endpoints require valid JWT token
- [ ] Anonymous requests return 401
- [ ] Token validation works

### Authorization
- [ ] Users can only access their own data
- [ ] Cannot update other users' profiles
- [ ] Cannot delete others' analyses

### Input Validation
- [ ] File upload validated
- [ ] Resume text sanitized
- [ ] JSON parsing error handled
- [ ] No code injection possible

### Sensitive Data
- [ ] Passwords not in logs
- [ ] Emails not exposed unnecessarily
- [ ] Tokens not visible in responses
- [ ] Database credentials secured

---

## Documentation Verification

- [ ] SPACY_QUICK_START.md exists and accurate
- [ ] SPACY_IMPLEMENTATION_SUMMARY.md complete
- [ ] SPACY_INTEGRATION_GUIDE.md detailed
- [ ] CODE_CHANGES_SUMMARY.md comprehensive
- [ ] SPACY_VERIFICATION.md thorough
- [ ] setup_spacy.sh executable on Linux/Mac
- [ ] setup_spacy.bat executable on Windows
- [ ] API endpoints documented
- [ ] Error codes documented
- [ ] Examples included

---

## Browser & Frontend Testing

### Frontend Integration Points
- [ ] Resume upload form works
- [ ] Skills displayed after upload
- [ ] Loading indicator shows
- [ ] Success message appears
- [ ] Error messages clear
- [ ] Skill confirmation works
- [ ] History viewable

### Cross-browser Testing (if applicable)
- [ ] Chrome/Chromium: ✓
- [ ] Firefox: ✓
- [ ] Safari: ✓
- [ ] Edge: ✓
- [ ] Mobile browsers: ✓

---

## Logging & Monitoring

### Log Messages
```bash
tail -f backend.log | grep -i "spacy\|extraction\|skills"
```

- [ ] Extraction start logged
- [ ] Spacy result logged
- [ ] Confidence score logged
- [ ] Metrics logged
- [ ] Errors logged with full context

### Monitoring Setup
- [ ] Error tracking enabled
- [ ] Performance metrics collected
- [ ] Database queries monitored
- [ ] API response times tracked

---

## Documentation Review

- [ ] No broken links in documentation
- [ ] Code examples are correct
- [ ] Setup instructions tested
- [ ] API endpoint formats accurate
- [ ] Response examples valid JSON

---

## Production Deployment

### Pre-Deployment Checklist
- [ ] All tests passing
- [ ] No error messages in logs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained

### Deployment Steps
1. [ ] Backup MongoDB
2. [ ] Pull latest code
3. [ ] Run `setup_spacy.sh` or `setup_spacy.bat`
4. [ ] Verify Spacy model downloaded
5. [ ] Start server with new code
6. [ ] Monitor logs for errors
7. [ ] Test with sample resume
8. [ ] Verify database updates
9. [ ] Monitor performance metrics
10. [ ] Check user feedback

### Post-Deployment
- [ ] Monitor error logs
- [ ] Track extraction accuracy
- [ ] Check response times
- [ ] Verify all users can upload resumes
- [ ] Monitor server resources
- [ ] Collect metrics for 24 hours

---

## Rollback Plan (If Issues)

If problems occur:

1. [ ] Stop server
2. [ ] Restore last stable code
3. [ ] Set environment variable: `USE_SPACY=false`
4. [ ] Restart server (uses rule-based extraction)
5. [ ] Verify users can upload again
6. [ ] Investigate root cause
7. [ ] Fix and test before re-deploying

---

## Success Criteria

All of the following must be true:

✓ Spacy model installed and loaded
✓ Dependencies installed without errors
✓ API endpoints respond correctly
✓ Skills extracted with 85%+ confidence
✓ Database stores results correctly
✓ Metrics calculated accurately
✓ Fallback extraction works
✓ Error handling graceful
✓ Performance acceptable
✓ Documentation complete
✓ No security issues
✓ Team trained and ready

---

## Monitoring Metrics

Track these metrics after deployment:

### Extraction Quality
- Average confidence score (target: >0.85)
- Precision score (target: >0.90)
- Recall score (target: >0.88)
- False positives per resume (target: <1)
- User confirmation rate (target: >0.95)

### Performance
- Average response time (target: <1 second)
- 95th percentile response time (target: <2 seconds)
- Server CPU usage (target: <50%)
- Server memory usage (target: <300MB)
- Error rate (target: <0.1%)

### Usage
- Resumes processed per day
- Average skills per resume
- Fallback rate (target: <5%)
- API endpoint hits per day

---

## Quick Reference Commands

```bash
# Verify Spacy installation
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Ready')"

# Test extractor with sample data
python backend/ml/spacy_skill_extractor.py --input backend/ml/sample_resumes.jsonl

# Start server
npm start

# Check logs for Spacy
tail -f server.log | grep -i spacy

# Check MongoDB for results
mongo jobportal_db --eval "db.resumeanalyses.countDocuments({extractor: 'spacy-v1'})"

# Monitor memory
top -b -n 1 | grep node

# View extraction metrics
mongo jobportal_db --eval "db.resumeanalyses.aggregate([{$group: {_id: null, avg_f1: {$avg: '\$metrics.f1'}}},])"
```

---

## Sign-Off Checklist

- [ ] Development complete
- [ ] Testing complete
- [ ] Documentation reviewed
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Team trained
- [ ] Backup created
- [ ] Deployment plan approved
- [ ] Ready for production

---

**Deployment Date**: _________________
**Deployed By**: _________________
**Approved By**: _________________

---

**Notes**:
```
[Space for deployment notes]
```

---

**Version**: 1.0 Spacy NLP Integration
**Status**: Ready for Deployment ✅
