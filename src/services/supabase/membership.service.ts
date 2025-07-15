import { supabase } from "@/integrations/supabase/client";

export const MembershipService = {
  getCurrentMembership: async (userId: string) => {
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) throw error;
    return data;
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
  }
};