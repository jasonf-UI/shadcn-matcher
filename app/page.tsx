"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { saveSession, loadSessions, type MatchSession, type ComponentMatch } from "@/lib/supabase";

/* ─── session id (per-browser) ───────────────────────────────────────────── */
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem("shadcn_matcher_sid");
  if (!id) { id = crypto.randomUUID(); localStorage.setItem("shadcn_matcher_sid", id); }
  return id;
}

/* ─── shadcn component catalogue ────────────────────────────────────────── */
const SHADCN_COMPONENTS: { name: string; category: string; description: string }[] = [
  { name: "Aspect Ratio",    category: "Layout",     description: "Displays content within a desired ratio." },
  { name: "Card",            category: "Layout",     description: "Displays a card with header, content, and footer." },
  { name: "Resizable",       category: "Layout",     description: "Accessible resizable panel groups and layouts." },
  { name: "Scroll Area",     category: "Layout",     description: "Augments native scroll functionality." },
  { name: "Separator",       category: "Layout",     description: "Visually or semantically separates content." },
  { name: "Sidebar",         category: "Layout",     description: "A composable, themeable sidebar component." },
  { name: "Breadcrumb",      category: "Navigation", description: "Displays the path to the current resource." },
  { name: "Menubar",         category: "Navigation", description: "A visually persistent menu with keyboard navigation." },
  { name: "Navigation Menu", category: "Navigation", description: "A collection of links for site navigation." },
  { name: "Pagination",      category: "Navigation", description: "Pagination with page navigation and previous/next links." },
  { name: "Tabs",            category: "Navigation", description: "Layered sections of content in a single view." },
  { name: "Button",          category: "Forms",      description: "Triggers an action or event." },
  { name: "Checkbox",        category: "Forms",      description: "A control that allows selecting multiple options." },
  { name: "Combobox",        category: "Forms",      description: "Autocomplete input and command palette." },
  { name: "Date Picker",     category: "Forms",      description: "A date picker built using Calendar and Popover." },
  { name: "Input",           category: "Forms",      description: "Displays a form input field." },
  { name: "Input OTP",       category: "Forms",      description: "Accessible one-time password input." },
  { name: "Label",           category: "Forms",      description: "Renders an accessible label for controls." },
  { name: "Radio Group",     category: "Forms",      description: "A set of checkable buttons." },
  { name: "Select",          category: "Forms",      description: "Displays a list of options for the user to pick." },
  { name: "Slider",          category: "Forms",      description: "An input where the user selects from a range of values." },
  { name: "Switch",          category: "Forms",      description: "A control that toggles between two states." },
  { name: "Textarea",        category: "Forms",      description: "Displays a form textarea field." },
  { name: "Toggle",          category: "Forms",      description: "A two-state button that can be on or off." },
  { name: "Toggle Group",    category: "Forms",      description: "A set of two-state toggle buttons." },
  { name: "Alert Dialog",    category: "Overlay",    description: "Interrupts the user with important content." },
  { name: "Context Menu",    category: "Overlay",    description: "Displays a menu on right-click." },
  { name: "Dialog",          category: "Overlay",    description: "A modal dialog that interrupts the user." },
  { name: "Drawer",          category: "Overlay",    description: "A dialog that slides in from the edge of the screen." },
  { name: "Dropdown Menu",   category: "Overlay",    description: "Displays a menu when a trigger is clicked." },
  { name: "Hover Card",      category: "Overlay",    description: "Shows content for sighted users hovering over a link." },
  { name: "Popover",         category: "Overlay",    description: "Displays rich content in a portal triggered by a button." },
  { name: "Sheet",           category: "Overlay",    description: "Extends Dialog to display a panel at the edge of the screen." },
  { name: "Tooltip",         category: "Overlay",    description: "A popup that displays info when hovering over an element." },
  { name: "Accordion",       category: "Display",    description: "Vertically stacked interactive headings." },
  { name: "Alert",           category: "Display",    description: "Displays a callout for user attention." },
  { name: "Avatar",          category: "Display",    description: "An image element with a fallback." },
  { name: "Badge",           category: "Display",    description: "Displays a badge or label." },
  { name: "Calendar",        category: "Display",    description: "A date field component built with react-day-picker." },
  { name: "Carousel",        category: "Display",    description: "A carousel with motion and swipe." },
  { name: "Chart",           category: "Display",    description: "Beautiful charts built with Recharts." },
  { name: "Collapsible",     category: "Display",    description: "An interactive component which expands/collapses." },
  { name: "Command",         category: "Display",    description: "Fast, composable command menu." },
  { name: "Data Table",      category: "Display",    description: "Powerful table with sorting, filtering, and pagination." },
  { name: "Progress",        category: "Display",    description: "Displays a progress indicator." },
  { name: "Skeleton",        category: "Display",    description: "Used to show a placeholder while content is loading." },
  { name: "Table",           category: "Display",    description: "A responsive table component." },
  { name: "Typography",      category: "Display",    description: "Styles for headings, paragraphs, and lists." },
  { name: "Sonner",          category: "Feedback",   description: "An opinionated toast component." },
  { name: "Spinner",         category: "Feedback",   description: "Loading spinner indicator." },
  { name: "Toast",           category: "Feedback",   description: "A succinct message that appears temporarily." },
];

