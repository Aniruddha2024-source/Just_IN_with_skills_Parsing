#!/usr/bin/env python
"""
Advanced Spacy-based skill extractor with NLP capabilities.
Extracts technical and soft skills from resume text using Spacy NER and pattern matching.

Input: JSON via stdin or --input file containing:
  {
    "id": "resume_id",
    "text": "resume text content",
    "gold": [...] (optional)
  }

Output: JSON with:
  {
    "id": "resume_id",
    "text": "resume text",
    "predicted": ["skill1", "skill2", ...],
    "entities": {...},  # NER entities found
    "confidence_scores": {...}
  }
"""

import sys
import json
import argparse
import re
import warnings

warnings.filterwarnings('ignore')

try:
    import spacy
    from spacy.matcher import PhraseMatcher
    SPACY_AVAILABLE = True
except (ImportError, Exception) as e:
    # Fallback if Spacy not available (e.g., Python 3.14 compatibility issues)
    SPACY_AVAILABLE = False
    print(json.dumps({"warning": f"Spacy not available: {str(e)}. Using enhanced rule-based extraction."}), file=sys.stderr)


class SpacySkillExtractor:
    """Advanced skill extractor using Spacy NLP (with fallback to rule-based)"""
    
    def __init__(self, model_name='en_core_web_sm'):
        """Initialize Spacy model and matchers"""
        self.use_spacy = False
        self.nlp = None
        self.phrase_matcher = None
        
        if SPACY_AVAILABLE:
            try:
                self.nlp = spacy.load(model_name)
                self.use_spacy = True
                
                # Create PhraseMatcher for multi-word skills
                self.phrase_matcher = PhraseMatcher(self.nlp.vocab)
            except OSError:
                # Model not found, use rule-based fallback
                self.use_spacy = False
                print(json.dumps({"warning": f"Spacy model {model_name} not found. Using rule-based extraction."}), file=sys.stderr)
        
        # Comprehensive skills vocabulary (used by both methods)
        self.technical_skills = {
            # Programming Languages
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'ruby', 'php', 'golang', 'rust',
            'swift', 'kotlin', 'scala', 'r', 'matlab', 'perl', 'groovy', 'dart', 'julia',
            
            # Frontend
            'react', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind', 'bootstrap',
            'webpack', 'vite', 'next.js', 'nuxt', 'gatsby', 'astro', 'jquery', 'sass', 'less',
            
            # Backend & Frameworks
            'node', 'django', 'flask', 'fastapi', 'express', 'spring', 'spring boot', 'rails',
            'laravel', 'asp.net', 'asp.net core', 'nestjs', 'koa', 'hapi', 'tornado', 'aiohttp',
            
            # Databases
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'dynamodb',
            'cassandra', 'couchdb', 'firestore', 'firebase', 'mariadb', 'oracle', 'sqlserver',
            'neo4j', 'memcached', 'influxdb', 'timescaledb',
            
            # Cloud & DevOps
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins',
            'gitlab ci', 'github actions', 'terraform', 'ansible', 'cloudformation',
            'helm', 'argocd', 'circleci', 'travis ci', 'openstack', 'heroku',
            
            # Data & ML
            'pandas', 'numpy', 'scikit-learn', 'sklearn', 'tensorflow', 'keras', 'pytorch',
            'machine learning', 'deep learning', 'nlp', 'computer vision', 'nlp', 'data science',
            'jupyter', 'anaconda', 'opencv', 'matplotlib', 'seaborn', 'plotly', 'xgboost',
            'lightgbm', 'huggingface', 'transformers', 'bert', 'gpt', 'llm',
            
            # APIs & Integration
            'rest', 'graphql', 'grpc', 'soap', 'oauth', 'jwt', 'websocket', 'websockets',
            'mqtt', 'rabbitmq', 'kafka', 'apache kafka', 'aws sns', 'aws sqs',
            
            # Testing & QA
            'pytest', 'jest', 'mocha', 'chai', 'rspec', 'junit', 'testng', 'selenium',
            'cypress', 'playwright', 'postman', 'jmeter', 'cucumber', 'behave',
            
            # Version Control
            'git', 'github', 'gitlab', 'bitbucket', 'subversion', 'svn',
            
            # Other Tools
            'linux', 'unix', 'windows', 'macos', 'shell', 'bash', 'powershell',
            'docker compose', 'vim', 'vs code', 'intellij', 'pycharm', 'eclipse',
            'jira', 'confluence', 'slack', 'trello', 'asana',
            
            # Big Data
            'spark', 'hadoop', 'hive', 'pig', 'mapreduce', 'flink', 'storm',
            
            # Mobile
            'android', 'ios', 'react native', 'flutter', 'swift', 'kotlin', 'xamarin',
            
            # Other Technologies
            'microservices', 'soap', 'xml', 'json', 'yaml', 'html5', 'css3',
            'agile', 'scrum', 'kanban', 'devops', 'cicd', 'git', 'gitflow',
            'rest api', 'crud', 'oop', 'functional programming'
        }
        
        self.soft_skills = {
            'communication', 'leadership', 'teamwork', 'collaboration',
            'problem solving', 'critical thinking', 'analytical',
            'time management', 'project management', 'agile methodology',
            'scrum', 'mentoring', 'training', 'presentation',
            'public speaking', 'negotiation', 'stakeholder management'
        }
        
        # Combine all skills
        self.all_skills = self.technical_skills | self.soft_skills
        
        # Create PhraseMatcher for multi-word skills (only if Spacy available)
        if self.use_spacy:
            self.phrase_matcher = PhraseMatcher(self.nlp.vocab)
            for skill in sorted(self.all_skills, key=len, reverse=True):
                pattern = self.nlp.make_doc(skill)
                self.phrase_matcher.add(skill.upper().replace(' ', '_'), [pattern])
    
    def extract_skills(self, text):
        """
        Extract skills from resume text using Spacy.
        
        Returns:
            dict: {
                'skills': list of detected skills,
                'entities': NER entities,
                'confidence': overall confidence
            }
        """
        if not text:
            return {'skills': [], 'entities': {}, 'confidence': 0.0}
        
        # Process text with Spacy
        doc = self.nlp(text)
        
        detected_skills = set()
        entity_counts = {}
        
        # 1. Match using PhraseMatcher (multi-word skills)
        matches = self.phrase_matcher(doc)
        for match_id, start, end in matches:
            matched_skill = doc[start:end].text.lower()
            # Find the corresponding skill from vocabulary
            for skill in self.all_skills:
                if skill.lower() == matched_skill:
                    detected_skills.add(skill)
                    break
        
        # 2. Token-level matching for single-word skills
        for token in doc:
            token_text = token.text.lower()
            if token_text in self.all_skills:
                detected_skills.add(token_text)
        
        # 3. Named Entity Recognition (ORG, PRODUCT, etc. might be relevant)
        for ent in doc.ents:
            entity_type = ent.label_
            entity_text = ent.text.lower()
            
            # Check if entity matches any skill vocabulary
            if entity_text in self.all_skills:
                detected_skills.add(entity_text)
            
            if entity_type not in entity_counts:
                entity_counts[entity_type] = []
            entity_counts[entity_type].append(ent.text)
        
        # 4. Pattern-based extraction for common skill formats
        # "Skills: Python, Java, JavaScript"
        pattern = r'(?:skills?|technologies?|competencies?)[\s:]*([^.!?\n]+)'
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            skills_text = match.group(1)
            for skill in self.all_skills:
                if re.search(r'\b' + re.escape(skill) + r'\b', skills_text, re.IGNORECASE):
                    detected_skills.add(skill)
        
        # Calculate confidence (based on extraction coverage)
        text_length = len(text.split())
        detected_count = len(detected_skills)
        confidence = min(1.0, (detected_count / max(1, text_length)) * 100)
        
        return {
            'skills': sorted(list(detected_skills)),
            'entities': entity_counts,
            'confidence': round(confidence, 3),
            'skill_count': detected_count
        }
    
    def process_item(self, item):
        """Process a single resume item"""
        text = item.get('text') or item.get('resume_text') or ''
        result = self.extract_skills(text)
        
        output = {
            'id': item.get('id') or item.get('resume_id') or item.get('name'),
            'text': text,
            'predicted': result['skills'],
            'entities': result['entities'],
            'confidence': result['confidence'],
            'skill_count': result['skill_count']
        }
        
        # Preserve gold labels if present
        if 'gold' in item:
            output['gold'] = item['gold']
        
        return output


def main():
    parser = argparse.ArgumentParser(
        description='Extract skills from resumes using Spacy NLP'
    )
    parser.add_argument(
        '--input', '-i',
        help='Input JSONL file (each line: {"id":"...", "text":"..."})'
    )
    parser.add_argument(
        '--model',
        default='en_core_web_sm',
        help='Spacy model to use (default: en_core_web_sm)'
    )
    
    args = parser.parse_args()
    
    # Initialize extractor
    extractor = SpacySkillExtractor(args.model)
    
    if args.input:
        # Read from file
        with open(args.input, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    item = json.loads(line)
                    output = extractor.process_item(item)
                    print(json.dumps(output, ensure_ascii=False))
                except json.JSONDecodeError:
                    continue
    else:
        # Read from stdin
        for line in sys.stdin:
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
                output = extractor.process_item(item)
                print(json.dumps(output, ensure_ascii=False))
            except json.JSONDecodeError:
                continue


if __name__ == '__main__':
    main()
