/**
 * Direct OpenAI API Client for Supabase Edge Functions
 * Replaces LangChain dependency with direct API calls
 */ export class OpenAIClient {
  apiKey;
  baseURL = 'https://api.openai.com/v1';
  constructor(){
    this.apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
  }
  async chatCompletion(messages, options = {}) {
    const { model = 'gpt-4o', temperature = 0.1, maxTokens = 4000 } = options;
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        })
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }
      const data = await response.json();
      if (!data.choices || data.choices.length === 0) {
        throw new Error('No response from OpenAI API');
      }
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}
/**
 * Create system and user messages for OpenAI API
 */ export function createMessages(systemPrompt, userPrompt) {
  return [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userPrompt
    }
  ];
}
/**
 * Parse JSON response from OpenAI with error handling
 */ export function parseOpenAIResponse(response) {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('No JSON found in response');
  } catch (error) {
    console.warn('Failed to parse OpenAI response as JSON:', error);
    throw new Error(`Invalid JSON response: ${error.message}`);
  }
}
