import { Badge } from "@/components/ui/badge";
import { getSentimentBadgeClasses } from "@/lib/colors";
import { BrainCircuit, Shield } from "lucide-react";
import { SentimentFeedback } from "@/components/sentiment-feedback";

interface AnalyzedText {
  text: string;
  sentiment: string;
  confidence: number;
  timestamp: Date;
  language: string;
  explanation?: string | null;
  disasterType?: string | null;
  location?: string | null;
  corrected?: boolean;
  aiTrustMessage?: string;
  updatedAt?: string;
}

export function MessageDisplay({ item }: { item: AnalyzedText }) {
  return (
    <div className="relative">
      {/* Show a visual indicator if the sentiment was corrected */}
      {item.corrected && (
        <div className="absolute -left-2 -top-2 h-4 w-4 bg-blue-500 rounded-full flex items-center justify-center z-10">
          <span className="text-[9px] text-white font-bold">✓</span>
        </div>
      )}
      
      <div className="relative flex">
        {/* Emoji Profile Picture */}
        <div className="mr-3 flex-shrink-0">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-3xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200/80 shadow-md">
            {item.sentiment === "Panic" && "😱"}
            {item.sentiment === "Fear/Anxiety" && "😨"}
            {item.sentiment === "Disbelief" && "😳"}
            {item.sentiment === "Resilience" && "💪"}
            {item.sentiment === "Neutral" && "😐"}
          </div>
        </div>
        <div className="flex-grow">
          <div className="p-3 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200/60 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-sm text-slate-900 whitespace-pre-wrap break-words">
                {item.text}
              </p>
              <div className="flex items-center gap-2">
                <Badge className={getSentimentBadgeClasses(item.sentiment)}>
                  {item.sentiment}
                  {item.corrected && (
                    <span className="ml-1 text-xs opacity-70">(✓)</span>
                  )}
                </Badge>
                <Badge variant="outline" className="bg-slate-100">
                  {item.language === "tl" ? "Filipino" : "English"}
                </Badge>
              </div>
            </div>

            <div className="mt-2 flex justify-between items-center text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>Confidence: {(item.confidence * 100).toFixed(1)}%</span>
                <SentimentFeedback 
                  originalText={item.text}
                  originalSentiment={item.sentiment}
                />
              </div>
              <span>{item.timestamp.toLocaleTimeString()}</span>
            </div>

            {item.disasterType && item.disasterType !== "Not Specified" && item.disasterType !== "UNKNOWN" && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {item.disasterType}
                </Badge>
                {item.location && item.location !== "UNKNOWN" && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {item.location}
                  </Badge>
                )}
              </div>
            )}

            {/* Show explanation in quiz-like format if it exists and is meaningful */}
            {item.explanation && !item.explanation.includes("Fallback") && (
              <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 backdrop-blur-sm p-3 rounded-md border border-blue-200/50 mt-2 shadow-sm">
                <div className="flex items-start gap-2">
                  <BrainCircuit className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-1 text-blue-800">Sentiment Analysis</h4>
                    
                    <div className="text-sm text-slate-700 p-2 bg-white/80 rounded border border-blue-100">
                      <span className="text-slate-700">{item.explanation}</span>
                    </div>
                    
                    {/* Show when this was corrected if applicable */}
                    {item.corrected && item.updatedAt && (
                      <div className="mt-1 text-xs text-blue-600 font-medium flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        <span>User-validated sentiment</span>
                        <span className="ml-auto text-blue-500">{new Date(item.updatedAt).toLocaleTimeString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Show AI Trust Message (Validation Message) if it exists */}
            {item.aiTrustMessage && (
              <div className="bg-gradient-to-r from-amber-50/90 to-yellow-50/90 backdrop-blur-sm p-3 rounded-md border border-amber-200/50 mt-2 shadow-sm">
                <div className="flex items-start gap-2">
                  <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="w-full">
                    <h4 className="text-sm font-medium mb-1 text-amber-800">Validation Result</h4>
                    
                    <div className="text-sm text-slate-700 p-2 bg-white/80 rounded border border-amber-100">
                      <span className="text-amber-700 whitespace-pre-line">{item.aiTrustMessage}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}