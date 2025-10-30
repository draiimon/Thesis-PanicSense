/**
 * Groq Compound AI Utility for TypeScript
 * Uses Groq's Compound model with web search, code interpreter, and visit website tools
 * ONLY for Twitter fetch AI analysis
 * 
 * 250 tokens per day limit - use sparingly!
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_COMPOUND_MODEL = 'groq/compound';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface CompoundAnalysisResult {
  sentiment: string;
  confidence: number;
  language: string;
  location?: string;
  disasterType?: string;
}

export class GroqCompoundAI {
  private apiKey: string;
  
  constructor() {
    this.apiKey = GROQ_API_KEY;
    if (!this.apiKey) {
      throw new Error('GROQ_API_KEY environment variable not found');
    }
    console.log('✅ Groq Compound AI initialized for Twitter (250 tokens/day limit)');
  }
  
  /**
   * Detect language using simple heuristics
   * Returns: "English", "Tagalog", or "Taglish"
   */
  private detectLanguage(text: string): string {
    const tagalogWords = ['ang', 'mga', 'sa', 'ng', 'na', 'ay', 'ko', 'mo', 'natin', 'namin', 'kayo', 'sila', 
                          'ba', 'po', 'oo', 'hindi', 'ako', 'ikaw', 'siya', 'kami', 'tayo',
                          'may', 'wala', 'lang', 'talaga', 'pala', 'din', 'rin', 'daw',
                          'bagyo', 'lindol', 'baha', 'sunog', 'takot', 'tulong', 'kailangan'];
    
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let tagalogCount = 0;
    let englishCount = 0;
    
    for (const word of words) {
      if (tagalogWords.includes(word)) {
        tagalogCount++;
      } else if (/^[a-z]+$/.test(word) && word.length > 2) {
        englishCount++;
      }
    }
    
    // If both languages present, it's Taglish
    if (tagalogCount > 0 && englishCount > 0) {
      return 'Taglish';
    }
    
    // If mostly Tagalog
    if (tagalogCount > englishCount) {
      return 'Tagalog';
    }
    
    // Default to English
    return 'English';
  }
  
  /**
   * Analyze tweet sentiment using Compound AI with web search
   * SAME ALGORITHM as realtime analysis but WITHOUT explanation
   * @param text - The tweet text to analyze
   * @returns Analysis result with sentiment, confidence, location, disaster type
   */
  async analyzeTweetSentiment(text: string): Promise<CompoundAnalysisResult> {
    // Detect language first
    const language = this.detectLanguage(text);
    
    // Use EXACT SAME prompts as Python realtime analysis, but WITHOUT explanation in response
    let systemPrompt: string;
    
    if (language === 'Tagalog') {
      systemPrompt = `Ikaw ay isang dalubhasa sa pagsusuri ng damdamin sa panahon ng sakuna sa Pilipinas.
Gamitin ang web search para sa pinakabagong konteksto ng sakuna.

FILIPINO DISASTER TERMS - ONLY THESE 5 TYPES:
- bagyo = Typhoon
- lindol = Earthquake
- sunog = Fire
- guho/landslide = Landslide
- bulkan/pagputok = Volcanic Eruption

IMPORTANT: Only classify these 5 disaster types. Ignore flood, tsunami, storm, or others.

Klasipikasyon ng emosyon (sentiment):
- Panic: Matinding takot, urgency, desperasyon (TULONG!, HELP!, mamamatay na kami)
- Fear/Anxiety: Pag-aalala, kaba, takot (natatakot, kinakabahan, worried, anxious)
- Disbelief: Pagdududa, pagtataka (totoo ba?, paano nangyari?)
- Resilience: Lakas-loob, pag-asa, pagtulong (kaya natin to, tulungan, prayers)
- Neutral: Walang emosyon, factual (may lindol, may baha - walang fear words)

CRITICAL: Kahit totoo ang sakuna, kung may emotional words (natatakot, kinakabahan, worried), DAPAT Fear/Anxiety!
"Natatakot ako" = Fear/Anxiety LAGI, hindi Neutral!

Tumugon sa JSON format: {"sentiment": "emotion", "confidence": score, "disasterType": "Typhoon/Fire/Volcanic Eruption/Earthquake/Landslide ONLY", "location": "lokasyon"}`;
    } else if (language === 'Taglish') {
      systemPrompt = `You are a disaster sentiment expert for Philippines analyzing Taglish (mixed Tagalog-English) messages.
Use web search for recent disaster context.

FILIPINO DISASTER TERMS - ONLY THESE 5 TYPES:
- bagyo = Typhoon
- lindol = Earthquake
- sunog = Fire
- guho/landslide = Landslide
- bulkan/pagputok = Volcanic Eruption

IMPORTANT: Only classify these 5 disaster types. Ignore flood, tsunami, storm, or others.

Classify emotion (sentiment):
- Panic: Extreme fear, urgency, desperation (HELP!, RESCUE!, trapped)
- Fear/Anxiety: Worry, nervousness, fear (natatakot, scared, kinakabahan, worried, anxious)
- Disbelief: Doubt, shock, disbelief (totoo ba?, is this real?, paano?)
- Resilience: Strength, hope, helping others (kaya natin, prayers, tulong, support)
- Neutral: No emotion, factual (may lindol, there's a flood - no fear words)

CRITICAL: Even if disaster is real, if there are emotional words (natatakot, scared, worried), classify as Fear/Anxiety!
"Natatakot ako" or "I'm scared" = Fear/Anxiety ALWAYS, NOT Neutral!

Respond in JSON: {"sentiment": "emotion", "confidence": score, "disasterType": "Typhoon/Fire/Volcanic Eruption/Earthquake/Landslide ONLY", "location": "location"}`;
    } else {
      systemPrompt = `You are a disaster sentiment analysis expert for the Philippines.
Use web search to get recent disaster context and validate information.

FILIPINO DISASTER TERMS - ONLY THESE 5 TYPES:
- bagyo = Typhoon
- lindol = Earthquake
- sunog = Fire
- guho/landslide = Landslide
- bulkan/pagputok ng bulkan = Volcanic Eruption

IMPORTANT: Only classify these 5 disaster types. Ignore flood, baha, tsunami, storm, drought, or any others.

Classify emotional sentiment:
- Panic: Extreme fear, urgent danger, desperate help (HELP!, TRAPPED!, emergency)
- Fear/Anxiety: Worry, nervousness, concern (scared, afraid, worried, anxious, fearful)
- Disbelief: Doubt, shock, can't believe it (is this real?, how did this happen?)
- Resilience: Strength, hope, support, helping (we can do this, prayers, stay strong)
- Neutral: No emotion, factual statement (earthquake occurred, there is flooding - no fear words)

CRITICAL: Even if the disaster is real, if the person expresses fear/worry (scared, afraid, worried), classify as Fear/Anxiety!
"I'm scared" or "I'm worried" = Fear/Anxiety ALWAYS, NOT Neutral!

IMPORTANT: Return disasterType with proper capitalization (Typhoon, Fire, Volcanic Eruption, Earthquake, or Landslide ONLY).

Respond in JSON: {"sentiment": "emotion", "confidence": score, "disasterType": "Typhoon/Fire/Volcanic Eruption/Earthquake/Landslide ONLY", "location": "location"}`;
    }

    try {
      console.log(`🤖 COMPOUND AI (Twitter): Analyzing tweet as ${language} (250 tokens/day limit)`);
      
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: GROQ_COMPOUND_MODEL,
          messages: [
            { role: 'user', content: systemPrompt + '\n\nAnalyze: ' + text }
          ],
          temperature: 0.7,
          max_tokens: 512,
          top_p: 1,
          stream: false,
          // Groq Compound specific configuration
          compound_custom: {
            tools: {
              enabled_tools: ['web_search', 'code_interpreter', 'visit_website']
            }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Groq-Model-Version': 'latest'
          },
          timeout: 30000
        }
      );
      
      const content = response.data.choices[0].message.content;
      
      // Parse JSON response
      try {
        const result = JSON.parse(content);
        
        // Set the detected language
        result.language = language;
        
        console.log(`✅ COMPOUND AI (Twitter): Analysis complete - ${result.sentiment}, Language: ${result.language}`);
        return result;
      } catch (parseError) {
        console.warn('⚠️ COMPOUND AI (Twitter): Non-JSON response, parsing manually');
        return {
          sentiment: 'Neutral',
          confidence: 0.5,
          language: language
        };
      }
      
    } catch (error: any) {
      console.error('❌ COMPOUND AI (Twitter) error:', error.message);
      throw error;
    }
  }
}

// Singleton instance
let compoundAI: GroqCompoundAI | null = null;

export function getCompoundAI(): GroqCompoundAI {
  if (!compoundAI) {
    compoundAI = new GroqCompoundAI();
  }
  return compoundAI;
}
