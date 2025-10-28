# Hyper Personalisation Lab Guide

## Prerequisites
- Git
- Node.js 22.x
- Cloudflare Account
- Internet connection

## About this project
This project contains a safety reporting application built with Next.js and deployed to Cloudflare Workers. The database is Cloudflare D1. In this lab, you'll add an AI-powered feature that analyzes safety reports and provides writing improvement suggestions in real-time as users submit reports.

## Lab objective
Learn how to use Cloudflare Durable Objects and Workers AI to build an AI-powered hyper-personalization feature that provides contextual writing recommendations based on a user's previous reports.

## What you'll build
An AI writing coach that:
- Analyzes new safety reports before submission
- Compares them to the inspector's previous 1-2 reports
- Provides actionable writing improvement suggestions
- Allows users to edit their report or submit anyway

---

## Lab Steps

### Step 0: Initial Project Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/SnowDroids/cf-hyper-personalisation.git
   cd cf-hyper-personalisation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Generate TypeScript types**
   ```bash
   npm run cf-typegen
   ```

4. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

---

### Step 1: Database Setup

- **1.1: Create the D1 database**
   ```bash
   npx wrangler d1 create safety-reports-db
   ```
   
   Copy the `database_id` from the output. Wrangler may offer to add it to `wrangler.jsonc` automatically.

- **1.2: Update wrangler.jsonc** (if needed)
   
   Locate the `d1_databases` section and ensure your database ID is present:
   ```jsonc
   "d1_databases": [
     {
       "binding": "DB",
       "database_name": "safety-reports-db",
       "database_id": "YOUR-DATABASE-ID-HERE"
     }
   ]
   ```

- **1.3: Initialize the database schema**
   ```bash
   npx wrangler d1 execute safety-reports-db --file=./schema.sql
   npx wrangler d1 execute safety-reports-db --remote --file=./schema.sql
   ```

- **1.4: Verify setup**
   ```bash
   npx wrangler d1 execute safety-reports-db --command="SELECT * FROM reports"
   ```

---

### Step 2: Initial Deployment

- **2.1: Preview the application**
   ```bash
   npm run preview
   ```
   
   Test that you can create and view reports. Press `Ctrl+C` to stop when done.

