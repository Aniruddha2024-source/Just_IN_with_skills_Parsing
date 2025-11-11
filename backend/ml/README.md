Python TF-IDF matcher

This small script (`matcher.py`) reads JSON from stdin with the following shape:

{
  "resume_text": "...",
  "jobs": [{"_id":"...","title":"...","description":"...","requirements":[...]}, ...],
  "top_n": 10
}

It prints JSON with ranked matches (jobId, title, score) to stdout.

Install dependencies (recommended in a virtualenv):

pip install -r requirements.txt

Run example:

python matcher.py < input.json

From Node, you can spawn this script and pass the input JSON via stdin and read stdout.

Notes:
- Uses scikit-learn TF-IDF and cosine similarity.
- Keep the resume text reasonably cleaned for best results.
