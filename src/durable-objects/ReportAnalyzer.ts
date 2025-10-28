/**
 * ReportAnalyzer Durable Object
 * 
 * This Durable Object analyzes a new safety report using AI.
 * It fetches the inspector's previous 1-2 reports for context,
 * then uses Workers AI to provide writing improvement suggestions.
 * 
 * Workshop participants will implement:
 * 1. Querying D1 for previous reports
 * 2. Calling Workers AI to analyze the new report
 * 3. Returning recommendations (if any)
 */

// Import DurableObject from cloudflare:workers
import { DurableObject } from 'cloudflare:workers';

// ========== WORKSHOP: TYPE DEFINITIONS START ==========
// Interface for a report from the database
interface Report {
  id?: number;
  date_of_inspection: string;
  location: string;
  inspector_name: string;
  observed_hazard: string;
  severity_rating: string;
  recommended_action: string;
  created_at?: string;
}
// ========== WORKSHOP: TYPE DEFINITIONS END ==========

export class ReportAnalyzer extends DurableObject {
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
  }

  /**
   * Main fetch handler for the Durable Object
   * Handles the /analyze-report endpoint
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ========== WORKSHOP: REQUEST HANDLING START ==========
    if (path === '/analyze-report' && request.method === 'POST') {
      try {
        // Parse the new report from the request body
        const newReport = await request.json() as Report;
        
        if (!newReport.inspector_name) {
          return new Response(JSON.stringify({ error: 'Inspector name required' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Fetch previous reports for context
        const previousReports = await this.fetchPreviousReports(newReport.inspector_name);
        
        // Analyze the new report with context from previous reports
        const recommendation = await this.analyzeReport(newReport, previousReports);
        
        return new Response(JSON.stringify({ recommendation }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error analyzing report:', error);
        return new Response(JSON.stringify({ error: 'Failed to analyze report' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    // ========== WORKSHOP: REQUEST HANDLING END ==========

    return new Response('Not found', { status: 404 });
  }

  /**
   * Fetch the most recent 1-2 reports for this inspector from D1
   * These provide context about the inspector's writing style
   */
  private async fetchPreviousReports(inspectorName: string): Promise<Report[]> {
    // ========== WORKSHOP: D1 QUERY START ==========
    // HINT: Use this.env.DB to access the D1 database
    // HINT: Query for reports WHERE inspector_name = ? ORDER BY created_at DESC LIMIT 2
    // HINT: Use .bind() to safely pass the inspector name parameter
    
    const db = this.env.DB;
    
    const result = await db
      .prepare(
        'SELECT * FROM reports WHERE inspector_name = ? ORDER BY created_at DESC LIMIT 2'
      )
      .bind(inspectorName)
      .all();
    
    const reports = result.results as unknown as Report[];
    
    console.log(`Found ${reports.length} previous reports for ${inspectorName}`);
    return reports;
    // ========== WORKSHOP: D1 QUERY END ==========
  }

  /**
   * Analyze a new report using Workers AI
   * Uses previous reports as context to understand the inspector's writing style
   */
  private async analyzeReport(newReport: Report, previousReports: Report[]): Promise<string | null> {
    // ========== WORKSHOP: WORKERS AI INTEGRATION START ==========
    // HINT: Use this.env.AI.run() to call Workers AI
    // HINT: Model to use: '@cf/meta/llama-3-8b-instruct'
    // HINT: Build a prompt that includes the new report and previous reports for context
    
    // Build the analysis prompt
    const prompt = this.buildAnalysisPrompt(newReport, previousReports);
    
    try {
      // Call Workers AI
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a safety report writing coach. Analyze the new report and provide 1-2 specific, actionable tips to improve it. If the report is already well-written, return null. Keep responses brief (2-3 sentences max). Only provide feedback if there are clear improvements to be made.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }) as { response?: string };
      
      const recommendation = response.response || null;
      
      // If the AI says the report is good or has no meaningful feedback, return null
      if (recommendation && (
        recommendation.toLowerCase().includes('well-written') ||
        recommendation.toLowerCase().includes('no improvements') ||
        recommendation.toLowerCase().includes('looks good') ||
        recommendation.length < 20
      )) {
        console.log('Report is already good, no recommendations needed');
        return null;
      }
      
      console.log('AI recommendation generated');
      return recommendation;
    } catch (error) {
      console.error('Error calling Workers AI:', error);
      return null;
    }
    // ========== WORKSHOP: WORKERS AI INTEGRATION END ==========
  }

  /**
   * Build the analysis prompt for Workers AI
   * Includes the new report and previous reports for context
   */
  private buildAnalysisPrompt(newReport: Report, previousReports: Report[]): string {
    // ========== WORKSHOP: PROMPT ENGINEERING START ==========
    let prompt = `Analyze this NEW safety inspection report and provide specific feedback to improve it.\n\n`;
    
    // Include previous reports for context (if any)
    if (previousReports.length > 0) {
      prompt += `PREVIOUS REPORTS (for context on writing style):\n`;
      previousReports.forEach((report, index) => {
        prompt += `\nPrevious Report ${index + 1}:\n`;
        prompt += `- Observed Hazard: ${report.observed_hazard}\n`;
        prompt += `- Severity: ${report.severity_rating}\n`;
        prompt += `- Recommended Action: ${report.recommended_action}\n`;
      });
      prompt += `\n---\n\n`;
    }
    
    // The new report to analyze
    prompt += `NEW REPORT TO ANALYZE:\n`;
    prompt += `Date: ${newReport.date_of_inspection}\n`;
    prompt += `Location: ${newReport.location}\n`;
    prompt += `Observed Hazard: ${newReport.observed_hazard}\n`;
    prompt += `Severity: ${newReport.severity_rating}\n`;
    prompt += `Recommended Action: ${newReport.recommended_action}\n\n`;
    
    prompt += `Provide 1-2 specific tips to improve THIS new report. Focus on clarity, detail, and actionability. If the report is already well-written, say "This report is well-written" and nothing else.`;
    
    return prompt;
    // ========== WORKSHOP: PROMPT ENGINEERING END ==========
  }
}