- **2.2: Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```
   
   Note the worker name from the output (you'll need it in the next step).

- **2.3: View your deployed app**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/?to=/:account/workers-and-pages)
   - Click your worker
   - Click the blue **"Visit"** button

---

### Step 3: Configure Cloudflare Bindings

Now we'll add bindings for Workers AI and Durable Objects.

- **3.1: Add Workers AI binding**
   
   Open `wrangler.jsonc` and add after the `d1_databases` section:
   ```jsonc
   "ai": {
     "binding": "AI"
   },
   ```

- **3.2: Add Durable Objects binding**
   
   Add after the AI binding:
   ```jsonc
   "durable_objects": {
     "bindings": [
       {
         "name": "REPORT_ANALYZER",
         "class_name": "ReportAnalyzer"
       }
     ]
   },
   "migrations": [
     {
       "tag": "v1",
       "new_classes": ["ReportAnalyzer"]
     }
   ]
   ```

- **3.3: Update TypeScript types**
   
   Open `src/types/cloudflare.d.ts` and add to the `Env` interface:
   ```typescript
   AI: Ai;
   REPORT_ANALYZER: DurableObjectNamespace;
   ```

- **3.4: Regenerate types**
   ```bash
   npm run cf-typegen
   ```

---

### Step 4: Create the Durable Object

The Durable Object will analyze reports using Workers AI.
Please note that all steps here in "Step 4" are in the context of the `ReportAnalyzer.ts` file, except for steps 4.6.

- **4.1: Rename the ReportAnalyzer.ts.example file**
   
   Remove ".example" from `src/durable-objects/ReportAnalyzer.ts.example` to `src/durable-objects/ReportAnalyzer.ts`

- **4.2: Uncomment the code to implement the Durable Object**
   
   The file should:
   1. Import `DurableObject` from `'cloudflare:workers'`
   2. Define a `Report` interface with fields: `id`, `date_of_inspection`, `location`, `inspector_name`, `observed_hazard`, `severity_rating`, `recommended_action`, `created_at`
   3. Implement a `fetch()` method, in the provided `ReportAnalyzer` class, that handles POST requests to `/analyze-report`

- **4.3: Query D1 for previous reports**
   
   Create a `fetchPreviousReports()` method that:
   - Uses `this.env.DB` to access the database
   - Queries for the last 2 reports: `SELECT * FROM reports WHERE inspector_name = ? ORDER BY created_at DESC LIMIT 2`
   - Uses `.bind()` to safely pass the inspector name
   - Returns the results as an array

- **4.4: Build the AI prompt**
   
   Create a `buildAnalysisPrompt()` method that:
   - Takes the new report and previous reports as parameters
   - Formats them into a clear prompt for the LLM
   - Includes context from previous reports (if any)
   - Asks the AI to provide 1-2 specific improvement tips
   - Instructs the AI to return null if the report is already well-written

- **4.5: Call Workers AI**
   
   Create an `analyzeReport()` method that:
   - Builds the prompt using `buildAnalysisPrompt()`
   - Calls `this.env.AI.run('@cf/meta/llama-3-8b-instruct', { messages: [...] })`
   - Uses a system message to set the AI's role as a safety report writing coach
   - Returns the recommendation or null
   - Filters out non-actionable responses (e.g., "well-written", "no improvements")

- **4.6: Export the Durable Object**
   
   In the existing `worker.ts` file, you'll need to export the `ReportAnalyzer` class. 

---

### Step 5: Create the Analysis API Route

Create an API route that forwards reports to the Durable Object for analysis.

- **5.1: Rename the example toute.ts file**
   
   Rename `src/app/api/reports/analyze/route.ts.example` to `src/app/api/reports/analyze/route.ts`

- **5.2: Implement the POST handler**
   
   The handler should:
   - Import `NextRequest`, `NextResponse` from `'next/server'`
   - Import `getCloudflareContext` from `'@opennextjs/cloudflare'`
   - Parse the report data from the request body
   - Get the Durable Object stub: `env.REPORT_ANALYZER.idFromName(inspectorName)`
   - Forward the request to the DO: `stub.fetch('http://do/analyze-report', { method: 'POST', body: ... })`
   - Return the recommendation

**Key concepts**:
- `getCloudflareContext()` provides access to Cloudflare bindings in Next.js
- `idFromName()` ensures the same inspector always gets the same DO instance
- The DO URL can be any valid URL format (e.g., `http://do/...`)

---

### Step 6: Create the Recommendation Modal

Build a modal that displays AI recommendations with "Edit Report" and "Submit Anyway" buttons.

- **6.1: Create the file**
   
   Create `src/components/RecommendationModal.tsx`

- **6.2: Component structure**
   
   The modal should:
   - Accept props: `isOpen`, `recommendation`, `onEdit`, `onSubmitAnyway`
   - Show a backdrop that closes the modal when clicked
   - Display the recommendation text
   - Have two buttons:
     - "Edit Report" - calls `onEdit()` to close modal and let user edit
     - "Submit Anyway" - calls `onSubmitAnyway()` to submit despite recommendations
   - Close on Escape key press
   - Prevent body scroll when open

---

### Step 7: Integrate into Main Page

Update the main page to analyze reports before submission.

- **7.1: Add import to page.tsx**
   - Import the recommendationModal component.

- **7.2: Add state**
   
   Add these state variables:
   ```typescript
   const [recommendation, setRecommendation] = useState<string | null>(null);
   const [showRecommendationModal, setShowRecommendationModal] = useState(false);
   ```
   - **7.2.1: Update the submit handler**
      - Update `submitForm()` to call `setShowRecommendationModal(false)` and `setRecommendation(null)` after clearing the form

