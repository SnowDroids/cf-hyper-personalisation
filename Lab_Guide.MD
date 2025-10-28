# Hyper Personalisation Lab Guide

## Prerequisites
- Git
- Node.js
- Cloudflare Account & Sandbox
- Node.js 22.x
- Internet connection

## About this project
This project contains a safety reporting application that allows users to submit safety reports and view them in a list. The application is built using Next.js and in intended to be deployed to Cloudflare Workers (though deployment to Cloudflare Containers is also possible). The database that stores all reports is Cloudflare D1. The application is hyper personalised using Cloudflare Workers and D1. 

## Lab objective
The objective of this lab is to understand how to use Cloudflare Durable Objects, Cloudflare AI Gateway, and Cloudflare Workers AI to develop a new AI powered hyper personalization feature.

What will the new feature do?
The new feature will use AI to analyze a user's past reports and make recommendations to the user on how to improve their report writing in future reports.

## Lab steps

### Step 0: Initial Project Setup

Before you begin, ensure you have all prerequisite software installed (Git, Node.js 22.x, and a Cloudflare account).

1. **Clone the repository**  
   Open a terminal and run the following command to clone the project to a directory of your choice:
   ```bash
   git clone https://github.com/SnowDroids/cf-hyper-personalisation.git
   ```

2. **Open the project in your code editor**  
   Navigate to the cloned project directory and open it in your preferred code editor.

3. **Install dependencies**  
   In a terminal within your code editor (or a separate terminal), navigate to the project directory and run:
   ```bash
   npm install
   ```
   This will download and install all required package dependencies.

4. **Run the typegen command**
   ```bash
   npm run cf-typegen
   ```
   This will generate the type definitions for the Cloudflare environment.

5. **Login to Cloudflare**  
   In your terminal, authenticate with Cloudflare by running:
   ```bash
   npx wrangler login
   ```
   Follow the prompts to complete the authentication process.

---

### Step 1: Database Setup

The application uses Cloudflare D1, a serverless SQL database. You'll need to create and configure the database before deploying.

1. **Create the D1 database**  
   In your terminal, run the following command to create a new D1 database:
   ```bash
   npx wrangler d1 create safety-reports-db
   ```
   
   This will output information including a `database_id`. Wrangler should offer to add it to the `wrangler.jsonc` file for you, which you can accept (recommended). But if it doesn't, or if you accidentally reject it, you can add it manually.
   
   Example output:
   ```jsonc
   {
    "d1_databases": [
        {
        "binding": "safety_reports_db",
        "database_name": "safety-reports-db",
        "database_id": "*******-****-****-****-************"
        }
    ]
   }
   ```

