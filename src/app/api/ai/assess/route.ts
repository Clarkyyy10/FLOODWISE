import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

// Server-side Gemini proxy for FloodWise report evidence assessment.
// Uses the current Google Gen AI SDK (@google/genai), which supports the
// newer AI Studio API keys (AQ.Ab8… format). The key stays on the server
// (GEMINI_API_KEY) and is NEVER exposed to the browser. If no key is
// configured we return { configured: false } so the client can fall back to a
// transparent heuristic assessment.

export const runtime = "nodejs";

export interface AssessInput {
  roadName?: string;
  floodLevel?: string;
  vehicle?: string;
  pedestrian?: string;
  hazards?: string[];
  notes?: string;
  imageBase64?: string; // raw base64 (no data: prefix)
  imageMimeType?: string;
}

export interface AiAssessmentResult {
  floodVisible: boolean;
  consistentWithReport: boolean;
  imageQualityOk: boolean;
  confidence: "low" | "medium" | "high";
  note: string;
}

const SYSTEM = `You are an evidence-assessment assistant for FloodWise, a community flood-reporting app for Marikina City.
You DO NOT decide whether a road is physically safe. You ONLY assess how well the submitted evidence supports the report.
Be cautious and flag uncertainty rather than making a binary safe/unsafe call.
Respond with ONLY a JSON object (no markdown, no prose) using exactly these keys:
{"floodVisible": boolean, "consistentWithReport": boolean, "imageQualityOk": boolean, "confidence": "low"|"medium"|"high", "note": string}
"note" must be one short sentence describing what the evidence shows.`;

function parseAssessment(text: string): AiAssessmentResult {
  const match = text.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const obj = JSON.parse(match[0]);
      return {
        floodVisible: !!obj.floodVisible,
        consistentWithReport: !!obj.consistentWithReport,
        imageQualityOk: obj.imageQualityOk !== false,
        confidence: ["low", "medium", "high"].includes(obj.confidence) ? obj.confidence : "medium",
        note: typeof obj.note === "string" ? obj.note : "Evidence assessed.",
      };
    } catch {
      /* fall through */
    }
  }
  return {
    floodVisible: false,
    consistentWithReport: true,
    imageQualityOk: true,
    confidence: "low",
    note: text.slice(0, 160) || "Assessment returned no structured result.",
  };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  const body = (await req.json()) as AssessInput;

  if (!key) {
    return NextResponse.json({ configured: false });
  }

  const promptText =
    `${SYSTEM}\n\nREPORT:\n` +
    `Road: ${body.roadName ?? "unknown"}\n` +
    `Reported flood level: ${body.floodLevel ?? "unknown"}\n` +
    `Vehicle passability: ${body.vehicle ?? "unknown"}\n` +
    `Pedestrian condition: ${body.pedestrian ?? "unknown"}\n` +
    `Hazards: ${(body.hazards ?? []).join(", ") || "none"}\n` +
    `Notes: ${body.notes ?? "none"}\n` +
    (body.imageBase64
      ? `\nA photo is attached. Assess whether it visually supports the report.`
      : `\nNo photo attached. Assess only the textual consistency of the report.`);

  // Message parts: text + optional inline image.
  const parts: Array<
    { text: string } | { inlineData: { data: string; mimeType: string } }
  > = [{ text: promptText }];
  if (body.imageBase64 && body.imageMimeType) {
    parts.push({ inlineData: { data: body.imageBase64, mimeType: body.imageMimeType } });
  }

  const ai = new GoogleGenAI({ apiKey: key });
  const model = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";

  // Retry transient overload/rate errors (503 UNAVAILABLE, 429) a couple of times.
  const isTransient = (msg: string) =>
    /(\b503\b|UNAVAILABLE|high demand|overloaded|\b429\b|RESOURCE_EXHAUSTED)/i.test(msg);
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts }],
      });
      const text = response.text ?? "";
      return NextResponse.json({ configured: true, ai: parseAssessment(text) });
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (isTransient(lastError) && attempt < 2) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      break;
    }
  }

  console.error("[ai/assess] Gemini call failed:", lastError);
  return NextResponse.json(
    { configured: true, error: "ai_failed", detail: lastError },
    { status: 502 },
  );
}
