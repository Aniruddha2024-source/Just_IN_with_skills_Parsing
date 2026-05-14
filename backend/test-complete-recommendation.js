#!/usr/bin/env node
/**
 * Complete Job Recommendation System Test
 * Tests skill extraction + SBERT matching + email recommendation flow
 */

import { spawn } from 'child_process';
import path from 'path';

const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const SPACY_EXTRACTOR = path.join(process.cwd(), 'ml', 'spacy_skill_extractor.py');
const SBERT_MATCHER = path.join(process.cwd(), 'ml', 'sbert_skill_matcher.py');

console.log('\n🚀 COMPLETE JOB RECOMMENDATION SYSTEM TEST\n');
console.log('═'.repeat(80));

// Sample resumes and jobs for testing
const testData = {
  resume: {
    name: 'John Doe',
    text: 'Experienced Full Stack Developer with 5 years in React, Node.js, and MongoDB. Strong knowledge of TypeScript, Express, PostgreSQL, Docker, AWS, and Git.'
  },
  jobs: [
    {
      title: 'Senior React Developer',
      description: 'We need a React expert with experience in TypeScript and modern frontend frameworks. Knowledge of Node.js backend is a plus. Docker and AWS experience required.'
    },
    {
      title: 'DevOps Engineer',
      description: 'Looking for DevOps professional with Kubernetes, Docker, AWS, Terraform, and Linux expertise. CI/CD pipeline experience essential.'
    },
    {
      title: 'Python Data Scientist',
      description: 'Need Data Scientist with Python, TensorFlow, PyTorch, SQL, and Jupyter expertise. Machine learning and statistics knowledge required.'
    }
  ]
};

async function extractSkills(text, type) {
  return new Promise((resolve) => {
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [SPACY_EXTRACTOR], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0 || !stdout) {
        resolve([]);
        return;
      }

      try {
        const lines = stdout.trim().split('\n').filter(l => l);
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result.predicted || []);
      } catch (e) {
        resolve([]);
      }
    });

    const input = { id: `${type}-${Date.now()}`, text };
    pythonProcess.stdin.write(JSON.stringify(input) + '\n');
    pythonProcess.stdin.end();
  });
}

async function matchSkills(resumeSkills, jobSkills) {
  return new Promise((resolve) => {
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [SBERT_MATCHER], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let stdout = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0 || !stdout) {
        resolve(null);
        return;
      }

      try {
        const lines = stdout.trim().split('\n').filter(l => l);
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch (e) {
        resolve(null);
      }
    });

    const input = {
      resume_skills: resumeSkills,
      job_skills: jobSkills,
      threshold: 0.5
    };

    pythonProcess.stdin.write(JSON.stringify(input) + '\n');
    pythonProcess.stdin.end();
  });
}

function generateEmailPreview(jobTitle, matchPercentage, matchedSkills) {
  const topSkills = matchedSkills.slice(0, 3).map(m => m.resume_skill).join(', ');
  return `
📧 EMAIL PREVIEW
──────────────────────────────────
From: jobportal@app.com
To: john@example.com
Subject: 🎯 Job Recommendation: ${jobTitle} (${matchPercentage}% Match)

Hi John,

We found a ${matchPercentage}% match for you!

Job: ${jobTitle}
Matched Skills: ${topSkills}
Match Percentage: ${matchPercentage}%

[View Job] [Learn Missing Skills]

Best regards,
Job Portal Team
──────────────────────────────────
`;
}

async function runCompleteTest() {
  console.log('📋 Test Configuration:\n');
  console.log(`Resume: ${testData.resume.name}`);
  console.log(`Jobs to Match: ${testData.jobs.length}\n`);

  console.log('═'.repeat(80));
  console.log('\n📝 STEP 1: Extract Skills from Resume\n');

  const resumeSkills = await extractSkills(testData.resume.text, 'resume');
  console.log(`✅ Extracted ${resumeSkills.length} skills from resume`);
  console.log(`   Skills: ${resumeSkills.slice(0, 8).join(', ')}${resumeSkills.length > 8 ? '...' : ''}\n`);

  console.log('═'.repeat(80));
  console.log('\n🔍 STEP 2: Process Jobs & Extract Skills\n');

  const jobsWithSkills = [];
  for (let i = 0; i < testData.jobs.length; i++) {
    const job = testData.jobs[i];
    const jobSkills = await extractSkills(job.description, `job-${i}`);
    jobsWithSkills.push({
      title: job.title,
      skills: jobSkills
    });
    console.log(`✅ Job ${i + 1}: "${job.title}"`);
    console.log(`   Extracted ${jobSkills.length} skills: ${jobSkills.slice(0, 5).join(', ')}...\n`);
  }

  console.log('═'.repeat(80));
  console.log('\n🤖 STEP 3: SBERT Semantic Matching\n');

  let recommendedJobs = [];
  for (const jobData of jobsWithSkills) {
    const matchResult = await matchSkills(resumeSkills, jobData.skills);
    if (matchResult) {
      recommendedJobs.push({
        ...jobData,
        matchResult
      });
      console.log(`✅ ${jobData.title}`);
      console.log(`   Match: ${matchResult.match_percentage}%`);
      console.log(`   Matched: ${matchResult.total_matches}/${matchResult.total_resume_skills} skills`);
      console.log(`   Top Matches: ${matchResult.matches.slice(0, 2).map(m => `${m.resume_skill}→${m.job_skill}`).join(', ')}\n`);
    }
  }

  // Filter and sort by match percentage
  recommendedJobs = recommendedJobs
    .filter(j => j.matchResult.match_percentage >= 40)
    .sort((a, b) => b.matchResult.match_percentage - a.matchResult.match_percentage);

  console.log('═'.repeat(80));
  console.log('\n📨 STEP 4: Email Recommendations\n');

  if (recommendedJobs.length > 0) {
    console.log(`✅ ${recommendedJobs.length} jobs to recommend\n`);
    
    recommendedJobs.forEach((job, idx) => {
      const preview = generateEmailPreview(
        job.title,
        job.matchResult.match_percentage,
        job.matchResult.matches
      );
      console.log(preview);
    });
  } else {
    console.log('❌ No jobs matching the criteria (40%+ match)');
  }

  console.log('═'.repeat(80));
  console.log('\n📊 FINAL SUMMARY\n');

  console.log(`Resume Skills Extracted: ${resumeSkills.length}`);
  console.log(`Total Jobs Processed: ${jobsWithSkills.length}`);
  console.log(`Recommended Jobs (40%+ match): ${recommendedJobs.length}`);
  
  if (recommendedJobs.length > 0) {
    console.log(`\nTop Recommendation:`);
    const topJob = recommendedJobs[0];
    console.log(`  📌 ${topJob.title} (${topJob.matchResult.match_percentage}% match)`);
    console.log(`  ✉️ Email would be sent with details`);
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n🎉 Complete Job Recommendation System Test Finished!\n');

  process.exit(0);
}

runCompleteTest().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