2. **Update the Wrangler configuration**  
   Open the `wrangler.jsonc` file in your project and locate the `d1_databases` section. Replace the placeholder `database_id` with the actual ID you copied from the previous step:
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "safety-reports-db",
       "database_id": "YOUR-ACTUAL-DATABASE-ID-HERE"
     }
   ]
   ```

3. **Initialize the database schema**  
   Run the following command to create the reports table in your local and remote databases:
   ```bash
   npx wrangler d1 execute safety-reports-db --file=./schema.sql
   npx wrangler d1 execute safety-reports-db --remote --file=./schema.sql
   ```
   
   **NOTE**: At a later step when we run this app locally, using the `npx wrangler preview` command, wrangler will connect to a local D1 database instance that it dynamically creates for us. At an even later step, when we actually deploy the app to Clouflare, this app will connect to the remote D1 database, which is hosted on Cloudflare's servers.

4. **Verify the databases setup**  
   Confirm that the table was created successfully by running:
   ```bash
   npx wrangler d1 execute safety-reports-db --command="SELECT * FROM reports"
   npx wrangler d1 execute safety-reports-db --remote --command="SELECT * FROM reports"
   ```
   
   You should see an empty result set (no errors), confirming the table exists.

---

### Step 2: Initial Deployment

1. **Preview the application**  
   Preview the application by running:
   ```bash
   npm run preview
   ```
   Wait for the preview to start. Wrangler will output the URL of your app that you can open in your browser. Just verify that you can browse to the app, create/submit a report, and view that report in the "Open Report Archive" section. If all that looks okay, proceed to the next step.

    **NOTE**: Currently projects created with wrangler or OpenNext don't support HSR (Hot Module Replacement). This means that you will need to restart the preview server every time you make changes to the code.

2. **Deploy the starter project**  
   Deploy the application to Cloudflare Workers by running:
   ```bash
   npx wrangler deploy
   ```
   Wait for the deployment to complete. Wrangler will output the URL of your deployed worker.
   <p>Be sure to take note of the name of the worker that was deployed as it will be used in the next step.


3. **View your deployed application**  
   - Open your browser and navigate to: [https://dash.cloudflare.com/?to=/:account/workers-and-pages](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
   - Locate and click on the worker you just deployed from the list
   - In the upper right corner of the page, click the blue **"Visit"** button to open your live application

![alt text](lab-guide-images/visit-btn.png)

---

### Step 3: Configure Cloudflare Bindings for AI Features

Now we'll add the necessary bindings to enable Workers AI and Durable Objects for our AI recommendation feature.

1. **Add Workers AI binding**  
   Open `wrangler.jsonc` and locate the section after `d1_databases` (around line 27). Add the following AI binding configuration:
   
   ```jsonc
   "ai": {
     "binding": "AI"
   },
   ```
   
   **What this does**: This binding gives your Worker access to Cloudflare Workers AI, which provides on-demand access to Large Language Models (LLMs) for AI inference.

2. **Add Durable Objects binding**  
   Right after the AI binding, add the Durable Objects configuration:
   
   ```jsonc
   "durable_objects": {
     "bindings": [
       {
         "name": "REPORT_ANALYZER",
         "class_name": "ReportAnalyzer",
         "script_name": "next-js-workers-test"
       }
     ]
   }
   ```
   
   **What this does**: Durable Objects provide stateful, consistent storage and coordination. We'll use this to track each inspector's reports and recommendations.
   
   **Important**: Make sure to add a comma after the `d1_databases` array closing bracket!

3. **Update TypeScript type definitions**  
   Open `src/types/cloudflare.d.ts` and add the new bindings to the `Env` interface (around line 6):
   
   ```typescript
   AI: Ai;
   REPORT_ANALYZER: DurableObjectNamespace;
   ```

4. **Regenerate type definitions**  
   Run the typegen command to update the generated types:
   ```bash
   npm run cf-typegen
   ```

---

### Step 4: Create the Durable Object

The Durable Object will manage state for each inspector and communicate with Workers AI.

1. **Create the Durable Object file**  
   Create a new file at `src/durable-objects/ReportAnalyzer.ts`

2. **Import dependencies and define types**  
   Add the following imports and type definitions at the top of the file:
   
   ```typescript
   import { DurableObject } from 'cloudflare:workers';

   interface ReportAnalyzerState {
     lastReportIds: number[];
     currentRecommendation: string | null;
     ignoredRecommendationHash: string | null;
     lastAnalyzedAt: number | null;
   }

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
   ```

3. **Create the class structure**  
   Define the `ReportAnalyzer` class that extends `DurableObject`:
   
   ```typescript
   export class ReportAnalyzer extends DurableObject {
     private state: ReportAnalyzerState;
     private inspectorName: string;

     constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
       super(ctx, env);
       
       this.state = {
         lastReportIds: [],
         currentRecommendation: null,
         ignoredRecommendationHash: null,
         lastAnalyzedAt: null,
       };
       
       this.inspectorName = '';
     }

     async fetch(request: Request): Promise<Response> {
       // TODO: Implement request routing
     }
   }
   ```

4. **Implement the fetch handler**  
   Inside the `fetch` method, add routing logic to handle GET and POST requests:
   
   ```typescript
   const url = new URL(request.url);
   const path = url.pathname;

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

   return new Response('Not found', { status: 404 });
   ```

5. **Implement state management methods**  
   Add methods to load and save state:
   
   ```typescript
   private async loadState(): Promise<void> {
     const stored = await this.ctx.storage.get<ReportAnalyzerState>('state');
     if (stored) {
       this.state = stored;
     }
   }

   private async saveState(): Promise<void> {
     await this.ctx.storage.put('state', this.state);
   }
   ```

6. **Query D1 for recent reports**  
   Add a method to fetch the last 2 reports for an inspector:
   
   ```typescript
   private async fetchRecentReports(): Promise<Report[]> {
     const db = this.env.DB;
     
     const { results } = await db
       .prepare(
         'SELECT * FROM reports WHERE inspector_name = ? ORDER BY created_at DESC LIMIT 2'
       )
       .bind(this.inspectorName)
       .all<Report>();
     
     console.log(`Found ${results.length} reports for ${this.inspectorName}`);
     return results;
   }
   ```
   
   **Hint**: This uses the D1 binding (`this.env.DB`) to query the database. The `bind()` method safely passes parameters to prevent SQL injection.

7. **Build the AI prompt**  
   Create a method to format reports into a prompt for the LLM:
   
   ```typescript
   private buildAnalysisPrompt(reports: Report[]): string {
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
   }
   ```

8. **Call Workers AI**  
   Implement the method that calls the LLM:
   
   ```typescript
   private async analyzeReports(reports: Report[]): Promise<string> {
     const prompt = this.buildAnalysisPrompt(reports);
     
     try {
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
       
       const recommendation = response.response || 'Unable to generate recommendation at this time.';
       console.log('AI recommendation generated:', recommendation.substring(0, 100));
       
       return recommendation;
     } catch (error) {
       console.error('Error calling Workers AI:', error);
       return 'Unable to generate recommendation at this time.';
     }
   }
   ```
   
   **What this does**: 
   - Uses the `@cf/meta/llama-3-8b-instruct` model (Llama 3 8B)
   - Sends a system message to set the AI's role
   - Sends the formatted prompt as a user message
   - Returns the AI's response

9. **Implement the main recommendation logic**  
   Add the `getRecommendation` method that orchestrates everything:
   
   ```typescript
   private async getRecommendation(): Promise<string | null> {
     // Check if we have a current recommendation that hasn't been ignored
     if (this.state.currentRecommendation && !this.state.ignoredRecommendationHash) {
       console.log('Returning cached recommendation');
       return this.state.currentRecommendation;
     }

     // Fetch recent reports for this inspector
     const reports = await this.fetchRecentReports();
     
     // Need at least 2 reports to generate recommendations
     if (reports.length < 2) {
       console.log(`Not enough reports for ${this.inspectorName}: ${reports.length} found`);
       return null;
     }

     // Check if these are new reports
     const currentReportIds = reports.map(r => r.id);
     const hasNewReports = !this.arraysEqual(currentReportIds, this.state.lastReportIds);
     
     if (!hasNewReports && this.state.currentRecommendation) {
       console.log('No new reports, returning cached recommendation');
       return this.state.currentRecommendation;
     }

     // Generate new recommendation using Workers AI
     console.log('Generating new recommendation for', this.inspectorName);
     const recommendation = await this.analyzeReports(reports);
     
     // Update state
     this.state.currentRecommendation = recommendation;
     this.state.lastReportIds = currentReportIds;
     this.state.lastAnalyzedAt = Date.now();
     this.state.ignoredRecommendationHash = null;
     
     await this.saveState();
     
     return recommendation;
   }
   ```

10. **Add helper methods**  
    Add these utility methods at the end of the class:
    
    ```typescript
    private async ignoreRecommendation(): Promise<void> {
      if (this.state.currentRecommendation) {
        this.state.ignoredRecommendationHash = this.simpleHash(this.state.currentRecommendation);
        await this.saveState();
        console.log('Recommendation ignored for', this.inspectorName);
      }
    }

    private simpleHash(str: string): string {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return hash.toString();
    }

    private arraysEqual(a: number[], b: number[]): boolean {
      if (a.length !== b.length) return false;
      return a.every((val, index) => val === b[index]);
    }
    ```

11. **Export the Durable Object**  
    Open `open-next.config.ts` and add this export at the end of the file:
    
    ```typescript
    export { ReportAnalyzer } from './src/durable-objects/ReportAnalyzer';
    ```
    
    **Why**: OpenNext needs to know about the Durable Object class so it can include it in the worker bundle.

---

### Step 5: Create API Routes

Now we'll create Next.js API routes that communicate with the Durable Object.

1. **Create the GET recommendations endpoint**  
   Create `src/app/api/recommendations/route.ts` with the following content:
   
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { getCloudflareContext } from '@opennextjs/cloudflare';

   export async function GET(request: NextRequest) {
     try {
       const { env } = getCloudflareContext();
       
       const { searchParams } = new URL(request.url);
       const inspector = searchParams.get('inspector');
       
       if (!inspector) {
         return NextResponse.json(
           { error: 'Inspector name is required' },
           { status: 400 }
         );
       }
       
       // Get Durable Object stub
       const id = env.REPORT_ANALYZER.idFromName(inspector);
       const stub = env.REPORT_ANALYZER.get(id);
       
       // Forward request to Durable Object
       const doUrl = new URL('http://internal/get-recommendation');
       doUrl.searchParams.set('inspector', inspector);
       
       const response = await stub.fetch(doUrl.toString());
       const data = await response.json() as { recommendation: string | null };
       
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
   ```
   
   **Key concepts**:
   - `getCloudflareContext()` provides access to Cloudflare bindings in Next.js
   - `idFromName()` creates a consistent ID for each inspector (same inspector = same Durable Object instance)
   - `stub.fetch()` sends a request to the Durable Object

