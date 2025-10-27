/**
 * Service for email classification using OpenAI
 */
class ClassificationService {
  /**
   * Classify emails using OpenAI API
   * @param {string} apiKey - OpenAI API key
   * @param {Array} emails - Array of email objects
   * @returns {Promise<Array>} Classified emails
   */
  async classifyEmails(apiKey, emails) {
    // Prepare emails for OpenAI prompt
    const emailsForPrompt = emails.map(e => ({
      id: e.id,
      from: e.from,
      subject: e.subject,
      snippet: e.snippet
    }));

    // Initialize OpenAI client
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    // Get model name from environment or use default
    const modelName = process.env.OPENAI_MODEL || 'gpt-4o';
    console.log('Attempting to use OpenAI model:', modelName);

    // Prepare prompts
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(emailsForPrompt);

    console.log('Sending classification request to OpenAI');

    try {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      });

      const text = completion.choices[0].message.content;
      console.log('Classification successful');

      return this.parseClassificationResponse(text, emailsForPrompt);
    } catch (err) {
      console.error('OpenAI API failed:', err?.message || err);
      throw new Error(`OpenAI API error: ${err?.message || err}`);
    }
  }

  /**
   * Build system prompt for OpenAI
   * @returns {string} System prompt
   */
  buildSystemPrompt() {
    return `You are an email classification assistant. Classify each email into one of these categories: Important, Promotions, Social, Marketing, Spam, General. Return ONLY a valid JSON array of objects with id, category, and reason fields.`;
  }

  /**
   * Build user prompt with email data
   * @param {Array} emails - Array of email objects
   * @returns {string} User prompt
   */
  buildUserPrompt(emails) {
    return `Classify these emails:\n${JSON.stringify(emails, null, 2)}`;
  }

  /**
   * Parse OpenAI response and map results to emails
   * @param {string} text - Raw response from OpenAI
   * @param {Array} originalEmails - Original email data
   * @returns {Array} Mapped classification results
   */
  parseClassificationResponse(text, originalEmails) {
    // Try to extract JSON from response
    let parsed;
    const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*,?\s*\]/s);
    
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback: try full parse
      parsed = JSON.parse(text);
    }

    // Map classifications to original email data
    return parsed.map(item => {
      const original = originalEmails.find(e => String(e.id) === String(item.id)) || {};
      return {
        ...original,
        category: item.category,
        reason: item.reason
      };
    });
  }
}

module.exports = new ClassificationService();

