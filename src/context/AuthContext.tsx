
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Function to fetch user role from database
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 AuthContext: Fetching role for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AuthContext: Error fetching role:', error);
        return null;
      }

      console.log('✅ AuthContext: Role fetched:', data?.role);
      return data?.role || null;
    } catch (err) {
      console.error('❌ AuthContext: Unexpected error fetching role:', err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Function to handle session change
    const handleSession = async (newSession: Session | null) => {
      console.log('🔄 AuthContext: Session changed:', !!newSession?.user);
      
      if (!mounted) return;
      
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        // Fetch role for the user
        const userRole = await fetchUserRole(newSession.user.id);
        if (mounted) {
          setRole(userRole);
          console.log('🎭 AuthContext: Role set to:', userRole);
        }
      } else {
        if (mounted) {
          setRole(null);
          console.log('🎭 AuthContext: Role cleared');
        }
      }
      
      if (mounted) {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔄 AuthContext: Auth state change event:', event);
        await handleSession(newSession);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      console.log('🔍 AuthContext: Initial session check:', !!currentSession?.user);
      await handleSession(currentSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
