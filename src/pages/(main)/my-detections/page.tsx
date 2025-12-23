/**
 * My Detections Page
 * Displays all product detections for the logged-in user
 */

import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import UserDetections from "@/components/UserDetections";
import { loader as apiLoader } from "@/pages/api/detect/list/page";

interface Detection {
  uuid: string;
  status: 'pending' | 'processing' | 'completed' | 'verified' | 'failed' | 'identified';
  category?: string;
  inputDescription: string;
  identified_product?: string;
  brand?: string;
  model?: string;
  color_variants?: string;
  condition_rating?: string;
  estimated_year?: string;
  short_description?: string;
  categoryConfidence?: number;
  confidence_score?: number;
  createdAt: string;
  updatedAt: string;
  inputImages: string[];
  imageCount: number;
}

// Server-side loader function
export const loader = async (args: LoaderFunctionArgs) => {
  // Call the API loader directly instead of making an HTTP request
  const response = await apiLoader(args);
  
  // The API loader returns a Response object, extract the JSON data
  const result = await response.json();
  
  if (!result.success) {
    throw new Response(result.error || 'Failed to fetch detections', { 
      status: response.status 
    });
  }

  console.log(`Loaded ${result.data.length} detections (server)`);
  
  return result.data;
};

const Page = () => {
  const detections = useLoaderData<Detection[]>();
  
  return <UserDetections detections={detections} />;
};

export default Page;

