/**
 * Custom Worker Entry Point
 * This wraps the OpenNext-generated worker and exports our Durable Object
 */

// @ts-ignore - .open-next/worker.js is generated at build time
import { default as handler } from "./.open-next/worker.js";

// Lab Instructions: For step 4.6 in the lab guide, uncomment the line below
//export { ReportAnalyzer } from './src/durable-objects/ReportAnalyzer';

// Export the default OpenNext handler
export default handler;
