import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MembershipStatus from "@/components/membership/MembershipStatus";
import EIDCard from "@/components/membership/EIDCard";
import EventList from "@/components/events/EventList";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { Calendar, Users, Award, BookOpen, Bell } from "lucide-react";

interface StudentProfile {
  first_name: string;
  last_name: string;
  photo_url?: string;
  student_details: {
    student_id: string;
    level: number;
    degree: string;
    faculty: string;
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

interface EventRegistration {
  id: string;
  attended: boolean;
  event: {
    id: string;
    title: string;
    event_date: string;
    location: string;
  };
}

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [eventRegistrations, setEventRegistrations] = useState<
    EventRegistration[]
  >([]);
  const [stats, setStats] = useState({
    eventsRegistered: 0,
    eventsAttended: 0,
    upcomingEvents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentData();
    }
  }, [user]);

  const fetchStudentData = async () => {
    try {
      // Fetch student profile
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

      // Fetch event registrations
      const { data: registrationsData, error: registrationsError } =
        await supabase
          .from("event_registrations")
          .select(
            `
          id,
          attended,
          events(id, title, event_date, location)
        `
          )
          .eq("user_id", user?.id)
          .order("registered_at", { ascending: false });

      if (registrationsError) throw registrationsError;
      setEventRegistrations(registrationsData || []);

      // Calculate stats
      const totalRegistered = registrationsData?.length || 0;
      const totalAttended =
        registrationsData?.filter((r) => r.attended).length || 0;
      const upcoming =
        registrationsData?.filter(
          (r) => new Date(r.events.event_date) > new Date() && !r.attended
        ).length || 0;

      setStats({
        eventsRegistered: totalRegistered,
        eventsAttended: totalAttended,
        upcomingEvents: upcoming,
      });
    } catch (error) {
      console.error("Error fetching student data:", error);
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
    : "Student";

  // Generate E-ID card data if membership is active
  const eidCardData =
    membership?.status === "active" && membership.eid
      ? {
          eid: membership.eid,
          firstName: profile?.first_name || "",
          lastName: profile?.last_name || "",
          role: "student",
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
              {profile?.student_details?.student_id} • Level{" "}
              {profile?.student_details?.level} •{" "}
              {profile?.student_details?.degree}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">Academic Year</div>
            <div className="text-lg font-semibold">2024/2025</div>
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
                <p className="text-sm text-gray-600">Events Registered</p>
                <p className="text-2xl font-bold text-iteam-primary">
                  {stats.eventsRegistered}
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
                <p className="text-sm text-gray-600">Events Attended</p>
                <p className="text-2xl font-bold text-iteam-primary">
                  {stats.eventsAttended}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-full">
                <BookOpen className="h-5 w-5 text-orange-600" />
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
                      : membership?.status === "pending_approval"
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
                <Bell className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-center text-sm text-gray-500">
                <p>Quick actions will be available here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Available Events</TabsTrigger>
          <TabsTrigger value="my-events">My Events</TabsTrigger>
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
                <EventList userRole="student" />
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
              <CardTitle>My Events</CardTitle>
            </CardHeader>
            <CardContent>
              {eventRegistrations.length > 0 ? (
                <div className="space-y-4">
                  {eventRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div>
                        <h3 className="font-semibold">
                          {registration.events.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {new Date(
                            registration.events.event_date
                          ).toLocaleDateString()}{" "}
                          • {registration.events.location}
                        </p>
                      </div>
                      <Badge
                        variant={
                          registration.attended ? "default" : "secondary"
                        }
                      >
                        {registration.attended ? "Attended" : "Registered"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    You haven't registered for any events yet.
                  </p>
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

export default StudentDashboard;
