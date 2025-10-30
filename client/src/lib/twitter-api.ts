/**
 * Twitter API service for real-time disaster data
 */

import { ApiError } from './api-error';

export interface TwitterMetadata {
  emotion: string;
  sentiment: string;
  disaster: string;
  location: string;
  confidence: string;
  language: string;
  source: string;
}

export interface TwitterData {
  id: string;
  text: string;
  link: string;
  timestamp: string;
  metadata: TwitterMetadata;
}

export interface TwitterResponse {
  success: boolean;
  data: TwitterData[];
  timestamp: string;
  count: number;
  error?: string;
  message?: string;
}

/**
 * Fetch Twitter data from API
 */
export async function fetchTwitterData(limit: number = 10): Promise<TwitterData[]> {
  try {
    const response = await fetch(`/api/twitter/data?limit=${limit}`);

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const result: TwitterResponse = await response.json();

    if (!result.success) {
      throw new ApiError(result.message || 'Failed to fetch Twitter data', 500);
    }

    return result.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred while fetching Twitter data', 500);
  }
}

/**
 * Clear Twitter cache
 */
export async function clearTwitterCache(): Promise<void> {
  try {
    const response = await fetch('/api/twitter-clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const result = await response.json();

    if (!result.success) {
      throw new ApiError(result.message || 'Failed to clear Twitter cache', 500);
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error occurred while clearing Twitter cache', 500);
  }
}

/**
 * Get sentiment color based on sentiment value
 */
export function getSentimentColor(sentiment: string): string {
  switch (sentiment.toLowerCase()) {
    case 'positive':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'negative':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'neutral':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get emotion color based on emotion value
 */
export function getEmotionColor(emotion: string): string {
  switch (emotion.toLowerCase()) {
    case 'panic':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'fear/anxiety':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'resilience':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'disbelief':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'neutral':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get disaster color based on disaster type
 */
export function getDisasterColor(disaster: string): string {
  switch (disaster.toLowerCase()) {
    case 'flood':
    case 'baha':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'fire':
    case 'sunog':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'earthquake':
    case 'lindol':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'typhoon':
    case 'bagyo':
      return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    case 'landslide':
    case 'pagguho':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'volcanic eruption':
    case 'volcanic eruptions':
    case 'bulkan':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}
