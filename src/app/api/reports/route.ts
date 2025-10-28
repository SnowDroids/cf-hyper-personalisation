import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface ReportData {
  dateOfInspection: string;
  location: string;
  inspectorName: string;
  observedHazard: string;
  severityRating: string;
  recommendedAction: string;
}

// GET /api/reports - Fetch all reports
export async function GET() {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { results } = await db
      .prepare('SELECT * FROM reports ORDER BY created_at DESC')
      .all();

    return NextResponse.json({ reports: results }, { status: 200 });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reports', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a new report
export async function POST(request: NextRequest) {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const body = await request.json() as ReportData;

    // Validate required fields
    const requiredFields: (keyof ReportData)[] = [
      'dateOfInspection',
      'location',
      'inspectorName',
      'observedHazard',
      'severityRating',
      'recommendedAction',
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Insert the report into the database
    const result = await db
      .prepare(
        `INSERT INTO reports (
          date_of_inspection,
          location,
          inspector_name,
          observed_hazard,
          severity_rating,
          recommended_action
        ) VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        body.dateOfInspection,
        body.location,
        body.inspectorName,
        body.observedHazard,
        body.severityRating,
        body.recommendedAction
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to insert report');
    }

    return NextResponse.json(
      {
        message: 'Report submitted successfully',
        id: result.meta.last_row_id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { error: 'Failed to create report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