/* ─── mini-preview renders ───────────────────────────────────────────────── */
const PREVIEWS: Record<string, React.ReactNode> = {
  "Aspect Ratio": (
    <div className="w-28 h-16 rounded-md border border-zinc-700 bg-zinc-900 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center">
        <span className="text-[9px] text-zinc-500 font-mono">16 / 9</span>
      </div>
    </div>
  ),
  "Card": (
    <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 overflow-hidden">
      <div className="px-3 py-2 border-b border-zinc-800">
        <div className="h-1.5 w-12 bg-zinc-300 rounded-full" />
        <div className="h-1 w-8 bg-zinc-600 rounded-full mt-1" />
      </div>
      <div className="px-3 py-2 space-y-1">
        <div className="h-1 w-full bg-zinc-700 rounded-full" />
        <div className="h-1 w-4/5 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Resizable": (
    <div className="w-28 h-16 rounded-lg border border-zinc-700 bg-zinc-900 flex overflow-hidden">
      <div className="flex-1 bg-zinc-800" />
      <div className="w-0.5 bg-zinc-600" />
      <div className="w-10" />
    </div>
  ),
  "Scroll Area": (
    <div className="w-28 h-16 rounded-lg border border-zinc-700 bg-zinc-900 relative overflow-hidden">
      <div className="p-2 space-y-1.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-1.5 bg-zinc-700 rounded-full" style={{ width: `${60 + (i % 3) * 15}%` }} />
        ))}
      </div>
      <div className="absolute right-0.5 top-1 bottom-1 w-1 bg-zinc-600 rounded-full" />
    </div>
  ),
  "Separator": (
    <div className="flex flex-col gap-2 items-center w-28">
      <div className="h-1 w-6 bg-zinc-600 rounded-full" />
      <div className="w-full h-px bg-zinc-600" />
      <div className="h-1 w-6 bg-zinc-600 rounded-full" />
    </div>
  ),
  "Sidebar": (
    <div className="w-28 h-16 rounded-lg border border-zinc-700 bg-zinc-900 flex overflow-hidden">
      <div className="w-8 bg-zinc-800 p-1.5 space-y-1.5">
        <div className="h-1.5 w-full bg-zinc-600 rounded-full" />
        <div className="h-1.5 w-4/5 bg-zinc-700 rounded-full" />
        <div className="h-1.5 w-full bg-zinc-700 rounded-full" />
        <div className="h-1.5 w-3/4 bg-zinc-700 rounded-full" />
      </div>
      <div className="flex-1 p-1.5">
        <div className="h-1 w-full bg-zinc-800 rounded mb-1" />
        <div className="h-1 w-3/4 bg-zinc-800 rounded" />
      </div>
    </div>
  ),
  "Breadcrumb": (
    <div className="flex items-center gap-1">
      <span className="text-[9px] text-zinc-400">Home</span>
      <span className="text-[9px] text-zinc-600">/</span>
      <span className="text-[9px] text-zinc-400">Docs</span>
      <span className="text-[9px] text-zinc-600">/</span>
      <span className="text-[9px] text-zinc-200">Page</span>
    </div>
  ),
  "Menubar": (
    <div className="flex items-center gap-0.5 rounded-md border border-zinc-700 bg-zinc-900 px-1.5 py-1">
      {["File", "Edit", "View"].map((item) => (
        <div key={item} className={`px-2 py-0.5 rounded text-[9px] ${item === "File" ? "bg-zinc-700 text-zinc-200" : "text-zinc-400"}`}>{item}</div>
      ))}
    </div>
  ),
  "Navigation Menu": (
    <div className="flex items-center gap-3">
      {["Docs", "API", "Blog"].map((item, i) => (
        <span key={item} className={`text-[9px] ${i === 0 ? "text-white font-medium border-b border-white pb-px" : "text-zinc-500"}`}>{item}</span>
      ))}
    </div>
  ),
  "Pagination": (
    <div className="flex items-center gap-1">
      <div className="h-5 w-5 rounded border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500">‹</div>
      {[1, 2, 3].map((n) => (
        <div key={n} className={`h-5 w-5 rounded flex items-center justify-center text-[8px] ${n === 2 ? "bg-white text-black" : "border border-zinc-700 text-zinc-400"}`}>{n}</div>
      ))}
      <div className="h-5 w-5 rounded border border-zinc-700 flex items-center justify-center text-[8px] text-zinc-500">›</div>
    </div>
  ),
  "Tabs": (
    <div className="w-28">
      <div className="flex rounded-md bg-zinc-800 p-0.5 gap-0.5 mb-2">
        {["Tab 1", "Tab 2"].map((t, i) => (
          <div key={t} className={`flex-1 text-center text-[8px] py-0.5 rounded ${i === 0 ? "bg-zinc-950 text-white" : "text-zinc-500"}`}>{t}</div>
        ))}
      </div>
      <div className="space-y-1 px-1">
        <div className="h-1 w-full bg-zinc-700 rounded-full" />
        <div className="h-1 w-3/4 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Button": (
    <div className="flex gap-2 flex-wrap items-center justify-center">
      <div className="px-3 py-1 rounded-md bg-white text-black text-[9px] font-medium">Default</div>
      <div className="px-3 py-1 rounded-md border border-zinc-600 text-zinc-300 text-[9px]">Outline</div>
    </div>
  ),
  "Checkbox": (
    <div className="flex flex-col gap-2">
      {[["Accept terms", true], ["Subscribe", false]].map(([label, checked]) => (
        <div key={String(label)} className="flex items-center gap-2">
          <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 ${checked ? "bg-white border-white" : "border-zinc-600"}`}>
            {checked && <svg className="h-2 w-2 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
          </div>
          <span className="text-[9px] text-zinc-400">{String(label)}</span>
        </div>
      ))}
    </div>
  ),
  "Combobox": (
    <div className="w-28">
      <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 gap-1.5">
        <span className="text-[9px] text-zinc-400 flex-1">Select framework…</span>
        <svg className="h-2.5 w-2.5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      <div className="mt-1 rounded-md border border-zinc-700 bg-zinc-950 py-1">
        {["Next.js", "Remix"].map((f, i) => (
          <div key={f} className={`px-2 py-0.5 text-[9px] flex items-center gap-1 ${i === 0 ? "text-white" : "text-zinc-500"}`}>
            {i === 0 && <svg className="h-2 w-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
            {f}
          </div>
        ))}
      </div>
    </div>
  ),
  "Date Picker": (
    <div className="w-28">
      <div className="flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 gap-2">
        <svg className="h-3 w-3 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={2}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={2}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={2}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/></svg>
        <span className="text-[9px] text-zinc-400">Pick a date</span>
      </div>
    </div>
  ),
  "Input": (
    <div className="w-28 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 flex items-center gap-1">
      <span className="text-[9px] text-zinc-500">Email address</span>
      <div className="h-2.5 w-px bg-zinc-400 animate-pulse ml-px" />
    </div>
  ),
  "Input OTP": (
    <div className="flex items-center gap-1">
      {["3", "4", "•", "•", "•", "•"].map((c, i) => (
        <div key={i} className={`h-7 w-6 rounded border flex items-center justify-center text-[10px] font-mono ${i < 2 ? "border-zinc-500 bg-zinc-800 text-white" : "border-zinc-700 bg-zinc-900 text-zinc-500"}`}>{c}</div>
      ))}
    </div>
  ),
  "Label": (
    <div className="flex flex-col gap-1.5">
      <span className="text-[9px] font-medium text-zinc-200">Email address</span>
      <div className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-[9px] text-zinc-500">name@example.com</div>
    </div>
  ),
  "Radio Group": (
    <div className="flex flex-col gap-2">
      {[["Default", true], ["Comfortable", false]].map(([label, checked]) => (
        <div key={String(label)} className="flex items-center gap-2">
          <div className={`h-3 w-3 rounded-full border flex items-center justify-center shrink-0 ${checked ? "border-white" : "border-zinc-600"}`}>
            {checked && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
          </div>
          <span className="text-[9px] text-zinc-400">{String(label)}</span>
        </div>
      ))}
    </div>
  ),
  "Select": (
    <div className="w-28 flex items-center rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 justify-between">
      <span className="text-[9px] text-zinc-400">Select option</span>
      <svg className="h-2.5 w-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    </div>
  ),
  "Slider": (
    <div className="w-28 flex flex-col gap-1.5">
      <div className="relative h-1.5 bg-zinc-700 rounded-full">
        <div className="absolute inset-y-0 left-0 w-2/3 bg-white rounded-full" />
        <div className="absolute top-1/2 left-2/3 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 bg-white rounded-full border-2 border-zinc-950 shadow" />
      </div>
    </div>
  ),
  "Switch": (
    <div className="flex items-center gap-2">
      <div className="h-4 w-8 bg-white rounded-full flex items-center px-0.5">
        <div className="h-3 w-3 bg-zinc-950 rounded-full ml-auto" />
      </div>
      <span className="text-[9px] text-zinc-400">Enabled</span>
    </div>
  ),
  "Textarea": (
    <div className="w-28 h-14 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5">
      <div className="space-y-1">
        <div className="h-1 w-4/5 bg-zinc-700 rounded-full" />
        <div className="h-1 w-3/5 bg-zinc-700 rounded-full" />
        <div className="h-1 w-2/3 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Toggle": (
    <div className="flex gap-2">
      <div className="h-7 w-7 rounded-md bg-zinc-800 border border-zinc-600 flex items-center justify-center">
        <svg className="h-3.5 w-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h12M12 6l6 6-6 6" /></svg>
      </div>
      <div className="h-7 w-7 rounded-md bg-transparent border border-zinc-700 flex items-center justify-center">
        <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </div>
    </div>
  ),
  "Toggle Group": (
    <div className="flex rounded-md overflow-hidden border border-zinc-700">
      {["B", "I", "U"].map((c, i) => (
        <div key={c} className={`h-7 w-7 flex items-center justify-center text-[10px] font-bold border-r border-zinc-700 last:border-r-0 ${i === 0 ? "bg-zinc-700 text-white" : "bg-zinc-900 text-zinc-400"}`}>{c}</div>
      ))}
    </div>
  ),
  "Alert Dialog": (
    <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl">
      <div className="h-2 w-14 bg-zinc-200 rounded mb-1" />
      <div className="h-1 w-20 bg-zinc-600 rounded mb-2.5" />
      <div className="flex justify-end gap-1.5">
        <div className="px-2 py-0.5 rounded border border-zinc-600 text-[8px] text-zinc-400">Cancel</div>
        <div className="px-2 py-0.5 rounded bg-white text-[8px] text-black font-medium">Confirm</div>
      </div>
    </div>
  ),
  "Context Menu": (
    <div className="w-24 rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl">
      {["Copy", "Paste", "Delete"].map((item, i) => (
        <div key={item} className={`px-3 py-1 text-[9px] ${i === 2 ? "text-rose-400" : "text-zinc-300"}`}>{item}</div>
      ))}
    </div>
  ),
  "Dialog": (
    <div className="relative w-28 h-16">
      <div className="absolute inset-0 bg-black/40 rounded-lg" />
      <div className="absolute inset-2 rounded-md border border-zinc-700 bg-zinc-900 p-2">
        <div className="flex justify-between items-center mb-1.5">
          <div className="h-1.5 w-10 bg-zinc-300 rounded-full" />
          <div className="text-zinc-500 text-[8px]">✕</div>
        </div>
        <div className="h-1 w-full bg-zinc-700 rounded-full mb-1" />
        <div className="h-1 w-3/4 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Drawer": (
    <div className="relative w-28 h-16 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute bottom-0 left-0 right-0 h-10 rounded-t-lg border-t border-zinc-700 bg-zinc-900 p-1.5">
        <div className="h-0.5 w-8 bg-zinc-600 rounded-full mx-auto mb-1.5" />
        <div className="h-1 w-3/4 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Dropdown Menu": (
    <div className="flex flex-col gap-1 items-start">
      <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-zinc-700 bg-zinc-900">
        <span className="text-[9px] text-zinc-300">Options</span>
        <svg className="h-2.5 w-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      <div className="rounded-md border border-zinc-700 bg-zinc-900 py-1 w-20 shadow-xl">
        {["Profile", "Settings", "Logout"].map((item) => (
          <div key={item} className="px-2 py-0.5 text-[8px] text-zinc-400">{item}</div>
        ))}
      </div>
    </div>
  ),
  "Hover Card": (
    <div className="relative flex flex-col gap-1 items-start">
      <span className="text-[9px] text-blue-400 underline underline-offset-1">@handle</span>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 w-24 shadow-xl">
        <div className="flex gap-1.5 items-center mb-1">
          <div className="h-5 w-5 rounded-full bg-zinc-700 flex items-center justify-center text-[8px] text-zinc-400">JD</div>
          <div>
            <div className="h-1.5 w-8 bg-zinc-300 rounded-full mb-0.5" />
            <div className="h-1 w-6 bg-zinc-600 rounded-full" />
          </div>
        </div>
        <div className="h-1 w-full bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Popover": (
    <div className="relative flex flex-col items-center gap-1">
      <div className="px-2 py-1 rounded-md bg-white text-[9px] text-black font-medium">Open</div>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 w-24 shadow-xl">
        <div className="h-1 w-full bg-zinc-700 rounded-full mb-1" />
        <div className="h-1 w-3/4 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Sheet": (
    <div className="relative w-28 h-16 overflow-hidden rounded-lg">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute top-0 right-0 bottom-0 w-14 border-l border-zinc-700 bg-zinc-900 p-2">
        <div className="h-1.5 w-8 bg-zinc-300 rounded-full mb-1.5" />
        <div className="space-y-1">
          <div className="h-1 w-full bg-zinc-700 rounded-full" />
          <div className="h-1 w-4/5 bg-zinc-700 rounded-full" />
        </div>
      </div>
    </div>
  ),
  "Tooltip": (
    <div className="flex flex-col items-center gap-1">
      <div className="px-2 py-0.5 rounded bg-zinc-200 text-black text-[8px] font-medium shadow-md">Tooltip text</div>
      <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-200" />
      <div className="px-3 py-1 rounded-md border border-zinc-700 text-[9px] text-zinc-300">Hover me</div>
    </div>
  ),
  "Accordion": (
    <div className="w-28 border border-zinc-700 rounded-lg overflow-hidden">
      {[["Item 1", true], ["Item 2", false]].map(([label, open]) => (
        <div key={String(label)} className="border-b border-zinc-700 last:border-b-0">
          <div className="flex items-center justify-between px-2.5 py-1.5">
            <span className="text-[9px] text-zinc-300">{String(label)}</span>
            <svg className={`h-2.5 w-2.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </div>
          {open && <div className="px-2.5 pb-1.5"><div className="h-1 w-3/4 bg-zinc-700 rounded-full" /></div>}
        </div>
      ))}
    </div>
  ),
  "Alert": (
    <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 p-2">
      <div className="flex items-center gap-1.5 mb-1">
        <div className="h-3 w-3 rounded-full bg-blue-500/20 flex items-center justify-center text-[7px] text-blue-400 font-bold">i</div>
        <div className="h-1.5 w-12 bg-zinc-300 rounded-full" />
      </div>
      <div className="h-1 w-full bg-zinc-700 rounded-full" />
    </div>
  ),
  "Avatar": (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-semibold">JD</div>
      <div className="h-8 w-8 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-400">?</div>
    </div>
  ),
  "Badge": (
    <div className="flex flex-wrap gap-1.5 items-center justify-center">
      <div className="px-2 py-0.5 rounded-full bg-zinc-200 text-black text-[9px] font-medium">Default</div>
      <div className="px-2 py-0.5 rounded-full border border-zinc-600 text-zinc-300 text-[9px]">Outline</div>
      <div className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px]">Error</div>
    </div>
  ),
  "Calendar": (
    <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5">
      <div className="flex justify-between items-center mb-1.5 px-0.5">
        <div className="text-[8px] text-zinc-300">March 2026</div>
        <div className="flex gap-1">
          <div className="text-zinc-500 text-[9px]">‹</div>
          <div className="text-zinc-500 text-[9px]">›</div>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {["S","M","T","W","T","F","S"].map((d, i) => <div key={i} className="text-[7px] text-zinc-600 text-center">{d}</div>)}
        {[...Array(28)].map((_, i) => (
          <div key={i} className={`text-[7px] text-center rounded-sm ${i + 1 === 27 ? "bg-white text-black font-bold" : "text-zinc-500"}`}>{i + 1}</div>
        ))}
      </div>
    </div>
  ),
  "Carousel": (
    <div className="w-28 relative">
      <div className="rounded-lg border border-zinc-700 bg-zinc-800 h-12 flex items-center justify-center overflow-hidden">
        <div className="w-24 h-10 bg-gradient-to-r from-violet-600 to-blue-600 rounded flex items-center justify-center text-[8px] text-white">Slide 1</div>
      </div>
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 h-5 w-5 rounded-full bg-white/10 border border-zinc-600 flex items-center justify-center text-[9px] text-zinc-300">‹</div>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 h-5 w-5 rounded-full bg-white/10 border border-zinc-600 flex items-center justify-center text-[9px] text-zinc-300">›</div>
    </div>
  ),
  "Chart": (
    <div className="flex items-end gap-1 h-12 px-1">
      {[40, 70, 45, 90, 60, 80, 55].map((h, i) => (
        <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: `hsl(${220 + i * 8}, 70%, 60%)`, opacity: 0.85 }} />
      ))}
    </div>
  ),
  "Collapsible": (
    <div className="w-28 space-y-1">
      <div className="flex items-center justify-between px-2.5 py-1.5 rounded-md bg-zinc-800 border border-zinc-700">
        <span className="text-[9px] text-zinc-300">Section</span>
        <svg className="h-2.5 w-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>
      <div className="px-2.5 py-1.5 rounded-md bg-zinc-900 border border-zinc-800 space-y-1">
        <div className="h-1 w-full bg-zinc-700 rounded-full" />
        <div className="h-1 w-4/5 bg-zinc-700 rounded-full" />
      </div>
    </div>
  ),
  "Command": (
    <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden shadow-xl">
      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-zinc-800">
        <svg className="h-2.5 w-2.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        <span className="text-[9px] text-zinc-500">Type a command…</span>
      </div>
      <div className="py-1">
        {["New File", "Open Folder", "Settings"].map((item, i) => (
          <div key={item} className={`px-2 py-1 text-[8px] flex items-center gap-1.5 ${i === 0 ? "bg-zinc-800 text-white" : "text-zinc-500"}`}>
            <svg className="h-2 w-2 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            {item}
          </div>
        ))}
      </div>
    </div>
  ),
  "Data Table": (
    <div className="w-28 rounded-md border border-zinc-700 overflow-hidden">
      <div className="grid grid-cols-3 bg-zinc-800 border-b border-zinc-700">
        {["Name","Status","Amt"].map((h) => <div key={h} className="px-1.5 py-1 text-[7px] text-zinc-400 font-semibold">{h}</div>)}
      </div>
      {[["Alice","✓","$24"],["Bob","✗","$18"]].map(([name, status, amt]) => (
        <div key={name} className="grid grid-cols-3 border-b border-zinc-800 last:border-b-0">
          <div className="px-1.5 py-1 text-[7px] text-zinc-300">{name}</div>
          <div className={`px-1.5 py-1 text-[7px] ${status === "✓" ? "text-emerald-400" : "text-rose-400"}`}>{status}</div>
          <div className="px-1.5 py-1 text-[7px] text-zinc-400">{amt}</div>
        </div>
      ))}
    </div>
  ),
  "Progress": (
    <div className="w-28 space-y-2">
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-white rounded-full" /></div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full w-1/3 bg-zinc-400 rounded-full" /></div>
    </div>
  ),
  "Skeleton": (
    <div className="w-28 space-y-2">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-zinc-700 animate-pulse" />
        <div className="space-y-1.5 flex-1">
          <div className="h-1.5 bg-zinc-700 rounded-full animate-pulse w-full" />
          <div className="h-1.5 bg-zinc-700 rounded-full animate-pulse w-4/5" />
        </div>
      </div>
      <div className="h-12 bg-zinc-700 rounded-lg animate-pulse" />
    </div>
  ),
  "Table": (
    <div className="w-28 rounded-md border border-zinc-700 overflow-hidden text-[7px]">
      <div className="bg-zinc-800 grid grid-cols-2 border-b border-zinc-700">
        <div className="px-2 py-1 font-semibold text-zinc-300">Invoice</div>
        <div className="px-2 py-1 font-semibold text-zinc-300">Total</div>
      </div>
      {[["INV-001","$250"],["INV-002","$150"],["INV-003","$350"]].map(([inv, total]) => (
        <div key={inv} className="grid grid-cols-2 border-b border-zinc-800 last:border-b-0">
          <div className="px-2 py-1 text-zinc-400">{inv}</div>
          <div className="px-2 py-1 text-zinc-300">{total}</div>
        </div>
      ))}
    </div>
  ),
  "Typography": (
    <div className="w-28 space-y-1">
      <div className="text-sm font-bold text-zinc-100">Heading</div>
      <div className="text-[9px] text-zinc-400 leading-relaxed">Body text with normal size and relaxed line height.</div>
      <div className="text-[8px] text-zinc-600">Small muted text</div>
    </div>
  ),
  "Sonner": (
    <div className="space-y-1.5 w-28">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 flex items-center gap-2 shadow-lg">
        <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-[9px] text-zinc-200">Event created!</span>
      </div>
      <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-2 flex items-center gap-2 shadow-md opacity-60 scale-95">
        <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
        <span className="text-[9px] text-zinc-400">Loading…</span>
      </div>
    </div>
  ),
  "Spinner": (
    <div className="flex items-center gap-3">
      <div className="h-6 w-6 rounded-full border-2 border-zinc-600 border-t-white animate-spin" />
      <div className="h-4 w-4 rounded-full border-2 border-zinc-700 border-t-zinc-300 animate-spin" />
    </div>
  ),
  "Toast": (
    <div className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 p-2.5 shadow-xl">
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="h-1.5 w-14 bg-zinc-200 rounded-full" />
        <div className="text-zinc-600 text-[8px]">✕</div>
      </div>
      <div className="h-1 w-20 bg-zinc-700 rounded-full" />
    </div>
  ),
};

