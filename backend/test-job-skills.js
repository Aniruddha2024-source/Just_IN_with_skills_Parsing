#!/usr/bin/env node
/**
 * Test Script for Job Skill Extraction
 * Tests the Spacy NLP integration for job descriptions
 * 
 * Usage: node test-job-skills.js
 */

import axios from 'axios';
import fs from 'fs';

const API_BASE_URL = 'http://localhost:8000/api/v1';

// Test token - replace with actual token
const TEST_TOKEN = process.env.TEST_TOKEN || 'YOUR_JWT_TOKEN_HERE';

// Test job data
const TEST_JOB = {
  title: 'Senior Full Stack Developer',
  description: `
    We are looking for an experienced Full Stack Developer to join our growing team.
    
    You will work with modern technologies including React, Node.js, and PostgreSQL.
    Experience with AWS cloud services, Docker containerization, and Kubernetes orchestration is required.
    
    Your responsibilities will include:
    - Building scalable web applications using React and TypeScript
    - Developing REST APIs and GraphQL backends with Node.js and Express
    - Managing databases with PostgreSQL and MongoDB
    - Implementing CI/CD pipelines with GitHub Actions and Jenkins
    - Containerizing applications with Docker and orchestrating with Kubernetes
    - Collaborating with the team using Git and Jira
    
    We value clean code, agile methodologies, and strong problem-solving skills.
  `,
  requirements: [
    'React',
    'Node.js',
    'TypeScript',
    'PostgreSQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'REST APIs',
    'Git',
    '5+ years experience'
  ],
  salary: 120000,
  location: 'San Francisco, CA',
  jobType: 'Full-time',
  experienceLevel: 5,
  position: 1,
  company: 'REPLACE_WITH_COMPANY_ID'
};

async function testJobSkillExtraction() {
  console.log('\n🧪 Job Skill Extraction Test\n');
  console.log('═'.repeat(60));

  try {
    // Test 1: Check if server is running
    console.log('\n[1/3] Checking backend server...');
    try {
      const healthCheck = await axios.get(`${API_BASE_URL}/jobs/get`, {
        timeout: 5000
      });
      console.log('✅ Backend server is running');
    } catch (err) {
      console.error('❌ Backend server is not responding');
      console.error('   Make sure to run: cd backend && npm start');
      process.exit(1);
    }

    // Test 2: Post a test job
    console.log('\n[2/3] Posting test job with skill extraction...');
    
    if (TEST_JOB.company === 'REPLACE_WITH_COMPANY_ID') {
      console.warn('⚠️  WARNING: company ID not set!');
      console.warn('   Update TEST_JOB.company with a valid MongoDB ObjectId');
      console.warn('   You can find company IDs from your database or MongoDB compass');
      return;
    }

    try {
      const jobResponse = await axios.post(
        `${API_BASE_URL}/jobs/post`,
        TEST_JOB,
        {
          headers: {
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const jobId = jobResponse.data.job._id;
      console.log('✅ Job posted successfully');
      console.log(`   Job ID: ${jobId}`);
      console.log('   Skill extraction running in background...');

      // Test 3: Retrieve job analysis
      console.log('\n[3/3] Retrieving extracted skills...');
      console.log('   (Waiting 3 seconds for processing...)');
      
      // Wait for async skill extraction
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const analysisResponse = await axios.get(
          `${API_BASE_URL}/jobs/analysis/${jobId}`,
          {
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`
            },
            timeout: 5000
          }
        );

        const analysis = analysisResponse.data.data;
        
        console.log('\n✅ Job Analysis Retrieved!');
        console.log('\n📊 Extracted Skills:');
        console.log('─'.repeat(60));
        
        if (analysis.extractedSkills && analysis.extractedSkills.length > 0) {
          console.log(`\nTotal Skills Found: ${analysis.skillCount}`);
          console.log(`Extractor Used: ${analysis.extractorUsed}`);
          console.log(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
          
          console.log('\nSkills:');
          analysis.extractedSkills.forEach((skill, i) => {
            console.log(`  ${i + 1}. ${skill}`);
          });

          if (analysis.entities && Object.keys(analysis.entities).length > 0) {
            console.log('\n📂 Skills by Category:');
            Object.entries(analysis.entities).forEach(([category, skills]) => {
              if (skills && skills.length > 0) {
                console.log(`  ${category}: ${skills.join(', ')}`);
              }
            });
          }
        } else {
          console.warn('⚠️  No skills extracted. Check if Spacy model is downloaded:');
          console.warn('   python -m spacy download en_core_web_sm');
        }

        // Save results to file
        const resultsFile = 'job-skill-extraction-results.json';
        fs.writeFileSync(resultsFile, JSON.stringify(analysis, null, 2));
        console.log(`\n💾 Full results saved to: ${resultsFile}`);

      } catch (analysisErr) {
        if (analysisErr.response?.status === 404) {
          console.warn('⚠️  Job analysis not yet created (still processing?)');
          console.log('   Try again in a few seconds...');
        } else {
          throw analysisErr;
        }
      }

    } catch (jobErr) {
      console.error('❌ Error posting job:', jobErr.response?.data?.message || jobErr.message);
      if (jobErr.response?.status === 401) {
        console.error('   Make sure to set a valid JWT token in TEST_TOKEN');
      }
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('\n✅ Test completed!\n');
}

// Run tests
testJobSkillExtraction().catch(console.error);
