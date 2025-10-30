/**
 * Twitter Live Data Service
 * Uses TwitterAPI.io to fetch disaster-related tweets and process them for sentiment analysis
 */

import axios from 'axios';
import { groqAPI } from './groq-api';

export interface TwitterPost {
  id: string;
  text: string;
  timestamp: string;
  author?: string;
  url?: string;
}

export interface ProcessedTwitterPost extends TwitterPost {
  sentiment: string;
  confidence: number;
  language: string;
  location?: string;
  disasterType?: string;
  source: string;
}

export class TwitterService {
  private apiKey: string;
  private headers: Record<string, string>;
  private cache: Map<string, { data: ProcessedTwitterPost[], timestamp: number }>;
  private cacheExpiry: number;
  private lastRequestTime: number;
  private readonly RATE_LIMIT_MS = 5000; // 5 seconds between requests for free tier

  // Philippine-specific disaster query strings - VERY STRICT to avoid global tweets
  private strictQuery = `(Pilipinas OR Philippines OR Manila OR Cebu OR Davao OR Luzon OR Visayas OR Mindanao OR NCR OR Metro Manila OR PH) (bagyo OR lindol OR sunog OR baha OR landslide OR ulan OR earthquake OR flood OR typhoon OR fire OR tsunami OR pagbaha OR aftershock)`;

  private fallbackQuery = `(Philippines OR Pilipinas OR Manila OR Cebu) (bagyo OR lindol OR baha OR sunog OR typhoon OR earthquake OR flood OR fire)`;

