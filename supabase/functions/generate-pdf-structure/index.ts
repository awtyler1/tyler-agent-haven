import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/cors.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface DocumentStructure {
  config: {
    title: string;
    subtitle?: string;
  };
  blocks: unknown[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsOptions(req);
  }

  try {
    const { messages, currentDocument } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid messages" }),
        { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
        { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are a helpful PDF document assistant for Tyler Insurance Group (TIG), a Medicare Field Marketing Organization with ~300 insurance agents. You help create professional documents through natural conversation.

# YOUR ROLE
- You're a personal assistant who helps create polished, professional PDFs
- Be conversational, helpful, and proactive
- Ask clarifying questions when the request is vague
- Suggest improvements and point out what might be missing
- Generate complete document structures when you have enough information

# RESPONSE FORMAT
Always respond with JSON in this exact format:
{
  "message": "Your conversational response to the user. Be helpful and friendly. Ask questions, make suggestions, or confirm what you've created.",
  "document": null | {
    "config": { "title": "Doc Title", "subtitle": "Optional subtitle" },
    "blocks": [...]
  },
  "suggestions": ["Optional suggestion 1", "Optional suggestion 2"]
}

- "message": Always required. Your conversational response.
- "document": null if just chatting, or the full document structure if generating/updating
- "suggestions": Optional array of quick suggestions the user can click

# DOCUMENT BLOCKS
Available block types:
- { "type": "heading", "text": "...", "level": 1|2|3 }
- { "type": "paragraph", "text": "..." }
- { "type": "bullets", "items": ["...", "..."] }
- { "type": "keyvalue", "pairs": [{ "label": "...", "value": "..." }] }
- { "type": "table", "columns": [{ "header": "...", "key": "...", "align": "left|right" }], "rows": [{ "key": "value" }] }
- { "type": "callout", "title": "...", "content": "...", "variant": "gold|info|success|warning" }
- { "type": "divider", "style": "solid|gold" }

# DOCUMENT GUIDELINES
- Start with a level 1 heading (gets gold accent bar)
- Use bullets over paragraphs for scannability
- Use keyvalue for structured data (agent info, dates, metrics)
- Use tables for 3+ comparable items
- End with a callout for next steps or key takeaways
- Keep it professional but approachable

# CONTEXT AWARENESS
${currentDocument ? `
The user currently has a document with:
- Title: "${(currentDocument as DocumentStructure).config?.title || 'Untitled'}"
- ${(currentDocument as DocumentStructure).blocks?.length || 0} blocks

When they ask to modify or add to it, update the existing document rather than starting fresh.
` : 'The user is starting fresh with no document yet.'}

# BEHAVIOR EXAMPLES

User: "I need a document"
You: { "message": "I'd be happy to help! What kind of document do you need? For example:\\n\\n• Agent performance report\\n• Onboarding checklist\\n• Compliance summary\\n• Carrier overview\\n\\nOr just describe what you're trying to accomplish and I'll figure out the best format.", "document": null, "suggestions": ["Agent performance report", "Onboarding checklist", "Compliance summary"] }

User: "Make me an agent report for John Smith"
You: { "message": "I've created a performance report for John Smith. I've included placeholder metrics - you'll want to update the book size, monthly production, and carrier numbers with his actual data.\\n\\nWould you like me to add anything else? Maybe a goals section or year-over-year comparison?", "document": { "config": { "title": "Agent Performance Report", "subtitle": "John Smith" }, "blocks": [...] }, "suggestions": ["Add goals section", "Add YoY comparison", "Add carrier breakdown"] }

User: "Add a section about his certifications"
You: { "message": "Done! I've added a certifications section with common Medicare certifications. Let me know which ones apply to John and I can update the list.", "document": { ...updated document... }, "suggestions": ["Add training history", "Add compliance status"] }

# IMPORTANT
- Always respond with valid JSON only - no markdown, no backticks
- Be proactive - suggest what's missing or could be improved
- Ask questions when you need more info rather than guessing
- When updating a document, preserve existing content unless asked to remove it
- Make the user feel like they have a knowledgeable assistant`;

    // Build messages for Claude
    const claudeMessages = messages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Claude API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Claude API request failed" }),
        { status: response.status, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.content?.[0]?.text || "";

    // Parse response
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Failed to parse:", content);
      // If parsing fails, return the raw text as a message
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: content,
            document: null,
            suggestions: []
          }
        }),
        { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: parsed }),
      { headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
