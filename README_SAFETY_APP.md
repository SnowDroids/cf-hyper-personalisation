# 🛡️ Safety Inspection Reporting System

A modern, full-stack safety inspection reporting application built with **Next.js 15**, **React 19**, **Tailwind CSS**, and **Cloudflare D1** database.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)

## 🎯 Features

### Core Functionality
- ✅ **Comprehensive Safety Report Form** with validation
- ✅ **Report Archive Modal** with search and filter capabilities
- ✅ **Real-time CRUD Operations** (Create, Read, Delete)
- ✅ **Severity-based Color Coding** (Low, Medium, High, Critical)
- ✅ **Auto-populating Digital Signatures**
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

### Technical Highlights
- ⚡ **Edge-deployed** on Cloudflare Workers for global low-latency
- 🗄️ **Cloudflare D1** SQLite database with automatic replication
- 🎨 **Modern UI** with Tailwind CSS and smooth animations
- 🔒 **Type-safe** with TypeScript throughout
- 📱 **Mobile-first** responsive design
- 🚀 **Server-side rendering** with Next.js App Router

## 🏗️ Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (React 19)    │
└────────┬────────┘
         │
         ├─── Client Components (Form, Modal)
         │
         ├─── API Routes (/api/reports)
         │    └─── Cloudflare Workers
         │
         └─── Cloudflare D1 Database
              └─── Global Edge Network
```

## 📦 What's Included

### Components
- **`page.tsx`** - Main safety report form with state management
- **`ReportArchiveModal.tsx`** - Separate modal component for viewing/managing reports
- **`layout.tsx`** - Root layout with proper metadata

### API Routes
- **`POST /api/reports`** - Submit new safety reports
- **`GET /api/reports`** - Retrieve all reports (sorted by date)
- **`DELETE /api/reports/[id]`** - Delete specific reports

### Database
- **`schema.sql`** - Complete database schema with indexes
- **D1 Integration** - Configured in `wrangler.jsonc`

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
npm install @cloudflare/next-on-pages --save-dev
```

### 2. Create D1 Database
```bash
npx wrangler d1 create safety-reports-db
```

Copy the `database_id` from the output and update `wrangler.jsonc`.

### 3. Initialize Database
```bash
npx wrangler d1 execute safety-reports-db --local --file=./schema.sql
```

### 4. Run Development Server
```bash
npm run preview
```

Visit **http://localhost:8787**

### 5. Deploy to Cloudflare
```bash
npm run deploy
```

📖 **For detailed setup instructions, see [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)**

## 🎨 UI Preview

### Main Form
- Professional gradient background (slate-50 to slate-100)
- Three distinct sections with colored borders
- Dropdown selectors with cheeky location names
- Real-time validation and error handling
- Success/error message banners

### Report Archive Modal
- Two-column layout (list + detail view)
- Color-coded severity badges
- Smooth hover effects and transitions
- Delete confirmation dialogs
- Empty state illustrations

## 🗂️ Project Structure

```
src/
├── app/
│   ├── api/reports/
│   │   ├── route.ts              # GET & POST handlers
│   │   └── [id]/route.ts         # DELETE handler
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main form page
├── components/
│   └── ReportArchiveModal.tsx    # Archive modal
└── types/
    └── cloudflare.d.ts           # Type definitions

schema.sql                         # Database schema
wrangler.jsonc                     # Cloudflare config
SETUP_INSTRUCTIONS.md              # Detailed setup guide
```

## 🎭 Fun Features

### Cheeky Location Names
- "The Danger Zone (aka Loading Dock)"
- "Sketchy Stairwell #3"
- "That One Hallway Everyone Avoids"
- "The 'Temporary' Storage Area (Est. 2015)"
- "Break Room of Broken Dreams"
- ...and more!

### Inspector Personalities
- "Safety Steve (The Stickler)"
- "Cautious Carol"
- "Hazard Harry"
- "Vigilant Veronica"
- ...and more!

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **React 19** | UI library with latest features |
| **TypeScript** | Type safety and better DX |
| **Tailwind CSS** | Utility-first styling |
| **Cloudflare Workers** | Edge compute platform |
| **Cloudflare D1** | Serverless SQLite database |
| **OpenNext** | Next.js adapter for Cloudflare |
| **Wrangler** | Cloudflare CLI tool |

## 📊 Database Schema

```sql
CREATE TABLE reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_of_inspection TEXT NOT NULL,
    location TEXT NOT NULL,
    inspector_name TEXT NOT NULL,
    observed_hazard TEXT NOT NULL,
    severity_rating TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    digital_signature TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Examples

### Create Report
```javascript
fetch('/api/reports', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dateOfInspection: '2025-10-17',
    location: 'The Danger Zone (aka Loading Dock)',
    inspectorName: 'Safety Steve (The Stickler)',
    observedHazard: 'Loose cables creating trip hazard',
    severityRating: 'High',
    recommendedAction: 'Secure all cables immediately',
    digitalSignature: 'Safety Steve (The Stickler)'
  })
});
```

### Get All Reports
```javascript
fetch('/api/reports')
  .then(res => res.json())
  .then(data => console.log(data.reports));
```

### Delete Report
```javascript
fetch('/api/reports/1', { method: 'DELETE' });
```

## 🎯 Use Cases

- **Construction Sites** - Document safety hazards on job sites
- **Manufacturing Facilities** - Track equipment and process safety
- **Office Buildings** - Report workplace safety concerns
- **Warehouses** - Monitor loading dock and storage safety
- **Educational Institutions** - Campus safety inspections
- **Healthcare Facilities** - Patient and staff safety reporting

## 🚧 Future Enhancements

- [ ] User authentication and role-based access
- [ ] Photo upload for hazard documentation
- [ ] PDF export for reports
- [ ] Email notifications for critical issues
- [ ] Analytics dashboard with charts
- [ ] Mobile app (React Native)
- [ ] Offline support with sync
- [ ] Multi-language support
- [ ] Report templates
- [ ] Scheduled inspections

## 📝 License

This project is part of a workshop/tutorial for building full-stack applications with Cloudflare Workers and D1.

## 🤝 Contributing

This is a workshop project, but feel free to fork and customize for your own needs!

## 📞 Support

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Next.js Documentation](https://nextjs.org/docs)
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare/)

---

**Built with ❤️ using Cloudflare's edge platform**