2. **Create the POST ignore endpoint**  
   Create `src/app/api/recommendations/ignore/route.ts`:
   
   ```typescript
   import { NextRequest, NextResponse } from 'next/server';
   import { getCloudflareContext } from '@opennextjs/cloudflare';

   export async function POST(request: NextRequest) {
     try {
       const { env } = getCloudflareContext();
       
       const body = await request.json() as { inspector?: string };
       const inspector = body.inspector;
       
       if (!inspector) {
         return NextResponse.json(
           { error: 'Inspector name is required' },
           { status: 400 }
         );
       }
       
       const id = env.REPORT_ANALYZER.idFromName(inspector);
       const stub = env.REPORT_ANALYZER.get(id);
       
       const doUrl = new URL('http://internal/ignore-recommendation');
       doUrl.searchParams.set('inspector', inspector);
       
       const response = await stub.fetch(doUrl.toString(), {
         method: 'POST',
       });
       
       const data = await response.json() as { success: boolean };
       
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
   ```

---

### Step 6: Build Frontend Components

Now we'll create the UI components for displaying recommendations.

1. **Create the recommendation button**  
   Create `src/components/RecommendationButton.tsx`:
   
   ```typescript
   'use client';

   interface RecommendationButtonProps {
     onClick: () => void;
   }

   export default function RecommendationButton({ onClick }: RecommendationButtonProps) {
     return (
       <button
         onClick={onClick}
         className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
         aria-label="View AI writing recommendations"
       >
         {/* Lightbulb Icon */}
         <svg
           className="w-8 h-8"
           fill="none"
           viewBox="0 0 24 24"
           stroke="currentColor"
         >
           <path
             strokeLinecap="round"
             strokeLinejoin="round"
             strokeWidth={2}
             d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
           />
         </svg>
         
         {/* Badge indicator */}
         <span className="absolute -top-1 -right-1 flex h-5 w-5">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-5 w-5 bg-yellow-500 items-center justify-center text-xs font-bold">
             !
           </span>
         </span>
         
         {/* Tooltip */}
         <span className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
           AI Writing Tips Available
         </span>
       </button>
     );
   }
   ```

