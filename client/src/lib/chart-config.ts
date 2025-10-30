/**
 * Shared chart configuration for consistent styling across visualizations
 */
export const ChartConfig = {
  colors: {
    primary: '#4f46e5', // indigo-600
    blue: '#2563eb',
    green: '#059669',
    yellow: '#ca8a04',
    orange: '#ea580c',
    red: '#dc2626',
    violet: '#8b5cf6',
    pink: '#ec4899',
    indigo: '#6366f1',
    cyan: '#06b6d4',
    gray: '#6b7280',
    
    // Sentiment colors (for consistency across charts)
    "Panic": '#dc2626', // red-600
    "Fear/Anxiety": '#ea580c', // orange-600
    "Disbelief": '#ca8a04', // yellow-600
    "Neutral": '#2563eb', // blue-600
    "Resilience": '#059669', // green-600
  },
  
  fonts: {
    base: 'Inter, system-ui, sans-serif',
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
    }
  },
  
  // Helper for generating tooltip content
  generateTooltip: (label: string, value: number, total: number): string => {
    const percentage = ((value / total) * 100).toFixed(1);
    return `${label}: ${value} (${percentage}%)`;
  }
};