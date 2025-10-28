/**
 * API Route: /api/reports/analyze
 * 
 * This route analyzes a new report using the Durable Object and Workers AI.
 * It fetches previous reports for context and returns AI recommendations (if any).
 * 
 * Workshop participants will implement:
 * 1. Getting the Durable Object stub
 * 2. Forwarding the report to the Durable Object
 * 3. Returning the AI recommendation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// ========== WORKSHOP: ANALYZE REPORT ENDPOINT START ==========
export async function POST(request: NextRequest) {
  try {
    // Parse the report data from the request
    const reportData = await request.json() as {
      dateOfInspection: string;
      location: string;
      inspectorName: string;
      inspector_name?: string;
      observedHazard: string;
      severityRating: string;
      recommendedAction: string;
    };

    if (!reportData.inspector_name && !reportData.inspectorName) {
      return NextResponse.json(
        { error: 'Inspector name is required' },
        { status: 400 }
      );
    }

    // Get Cloudflare bindings
    const { env } = getCloudflareContext();

    // Get the Durable Object stub for this inspector
    // Using inspector name as the DO ID ensures each inspector has their own instance
    const inspectorName = reportData.inspector_name || reportData.inspectorName;
    const id = env.REPORT_ANALYZER.idFromName(inspectorName);
    const stub = env.REPORT_ANALYZER.get(id);

    // Forward the report to the Durable Object for analysis
    const response = await stub.fetch('http://do/analyze-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        date_of_inspection: reportData.dateOfInspection,
        location: reportData.location,
        inspector_name: inspectorName,
        observed_hazard: reportData.observedHazard,
        severity_rating: reportData.severityRating,
        recommended_action: reportData.recommendedAction,
      }),
    });

    const data = await response.json() as { recommendation: string | null };

    return NextResponse.json({
      recommendation: data.recommendation,
    });
  } catch (error) {
    console.error('Error analyzing report:', error);
    return NextResponse.json(
      { error: 'Failed to analyze report' },
      { status: 500 }
    );
  }
}
// ========== WORKSHOP: ANALYZE REPORT ENDPOINT END ==========
