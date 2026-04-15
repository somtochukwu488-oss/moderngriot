// js/supabase-config.js

// WARNING: You have provided the "service_role" key. 
// This key bypasses all Row Level Security (RLS) policies. 
// In a real production app, you should replace it with the "anon" public key.
const SUPABASE_URL = 'https://exbnwphkmrkzbxdlkaup.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4Ym53cGhrbXJremJ4ZGxrYXVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjI1Mzg5MiwiZXhwIjoyMDkxODI5ODkyfQ.ZHsGsvCGQsMfR7pIT1d8nZRkzEA-HWCHvGD88Ph4hEI';

// We rely on the global Supabase script tag provided via CDN
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// Helper function to get current user session
export async function getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}
