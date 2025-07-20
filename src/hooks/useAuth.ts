import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and sets the user
    const getSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        // Fetch user role
        console.log("🔍 Fetching role for user:", session.user.id);
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        console.log("👤 Profile data:", profile);
        console.log("❌ Profile error:", error);
        const userRole = profile?.role;
        setRole(userRole);
        console.log("🎭 Role set to:", userRole);
        console.log("🔍 useAuth state after role set:", { user: session.user.id, role: userRole });
      }
    };

    getSession();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        console.log(
          "🔄 Auth state changed, fetching role for:",
          session.user.id
        );
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        console.log("👤 Auth change - Profile data:", profile);
        console.log("❌ Auth change - Profile error:", error);
        const userRole = profile?.role;
        setRole(userRole);
        console.log("🎭 Auth change - Role set to:", userRole);
        console.log("🔍 useAuth auth change state:", { user: session.user.id, role: userRole });
      } else {
        setRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    role,
    loading,
    signOut,
  };
};
