import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://tsiyldbdmvufbdmbqfft.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzaXlsZGJkbXZ1ZmJkbWJxZmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNzczMDIsImV4cCI6MjA3OTY1MzMwMn0.PX9FG73sjDWS3ub_I1QGTp5ttXSVQvtXf9wvDBQPBQw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export const auth = supabase.auth;
export const db = supabase;
