import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Public, anonymous client. The standalone contracting app has no login —
// it only uses `supabase.functions.invoke(...)` to reach the two edge
// functions (generate-contracting-pdf, send-contracting-packet), both of
// which run with verify_jwt = false and accept the anon key.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
