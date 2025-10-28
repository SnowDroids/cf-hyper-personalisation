/**
 * ReportAnalyzer Durable Object
 * 
 * This Durable Object manages the state for AI-powered report recommendations.
 * Each instance is tied to a specific inspector and stores:
 * - Last analyzed report IDs
 * - Current recommendation text
 * - Ignored recommendation hash
 * 
 * Workshop participants will implement the core logic for:
 * 1. Querying D1 for recent reports
 * 2. Calling Workers AI to generate recommendations
 * 3. Managing recommendation state
 */

// Import DurableObject from cloudflare:workers
import { DurableObject } from 'cloudflare:workers';

// ========== WORKSHOP: TYPE DEFINITIONS START ==========
// Interface for the state stored in Durable Object storage
interface ReportAnalyzerState {
  lastReportIds: number[];
  currentRecommendation: string | null;
  ignoredRecommendationHash: string | null;
  lastAnalyzedAt: number | null;
}

// Interface for a report from the database
interface Report {
  id: number;
  date_of_inspection: string;
  location: string;
  inspector_name: string;
  observed_hazard: string;
  severity_rating: string;
  recommended_action: string;
  digital_signature: string;
  created_at: string;
}
// ========== WORKSHOP: TYPE DEFINITIONS END ==========

export class ReportAnalyzer extends DurableObject {
  private state: ReportAnalyzerState;
  private inspectorName: string;

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    
    // Initialize state with default values
    this.state = {
      lastReportIds: [],
      currentRecommendation: null,
      ignoredRecommendationHash: null,
      lastAnalyzedAt: null,
    };
    
