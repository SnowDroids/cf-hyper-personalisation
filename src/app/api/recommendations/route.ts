/**
 * GET /api/recommendations
 * 
 * Fetches AI-powered recommendations for an inspector based on their recent reports.
 * This endpoint communicates with the ReportAnalyzer Durable Object.
 * 
 * Query Parameters:
 * - inspector: The name of the inspector to get recommendations for
 * 
 * Returns:
 * - recommendation: string | null - The AI-generated recommendation text
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// ========== WORKSHOP: GET RECOMMENDATIONS ENDPOINT START ==========
export async function GET(request: NextRequest) {
  try {
    // Step 1: Get the Cloudflare environment context
    // HINT: Use getCloudflareContext() to access Cloudflare bindings
    const { env } = getCloudflareContext();
    
    // Step 2: Extract the inspector name from query parameters
    const { searchParams } = new URL(request.url);
    const inspector = searchParams.get('inspector');
    
    if (!inspector) {
      return NextResponse.json(
        { error: 'Inspector name is required' },
        { status: 400 }
      );
    }
    
    // Step 3: Get the Durable Object stub for this inspector
    // HINT: Use env.REPORT_ANALYZER.idFromName() to create a consistent ID
    // HINT: Then use env.REPORT_ANALYZER.get() to get the stub
    const id = env.REPORT_ANALYZER.idFromName(inspector);
    const stub = env.REPORT_ANALYZER.get(id);
    
    // Step 4: Forward the request to the Durable Object
    // HINT: Call stub.fetch() with a URL that includes the inspector parameter
    const doUrl = new URL('http://internal/get-recommendation');
    doUrl.searchParams.set('inspector', inspector);
    
    const response = await stub.fetch(doUrl.toString());
    const data = await response.json() as { recommendation: string | null };
    
    // Step 5: Return the recommendation
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching recommendation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch recommendation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// ========== WORKSHOP: GET RECOMMENDATIONS ENDPOINT END ==========
