import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import MainLayout from "@/components/layout/MainLayout";
import FileUpload from "@/components/ui/file-upload";
import { supabase } from "@/integrations/supabase/client";
import { StorageService } from "@/services/supabase/storage.service";
import { useAuth } from "@/context/AuthContext";
import { Shield, AlertTriangle } from "lucide-react";

const RegisterAdmin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");

  // Admin specific fields
  const [adminCode, setAdminCode] = useState("");
  const [staffId, setStaffId] = useState("");
  const [position, setPosition] = useState("");

  // File uploads
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  // Agreement checkbox
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (password.length < 8) {
      setError("Admin password must be at least 8 characters");
      return false;
    }

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !adminCode ||
      !staffId ||
      !position ||
      !address
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (adminCode !== "ITEAM2025ADMIN") {
      setError("Invalid admin registration code");
      return false;
    }

    if (!agreedToTerms) {
      setError("Please agree that all details provided are accurate and true");
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Register the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            user_type: "admin",
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        let profilePhotoUrl = null;

        // Upload profile photo if provided
        if (profilePhoto) {
          try {
            profilePhotoUrl = await StorageService.uploadProfilePhoto(
              authData.user.id,
              profilePhoto
            );
          } catch (uploadError) {
            console.error("Error uploading profile photo:", uploadError);
          }
        }

        // Insert staff details (admin is also staff)
        const { error: staffError } = await supabase
          .from("staff_details")
          .insert({
            id: authData.user.id,
            staff_id: staffId,
            department: "Department of Computer Science",
            position: position,
          });

        if (staffError) throw staffError;

        // Update profile with role, phone, address, and photo
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: "admin", // Explicitly set admin role
            phone_number: phone,
            address: address,
            photo_url: profilePhotoUrl,
          })
          .eq("id", authData.user.id);

        if (profileError) throw profileError;

        // Create admin membership (automatically active)
        const { error: membershipError } = await supabase
          .from("memberships")
          .insert({
            user_id: authData.user.id,
            amount: 0, // Admin membership is free
            tier: "gold",
            status: "active",
            start_date: new Date().toISOString(),
            end_date: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000
            ).toISOString(), // 1 year
          });

        if (membershipError) throw membershipError;

        toast.success(
          "Admin registration successful! Please check your email to verify your account, then login to access your admin dashboard."
        );

        // Wait a moment for the toast to be visible, then redirect
        setTimeout(() => {
          navigate("/login", {
            state: {
              message:
                "Please verify your email and login to access your admin dashboard.",
              userType: "admin",
            },
          });
        }, 2000);
      }
    } catch (error: any) {
      console.error("Error registering:", error);
      setError(error.message || "An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-2xl px-4">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-iteam-primary" />
              </div>
              <CardTitle className="text-2xl text-iteam-primary">
                Admin Registration
              </CardTitle>
              <CardDescription>
                Register as an I-Team Society Administrator
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="mb-6 border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Admin Registration Notice:</strong> This registration
                  is for authorized administrators only. You must have a valid
                  admin registration code to proceed.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleRegister} className="space-y-6">
                {/* Admin Code */}
                <div className="space-y-2">
                  <Label htmlFor="adminCode">Admin Registration Code *</Label>
                  <Input
                    id="adminCode"
                    type="password"
                    placeholder="Enter admin registration code"
                    value={adminCode}
                    onChange={(e) => setAdminCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Contact the system administrator for the registration code
                  </p>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="Enter your first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Enter your last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number (any format)"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Enter in any format (e.g., +94712345678, 071-234-5678)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Staff Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="staffId">Staff ID *</Label>
                    <Input
                      id="staffId"
                      placeholder="Enter your staff ID"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      placeholder="e.g., Head of Department, Senior Lecturer"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    placeholder="Enter your address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                  />
                </div>

                {/* File Upload */}
                <FileUpload
                  label="Profile Photo (Optional)"
                  accept="image/*"
                  maxSize={2}
                  onFileSelect={setProfilePhoto}
                  preview={true}
                />

                {/* Agreement Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) =>
                      setAgreedToTerms(checked === true)
                    }
                  />
                  <Label htmlFor="terms" className="text-sm">
                    I confirm that all details provided are accurate and true,
                    and I understand the responsibilities of an administrator
                    role *
                  </Label>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-iteam-primary hover:bg-iteam-primary/90"
                >
                  {loading
                    ? "Creating Admin Account..."
                    : "Create Admin Account"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="text-center mb-8">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-iteam-primary hover:underline">
                Login here
              </Link>
            </p>
            <div className="mt-4 space-x-4">
              <Link
                to="/register-student"
                className="text-iteam-primary hover:underline"
              >
                Student Registration
              </Link>
              <span className="text-gray-400">|</span>
              <Link
                to="/register-staff"
                className="text-iteam-primary hover:underline"
              >
                Staff Registration
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterAdmin;
