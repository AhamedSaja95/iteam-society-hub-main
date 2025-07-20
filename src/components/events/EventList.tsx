import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  location_type: string;
  max_participants?: number;
  registration_deadline?: string;
  poster_url?: string;
  status: string;
  created_at: string;
  registrations_count?: number;
  user_registered?: boolean;
}

interface EventListProps {
  showActions?: boolean;
  onEditEvent?: (event: Event) => void;
  userRole?: string;
}

const EventList: React.FC<EventListProps> = ({ 
  showActions = false, 
  onEditEvent,
  userRole 
}) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchEvents();
  }, [user]);

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          event_registrations!left(
            id
          )
        `)
        .eq('status', 'active')
        .order('event_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;

      // Check if user is registered for each event
      const eventsWithRegistration = await Promise.all(
        (data || []).map(async (event) => {
          let userRegistered = false;
          
          if (user) {
            const { data: registration } = await supabase
              .from('event_registrations')
              .select('id')
              .eq('event_id', event.id)
              .eq('user_id', user.id)
              .single();
            
            userRegistered = !!registration;
          }

          return {
            ...event,
            registrations_count: Array.isArray(event.event_registrations) ? event.event_registrations.length : 0,
            user_registered: userRegistered
          };
        })
      );

      setEvents(eventsWithRegistration);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const registerForEvent = async (eventId: string) => {
    if (!user) {
      toast.error('Please log in to register for events');
      return;
    }

    try {
      const { error } = await supabase
        .from('event_registrations')
        .insert({
          event_id: eventId,
          user_id: user.id
        });

      if (error) throw error;

      toast.success('Successfully registered for event!');
      fetchEvents(); // Refresh the list
    } catch (error: any) {
      console.error('Error registering for event:', error);
      if (error.code === '23505') {
        toast.error('You are already registered for this event');
      } else {
        toast.error('Failed to register for event');
      }
    }
  };

  const unregisterFromEvent = async (eventId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('event_registrations')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Successfully unregistered from event');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error unregistering from event:', error);
      toast.error('Failed to unregister from event');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .update({ status: 'cancelled' })
        .eq('id', eventId);

      if (error) throw error;

      toast.success('Event deleted successfully');
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    }
  };

  const getEventStatus = (event: Event) => {
    const now = new Date();
    const eventDate = new Date(event.event_date);
    const registrationDeadline = event.registration_deadline 
      ? new Date(event.registration_deadline) 
      : eventDate;

    if (eventDate < now) {
      return { status: 'completed', color: 'bg-gray-500' };
    } else if (registrationDeadline < now) {
      return { status: 'registration closed', color: 'bg-red-500' };
    } else if (event.max_participants && event.registrations_count >= event.max_participants) {
      return { status: 'full', color: 'bg-orange-500' };
    } else {
      return { status: 'open', color: 'bg-green-500' };
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading events...</div>;
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">No events available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => {
        const eventStatus = getEventStatus(event);
        const canRegister = eventStatus.status === 'open' && !event.user_registered;
        const canUnregister = event.user_registered && eventStatus.status !== 'completed';

        return (
          <Card key={event.id} className="overflow-hidden">
            <div className="flex">
              {/* Event Poster */}
              {event.poster_url && (
                <div className="w-48 h-32 flex-shrink-0">
                  <img
                    src={event.poster_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Event Content */}
              <div className="flex-1 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-iteam-primary mb-2">
                      {event.title}
                    </h3>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={`${eventStatus.color} text-white`}>
                      {eventStatus.status}
                    </Badge>
                    {event.location_type && (
                      <Badge variant="outline" className="capitalize">
                        {event.location_type}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(event.event_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{event.event_time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{event.location}</span>
                  </div>
                </div>

                {/* Participants Info */}
                {(event.max_participants || event.registrations_count > 0) && (
                  <div className="flex items-center space-x-2 mb-4 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>
                      {event.registrations_count} registered
                      {event.max_participants && ` / ${event.max_participants} max`}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    {/* Registration Buttons */}
                    {canRegister && (
                      <Button
                        onClick={() => registerForEvent(event.id)}
                        className="bg-iteam-primary hover:bg-iteam-primary/90"
                        size="sm"
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Register
                      </Button>
                    )}
                    
                    {canUnregister && (
                      <Button
                        onClick={() => unregisterFromEvent(event.id)}
                        variant="outline"
                        size="sm"
                      >
                        Unregister
                      </Button>
                    )}

                    {event.user_registered && (
                      <Badge variant="secondary">Registered</Badge>
                    )}
                  </div>

                  {/* Admin Actions */}
                  {showActions && (userRole === 'admin' || userRole === 'staff') && (
                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onEditEvent?.(event)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {userRole === 'admin' && (
                        <Button
                          onClick={() => deleteEvent(event.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default EventList;
