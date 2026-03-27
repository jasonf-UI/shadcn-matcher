import { NextRequest, NextResponse } from "next/server";

interface ShadcnMatch {
  element: string;
  component: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  props: string;
  location: string;
}

async function analyzeWithGemini(
  base64: string,
  mimeType: string,
  geminiKey: string
): Promise<ShadcnMatch[]> {
  const prompt = `You are a senior front-end engineer expert in shadcn/ui (https://ui.shadcn.com).

Analyze this UI screenshot and identify every shadcn/ui component that maps to a visible element.

Available shadcn/ui components:
Accordion, Alert, Alert Dialog, Aspect Ratio, Avatar, Badge, Breadcrumb, Button, Button Group, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, Context Menu, Data Table, Date Picker, Dialog, Drawer, Dropdown Menu, Hover Card, Input, Input OTP, Label, Menubar, Navigation Menu, Pagination, Popover, Progress, Radio Group, Resizable, Scroll Area, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Switch, Table, Tabs, Textarea, Toast, Toggle, Toggle Group, Tooltip, Typography

Return ONLY a valid JSON array (no markdown, no explanation) with this exact shape:
[
  {
    "element": "short description of the visual element",
    "component": "exact shadcn component name from the list above",
    "reason": "one sentence explaining why this component fits",
    "confidence": "high" | "medium" | "low",
    "props": "suggested props e.g. variant=\"outline\" size=\"sm\"",
    "location": "header" | "sidebar" | "footer" | "modal" | "form" | "main content"
  }
]

Rules:
- Only include elements clearly visible in the screenshot
- Prefer specific over generic (e.g. "Input OTP" over "Input" for an OTP field)
- Set confidence "high" when the match is obvious, "medium" when plausible, "low" when uncertain
- Include all significant UI elements — aim for 5–15 matches
- props should be real shadcn prop values, or empty string "" if none needed`;

  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: base64 } },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key=${geminiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } }).error?.message ||
        `Gemini API error ${res.status}`
    );
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
  const cleaned = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();
  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [];
}

export async function POST(req: NextRequest) {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not set. Add it to .env.local and restart the server." },
        { status: 500 }
      );
    }

    const { imageBase64, mimeType } = await req.json();
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    const matches = await analyzeWithGemini(
      imageBase64,
      mimeType || "image/png",
      geminiKey
    );

    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Analysis failed" },
      { status: 500 }
    );
  }
}
