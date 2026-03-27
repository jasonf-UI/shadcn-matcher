import { createClient } from "@supabase/supabase-js";

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(url, anon);

export interface MatchSession {
  id: string;
  created_at: string;
  matches: ComponentMatch[];
  session_id: string | null;
  image_name: string | null;
}

export interface ComponentMatch {
  element: string;
  component: string;
  reason: string;
  confidence: "high" | "medium" | "low";
  props: string;
  location: string;
}

/** Save an analysis result.  Returns the saved row or null on error. */
export async function saveSession(
  matches: ComponentMatch[],
  sessionId: string,
  imageName?: string
): Promise<MatchSession | null> {
  const { data, error } = await supabase
    .from("match_sessions")
    .insert({ matches, session_id: sessionId, image_name: imageName ?? null })
    .select()
    .single();
  if (error) { console.warn("Supabase save error:", error.message); return null; }
  return data as MatchSession;
}

/** Load the most-recent N sessions for a given session_id.
 *  Throws if the table doesn't exist so callers can detect DB setup state. */
export async function loadSessions(sessionId: string, limit = 10): Promise<MatchSession[]> {
  const { data, error } = await supabase
    .from("match_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    // PGRST205 = table not found; treat all errors as "DB not ready" by throwing
    throw new Error(error.message);
  }
  return (data ?? []) as MatchSession[];
}
