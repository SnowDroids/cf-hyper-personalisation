// Extended Cloudflare environment types for D1 database
declare module '@cloudflare/workers-types' {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    NEXTJS_ENV: string;
    // ========== WORKSHOP: AI RECOMMENDATION FEATURE - TYPE DEFINITIONS START ==========
    
    // Lab Instructions: For step 3.3 in the lab guide, uncomment the two lines below
    //AI: Ai;
    //REPORT_ANALYZER: DurableObjectNamespace;

    // ========== WORKSHOP: AI RECOMMENDATION FEATURE - TYPE DEFINITIONS END ==========
  }
}

export {};