2. **Create the recommendation modal**  
   Create `src/components/RecommendationModal.tsx`:
   
   ```typescript
   'use client';

   import { useEffect } from 'react';

   interface RecommendationModalProps {
     isOpen: boolean;
     recommendation: string | null;
     onClose: () => void;
     onIgnore: () => void;
   }

   export default function RecommendationModal({
     isOpen,
     recommendation,
     onClose,
     onIgnore,
   }: RecommendationModalProps) {
     // Close on Escape key
     useEffect(() => {
       const handleEscape = (e: KeyboardEvent) => {
         if (e.key === 'Escape' && isOpen) {
           onClose();
         }
       };
       
       window.addEventListener('keydown', handleEscape);
       return () => window.removeEventListener('keydown', handleEscape);
     }, [isOpen, onClose]);

     // Prevent body scroll when modal is open
     useEffect(() => {
       if (isOpen) {
         document.body.style.overflow = 'hidden';
       } else {
         document.body.style.overflow = 'unset';
       }
       
       return () => {
         document.body.style.overflow = 'unset';
       };
     }, [isOpen]);

     if (!isOpen || !recommendation) {
       return null;
     }

     return (
       <>
         {/* Backdrop */}
         <div
           className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
           onClick={onClose}
           aria-hidden="true"
         />

         {/* Modal */}
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div
             className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
             onClick={(e) => e.stopPropagation()}
           >
             {/* Header with gradient */}
             <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-xl">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="bg-white bg-opacity-20 rounded-full p-2">
                     <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                         d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                     </svg>
                   </div>
                   <h2 className="text-2xl font-bold">AI Writing Tips</h2>
                 </div>
                 
                 <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
             </div>

             {/* Content */}
             <div className="p-6">
               <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                 <p className="text-sm text-blue-800">
                   Based on your recent safety reports, here are some suggestions to improve your writing:
                 </p>
               </div>

               <div className="prose prose-lg max-w-none">
                 <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                   {recommendation}
                 </p>
               </div>
             </div>

             {/* Footer */}
             <div className="bg-gray-50 px-6 py-4 rounded-b-xl flex gap-3 justify-end">
               <button
                 onClick={onClose}
                 className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
               >
                 Close
               </button>
               <button
                 onClick={onIgnore}
                 className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
               >
                 Ignore & Don't Show Again
               </button>
             </div>
           </div>
         </div>
       </>
     );
   }
   ```

