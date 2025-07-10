/**
 * Coordinate Formatter Tool for Agent Route Optimization - Deno Compatible
 * 
 * Simple tool that formats job coordinates for AI agent spatial reasoning.
 * Passes lat/lng data directly to agent for route optimization decisions.
 */

import { tool } from "https://esm.sh/@langchain/core@0.3.62/tools";
import { z } from "https://esm.sh/zod@3.25.76";

/**
 * Input schema for the coordinate formatter tool
 */
const CoordinateFormatterInputSchema = z.object({
  homeBase: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
  }),
  jobs: z.array(z.object({
    id: z.string(),
    lat: z.number(),
    lng: z.number(),
    address: z.string(),
    timeWindow: z.object({
      start: z.string(),
      end: z.string(),
    }).optional(),
    duration: z.number(), // Duration in minutes
  })),
});

/**
 * Coordinate Formatter Tool
 * 
 * Formats job coordinates for agent spatial reasoning. The agent will use
 * this coordinate data to determine optimal route order through AI reasoning.
 */
export const coordinateFormatterTool = tool(
  async ({ homeBase, jobs }) => {
    console.log('📍 Coordinate Formatter: Preparing spatial data for agent...');
    
    const coordinateData = {
      homeBase,
      jobs,
      spatialAnalysis: {
        totalJobs: jobs.length,
        coverageArea: calculateCoverageArea(jobs),
        centroid: calculateCentroid(jobs),
      },
    };
    
    console.log('✅ Coordinate Formatter: Spatial data prepared for agent reasoning');
    return coordinateData;
  },
  {
    name: "coordinate_formatter",
    description: "Format job coordinates for AI agent spatial reasoning and route optimization",
    schema: CoordinateFormatterInputSchema,
  }
);

/**
 * Calculate approximate coverage area of all jobs
 */
function calculateCoverageArea(jobs: any[]): { minLat: number; maxLat: number; minLng: number; maxLng: number } {
  if (jobs.length === 0) return { minLat: 0, maxLat: 0, minLng: 0, maxLng: 0 };
  
  const lats = jobs.map(job => job.lat);
  const lngs = jobs.map(job => job.lng);
  
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * Calculate centroid of all job locations
 */
function calculateCentroid(jobs: any[]): { lat: number; lng: number } {
  if (jobs.length === 0) return { lat: 0, lng: 0 };
  
  const avgLat = jobs.reduce((sum, job) => sum + job.lat, 0) / jobs.length;
  const avgLng = jobs.reduce((sum, job) => sum + job.lng, 0) / jobs.length;
  
  return { lat: avgLat, lng: avgLng };
} 