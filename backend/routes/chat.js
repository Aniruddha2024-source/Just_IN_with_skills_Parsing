/*import express from 'express';
import axios from 'axios';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo', // or try 'mistralai/mixtral-8x7b'
        messages: [{ role: 'user', content: message }],
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ reply: response.data.choices[0].message.content });
  } catch (err) {
    console.error('OpenRouter error:', err.response?.data || err.message);
    res.status(500).json({ error: 'OpenRouter request failed.' });
  }
});

export default router;*/

import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message } = req.body;

    const completion = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: "anthropic/claude-3.5-sonnet",
      messages: [
        {
          role: "system",
          content: `
You are an AI assistant built into a job-seeking website called "JobPortal".
Here’s what the site can do:
- Users can sign up using their name, email, and password.
- They can log in and see job listings on the home page.
- They can search or filter jobs under the 'Browse' tab.
- They can click 'Apply' to apply for a job.
- They can view detailed job descriptions.
- Admins can post jobs and manage companies.
If a user asks how to do anything related to the website, directly guide them through it.
Never ask for the website URL or name again.
Respond in a friendly tone, step-by-step.
`
        },
        { role: "user", content: message }
      ],
      max_tokens: 1000
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ reply: completion.data.choices[0].message.content });
  } catch (err) {
    console.error('Chatbot Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to get reply from assistant.' });
  }
});

export default router;