- **7.3: Modify the submit handler**
   
   Update `handleSubmit` to:
   - Call `/api/reports/analyze` instead of directly submitting
   - If a recommendation is returned, show the modal
   - If no recommendation, proceed with normal submission

- **7.4: Add helper functions**
   
   Create:
   - `handleEditReport()` - Closes modal, preserves form data
   - `handleSubmitAnyway()` - Calls `submitReport()` despite recommendations

- **7.5: Add the modal to JSX**
   
   At the end of the component, before the closing `</div>`:
   ```typescript
   <RecommendationModal
     isOpen={showRecommendationModal}
     recommendation={recommendation || ''}
     onEdit={handleEditReport}
     onSubmitAnyway={handleSubmitAnyway}
   />
   ```

---

### Step 8: Test the Feature

- **8.1: Start the preview server**
   ```bash
   npm run preview
   ```

- **8.2: Submit a report**
   - Fill out the form completely
   - Select an inspector name
   - Click "Submit Report"
   - Since there are no previous reports, it should submit normally

- **8.3: Submit a second report**
   - Use the **same inspector name**
   - Fill out the form with different content
   - Click "Submit Report"
   - You should see the AI recommendation modal appear

- **8.4: Test the modal actions**
   - Try "Edit Report" - modal closes, form data is preserved
   - Submit again and try "Submit Anyway" - report is saved despite recommendations

---

### Step 9: Deploy updated code to Production

- **9.1:Deploy**
   ```bash
   npm run deploy
   ```

- **9.2: Test in production**
   - Visit your worker's URL
   - Submit 2 reports with the same inspector
   - Verify the AI recommendations work

---

## Architecture Overview

### How It Works

1. **User fills out report** → Clicks "Submit Report"
2. **Frontend calls** → `/api/reports/analyze`
3. **API route** → Gets Durable Object stub for inspector
4. **Durable Object**:
   - Queries D1 for previous 1-2 reports
   - Builds prompt with context
   - Calls Workers AI for analysis
   - Returns recommendation (or null)
5. **Frontend**:
   - If recommendation exists → Shows modal
   - If no recommendation → Submits directly
6. **User chooses**:
   - Edit Report → Modal closes, can revise
   - Submit Anyway → Report saved to D1

### Key Technologies

- **Next.js**: React framework for the UI
- **Cloudflare Workers**: Serverless compute platform
- **D1**: Serverless SQL database
- **Durable Objects**: Stateful, consistent coordination
- **Workers AI**: On-demand LLM inference (Llama 3 8B)
- **OpenNext**: Adapter to deploy Next.js to Cloudflare

### Why Durable Objects?

- **Consistency**: Each inspector gets the same DO instance
- **Low Latency**: DO is colocated with the worker
- **Stateful**: Can cache previous analysis results (future enhancement)
- **Scalable**: Automatically scales per inspector

---

## Troubleshooting

### Build errors
- Run `npm run cf-typegen` to regenerate types
- Check that all imports are correct
- Verify `worker.ts` exports the Durable Object

### Deployment errors
- Ensure `database_id` in `wrangler.jsonc` is correct
- Verify worker name in Durable Objects binding matches deployed worker
- Check that migrations are configured

### No recommendations appearing
- Verify at least 2 reports exist for the same inspector
- Check browser console for errors
- Look at worker logs in Cloudflare Dashboard

### AI returns "well-written"
- This is expected for good reports!
- Try submitting reports with obvious issues (typos, vague descriptions)
- The AI is instructed to only provide feedback when improvements are needed

---

## Next Steps

Enhance the feature with:
- **Caching**: Store analysis results in DO storage to avoid re-analyzing
- **Rate limiting**: Limit AI calls per inspector
- **Multiple models**: Compare different LLMs
- **AI Gateway**: Add caching and analytics with Cloudflare AI Gateway
- **Feedback loop**: Let users rate recommendations to improve prompts

---

## Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Durable Objects Docs](https://developers.cloudflare.com/durable-objects/)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [D1 Database Docs](https://developers.cloudflare.com/d1/)
- [OpenNext Docs](https://opennext.js.org/)
