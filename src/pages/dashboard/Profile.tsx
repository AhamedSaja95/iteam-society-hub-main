import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/sonner";
import {
  User,
  Phone,
  MapPin,
  Calendar,
  Download,
  Edit,
  Save,
  X,
  CreditCard,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import QRCode from "qrcode";

interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  phone_number?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

interface StudentDetails {
  student_id: string;
  faculty: string;
  department: string;
  degree: string;
  level: number;
}

interface StaffDetails {
  staff_id: string;
  department: string;
  position: string;
}

interface Membership {
  id: string;
  tier: string;
  status: string;
  start_date: string;
  end_date: string;
  amount: number;
  eid: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(
    null
  );
  const [staffDetails, setStaffDetails] = useState<StaffDetails | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch role-specific details
      if (profileData.role === "student") {
        const { data: studentData } = await supabase
          .from("student_details")
          .select("*")
          .eq("id", user?.id)
          .single();
        setStudentDetails(studentData);
      } else if (profileData.role === "staff") {
        const { data: staffData } = await supabase
          .from("staff_details")
          .select("*")
          .eq("id", user?.id)
          .single();
        setStaffDetails(staffData);
      }

      // Fetch membership
      const { data: membershipData } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (membershipData) {
        setMembership(membershipData);
        // Generate QR code for E-ID
        generateQRCode(membershipData.eid, profileData);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async (eid: string, profileData: UserProfile) => {
    try {
      const qrData = JSON.stringify({
        eid: eid,
        name: `${profileData.first_name} ${profileData.last_name}`,
        role: profileData.role,
        tier: membership?.tier,
        valid_until: membership?.end_date,
      });

      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      setQrCodeUrl(qrCodeDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone_number: profile.phone_number,
          address: profile.address,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const downloadEID = () => {
    if (!membership || !qrCodeUrl || !profile) {
      toast.error("E-ID not available");
      return;
    }

    // Create a canvas to generate the E-ID card
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 380;

    // Background
    ctx.fillStyle = "#1e40af";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.textAlign = "center";
    ctx.fillText("I-TEAM SOCIETY", canvas.width / 2, 40);
    ctx.font = "16px Arial";
    ctx.fillText("The Open University of Sri Lanka", canvas.width / 2, 65);

    // Member info
    ctx.textAlign = "left";
    ctx.font = "bold 20px Arial";
    ctx.fillText(`${profile.first_name} ${profile.last_name}`, 30, 120);

    ctx.font = "14px Arial";
    ctx.fillText(`E-ID: ${membership.eid}`, 30, 150);
    ctx.fillText(`Role: ${profile.role?.toUpperCase()}`, 30, 175);
    ctx.fillText(`Tier: ${membership.tier?.toUpperCase()}`, 30, 200);
    ctx.fillText(
      `Valid Until: ${new Date(membership.end_date).toLocaleDateString()}`,
      30,
      225
    );

    // Add QR code
    const qrImg = new Image();
    qrImg.onload = () => {
      ctx.drawImage(qrImg, canvas.width - 180, 100, 150, 150);

      // Download the image
      const link = document.createElement("a");
      link.download = `I-Team-EID-${membership.eid}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast.success("E-ID downloaded successfully");
    };
    qrImg.src = qrCodeUrl;
  };

  const getTierColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case "gold":
        return "bg-yellow-500";
      case "silver":
        return "bg-gray-400";
      case "bronze":
        return "bg-orange-600";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "pending_approval":
        return "bg-yellow-500";
      case "expired":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
        <p className="text-gray-600">
          Unable to load your profile information.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white/20">
              <AvatarImage src="" />
              <AvatarFallback className="bg-white/20 text-white text-xl">
                {profile.first_name?.[0]}
                {profile.last_name?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {profile.first_name} {profile.last_name}
              </h1>
              <p className="text-blue-100 capitalize">{profile.role}</p>
              {membership && (
                <Badge
                  className={`${getTierColor(membership.tier)} text-white mt-1`}
                >
                  {membership.tier?.toUpperCase()} Member
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {!isEditing ? (
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="bg-green-500 hover:bg-green-600 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  {isEditing ? (
                    <Input
                      id="first_name"
                      value={profile.first_name}
                      onChange={(e) =>
                        setProfile({ ...profile, first_name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.first_name}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  {isEditing ? (
                    <Input
                      id="last_name"
                      value={profile.last_name}
                      onChange={(e) =>
                        setProfile({ ...profile, last_name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">
                      {profile.last_name}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={profile.phone_number || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, phone_number: e.target.value })
                    }
                    placeholder="Enter your phone number"
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {profile.phone_number || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                {isEditing ? (
                  <Textarea
                    id="address"
                    value={profile.address || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, address: e.target.value })
                    }
                    placeholder="Enter your address"
                    rows={3}
                  />
                ) : (
                  <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {profile.address || "Not provided"}
                  </p>
                )}
              </div>

              <div>
                <Label>Member Since</Label>
                <p className="mt-1 text-sm text-gray-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Role-specific Details */}
          {(studentDetails || staffDetails) && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {profile.role === "student" ? (
                    <GraduationCap className="h-5 w-5" />
                  ) : (
                    <Briefcase className="h-5 w-5" />
                  )}
                  {profile.role === "student"
                    ? "Academic Information"
                    : "Employment Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {studentDetails && (
                  <>
                    <div>
                      <Label>Student ID</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {studentDetails.student_id}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Faculty</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {studentDetails.faculty}
                        </p>
                      </div>
                      <div>
                        <Label>Department</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {studentDetails.department}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Degree Program</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {studentDetails.degree}
                        </p>
                      </div>
                      <div>
                        <Label>Academic Level</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          Level {studentDetails.level}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {staffDetails && (
                  <>
                    <div>
                      <Label>Staff ID</Label>
                      <p className="mt-1 text-sm text-gray-900">
                        {staffDetails.staff_id}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Department</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staffDetails.department}
                        </p>
                      </div>
                      <div>
                        <Label>Position</Label>
                        <p className="mt-1 text-sm text-gray-900">
                          {staffDetails.position}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Membership & E-ID */}
        <div className="space-y-6">
          {membership && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Membership Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <Badge
                    className={`${getTierColor(
                      membership.tier
                    )} text-white text-lg px-4 py-2`}
                  >
                    {membership.tier?.toUpperCase()}
                  </Badge>
                  <Badge
                    className={`${getStatusColor(
                      membership.status
                    )} text-white ml-2`}
                  >
                    {membership.status?.replace("_", " ").toUpperCase()}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div>
                    <Label>E-ID Number</Label>
                    <p className="text-sm font-mono bg-gray-100 p-2 rounded">
                      {membership.eid}
                    </p>
                  </div>
                  <div>
                    <Label>Membership Fee</Label>
                    <p className="text-sm">
                      Rs. {membership.amount?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <Label>Valid Period</Label>
                    <p className="text-sm">
                      {new Date(membership.start_date).toLocaleDateString()} -{" "}
                      {new Date(membership.end_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <Separator />

                {qrCodeUrl && (
                  <div className="text-center">
                    <Label>QR Code</Label>
                    <div className="mt-2 flex justify-center">
                      <img
                        src={qrCodeUrl}
                        alt="QR Code"
                        className="border rounded"
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={downloadEID}
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  disabled={!qrCodeUrl}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download E-ID Card
                </Button>
              </CardContent>
            </Card>
          )}

          {!membership && (
            <Card>
              <CardHeader>
                <CardTitle>Membership Status</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-gray-500 py-4">
                  No active membership found. Please apply for membership to
                  access all features.
                </p>
                <Button
                  className="w-full"
                  onClick={() =>
                    (window.location.href = "/dashboard/membership")
                  }
                >
                  Apply for Membership
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
