
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { resetAuth } from "@/utils/authCleanup";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
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
        
        // Don't sign out for missing profile - just return null
        if (error.code === 'PGRST116') {
          console.warn('⚠️ AuthContext: Profile not found for user:', userId);
          return null;
        }
        
        // For other errors, also just return null instead of signing out
        console.warn('⚠️ AuthContext: Role fetch failed, continuing without role');
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

    // Set up a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ AuthContext: Loading timeout reached, forcing completion');
        setLoading(false);
      }
    }, 8000); // 8 second timeout

    // Function to handle session change
    const handleSession = async (newSession: Session | null) => {
      console.log('🔄 AuthContext: Session changed:', {
        hasUser: !!newSession?.user,
        userId: newSession?.user?.id,
        mounted
      });
      
      if (!mounted) {
        console.log('🔄 AuthContext: Component unmounted, skipping session handling');
        return;
      }
      
      // Clear the timeout since we're handling the session
      clearTimeout(loadingTimeout);
      
      // Always update session first
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      if (newSession?.user) {
        console.log('🔍 AuthContext: Fetching role for user:', newSession.user.id);
        // Fetch role for the user with error handling and timeout
        try {
          // Increase timeout to 10 seconds and add more robust error handling
          const rolePromise = fetchUserRole(newSession.user.id);
          const roleTimeout = new Promise((resolve) => 
            setTimeout(() => {
              console.warn('⚠️ AuthContext: Role fetch timeout, continuing without role');
              resolve(null); // Resolve with null instead of rejecting
            }, 10000)
          );
          
          const userRole = await Promise.race([rolePromise, roleTimeout]);
          
          if (mounted) {
            if (userRole) {
              setRole(userRole);
              console.log('✅ AuthContext: Role set to:', userRole);
            } else {
              console.warn('⚠️ AuthContext: No role found for user, continuing without role');
              setRole(null);
            }
          }
        } catch (error) {
          console.error('❌ AuthContext: Error fetching role:', error);
          if (mounted) {
            console.warn('⚠️ AuthContext: Continuing without role due to error');
            setRole(null);
          }
        }
      } else {
        if (mounted) {
          setRole(null);
          console.log('🎭 AuthContext: Role cleared (no user)');
        }
      }
      
      if (mounted) {
        setLoading(false);
        console.log('✅ AuthContext: Auth state updated, loading complete');
      }
    };

    // Set up auth state listener
    console.log('🔧 AuthContext: Setting up auth state listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('🔔 AuthContext: Auth state change event:', event, {
          hasUser: !!newSession?.user,
          userId: newSession?.user?.id
        });
        await handleSession(newSession);
      }
    );

    // Check for existing session immediately with timeout protection
    console.log('🔍 AuthContext: Checking for existing session');
    const sessionPromise = supabase.auth.getSession();
    const sessionTimeout = new Promise((resolve) => 
      setTimeout(() => {
        console.warn('⚠️ AuthContext: Session check timeout, proceeding without session');
        resolve({ data: { session: null }, error: null });
      }, 5000)
    );
    
    Promise.race([sessionPromise, sessionTimeout]).then(async (result: any) => {
      const { data: { session: currentSession }, error } = result;
      
      if (error) {
        console.error('❌ AuthContext: Error getting session:', error);
        if (mounted) {
          setLoading(false);
        }
        return;
      }
      
      console.log('🔍 AuthContext: Initial session check:', {
        hasSession: !!currentSession,
        hasUser: !!currentSession?.user,
        userId: currentSession?.user?.id
      });
      await handleSession(currentSession);
    });

    return () => {
      console.log('🧹 AuthContext: Cleaning up auth listener');
      mounted = false;
      clearTimeout(loadingTimeout);
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    try {
      console.log('🚪 AuthContext: Starting sign out process...');
      // Use comprehensive auth cleanup that handles all cached data
      await resetAuth();
      console.log('✅ AuthContext: Sign out completed successfully');
    } catch (error) {
      console.error('❌ AuthContext: Error during sign out:', error);
      // Even if there's an error, ensure user is signed out
      await supabase.auth.signOut();
    }
  }, []); // No dependencies - function is stable

  // Memoize context value with stable primitives to prevent object identity thrash on Hot/Fast Refresh
  const contextValue = useMemo(() => ({
    user,
    session,
    role,
    loading,
    signOut,
  }), [
    user?.id,    // Use stable primitive (id) instead of full user object
    user?.email, // Use stable primitive (email) instead of full user object
    session?.access_token, // Use stable primitive (token) instead of full session object
    role,
    loading,
    signOut
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export as named exports to fix Fast Refresh
export { AuthProvider, useAuth };

// Default export for convenience
export default AuthProvider;
