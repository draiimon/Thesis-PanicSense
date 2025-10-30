import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MessageSquare, Clock, MapPin, Zap, Languages, Activity, ExternalLink, AlertTriangle, Heart, Frown, Meh, Smile, RefreshCw } from 'lucide-react';
import { getSentimentBadgeClasses } from "@/lib/colors";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RealtimePost {
  id: number;
  text: string;
  timestamp: string;
  source: string;
  sourceUrl?: string;
  location?: string;
  disasterType?: string;
  sentiment: string;
  confidence: number;
  language: string;
  emotion?: string;
  sentimentCategory?: string;
}

function extractAndFormatLinks(text: string): { cleanText: string; links: string[] } {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const links = text.match(urlRegex) || [];
  const cleanText = text.replace(urlRegex, '').trim();

  return { cleanText, links };
}

const PostCard = ({ post, index }: { post: RealtimePost; index: number }) => {
  const { cleanText, links } = extractAndFormatLinks(post.text);

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "panic": return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case "fear/anxiety": return <Frown className="w-5 h-5 text-orange-600" />;
      case "disbelief": return <Meh className="w-5 h-5 text-yellow-600" />;
      case "resilience": return <Heart className="w-5 h-5 text-green-600" />;
      case "positive": return <Smile className="w-5 h-5 text-green-500" />;
      case "negative": return <Frown className="w-5 h-5 text-red-500" />;
      case "very positive": return <Heart className="w-5 h-5 text-green-700" />;
      case "very negative": return <AlertTriangle className="w-5 h-5 text-red-700" />;
      case "neutral": return <Meh className="w-5 h-5 text-gray-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-400" />;
    }
  };

  const getBorderColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "panic": return "border-l-red-500";
      case "fear/anxiety": return "border-l-orange-500";
      case "disbelief": return "border-l-yellow-500";
      case "resilience": return "border-l-green-500";
      case "positive": return "border-l-green-400";
      case "negative": return "border-l-red-400";
      case "very positive": return "border-l-green-600";
      case "very negative": return "border-l-red-600";
      case "neutral": return "border-l-gray-400";
      default: return "border-l-blue-500";
    }
  };

  const getBackgroundGradient = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case "panic": return "from-red-50 to-red-100";
      case "fear/anxiety": return "from-orange-50 to-orange-100";
      case "disbelief": return "from-yellow-50 to-yellow-100";
      case "resilience": return "from-green-50 to-green-100";
      case "positive": return "from-green-50 to-green-100";
      case "negative": return "from-red-50 to-red-100";
      case "very positive": return "from-green-100 to-green-200";
      case "very negative": return "from-red-100 to-red-200";
      case "neutral": return "from-gray-50 to-gray-100";
      default: return "from-blue-50 to-blue-100";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className="mb-4"
    >
      <Card className={`shadow-md hover:shadow-lg transition-all duration-200 border-l-4 ${getBorderColor(post.sentiment)} bg-white`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center">
              {getSentimentIcon(post.sentiment)}
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={`${getSentimentBadgeClasses(post.sentiment)} shadow-sm`}>
                  {post.sentiment}
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                  {(post.confidence * 100).toFixed(1)}% confidence
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300">
                  <Languages className="inline w-3 h-3 mr-1" />
                  {post.language === 'tl' ? 'Filipino' : post.language === 'en' ? 'English' : post.language}
                </Badge>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-200">
                <p className="text-sm text-gray-800 leading-relaxed">
                  {cleanText || post.text}
                </p>
              </div>

              {(links.length > 0 || post.sourceUrl) && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Link:
                  </h4>
                  <div className="space-y-1">
                    {links.map((link, linkIndex) => (
                      <a
                        key={linkIndex}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:text-blue-800 hover:underline break-all bg-blue-50 rounded px-2 py-1 border border-blue-200 transition-colors"
                      >
                        {link}
                      </a>
                    ))}
                    {post.sourceUrl && !links.includes(post.sourceUrl) && (
                      <a
                        href={post.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:text-blue-800 hover:underline break-all bg-blue-50 rounded px-2 py-1 border border-blue-200 transition-colors"
                      >
                        {post.sourceUrl}
                      </a>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1 text-gray-600 bg-gray-50 rounded px-2 py-1 border border-gray-200">
                  <Clock className="w-3 h-3" />
                  <span className="truncate">{format(new Date(post.timestamp), 'MMM d, h:mm a')}</span>
                </div>
                <div className="flex items-center gap-1 text-gray-600 bg-gray-50 rounded px-2 py-1 border border-gray-200">
                  <MessageSquare className="w-3 h-3" />
                  <span className="truncate">{post.source}</span>
                </div>
                {post.location && (
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-50 rounded px-2 py-1 border border-gray-200">
                    <MapPin className="w-3 h-3" />
                    <span className="truncate">{post.location}</span>
                  </div>
                )}
                {post.disasterType && post.disasterType !== 'Not Specified' && post.disasterType !== 'UNKNOWN' && (
                  <div className="flex items-center gap-1 text-gray-600 bg-gray-50 rounded px-2 py-1 border border-gray-200">
                    <Zap className="w-3 h-3" />
                    <span className="truncate">{post.disasterType}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function RealtimePostsFeed() {
  const queryClient = useQueryClient();
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['/api/sentiment-posts'],
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
    staleTime: 5000,
  });

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2 text-blue-600" />
            <span className="text-blue-700 font-medium">Loading real-time posts...</span>
          </div>
        </Card>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-8 bg-gradient-to-br from-red-50 to-rose-50 border border-red-200">
          <div className="text-center text-red-600">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="font-medium mb-2">Error loading posts</p>
            <p className="text-sm">Please try again later.</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  const realtimePosts = Array.isArray(posts) ? (posts as RealtimePost[]).slice(0, 20) : [];

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white shadow-xl border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl mb-2">
                  <Activity className="w-6 h-6" />
                  Real-Time Posts Feed
                </CardTitle>
                <p className="text-blue-100 text-sm">
                  Latest analyzed posts with complete metadata: Timestamp, Source, Link, Location, Disaster, Emotion, Sentiment, Confidence, Language
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/sentiment-posts'] })}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 transition-all duration-200"
                  size="sm"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {realtimePosts.length === 0 ? (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-dashed border-slate-300">
              <div className="text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium mb-2">No real-time posts available yet</p>
                <p className="text-sm">Start analyzing some text to see posts here!</p>
              </div>
            </Card>
          </motion.div>
        ) : (
          realtimePosts.map((post, index) => (
            <PostCard key={`post-${post.id}`} post={post} index={index} />
          ))
        )}
      </motion.div>

      <motion.div
        className="text-center text-xs text-gray-500 py-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Activity className="inline w-3 h-3 mr-1 animate-pulse" />
        Auto-refreshing every 10 seconds
      </motion.div>
    </motion.div>
  );
}
