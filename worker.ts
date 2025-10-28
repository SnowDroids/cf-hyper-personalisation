/**
 * Custom Worker Entry Point
 * This wraps the OpenNext-generated worker and exports our Durable Object
 */

// @ts-ignore - .open-next/worker.js is generated at build time
import { default as handler } from "./.open-next/worker.js";

// ========== WORKSHOP: DURABLE OBJECT EXPORT START ==========
// Export the Durable Object class
export { ReportAnalyzer } from './src/durable-objects/ReportAnalyzer';
// ========== WORKSHOP: DURABLE OBJECT EXPORT END ==========

// Export the default OpenNext handler
export default handler;
