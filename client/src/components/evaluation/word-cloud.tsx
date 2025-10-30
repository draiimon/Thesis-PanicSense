import React, { useMemo, useRef, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Cloud, Sparkles, RefreshCw, Palette } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";
import { ChartConfig } from "@/lib/chart-config";

interface WordCloudProps {
  data: any[];
  title?: string;
  description?: string;
}

interface WordFrequency {
  text: string;
  value: number;
}

export const WordCloud: React.FC<WordCloudProps> = ({
  data,
  title = "Word Cloud",
  description = "Visual representation of the most frequent words in the dataset"
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [colorScheme, setColorScheme] = useState<string>("vibrant");
  const [animation, setAnimation] = useState<boolean>(false);
  const [colorAngle, setColorAngle] = useState<number>(0);

  // Define color schemes
  const colorSchemes = {
    vibrant: [
      '#4C1D95', // purple-900
      '#7C3AED', // violet-600
      '#8B5CF6', // violet-500
      '#4F46E5', // indigo-600
      '#2563EB', // blue-600
      '#0EA5E9', // sky-500
      '#06B6D4', // cyan-500
      '#059669', // emerald-600
      '#10B981', // emerald-500
      '#F59E0B', // amber-500
      '#DB2777', // pink-600
      '#EC4899', // pink-500
    ],
    pastel: [
      '#C4B5FD', // violet-300
      '#A5B4FC', // indigo-300
      '#93C5FD', // blue-300
      '#7DD3FC', // sky-300
      '#67E8F9', // cyan-300
      '#6EE7B7', // emerald-300
      '#FCD34D', // amber-300
      '#FCA5A5', // red-300
      '#FDBA74', // orange-300
      '#F9A8D4', // pink-300
    ],
    gradient: [
      '#4338CA', // indigo-700
      '#4F46E5', // indigo-600
      '#6366F1', // indigo-500
      '#818CF8', // indigo-400
      '#A5B4FC', // indigo-300
      '#C7D2FE', // indigo-200
      '#F472B6', // pink-400
      '#EC4899', // pink-500
      '#DB2777', // pink-600
      '#BE185D', // pink-700
    ],
    monochrome: [
      '#1E293B', // slate-800
      '#334155', // slate-700
      '#475569', // slate-600
      '#64748B', // slate-500
      '#94A3B8', // slate-400
      '#CBD5E1', // slate-300
      '#E2E8F0', // slate-200
    ]
  };

  // Get the current color array based on selected scheme
  const getCurrentColors = () => {
    return colorSchemes[colorScheme as keyof typeof colorSchemes] || colorSchemes.vibrant;
  };

  // Enhanced stopwords list - including common Filipino stopwords
  const stopwords = useMemo(() => new Set([
    // English stopwords
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 
    'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 
    'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'he', 'her', 
    'here', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 
    'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once', 'only', 'or', 
    'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 's', 'same', 'she', 'should', 'so', 'some', 'such', 
    't', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 
    'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 
    'which', 'while', 'who', 'whom', 'why', 'will', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves',
    // Filipino stopwords
    'ang', 'mga', 'si', 'at', 'ay', 'ng', 'sa', 'na', 'naman', 'hindi', 'ito', 'ko', 'po', 'yung', 'lang', 'para', 
    'siya', 'mo', 'ka', 'kasi', 'din', 'rin', 'pa', 'may', 'ako', 'niya', 'kaniya', 'nila', 'natin', 'namin', 'kayo',
    'nga', 'pero', 'pag', 'kung', 'nung', 'dahil', 'dito', 'doon', 'sana', 'pala', 'ba', 'eh', 'daw', 'raw',
    'wala', 'meron', 'mayroon', 'lahat', 'iyong'
  ]), []);

  const wordFrequencies = useMemo(() => {
    if (!Array.isArray(data)) return [];
    
    // Tokenize and count word frequencies
    const wordCounts: Record<string, number> = {};
    
    data.forEach(item => {
      if (item.text) {
        const words = item.text
          .toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove punctuation
          .split(/\s+/) // Split by whitespace
          .filter((word: string) => word.length > 2 && !stopwords.has(word)); // Filter out stopwords and short words
        
        words.forEach((word: string) => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
      }
    });
    
    // Convert to array and sort by frequency
    return Object.entries(wordCounts)
      .map(([text, value]) => ({ text, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 100); // Limit to top 100 words
  }, [data, stopwords]);

  // Generate a gradient for text
  const generateTextGradient = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, colors: string[]) => {
    const gradient = ctx.createLinearGradient(
      x - width/2, 
      y - height/2, 
      x + width/2, 
      y + height/2
    );
    
    colors.forEach((color, index) => {
      gradient.addColorStop(index / (colors.length - 1), color);
    });
    
    return gradient;
  };

  // Draw the word cloud with optional highlight for hovered word
  const drawWordCloud = (highlightWord?: string) => {
    if (!canvasRef.current || !containerRef.current || wordFrequencies.length === 0) return;
    
    setIsGenerating(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsGenerating(false);
      return;
    }
    
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Create a cloud-like background
    const drawCloudBackground = () => {
      // Create a soft blue sky gradient background
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      
      if (colorScheme === 'vibrant') {
        skyGradient.addColorStop(0, 'rgba(224, 242, 254, 1)'); // sky-100
        skyGradient.addColorStop(1, 'rgba(186, 230, 253, 0.8)'); // sky-200
      } else if (colorScheme === 'pastel') {
        skyGradient.addColorStop(0, 'rgba(240, 249, 255, 1)'); // lighter sky
        skyGradient.addColorStop(1, 'rgba(224, 242, 254, 0.8)'); // sky-100
      } else if (colorScheme === 'gradient') {
        skyGradient.addColorStop(0, 'rgba(239, 246, 255, 1)'); // blue-50
        skyGradient.addColorStop(1, 'rgba(219, 234, 254, 0.8)'); // blue-100
      } else {
        skyGradient.addColorStop(0, 'rgba(248, 250, 252, 1)'); // slate-50
        skyGradient.addColorStop(1, 'rgba(241, 245, 249, 0.8)'); // slate-100
      }
      
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw cloud-like shapes
      const drawCloud = (x: number, y: number, size: number, opacity: number) => {
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // Draw multiple overlapping circles to create cloud shape
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x + size * 0.4, y - size * 0.1, size * 0.6, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.5, y + size * 0.2, size * 0.5, 0, Math.PI * 2);
        ctx.arc(x - size * 0.3, y + size * 0.1, size * 0.4, 0, Math.PI * 2);
        ctx.closePath();
        
        // Add soft shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = size * 0.3;
        ctx.shadowOffsetX = size * 0.05;
        ctx.shadowOffsetY = size * 0.05;
        
        ctx.fill();
        ctx.restore();
      };
      
      // Draw a single large cloud that fills most of the canvas
      // Time-based animation offset using colorAngle as a time factor but make it very slow
      const timeOffset = colorAngle / 1800; // Much slower animation
      
      // Draw one large central cloud
      const size = canvas.width * 0.8; // Large cloud size
      const x = canvas.width / 2;
      const y = canvas.height / 2;
      
      // Very subtle slow movement for the cloud
      const xOffset = Math.sin(timeOffset) * 3;
      const yOffset = Math.cos(timeOffset) * 2;
      
      drawCloud(x + xOffset, y + yOffset, size, 0.8);
      
      // Add a few subtle shading clouds around the edges for depth
      drawCloud(x * 0.5 + xOffset * 0.7, y * 0.6 + yOffset * 0.7, size * 0.5, 0.4);
      drawCloud(x * 1.3 - xOffset * 0.5, y * 0.7 - yOffset * 0.5, size * 0.4, 0.3);
    };
    
    // Draw the cloud background
    drawCloudBackground();
    
    // Settings for text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.1)'; 
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    // Find max frequency to normalize
    const maxFrequency = Math.max(...wordFrequencies.map(w => w.value));
    
    // Draw words
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const COLORS = getCurrentColors();
    
    let placedWords: Array<{
      text: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }> = [];
    
    // Helper to check if a word overlaps with already placed words
    const overlaps = (x: number, y: number, width: number, height: number) => {
      // Add some padding between words
      const padding = 5;
      
      // Check canvas boundaries
      if (x - width/2 - padding < 0 || x + width/2 + padding > canvas.width || 
          y - height/2 - padding < 0 || y + height/2 + padding > canvas.height) {
        return true;
      }
      
      // Check other words
      for (const word of placedWords) {
        if (!(x + width/2 + padding < word.x - word.width/2 - padding || 
              x - width/2 - padding > word.x + word.width/2 + padding || 
              y + height/2 + padding < word.y - word.height/2 - padding || 
              y - height/2 - padding > word.y + word.height/2 + padding)) {
          return true;
        }
      }
      
      return false;
    };
    
    // Special handling for highlighted word if needed
    if (highlightWord) {
      // Add visual enhancement for the highlighted word later in the loop
      canvas.dataset.hovering = 'true';
    }
    
    // Place words using archimedean spiral placement with floating cloud-like animation
    wordFrequencies.forEach((word, idx) => {
      // More nuanced scaling based on frequency
      // This will make the most frequent words larger, with a smoother distribution
      const normalizedValue = word.value / maxFrequency;
      const scaleFactor = 0.6 + Math.pow(normalizedValue, 0.8) * 2.2;
      const fontSize = Math.max(14, Math.min(72, Math.floor(16 * scaleFactor)));
      
      // Apply different font styles based on importance
      let fontStyle = '';
      if (normalizedValue > 0.8) fontStyle = 'bold';
      else if (normalizedValue > 0.5) fontStyle = 'semibold';
      else if (normalizedValue > 0.3) fontStyle = '';
      else fontStyle = '';
      
      ctx.font = `${fontStyle} ${fontSize}px Inter, system-ui, sans-serif`;
      
      // Dynamic color selection based on word importance and color scheme
      let colorIndex;
      if (colorScheme === 'gradient') {
        // For gradient, map the word frequency to a color index
        colorIndex = Math.floor(normalizedValue * (COLORS.length - 1));
      } else {
        // For other schemes, use a rotating pattern with small randomization
        colorIndex = (idx + Math.floor(Math.random() * 2)) % COLORS.length;
      }
      
      // Create a more cloud-like appearance for words
      const addCloudEffect = (x: number, y: number, width: number, height: number) => {
        // Only add cloud effect to more important words
        if (normalizedValue > 0.4) {
          ctx.save();
          
          // Add a soft white glow behind the text to create a cloud-like appearance
          const gradientRadius = Math.max(width, height) * 0.7;
          const glow = ctx.createRadialGradient(
            x, y, 0,
            x, y, gradientRadius
          );
          
          glow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.globalCompositeOperation = 'destination-over';
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, gradientRadius, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
      };
      
      // Apply special effects for important words
      if (normalizedValue > 0.75 && colorScheme === 'vibrant') {
        // Create gradient fill for the most important words
        const gradient = generateTextGradient(
          ctx, 
          centerX, 
          centerY, 
          fontSize * 3, 
          fontSize, 
          [COLORS[colorIndex], COLORS[(colorIndex + 3) % COLORS.length]]
        );
        ctx.fillStyle = gradient;
      } else {
        // Adjust color based on angle for animation
        if (animation && colorScheme !== 'monochrome') {
          const hue = (idx * 30 + colorAngle) % 360;
          // Only for vibrant and gradient schemes
          if (colorScheme === 'vibrant' || colorScheme === 'gradient') {
            ctx.fillStyle = `hsl(${hue}, 85%, 55%)`;
          } else {
            ctx.fillStyle = COLORS[colorIndex];
          }
        } else {
          ctx.fillStyle = COLORS[colorIndex];
        }
      }
      
      // Measure with the word count included
      const textWithCount = `${word.text} (${word.value})`;
      const metrics = ctx.measureText(textWithCount);
      const width = metrics.width;
      const height = fontSize;
      
      // Improved spiral placement with varying starting points
      const a = 8; // Controls how tightly the spiral is wound
      const b = 1; // Factor that expands the spiral outwards
      
      // Use a different angle for each word to space them better initially
      let angle = idx * 0.15 * Math.PI;
      let radius = 0;
      
      // Base position at center
      let x = centerX;
      let y = centerY;
      
      // If overlapping, try different positions with a better spiral algorithm
      let attempts = 0;
      const maxAttempts = 300; // Increase max attempts for better placement
      
      while (overlaps(x, y, width, height) && attempts < maxAttempts) {
        attempts++;
        
        // Archimedean spiral: r = a + b*θ
        angle += 0.1; // Smaller angle increment for smoother spiral
        radius = (a + b * angle) * 5;
        
        x = centerX + Math.cos(angle) * radius;
        y = centerY + Math.sin(angle) * radius;
      }
      
      if (attempts < maxAttempts) {
        // Add much slower floating animation to the words if animation is enabled
        if (animation) {
          // Create very subtle and slow floating movement
          // This creates a very gentle bobbing effect like words floating in clouds
          const floatOffsetX = Math.sin((idx * 0.3 + colorAngle * 0.005)) * (1 + normalizedValue * 1);
          const floatOffsetY = Math.cos((idx * 0.2 + colorAngle * 0.003)) * (0.7 + normalizedValue * 0.8);
          
          x += floatOffsetX;
          y += floatOffsetY;
        }
        
        // Add a cloud-like glow effect behind important words
        addCloudEffect(x, y, width, height);
        
        // Apply a thicker shadow for depth perception
        const originalShadow = ctx.shadowBlur;
        const originalShadowColor = ctx.shadowColor;
        
        // Enhance shadow for key words
        if (normalizedValue > 0.6) {
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 2;
          ctx.shadowOffsetY = 2;
        }
        
        // Draw text with a subtle shadow for depth and include the count
        ctx.fillText(`${word.text} (${word.value})`, x, y);
        
        // For important words, add a subtle glow effect
        if (normalizedValue > 0.6 && colorScheme === 'vibrant') {
          const originalGlobalAlpha = ctx.globalAlpha;
          
          ctx.globalAlpha = 0.2;
          ctx.shadowBlur = 12;
          ctx.shadowColor = COLORS[colorIndex];
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          ctx.fillText(`${word.text} (${word.value})`, x, y);
          
          // Restore original settings
          ctx.globalAlpha = originalGlobalAlpha;
          ctx.shadowBlur = originalShadow;
          ctx.shadowColor = originalShadowColor;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
        }
        
        placedWords.push({ text: textWithCount, x, y, width, height });
      }
    });
    
    setIsGenerating(false);
  };

  // Draw initial word cloud when data changes
  // Auto redraw word cloud when data changes, container resizes, or window resizes
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    
    drawWordCloud();
    
    // Set default animation and color scheme
    setAnimation(true);
    setColorScheme('vibrant');
    
    // Handle window resize events
    const handleResize = () => {
      drawWordCloud();
    };
    
    // Add hoverable functionality with mousemove event
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Change cursor to pointer when over a word
      canvas.style.cursor = 'pointer';
    };
    
    // Reset cursor when mouse leaves
    const handleMouseLeave = () => {
      if (canvas) {
        canvas.style.cursor = 'default';
      }
    };
    
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [wordFrequencies]);

  // Animation effect for color cycling - much slower
  useEffect(() => {
    let animationFrame: number;
    let frameCount = 0;
    const frameSkip = 5; // Only update every 5 frames for slower animation
    
    const animate = () => {
      if (animation) {
        frameCount++;
        
        // Only update angle every few frames to slow down the animation
        if (frameCount % frameSkip === 0) {
          setColorAngle(prev => (prev + 1) % 360);
        }
        
        animationFrame = requestAnimationFrame(animate);
      }
    };
    
    if (animation) {
      animationFrame = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [animation]);

  // Redraw when color angle changes during animation
  useEffect(() => {
    if (animation) {
      drawWordCloud();
    }
  }, [colorAngle]);

  // No export function needed

  // Toggle animation effect
  const toggleAnimation = () => {
    setAnimation(prev => !prev);
  };

  // Cycle through different color schemes
  const cycleColorScheme = () => {
    const schemes = Object.keys(colorSchemes);
    const currentIndex = schemes.indexOf(colorScheme);
    const nextIndex = (currentIndex + 1) % schemes.length;
    setColorScheme(schemes[nextIndex]);
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <Cloud className="h-5 w-5 text-indigo-500" />
          <CardTitle className="text-base font-medium ml-2">{title}</CardTitle>
        </div>
        <p className="text-sm text-slate-500">{description}</p>
      </CardHeader>
      <CardContent>
        <div 
          ref={containerRef} 
          className="h-[350px] w-full relative bg-slate-50 rounded-lg overflow-hidden shadow-sm"
        >
          <canvas ref={canvasRef} className="absolute inset-0" />
          {wordFrequencies.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-slate-400">No data available for word cloud</p>
            </div>
          )}
          {isGenerating && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                <svg 
                  className="animate-spin h-8 w-8 text-indigo-600" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  ></circle>
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p className="mt-2 text-sm font-medium text-indigo-700">Generating beautiful word cloud...</p>
              </motion.div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};