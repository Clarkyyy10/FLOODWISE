import type { AssessInput, AiAssessmentResult } from "@/app/api/ai/assess/route";
import type { AiAssessment } from "./types";

export interface AssessResponse {
  configured: boolean;
  ai?: AiAssessmentResult;
  error?: string;
}

/** Call the server-side Gemini assessment endpoint. */
export async function assessReport(input: AssessInput): Promise<AssessResponse> {
  try {
    const res = await fetch("/api/ai/assess", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { configured: true, error: "ai_failed" };
    return (await res.json()) as AssessResponse;
  } catch {
    return { configured: true, error: "ai_unavailable" };
  }
}

import type { ChatContext, ChatResponse } from "@/app/api/ai/chat/route";

export interface ChatResult extends Partial<ChatResponse> {
  configured: boolean;
  error?: string;
}

/** Ask the grounded FloodWise AI assistant. */
export async function askFloodWiseAI(
  question: string,
  history: Array<{ role: "user" | "ai"; text: string }>,
  context: ChatContext,
  language?: string,
): Promise<ChatResult> {
  try {
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history, context, language }),
    });
    if (!res.ok) {
      if (res.status === 404 || res.status === 502 || res.status === 504)
        return { configured: true, error: "ai_failed" };
    }
    return (await res.json()) as ChatResult;
  } catch {
    return { configured: true, error: "ai_unavailable" };
  }
}

/** Read a File as raw base64 (strips the data: URL prefix). */
export function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const comma = result.indexOf(",");
      resolve({ data: result.slice(comma + 1), mimeType: file.type || "image/jpeg" });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Re-export for convenience.
export type { AiAssessment };