---

### Step 7: Integrate into Main Page

Finally, we'll add the recommendation feature to the main page.

1. **Add imports**  
   Open `src/app/page.tsx` and add these imports after the existing imports (around line 4):
   
   ```typescript
   import RecommendationButton from '@/components/RecommendationButton';
   import RecommendationModal from '@/components/RecommendationModal';
   ```
   
   Also update the React import to include `useEffect`:
   ```typescript
   import { useState, FormEvent, useEffect } from 'react';
   ```

2. **Add state variables**  
   After the existing state declarations (around line 53), add:
   
   ```typescript
   const [recommendation, setRecommendation] = useState<string | null>(null);
   const [showRecommendationModal, setShowRecommendationModal] = useState(false);
   const [currentInspector, setCurrentInspector] = useState<string | null>(null);
   ```

3. **Add recommendation fetching logic**  
   After the state declarations, add this `useEffect` hook:
   
   ```typescript
   useEffect(() => {
     const fetchRecommendation = async () => {
       const storedInspector = localStorage.getItem('currentInspector');
       if (!storedInspector) {
         return;
       }

       setCurrentInspector(storedInspector);

       try {
         const response = await fetch(
           `/api/recommendations?inspector=${encodeURIComponent(storedInspector)}`
         );
         const data = await response.json() as { recommendation: string | null };
         
         if (data.recommendation) {
           setRecommendation(data.recommendation);
         }
       } catch (error) {
         console.error('Error fetching recommendation:', error);
       }
     };

     fetchRecommendation();
   }, []);
   ```

4. **Add ignore handler**  
   Add this function after the `useEffect`:
   
   ```typescript
   const handleIgnoreRecommendation = async () => {
     if (!currentInspector) return;

     try {
       await fetch('/api/recommendations/ignore', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ inspector: currentInspector }),
       });

       setRecommendation(null);
       setShowRecommendationModal(false);
     } catch (error) {
       console.error('Error ignoring recommendation:', error);
     }
   };
   ```

