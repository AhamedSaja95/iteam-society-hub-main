import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MembershipStatus from "@/components/membership/MembershipStatus";
import EIDCard from "@/components/membership/EIDCard";
import EventList from "@/components/events/EventList";
import EventForm from "@/components/events/EventForm";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { Calendar, Users, Award, Settings, Plus, Eye } from "lucide-react";

interface StaffProfile {
  first_name: string;
  last_name: string;
  photo_url?: string;
  staff_details: {
    staff_id: string;
    position: string;
    department: string;
  };
}

interface Membership {
  id: string;
  status: string;
  tier: string;
  amount: number;
  start_date?: string;
  end_date?: string;
  eid?: string;
}

interface Event {
  id: string;
  title: string;
  event_date: string;
  location: string;
  registrations_count: number;
  max_participants?: number;
}

const StaffDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [managedEvents, setManagedEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [stats, setStats] = useState({
    eventsManaged: 0,
    totalParticipants: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStaffData();
    }
  }, [user]);

  const fetchStaffData = async () => {
    try {
      // Fetch staff profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch membership data
      const { data: membershipData, error: membershipError } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (membershipError && membershipError.code !== "PGRST116") {
        throw membershipError;
      }
      setMembership(membershipData);

      // Fetch managed events
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select(
          `
          *,
          event_registrations(count)
        `
        )
        .eq("created_by", user?.id)
        .order("event_date", { ascending: false });

      if (eventsError) throw eventsError;

      const eventsWithCount =
        eventsData?.map((event) => ({
          ...event,
          registrations_count: event.event_registrations?.[0]?.count || 0,
        })) || [];

      setManagedEvents(eventsWithCount);

      // Calculate stats
      const totalEvents = eventsWithCount.length;
      const totalParticipants = eventsWithCount.reduce(
        (sum, event) => sum + event.registrations_count,
        0
      );
      const upcoming = eventsWithCount.filter(
        (event) => new Date(event.event_date) > new Date()
      ).length;

      setStats({
        eventsManaged: totalEvents,
        totalParticipants: totalParticipants,
        upcomingEvents: upcoming,
      });
    } catch (error) {
      console.error("Error fetching staff data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    // Redirect to payment page or open payment modal
    console.log("Redirect to payment");
  };

  const handleRenew = () => {
    // Redirect to renewal page
    console.log("Redirect to renewal");
  };

  const handleEventCreated = () => {
    fetchStaffData(); // Refresh data
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-iteam-primary mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const userName = profile
    ? `${profile.first_name} ${profile.last_name}`
    : "Staff";

  // Generate E-ID card data if membership is active
  const eidCardData =
    membership?.status === "active" && membership.eid
      ? {
          eid: membership.eid,
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
          role: "staff",
          photoUrl: profile?.photo_url,
          validFrom: membership.start_date || "",
          validTo: membership.end_date || "",
          qrCodeData: `${window.location.origin}/member/${membership.eid}`,
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-iteam-primary to-iteam-primary/80 text-white rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
            <p className="opacity-90">
              {profile?.staff_details?.staff_id} •{" "}
              {profile?.staff_details?.position} •{" "}
              {profile?.staff_details?.department}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Role</div>
            <div className="text-lg font-semibold">Staff Member</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Events Managed</p>
                <p className="text-2xl font-bold text-iteam-primary">
                  {stats.eventsManaged}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Participants</p>
                <p className="text-2xl font-bold text-iteam-primary">
                  {stats.totalParticipants}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <Calendar className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Upcoming Events</p>
                <p className="text-2xl font-bold text-iteam-primary">
                  {stats.upcomingEvents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-full">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Membership</p>
                <Badge
                  className={`${
                    membership?.status === "active"
                      ? "bg-green-500"
                      : membership?.status === "pending_payment"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  } text-white capitalize`}
                >
                  {membership?.status || "None"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Membership Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {membership && (
            <MembershipStatus
              status={membership.status as any}
              tier={membership.tier as any}
              startDate={membership.start_date}
              endDate={membership.end_date}
              amount={membership.amount}
              onPayment={handlePayment}
              onRenew={handleRenew}
            />
          )}
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-iteam-primary hover:bg-iteam-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                  </DialogHeader>
                  <EventForm onEventCreated={handleEventCreated} />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Available Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
          <TabsTrigger value="manage">Event Management</TabsTrigger>
          {eidCardData && <TabsTrigger value="eid">E-ID Card</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Available Events</CardTitle>
            </CardHeader>
            <CardContent>
              {membership?.status === "active" ? (
                <EventList userRole="staff" />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    Please complete your membership payment to access events.
                  </p>
                  {membership?.status === "pending_payment" && (
                    <Button
                      onClick={handlePayment}
                      className="bg-iteam-primary hover:bg-iteam-primary/90"
                    >
                      Complete Payment
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-events">
          <Card>
            <CardHeader>
              <CardTitle>Events I'm Attending</CardTitle>
            </CardHeader>
            <CardContent>
              <EventList userRole="staff" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Events I Manage</CardTitle>
            </CardHeader>
            <CardContent>
              {managedEvents.length > 0 ? (
                <div className="space-y-4">
                  {managedEvents.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">{event.title}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.event_date).toLocaleDateString()} •{" "}
                          {event.location}
                        </p>
                        <p className="text-sm text-gray-500">
                          {event.registrations_count} registered
                          {event.max_participants &&
                            ` / ${event.max_participants} max`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">
                          {new Date(event.event_date) > new Date()
                            ? "Upcoming"
                            : "Past"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">
                    You haven't created any events yet.
                  </p>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="bg-iteam-primary hover:bg-iteam-primary/90">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Event
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create New Event</DialogTitle>
                      </DialogHeader>
                      <EventForm onEventCreated={handleEventCreated} />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {eidCardData && (
          <TabsContent value="eid">
            <Card>
              <CardHeader>
                <CardTitle>Your E-ID Card</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <EIDCard memberData={eidCardData} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StaffDashboard;
