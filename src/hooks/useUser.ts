import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserService } from "@/services/supabase/user.service";
import { AuthService } from "@/services/supabase/auth.service";

export const useUser = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [profileData, roleData, adminCheck, staffCheck] =
          await Promise.all([
            UserService.getProfile(user.id),
            AuthService.getUserRole(user.id),
            AuthService.isAdmin(user.id),
            AuthService.isStaff(user.id),
          ]);

        setProfile(profileData);
        setRole(roleData);
        setIsAdmin(adminCheck);
        setIsStaff(staffCheck);
      } catch (err: any) {
        console.error("Error loading user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user]);

  return {
    profile,
    userProfile: profile,
    role,
    isAdmin,
    isStaff,
    loading,
    error,
  };
};
