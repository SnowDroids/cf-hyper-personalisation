# Safety Inspection Reporting System - Setup Instructions

## Overview
This is a fully functional Safety Inspection Reporting application built with Next.js, React, Tailwind CSS, and Cloudflare D1 database integration.

## Features Implemented

### ✅ Core Application
- **Safety Report Form** with three sections:
  1. Basic Information (Date, Location, Inspector Name)
  2. Observation Details (Hazard description, Severity rating, Recommended actions)
  3. Sign-Off (Digital signature with auto-population)

### ✅ UI/UX Features
- Fully responsive design with Tailwind CSS
- Professional gradient background and modern styling
- Form validation with required field indicators
- Success/error message display
- Loading states during submission
- Cheeky predefined locations and inspector names

### ✅ Report Archive Modal
- Separate component in `src/components/ReportArchiveModal.tsx`
- Two-column layout (report list + detail view)
- Color-coded severity badges
- Delete functionality with confirmation
- Real-time updates after deletion

### ✅ API Endpoints
- `POST /api/reports` - Create new safety report
- `GET /api/reports` - Fetch all reports
- `DELETE /api/reports/[id]` - Delete specific report

### ✅ Database Integration
- Cloudflare D1 database configured
- Schema with proper indexing
- Full CRUD operations

## Setup Steps

### 1. Install Missing Package

The application uses `@cloudflare/next-on-pages` for Cloudflare Workers integration. Install it:

```bash
npm install @cloudflare/next-on-pages --save-dev
```

### 2. Create D1 Database

Create the D1 database using Wrangler CLI:

```bash
npx wrangler d1 create safety-reports-db
```

This will output something like:
```
✅ Successfully created DB 'safety-reports-db' in region WNAM
Created your database using D1's new storage backend.

[[d1_databases]]
binding = "DB"
database_name = "safety-reports-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Update Wrangler Configuration

Copy the `database_id` from the output above and update `wrangler.jsonc`:

Replace the placeholder in the `d1_databases` section:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "safety-reports-db",
    "database_id": "YOUR-ACTUAL-DATABASE-ID-HERE"
  }
]
```

### 4. Initialize Database Schema

Run the schema file to create the reports table:

**For local development:**
```bash
npx wrangler d1 execute safety-reports-db --local --file=./schema.sql
```

**For production:**
```bash
npx wrangler d1 execute safety-reports-db --remote --file=./schema.sql
```

### 5. Verify Database Setup

Check that the table was created successfully:

```bash
npx wrangler d1 execute safety-reports-db --local --command="SELECT * FROM reports"
```

### 6. Run Development Server

Start the Next.js development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 7. Test with Cloudflare Workers Runtime

For a more accurate preview using the Workers runtime:

```bash
npm run preview
```

This builds the app and runs it in the `workerd` runtime locally.

### 8. Deploy to Cloudflare

When ready to deploy:

```bash
npm run deploy
```

This will:
1. Build your Next.js application
2. Transform it for Cloudflare Workers using OpenNext
3. Deploy to Cloudflare Workers

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── reports/
│   │       ├── route.ts          # GET & POST endpoints
│   │       └── [id]/
│   │           └── route.ts      # DELETE endpoint
│   ├── layout.tsx                # Root layout with metadata
│   └── page.tsx                  # Main form component
├── components/
│   └── ReportArchiveModal.tsx    # Report archive modal
└── types/
    └── cloudflare.d.ts           # D1 type definitions

schema.sql                         # Database schema
wrangler.jsonc                     # Cloudflare configuration
```

## Database Schema

The `reports` table includes:
- `id` - Auto-incrementing primary key
- `date_of_inspection` - Date of the inspection
- `location` - Location where inspection occurred
- `inspector_name` - Name of the inspector
- `observed_hazard` - Description of the hazard
- `severity_rating` - Low, Medium, High, or Critical
- `recommended_action` - Recommended corrective actions
- `digital_signature` - Inspector's digital signature
- `created_at` - Timestamp of report creation

## API Usage Examples

### Create a Report
```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d '{
    "dateOfInspection": "2025-10-17",
    "location": "The Danger Zone (aka Loading Dock)",
    "inspectorName": "Safety Steve (The Stickler)",
    "observedHazard": "Loose cables creating trip hazard",
    "severityRating": "High",
    "recommendedAction": "Secure all cables with cable management system",
    "digitalSignature": "Safety Steve (The Stickler)"
  }'
```

### Get All Reports
```bash
curl http://localhost:3000/api/reports
```

### Delete a Report
```bash
curl -X DELETE http://localhost:3000/api/reports/1
```

## Troubleshooting

### Issue: "Database not configured" error
- Ensure you've created the D1 database
- Verify the `database_id` in `wrangler.jsonc` is correct
- Make sure you've run the schema.sql file

### Issue: TypeScript errors about @cloudflare/next-on-pages
- Run: `npm install @cloudflare/next-on-pages --save-dev`

### Issue: Windows deployment error
- This is expected with `opennextjs-cloudflare deploy` on Windows
- Use `npm run deploy` which uses `wrangler deploy` directly (already configured)

### Issue: Empty reports list
- Make sure the database schema has been initialized
- Check that you're using `--local` flag for local development
- Verify the binding name "DB" matches in both wrangler.jsonc and the code

## Next Steps

1. **Add Authentication** - Implement user authentication for inspector login
2. **Export Reports** - Add PDF export functionality
3. **Email Notifications** - Send alerts for critical severity reports
4. **Image Upload** - Allow inspectors to attach photos of hazards
5. **Analytics Dashboard** - Create charts showing hazard trends
6. **Mobile App** - Build a companion mobile app for on-site reporting

## Notes

- The application uses client-side rendering for the form (`'use client'` directive)
- API routes run on Cloudflare Workers edge network
- D1 database provides low-latency access globally
- All styling is done with Tailwind CSS utility classes
- Form automatically clears after successful submission
- Digital signature auto-populates when inspector is selected

## Support

For issues or questions:
- Cloudflare D1 Docs: https://developers.cloudflare.com/d1/
- Next.js on Cloudflare: https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- OpenNext Cloudflare: https://opennext.js.org/cloudflare/
