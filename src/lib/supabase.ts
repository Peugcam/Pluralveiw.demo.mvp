import { createClient, SupabaseClient, AuthResponse, Session, User } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions
export const auth = {
  signUp: async (email: string, password: string): Promise<AuthResponse> => {
    return await supabase.auth.signUp({ email, password });
  },

  signIn: async (email: string, password: string): Promise<AuthResponse> => {
    return await supabase.auth.signInWithPassword({ email, password });
  },

  signOut: async (): Promise<{ error: Error | null }> => {
    return await supabase.auth.signOut();
  },

  getUser: async (): Promise<{ data: { user: User | null }, error: Error | null }> => {
    return await supabase.auth.getUser();
  },

  getSession: async (): Promise<{ data: { session: Session | null }, error: Error | null }> => {
    return await supabase.auth.getSession();
  }
};
