#!/usr/bin/env node
/**
 * SBERT Skill Matching Test
 * Tests semantic similarity matching between resume and job skills
 */

import { spawn } from 'child_process';
import path from 'path';

const PYTHON_EXECUTABLE = 'C:\\Users\\aniru\\AppData\\Local\\Programs\\Python\\Python313\\python.exe';
const SBERT_MATCHER = path.join(process.cwd(), 'ml', 'sbert_skill_matcher.py');

console.log('\n🤖 SBERT SKILL MATCHING TEST\n');
console.log('═'.repeat(70));

const testCases = [
  {
    name: 'Exact Match Test',
    resumeSkills: ['Python', 'React', 'MongoDB'],
    jobSkills: ['Python', 'React', 'MongoDB'],
    description: 'Should match 100%'
  },
  {
    name: 'Semantic Similarity Test',
    resumeSkills: ['Python', 'React', 'NoSQL Database'],
    jobSkills: ['Python', 'JavaScript', 'MongoDB'],
    description: 'Should match Python (100%), NoSQL Database ≈ MongoDB (85%+)'
  },
  {
    name: 'Partial Match Test',
    resumeSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'Docker'],
    jobSkills: ['Java', 'Spring Framework', 'MySQL', 'Kubernetes'],
    description: 'Java matches, Spring variants should match, DB types similar'
  },
  {
    name: 'Real-world Developer Test',
    resumeSkills: [
      'Python', 'JavaScript', 'React', 'Node.js', 'Express',
      'MongoDB', 'PostgreSQL', 'Docker', 'Git', 'Linux'
    ],
    jobSkills: [
      'Node.js', 'TypeScript', 'React', 'Express.js',
      'NoSQL Database', 'Cloud Services', 'Containerization'
    ],
    description: 'Real job seeker vs real job posting'
  }
];

async function testSBERTMatching(testCase) {
  return new Promise((resolve) => {
    const pythonProcess = spawn(PYTHON_EXECUTABLE, [SBERT_MATCHER], {
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
      if (code !== 0 || !stdout) {
        console.log(`  ❌ Error: ${stderr.trim()}`);
        resolve(null);
        return;
      }

      try {
        const lines = stdout.trim().split('\n').filter(l => l);
        const lastLine = lines[lines.length - 1];
        const result = JSON.parse(lastLine);
        resolve(result);
      } catch (e) {
        console.log(`  ❌ Parse error: ${e.message}`);
        resolve(null);
      }
    });

    const input = {
      resume_skills: testCase.resumeSkills,
      job_skills: testCase.jobSkills,
      threshold: 0.5
    };

    pythonProcess.stdin.write(JSON.stringify(input) + '\n');
    pythonProcess.stdin.end();
  });
}

function displayResults(testCase, result) {
  if (!result) {
    console.log(`  ❌ Test failed\n`);
    return;
  }

  console.log(`\n  📊 Results:`);
  console.log(`     Match: ${result.match_percentage}%`);
  console.log(`     Matches: ${result.total_matches}/${result.total_resume_skills} skills matched`);
  
  if (result.matches && result.matches.length > 0) {
    console.log(`     Top Matches:`);
    result.matches.slice(0, 3).forEach(m => {
      console.log(`       • ${m.resume_skill} → ${m.job_skill} (${(m.similarity * 100).toFixed(0)}%)`);
    });
  }
  
  if (result.unmatched_resume_skills && result.unmatched_resume_skills.length > 0) {
    console.log(`     Unmatched Skills: ${result.unmatched_resume_skills.slice(0, 2).join(', ')}`);
  }

  console.log();
}

async function runTests() {
  console.log('🚀 Running SBERT Semantic Similarity Tests...\n');
  
  const results = [];

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log(`─`.repeat(70));
    console.log(`Description: ${testCase.description}`);
    console.log(`Resume Skills: ${testCase.resumeSkills.join(', ')}`);
    console.log(`Job Skills: ${testCase.jobSkills.join(', ')}`);
    
    const result = await testSBERTMatching(testCase);
    displayResults(testCase, result);

    results.push({
      name: testCase.name,
      result: result,
      passed: result && result.match_percentage > 0
    });

    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('═'.repeat(70));
  console.log('\n📈 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;

  results.forEach((r, idx) => {
    const status = r.passed ? '✅' : '❌';
    const matchPct = r.result?.match_percentage || 0;
    console.log(`${status} Test ${idx + 1}: ${r.name} (${matchPct}% match)`);
  });

  console.log(`\n📊 Overall: ${passed}/${total} tests passed (${((passed/total)*100).toFixed(0)}%)`);
  
  console.log('\n' + '═'.repeat(70));
  console.log('\n✨ SBERT Skill Matching Tests Completed!\n');
  
  process.exit(passed === total ? 0 : 1);
}

runTests().catch(err => {
  console.error('❌ Test suite failed:', err.message);
  process.exit(1);
});
