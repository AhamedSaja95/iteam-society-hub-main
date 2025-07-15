import { supabase } from "@/integrations/supabase/client";

export const MembershipService = {
  getCurrentMembership: async (userId: string) => {
    try {
      console.log("Fetching current membership for user:", userId);

      const { data, error } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching current membership:", error);

        // Handle specific error cases
        if (error.code === 'PGRST116') {
          // No rows found - user has no membership
          console.log("No membership found for user");
          return null;
        } else if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Permission denied. Please check your login status.");
        } else if (error.message.includes('406')) {
          throw new Error("Request format error. Please refresh the page and try again.");
        }

        throw error;
      }

      console.log("Current membership found:", data);
      return data;
    } catch (error) {
      console.error("getCurrentMembership failed:", error);
      throw error;
    }
  },

  hasActiveMembership: async (userId: string) => {
    const { data, error } = await supabase
      .rpc('has_active_membership', { user_id: userId });
    
    if (error) throw error;
    return data;
  },

  getAllMemberships: async () => {
    const { data, error } = await supabase
      .from('memberships')
      .select(`
        *,
        profiles!memberships_user_id_fkey(
          first_name,
          last_name,
          role
        ),
        payments(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  updateMembershipStatus: async (membershipId: string, status: string) => {
    const { data, error } = await supabase
      .from('memberships')
      .update({ status })
      .eq('id', membershipId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  createMembership: async (membershipData: {
    user_id: string;
    tier: string;
    status: string;
    start_date: string;
    end_date: string;
    amount: number;
    eid: string;
  }) => {
    try {
      console.log("Creating membership with data:", membershipData);

      const { data, error } = await supabase
        .from('memberships')
        .insert(membershipData)
        .select()
        .single();

      if (error) {
        console.error("Membership creation error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Handle specific error types
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Permission denied. Please try logging out and back in.");
        } else if (error.code === '23505') {
          throw new Error("You already have a membership application pending.");
        }

        throw error;
      }

      console.log("Membership created successfully:", data);
      return data;
    } catch (error) {
      console.error("Membership creation failed:", error);
      throw error;
    }
  },

  createPayment: async (paymentData: {
    user_id: string;
    membership_id?: string;
    amount: number;
    notes?: string;
    payment_date?: string;
    bank_slip_url?: string | null;
    status: string;
  }) => {
    try {
      console.log("Creating payment with data:", paymentData);

      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select()
        .single();

      if (error) {
        console.error("Payment creation error:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });

        // Handle specific error types
        if (error.code === '42501' || error.message.includes('row-level security')) {
          throw new Error("Permission denied. Please try logging out and back in.");
        }

        throw error;
      }

      console.log("Payment created successfully:", data);
      return data;
    } catch (error) {
      console.error("Payment creation failed:", error);
      throw error;
    }
  }
};