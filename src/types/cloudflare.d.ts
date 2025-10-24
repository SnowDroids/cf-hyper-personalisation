// Extended Cloudflare environment types for D1 database
declare module '@cloudflare/workers-types' {
  interface Env {
    DB: D1Database;
    ASSETS: Fetcher;
    NEXTJS_ENV: string;
  }
}

export {};
