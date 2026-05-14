@echo off
REM Quick Setup Script for Spacy Integration (Windows)
REM Run this from the backend\ directory

echo.
echo ==========================================
echo Spacy NLP Skills Extraction - Setup
echo ==========================================
echo.

REM Step 1: Install Python dependencies
echo [1/4] Installing Python dependencies...
pip install -r ml\requirements.txt
if errorlevel 1 (
    echo Error installing dependencies
    exit /b 1
)

REM Step 2: Download Spacy language model
echo.
echo [2/4] Downloading Spacy English model...
python -m spacy download en_core_web_sm
if errorlevel 1 (
    echo Error downloading Spacy model
    exit /b 1
)

REM Step 3: Verify installation
echo.
echo [3/4] Verifying Spacy installation...
python -c "import spacy; nlp = spacy.load('en_core_web_sm'); print('✓ Spacy en_core_web_sm loaded successfully')"
if errorlevel 1 (
    echo Failed to load Spacy model
    exit /b 1
)

REM Step 4: Test the extractor
echo.
echo [4/4] Testing Spacy skill extractor...
(
    echo {"id": "test-1", "text": "Senior developer with 10 years of experience in Python, JavaScript, React, Django, Docker, Kubernetes and AWS cloud architecture. Proficient in PostgreSQL, MongoDB and Redis. Strong problem-solving skills."}
) | python ml\spacy_skill_extractor.py

echo.
echo ==========================================
echo ✓ Setup complete!
echo ==========================================
echo.
echo Next steps:
echo 1. Start your backend server: npm start
echo 2. Upload a resume through the API
echo 3. Skills will be automatically extracted using Spacy NLP
echo.
echo API Endpoint: POST /api/v1/user/profile/update (with resume file)
echo Manual Extraction: POST /api/v1/user/profile/extract-skills
echo.
echo Documentation: ml\SPACY_INTEGRATION_GUIDE.md
echo.
pause
