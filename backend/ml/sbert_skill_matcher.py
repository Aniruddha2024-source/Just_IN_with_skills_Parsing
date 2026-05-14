#!/usr/bin/env python
"""
SBERT Skill Matcher - Semantic similarity matching for job-resume skills
Uses Sentence-BERT to find semantic matches between job requirements and resume skills.

Input (JSON):
{
  "resume_skills": ["Python", "React", "MongoDB"],
  "job_skills": ["JavaScript", "Node.js", "NoSQL"],
  "threshold": 0.6
}

Output (JSON):
{
  "resume_skills": [...],
  "job_skills": [...],
  "matches": [
    {
      "resume_skill": "MongoDB",
      "job_skill": "NoSQL",
      "similarity": 0.85,
      "matched": true
    }
  ],
  "match_percentage": 66.7,
  "total_matches": 2,
  "unmatched_skills": ["Python", "React"],
  "missing_skills": ["JavaScript", "Node.js"]
}
"""

import sys
import json
import warnings
import numpy as np

warnings.filterwarnings('ignore')

try:
    from sentence_transformers import SentenceTransformer
    SBERT_AVAILABLE = True
except ImportError:
    SBERT_AVAILABLE = False


class SBERTSkillMatcher:
    """Match skills between resume and job using semantic similarity"""
    
    def __init__(self, model_name='all-MiniLM-L6-v2', threshold=0.5):
        """
        Initialize SBERT model
        
        Args:
            model_name: HuggingFace model ID (all-MiniLM-L6-v2 is fast & accurate)
            threshold: Similarity threshold for matching (0.0-1.0)
        """
        self.model = None
        self.threshold = threshold
        self.available = False
        
        if SBERT_AVAILABLE:
            try:
                self.model = SentenceTransformer(model_name)
                self.available = True
            except Exception as e:
                print(f"Error loading SBERT model: {str(e)}", file=sys.stderr)
    
    def match_skills(self, resume_skills, job_skills, threshold=None):
        """
        Match resume skills with job skills using semantic similarity
        
        Args:
            resume_skills: List of skills from resume
            job_skills: List of skills from job description
            threshold: Optional override threshold
            
        Returns:
            Dict with matching results
        """
        if threshold is None:
            threshold = self.threshold
        
        if not self.available or not self.model:
            return self._fallback_match(resume_skills, job_skills, threshold)
        
        try:
            # Normalize inputs
            resume_skills = [str(s).lower().strip() for s in resume_skills]
            job_skills = [str(s).lower().strip() for s in job_skills]
            
            # Deduplicate
            resume_skills = list(set(resume_skills))
            job_skills = list(set(job_skills))
            
            if not resume_skills or not job_skills:
                return self._empty_result(resume_skills, job_skills)
            
            # Encode skills
            resume_embeddings = self.model.encode(resume_skills)
            job_embeddings = self.model.encode(job_skills)
            
            # Calculate similarities using cosine similarity
            similarities = np.dot(resume_embeddings, job_embeddings.T)
            
            # Find matches
            matches = []
            matched_resume = set()
            matched_jobs = set()
            
            for i, resume_skill in enumerate(resume_skills):
                for j, job_skill in enumerate(job_skills):
                    sim = float(similarities[i][j])
                    
                    if sim >= threshold:
                        matches.append({
                            'resume_skill': resume_skill,
                            'job_skill': job_skill,
                            'similarity': round(sim, 3),
                            'matched': True
                        })
                        matched_resume.add(resume_skill)
                        matched_jobs.add(job_skill)
            
            # Find unmatched skills
            unmatched_resume = [s for s in resume_skills if s not in matched_resume]
            unmatched_jobs = [s for s in job_skills if s not in matched_jobs]
            
            # Calculate match percentage
            total_skills = len(resume_skills)
            match_percentage = (len(matched_resume) / total_skills * 100) if total_skills > 0 else 0
            
            return {
                'resume_skills': resume_skills,
                'job_skills': job_skills,
                'matches': sorted(matches, key=lambda x: x['similarity'], reverse=True),
                'match_percentage': round(match_percentage, 1),
                'total_matches': len(matched_resume),
                'total_resume_skills': len(resume_skills),
                'total_job_skills': len(job_skills),
                'unmatched_resume_skills': unmatched_resume,
                'missing_job_skills': unmatched_jobs,
                'confidence': True,
                'model': 'sbert'
            }
        
        except Exception as e:
            print(f"Error in SBERT matching: {str(e)}", file=sys.stderr)
            return self._fallback_match(resume_skills, job_skills, threshold)
    
    def _empty_result(self, resume_skills, job_skills):
        """Return empty result structure"""
        return {
            'resume_skills': resume_skills,
            'job_skills': job_skills,
            'matches': [],
            'match_percentage': 0.0,
            'total_matches': 0,
            'total_resume_skills': len(resume_skills),
            'total_job_skills': len(job_skills),
            'unmatched_resume_skills': resume_skills,
            'missing_job_skills': job_skills,
            'confidence': True,
            'model': 'sbert'
        }
    
    def _fallback_match(self, resume_skills, job_skills, threshold):
        """
        Fallback to string-based matching if SBERT unavailable
        Uses Jaro-Winkler similarity
        """
        resume_skills = [str(s).lower().strip() for s in resume_skills]
        job_skills = [str(s).lower().strip() for s in job_skills]
        
        resume_skills = list(set(resume_skills))
        job_skills = list(set(job_skills))
        
        matches = []
        matched_resume = set()
        matched_jobs = set()
        
        # Exact and partial matching
        for resume_skill in resume_skills:
            for job_skill in job_skills:
                # Exact match
                if resume_skill == job_skill:
                    similarity = 1.0
                # Substring match
                elif resume_skill in job_skill or job_skill in resume_skill:
                    similarity = 0.85
                # Jaro-Winkler similarity (simple implementation)
                else:
                    similarity = self._jaro_winkler(resume_skill, job_skill)
                
                if similarity >= threshold:
                    matches.append({
                        'resume_skill': resume_skill,
                        'job_skill': job_skill,
                        'similarity': round(similarity, 3),
                        'matched': True
                    })
                    matched_resume.add(resume_skill)
                    matched_jobs.add(job_skill)
        
        unmatched_resume = [s for s in resume_skills if s not in matched_resume]
        unmatched_jobs = [s for s in job_skills if s not in matched_jobs]
        
        total_skills = len(resume_skills)
        match_percentage = (len(matched_resume) / total_skills * 100) if total_skills > 0 else 0
        
        return {
            'resume_skills': resume_skills,
            'job_skills': job_skills,
            'matches': sorted(matches, key=lambda x: x['similarity'], reverse=True),
            'match_percentage': round(match_percentage, 1),
            'total_matches': len(matched_resume),
            'total_resume_skills': len(resume_skills),
            'total_job_skills': len(job_skills),
            'unmatched_resume_skills': unmatched_resume,
            'missing_job_skills': unmatched_jobs,
            'confidence': False,
            'model': 'fallback'
        }
    
    @staticmethod
    def _jaro_winkler(s1, s2, prefix_weight=0.1):
        """Calculate Jaro-Winkler similarity"""
        if s1 == s2:
            return 1.0
        
        len1, len2 = len(s1), len(s2)
        if len1 == 0 or len2 == 0:
            return 0.0
        
        # Match window
        match_distance = max(len1, len2) // 2 - 1
        if match_distance < 0:
            match_distance = 0
        
        s1_matches = [False] * len1
        s2_matches = [False] * len2
        matches = 0
        
        for i in range(len1):
            start = max(0, i - match_distance)
            end = min(i + match_distance + 1, len2)
            
            for j in range(start, end):
                if s2_matches[j] or s1[i] != s2[j]:
                    continue
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break
        
        if matches == 0:
            return 0.0
        
        transpositions = 0
        k = 0
        for i in range(len1):
            if not s1_matches[i]:
                continue
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1
        
        jaro = (matches / len1 + matches / len2 + 
                (matches - transpositions / 2) / matches) / 3.0
        
        # Apply Jaro-Winkler modification
        prefix = 0
        for i in range(min(len(s1), len(s2))):
            if s1[i] == s2[i]:
                prefix += 1
            else:
                break
        
        prefix = min(prefix, 4)
        return jaro + prefix * prefix_weight * (1 - jaro)


def main():
    """Main function to process skill matching requests"""
    matcher = SBERTSkillMatcher(threshold=0.5)
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        try:
            data = json.loads(line)
            resume_skills = data.get('resume_skills', [])
            job_skills = data.get('job_skills', [])
            threshold = data.get('threshold', 0.5)
            
            result = matcher.match_skills(resume_skills, job_skills, threshold)
            print(json.dumps(result, ensure_ascii=False))
        
        except json.JSONDecodeError:
            continue
        except Exception as e:
            error_result = {
                'error': str(e),
                'matches': [],
                'match_percentage': 0.0
            }
            print(json.dumps(error_result))


if __name__ == '__main__':
    main()
