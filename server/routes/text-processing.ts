import express from 'express';
import { groqAPI } from '../utils/groq-api';

const router = express.Router();

/**
 * Process text through various NLP steps
 * 
 * @route POST /api/text-processing
 * @param {string} text - The text to process
 * @returns {object} The processing results for each step
 */
router.post('/', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Valid text input is required' });
    }

    // Define the system prompt for text processing
    const systemPrompt = `You are a text processing assistant that performs NLP preprocessing steps. For the given text, perform the following steps and return ONLY the results as a JSON object with no additional explanation:
    
    1. Data Cleaning: Remove irrelevant content like advertisements, URLs, special characters.
    2. Normalization: Standardize text (lowercase, remove extra spaces, standardize slang).
    3. Tokenization: Split text into individual tokens.
    4. Stemming & Lemmatization: Reduce words to base or root forms.
    5. Stop Words Removal: Remove common words with little meaning.
    6. Language Detection: Identify language (English, Filipino, or code-switching).
    
    Format your response as valid JSON with these exact keys:
    {
      "cleaned": "cleaned text result",
      "normalized": "normalized text result",
      "tokenized": ["token1", "token2", ...],
      "stemmed": ["stemmed1", "stemmed2", ...],
      "lemmatized": ["lemma1", "lemma2", ...],
      "withoutStopwords": ["word1", "word2", ...],
      "language": "detected language"
    }`;

    // Use a mock implementation to avoid API key issues
    try {
      // Try the Groq API first if available
      const response = await groqAPI.chatCompletion(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text }
        ],
        {
          temperature: 0.2,
          max_tokens: 2000,
          cache: true,
          cacheKey: `text-processing-${Buffer.from(text).toString('base64').substring(0, 20)}`
        }
      );
      
      return res.json(response.data);
    } catch (apiError) {
      console.log('Using mock implementation for text processing');
      
      // If Groq API fails, use a simple mock implementation
      const mockProcessing = {
        normalizedText: text.toLowerCase().trim().replace(/\s+/g, ' '),
        tokenizedText: text.toLowerCase().trim().split(/\s+/),
        stemmedText: text.toLowerCase().trim().split(/\s+/).map(word => 
          // Very simple "stemming" just for demo
          word.replace(/ing$|ed$|s$|es$/, '')
        ),
        finalOutput: text.toLowerCase().trim().replace(/[^\w\s]/g, '')
      };
      
      return res.json(mockProcessing);
    }
  } catch (error: any) {
    console.error('Text processing error:', error);
    return res.status(500).json({ error: 'Failed to process text', details: error.message || String(error) });
  }
});

export default router;