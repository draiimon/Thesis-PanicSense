import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  LabelList,
  CartesianGrid
} from "recharts";
import { ChartConfig } from "@/lib/chart-config";
import { 
  BarChart4, 
  Sparkles,
  PieChart
} from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface SentimentLabelCountProps {
  data: any[];
  title?: string;
  description?: string;
}

export const SentimentLabelCount: React.FC<SentimentLabelCountProps> = ({
  data,
  title = "Sentiment Distribution",
  description = "Distribution of sentiment labels across the dataset"
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeTab, setActiveTab] = useState("emotions");

  // Emotions distribution
  const emotionCounts = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    const counts: Record<string, number> = {
      "Panic": 0, 
      "Fear/Anxiety": 0, 
      "Disbelief": 0, 
      "Neutral": 0, 
      "Resilience": 0
    };
    
    data.forEach(item => {
      if (item.sentiment && counts[item.sentiment] !== undefined) {
        counts[item.sentiment] += 1;
      }
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ 
        name, 
        value,
        // Calculate percentage for visual display
        percentage: data.length ? Math.round((value / data.length) * 100) : 0
      }));
  }, [data]);
  
  // Sentiment (positive/negative/neutral) distribution
  const sentimentCounts = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    const counts: Record<string, number> = {
      "Positive": 0, 
      "Negative": 0, 
      "Neutral": 0
    };
    
    data.forEach(item => {
      if (item.sentiment) {
        // Map emotions to sentiment categories
        if (item.sentiment === "Resilience") {
          counts["Positive"] += 1;
        } else if (item.sentiment === "Neutral") {
          counts["Neutral"] += 1;
        } else if (item.sentiment === "Panic") {
          counts["Negative"] += 1;
        } else if (item.sentiment === "Fear/Anxiety" || item.sentiment === "Disbelief") {
          // These depend on context, but for simplicity we're categorizing them as negative
          // In a production system, we would use more advanced contextual analysis
          counts["Negative"] += 1;
        }
      }
    });
    
    return Object.entries(counts)
      .map(([name, value]) => ({ 
        name, 
        value,
        // Calculate percentage for visual display
        percentage: data.length ? Math.round((value / data.length) * 100) : 0
      }));
  }, [data]);

  // Enhanced colors for each emotion category with a gradient effect
  const emotionColors = {
    "Panic": 'url(#panicGradient)',
    "Fear/Anxiety": 'url(#anxietyGradient)',
    "Disbelief": 'url(#disbeliefGradient)',
    "Neutral": 'url(#neutralGradient)',
    "Resilience": 'url(#resilienceGradient)'
  };

  // Solid colors for emotions
  const emotionSolidColors = {
    "Panic": "#ef4444", // Red
    "Fear/Anxiety": "#f97316", // Orange
    "Disbelief": "#8b5cf6", // Purple
    "Neutral": "#6b7280", // Gray
    "Resilience": "#22c55e" // Green
  };
  
  // Colors for sentiment categories (positive/negative/neutral)
  const sentimentCategoryColors = {
    "Positive": 'url(#positiveGradient)',
    "Negative": 'url(#negativeGradient)',
    "Neutral": 'url(#neutralGradient)'
  };
  
  // Solid colors for sentiment categories
  const sentimentCategorySolidColors = {
    "Positive": "#22c55e", // Green
    "Negative": "#ef4444", // Red
    "Neutral": "#6b7280"  // Gray
  };

  // No emoji icons, just using text labels
  const emotionEmojis = {
    "Panic": "",
    "Fear/Anxiety": "", 
    "Disbelief": "",
    "Neutral": "",
    "Resilience": ""
  };
  
  const sentimentCategoryEmojis = {
    "Positive": "",
    "Negative": "",
    "Neutral": ""
  };

  // Get total records for each view
  const totalEmotionRecords = emotionCounts.reduce((sum, item) => sum + item.value, 0);
  const totalSentimentRecords = sentimentCounts.reduce((sum, item) => sum + item.value, 0);

  // Enhanced tooltip with animation - for both emotions and sentiments
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      // Determine which data we're working with based on the active tab
      const totalRecordsForTab = activeTab === "emotions" ? totalEmotionRecords : totalSentimentRecords;
      
      // Get the appropriate colors based on whether we're showing emotions or sentiments
      let backgroundColor = "#6b7280"; // Default gray
      
      if (activeTab === "emotions") {
        // Emotion colors
        if (data.name === "Panic") backgroundColor = emotionSolidColors["Panic"];
        else if (data.name === "Fear/Anxiety") backgroundColor = emotionSolidColors["Fear/Anxiety"];
        else if (data.name === "Disbelief") backgroundColor = emotionSolidColors["Disbelief"];
        else if (data.name === "Neutral") backgroundColor = emotionSolidColors["Neutral"];
        else if (data.name === "Resilience") backgroundColor = emotionSolidColors["Resilience"];
      } else {
        // Sentiment colors (positive/negative/neutral)
        if (data.name === "Positive") backgroundColor = sentimentCategorySolidColors["Positive"];
        else if (data.name === "Negative") backgroundColor = sentimentCategorySolidColors["Negative"];
        else if (data.name === "Neutral") backgroundColor = sentimentCategorySolidColors["Neutral"];
      }
      
      const percentage = ((data.value / totalRecordsForTab) * 100).toFixed(1);
      
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="custom-tooltip bg-white p-4 border border-slate-200 rounded-md shadow-lg"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <span className="font-medium text-base">{data.name}</span>
          </div>
          <div className="pt-2 space-y-1">
            <p className="text-sm flex justify-between">
              <span className="text-slate-500">Count:</span>
              <span className="font-semibold">{data.value}</span>
            </p>
            <p className="text-sm flex justify-between">
              <span className="text-slate-500">Percentage:</span>
              <span className="font-semibold">{percentage}%</span>
            </p>
          </div>
          <div 
            className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden"
          >
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5 }}
              className="h-full rounded-full"
              style={{ backgroundColor }}
            />
          </div>
        </motion.div>
      );
    }
    return null;
  };

  // Function to trigger animation effect
  const triggerAnimation = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1500);
  };

  // Enhanced rendering of the bar chart with animation and custom styling
  const renderBarChart = () => {
    // Select data based on active tab
    const data = activeTab === "emotions" ? emotionCounts : sentimentCounts;
    
    return (
      <div className="w-full h-[300px] sentiment-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 10, left: 0, bottom: 40 }}
          >
            <defs>
              {/* Define gradients for emotion categories */}
              <linearGradient id="panicGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
              <linearGradient id="anxietyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fb923c" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient id="disbeliefGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
              <linearGradient id="neutralGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9ca3af" />
                <stop offset="100%" stopColor="#4b5563" />
              </linearGradient>
              <linearGradient id="resilienceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>

              {/* Define gradients for sentiment categories */}
              <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
              <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickMargin={10}
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis 
              allowDecimals={false} 
              axisLine={{ stroke: '#e2e8f0' }}
              tickLine={{ stroke: '#e2e8f0' }}
              tick={{ fontSize: 12, fill: '#64748b' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(224, 231, 255, 0.2)' }} />
            <Bar 
              dataKey="value" 
              fill={ChartConfig.colors.primary} 
              radius={[6, 6, 0, 0]}
              animationDuration={isAnimating ? 1500 : 500} 
              animationBegin={0}
              animationEasing="ease-out"
            >
              <LabelList 
                dataKey="value" 
                position="top" 
                fill="#64748b" 
                fontSize={12} 
                fontWeight={600}
                formatter={(value: number) => (value > 0 ? value : '')}
              />
              {data.map((entry, index) => {
                // Determine proper fill and stroke color based on entry name and active tab
                let fillColor = ChartConfig.colors.primary;
                let strokeColor = ChartConfig.colors.primary;
                
                if (activeTab === "emotions") {
                  // Emotion colors
                  if (entry.name === "Panic") {
                    fillColor = 'url(#panicGradient)';
                    strokeColor = emotionSolidColors["Panic"];
                  } else if (entry.name === "Fear/Anxiety") {
                    fillColor = 'url(#anxietyGradient)';
                    strokeColor = emotionSolidColors["Fear/Anxiety"];
                  } else if (entry.name === "Disbelief") {
                    fillColor = 'url(#disbeliefGradient)';
                    strokeColor = emotionSolidColors["Disbelief"];
                  } else if (entry.name === "Neutral") {
                    fillColor = 'url(#neutralGradient)';
                    strokeColor = emotionSolidColors["Neutral"];
                  } else if (entry.name === "Resilience") {
                    fillColor = 'url(#resilienceGradient)';
                    strokeColor = emotionSolidColors["Resilience"];
                  }
                } else {
                  // Sentiment colors
                  if (entry.name === "Positive") {
                    fillColor = 'url(#positiveGradient)';
                    strokeColor = sentimentCategorySolidColors["Positive"];
                  } else if (entry.name === "Negative") {
                    fillColor = 'url(#negativeGradient)';
                    strokeColor = sentimentCategorySolidColors["Negative"];
                  } else if (entry.name === "Neutral") {
                    fillColor = 'url(#neutralGradient)';
                    strokeColor = sentimentCategorySolidColors["Neutral"];
                  }
                }
                
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={fillColor} 
                    stroke={strokeColor}
                    strokeWidth={1}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Render visual indicator with enhanced styling for each category
  const renderCategoryLegend = () => {
    // Select data based on active tab
    const data = activeTab === "emotions" ? emotionCounts : sentimentCounts;
    const totalForLegend = activeTab === "emotions" ? totalEmotionRecords : totalSentimentRecords;
    
    return (
      <div className="flex lg:flex-col gap-2 mt-4 lg:mt-0 lg:ml-6 flex-wrap justify-center">
        {data.map((item, index) => {
          const percentage = totalForLegend > 0 ? Math.round((item.value / totalForLegend) * 100) : 0;
          
          // Get the appropriate background color based on the category name
          let backgroundColor = ChartConfig.colors.primary;
          
          if (activeTab === "emotions") {
            // Emotion colors
            if (item.name === "Panic") backgroundColor = emotionSolidColors["Panic"];
            else if (item.name === "Fear/Anxiety") backgroundColor = emotionSolidColors["Fear/Anxiety"];
            else if (item.name === "Disbelief") backgroundColor = emotionSolidColors["Disbelief"];
            else if (item.name === "Neutral") backgroundColor = emotionSolidColors["Neutral"];
            else if (item.name === "Resilience") backgroundColor = emotionSolidColors["Resilience"];
          } else {
            // Sentiment colors (positive/negative/neutral)
            if (item.name === "Positive") backgroundColor = sentimentCategorySolidColors["Positive"];
            else if (item.name === "Negative") backgroundColor = sentimentCategorySolidColors["Negative"];
            else if (item.name === "Neutral") backgroundColor = sentimentCategorySolidColors["Neutral"];
          }
          
          return (
            <motion.div 
              key={item.name} 
              className="flex items-center gap-2 px-4 py-3 rounded-lg bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div 
                className="h-4 w-4 rounded-full" 
                style={{ backgroundColor }}
              />
              <div className="flex flex-col">
                <div className="text-sm font-medium flex items-center gap-1.5">
                  <span>{item.name}</span>
                  <span className="font-bold">({item.value})</span>
                </div>
                <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div 
                    className="h-full" 
                    style={{ backgroundColor }}
                    initial={{ width: 0 }}
                    animate={{ width: isAnimating ? `${percentage}%` : `${percentage}%` }}
                    transition={{ duration: isAnimating ? 1 : 0.5, delay: isAnimating ? index * 0.1 : 0 }}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">{percentage}%</div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  return (
    <Card className="h-full overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart4 className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-2">{description}</p>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="emotions" onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4 grid grid-cols-2">
            <TabsTrigger value="emotions" className="flex items-center gap-2">
              <BarChart4 className="h-4 w-4" />
              <span>Emotions</span>
            </TabsTrigger>
            <TabsTrigger value="sentiments" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              <span>Sentiments</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="emotions">
            <div className="flex flex-col lg:flex-row justify-between">
              {renderBarChart()}
              {renderCategoryLegend()}
            </div>
          </TabsContent>
          
          <TabsContent value="sentiments">
            <div className="flex flex-col lg:flex-row justify-between">
              {renderBarChart()}
              {renderCategoryLegend()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};