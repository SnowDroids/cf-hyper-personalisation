/**
 * POST /api/recommendations/ignore
 * 
 * Marks the current recommendation as ignored for a specific inspector.
 * The recommendation will not be shown again until new reports are submitted.
 * 
 * Request Body:
 * - inspector: The name of the inspector
 * 
 * Returns:
 * - success: boolean
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// ========== WORKSHOP: IGNORE RECOMMENDATION ENDPOINT START ==========
export async function POST(request: NextRequest) {
  try {
    // Step 1: Get the Cloudflare environment context
    const { env } = getCloudflareContext();
    
    // Step 2: Parse the request body to get the inspector name
    const body = await request.json() as { inspector?: string };
    const inspector = body.inspector;
    
    if (!inspector) {
      return NextResponse.json(
        { error: 'Inspector name is required' },
        { status: 400 }
      );
    }
    
    // Step 3: Get the Durable Object stub for this inspector
    // HINT: Use the same pattern as the GET endpoint
    const id = env.REPORT_ANALYZER.idFromName(inspector);
    const stub = env.REPORT_ANALYZER.get(id);
    
    // Step 4: Forward the ignore request to the Durable Object
    const doUrl = new URL('http://internal/ignore-recommendation');
    doUrl.searchParams.set('inspector', inspector);
    
    const response = await stub.fetch(doUrl.toString(), {
      method: 'POST',
    });
    
    const data = await response.json() as { success: boolean };
    
    // Step 5: Return success response
    return NextResponse.json(data, { status: 200 });
    
  } catch (error) {
    console.error('Error ignoring recommendation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to ignore recommendation',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
// ========== WORKSHOP: IGNORE RECOMMENDATION ENDPOINT END ==========