/* ─── constants ──────────────────────────────────────────────────────────── */
const CATEGORY_COLORS: Record<string, string> = {
  Layout:     "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Navigation: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Forms:      "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  Overlay:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  Display:    "bg-sky-500/10 text-sky-400 border-sky-500/20",
  Feedback:   "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Utilities:  "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const CONFIDENCE_COLORS = {
  high:   "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  low:    "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

const DOCS_BASE = "https://ui.shadcn.com/docs/components/";
function slug(name: string) { return name.toLowerCase().replace(/\s+/g, "-"); }
function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── components tab ─────────────────────────────────────────────────────── */
function ComponentsTab() {
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = SHADCN_COMPONENTS.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );
  const categories = Array.from(new Set(SHADCN_COMPONENTS.map((c) => c.category)));

  const copyInstall = (name: string) => {
    navigator.clipboard.writeText(`npx shadcn@latest add ${slug(name)}`);
    setCopied(name);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components…"
          className="pl-9 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-600"
        />
      </div>
      {filtered.length === 0 && (
        <div className="text-center py-16 text-zinc-500 text-sm">No components match &ldquo;{search}&rdquo;</div>
      )}
      {categories.map((cat) => {
        const items = filtered.filter((c) => c.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat}>
            <div className="flex items-center gap-3 mb-4">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[cat]}`}>{cat}</span>
              <span className="text-xs text-zinc-600">{items.length} components</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {items.map((comp) => (
                <div key={comp.name} className="group rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden hover:border-zinc-600 transition-all hover:shadow-lg hover:shadow-black/30">
                  <div className="h-[110px] bg-zinc-950 border-b border-zinc-800 flex items-center justify-center p-3 relative overflow-hidden">
                    <div className="transform scale-90 group-hover:scale-100 transition-transform duration-200">
                      {PREVIEWS[comp.name] ?? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                            <svg className="h-4 w-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                          </div>
                          <span className="text-[9px] text-zinc-600">Preview</span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => copyInstall(comp.name)} title="Copy install command" className="rounded-md p-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                        {copied === comp.name
                          ? <svg className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          : <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
                      </button>
                      <a href={`${DOCS_BASE}${slug(comp.name)}`} target="_blank" rel="noopener noreferrer" className="rounded-md p-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    </div>
                  </div>
                  <div className="p-3">
                    <a href={`${DOCS_BASE}${slug(comp.name)}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-zinc-100 hover:text-white transition-colors block mb-1 truncate">{comp.name}</a>
                    <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{comp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── history item ───────────────────────────────────────────────────────── */
function HistoryItem({ session, onRestore }: { session: MatchSession; onRestore: (s: MatchSession) => void }) {
  return (
    <button
      onClick={() => onRestore(session)}
      className="w-full text-left rounded-lg border border-zinc-800 bg-zinc-900 hover:border-zinc-700 p-3 transition-colors group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-zinc-300 truncate">{session.image_name ?? "Screenshot"}</span>
        <span className="text-[10px] text-zinc-600 shrink-0 ml-2">{relativeTime(session.created_at)}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {(session.matches as ComponentMatch[]).slice(0, 4).map((m, i) => (
          <span key={i} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded-md">{m.component}</span>
        ))}
        {session.matches.length > 4 && (
          <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded-md">+{session.matches.length - 4} more</span>
        )}
      </div>
    </button>
  );
}

/* ─── matcher tab ────────────────────────────────────────────────────────── */
interface MatcherTabProps {
  imageDataUrl: string | null;
  setImageDataUrl: (v: string | null) => void;
  matches: ComponentMatch[];
  setMatches: (v: ComponentMatch[]) => void;
}

function MatcherTab({ imageDataUrl, setImageDataUrl, matches, setMatches }: MatcherTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [history, setHistory]       = useState<MatchSession[]>([]);
  const [dbReady, setDbReady]       = useState<boolean | null>(null); // null = unknown
  const fileInputRef                = useState<HTMLInputElement | null>(null);

  /* load history on mount */
  useEffect(() => {
    const sid = getSessionId();
    loadSessions(sid).then((rows) => {
      setDbReady(true);
      setHistory(rows);
    }).catch(() => setDbReady(false));
  }, []);

  const loadFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataUrl(e.target?.result as string);
      setMatches([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
  };

  const analyze = useCallback(async () => {
    if (!imageDataUrl) return;
    setLoading(true);
    setMatches([]);
    setError(null);
    try {
      const [meta, base64] = imageDataUrl.split(",");
      const mimeType = meta.match(/:(.*?);/)?.[1] || "image/png";
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      if (Array.isArray(data.matches)) {
        setMatches(data.matches);
        /* persist to supabase */
        const sid = getSessionId();
        const saved = await saveSession(data.matches, sid, data.imageName);
        if (saved) setHistory((prev) => [saved, ...prev].slice(0, 10));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [imageDataUrl, setMatches]);

  const restoreSession = (s: MatchSession) => {
    setMatches(s.matches as ComponentMatch[]);
    setError(null);
  };

  const grouped = matches.reduce<Record<string, ComponentMatch[]>>((acc, m) => {
    const key = m.location || "Other";
    (acc[key] = acc[key] || []).push(m);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5 items-start">
      {/* ─── main column ─── */}
      <div className="space-y-5">
        {/* DB setup banner */}
        {dbReady === false && (
          <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 px-4 py-3 flex items-start gap-3">
            <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div className="min-w-0">
              <p className="text-amber-300 text-xs font-medium mb-1">Database table missing</p>
              <p className="text-amber-400/70 text-[11px] mb-2">Run this in your <a href="https://supabase.com/dashboard/project/chivcdzgwnvmzquechop/sql" target="_blank" rel="noopener noreferrer" className="underline">Supabase SQL editor</a> to enable history:</p>
              <code className="block text-[10px] bg-black/30 text-amber-300 px-3 py-2 rounded-lg font-mono whitespace-pre overflow-x-auto">{`create table public.match_sessions (
  id         uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  matches    jsonb not null default '[]',
  session_id text,
  image_name text
);
alter table public.match_sessions enable row level security;
create policy "anon insert" on public.match_sessions for insert with check (true);
create policy "anon select" on public.match_sessions for select using (true);`}</code>
            </div>
          </div>
        )}

        {/* Upload zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          className={`relative rounded-xl border-2 border-dashed transition-colors ${
            isDragging ? "border-zinc-400 bg-zinc-800/60"
            : imageDataUrl ? "border-zinc-700 bg-zinc-900"
            : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
          }`}
        >
          {imageDataUrl ? (
            <div className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                  <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                </div>
                <span className="text-xs text-zinc-500 font-medium ml-1">Preview</span>
                <button onClick={() => { setImageDataUrl(null); setMatches([]); setError(null); }} className="ml-auto text-xs text-zinc-600 hover:text-zinc-400 transition-colors">Remove</button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageDataUrl} alt="Uploaded screenshot" className="w-full max-h-80 object-contain rounded-lg border border-zinc-800" />
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center py-16 cursor-pointer text-center px-6">
              <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-sm font-medium text-zinc-300 mb-1">Drop a screenshot here</p>
              <p className="text-xs text-zinc-600">or click to browse — PNG, JPG, WebP</p>
              <input ref={(el) => { fileInputRef[1](el); }} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
            </label>
          )}
        </div>

        <Button onClick={analyze} disabled={loading || !imageDataUrl} className="w-full bg-white text-black hover:bg-zinc-200 font-medium h-10">
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
              Analyzing with Gemini…
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Match Components
            </span>
          )}
        </Button>

        {error && (
          <div className="rounded-xl bg-rose-950/30 border border-rose-800/50 px-4 py-3 flex items-center gap-2">
            <svg className="h-4 w-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-rose-400 text-sm">{error}</p>
          </div>
        )}

        {(matches.length > 0 || loading) && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-xs text-zinc-500 font-medium">Matched Components</span>
              {matches.length > 0 && <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400">{matches.length} found</Badge>}
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="h-8 w-8 rounded-full border-2 border-zinc-600 border-t-zinc-300 animate-spin mb-4" />
                <p className="text-zinc-500 text-sm">Gemini is analyzing your screenshot…</p>
              </div>
            ) : (
              <ScrollArea className="h-[420px]">
                <div className="p-4 space-y-5">
                  {Object.entries(grouped).map(([location, items], i) => (
                    <div key={location}>
                      {i > 0 && <Separator className="bg-zinc-800 my-4" />}
                      <p className="text-xs font-semibold text-zinc-600 uppercase tracking-wider mb-3">{location}</p>
                      <div className="space-y-2.5">
                        {items.map((match, idx) => (
                          <div key={idx} className="rounded-lg bg-zinc-800/60 border border-zinc-700/40 overflow-hidden">
                            <div className="flex items-stretch">
                              {/* thumbnail */}
                              <div className="w-24 shrink-0 bg-zinc-950 border-r border-zinc-700/40 flex items-center justify-center p-2">
                                <div className="transform scale-75 origin-center">
                                  {PREVIEWS[match.component] ?? (
                                    <div className="h-10 w-10 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                      <svg className="h-5 w-5 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* details */}
                              <div className="flex-1 p-3 space-y-1.5 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <a href={`${DOCS_BASE}${slug(match.component)}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-white hover:text-zinc-300 underline underline-offset-2 transition-colors">{match.component}</a>
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CONFIDENCE_COLORS[match.confidence]}`}>{match.confidence}</span>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed"><span className="text-zinc-300">{match.element}</span> — {match.reason}</p>
                                {match.props && (
                                  <code className="block text-xs bg-zinc-950 text-emerald-400 px-3 py-1.5 rounded-lg font-mono truncate">
                                    &lt;{match.component.replace(/\s+/g, "")} {match.props} /&gt;
                                  </code>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {matches.length > 0 && (
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
              <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-xs text-zinc-500 font-medium">Quick Install</span>
            </div>
            <div className="p-4">
              <code className="block text-xs bg-zinc-950 text-emerald-400 px-4 py-3 rounded-lg font-mono overflow-x-auto whitespace-nowrap">
                npx shadcn@latest add {[...new Set(matches.map((m) => slug(m.component)))].join(" ")}
              </code>
            </div>
          </div>
        )}
      </div>

      {/* ─── history sidebar ─── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <span className="text-xs font-medium text-zinc-400">History</span>
          <div className="flex items-center gap-1.5">
            {dbReady === true && <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Connected to Supabase" />}
            {dbReady === false && <div className="h-1.5 w-1.5 rounded-full bg-amber-500" title="Supabase not set up" />}
            {history.length > 0 && <span className="text-[10px] text-zinc-600">{history.length}</span>}
          </div>
        </div>
        {history.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="h-8 w-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
              <svg className="h-4 w-4 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <p className="text-xs text-zinc-600">No history yet</p>
            <p className="text-[10px] text-zinc-700 mt-0.5">Past analyses appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[520px]">
            <div className="p-3 space-y-2">
              {history.map((s) => <HistoryItem key={s.id} session={s} onRestore={restoreSession} />)}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────────────────────────────── */
export default function Home() {
  /* lifted state — survives tab switches */
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [matches, setMatches]           = useState<ComponentMatch[]>([]);

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-white text-black font-bold text-sm">s</div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-none">shadcn matcher</h1>
              <p className="text-xs text-zinc-500 mt-0.5">screenshot → shadcn/ui</p>
            </div>
          </div>
          <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
            ui.shadcn.com
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-8">
        <Tabs defaultValue="matcher">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Component Matcher</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Upload a wireframe to match shadcn/ui components</p>
            </div>
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="matcher" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400">
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Matcher
              </TabsTrigger>
              <TabsTrigger value="components" className="text-xs data-[state=active]:bg-white data-[state=active]:text-black text-zinc-400">
                <svg className="h-3.5 w-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Components
                <span className="ml-1.5 text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">{SHADCN_COMPONENTS.length}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* state is lifted — both tabs share it, no reset on switch */}
          <TabsContent value="matcher" className="mt-0">
            <MatcherTab
              imageDataUrl={imageDataUrl}
              setImageDataUrl={setImageDataUrl}
              matches={matches}
              setMatches={setMatches}
            />
          </TabsContent>
          <TabsContent value="components" className="mt-0">
            <ComponentsTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
