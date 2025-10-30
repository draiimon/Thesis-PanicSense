/**
 * Twitter Real-time Data Component
 * Displays real-time Twitter data with disaster sentiment analysis
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, RefreshCw, AlertTriangle, Twitter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  fetchTwitterData,
  clearTwitterCache,
  getSentimentColor,
  getEmotionColor,
  getDisasterColor,
  type TwitterData
} from '@/lib/twitter-api';

interface TwitterRealTimeDataProps {
  className?: string;
}

export function TwitterRealTimeData({ className }: TwitterRealTimeDataProps) {
  const [twitterData, setTwitterData] = useState<TwitterData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  /**
   * Fetch new Twitter data - ALWAYS sends ALL fetched tweets to Real-time Analysis
   */
  const handleFetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTwitterData(10); // Fetch 10 new tweets for comprehensive analysis
      setTwitterData(data);
      setLastUpdated(new Date().toLocaleString());

      // IMPORTANT: Dispatch custom event to auto-populate Real-time Analysis page
      // This ensures ALL fetched tweets are automatically sent to Real-time Analysis
      console.log(`📨 DISPATCHING ${data.length} tweets to Real-time Analysis page...`);
      const event = new CustomEvent('twitter-tweets-fetched', {
        detail: { tweets: data }
      });
      window.dispatchEvent(event);

      toast({
        title: "Success",
        description: `Found ${data.length} new disaster-related tweets - ALL automatically saved to database and sent to Real-time Analysis page!`,
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch Twitter data';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Clear Twitter cache
   */
  const handleClearCache = async () => {
    try {
      await clearTwitterCache();
      toast({
        title: "Success",
        description: "Twitter cache cleared successfully",
        variant: "default",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear cache';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: string): string => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  };

  /**
   * Get emotion emoji based on emotion value
   */
  const getEmotionEmoji = (emotion: string): string => {
    switch (emotion.toLowerCase()) {
      case 'panic':
        return '😱';
      case 'fear/anxiety':
        return '😰';
      case 'resilience':
        return '💪';
      case 'disbelief':
        return '😳';
      case 'neutral':
        return '😐';
      default:
        return '❓';
    }
  };

  /**
   * Get sentiment emoji based on sentiment value
   */
  const getSentimentEmoji = (sentiment: string): string => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return '😊';
      case 'negative':
        return '😞';
      case 'neutral':
        return '😐';
      default:
        return '❓';
    }
  };

  /**
   * Get disaster emoji based on disaster type
   */
  const getDisasterEmoji = (disaster: string): string => {
    switch (disaster.toLowerCase()) {
      case 'flood':
      case 'baha':
        return '🌊';
      case 'fire':
      case 'sunog':
        return '🔥';
      case 'earthquake':
      case 'lindol':
        return '🌍';
      case 'typhoon':
      case 'bagyo':
        return '🌪️';
      case 'landslide':
        return '🗻';
      case 'volcanic eruption':
      case 'bulkan':
        return '🌋';
      default:
        return '⚠️';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compact Header */}
      <Card className="border-none shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
        <CardHeader className="p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-gray-200/40 rounded-t-2xl">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-white">
            <Twitter className="h-5 w-5" />
            Twitter Real-time Data
          </CardTitle>
          <CardDescription className="text-indigo-100 text-sm">
            Live disaster tweets from Philippines
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Button
              onClick={handleFetchData}
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Fetch New Tweets
                </>
              )}
            </Button>

            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Last: {lastUpdated}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Twitter Data Display */}
      {twitterData.length > 0 ? (
        <div className="space-y-4">
          {twitterData.map((tweet) => (
            <Card key={tweet.id} className="border-l-4 border-l-indigo-500 hover:shadow-md transition-shadow bg-white/90 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Tweet Content */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <p className="text-gray-800 leading-relaxed flex-1 text-sm">
                        {tweet.text}
                      </p>
                      <a
                        href={tweet.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-4 text-indigo-600 hover:text-indigo-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatTimestamp(tweet.timestamp)}
                    </div>
                  </div>

                  {/* Metadata Grid - Keep emotion, add simple sentiment */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Location */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Location</div>
                      <div className="text-sm font-medium text-gray-800">
                        {tweet.metadata.location || 'Unknown'}
                      </div>
                    </div>

                    {/* Disaster Type */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Disaster</div>
                      <Badge
                        className={`${getDisasterColor(tweet.metadata.disaster)} text-xs flex items-center gap-1`}
                      >
                        <span>{getDisasterEmoji(tweet.metadata.disaster)}</span>
                        {tweet.metadata.disaster || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Keep Original Emotion */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Emotion</div>
                      <Badge
                        className={`${getEmotionColor(tweet.metadata.emotion)} text-xs flex items-center gap-1`}
                      >
                        <span>{getEmotionEmoji(tweet.metadata.emotion)}</span>
                        {tweet.metadata.emotion || 'Unknown'}
                      </Badge>
                    </div>

                    {/* Simple Sentiment - Convert emotion to simple sentiment */}
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Sentiment</div>
                      <Badge
                        className={`${getSentimentColor(
                          tweet.metadata.emotion === 'Resilience' ? 'Positive' :
                          tweet.metadata.emotion === 'Neutral' ? 'Neutral' : 'Negative'
                        )} text-xs flex items-center gap-1`}
                      >
                        <span>{getSentimentEmoji(
                          tweet.metadata.emotion === 'Resilience' ? 'Positive' :
                          tweet.metadata.emotion === 'Neutral' ? 'Neutral' : 'Negative'
                        )}</span>
                        {tweet.metadata.emotion === 'Resilience' ? 'Positive' :
                         tweet.metadata.emotion === 'Neutral' ? 'Neutral' : 'Negative'}
                      </Badge>
                    </div>
                  </div>

                  {/* Additional Info - No Confidence */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                    <div>
                      <span className="text-gray-500">Language:</span>
                      <span className="font-medium text-gray-800 ml-1">
                        {tweet.metadata.language?.toUpperCase() || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Source:</span>
                      <span className="font-medium text-indigo-600 ml-1">
                        Twitter(X)
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isLoading && (
          <Card className="border-none shadow-lg rounded-2xl bg-white/90 backdrop-blur-sm border border-indigo-100/40">
            <CardContent className="py-8">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 flex items-center justify-center">
                  <Twitter className="h-6 w-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-medium text-gray-900">No Twitter data available</h3>
                  <p className="text-gray-500 mt-1 text-sm">
                    Click "Fetch New Tweets" to get the latest disaster-related tweets
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}
