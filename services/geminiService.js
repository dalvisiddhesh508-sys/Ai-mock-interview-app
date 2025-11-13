const axios = require('axios');

// ⚠️  IMPORTANT: Add your OpenRouter API key here
// Get it from: https://openrouter.ai/keys
// The current key is INVALID - you MUST replace it with your own
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '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';

async function callGemini(prompt) {
  // Check if API key is still the placeholder
  if (OPENROUTER_API_KEY.includes('REPLACE_WITH_YOUR_ACTUAL_KEY')) {
    throw new Error(
      '❌ OpenRouter API key not configured!\n' +
      '📝 Steps to fix:\n' +
      '   1. Go to https://openrouter.ai/keys\n' +
      '   2. Create or copy your API key\n' +
      '   3. Set environment variable: OPENROUTER_API_KEY=sk-or-v1-your-key-here\n' +
      '   4. Or update the OPENROUTER_API_KEY in services/geminiService.js\n' +
      '   5. Restart the server'
    );
  }

  try {
    const res = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'deepseek/deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000',
          'X-Title': 'AI Mock Interview',
          'HTTP-Retry-Count': '0',
        },
        timeout: 30000,
      }
    );
    return res.data.choices?.[0]?.message?.content || 'AI response unavailable';
  } catch (error) {
    const errorData = error.response?.data;
    const errorMsg = error.message;

    // Handle specific OpenRouter errors
    if (error.response?.status === 401) {
      console.error(
        '❌ Authentication Failed (401)\n' +
        '   Your OpenRouter API key is invalid or expired.\n' +
        '   Error:', errorData?.error?.message || errorMsg
      );
      throw new Error('Invalid OpenRouter API key. Please check your configuration.');
    }

    if (error.response?.status === 404) {
      console.error(
        '❌ Endpoint Not Found (404)\n' +
        '   Possible causes:\n' +
        '   1. Data retention policy not configured\n' +
        '   2. Model not available with your policy settings\n' +
        '   Error:', errorData?.error?.message || errorMsg
      );
      throw new Error(
        'OpenRouter configuration issue. Go to: https://openrouter.ai/settings/privacy\n' +
        'and configure your data retention policy, then restart the server.'
      );
    }

    if (error.response?.status === 429) {
      console.error('❌ Rate Limit Exceeded - Too many requests to OpenRouter');
      throw new Error('OpenRouter rate limit exceeded. Please try again later.');
    }

    if (error.response?.status === 500) {
      console.error('❌ OpenRouter Server Error (500)');
      throw new Error('OpenRouter service is temporarily unavailable.');
    }

    console.error('OpenRouter API Error:', errorData || errorMsg);
    throw new Error(`Failed to get AI response: ${errorData?.error?.message || errorMsg}`);
  }
}

module.exports = { callGemini };

