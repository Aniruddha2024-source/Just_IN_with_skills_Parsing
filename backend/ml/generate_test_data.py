import json
import re
import os

# Read all resume files and extract actual skills
resumes = []
for i in range(1, 26):
    filename = f"resume{i}.txt"
    if os.path.exists(filename):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract skills from "Skills: X, Y, Z" line
            match = re.search(r'Skills:\s*(.+)', content)
            if match:
                skills_text = match.group(1).strip()
                # Split by comma and clean
                gold_skills = [s.strip().lower() for s in skills_text.split(',')]
                resumes.append({
                    "id": f"resume{i}",
                    "file": filename,
                    "gold_skills": gold_skills
                })

# Create test data
test_data = {
    "resumes": resumes,
    "jobs": [
        {
            "_id": "job1",
            "title": "Backend Developer",
            "description": "We need a Python developer with cloud experience",
            "requirements": ["python", "django", "aws"]
        },
        {
            "_id": "job2",
            "title": "Frontend Developer",
            "description": "JavaScript and React expert needed",
            "requirements": ["javascript", "react", "html", "css"]
        },
        {
            "_id": "job3",
            "title": "Full Stack Developer",
            "description": "Full stack developer with Node.js and React",
            "requirements": ["javascript", "node", "react", "sql"]
        }
    ]
}

# Save to test_data.json
with open('test_data.json', 'w', encoding='utf-8') as f:
    json.dump(test_data, f, indent=2, ensure_ascii=False)

print(f"Generated test_data.json with {len(resumes)} resumes")
