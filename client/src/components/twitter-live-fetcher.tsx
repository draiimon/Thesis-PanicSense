import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Twitter, 
  Play, 
  Square, 
  Loader2, 
  Activity, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Database,
  MessageSquare,
  Clock,
  TrendingUp
} from "lucide-react";

interface TwitterPost {
  id: string;
  text: string;
  timestamp: string;
  author?: string;
  url?: string;
  sentiment: string;
  confidence: number;
  language: string;
  location?: string;
  disasterType?: string;
  source: string;
}

interface TwitterFetchResponse {
  success: boolean;
  data: TwitterPost[];
  cached?: boolean;
  stored?: number;
  message?: string;
  timestamp: string;
}

export function TwitterLiveFetcher({ onDataUpdate }: { onDataUpdate?: () => void }) {
  const { toast } = useToast();
  
  // State management
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchInterval, setFetchInterval] = useState(300); // 5 minutes default
  const [limit, setLimit] = useState(15);
  const [status, setStatus] = useState<'idle' | 'fetching' | 'processing' | 'storing' | 'success' | 'error'>('idle');
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    totalFetched: 0,
    totalStored: 0,
    lastBatchSize: 0,
    activeSessions: 0
  });
  const [currentBatch, setCurrentBatch] = useState<TwitterPost[]>([]);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  // Fetch Twitter data with streaming
  const fetchTwitterData = async (autoStore: boolean = true) => {
    try {
      setIsLoading(true);
      setStatus('fetching');
      setCurrentBatch([]); // Clear previous batch
      
      const streamUrl = `/api/twitter/stream?limit=${limit}`;
      const eventSource = new EventSource(streamUrl);
      
      let processedCount = 0;
      let totalCount = 0;
      let streamedTweets: TwitterPost[] = [];

      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'status':
              setStatus('fetching');
              totalCount = data.total || limit;
              break;
              
            case 'progress':
              setStatus('processing');
              processedCount = data.current || 0;
              // Update stats in real-time
              setStats(prev => ({
                ...prev,
                lastBatchSize: processedCount
              }));
              break;
              
            case 'tweet':
              // Add tweet to batch immediately
              const tweet = data.data;
              streamedTweets.push(tweet);
              setCurrentBatch([...streamedTweets]); // Update state with new array
              
              // Update stats with actual count
              setStats(prev => ({
                ...prev,
                totalFetched: prev.totalFetched + 1,
                totalStored: prev.totalStored + 1,
                lastBatchSize: streamedTweets.length
              }));
              break;
              
            case 'done':
              setStatus('success');
              setLastFetch(new Date());
              
              toast({
                title: "Twitter Data Fetched",
                description: `Successfully fetched and stored ${data.stored || streamedTweets.length} tweets`,
                variant: "default"
              });
              
              // Trigger data refresh if callback provided
              if (onDataUpdate) {
                onDataUpdate();
              }
              
              eventSource.close();
              setIsLoading(false);
              
              // Reset status after 3 seconds
              setTimeout(() => {
                setStatus('idle');
              }, 3000);
              break;
              
            case 'error':
              console.error('Stream error:', data.message);
              if (streamedTweets.length === 0) {
                // Only show error if we haven't received any tweets
                throw new Error(data.message || 'Failed to fetch Twitter data');
              }
              break;
          }
        } catch (parseError) {
          console.error('Error parsing stream data:', parseError);
        }
      });

      eventSource.addEventListener('error', (error) => {
        console.error('EventSource error:', error);
        eventSource.close();
        
        if (streamedTweets.length === 0) {
          setStatus('error');
          toast({
            title: "Twitter Fetch Failed",
            description: "Failed to connect to Twitter stream",
            variant: "destructive"
          });
        }
        
        setIsLoading(false);
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      });

    } catch (error) {
      console.error('Error fetching Twitter data:', error);
      setStatus('error');
      toast({
        title: "Twitter Fetch Failed",
        description: error instanceof Error ? error.message : "Failed to fetch Twitter data",
        variant: "destructive"
      });
      setIsLoading(false);
      
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    }
  };

  // Start live fetching
  const startLiveFetching = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }

    setIsActive(true);
    
    // Immediate first fetch
    fetchTwitterData(true);
    
    // Set up interval for continuous fetching
    const newIntervalId = setInterval(() => {
      fetchTwitterData(true);
    }, fetchInterval * 1000);
    
    setIntervalId(newIntervalId);

    toast({
      title: "Live Twitter Fetching Started",
      description: `Fetching ${limit} tweets every ${fetchInterval} seconds`,
      variant: "default"
    });
  };

  // Stop live fetching
  const stopLiveFetching = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    setIsActive(false);
    setStatus('idle');
    
    toast({
      title: "Live Twitter Fetching Stopped",
      description: "Automatic data collection has been stopped",
      variant: "default"
    });
  };

  // Get status color and icon
  const getStatusInfo = () => {
    switch (status) {
      case 'fetching':
        return { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Activity, text: 'Fetching tweets...' };
      case 'processing':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Loader2, text: 'Processing data...' };
      case 'storing':
        return { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Database, text: 'Storing in database...' };
      case 'success':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Successfully completed' };
      case 'error':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertCircle, text: 'Error occurred' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: Twitter, text: 'Ready to fetch' };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className="border-none shadow-2xl rounded-3xl bg-white overflow-hidden">
      <CardHeader className="p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 border-b-4 border-blue-400/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl font-extrabold text-white drop-shadow-lg">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Twitter className="h-6 w-6 text-white" />
              </div>
              Twitter Live Data Fetcher
            </CardTitle>
            <CardDescription className="text-blue-100 mt-2 text-sm">
              Real-time disaster tweet monitoring and sentiment analysis
            </CardDescription>
          </div>
          <motion.div
            animate={{ 
              scale: isActive ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 2,
              repeat: isActive ? Infinity : 0,
              ease: "easeInOut"
            }}
            className={`px-4 py-2 rounded-full font-bold text-sm ${
              isActive 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/50' 
                : 'bg-gray-500/20 text-white'
            }`}
          >
            {isActive ? '● LIVE' : '○ OFFLINE'}
          </motion.div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6 bg-gradient-to-b from-white to-blue-50/30">
        {/* Status Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200/50 shadow-md"
        >
          <div className="flex items-center gap-4">
            <motion.div 
              animate={{ 
                rotate: status === 'fetching' || status === 'processing' ? 360 : 0 
              }}
              transition={{ 
                duration: 2, 
                repeat: status === 'fetching' || status === 'processing' ? Infinity : 0,
                ease: "linear" 
              }}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg"
            >
              <StatusIcon className={`h-6 w-6 text-white`} />
            </motion.div>
            <div>
              <p className="font-bold text-gray-900 text-lg">
                {isActive ? '🔴 Live Fetching Active' : '⚪ Standby Mode'}
              </p>
              <p className="text-sm text-gray-600 font-medium">{statusInfo.text}</p>
            </div>
          </div>
          
          <Badge className={`${statusInfo.color} font-bold px-4 py-2 text-sm shadow-md border-2`}>
            {status.toUpperCase()}
          </Badge>
        </motion.div>

        {/* Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-3 p-4 rounded-2xl bg-white border-2 border-blue-100 shadow-sm"
          >
            <Label htmlFor="fetch-limit" className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-600" />
              Tweets Per Fetch
            </Label>
            <Input
              id="fetch-limit"
              type="number"
              min="5"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 15)}
              disabled={isActive}
              className="bg-white border-2 border-blue-200 rounded-xl text-lg font-semibold focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            <p className="text-xs text-gray-600 font-medium">📊 Limit: 5-50 tweets per fetch</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3 p-4 rounded-2xl bg-white border-2 border-purple-100 shadow-sm"
          >
            <Label htmlFor="fetch-interval" className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              Fetch Interval
            </Label>
            <Input
              id="fetch-interval"
              type="number"
              min="60"
              max="3600"
              value={fetchInterval}
              onChange={(e) => setFetchInterval(parseInt(e.target.value) || 300)}
              disabled={isActive}
              className="bg-white border-2 border-purple-200 rounded-xl text-lg font-semibold focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
            <p className="text-xs text-gray-600 font-medium">⏱️ Interval: {fetchInterval}s ({Math.floor(fetchInterval/60)}min)</p>
          </motion.div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-4">
          {!isActive ? (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={startLiveFetching}
                disabled={isLoading}
                className="flex items-center gap-3 bg-gradient-to-r from-green-500 via-emerald-600 to-green-600 hover:from-green-600 hover:via-emerald-700 hover:to-green-700 text-white shadow-xl shadow-green-500/40 rounded-2xl px-8 py-6 text-base font-bold"
              >
                <Play className="h-5 w-5" />
                Start Live Fetching
              </Button>
            </motion.div>
          ) : (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={stopLiveFetching}
                variant="destructive"
                className="flex items-center gap-3 bg-gradient-to-r from-red-500 via-rose-600 to-red-600 hover:from-red-600 hover:via-rose-700 hover:to-red-700 shadow-xl shadow-red-500/40 rounded-2xl px-8 py-6 text-base font-bold"
              >
                <Square className="h-5 w-5" />
                Stop Live Fetching
              </Button>
            </motion.div>
          )}
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => fetchTwitterData(false)}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-3 border-3 border-blue-400 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-500 rounded-2xl px-6 py-6 text-base font-bold shadow-lg"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              Fetch Once
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => fetchTwitterData(true)}
              disabled={isLoading}
              variant="outline"
              className="flex items-center gap-3 border-3 border-purple-400 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:border-purple-500 rounded-2xl px-6 py-6 text-base font-bold shadow-lg"
            >
              <Database className="h-5 w-5" />
              Fetch & Store
            </Button>
          </motion.div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-white" />
              <p className="text-sm font-bold text-white/90">Total Fetched</p>
            </div>
            <p className="text-3xl font-extrabold text-white">{stats.totalFetched}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-5 w-5 text-white" />
              <p className="text-sm font-bold text-white/90">Total Stored</p>
            </div>
            <p className="text-3xl font-extrabold text-white">{stats.totalStored}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-purple-500 to-violet-600 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-5 w-5 text-white" />
              <p className="text-sm font-bold text-white/90">Last Batch</p>
            </div>
            <p className="text-3xl font-extrabold text-white">{stats.lastBatchSize}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-600 to-gray-700 p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-white" />
              <p className="text-sm font-bold text-white/90">Last Fetch</p>
            </div>
            <p className="text-sm font-extrabold text-white">
              {lastFetch ? lastFetch.toLocaleTimeString() : 'Never'}
            </p>
          </motion.div>
        </div>

        {/* Loading animation when fetching */}
        <AnimatePresence>
          {isLoading && currentBatch.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center py-12 space-y-4"
            >
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                <Twitter className="absolute inset-0 m-auto h-8 w-8 text-blue-600 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 animate-pulse">
                  {status === 'fetching' ? 'Fetching tweets from Philippines...' :
                   status === 'processing' ? `Analyzing tweets... (${stats.lastBatchSize} found)` :
                   'Loading...'}
                </p>
                <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Batch Preview - Streaming Display */}
        <AnimatePresence mode="popLayout">
          {currentBatch.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Streaming Results
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-bold"
                  >
                    {currentBatch.length}
                  </motion.span>
                </h4>
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 animate-pulse">
                    <Activity className="h-3 w-3 animate-spin" />
                    <span>Live</span>
                  </div>
                )}
              </div>
              
              <div className="max-h-80 overflow-y-auto space-y-3 bg-gradient-to-b from-blue-50 via-purple-50/30 to-white p-5 rounded-2xl border-2 border-blue-300 shadow-inner">
                {currentBatch.map((tweet, index) => (
                  <motion.div
                    key={tweet.id}
                    initial={{ opacity: 0, x: -50, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ 
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      delay: 0
                    }}
                    className="p-4 bg-white rounded-2xl border-2 border-blue-200 shadow-lg hover:shadow-2xl transition-all hover:border-blue-400 hover:scale-[1.02]"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <p className="text-sm text-gray-900 line-clamp-3 flex-1 leading-relaxed font-medium">
                        {tweet.text}
                      </p>
                      <Badge 
                        className={`text-xs px-3 py-1.5 font-bold shadow-lg border-2 ${
                          tweet.sentiment?.toLowerCase().includes('panic') ? 'bg-red-500 text-white border-red-700' :
                          tweet.sentiment?.toLowerCase().includes('fear') || tweet.sentiment?.toLowerCase().includes('anxiety') ? 'bg-orange-500 text-white border-orange-700' :
                          tweet.sentiment?.toLowerCase().includes('positive') || tweet.sentiment?.toLowerCase().includes('resilience') ? 'bg-green-500 text-white border-green-700' :
                          'bg-blue-500 text-white border-blue-700'
                        }`}
                      >
                        {tweet.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600 mt-3 flex-wrap">
                      <span className="font-bold px-2 py-1 bg-gray-100 rounded-lg">@{tweet.author}</span>
                      {tweet.language && <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-lg font-semibold">{tweet.language}</span>}
                      {tweet.location && <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg font-semibold">📍 {tweet.location}</span>}
                      {tweet.disasterType && <span className="px-2 py-1 bg-red-100 text-red-800 rounded-lg font-semibold">🚨 {tweet.disasterType}</span>}
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg font-bold">{(tweet.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}