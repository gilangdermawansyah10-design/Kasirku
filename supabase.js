const SUPABASE_URL = "https://giowhlbwlnxclqlymdul.supabase.co";
const SUPABASE_KEY = "sb_publishable_v8LdpV9n0PtoHLxbAaHWjw_GUtjlRXb";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }
);