#!/usr/bin/env python
"""
Simple TF-IDF + cosine similarity matcher.
Input (JSON from stdin):
{
  "resume_text": "...",
  "jobs": [
    {"_id": "123", "title": "...", "description": "...", "requirements": ["skill1","skill2"]},
    ...
  ],
  "top_n": 10
}
Output (JSON to stdout):
{
  "matches": [
    {"jobId": "123", "title": "...", "score": 0.87},
    ...
  ]
}

This script is intentionally small and dependency-light (scikit-learn + numpy).
It does NOT perform heavy NLP parsing of resumes (no spaCy) — it uses raw text TF-IDF.
"""

import sys
import json
from typing import List

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
except Exception as e:
    print(json.dumps({"error": "missing dependencies: {}".format(str(e))}))
    sys.exit(2)


def combine_job_text(job: dict) -> str:
    parts = []
    if job.get('title'):
        parts.append(job['title'])
    if job.get('description'):
        parts.append(job['description'])
    if job.get('requirements'):
        # requirements may be list
        if isinstance(job['requirements'], list):
            parts.append(' '.join(job['requirements']))
        else:
            parts.append(str(job['requirements']))
    return ' \n '.join(parts)


def main():
    try:
        raw = sys.stdin.read()
        if not raw:
            print(json.dumps({"matches": []}))
            return
        data = json.loads(raw)
        resume_text = data.get('resume_text', '')
        jobs = data.get('jobs', [])
        top_n = int(data.get('top_n', 10))

        if not resume_text or not jobs:
            print(json.dumps({"matches": []}))
            return

        job_texts: List[str] = [combine_job_text(job) for job in jobs]

        # Build corpus with resume first so that indices align
        corpus = [resume_text] + job_texts

        vectorizer = TfidfVectorizer(stop_words='english', max_features=20000)
        tfidf = vectorizer.fit_transform(corpus)

        # resume vector is row 0, jobs are 1..n
        resume_vec = tfidf[0]
        job_vecs = tfidf[1:]

        sims = cosine_similarity(resume_vec, job_vecs)[0]  # shape (n_jobs,)

        indexed = list(enumerate(sims))
        # sort by descending similarity
        indexed.sort(key=lambda x: x[1], reverse=True)

        matches = []
        for idx, score in indexed[:top_n]:
            job = jobs[idx]
            matches.append({
                "jobId": str(job.get('_id', '')),
                "title": job.get('title', ''),
                "score": float(round(score, 4))
            })

        print(json.dumps({"matches": matches}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
