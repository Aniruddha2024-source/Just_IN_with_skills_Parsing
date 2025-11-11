#!/usr/bin/env python
"""
Extract text from resume files (PDF, DOCX). Usage:

python extract_resume.py /path/to/file

Outputs JSON to stdout: {"text": "..."}

This script uses pdfminer.six for PDFs and python-docx for DOCX.
"""
import sys
import json
import os

path = None
if len(sys.argv) < 2:
    print(json.dumps({"error": "No file path provided"}))
    sys.exit(2)

path = sys.argv[1]
if not os.path.exists(path):
    print(json.dumps({"error": "File not found"}))
    sys.exit(2)

_, ext = os.path.splitext(path)
ext = ext.lower()

try:
    if ext in ['.pdf']:
        # lazy import
        from io import StringIO
        from pdfminer.high_level import extract_text
        text = extract_text(path)
    elif ext in ['.docx']:
        from docx import Document
        doc = Document(path)
        parts = []
        for para in doc.paragraphs:
            parts.append(para.text)
        text = '\n'.join(parts)
    else:
        # fallback: try to read as text
        with open(path, 'rb') as f:
            raw = f.read()
            # try utf-8 first
            try:
                text = raw.decode('utf-8')
            except Exception:
                # fallback: if file looks like utf-16 (many null bytes), try utf-16
                if raw.count(b'\x00') > max(1, len(raw) // 10):
                    try:
                        text = raw.decode('utf-16', errors='ignore')
                    except Exception:
                        text = raw.decode('utf-8', errors='ignore')
                else:
                    text = raw.decode('utf-8', errors='ignore')

    # Ensure output is JSON-safe
    if not isinstance(text, str):
        text = str(text)

    print(json.dumps({"text": text}))
    sys.exit(0)
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
