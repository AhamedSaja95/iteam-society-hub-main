import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user?.id)
        .single();

      if (error) throw error;

      const role = data?.role || null;
      setUserRole(role);

      // Redirect to appropriate modern dashboard
      if (role === "admin") {
        navigate("/dashboard/admin/modern");
      } else if (role === "staff") {
        navigate("/dashboard/modern-staff");
      } else if (role === "student") {
        navigate("/dashboard/modern-student");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iteam-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Show loading or redirect message
  return (
    <div className="text-center py-12">
      <h2 className="text-xl font-semibold mb-4">Welcome to I-Team Society</h2>
      <p className="text-gray-600">Redirecting to your dashboard...</p>
    </div>
  );
};

export default Dashboard;
