import { NextResponse } from "next/server";

export const runtime = "nodejs";

function extractJson(text) {
  // يحاول يلقط أول JSON object في النص
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) throw new Error("Model did not return JSON.");
  const slice = text.slice(first, last + 1);
  return JSON.parse(slice);
}

export async function POST(req) {
  try {
    const { query } = await req.json();
    const q = String(query || "").trim();
    if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing OPENAI_API_KEY" }, { status: 500 });

    // نستخدم OpenAI Responses API عبر fetch عشان ما نعتمد على SDK version
    const prompt = `
You are a medical terminology formatter.

Return ONLY valid JSON with exactly these keys:
term (string),
pronunciation_ar (string in Arabic letters),
meaning_ar (string),
definition_ar (string, short Arabic definition, no extra talk)

Rules:
- Keep definition_ar brief, factual, and medical if relevant.
- If the term is not medical, still follow the same format.
- Do not include bullet points.
- Do not include any extra keys.

User term: ${q}
`.trim();

    const resp = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt
      })
    });

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ error: t || "OpenAI request failed" }, { status: 500 });
    }

    const out = await resp.json();
    const text = out.output_text || "";
    const data = extractJson(text);

    // ضمان مفاتيح
    const safe = {
      term: String(data.term || q),
      pronunciation_ar: String(data.pronunciation_ar || ""),
      meaning_ar: String(data.meaning_ar || ""),
      definition_ar: String(data.definition_ar || "")
    };

    return NextResponse.json(safe);
  } catch (e) {
    return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
  }
}
