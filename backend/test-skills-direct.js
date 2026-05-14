/**
 * Direct Skill Extraction Test
 * Tests the Spacy skill extraction without API
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const SPACY_EXTRACTOR = path.join(process.cwd(), 'ml', 'spacy_skill_extractor.py');

console.log('\n🧪 DIRECT SKILL EXTRACTION TEST\n');
console.log('═'.repeat(60));

// Test job descriptions
const testJobs = [
  {
    name: 'Senior Full Stack Developer',
    text: `
      We are looking for an experienced Full Stack Developer.
      You will work with React, Node.js, and PostgreSQL.
      Experience with AWS, Docker, and Kubernetes is required.
      You will build scalable web applications using React and TypeScript.
      Develop REST APIs with Node.js and Express.
      Manage databases with PostgreSQL and MongoDB.
      Strong problem-solving skills and Git experience required.
    `
  },
  {
    name: 'Python Data Scientist',
    text: `
      We need a Data Scientist with expertise in Python and machine learning.
      You will work with TensorFlow, PyTorch, and scikit-learn.
      Experience with pandas, numpy, and matplotlib is essential.
      You should have knowledge of SQL and experience with Jupyter notebooks.
      Strong statistics background and experience with AWS or Azure.
      Work with Kubernetes and Docker for model deployment.
      Knowledge of Apache Spark and big data technologies is a plus.
    `
  },
  {
    name: 'DevOps Engineer',
    text: `
      Looking for a DevOps Engineer to manage our cloud infrastructure.
      Experience with AWS, Azure, or Google Cloud Platform required.
      Strong knowledge of Kubernetes, Docker, and container orchestration.
      Experience with CI/CD pipelines, Jenkins, and GitLab CI.
      Proficient with Terraform and Infrastructure as Code.
      Linux system administration and shell scripting.
      Experience with monitoring tools like Prometheus and Grafana.
      Knowledge of networking, VPCs, and load balancing.
    `
  }
];

async function extractSkillsFromText(jobTitle, jobText) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing: ${jobTitle}`);
    console.log('─'.repeat(60));
    
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [SPACY_EXTRACTOR], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: process.cwd()
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.log(`❌ Python error (code ${code}):`);
        if (stderr) console.log(stderr);
        resolve(null);
        return;
      }

      try {
        const result = JSON.parse(stdout);
        console.log(`✅ Extracted ${result.skills.length} skills:`);
        console.log(`   Skills: ${result.skills.slice(0, 8).join(', ')}${result.skills.length > 8 ? '...' : ''}`);
        
        if (result.entities && Object.keys(result.entities).length > 0) {
          console.log(`   Entities found:`, Object.keys(result.entities).join(', '));
        }
        
        console.log(`   Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        resolve(result);
      } catch (e) {
        console.log('❌ Failed to parse result:', e.message);
        resolve(null);
      }
    });

    // Send input
    pythonProcess.stdin.write(jobText);
    pythonProcess.stdin.end();
  });
}

async function runTests() {
  console.log('\n🚀 Starting skill extraction tests...\n');
  
  const results = [];
  for (const job of testJobs) {
    const result = await extractSkillsFromText(job.name, job.text);
    results.push({
      job: job.name,
      result: result
    });
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  
  let successful = 0;
  let totalSkills = 0;
  
  results.forEach((r) => {
    if (r.result) {
      successful++;
      totalSkills += r.result.skills.length;
      console.log(`✅ ${r.job}: ${r.result.skills.length} skills`);
    } else {
      console.log(`❌ ${r.job}: Failed`);
    }
  });

  console.log(`\n📈 Results:`);
  console.log(`   Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);
  console.log(`   Total Skills Extracted: ${totalSkills}`);
  console.log(`   Average Skills per Job: ${(totalSkills / successful).toFixed(1)}`);
  
  console.log('\n' + '═'.repeat(60));
  console.log('✨ Direct skill extraction test completed!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
