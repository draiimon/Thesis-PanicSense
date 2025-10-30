#!/usr/bin/env python3
"""
Groq Compound AI Utility
Uses Groq's Compound model with web search, code interpreter, and visit website tools
ONLY for:
1. Realtime sentiment analysis
2. Twitter fetch AI analysis  
3. Raw data / CSV analysis

250 tokens per day limit - use sparingly!
"""

import os
import json
import logging
from groq import Groq

logging.basicConfig(level=logging.INFO)

class GroqCompoundAI:
    """
    Groq Compound AI wrapper with web search capabilities
    Limited to 250 tokens per day
    """
    
    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("GROQ_API_KEY environment variable not found")
        
        self.client = Groq(
            api_key=self.api_key,
            default_headers={
                "Groq-Model-Version": "latest"
            }
        )
        
        self.model = "groq/compound"
        self.tools_config = {
            "tools": {
                "enabled_tools": ["web_search", "code_interpreter", "visit_website"]
            }
        }
        
        logging.info("✅ Groq Compound AI initialized (250 tokens/day limit)")
    
    def detect_language(self, text: str) -> str:
        """
        AI-based language detection using Groq
        Returns ONLY: "English", "Tagalog", or "Taglish"
        
        Args:
            text: The text to detect language for
        
        Returns:
            str: "English", "Tagalog", or "Taglish"
        """
        system_message = """You are a language detection expert for Philippines.

READ CAREFULLY: Ignore symbols, hashtags, punctuation when detecting language:
- #lindolCebu contains Tagalog word "lindol"
- (bagyo) contains Tagalog word "bagyo"  
- TULONG!!! contains Tagalog word "tulong"

Detect if the text is:
- English: Pure English text
- Tagalog: Pure Tagalog/Filipino text (includes disaster terms: bagyo, lindol, baha, sunog, ulan, tulong)
- Taglish: Mixed Tagalog and English

IMPORTANT: Respond with ONLY ONE WORD: "English", "Tagalog", or "Taglish" - nothing else!

Examples:
"omg there's a fire!" = English
"may sunog dito!" = Tagalog
"#bagyo sa Cebu" = Tagalog
"omg may sunog na naman!" = Taglish"""
        
        try:
            logging.info(f"🌐 Detecting language using AI...")
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": system_message + "\n\nDetect language: " + text}
                ],
                temperature=0.1,
                max_completion_tokens=10,
                top_p=1,
                stream=False
            )
            
            language = completion.choices[0].message.content
            if not language:
                logging.warning("⚠️ AI returned empty language, defaulting to English")
                return "English"
            
            language = language.strip()
            
            # STRICT normalization - ONLY 3 values allowed: English, Tagalog, Taglish
            language_lower = language.lower()
            if "taglish" in language_lower or "mixed" in language_lower:
                return "Taglish"
            elif "tagalog" in language_lower or "filipino" in language_lower or "fil" in language_lower or language_lower == "tl":
                return "Tagalog"
            elif "english" in language_lower or language_lower == "en":
                return "English"
            else:
                # If AI returns something unexpected, default to English
                logging.warning(f"⚠️ AI returned unexpected language '{language}', defaulting to English")
                return "English"
                
        except Exception as e:
            logging.error(f"❌ Language detection error: {e}, defaulting to English")
            return "English"
    
    def analyze_sentiment_realtime(self, text: str, language: str = "English") -> dict:
        """
        Analyze sentiment for REALTIME text analysis using Compound AI
        Uses web search for recent disaster context
        
        Args:
            text: The text to analyze
            language: Detected language (English, Tagalog, Taglish)
        
        Returns:
            dict with sentiment, confidence, explanation, disasterType, location
        """
        
        # Create language-specific system message
        if language == "Tagalog":
            system_message = """Ikaw ay isang dalubhasa sa pagsusuri ng damdamin sa panahon ng sakuna sa Pilipinas.
Gamitin ang web search para sa pinakabagong konteksto ng sakuna.

CRITICAL READING INSTRUCTIONS:
1. Basahin ang mga salitang nakakabit sa symbols: #lindolCebu = "lindol" + "Cebu", (cebu) = "cebu", cebu! = "cebu"
2. Unawain ang mga emoji: 😱 = takot, 🔥 = apoy, 💪 = lakas, 🙏 = dasal
3. Basahin kahit may ALL CAPS, !!!, o maraming punctuation

FILIPINO DISASTER TERMS (Translate to English):
- bagyo = typhoon
- lindol = earthquake
- baha/pagbaha = flood
- sunog = fire
- ulan/malakas na ulan = heavy rain/storm
- guho/landslide = landslide
- aftershock = aftershock
- tsunami = tsunami

Klasipikasyon ng emosyon (sentiment):
- Panic: Matinding takot, urgency, desperasyon (TULONG!, HELP!, mamamatay na kami)
- Fear/Anxiety: Pag-aalala, kaba, takot (natatakot, kinakabahan, worried, anxious)
- Disbelief: Pagdududa, pagtataka (totoo ba?, paano nangyari?)
- Resilience: Lakas-loob, pag-asa, pagtulong (kaya natin to, tulungan, prayers)
- Neutral: Walang emosyon, factual (may lindol, may baha - walang fear words)

CRITICAL: Kahit totoo ang sakuna, kung may emotional words (natatakot, kinakabahan, worried), DAPAT Fear/Anxiety!
"Natatakot ako" = Fear/Anxiety LAGI, hindi Neutral!

IMPORTANTE: Ang "explanation" ay dapat 1 SENTENCE LANG! Maikli at malinaw.

Tumugon sa JSON format: {"sentiment": "emotion", "confidence": score, "explanation": "paliwanag", "disasterType": "English term", "location": "lokasyon"}"""
        elif language == "Taglish":
            system_message = """You are a disaster sentiment expert for Philippines analyzing Taglish (mixed Tagalog-English) messages.
Use web search for recent disaster context.

CRITICAL READING INSTRUCTIONS:
1. Read words embedded in symbols: #earthquakeCebu = "earthquake" + "Cebu", (cebu) = "cebu", cebu! = "cebu"
2. Understand emojis: 😱 = scared, 🔥 = fire, 💪 = strength, 🙏 = prayer
3. Read even with ALL CAPS, !!!, or excessive punctuation
4. Hashtags contain important info: #SaveCebu, #lindolPH

FILIPINO DISASTER TERMS (Translate to English):
- bagyo = typhoon
- lindol = earthquake
- baha/pagbaha = flood
- sunog = fire
- ulan/malakas na ulan = heavy rain/storm
- guho/landslide = landslide
- aftershock = aftershock
- tsunami = tsunami

Classify emotion (sentiment):
- Panic: Extreme fear, urgency, desperation (HELP!, RESCUE!, trapped, TULONG!)
- Fear/Anxiety: Worry, nervousness, fear (natatakot, scared, kinakabahan, worried, anxious)
- Disbelief: Doubt, shock, disbelief (totoo ba?, is this real?, paano?)
- Resilience: Strength, hope, helping others (kaya natin, prayers, tulong, support)
- Neutral: No emotion, factual (may lindol, there's a flood - no fear words)

CRITICAL: Even if disaster is real, if there are emotional words (natatakot, scared, worried), classify as Fear/Anxiety!
"Natatakot ako" or "I'm scared" = Fear/Anxiety ALWAYS, NOT Neutral!

IMPORTANT: Keep "explanation" to ONE SENTENCE ONLY! Short and clear.

Respond in JSON: {"sentiment": "emotion", "confidence": score, "explanation": "explanation", "disasterType": "English term", "location": "location"}"""
        else:
            system_message = """You are a disaster sentiment analysis expert for the Philippines.
Use web search to get recent disaster context and validate information.

CRITICAL READING INSTRUCTIONS:
1. Read words embedded in symbols/hashtags: #earthquakeCebu = "earthquake" + "Cebu", (cebu) = "cebu", cebu! = "cebu"
2. Understand emojis: 😱 = scared, 🔥 = fire, 💪 = strength, 🙏 = prayer, 😭 = crying
3. Read even with ALL CAPS, !!!, or excessive punctuation
4. Extract info from hashtags: #PrayForCebu, #TyphoonOdette, #EarthquakePH

FILIPINO DISASTER TERMS YOU MUST TRANSLATE TO ENGLISH:
- bagyo = typhoon
- lindol = earthquake  
- baha/pagbaha = flood
- sunog = fire
- ulan/malakas na ulan = heavy rain/storm
- guho/landslide = landslide
- aftershock = aftershock
- tsunami = tsunami
- pagputok ng bulkan = volcanic eruption

Classify emotional sentiment:
- Panic: Extreme fear, urgent danger, desperate help (HELP!, TRAPPED!, emergency, TULONG!)
- Fear/Anxiety: Worry, nervousness, concern (scared, afraid, worried, anxious, fearful, natatakot)
- Disbelief: Doubt, shock, can't believe it (is this real?, how did this happen?, totoo ba?)
- Resilience: Strength, hope, support, helping (we can do this, prayers, stay strong, kaya natin)
- Neutral: No emotion, factual statement (earthquake occurred, there is flooding - no fear words)

CRITICAL: Even if the disaster is real, if the person expresses fear/worry (scared, afraid, worried, natatakot), classify as Fear/Anxiety!
"I'm scared" or "I'm worried" or "Natatakot ako" = Fear/Anxiety ALWAYS, NOT Neutral!

IMPORTANT: Keep "explanation" to ONE SENTENCE ONLY! Short and clear.
IMPORTANT: Return disasterType in ENGLISH ONLY (typhoon, not bagyo; earthquake, not lindol; flood, not baha)

Respond in JSON: {"sentiment": "emotion", "confidence": score, "explanation": "explanation", "disasterType": "English term only", "location": "location"}"""
        
        try:
            logging.info(f"🤖 COMPOUND AI: Analyzing realtime text (250 tokens/day limit)")
            
            completion = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "user", "content": system_message + "\n\nAnalyze: " + text}
                ],
                temperature=0.7,
                max_completion_tokens=512,
                top_p=1,
                stream=False,
                compound_custom=self.tools_config  # type: ignore
            )
            
            response_text = completion.choices[0].message.content
            
            # Parse JSON response
            try:
                result = json.loads(response_text)
                logging.info(f"✅ COMPOUND AI: Analysis complete - {result.get('sentiment')}")
                return result
            except json.JSONDecodeError:
                # If not valid JSON, extract what we can
                logging.warning("⚠️ COMPOUND AI: Non-JSON response, parsing manually")
                return {
                    "sentiment": "Neutral",
                    "confidence": 0.5,
                    "explanation": response_text[:200],
                    "disasterType": "Unknown",
                    "location": "Unknown"
                }
                
        except Exception as e:
            logging.error(f"❌ COMPOUND AI error: {str(e)}")
            raise
    
    def analyze_csv_batch(self, texts: list, progress_callback=None) -> list:
        """
        Analyze a batch of texts for CSV processing using Compound AI
        
        Args:
            texts: List of texts to analyze
            progress_callback: Optional callback function(current, total)
        
        Returns:
            List of analysis results
        """
        results = []
        total = len(texts)
        
        logging.info(f"🤖 COMPOUND AI: Starting batch analysis of {total} texts (250 tokens/day limit)")
        
        for i, text in enumerate(texts):
            try:
                result = self.analyze_sentiment_realtime(text)
                results.append(result)
                
                if progress_callback:
                    progress_callback(i + 1, total)
                    
            except Exception as e:
                logging.error(f"❌ COMPOUND AI batch error on item {i}: {str(e)}")
                # Add fallback result
                results.append({
                    "sentiment": "Neutral",
                    "confidence": 0.3,
                    "explanation": f"Error: {str(e)}",
                    "disasterType": "Unknown",
                    "location": "Unknown"
                })
        
        logging.info(f"✅ COMPOUND AI: Batch analysis complete")
        return results


# Singleton instance
_compound_ai = None

def get_compound_ai():
    """Get or create Compound AI instance"""
    global _compound_ai
    if _compound_ai is None:
        _compound_ai = GroqCompoundAI()
    return _compound_ai
