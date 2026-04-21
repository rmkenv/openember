/**
 * api/chat.js — Vercel serverless proxy for Ollama Cloud
 *
 * Runs server-side (no CORS) — proxies POST /api/chat to Ollama Cloud
 * and streams the response back to the browser.
 *
 * Browser calls:  POST /api/chat  { messages, context, model? }
 * This calls:     POST https://ollama.com/api/chat  with Bearer auth
 */

export const config = { runtime: "edge" }   // Edge runtime for streaming support

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders() })
  }

  // API key — from Vercel env var (set in dashboard) or from request header
  const apiKey = process.env.OLLAMA_API_KEY
    || req.headers.get("x-ollama-key")
    || ""

  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "No Ollama API key configured. Set OLLAMA_API_KEY in Vercel environment variables." }),
      { status: 401, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    )
  }

  let body
  try {
    body = await req.json()
  } catch {
    return new Response("Invalid JSON", { status: 400, headers: corsHeaders() })
  }

  const ollamaHost  = process.env.OLLAMA_HOST  || "https://ollama.com"
  const ollamaModel = process.env.OLLAMA_MODEL || body.model || "gpt-oss:120b-cloud"

  const payload = {
    model:    ollamaModel,
    stream:   true,
    messages: body.messages || [],
  }

  try {
    const upstream = await fetch(`${ollamaHost}/api/chat`, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!upstream.ok) {
      const errText = await upstream.text()
      return new Response(
        JSON.stringify({ error: `Ollama Cloud ${upstream.status}: ${errText}` }),
        { status: upstream.status, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
      )
    }

    // Stream the response straight through to the browser
    return new Response(upstream.body, {
      status:  200,
      headers: {
        ...corsHeaders(),
        "Content-Type":      "text/event-stream",
        "Cache-Control":     "no-cache",
        "X-Accel-Buffering": "no",
      },
    })
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `Proxy error: ${e.message}` }),
      { status: 502, headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    )
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-ollama-key",
  }
}
