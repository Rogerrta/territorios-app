const SUPABASE_URL =
  "https://qknfpvhlgauwpgbsvijc.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_XKZiTJeTJ1AkHw00FdeTNA_Rjs54VbX";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );