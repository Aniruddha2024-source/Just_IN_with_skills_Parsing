#!/bin/bash
# Quick Setup Script for Spacy Integration
# Run this from the backend/ directory

echo "=========================================="
echo "Spacy NLP Skills Extraction - Setup"
echo "=========================================="

# Step 1: Install Python dependencies
echo ""
echo "📦 Installing Python dependencies..."
pip install -r ml/requirements.txt

# Step 2: Download Spacy language model
echo ""
echo "📥 Downloading Spacy English model..."
python -m spacy download en_core_web_sm

# Step 3: Verify installation
echo ""
echo "✓ Verifying Spacy installation..."
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Spacy en_core_web_sm loaded successfully')" || {
  echo "❌ Failed to load Spacy model. Try: python -m spacy download en_core_web_sm"
  exit 1
}

# Step 4: Test the extractor
echo ""
echo "🧪 Testing Spacy skill extractor..."
python ml/spacy_skill_extractor.py << 'EOF'
{"id": "test-1", "text": "Senior developer with 10 years of experience in Python, JavaScript, React, Django, Docker, Kubernetes and AWS cloud architecture. Proficient in PostgreSQL, MongoDB and Redis. Strong problem-solving skills."}
EOF

echo ""
echo "=========================================="
echo "✓ Setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Start your backend server: npm start"
echo "2. Upload a resume through the API"
echo "3. Skills will be automatically extracted using Spacy NLP"
echo ""
echo "API Endpoint: POST /api/v1/user/profile/update (with resume file)"
echo "Manual Extraction: POST /api/v1/user/profile/extract-skills"
echo ""
echo "Documentation: ml/SPACY_INTEGRATION_GUIDE.md"