5. **Track inspector selection**  
   In the `handleInputChange` function, find the section that handles `inspectorName` (around line 119). Add this code inside that if block:
   
   ```typescript
   if (value) {
     localStorage.setItem('currentInspector', value);
     setCurrentInspector(value);
   }
   ```

6. **Add UI components**  
   At the end of the component's JSX, just before the closing `</div>` (around line 451), add:
   
   ```typescript
   {/* Recommendation Button */}
   {recommendation && (
     <RecommendationButton onClick={() => setShowRecommendationModal(true)} />
   )}

   {/* Recommendation Modal */}
   <RecommendationModal
     isOpen={showRecommendationModal}
     recommendation={recommendation}
     onClose={() => setShowRecommendationModal(false)}
     onIgnore={handleIgnoreRecommendation}
   />
   ```

---

### Step 8: Test the AI Recommendation Feature

Now let's test everything works!

1. **Start the preview server**  
   ```bash
   npm run preview
   ```
   
   Wait for the server to start and note the URL.

2. **Submit your first report**  
   - Open the app in your browser
   - Select an inspector name (e.g., "Safety Steve")
   - Fill out and submit a safety report
   - **Note**: You won't see recommendations yet (need 2 reports minimum)

3. **Submit a second report**  
   - Select the **same inspector name**
   - Fill out and submit another report
   - Refresh the page

4. **View the recommendation**  
   - You should now see a floating lightbulb button in the bottom-right corner
   - Click it to view the AI-generated writing tips
   - Try the "Close" and "Ignore" buttons

5. **Test the ignore functionality**  
   - Click "Ignore & Don't Show Again"
   - Refresh the page
   - The recommendation button should not appear (recommendation is ignored)

6. **Test with a new report**  
   - Submit a third report with the same inspector
   - Refresh the page
   - A new recommendation should appear (based on the latest 2 reports)

---

### Step 9: Deploy to Production

Once everything works locally, deploy to Cloudflare!

1. **Deploy the application**  
   ```bash
   npm run deploy
   ```

2. **Test the deployed version**  
   - Visit your worker's URL
   - Submit 2 reports with the same inspector name
   - Verify the recommendation feature works in production

---

## Understanding the Architecture

### How It All Works Together

1. **User submits reports** → Stored in D1 database
2. **User selects inspector** → Name stored in localStorage
3. **Page loads** → Checks for recommendations via API
4. **API route** → Gets Durable Object stub for inspector
5. **Durable Object**:
   - Queries D1 for last 2 reports
   - Checks if recommendation needed
   - Calls Workers AI if needed
   - Returns recommendation
6. **Frontend** → Shows floating button if recommendation exists
7. **User clicks button** → Modal displays AI tips
8. **User ignores** → Durable Object marks as ignored

### Key Cloudflare Technologies Used

- **Workers AI**: On-demand LLM inference (Llama 3 8B model)
- **Durable Objects**: Stateful coordination and caching
- **D1**: Serverless SQL database for reports
- **Workers**: Edge compute for API routes
- **OpenNext**: Next.js adapter for Cloudflare

---

## Troubleshooting

**Issue**: Type errors about `AI` or `REPORT_ANALYZER`  
**Solution**: Run `npm run cf-typegen` to regenerate types

**Issue**: Recommendation button doesn't appear  
**Solution**: Ensure you've submitted 2+ reports with the same inspector name

**Issue**: "Durable Object not found" error  
**Solution**: Check that `open-next.config.ts` exports the `ReportAnalyzer` class

**Issue**: Workers AI returns errors  
**Solution**: Verify the AI binding is correctly configured in `wrangler.jsonc`

---

## Next Steps

Congratulations! You've built an AI-powered hyper-personalization feature using Cloudflare's edge platform. 

**Ideas to extend this project**:
- Add more sophisticated prompt engineering
- Track recommendation acceptance/rejection metrics
- Analyze patterns across all inspectors
- Add different recommendation types (safety tips, formatting, etc.)
- Implement A/B testing for different prompts

---
