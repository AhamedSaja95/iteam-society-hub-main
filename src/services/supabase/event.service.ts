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

  // Old methods removed to avoid duplication

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

  updateEvent: async (eventId: string, eventData: any, sendNotifications: boolean = false) => {
    try {
      console.log("Starting event update for:", eventId, "with notifications:", sendNotifications);

      // Get current event data and registrations if notifications are needed
      let registrations: any[] = [];
      let originalEvent: any = null;

      if (sendNotifications) {
        console.log("Fetching original event data for notifications");
        const { data: eventWithRegs, error: fetchError } = await supabase
          .from("events")
          .select(`
            *,
            event_registrations(
              user_id,
              profiles!event_registrations_user_id_fkey(
                id,
                first_name,
                last_name
              )
            )
          `)
          .eq("id", eventId)
          .single();

        if (fetchError) {
          console.error("Error fetching event for notifications:", fetchError);
          throw new Error(`Failed to fetch event data: ${fetchError.message}`);
        }

        originalEvent = eventWithRegs;
        registrations = eventWithRegs?.event_registrations || [];
        console.log("Found", registrations.length, "registrations for notifications");
      }

      // Update the event
      console.log("Updating event with data:", eventData);
      const { data, error } = await supabase
        .from("events")
        .update({
          name: eventData.name,
          description: eventData.description,
          event_date: eventData.event_date,
          location: eventData.location,
          max_participants: eventData.max_participants,
          event_type: eventData.event_type,
          requirements: eventData.requirements,
          contact_info: eventData.contact_info,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId)
        .select()
        .single();

      if (error) {
        console.error("Error updating event:", error);
        throw new Error(`Failed to update event: ${error.message}`);
      }

      console.log("Event updated successfully");

      // Send notifications if requested and there are registrations
      if (sendNotifications && registrations.length > 0 && originalEvent) {
        try {
          console.log("Processing notifications for", registrations.length, "users");

          // Create update message based on what changed
          const changes = [];
          if (originalEvent.name !== eventData.name) changes.push("name");
          if (originalEvent.event_date !== eventData.event_date) changes.push("date/time");
          if (originalEvent.location !== eventData.location) changes.push("location");
          if (originalEvent.description !== eventData.description) changes.push("description");

          console.log("Detected changes:", changes);

          if (changes.length > 0) {
            const updateMessage = `Event details updated: ${changes.join(", ")}. Please check the latest information.`;
            const userIds = registrations.map((reg: any) => reg.user_id);

            // Create notifications with both column options to handle either schema
            const notifications = userIds.map((userId) => ({
              user_id: userId,
              title: "Event Updated",
              message: `The event "${eventData.name}" has been updated: ${updateMessage}`,
              type: "info",
              read: false,
              is_read: false, // Include both column names for compatibility
            }));

            console.log("Creating notifications:", notifications.length);

            // Use direct database access for notifications
            const { error: notifError } = await supabase
              .from('notifications')
              .insert(notifications);

            if (notifError) {
              console.error("Error inserting update notifications:", notifError);
            } else {
              console.log("Update notifications sent successfully");
            }
          } else {
            console.log("No significant changes detected, skipping notifications");
          }
        } catch (notificationError) {
          console.error("Error creating update notifications:", notificationError);
          // Don't throw error here, event was successfully updated
        }
      }

      console.log("Event update completed successfully");
      return data;

    } catch (error) {
      console.error("Event update failed:", error);
      throw error;
    }
  },

  deleteEvent: async (eventId: string, sendNotifications: boolean = false) => {
    try {
      console.log("Starting event deletion for:", eventId);

      // First, get basic event details
      const { data: event, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (eventError) {
        console.error("Error fetching event:", eventError);
        throw new Error(`Failed to fetch event: ${eventError.message}`);
      }

      if (!event) {
        throw new Error("Event not found");
      }

      // Get registrations separately (removed email field as it may not exist)
      const { data: registrations, error: regError } = await supabase
        .from("event_registrations")
        .select(`
          id,
          user_id,
          profiles!event_registrations_user_id_fkey(
            id,
            first_name,
            last_name
          )
        `)
        .eq("event_id", eventId);

      if (eventError) {
        console.error("Error fetching event:", eventError);
        throw new Error(`Failed to fetch event: ${eventError.message}`);
      }

      if (regError) {
        console.error("Error fetching registrations:", regError);
        throw new Error(`Failed to fetch registrations: ${regError.message}`);
      }

      console.log("Event found:", event.name, "with", registrations?.length || 0, "registrations");

      // If there are registrations and notifications should be sent
      if (registrations && registrations.length > 0 && sendNotifications) {
        try {
          console.log("Sending notifications to", registrations.length, "users");

          // Create notifications directly to avoid potential issues
          // Create notifications with both column options to handle either schema
          const notifications = registrations.map((reg: any) => ({
            user_id: reg.user_id,
            title: "Event Cancelled",
            message: `The event "${event.name}" scheduled for ${new Date(
              event.event_date
            ).toLocaleDateString()} has been cancelled. We apologize for any inconvenience.`,
            type: "warning",
            read: false,
            is_read: false, // Include both column names for compatibility
          }));

          const { error: notifError } = await supabase
            .from('notifications')
            .insert(notifications);

          if (notifError) {
            console.error("Error inserting notifications:", notifError);
          } else {
            console.log("Notifications sent successfully");
          }
        } catch (notificationError) {
          console.error("Error creating notifications:", notificationError);
          // Don't throw error here, continue with deletion
        }
      }

      // Delete event registrations first (cascade)
      if (registrations && registrations.length > 0) {
        console.log("Deleting", registrations.length, "registrations");
        const { error: regDeleteError } = await supabase
          .from("event_registrations")
          .delete()
          .eq("event_id", eventId);

        if (regDeleteError) {
          console.error("Error deleting registrations:", regDeleteError);
          throw new Error(`Failed to delete registrations: ${regDeleteError.message}`);
        }
        console.log("Registrations deleted successfully");
      }

      // Delete the event
      console.log("Deleting event");
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting event:", error);
        throw new Error(`Failed to delete event: ${error.message}`);
      }

      console.log("Event deleted successfully");
      return {
        success: true,
        notificationsSent: sendNotifications ? (registrations?.length || 0) : 0,
        registrationsDeleted: registrations?.length || 0,
      };

    } catch (error) {
      console.error("Event deletion failed:", error);
      throw error;
    }
  },
};
