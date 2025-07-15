import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EventService } from "@/services/supabase/event.service";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const Events = () => {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "",
    description: "",
    event_date: "",
    location: "",
    max_participants: "",
    event_type: "",
    requirements: "",
    contact_info: "",
  });
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch events with proper error handling
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      try {
        return await EventService.getAllEvents();
      } catch (error) {
        console.error("Error fetching events:", error);
        // Return empty array on error to prevent crashes
        return [];
      }
    },
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      try {
        return await EventService.registerForEvent(eventId, user.id);
      } catch (error) {
        console.error("Event registration error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      toast.success("Successfully registered for event");
    },
    onError: (error: any) => {
      console.error("Registration failed:", error);
      toast.error(error.message || "Failed to register for event");
    },
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: (eventData: any) =>
      EventService.createEvent({
        ...eventData,
        created_by: user.id,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      setIsCreateDialogOpen(false);
      toast.success("Event created successfully");
      setNewEvent({
        name: "",
        description: "",
        event_date: "",
        location: "",
        max_participants: "",
        event_type: "",
        requirements: "",
        contact_info: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create event");
    },
  });

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    createEventMutation.mutate(newEvent);
  };

  const upcomingEvents = events.filter(
    (event) => new Date(event.event_date) > new Date()
  );
  const myEvents = events.filter((event) =>
    event.event_registrations.some((reg) => reg.user_id === user.id)
  );
  const pastEvents = events.filter(
    (event) => new Date(event.event_date) <= new Date()
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-iteam-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Events</h1>
        {(role === "admin" || role === "staff") && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="bg-iteam-primary">Create Event</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new event for the I-Team
                  Society.
                </DialogDescription>
              </DialogHeader>
              <form
                onSubmit={handleCreateEvent}
                className="space-y-4 max-h-[70vh] overflow-y-auto"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Event Name *</Label>
                    <Input
                      id="name"
                      value={newEvent.name}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, name: e.target.value })
                      }
                      placeholder="Enter event name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type *</Label>
                    <select
                      id="event_type"
                      value={newEvent.event_type}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, event_type: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select event type</option>
                      <option value="workshop">Workshop</option>
                      <option value="seminar">Seminar</option>
                      <option value="conference">Conference</option>
                      <option value="networking">Networking</option>
                      <option value="training">Training</option>
                      <option value="social">Social Event</option>
                      <option value="competition">Competition</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, description: e.target.value })
                    }
                    placeholder="Describe the event, its objectives, and what participants can expect"
                    rows={4}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date & Time *</Label>
                    <Input
                      id="event_date"
                      type="datetime-local"
                      value={newEvent.event_date}
                      onChange={(e) =>
                        setNewEvent({ ...newEvent, event_date: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_participants">
                      Maximum Participants *
                    </Label>
                    <Input
                      id="max_participants"
                      type="number"
                      min="1"
                      max="1000"
                      value={newEvent.max_participants}
                      onChange={(e) =>
                        setNewEvent({
                          ...newEvent,
                          max_participants: e.target.value,
                        })
                      }
                      placeholder="e.g., 50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, location: e.target.value })
                    }
                    placeholder="e.g., Main Auditorium, OUSL or Online via Zoom"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements (Optional)</Label>
                  <Textarea
                    id="requirements"
                    value={newEvent.requirements}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, requirements: e.target.value })
                    }
                    placeholder="Any prerequisites, materials needed, or special requirements"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_info">
                    Contact Information (Optional)
                  </Label>
                  <Input
                    id="contact_info"
                    value={newEvent.contact_info}
                    onChange={(e) =>
                      setNewEvent({ ...newEvent, contact_info: e.target.value })
                    }
                    placeholder="Email or phone number for inquiries"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-iteam-primary"
                    disabled={createEventMutation.isLoading}
                  >
                    {createEventMutation.isLoading
                      ? "Creating..."
                      : "Create Event"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="upcoming">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
          <TabsTrigger value="past">Past Events</TabsTrigger>
        </TabsList>

        {/* Upcoming Events Tab */}
        <TabsContent value="upcoming" className="pt-6">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h8m-8 0H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-500 mb-4">There are no upcoming events at the moment. Check back later!</p>
              {(role === "admin" || role === "staff") && (
                <Button
                  className="bg-iteam-primary"
                  onClick={() => setIsCreateDialogOpen(true)}
                >
                  Create First Event
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map((event) => {
              const isRegistered = event.event_registrations.some(
                (reg) => reg.user_id === user.id
              );
              const registeredCount = event.event_registrations.length;
              const isFull = registeredCount >= event.max_participants;

              return (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>
                          {new Date(event.event_date).toLocaleDateString()} at{" "}
                          {new Date(event.event_date).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      {isRegistered && (
                        <Badge className="bg-iteam-success">Registered</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Location:</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Availability:</span>
                        <span>
                          {registeredCount}/{event.max_participants} registered
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-iteam-primary h-2 rounded-full"
                          style={{
                            width: `${
                              (registeredCount / event.max_participants) * 100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <p className="text-sm">{event.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isRegistered ? "outline" : "default"}
                      disabled={isFull || registerMutation.isLoading}
                      onClick={() => registerMutation.mutate(event.id)}
                    >
                      {isRegistered
                        ? "Cancel Registration"
                        : isFull
                        ? "Event Full"
                        : "Register Now"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            </div>
          )}
        </TabsContent>

        {/* My Events Tab */}
        <TabsContent value="my-events" className="pt-6">
          {myEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myEvents.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.name}</CardTitle>
                        <CardDescription>
                          {new Date(event.event_date).toLocaleDateString()} at{" "}
                          {new Date(event.event_date).toLocaleTimeString()}
                        </CardDescription>
                      </div>
                      <Badge className="bg-iteam-success">Registered</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Location:</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span>Confirmed</span>
                      </div>
                    </div>
                    <p className="text-sm">{event.description}</p>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => registerMutation.mutate(event.id)}
                    >
                      Cancel Registration
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No Registered Events</h3>
              <p className="text-gray-500 mt-1">
                You haven't registered for any upcoming events yet.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Past Events Tab */}
        <TabsContent value="past" className="pt-6">
          {pastEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No past events</h3>
              <p className="text-gray-500">You haven't attended any events yet. Check out upcoming events to get started!</p>
            </div>
          ) : (
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900"
                    >
                      Event Name
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Date
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Attendance
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900"
                    >
                      Certificate
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {pastEvents.map((event) => {
                  const registration = event.event_registrations.find(
                    (reg) => reg.user_id === user.id
                  );
                  const attended = registration?.attended;

                  return (
                    <tr key={event.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {event.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(event.event_date).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {event.location}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {registration ? (
                          <Badge
                            className={
                              attended ? "bg-iteam-success" : "bg-gray-500"
                            }
                          >
                            {attended ? "Attended" : "Not Attended"}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Not Registered</Badge>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                        {registration && attended ? (
                          <Button variant="outline" size="sm">
                            Download
                          </Button>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Events;
