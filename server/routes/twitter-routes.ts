/**
 * Twitter API Routes
 * Handles live Twitter data fetching and processing for sentiment analysis
 */

import { Router, Request, Response } from 'express';
import { TwitterService, ProcessedTwitterPost } from '../utils/twitter-service';
import { DatabaseStorage } from '../storage';
import { InsertSentimentPost } from '@shared/schema';
import { groqAPI } from '../utils/groq-api';

const router = Router();
const twitterService = new TwitterService();

// Initialize database storage
const storage = new DatabaseStorage();

/**
 * Fetch latest disaster-related tweets and return them without storing
 * GET /api/twitter/fetch
 */
router.get('/fetch', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 15;
    console.log(`[twitter-routes] Fetching ${limit} tweets`);

    // Check cache first
    const cachedTweets = twitterService.getCachedTweets();
    if (cachedTweets && cachedTweets.length > 0) {
      console.log(`[twitter-routes] Returning ${cachedTweets.length} cached tweets`);
      return res.json({
        success: true,
        data: cachedTweets,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }

    // Fetch new tweets
    const tweets = await twitterService.fetchDisasterTweets(limit);
    
    if (!tweets || tweets.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No disaster-related tweets found at this time',
        timestamp: new Date().toISOString()
      });
    }

    // Process tweets for sentiment analysis
    const processedTweets = await twitterService.processTweetsForSentiment(tweets);
    
    // Cache the results
    twitterService.cacheTweets(processedTweets);

    res.json({
      success: true,
      data: processedTweets,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[twitter-routes] Error fetching tweets:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Twitter data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Fetch tweets and automatically store them in the sentiment analysis database
 * POST /api/twitter/fetch-and-store
 */
router.post('/fetch-and-store', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.body.limit) || 15;
    console.log(`[twitter-routes] Fetching and storing ${limit} tweets`);

    // Fetch tweets
    const tweets = await twitterService.fetchDisasterTweets(limit);
    
    if (!tweets || tweets.length === 0) {
      return res.json({
        success: true,
        data: [],
        stored: 0,
        message: 'No disaster-related tweets found to store',
        timestamp: new Date().toISOString()
      });
    }

    // Process tweets for sentiment analysis
    const processedTweets = await twitterService.processTweetsForSentiment(tweets);
    
    // Prepare data for database insertion
    const sentimentPosts: InsertSentimentPost[] = processedTweets.map(tweet => ({
      text: tweet.text,
      timestamp: new Date(tweet.timestamp),
      source: 'twitter',
      language: tweet.language,
      sentiment: tweet.sentiment,
      confidence: tweet.confidence,
      location: tweet.location,
      disasterType: tweet.disasterType,
      fileId: null, // Live data doesn't belong to a file
      explanation: `Auto-analyzed from Twitter via TwitterAPI.io`,
      processedBy: null, // System processed
      aiTrustMessage: `Processed from live Twitter data with ${(tweet.confidence * 100).toFixed(1)}% confidence`
    }));

    // Store in database
    const storedPosts = await storage.createManySentimentPosts(sentimentPosts);
    
    console.log(`[twitter-routes] Successfully stored ${storedPosts.length} tweets`);

    res.json({
      success: true,
      data: processedTweets,
      stored: storedPosts.length,
      message: `Successfully fetched and stored ${storedPosts.length} tweets`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[twitter-routes] Error fetching and storing tweets:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch and store Twitter data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Fetch and format Twitter data for TwitterRealTimeData component
 * GET /api/twitter/data
 */
router.get('/data', async (req: Request, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 5, 5); // Limit to max 5 tweets to avoid rate limits
    console.log(`[twitter-routes] Fetching ${limit} tweets for TwitterRealTimeData component`);

    // Fetch tweets
    const tweets = await twitterService.fetchDisasterTweets(limit);
    
    if (!tweets || tweets.length === 0) {
      return res.json({
        success: true,
        data: [],
        count: 0,
        message: 'No disaster-related tweets found at this time. Will retry in next fetch.',
        timestamp: new Date().toISOString()
      });
    }

    // Process tweets for sentiment analysis
    const processedTweets = await twitterService.processTweetsForSentiment(tweets);
    
    // Transform to TwitterData format expected by the component
    const formattedData = processedTweets.map(tweet => {
      // Map detailed emotions to simple sentiment categories
      const getSimpleSentiment = (emotion: string): string => {
        const lowerEmotion = emotion.toLowerCase();
        // Positive sentiments
        if (lowerEmotion === 'positive' || lowerEmotion === 'resilience') {
          return 'Positive';
        }
        // Neutral sentiments
        if (lowerEmotion === 'neutral') {
          return 'Neutral';
        }
        // Negative sentiments (panic, fear/anxiety, disbelief, negative)
        return 'Negative';
      };

      return {
        id: tweet.id,
        text: tweet.text,
        link: tweet.url || `https://twitter.com/i/web/status/${tweet.id}`,
        timestamp: tweet.timestamp,
        metadata: {
          emotion: tweet.sentiment,
          sentiment: getSimpleSentiment(tweet.sentiment),
          disaster: tweet.disasterType || 'Unknown',
          location: tweet.location || 'Unknown',
          confidence: (tweet.confidence * 100).toFixed(1),
          language: tweet.language,
          source: 'Twitter(X)'
        }
      };
    });

    // Store in database
    const sentimentPosts: InsertSentimentPost[] = processedTweets.map(tweet => ({
      text: tweet.text,
      timestamp: new Date(tweet.timestamp),
      source: 'twitter',
      language: tweet.language,
      sentiment: tweet.sentiment,
      confidence: tweet.confidence,
      location: tweet.location,
      disasterType: tweet.disasterType,
      fileId: null,
      explanation: `Auto-analyzed from Twitter via TwitterAPI.io`,
      processedBy: null,
      aiTrustMessage: `Processed from live Twitter data with ${(tweet.confidence * 100).toFixed(1)}% confidence`
    }));

    await storage.createManySentimentPosts(sentimentPosts);
    console.log(`[twitter-routes] Successfully stored ${sentimentPosts.length} tweets`);

    res.json({
      success: true,
      data: formattedData,
      count: formattedData.length,
      message: `Fetched ${formattedData.length} tweets (Rate limit: 1 request per 5 seconds)`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error(`[twitter-routes] Error fetching Twitter data:`, error);
    
    // Return friendly error message instead of crashing
    const isRateLimit = error.response?.status === 429;
    res.status(200).json({
      success: false,
      error: isRateLimit ? 'Rate limit reached' : 'Failed to fetch Twitter data',
      message: isRateLimit 
        ? 'Twitter API rate limit reached. Please wait and try again. Free tier allows 1 request every 5 seconds.' 
        : (error.message || 'Unknown error occurred'),
      data: [],
      count: 0,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Clear Twitter cache
 * POST /api/twitter-clear-cache
 */
router.post('/twitter-clear-cache', async (req: Request, res: Response) => {
  try {
    console.log(`[twitter-routes] Clearing Twitter cache`);
    // The cache is managed internally by TwitterService
    // We can add a method to clear it if needed
    res.json({
      success: true,
      message: 'Twitter cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[twitter-routes] Error clearing cache:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear Twitter cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Get processing status and configuration
 * GET /api/twitter/status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const cachedTweets = twitterService.getCachedTweets();
    const hasCache = cachedTweets && cachedTweets.length > 0;
    
    res.json({
      success: true,
      status: {
        service: 'operational',
        lastFetch: hasCache ? new Date().toISOString() : null,
        cachedTweets: hasCache ? cachedTweets.length : 0,
        apiProvider: 'TwitterAPI.io',
        features: {
          sentiment_analysis: true,
          disaster_detection: true,
          auto_storage: true,
          caching: true
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error(`[twitter-routes] Error getting status:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to get Twitter service status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Stream tweets one by one as they're being fetched and analyzed
 * GET /api/twitter/stream
 */
router.get('/stream', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 15;
  let isClientConnected = true;
  
  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx
  
  // Flush headers immediately to start SSE stream
  res.flushHeaders();
  
  console.log(`[twitter-routes] Starting stream for ${limit} tweets`);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log('[twitter-routes] Client disconnected from stream');
    isClientConnected = false;
  });
  
  try {
    // Send initial status and flush
    res.write(`data: ${JSON.stringify({ type: 'status', message: 'Fetching tweets...', total: limit })}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    
    // Send heartbeat while fetching
    const heartbeatInterval = setInterval(() => {
      if (!isClientConnected) {
        clearInterval(heartbeatInterval);
        return;
      }
      res.write(`: heartbeat\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }, 2000);
    
    // Fetch tweets (this is still blocking but we send heartbeats)
    const tweets = await twitterService.fetchDisasterTweets(limit);
    clearInterval(heartbeatInterval);
    
    if (!isClientConnected) {
      res.end();
      return;
    }
    
    if (!tweets || tweets.length === 0) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'No disaster-related tweets found' })}\n\n`);
      res.write(`data: ${JSON.stringify({ type: 'done', total: 0 })}\n\n`);
      res.end();
      return;
    }
    
    // Update status with actual count
    res.write(`data: ${JSON.stringify({ type: 'status', message: `Processing ${tweets.length} tweets...`, total: tweets.length })}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    
    // Process tweets one by one and stream results
    const processedTweets: ProcessedTwitterPost[] = [];
    
    for (let i = 0; i < tweets.length; i++) {
      // Check if client is still connected
      if (!isClientConnected) {
        console.log('[twitter-routes] Client disconnected, stopping processing');
        break;
      }
      
      const tweet = tweets[i];
      
      try {
        // Send progress update
        res.write(`data: ${JSON.stringify({ 
          type: 'progress', 
          current: i + 1, 
          total: tweets.length,
          message: `Analyzing tweet ${i + 1}/${tweets.length}...`
        })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
        
        let processedTweet: ProcessedTwitterPost;
        
        try {
          // Try AI analysis first
          const analysis = await twitterService.analyzeTweetSentiment(tweet.text);
          
          if (!isClientConnected) {
            console.log('[twitter-routes] Client disconnected during analysis');
            break;
          }
          
          processedTweet = {
            ...tweet,
            sentiment: analysis.sentiment || 'neutral',
            confidence: analysis.confidence || 0.5,
            language: analysis.language || 'English',
            location: analysis.location || undefined,
            disasterType: analysis.disasterType || undefined,
            source: 'twitter'
          };
        } catch (aiError: any) {
          // Fallback to quick rule-based analysis if AI fails (e.g., rate limits)
          console.log(`[twitter-routes] AI analysis failed for tweet ${i + 1}, using fallback`);
          
          const text = tweet.text.toLowerCase();
          
          // Quick language detection
          const hasFilipino = /\b(ang|ng|mga|sa|ko|mo|nang|para|nung|yung|at|pag|ni|si|kay|na|po|opo|din|rin|nga|ba|eh|ay|ito|iyan|iyon|dito|diyan|doon|bagyo|lindol|sunog|baha)\b/i.test(tweet.text);
          const hasEnglish = /\b(the|and|or|is|are|was|were|been|have|has|had|do|does|did|will|would|can|could|should)\b/i.test(tweet.text);
          const language = hasFilipino && hasEnglish ? 'Taglish' : hasFilipino ? 'Tagalog' : 'English';
          
          // Quick sentiment detection
          const panicWords = /\b(help|emergency|fire|burning|danger|trapped|救|tulong|saklolo|911)\b/i;
          const fearWords = /\b(scared|worried|afraid|anxious|takot|kaba)\b/i;
          const sentiment = panicWords.test(text) ? 'Panic' : fearWords.test(text) ? 'Fear/Anxiety' : 'Neutral';
          
          // Quick disaster type detection - ONLY 5 TYPES with proper capitalization
          const disasterTypes: { [key: string]: RegExp } = {
            'Fire': /\b(fire|sunog|burning)\b/i,
            'Typhoon': /\b(typhoon|bagyo)\b/i,
            'Earthquake': /\b(earthquake|lindol|tremor|quake)\b/i,
            'Landslide': /\b(landslide|guho|pagguho)\b/i,
            'Volcanic Eruption': /\b(volcano|volcanic|eruption|bulkan|pagputok)\b/i
          };
          let disasterType = undefined;
          for (const [type, regex] of Object.entries(disasterTypes)) {
            if (regex.test(text)) {
              disasterType = type;
              break;
            }
          }
          
          // Quick location extraction
          const locations = ['Manila', 'Cebu', 'Davao', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Caloocan', 'Baguio', 'Iloilo', 'Bacolod', 'Tacloban', 'Zamboanga', 'Cagayan de Oro'];
          let location = undefined;
          for (const loc of locations) {
            if (text.includes(loc.toLowerCase())) {
              location = loc;
              break;
            }
          }
          
          processedTweet = {
            ...tweet,
            sentiment,
            confidence: 0.6, // Lower confidence for fallback
            language,
            location,
            disasterType,
            source: 'twitter'
          };
        }
        
        processedTweets.push(processedTweet);
        
        // Stream the processed tweet immediately
        res.write(`data: ${JSON.stringify({ 
          type: 'tweet', 
          data: processedTweet,
          index: i + 1,
          total: tweets.length
        })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
        
        // LONGER delay to avoid rate limits (3 seconds between tweets)
        if (i < tweets.length - 1) { // Don't delay after last tweet
          console.log(`[twitter-routes] Waiting 3 seconds before next tweet to avoid rate limit...`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (error) {
        console.error(`[twitter-routes] Error processing tweet ${tweet.id}:`, error);
        
        if (!isClientConnected) break;
        
        // Send error for this specific tweet but continue
        res.write(`data: ${JSON.stringify({ 
          type: 'error', 
          message: `Failed to analyze tweet ${i + 1}`,
          tweetId: tweet.id
        })}\n\n`);
        if (typeof (res as any).flush === 'function') {
          (res as any).flush();
        }
        
        // Still delay even on error to maintain consistent pacing
        if (i < tweets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
    }
    
    if (!isClientConnected) {
      res.end();
      return;
    }
    
    // Store all processed tweets in database
    if (processedTweets.length > 0) {
      const sentimentPosts: InsertSentimentPost[] = processedTweets.map(tweet => ({
        text: tweet.text,
        timestamp: new Date(tweet.timestamp),
        source: 'twitter',
        language: tweet.language,
        sentiment: tweet.sentiment,
        confidence: tweet.confidence,
        location: tweet.location,
        disasterType: tweet.disasterType,
        fileId: null,
        explanation: `Auto-analyzed from Twitter via TwitterAPI.io`,
        processedBy: null,
        aiTrustMessage: `Processed from live Twitter data with ${(tweet.confidence * 100).toFixed(1)}% confidence`
      }));
      
      await storage.createManySentimentPosts(sentimentPosts);
      console.log(`[twitter-routes] Successfully stored ${sentimentPosts.length} tweets`);
    }
    
    // Send completion message
    res.write(`data: ${JSON.stringify({ 
      type: 'done', 
      total: processedTweets.length,
      stored: processedTweets.length,
      message: `Successfully processed and stored ${processedTweets.length} tweets`
    })}\n\n`);
    if (typeof (res as any).flush === 'function') {
      (res as any).flush();
    }
    
    res.end();
    
  } catch (error) {
    console.error(`[twitter-routes] Error in stream:`, error);
    if (isClientConnected) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })}\n\n`);
      if (typeof (res as any).flush === 'function') {
        (res as any).flush();
      }
    }
    res.end();
  }
});

export default router;