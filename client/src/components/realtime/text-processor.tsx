import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { processText, type TextProcessingResult } from '@/lib/api';
import { Zap, Loader2, ArrowRight, TextIcon, AlignJustify, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function TextProcessor() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<TextProcessingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcess = useCallback(async () => {
    if (!inputText.trim()) {
      setError('Please enter text to process');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await processText(inputText);
      
      // Verify the result has the required properties
      if (!result || 
          typeof result.normalizedText !== 'string' || 
          !Array.isArray(result.tokenizedText) || 
          !Array.isArray(result.stemmedText) || 
          typeof result.finalOutput !== 'string') {
        throw new Error('Invalid response format from the server');
      }
      
      setResult(result);
      setError(null);
    } catch (err) {
      console.error('Error processing text:', err);
      setError('Failed to process text. Please try again with a different input or check your connection.');
      
      // Create a fallback result for demo purposes
      const words = inputText.toLowerCase().trim().split(/\s+/);
      
      setResult({
        normalizedText: inputText.toLowerCase().trim().replace(/[^\w\s]/g, ''),
        tokenizedText: words,
        stemmedText: words.map(word => word.replace(/ing$|ed$|s$|es$/, '')),
        finalOutput: inputText.toLowerCase().trim().replace(/[^\w\s]/g, '')
      });
    } finally {
      setIsLoading(false);
    }
  }, [inputText]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  return (
    <div className="flex flex-col space-y-4 mt-8">
      <Card className="overflow-hidden shadow-lg rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100/40">
        <CardHeader className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 border-b border-indigo-400/20">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-white/20 shadow-inner mr-3">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-white">
                Text Processing Pipeline
              </CardTitle>
              <CardDescription className="text-sm text-indigo-100">
                See how text is transformed through the NLP pipeline of PanicSense
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <div className="rounded-lg bg-white p-4 shadow-sm border border-indigo-100">
                <label htmlFor="input-text" className="block text-sm font-semibold text-indigo-700 mb-2 flex items-center">
                  <TextIcon className="h-4 w-4 mr-2 text-indigo-500" /> Input Text
                </label>
                <Textarea
                  id="input-text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Enter text in English or Filipino to see how it's processed through each step of NLP transformation..."
                  className="min-h-[150px] border-indigo-200 focus:border-indigo-400 shadow-inner bg-indigo-50/50"
                />

                {error && (
                  <div className="px-4 py-3 mt-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleProcess} 
                  disabled={isLoading || !inputText.trim()} 
                  className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Process Text <ArrowRight className="ml-2 h-4 w-4" /></>
                  )}
                </Button>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              {result ? (
                <motion.div 
                  initial="hidden"
                  animate="visible"
                  variants={containerVariants}
                  className="space-y-4"
                >
                  <div className="flex justify-center mb-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-purple-400 transform -skew-y-3 rounded opacity-20"></div>
                      <h3 className="relative text-base font-semibold text-indigo-800 px-4 py-1">NLP Pipeline Results</h3>
                    </div>
                  </div>

                  <motion.div variants={itemVariants}>
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 flex items-center justify-center shadow mr-2">
                        <span className="text-white text-xs font-bold">1</span>
                      </div>
                      <h3 className="text-sm font-semibold text-indigo-700">Normalization</h3>
                    </div>
                    <div className="pl-10">
                      <div className="p-3 bg-white border border-indigo-200 rounded-md text-sm overflow-auto max-h-20 shadow-inner">
                        {result.normalizedText}
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow mr-2">
                        <span className="text-white text-xs font-bold">2</span>
                      </div>
                      <h3 className="text-sm font-semibold text-blue-700">Tokenization</h3>
                    </div>
                    <div className="pl-10">
                      <div className="p-3 bg-white border border-blue-200 rounded-md text-sm overflow-auto max-h-20 shadow-inner">
                        <div className="flex flex-wrap gap-1.5">
                          {result.tokenizedText.map((token, index) => (
                            <span 
                              key={`${token}-${index}`}
                              className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200"
                            >
                              {token}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center shadow mr-2">
                        <span className="text-white text-xs font-bold">3</span>
                      </div>
                      <h3 className="text-sm font-semibold text-purple-700">Stemming</h3>
                    </div>
                    <div className="pl-10">
                      <div className="p-3 bg-white border border-purple-200 rounded-md text-sm overflow-auto max-h-20 shadow-inner">
                        <div className="flex flex-wrap gap-1.5">
                          {result.stemmedText.map((stem, index) => (
                            <span 
                              key={`${stem}-${index}`}
                              className={cn(
                                "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border",
                                stem !== result.tokenizedText[index] 
                                  ? "bg-purple-100 text-purple-700 border-purple-200" 
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              )}
                            >
                              {stem}
                              {stem !== result.tokenizedText[index] && (
                                <span className="ml-1 text-purple-500 text-[10px]">✓</span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center shadow mr-2">
                        <span className="text-white text-xs font-bold">4</span>
                      </div>
                      <h3 className="text-sm font-semibold text-green-700">Final Output</h3>
                    </div>
                    <div className="pl-10">
                      <div className="p-3 bg-white border border-green-200 rounded-md text-sm overflow-auto max-h-20 shadow-inner">
                        {result.finalOutput}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center bg-white/80 rounded-lg p-8 border border-dashed border-indigo-200">
                  <div className="text-center">
                    <AlignJustify className="h-10 w-10 text-indigo-300 mx-auto mb-3" />
                    <p className="text-indigo-800 font-medium">Enter text and click "Process Text"</p>
                    <p className="text-sm text-indigo-500 mt-1">You'll see how the text transforms in each NLP step</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}