    // Inspector name will be set from the request
    this.inspectorName = '';
  }

  /**
   * Main fetch handler for the Durable Object
   * Handles requests from the API routes
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ========== WORKSHOP: REQUEST ROUTING START ==========
    // Route requests to appropriate handlers
    if (path === '/get-recommendation' && request.method === 'GET') {
      const inspector = url.searchParams.get('inspector');
      if (!inspector) {
        return new Response(JSON.stringify({ error: 'Inspector name required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      this.inspectorName = inspector;
      await this.loadState();
      
      const recommendation = await this.getRecommendation();
      return new Response(JSON.stringify({ recommendation }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (path === '/ignore-recommendation' && request.method === 'POST') {
      const inspector = url.searchParams.get('inspector');
      if (!inspector) {
        return new Response(JSON.stringify({ error: 'Inspector name required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      this.inspectorName = inspector;
      await this.loadState();
      await this.ignoreRecommendation();
      
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // ========== WORKSHOP: REQUEST ROUTING END ==========

    return new Response('Not found', { status: 404 });
  }

  /**
   * Load state from Durable Object storage
   */
  private async loadState(): Promise<void> {
    // ========== WORKSHOP: STATE LOADING START ==========
    const stored = await this.ctx.storage.get('state') as ReportAnalyzerState | undefined;
    if (stored) {
      this.state = stored;
    }
    // ========== WORKSHOP: STATE LOADING END ==========
  }

  /**
   * Save state to Durable Object storage
   */
  private async saveState(): Promise<void> {
    // ========== WORKSHOP: STATE SAVING START ==========
    await this.ctx.storage.put('state', this.state);
    // ========== WORKSHOP: STATE SAVING END ==========
  }

  /**
   * Get or generate a recommendation for the inspector
   * This is the main logic that:
   * 1. Checks if we have a current recommendation
   * 2. Fetches recent reports from D1
   * 3. Calls Workers AI if needed
   * 4. Returns the recommendation
   */
  private async getRecommendation(): Promise<string | null> {
    // ========== WORKSHOP: RECOMMENDATION LOGIC START ==========
    
    // Step 1: Check if we have a current recommendation that hasn't been ignored
    if (this.state.currentRecommendation && !this.state.ignoredRecommendationHash) {
      console.log('Returning cached recommendation');
      return this.state.currentRecommendation;
    }

    // Step 2: Fetch recent reports for this inspector from D1
    const reports = await this.fetchRecentReports();
    
    // If no reports or only 1 report, don't generate recommendations yet
    if (reports.length < 2) {
      console.log(`Not enough reports for ${this.inspectorName}: ${reports.length} found`);
      return null;
    }

    // Step 3: Check if these are new reports (different from last analyzed)
    const currentReportIds = reports.map(r => r.id);
    const hasNewReports = !this.arraysEqual(currentReportIds, this.state.lastReportIds);
    
    if (!hasNewReports && this.state.currentRecommendation) {
      console.log('No new reports, returning cached recommendation');
      return this.state.currentRecommendation;
    }

    // Step 4: Generate new recommendation using Workers AI
    console.log('Generating new recommendation for', this.inspectorName);
    const recommendation = await this.analyzeReports(reports);
    
    // Step 5: Update state with new recommendation
    this.state.currentRecommendation = recommendation;
    this.state.lastReportIds = currentReportIds;
    this.state.lastAnalyzedAt = Date.now();
    this.state.ignoredRecommendationHash = null; // Clear ignored status for new recommendation
    
    await this.saveState();
    
    return recommendation;
    // ========== WORKSHOP: RECOMMENDATION LOGIC END ==========
  }

  /**
   * Fetch the most recent reports for this inspector from D1
   * Returns up to 2 reports ordered by creation date
   */
  private async fetchRecentReports(): Promise<Report[]> {
    // ========== WORKSHOP: D1 QUERY START ==========
    // HINT: Use this.env.DB to access the D1 database
    // HINT: Query for reports WHERE inspector_name = ? ORDER BY created_at DESC LIMIT 2
    // HINT: Use .bind() to safely pass the inspector name parameter
    
    const db = this.env.DB;
    
    const result = await db
      .prepare(
        'SELECT * FROM reports WHERE inspector_name = ? ORDER BY created_at DESC LIMIT 2'
      )
      .bind(this.inspectorName)
      .all();
    
    const results = result.results as unknown as Report[];
    
    console.log(`Found ${results.length} reports for ${this.inspectorName}`);
    return results;
    // ========== WORKSHOP: D1 QUERY END ==========
  }

  /**
   * Analyze reports using Workers AI and generate recommendations
   * This calls the Cloudflare Workers AI API with a specialized prompt
   */
  private async analyzeReports(reports: Report[]): Promise<string> {
    // ========== WORKSHOP: WORKERS AI INTEGRATION START ==========
    // HINT: Use this.env.AI.run() to call Workers AI
    // HINT: Model to use: '@cf/meta/llama-3-8b-instruct'
    // HINT: Construct a prompt that includes report details and asks for writing tips
    
    // Build the prompt with report details
    const prompt = this.buildAnalysisPrompt(reports);
    
    try {
      // Call Workers AI
      const response = await this.env.AI.run('@cf/meta/llama-3-8b-instruct', {
        messages: [
          {
            role: 'system',
            content: 'You are a safety report writing coach. Provide concise, actionable feedback to help inspectors improve their report writing. Keep responses brief (2-3 sentences max).',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }) as { response?: string };
      
      // Extract and return the recommendation
      const recommendation = response.response || 'Unable to generate recommendation at this time.';
      console.log('AI recommendation generated:', recommendation.substring(0, 100));
      
      return recommendation;
    } catch (error) {
      console.error('Error calling Workers AI:', error);
      return 'Unable to generate recommendation at this time.';
    }
    // ========== WORKSHOP: WORKERS AI INTEGRATION END ==========
  }

  /**
   * Build the analysis prompt for Workers AI
   * Formats the reports into a readable structure for the LLM
   */
  private buildAnalysisPrompt(reports: Report[]): string {
    // ========== WORKSHOP: PROMPT ENGINEERING START ==========
    // HINT: Create a clear, structured prompt that includes:
    // - Context about what you want the AI to do
    // - The report details (hazard, severity, recommended action)
    // - Clear instructions for the output format
    
    let prompt = `Analyze these safety inspection reports and provide 1-2 specific, actionable tips to help the inspector improve their report writing. Focus on clarity, detail, and professionalism.\n\n`;
    
    reports.forEach((report, index) => {
      prompt += `Report ${index + 1}:\n`;
      prompt += `Date: ${report.date_of_inspection}\n`;
      prompt += `Location: ${report.location}\n`;
      prompt += `Observed Hazard: ${report.observed_hazard}\n`;
      prompt += `Severity: ${report.severity_rating}\n`;
      prompt += `Recommended Action: ${report.recommended_action}\n\n`;
    });
    
    prompt += `Provide concise, encouraging feedback in 2-3 sentences. Be specific and actionable.`;
    
    return prompt;
    // ========== WORKSHOP: PROMPT ENGINEERING END ==========
  }

  /**
   * Mark the current recommendation as ignored
   * This prevents it from being shown again until new reports are submitted
   */
  private async ignoreRecommendation(): Promise<void> {
    // ========== WORKSHOP: IGNORE LOGIC START ==========
    // HINT: Create a hash of the current recommendation to track it
    // HINT: Update state and save to storage
    
    if (this.state.currentRecommendation) {
      // Create a simple hash of the recommendation
      this.state.ignoredRecommendationHash = this.simpleHash(this.state.currentRecommendation);
      await this.saveState();
      console.log('Recommendation ignored for', this.inspectorName);
    }
    // ========== WORKSHOP: IGNORE LOGIC END ==========
  }

  /**
   * Helper: Create a simple hash of a string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Helper: Compare two arrays for equality
   */
  private arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }
}
