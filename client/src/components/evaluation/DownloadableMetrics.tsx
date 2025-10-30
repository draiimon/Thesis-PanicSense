import React, { useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { 
  Download,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  RefreshCw,
  FileDown,
  FileText,
  PanelTop
} from "lucide-react";
import { ChartConfig } from "@/lib/chart-config";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface DownloadableMetricsProps {
  data: any[];
  metrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
  title?: string;
  description?: string;
}

export const DownloadableMetrics: React.FC<DownloadableMetricsProps> = ({ 
  data,
  metrics,
  title = "Performance Metrics",
  description = "Downloadable metrics in matplotlib style"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Get sentiment distribution
  const getSentimentCounts = () => {
    if (!Array.isArray(data)) return {};
    
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
    
    return counts;
  };

  // Get language distribution
  const getLanguageCounts = () => {
    if (!Array.isArray(data)) return {};
    
    const counts: Record<string, number> = {};
    
    data.forEach(item => {
      if (item.language) {
        const lang = item.language;
        counts[lang] = (counts[lang] || 0) + 1;
      }
    });
    
    return counts;
  };

  // Generate matplotlib-style plots
  const generatePlots = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    
    if (!canvas || !container) return;
    
    setIsGenerating(true);
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }
    
    // Set canvas dimensions
    canvas.width = 800;
    canvas.height = 1200;
    
    // Fill background with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw title and description
    drawHeader(ctx, canvas);
    
    // Draw the charts
    drawMetricsBar(ctx, 100, 200, canvas);
    drawSentimentPie(ctx, 100, 500, canvas);
    drawLanguageBar(ctx, 100, 800, canvas);
    
    // Add watermark
    drawWatermark(ctx, canvas);
    
    setIsGenerating(false);
  };

  // Draw header with title and timestamp
  const drawHeader = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Title
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, 40);
    
    // Subtitle
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.fillText(description, canvas.width / 2, 65);
    
    // Timestamp
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#999999';
    ctx.fillText(`Generated on ${format(new Date(), 'PPP')} at ${format(new Date(), 'pp')}`, canvas.width / 2, 90);
    
    // Draw separator line
    ctx.strokeStyle = '#dddddd';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(50, 110);
    ctx.lineTo(canvas.width - 50, 110);
    ctx.stroke();
  };

  // Draw performance metrics bar chart
  const drawMetricsBar = (ctx: CanvasRenderingContext2D, x: number, y: number, canvas: HTMLCanvasElement) => {
    const metricValues = {
      Accuracy: metrics?.accuracy || 0,
      Precision: metrics?.precision || 0,
      Recall: metrics?.recall || 0,
      F1: metrics?.f1Score || 0
    };
    
    // Section title
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.fillText('Performance Metrics', x, y - 30);
    
    // Draw axis
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 160);  // Y-axis (vertical)
    ctx.moveTo(x, y);
    ctx.lineTo(x + 500, y);  // X-axis (horizontal)
    ctx.stroke();
    
    // Draw metrics
    const barWidth = 80;
    const barSpacing = 40;
    let xPos = x + 40;
    
    Object.entries(metricValues).forEach(([name, value], index) => {
      const barHeight = value * 150;  // Scale bars (metrics are 0-1)
      const barColor = getColorForMetric(index);
      
      // Draw bar
      ctx.fillStyle = barColor;
      ctx.fillRect(xPos, y - barHeight, barWidth, barHeight);
      
      // Draw border
      ctx.strokeStyle = darkenColor(barColor, 0.2);
      ctx.lineWidth = 1;
      ctx.strokeRect(xPos, y - barHeight, barWidth, barHeight);
      
      // Draw label
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'center';
      ctx.fillText(name, xPos + barWidth/2, y + 15);
      
      // Draw value
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText((value * 100).toFixed(1) + '%', xPos + barWidth/2, y - barHeight - 10);
      
      xPos += barWidth + barSpacing;
    });
    
    // Draw Y-axis labels
    ctx.font = '10px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'right';
    
    for (let i = 0; i <= 100; i += 20) {
      const yPos = y - (i / 100) * 150;
      ctx.fillText(`${i}%`, x - 5, yPos + 3);
      
      // Draw grid line
      ctx.strokeStyle = '#eeeeee';
      ctx.beginPath();
      ctx.moveTo(x, yPos);
      ctx.lineTo(x + 500, yPos);
      ctx.stroke();
    }
  };

  // Draw sentiment distribution pie chart
  const drawSentimentPie = (ctx: CanvasRenderingContext2D, x: number, y: number, canvas: HTMLCanvasElement) => {
    const sentimentCounts = getSentimentCounts();
    const total = Object.values(sentimentCounts).reduce((sum, val) => sum + val, 0) || 1;
    
    // Section title
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.fillText('Sentiment Distribution', x, y - 110);
    
    // Draw pie chart
    const centerX = x + 150;
    const centerY = y;
    const radius = 100;
    
    let startAngle = 0;
    
    // Sentiment colors
    const colors = {
      "Panic": ChartConfig.colors.red,
      "Fear/Anxiety": ChartConfig.colors.orange,
      "Disbelief": ChartConfig.colors.yellow,
      "Neutral": ChartConfig.colors.blue,
      "Resilience": ChartConfig.colors.green
    };
    
    // Draw slices
    Object.entries(sentimentCounts).forEach(([sentiment, count], index) => {
      const percentage = count / total;
      const endAngle = startAngle + (percentage * 2 * Math.PI);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      ctx.fillStyle = colors[sentiment as keyof typeof colors] || '#cccccc';
      ctx.fill();
      
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
      
      startAngle = endAngle;
    });
    
    // Draw legend
    const legendX = centerX + 120;
    const legendY = y - 80;
    
    Object.entries(sentimentCounts).forEach(([sentiment, count], index) => {
      const percentage = (count / total * 100).toFixed(1);
      const yOffset = index * 30;
      
      // Color box
      ctx.fillStyle = colors[sentiment as keyof typeof colors] || '#cccccc';
      ctx.fillRect(legendX, legendY + yOffset, 15, 15);
      
      // Label
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText(`${sentiment}: ${count} (${percentage}%)`, legendX + 25, legendY + yOffset + 12);
    });
  };

  // Draw language distribution bar chart
  const drawLanguageBar = (ctx: CanvasRenderingContext2D, x: number, y: number, canvas: HTMLCanvasElement) => {
    const languageCounts = getLanguageCounts();
    const total = Object.values(languageCounts).reduce((sum, val) => sum + val, 0) || 1;
    
    // Sort languages by count
    const sortedLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);  // Show top 6 languages
    
    // Section title
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillStyle = '#333333';
    ctx.textAlign = 'left';
    ctx.fillText('Language Distribution', x, y - 30);
    
    // Draw axis
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 160);  // Y-axis
    ctx.moveTo(x, y);
    ctx.lineTo(x + 500, y);  // X-axis
    ctx.stroke();
    
    // Draw bars
    const barHeight = 35;
    const barSpacing = 15;
    let yPos = y - 150;
    
    const languageColors = [
      ChartConfig.colors.blue,
      ChartConfig.colors.indigo as string,
      ChartConfig.colors.violet,
      ChartConfig.colors.green,
      ChartConfig.colors.cyan as string,
      ChartConfig.colors.pink
    ];
    
    sortedLanguages.forEach(([language, count], index) => {
      const percentage = count / total;
      const barWidth = percentage * 400;
      
      // Draw bar
      ctx.fillStyle = languageColors[index] || '#cccccc';
      ctx.fillRect(x, yPos, barWidth, barHeight);
      
      // Draw border
      ctx.strokeStyle = darkenColor(languageColors[index] || '#cccccc', 0.2);
      ctx.lineWidth = 1;
      ctx.strokeRect(x, yPos, barWidth, barHeight);
      
      // Draw label
      ctx.font = '12px Arial, sans-serif';
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.fillText(language, x + barWidth + 10, yPos + barHeight / 2 + 4);
      
      // Draw value
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'right';
      if (barWidth > 40) {
        ctx.fillText(`${count} (${(percentage * 100).toFixed(1)}%)`, x + barWidth - 10, yPos + barHeight / 2 + 4);
      } else {
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'left';
        ctx.fillText(`${count} (${(percentage * 100).toFixed(1)}%)`, x + barWidth + 80, yPos + barHeight / 2 + 4);
      }
      
      yPos += barHeight + barSpacing;
    });
  };

  // Draw watermark
  const drawWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.font = 'italic 12px Arial, sans-serif';
    ctx.fillStyle = 'rgba(150, 150, 150, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('Generated by PanicSense', canvas.width / 2, canvas.height - 20);
  };

  // Helper to get color for metrics
  const getColorForMetric = (index: number): string => {
    const colors = [
      '#4c78a8',  // blue
      '#72b7b2',  // teal
      '#54a24b',  // green
      '#e45756',  // red
    ];
    return colors[index % colors.length];
  };

  // Helper to darken color for borders
  const darkenColor = (color: string, amount: number): string => {
    return color;  // Simplified for now
  };

  // Handle download button click
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = 'PanicSense-Metrics.png';
    link.href = canvasRef.current.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate PDF report with detailed metrics
  const handleGeneratePDF = () => {
    // This will be implemented later with a PDF generation library
    alert('PDF report generation will be available in a future update');
  };

  // Generate plots on data change
  useEffect(() => {
    generatePlots();
  }, [data, metrics]);

  return (
    <Card className="h-full overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PanelTop className="h-5 w-5 text-indigo-500" />
            <CardTitle className="text-base font-medium">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={generatePlots} 
              className="h-8 px-2"
              title="Regenerate plots"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload} 
              className="h-8"
              title="Download as image"
            >
              <Download className="h-4 w-4 mr-1" />
              Save Image
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleGeneratePDF}
              className="h-8"
              title="Generate PDF report"
            >
              <FileText className="h-4 w-4 mr-1" />
              Report
            </Button>
          </div>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </CardHeader>
      <CardContent className="p-0">
        <div 
          ref={containerRef} 
          className="relative w-full h-[420px] flex items-center justify-center overflow-hidden"
        >
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="h-8 w-8 animate-spin mb-2" />
              <p>Generating metrics...</p>
            </div>
          ) : (
            <div className="w-full h-full overflow-auto bg-slate-50 rounded-md flex justify-center">
              <canvas 
                ref={canvasRef} 
                className="max-w-full object-contain"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};