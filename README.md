# Cloudflare Hyper-Personalisation Workshop

A hands-on workshop for building AI-powered hyper-personalisation features using **Cloudflare Workers**, **Durable Objects**, **Workers AI**, and **D1 Database**.

![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)

---

## What You'll Build

An **AI-powered writing coach** that analyzes safety inspection reports in real-time and provides personalized writing improvement suggestions based on each inspector's previous reports.

### Key Features

- **AI Report Analyzer** using Workers AI (Llama 3 8B model)
- **Durable Objects** for stateful, per-inspector coordination
- **Real-time recommendations** that appear when submitting reports
- **Context-aware AI** that learns from previous reports

---

## Getting Started

### Prerequisites

- Node.js 22.x
- Cloudflare account
- Git

### Quick Start

```bash
# Clone and install
git clone https://github.com/SnowDroids/cf-hyper-personalisation.git
cd cf-hyper-personalisation
npm install

# Follow the Lab Guide for complete setup
```

**Open [`Lab_Guide.md`](./Lab_Guide.md) for complete step-by-step instructions.**

The lab guide walks you through:
- Setting up your Cloudflare environment
- Creating and configuring the D1 database
- Building the Durable Object for AI analysis
- Integrating Workers AI
- Creating the frontend components
- Testing and deploying your feature

---

## Technologies Used

| Technology | Purpose |
|------------|---------|
| **Next.js 15** | React framework with App Router |
| **Cloudflare Workers** | Edge compute platform |
| **Durable Objects** | Stateful coordination |
| **Workers AI** | On-demand LLM inference (Llama 3 8B) |
| **D1 Database** | Serverless SQLite database |
| **OpenNext** | Next.js adapter for Cloudflare |
| **TypeScript** | You know what this is... 😏 |
| **Tailwind CSS** | Styling |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── reports/
│   │   │   ├── route.ts              # GET & POST endpoints
│   │   │   ├── [id]/route.ts         # DELETE endpoint
│   │   │   └── analyze/route.ts      # AI analysis endpoint
│   │   └── page.tsx                  # Main form
│   └── layout.tsx
├── components/
│   ├── ReportArchiveModal.tsx        # View past reports
│   └── RecommendationModal.tsx       # AI recommendations
├── durable-objects/
│   └── ReportAnalyzer.ts             # Durable Object for AI
└── types/
    └── cloudflare.d.ts               # Type definitions

worker.ts                              # Custom worker entry point
wrangler.jsonc                         # Cloudflare configuration
schema.sql                             # Database schema
Lab_Guide.md                           # Workshop instructions
```

---

## How It Works

```
User submits report
    ↓
Frontend calls /api/reports/analyze
    ↓
API route gets Durable Object stub (per safety inspector)
    ↓
Durable Object:
  • Queries D1 for previous 1-2 reports
  • Builds context-aware prompt
  • Calls Workers AI (Llama 3 8B)
  • Returns recommendation (or null)
    ↓
Frontend shows modal if recommendation exists
    ↓
User chooses: "Edit Report" or "Submit Anyway"
```

**Why Durable Objects?**
- Each safety inspector gets their own DO instance (consistent state)
- Colocated with the worker (low latency)
- Can cache analysis results (future enhancement)

---

## Troubleshooting

### Database Issues
- **"Database not configured"**: Verify `database_id` in `wrangler.jsonc` matches your D1 database
- **Empty reports list**: Ensure you ran `schema.sql` on both local and remote databases
- **Query errors**: Check that binding name "DB" matches in code and config

### Build/Deploy Issues
- **Type errors**: Run `npm run cf-typegen` to regenerate Cloudflare types
- **Build fails**: Delete `.next` and `.open-next` folders, then rebuild
- **Durable Object not found**: Verify `worker.ts` exports the `ReportAnalyzer` class
- **Migration errors**: Check `wrangler.jsonc` has the migrations section configured

### AI Recommendations
- **No recommendations appearing**: 
  - Verify at least 2 reports exist for the same inspector
  - Check browser console for errors
  - View worker logs in Cloudflare Dashboard
  - Note: AI only provides feedback when improvements are needed
- **AI returns "well-written"**: This is expected for good reports!

### Windows-Specific
- **OpenNext errors**: Use `npm run deploy` instead of direct OpenNext commands
- **Path issues**: Consider using WSL for better compatibility

### Still stuck?
- Check the [Cloudflare Community](https://community.cloudflare.com/)
- Review [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- Inspect worker logs in the Cloudflare Dashboard

---

## Learning Objectives

By completing this workshop, you'll learn:

- Integrating Workers AI into a Next.js application
- Using Durable Objects for stateful coordination
- Building context-aware AI prompts
- Deploying Next.js to Cloudflare Workers with OpenNext
- Working with D1 serverless database
- Creating custom worker entry points for Durable Objects

---

## Enhancement Ideas

After completing the workshop, try:

- **Rate Limiting**: Limit AI calls per inspector per time period
- **AI Gateway**: Add caching and analytics with Cloudflare AI Gateway
- **Model Comparison**: Try different LLMs and compare results (Think to yesterday's observability workshop)
- **Feedback Loop**: Let users rate recommendations to improve prompts
- **Advanced Prompts**: Experiment with few-shot examples and chain-of-thought
- **Multi-language**: Support reports in different languages
- **Sentiment Analysis**: Detect tone and suggest improvements

---

## Resources

### Cloudflare Documentation
- [Workers](https://developers.cloudflare.com/workers/)
- [Durable Objects](https://developers.cloudflare.com/durable-objects/)
- [Workers AI](https://developers.cloudflare.com/workers-ai/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [AI Gateway](https://developers.cloudflare.com/ai-gateway/)

### Frameworks & Tools
- [OpenNext Cloudflare](https://opennext.js.org/cloudflare/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Community
- [Cloudflare Community](https://community.cloudflare.com/)
- [Cloudflare Discord](https://discord.gg/cloudflaredev)
