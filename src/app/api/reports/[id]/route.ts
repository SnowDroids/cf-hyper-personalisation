import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// DELETE /api/reports/[id] - Delete a specific report
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { env } = getCloudflareContext();
    const db = env.DB;

    if (!db) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const { id } = await params;
    const reportId = parseInt(id, 10);

    if (isNaN(reportId)) {
      return NextResponse.json(
        { error: 'Invalid report ID' },
        { status: 400 }
      );
    }

    // Check if report exists
    const { results } = await db
      .prepare('SELECT id FROM reports WHERE id = ?')
      .bind(reportId)
      .all();

    if (!results || results.length === 0) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Delete the report
    const result = await db
      .prepare('DELETE FROM reports WHERE id = ?')
      .bind(reportId)
      .run();

    if (!result.success) {
      throw new Error('Failed to delete report');
    }

    return NextResponse.json(
      { message: 'Report deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting report:', error);
    return NextResponse.json(
      { error: 'Failed to delete report', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
