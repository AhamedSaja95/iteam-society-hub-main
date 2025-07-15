import { supabase } from "@/integrations/supabase/client";

export const EventService = {
  getAllEvents: async () => {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_registrations(
          id,
          user_id,
          attended
        )
      `
      )
      .order("event_date", { ascending: true });

    if (error) throw error;
    return data;
  },

  getEventById: async (eventId: string) => {
    const { data, error } = await supabase
      .from("events")
      .select(
        `
        *,
        event_registrations(
          id,
          user_id,
          attended
        )
      `
      )
      .eq("id", eventId)
      .single();

    if (error) throw error;
    return data;
  },

  createEvent: async (eventData: any) => {
    const { data, error } = await supabase
      .from("events")
      .insert(eventData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  updateEvent: async (eventId: string, updates: any) => {
    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", eventId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  deleteEvent: async (eventId: string) => {
    const { error } = await supabase.from("events").delete().eq("id", eventId);

    if (error) throw error;
  },

  registerForEvent: async (eventId: string, userId: string) => {
    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (existingRegistration) {
      // If registered, unregister
      const { error } = await supabase
        .from("event_registrations")
        .delete()
        .eq("id", existingRegistration.id);

      if (error) throw error;
      return null;
    } else {
      // If not registered, register
      const { data, error } = await supabase
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: userId,
          registered_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  updateAttendance: async (registrationId: string, attended: boolean) => {
    const { data, error } = await supabase
      .from("event_registrations")
      .update({
        attended,
        attended_at: attended ? new Date().toISOString() : null,
      })
      .eq("id", registrationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
