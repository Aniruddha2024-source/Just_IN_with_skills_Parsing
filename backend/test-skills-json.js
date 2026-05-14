/**
 * Skill Extraction Test - Using JSON Format
 */

import { spawn } from 'child_process';
import path from 'path';

const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const SPACY_EXTRACTOR = path.join(process.cwd(), 'ml', 'spacy_skill_extractor.py');

console.log('\n🧪 JOB SKILL EXTRACTION TEST\n');
console.log('═'.repeat(60));

// Test job descriptions in JSON format
const testJobs = [
  {
    id: 'job-001',
    text: 'Senior Full Stack Developer. We need React, Node.js, PostgreSQL, AWS, Docker, Kubernetes, Express, REST APIs, GraphQL, TypeScript, Git expertise.'
  },
  {
    id: 'job-002',
    text: 'Python Data Scientist. Must have TensorFlow, PyTorch, scikit-learn, pandas, numpy, matplotlib, SQL, Jupyter, AWS, Kubernetes, Spark knowledge.'
  },
  {
    id: 'job-003',
    text: 'DevOps Engineer. Require AWS, Azure, Docker, Kubernetes, CI/CD, Jenkins, Terraform, Linux, Shell scripting, Prometheus, Grafana experience.'
  }
];

async function extractSkills(jobData) {
  return new Promise((resolve) => {
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [SPACY_EXTRACTOR], {
      stdio: ['pipe', 'pipe', 'pipe']
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
      if (stderr && !stderr.includes('warning')) {
        console.log(`  ❌ Error: ${stderr.trim()}`);
        resolve(null);
        return;
      }

      if (stdout) {
        try {
          // Parse all output lines (could be multiple)
          const lines = stdout.trim().split('\n').filter(l => l);
          const lastLine = lines[lines.length - 1];
          const result = JSON.parse(lastLine);
          resolve(result);
        } catch (e) {
          console.log(`  ❌ Parse error: ${e.message}`);
          resolve(null);
        }
      } else {
        console.log(`  ❌ No output from extractor`);
        resolve(null);
      }
    });

    pythonProcess.stdin.write(JSON.stringify(jobData) + '\n');
    pythonProcess.stdin.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Spacy skill extraction...\n');
  
  const results = [];
  for (const job of testJobs) {
    process.stdout.write(`📋 ${job.id}: `);
    const result = await extractSkills(job);
    
    if (result && result.predicted) {
      console.log(`✅ ${result.predicted.length} skills`);
      results.push({
        job: job.id,
        skills: result.predicted,
        count: result.predicted.length
      });
    } else {
      console.log(`❌ Failed`);
      results.push({
        job: job.id,
        skills: [],
        count: 0
      });
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 TEST RESULTS\n');
  
  let successCount = 0;
  let totalSkills = 0;
  
  results.forEach((r) => {
    if (r.count > 0) {
      successCount++;
      totalSkills += r.count;
      const skillList = r.skills.slice(0, 6).join(', ');
      console.log(`✅ ${r.job}: ${r.count} skills - ${skillList}${r.skills.length > 6 ? '...' : ''}`);
    } else {
      console.log(`❌ ${r.job}: No skills extracted`);
    }
  });

  console.log('\n📈 SUMMARY:');
  console.log(`   ✅ Success Rate: ${((successCount / results.length) * 100).toFixed(0)}%`);
  console.log(`   📊 Total Skills: ${totalSkills}`);
  console.log(`   ⚡ Average: ${(totalSkills / successCount).toFixed(1)} skills/job`);
  
  console.log('\n' + '═'.repeat(60));
  console.log('\n🎉 Test completed!\n');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err.message);
  process.exit(1);
});
