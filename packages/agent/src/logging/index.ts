/**
 * Logging utilities - prompt log, output log, metrics
 */

import type { TokenUsage } from "@gempp/types";

// Placeholder - will be implemented
export const LOGGING_PLACEHOLDER = true;

export interface LogEntry {
  timestamp: Date;
  type: "prompt" | "response" | "tool_call" | "tool_result" | "error";
  content: unknown;
  tokenUsage?: TokenUsage;
}
