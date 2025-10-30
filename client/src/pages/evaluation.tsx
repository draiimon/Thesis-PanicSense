import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDisasterContext } from "@/context/disaster-context";
import { getAnalyzedFile, getSentimentPostsByFileId, getSentimentPosts } from "@/lib/api";
import { ConfusionMatrix } from "@/components/evaluation/confusion-matrix";
import { SentimentLabelCount } from "@/components/evaluation/sentiment-label-count";
import { LanguageLabelCount } from "@/components/evaluation/language-label-count";
import { WordCloud } from "@/components/evaluation/word-cloud";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUploader } from "@/components/file-uploader";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  DatabaseIcon, 
  FileTextIcon, 
  LineChart, 
  FileCheck2, 
  BarChart4,
  Gauge,
  Download,
  PieChart
} from "lucide-react";
import { AnimatedBackground } from "@/components/layout/animated-background";

const Evaluation: React.FC = () => {
  const { analyzedFiles, isLoadingAnalyzedFiles, sentimentPosts: allSentimentPosts } = useDisasterContext();
  const [selectedFileId, setSelectedFileId] = useState<string>("all");
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Fetch metrics for selected file
  const { 
    data: selectedFile,
    isLoading: isLoadingSelectedFile 
  } = useQuery({
    queryKey: ['/api/analyzed-files', selectedFileId],
    queryFn: () => getAnalyzedFile(parseInt(selectedFileId)),
    enabled: !!selectedFileId && selectedFileId !== "all"
  });

  // Fetch sentiment posts for selected file
  const { 
    data: sentimentPosts,
    isLoading: isLoadingSentimentPosts 
  } = useQuery({
    queryKey: ['/api/sentiment-posts/file', selectedFileId],
    queryFn: () => getSentimentPostsByFileId(parseInt(selectedFileId)),
    enabled: !!selectedFileId && selectedFileId !== "all"
  });

  // Fetch all sentiment posts if "All Datasets" is selected 
  // Using the correct query key to match the one in the API
  // Always fetch this data by default to ensure metrics load on refresh
  const {
    data: allData,
    isLoading: isLoadingAllData
  } = useQuery({
    queryKey: ['/api/sentiment-posts'],
    queryFn: () => getSentimentPosts(),
    // Always enabled to ensure data is loaded on refresh
  });

  const isLoading = 
    isLoadingAnalyzedFiles || 
    isLoadingSelectedFile || 
    isLoadingSentimentPosts || 
    (selectedFileId === "all" && isLoadingAllData);

  const getDisplayData = () => {
    if (selectedFileId === "all") {
      // Make sure we have valid array data with safety checks
      const safeAllData = Array.isArray(allData) ? allData : [];
      const safeAllSentimentPosts = Array.isArray(allSentimentPosts) ? allSentimentPosts : [];
      
      // Use the first available array data
      const posts = safeAllData.length > 0 ? safeAllData : safeAllSentimentPosts;
      
      return {
        posts: posts,
        name: "All Datasets",
        isAll: true
      };
    }

    // Make sure we have valid array data for individual dataset
    const safeSentimentPosts = Array.isArray(sentimentPosts) ? sentimentPosts : [];
    
    return {
      posts: safeSentimentPosts,
      name: selectedFile?.originalName || "Selected Dataset",
      isAll: false
    };
  };

  const { posts, name, isAll } = getDisplayData();

  // Animation variants for staggered animation
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
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  // Get total datasets and records count for display
  const totalDatasets = Array.isArray(analyzedFiles) ? analyzedFiles.length : 0;
  const totalRecordsCount = Array.isArray(allSentimentPosts) ? allSentimentPosts.length : 0;

  return (
    <div className="relative min-h-screen">
      {/* Enhanced background - SAME AS REALTIME */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-violet-50 to-pink-50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/15 via-teal-500/10 to-rose-500/15 animate-gradient"
          style={{ backgroundSize: "200% 200%" }} />
          
        <div className="absolute inset-0 opacity-15 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM1MDUwRjAiIGZpbGwtb3BhY2l0eT0iMC41Ij48cGF0aCBkPSJNMzYgMzR2Nmg2di02aC02em02IDZ2Nmg2di02aC02em0tMTIgMGg2djZoLTZ2LTZ6bTEyIDBoNnY2aC02di02eiIvPjwvZz48L2c+PC9zdmc+')]" />
        
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(120,80,255,0.8)_0%,transparent_70%)]" />
        
        <div className="absolute h-72 w-72 rounded-full bg-purple-500/25 filter blur-3xl animate-float-1 will-change-transform"
          style={{ top: "15%", left: "8%" }} />
          
        <div className="absolute h-64 w-64 rounded-full bg-teal-500/20 filter blur-3xl animate-float-2 will-change-transform"
          style={{ bottom: "15%", right: "15%" }} />
          
        <div className="absolute h-52 w-52 rounded-full bg-purple-500/25 filter blur-3xl animate-float-3 will-change-transform"
          style={{ top: "45%", right: "20%" }} />
        
        <div className="absolute h-48 w-48 rounded-full bg-pink-500/20 filter blur-3xl animate-float-4 will-change-transform"
          style={{ top: "65%", left: "25%" }} />
          
        <div className="absolute h-40 w-40 rounded-full bg-yellow-400/15 filter blur-3xl animate-float-5 will-change-transform"
          style={{ top: "30%", left: "40%" }} />
          
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
      
      <div className="relative pb-10">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="relative space-y-8 mx-auto max-w-7xl pt-10 px-4"
        >
          {/* Evaluation Header */}
          <motion.div 
            variants={itemVariants}
            className="relative overflow-hidden rounded-2xl border-none shadow-lg bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 p-4 sm:p-4"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-purple-500/10 animate-gradient" />
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                  <Gauge className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white">
                    Evaluation Metrics
                  </h1>
                  <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                    Detailed model performance assessment and accuracy metrics for sentiment analysis predictions
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                <div className="text-sm font-medium text-white">
                  {totalDatasets} datasets, {totalRecordsCount} records analyzed
                </div>
              </div>
            </div>
          </motion.div>

          {/* Dataset Selection and Upload Section */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader className="p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-gray-200/40">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                      <DatabaseIcon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base sm:text-lg font-bold text-white">
                        Dataset Selection
                      </CardTitle>
                      <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                        Choose a dataset to view its evaluation metrics or select "All Datasets" for combined analysis
                      </p>
                    </div>
                  </div>
                  <FileUploader 
                    className=""
                    onSuccess={(data) => {
                      if (data.file?.id) {
                        setSelectedFileId(data.file.id.toString());
                      }
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingAnalyzedFiles ? (
                  <div className="flex items-center justify-center h-20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-violet-600 border-t-transparent animate-spin"></div>
                      <p className="text-slate-600">Loading datasets...</p>
                    </div>
                  </div>
                ) : !Array.isArray(analyzedFiles) || analyzedFiles.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-slate-300 rounded-lg bg-slate-50/50">
                    <div className="h-16 w-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <DatabaseIcon className="h-8 w-8 text-teal-600" />
                    </div>
                    <p className="text-slate-800 font-medium text-lg">No analyzed files available</p>
                    <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
                      Upload a CSV file using the button above to generate model evaluation metrics and analyze performance
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-6 border-teal-200 text-teal-700 hover:bg-teal-50 hover:text-teal-800" 
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <FileTextIcon className="h-4 w-4 mr-2" />
                      Upload CSV File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Select
                      value={selectedFileId}
                      onValueChange={setSelectedFileId}
                    >
                      <SelectTrigger className="w-full bg-white/80 backdrop-blur-sm border-slate-200/80 rounded-lg shadow-sm">
                        <SelectValue placeholder="Select a dataset" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-slate-200/80 shadow-md">
                        <SelectItem value="all" className="font-medium text-violet-600 focus:bg-violet-50">
                          <div className="flex items-center">
                            <DatabaseIcon className="h-4 w-4 mr-2" />
                            All Datasets ({allSentimentPosts?.length || 0} total records)
                          </div>
                        </SelectItem>
                        <div className="py-1 px-2 text-xs text-slate-500 border-b">Individual Datasets</div>
                        {analyzedFiles.map((file) => (
                          <SelectItem key={file.id} value={file.id.toString()} className="focus:bg-violet-50">
                            <div className="flex items-center">
                              <FileCheck2 className="h-4 w-4 mr-2 text-slate-500" />
                              {file.originalName} ({file.recordCount} records)
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    {selectedFileId !== "all" && selectedFile && (
                      <div className="mt-6 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                          <BarChart4 className="h-5 w-5 text-violet-600" />
                          <h3 className="font-medium text-slate-800">Selected Dataset Summary</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                          <div className="rounded-lg bg-violet-50 border border-violet-100 p-3">
                            <p className="text-xs text-violet-600 font-medium">File Name</p>
                            <p className="text-sm text-slate-800 truncate mt-1">{selectedFile.originalName}</p>
                          </div>
                          <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                            <p className="text-xs text-blue-600 font-medium">Record Count</p>
                            <p className="text-sm text-slate-800 mt-1">{selectedFile.recordCount} entries</p>
                          </div>
                          <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3">
                            <p className="text-xs text-emerald-600 font-medium">Processed Date</p>
                            <p className="text-sm text-slate-800 mt-1">
                              {new Date(selectedFile.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Confusion Matrix and Metrics Dashboard Removed */}
          
          {/* New Visualization Components */}
          {selectedFileId && (
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden shadow-lg border-0 bg-white/90 backdrop-blur-sm mt-6">
                <CardHeader className="p-4 bg-gradient-to-r from-indigo-600/90 via-blue-600/90 to-purple-600/90 border-b border-gray-200/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-inner">
                        <BarChart4 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base sm:text-lg font-bold text-white">
                          Comparative Disaster Analysis
                        </CardTitle>
                        <p className="text-xs sm:text-sm text-indigo-100 mt-0.5 sm:mt-1">
                          {isAll 
                            ? "Advanced visual analysis of sentiment distribution and language patterns" 
                            : `Advanced visual analysis for ${name}`
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="hidden sm:flex items-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/20 ml-2"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Analysis
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Featured Sentiment Analysis - Made more prominent */}
                  <div className="mb-6">
                    <div className="col-span-1 bg-white rounded-xl shadow-md p-4 border border-indigo-100">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 rounded-full">
                          <PieChart className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-800">Sentiment Analysis Summary</h3>
                          <p className="text-sm text-slate-500">Overview of positive, negative, and neutral sentiment distribution</p>
                        </div>
                      </div>
                      <SentimentLabelCount 
                        data={posts}
                        title="Sentiment Distribution"
                        description={`Distribution of sentiment categories in ${isAll ? 'all datasets' : name}`}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Additional charts below */}
                    {/* Language Label Count */}
                    <div className="col-span-1">
                      <LanguageLabelCount 
                        data={posts}
                        title="Language Distribution"
                        description={`Distribution of language categories in ${isAll ? 'all datasets' : name}`}
                      />
                    </div>
                    
                    {/* Word Cloud */}
                    <div className="col-span-1">
                      <WordCloud 
                        data={posts}
                        title="Word Cloud Visualization"
                        description="Real-time visualization of the most frequent words in the dataset"
                      />
                    </div>
                    

                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Evaluation;