  constructor() {
    // Require API key from environment variable - fail fast if missing
    this.apiKey = process.env.TWITTER_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[twitter-service] TWITTER_API_KEY environment variable is not set - Twitter functionality will be limited');
    }
    this.headers = { "X-API-Key": this.apiKey };
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache to avoid excessive API calls
    this.lastRequestTime = 0; // Initialize to 0 to allow first request immediately
  }

  /**
   * Ensure rate limiting - wait if needed to maintain 5 second minimum between requests
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      const waitTime = this.RATE_LIMIT_MS - timeSinceLastRequest;
      console.log(`[twitter-service] Rate limiting: waiting ${waitTime}ms before next request`);
      await this.delay(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Fetch tweets using the strict query first, fallback to general query
   */
  async fetchDisasterTweets(limit: number = 15): Promise<TwitterPost[]> {
    console.log(`[twitter-service] Fetching disaster tweets with limit: ${limit}`);
    
    try {
      // Try strict query first
      let tweets = await this.makeTwitterRequest(this.strictQuery, limit);
      
      if (!tweets || tweets.length === 0) {
        console.log(`[twitter-service] No tweets found with strict query, trying fallback query`);
        // The rate limiter will ensure we wait at least 5 seconds
        tweets = await this.makeTwitterRequest(this.fallbackQuery, limit);
      }

      if (!tweets || tweets.length === 0) {
        console.log(`[twitter-service] No tweets found with either query`);
        return [];
      }

      console.log(`[twitter-service] Successfully fetched ${tweets.length} tweets`);
      return tweets;
    } catch (error) {
      console.error(`[twitter-service] Error fetching tweets:`, error);
      throw error;
    }
  }

  /**
   * Make a request to TwitterAPI.io with retry logic for rate limits
   */
  private async makeTwitterRequest(query: string, limit: number, retryCount: number = 0): Promise<TwitterPost[]> {
    const maxRetries = 3;
    
    // Enforce rate limit before making the request
    await this.enforceRateLimit();
    
    const params = {
      query: query,
      queryType: "Latest",
      limit: limit
      // Removed lang restriction to allow both English and Filipino Philippine tweets
    };

    const url = "https://api.twitterapi.io/twitter/tweet/advanced_search";

    try {
      const response = await axios.get(url, { 
        headers: this.headers, 
        params: params,
        timeout: 30000 // 30 second timeout
      });

      if (response.status !== 200) {
        throw new Error(`Twitter API returned status ${response.status}: ${response.statusText}`);
      }

      const data = response.data;
      const tweets = data.tweets || data.data || [];

      return tweets.map((tweet: any) => ({
        id: tweet.id || tweet.tweet?.id_str || `tweet_${Date.now()}_${Math.random()}`,
        text: tweet.text || tweet.tweet?.text || "[No text available]",
        timestamp: new Date().toISOString(), // Use current time as fallback
        author: tweet.user?.screen_name || tweet.tweet?.user?.screen_name || "unknown",
        url: `https://twitter.com/i/web/status/${tweet.id || tweet.tweet?.id_str || "unknown"}`
      }));
    } catch (error: any) {
      // Handle 429 rate limit errors with retry logic
      if (error.response?.status === 429 && retryCount < maxRetries) {
        const waitTime = this.RATE_LIMIT_MS * (retryCount + 1); // Exponential backoff: 5s, 10s, 15s
        console.log(`[twitter-service] Rate limit hit (429). Waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}`);
        await this.delay(waitTime);
        return this.makeTwitterRequest(query, limit, retryCount + 1);
      }
      
      console.error(`[twitter-service] Twitter API request failed:`, error.message || error);
      throw error;
    }
  }

  /**
   * Normalize disaster type to ensure proper capitalization (ONLY 5 ALLOWED TYPES)
   * Returns normalized type, or 'REJECT' if the type is not allowed, or undefined if no type was detected
   */
  private normalizeDisasterType(type: string | undefined): string | undefined | 'REJECT' {
    if (!type) return undefined; // No disaster type detected - keep tweet
    
    const lowerType = type.toLowerCase();
    
    // Map all variations to proper capitalization
    if (lowerType.includes('typhoon') || lowerType.includes('bagyo')) return 'Typhoon';
    if (lowerType.includes('fire') || lowerType.includes('sunog')) return 'Fire';
    if (lowerType.includes('earthquake') || lowerType.includes('lindol') || lowerType.includes('quake')) return 'Earthquake';
    if (lowerType.includes('landslide') || lowerType.includes('guho')) return 'Landslide';
    if (lowerType.includes('volcano') || lowerType.includes('volcanic') || lowerType.includes('eruption') || lowerType.includes('bulkan')) return 'Volcanic Eruption';
    
    // If type was detected but it's not one of the 5 allowed types, mark for rejection
    return 'REJECT';
  }

  /**
   * Process tweets for sentiment analysis
   * Processes ONE BY ONE with delays to avoid rate limits
   * FILTERS to ONLY accept tweets with the 5 allowed disaster types (or no type)
   */
  async processTweetsForSentiment(tweets: TwitterPost[]): Promise<ProcessedTwitterPost[]> {
    console.log(`[twitter-service] Processing ${tweets.length} tweets for sentiment analysis (slow mode - one by one)`);
    const processedTweets: ProcessedTwitterPost[] = [];
    let rejectedCount = 0;

    for (let i = 0; i < tweets.length; i++) {
      const tweet = tweets[i];
      
      try {
        console.log(`[twitter-service] Processing tweet ${i + 1}/${tweets.length}...`);
        
        // Analyze sentiment using Groq API
        const analysis = await this.analyzeTweetSentiment(tweet.text);
        
        // Normalize disaster type to ensure proper capitalization and filtering
        const normalizedDisasterType = this.normalizeDisasterType(analysis.disasterType);
        
        // REJECT tweets with non-allowed disaster types
        if (normalizedDisasterType === 'REJECT') {
          console.log(`[twitter-service] ❌ Rejecting tweet ${tweet.id} - disaster type "${analysis.disasterType}" not allowed`);
          rejectedCount++;
          
          // Still delay to maintain rate limit
          if (i < tweets.length - 1) {
            console.log(`[twitter-service] Waiting 3 seconds before next tweet to avoid rate limit...`);
            await this.delay(3000);
          }
          continue; // Skip this tweet
        }
        
        const processedTweet: ProcessedTwitterPost = {
          ...tweet,
          sentiment: analysis.sentiment || 'Neutral',
          confidence: analysis.confidence || 0.5,
          language: analysis.language || 'English',
          location: analysis.location || undefined,
          disasterType: normalizedDisasterType === 'REJECT' ? undefined : normalizedDisasterType,
          source: 'twitter'
        };

        processedTweets.push(processedTweet);
        console.log(`[twitter-service] ✅ Accepted tweet ${tweet.id} - disaster type: ${normalizedDisasterType || 'none'}`);
        
        // LONGER delay between tweets to avoid rate limits (3 seconds)
        if (i < tweets.length - 1) { // Don't delay after last tweet
          console.log(`[twitter-service] Waiting 3 seconds before next tweet to avoid rate limit...`);
          await this.delay(3000);
        }
      } catch (error) {
        console.error(`[twitter-service] Error processing tweet ${tweet.id}:`, error);
        
        // Add tweet with basic analysis if sentiment analysis fails
        const extractedType = this.extractDisasterTypeFallback(tweet.text);
        const fallbackDisasterType = this.normalizeDisasterType(extractedType || undefined);
        
        // REJECT tweets with non-allowed disaster types even in fallback
        if (fallbackDisasterType === 'REJECT') {
          console.log(`[twitter-service] ❌ Rejecting tweet ${tweet.id} (fallback) - disaster type "${extractedType}" not allowed`);
          rejectedCount++;
          
          // Still delay even on error
          if (i < tweets.length - 1) {
            await this.delay(3000);
          }
          continue; // Skip this tweet
        }
        
        const fallbackTweet: ProcessedTwitterPost = {
          ...tweet,
          sentiment: 'Neutral',
          confidence: 0.3,
          language: 'English',
          location: this.extractLocationFallback(tweet.text) || undefined,
          disasterType: fallbackDisasterType === 'REJECT' ? undefined : fallbackDisasterType,
          source: 'twitter'
        };
        processedTweets.push(fallbackTweet);
        console.log(`[twitter-service] ✅ Accepted tweet ${tweet.id} (fallback) - disaster type: ${fallbackDisasterType || 'none'}`);
        
        // Still delay even on error
        if (i < tweets.length - 1) {
          await this.delay(3000);
        }
      }
    }

    console.log(`[twitter-service] ✅ Finished processing: ${processedTweets.length} accepted, ${rejectedCount} rejected (non-allowed disaster types)`);
    return processedTweets;
  }

  /**
   * Analyze tweet sentiment using REGULAR Groq API with llama-3.1-8b-instant
   * (NOT Compound AI - that's only for real-time analysis)
   */
  async analyzeTweetSentiment(text: string): Promise<{
    sentiment: string;
    confidence: number;
    language: string;
    location?: string;
    disasterType?: string;
  }> {
    try {
      // Step 1: Detect language first (local detection)
      const detectedLanguage = this.detectLanguage(text);
      console.log(`🔍 TWITTER: Detected language as ${detectedLanguage}`);
      
      // Step 2: Build language-specific prompt (EXACT SAME as Python realtime, without explanation)
      let systemPrompt: string;
      
      if (detectedLanguage === 'Tagalog') {
        systemPrompt = `Ikaw ay isang dalubhasa sa pagsusuri ng damdamin sa panahon ng sakuna sa Pilipinas.

CRITICAL READING INSTRUCTIONS:
1. Basahin ang mga salitang nakakabit sa symbols: #lindolCebu = "lindol" + "Cebu", (cebu) = "cebu", cebu! = "cebu"
2. Unawain ang mga emoji: 😱 = takot, 🔥 = apoy, 💪 = lakas, 🙏 = dasal
3. Basahin kahit may ALL CAPS, !!!, o maraming punctuation

FILIPINO DISASTER TERMS (Translate to English - ONLY THESE 5 TYPES):
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

Tumugon sa JSON format: {"sentiment": "emotion", "confidence": score, "disasterType": "English term (Typhoon/Fire/Volcanic Eruption/Earthquake/Landslide ONLY)", "location": "lokasyon"}`;
      } else if (detectedLanguage === 'Taglish') {
        systemPrompt = `You are a disaster sentiment expert for Philippines analyzing Taglish (mixed Tagalog-English) messages.

CRITICAL READING INSTRUCTIONS:
1. Read words embedded in symbols: #earthquakeCebu = "earthquake" + "Cebu", (cebu) = "cebu", cebu! = "cebu"
2. Understand emojis: 😱 = scared, 🔥 = fire, 💪 = strength, 🙏 = prayer
3. Read even with ALL CAPS, !!!, or excessive punctuation
4. Hashtags contain important info: #SaveCebu, #lindolPH

FILIPINO DISASTER TERMS (Translate to English - ONLY THESE 5 TYPES):
- bagyo = Typhoon
- lindol = Earthquake
- sunog = Fire
- guho/landslide = Landslide
- bulkan/pagputok = Volcanic Eruption

IMPORTANT: Only classify these 5 disaster types. Ignore flood, tsunami, storm, or others.

Classify emotion (sentiment):
- Panic: Extreme fear, urgency, desperation (HELP!, RESCUE!, trapped, TULONG!)
- Fear/Anxiety: Worry, nervousness, fear (natatakot, scared, kinakabahan, worried, anxious)
- Disbelief: Doubt, shock, disbelief (totoo ba?, is this real?, paano?)
- Resilience: Strength, hope, helping others (kaya natin, prayers, tulong, support)
- Neutral: No emotion, factual (may lindol, there's a flood - no fear words)

CRITICAL: Even if disaster is real, if there are emotional words (natatakot, scared, worried), classify as Fear/Anxiety!
"Natatakot ako" or "I'm scared" = Fear/Anxiety ALWAYS, NOT Neutral!

Respond in JSON: {"sentiment": "emotion", "confidence": score, "disasterType": "English term (Typhoon/Fire/Volcanic Eruption/Earthquake/Landslide ONLY)", "location": "location"}`;
      } else {
        systemPrompt = `You are a disaster sentiment analysis expert for the Philippines.

CRITICAL READING INSTRUCTIONS:
1. Read words embedded in symbols/hashtags: #earthquakeCebu = "earthquake" + "Cebu", (cebu) = "cebu", cebu! = "cebu"
2. Understand emojis: 😱 = scared, 🔥 = fire, 💪 = strength, 🙏 = prayer, 😭 = crying
3. Read even with ALL CAPS, !!!, or excessive punctuation
4. Extract info from hashtags: #PrayForCebu, #TyphoonOdette, #EarthquakePH

FILIPINO DISASTER TERMS YOU MUST TRANSLATE TO ENGLISH - ONLY THESE 5 TYPES:
- bagyo = Typhoon
- lindol = Earthquake  
- sunog = Fire
- guho/landslide = Landslide
- bulkan/pagputok ng bulkan = Volcanic Eruption

IMPORTANT: Only classify these 5 disaster types. Ignore flood, baha, tsunami, storm, drought, or any others.

Classify emotional sentiment:
- Panic: Extreme fear, urgent danger, desperate help (HELP!, TRAPPED!, emergency, TULONG!)
- Fear/Anxiety: Worry, nervousness, concern (scared, afraid, worried, anxious, fearful, natatakot)
- Disbelief: Doubt, shock, can't believe it (is this real?, how did this happen?, totoo ba?)
- Resilience: Strength, hope, support, helping (we can do this, prayers, stay strong, kaya natin)
- Neutral: No emotion, factual statement (earthquake occurred, there is flooding - no fear words)

CRITICAL: Even if the disaster is real, if the person expresses fear/worry (scared, afraid, worried, natatakot), classify as Fear/Anxiety!
"I'm scared" or "I'm worried" or "Natatakot ako" = Fear/Anxiety ALWAYS, NOT Neutral!

IMPORTANT: Return disasterType in PROPER ENGLISH with first letter capitalized (Typhoon, Fire, Volcanic Eruption, Earthquake, or Landslide ONLY)

Respond in JSON: {"sentiment": "emotion", "confidence": score, "disasterType": "Typhoon/Fire/Volcanic Eruption/Earthquake/Landslide ONLY", "location": "location"}`;
      }
      
      // Step 3: Call REGULAR Groq API with llama-3.1-8b-instant
      console.log(`🤖 REGULAR GROQ (Twitter): Analyzing tweet with llama-3.1-8b-instant`);
      
      const { groqAPI } = await import('./groq-api');
      const response = await groqAPI.chatCompletion<{
        sentiment: string;
        confidence: number;
        disasterType?: string;
        location?: string;
      }>(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze: ${text}` }
        ],
        {
          model: 'llama-3.1-8b-instant',
          temperature: 0.7,
          max_tokens: 512,
          cache: false
        }
      );
      
      const result = response.data;
      console.log(`✅ REGULAR GROQ (Twitter): ${result.sentiment} (${result.confidence})`);
      
      return {
        sentiment: result.sentiment || 'Neutral',
        confidence: result.confidence || 0.5,
        language: detectedLanguage,
        location: result.location,
        disasterType: result.disasterType
      };
    } catch (error) {
      console.error(`[twitter-service] Sentiment analysis failed:`, error);
      throw error;
    }
  }
  
  /**
   * Enhanced language detection - recognizes Filipino disaster terms even in hashtags
   */
  private detectLanguage(text: string): 'English' | 'Tagalog' | 'Taglish' {
    // Short common Tagalog words (need exact match to avoid false positives)
    const tagalogShortWords = ['ako', 'ikaw', 'siya', 'kami', 'tayo', 'sila', 'ang', 'ng', 'sa', 'ay', 'mga', 'na', 
      'po', 'opo', 'hindi', 'oo', 'naman', 'lang', 'ba', 'kasi', 'para', 'kung', 'pero', 
      'kaya', 'dapat', 'yung', 'natin', 'nila', 'talaga', 'dito', 'doon', 'ganun', 'ganito'];
    
    // Longer disaster-specific Filipino terms (safe to use substring matching)
    const tagalogDisasterTerms = [
      'bagyo', 'lindol', 'baha', 'sunog', 'ulan', 'malakas', 'guho', 'pagbaha', 'pagguho',
      'tulong', 'tulungan', 'natatakot', 'kinakabahan', 'takot', 'kawawa', 'grabe',
      'ingat', 'mag-ingat', 'totoo', 'paano', 'bakit', 'saan'
    ];
    
    // Unambiguous English words (removed ambiguous words like "may", "to", "in", etc. that overlap with Tagalog)
    const englishWords = [
      // Clear English auxiliaries
      'the', 'is', 'are', 'was', 'were', 'have', 'has', 'had', 'do', 'does', 'did', 
      'will', 'would', 'could', 'should', 'might', 'must', 'shall',
      // Clear English pronouns
      'we', 'you', 'he', 'she', 'it', 'they', 'me', 'us', 'him', 'her', 'them',
      'our', 'your', 'his', 'its', 'their', 'this', 'that', 'these', 'those',
      // Clear English verbs and disaster words
      'need', 'help', 'get', 'go', 'come', 'make', 'know', 'think', 'take', 'see', 'want',
      'please', 'trapped', 'stuck', 'safe', 'okay', 'scared', 'afraid', 'worried',
      'earthquake', 'flood', 'fire', 'storm', 'typhoon', 'disaster', 'emergency',
      // Clear English adjectives and adverbs
      'very', 'much', 'many', 'more', 'most', 'some', 'all', 'not',
      'here', 'there', 'now', 'then', 'today', 'tomorrow', 'yesterday', 'asap'
    ];
    
    const lowerText = text.toLowerCase();
    
    // Normalize text for word extraction (remove symbols)
    const normalizedText = lowerText.replace(/[#@()[\]{}!?.,:;]/g, ' ');
    const words = normalizedText.split(/\s+/);
    
    let tagalogCount = 0;
    let englishCount = 0;
    
    // Check exact matches for short Tagalog words
    for (const word of words) {
      if (tagalogShortWords.includes(word)) {
        tagalogCount++;
      }
      if (englishWords.includes(word)) {
        englishCount++;
      }
    }
    
    // Check substring matches for longer disaster terms (handles #bagyoPH, lindol!, etc.)
    for (const term of tagalogDisasterTerms) {
      if (lowerText.includes(term)) {
        tagalogCount++;
      }
    }
    
    // Require at least 2 English words for Taglish/English classification to avoid false positives
    const MIN_ENGLISH_WORDS = 2;
    
    if (tagalogCount > 0 && englishCount >= MIN_ENGLISH_WORDS) {
      return 'Taglish';
    } else if (englishCount >= MIN_ENGLISH_WORDS && englishCount > tagalogCount) {
      return 'English';
    } else if (tagalogCount > 0) {
      return 'Tagalog';
    } else {
      return 'English'; // Default to English if no clear signals
    }
  }

  /**
   * Simple fallback location extraction - Expanded with many Philippine locations
   */
  private extractLocationFallback(text: string): string | null {
    const locationKeywords = [
      // Metro Manila Cities
      'Manila', 'Quezon City', 'Makati', 'Taguig', 'Pasig', 'Mandaluyong', 
      'San Juan', 'Marikina', 'Caloocan', 'Malabon', 'Navotas', 'Valenzuela',
      'Las Piñas', 'Muntinlupa', 'Parañaque', 'Pateros', 'Pasay',
      
      // Luzon - Major Cities
      'Baguio', 'Angeles', 'San Fernando', 'Olongapo', 'Batangas City', 
      'Lipa', 'Cabanatuan', 'Dagupan', 'Lucena', 'Naga', 'Legazpi',
      
      // Luzon - Provinces
      'Abra', 'Albay', 'Apayao', 'Aurora', 'Bataan', 'Batangas', 'Benguet',
      'Bulacan', 'Cagayan', 'Camarines Norte', 'Camarines Sur', 'Catanduanes',
      'Cavite', 'Ifugao', 'Ilocos Norte', 'Ilocos Sur', 'Isabela', 'Kalinga',
      'La Union', 'Laguna', 'Mountain Province', 'Nueva Ecija', 'Nueva Vizcaya',
      'Pampanga', 'Pangasinan', 'Quezon', 'Quirino', 'Rizal', 'Sorsogon',
      'Tarlac', 'Zambales',
      
      // Visayas - Major Cities
      'Cebu', 'Cebu City', 'Mandaue', 'Lapu-Lapu', 'Iloilo City', 'Bacolod',
      'Dumaguete', 'Tacloban', 'Ormoc', 'Roxas City', 'Tagbilaran',
      
      // Visayas - Provinces
      'Aklan', 'Antique', 'Biliran', 'Bohol', 'Capiz', 'Eastern Samar',
      'Guimaras', 'Iloilo', 'Leyte', 'Negros Occidental', 'Negros Oriental',
      'Northern Samar', 'Samar', 'Siquijor', 'Southern Leyte', 'Western Samar',
      
      // Mindanao - Major Cities
      'Davao', 'Davao City', 'Cagayan de Oro', 'General Santos', 'Zamboanga',
      'Iligan', 'Butuan', 'Cotabato City', 'Marawi', 'Koronadal', 'Dipolog',
      'Pagadian', 'Kidapawan', 'Malaybalay', 'Surigao City', 'Tagum',
      'Ozamiz', 'Digos', 'Mati', 'Tandag',
      
      // Mindanao - Provinces
      'Agusan del Norte', 'Agusan del Sur', 'Basilan', 'Bukidnon', 
      'Camiguin', 'Compostela Valley', 'Cotabato', 'Davao del Norte',
      'Davao del Sur', 'Davao Occidental', 'Davao Oriental', 'Dinagat Islands',
      'Lanao del Norte', 'Lanao del Sur', 'Maguindanao', 'Misamis Occidental',
      'Misamis Oriental', 'Sarangani', 'South Cotabato', 'Sultan Kudarat',
      'Sulu', 'Surigao del Norte', 'Surigao del Sur', 'Tawi-Tawi',
      'Zamboanga del Norte', 'Zamboanga del Sur', 'Zamboanga Sibugay',
      
      // Regions
      'Luzon', 'Visayas', 'Mindanao', 'Metro Manila', 'NCR', 'CAR', 'CALABARZON',
      'MIMAROPA', 'Bicol', 'Western Visayas', 'Central Visayas', 'Eastern Visayas',
      'Northern Mindanao', 'SOCCSKSARGEN', 'ARMM', 'BARMM', 'Caraga',
      
      // Popular municipalities and areas
      'Antipolo', 'Bacoor', 'Dasmariñas', 'Imus', 'General Trias', 'Biñan',
      'Santa Rosa', 'San Pedro', 'Calamba', 'Meycauayan', 'San Jose del Monte',
      'Malolos', 'Tanauan', 'Puerto Princesa', 'Boracay', 'Palawan', 'Bohol',
      'Siargao', 'Subic', 'Clark', 'Tagaytay'
    ];

    const lowerText = text.toLowerCase();
    for (const location of locationKeywords) {
      if (lowerText.includes(location.toLowerCase())) {
        return location;
      }
    }
    return null;
  }

  /**
   * Smart fallback disaster type extraction - ONLY 5 DISASTER TYPES with proper capitalization
   */
  private extractDisasterTypeFallback(text: string): string | null {
    const disasterKeywords = {
      'Typhoon': ['bagyo', 'typhoon', 'bagyong', '#bagyo'],
      'Earthquake': ['lindol', 'earthquake', 'tremor', '#lindol', 'quake'],
      'Fire': ['sunog', 'fire', 'flames', '#sunog', 'burning'],
      'Landslide': ['guho', 'landslide', 'pagguho', 'mudslide'],
      'Volcanic Eruption': ['bulkan', 'volcano', 'eruption', 'volcanic', 'pagputok']
    };

    // Normalize text: remove symbols but keep words
    const normalizedText = text.toLowerCase()
      .replace(/[#@()[\]{}]/g, ' ') // Replace symbols with spaces to separate words
      .replace(/[!?.,:;]/g, ''); // Remove punctuation
    
    for (const [type, keywords] of Object.entries(disasterKeywords)) {
      for (const keyword of keywords) {
        const cleanKeyword = keyword.replace(/[#@]/g, '');
        if (normalizedText.includes(cleanKeyword)) {
          return type;
        }
      }
    }
    return null;
  }

  /**
   * Utility function to add delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get cached results if available
   */
  getCachedTweets(): ProcessedTwitterPost[] | null {
    const cached = this.cache.get('latest_tweets');
    if (!cached) return null;

    // Check if cache has expired
    const now = Date.now();
    if (now - cached.timestamp > this.cacheExpiry) {
      this.cache.delete('latest_tweets');
      return null;
    }

    return cached.data;
  }

  /**
   * Cache processed tweets
   */
  cacheTweets(tweets: ProcessedTwitterPost[]): void {
    this.cache.set('latest_tweets', {
      data: tweets,
      timestamp: Date.now()
    });
  }
}