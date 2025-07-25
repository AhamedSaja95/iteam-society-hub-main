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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import MainLayout from "@/components/layout/MainLayout";
import FileUpload from "@/components/ui/file-upload";
import FAQ from "@/components/ui/faq";
import { supabase } from "@/integrations/supabase/client";
import { StorageService } from "@/services/supabase/storage.service";
import { useAuth } from "@/context/AuthContext";

const RegisterStudent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("basic");
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

  // Student specific fields
  const [studentId, setStudentId] = useState("");
  const [degree, setDegree] = useState("");
  const [level, setLevel] = useState("");

  // File uploads
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  // Agreement checkbox
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // FAQ data
  const faqItems = [
    {
      question: "What documents do I need to register?",
      answer:
        "You need your student ID, a payment slip for membership fee, and optionally a profile photo.",
    },
    {
      question: "How much is the membership fee?",
      answer:
        "Level 1: Rs. 500 (Bronze), Level 2: Rs. 1000 (Silver), Level 3+: Rs. 1500 (Gold)",
    },
    {
      question: "How long does approval take?",
      answer:
        "Membership approval typically takes 1-3 business days after payment verification.",
    },
    {
      question: "Can I change my details after registration?",
      answer:
        "Yes, you can update your profile information from your dashboard after registration.",
    },
  ];

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

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    if (activeTab === "basic") {
      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields");
        return false;
      }
    } else {
      if (!studentId || !degree || !level || !address) {
        setError("Please fill in all required fields");
        return false;
      }

      if (!agreedToTerms) {
        setError(
          "Please agree that all details provided are accurate and true"
        );
        return false;
      }
    }

    return true;
  };

  const handleNextTab = () => {
    if (validateForm()) {
      setError(null);
      setActiveTab("details");
    }
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
            user_type: "student",
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

        // Insert student details
        const { error: studentError } = await supabase
          .from("student_details")
          .insert({
            id: authData.user.id,
            student_id: studentId,
            faculty: "Faculty of Natural Sciences",
            department: "Department of Computer Science",
            degree: degree,
            level: parseInt(level),
          });

        if (studentError) throw studentError;

        // Update profile with role, phone, address, and photo
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: "student", // Explicitly set student role
            phone_number: phone,
            address: address,
            photo_url: profilePhotoUrl,
          })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error('Missing role, signing out', profileError);
          await supabase.auth.signOut();
          window.location.href = '/login?error=missing-role';
          return;
        }

        // Create membership record
        const membershipAmount =
          level === "1" ? 500 : level === "2" ? 1000 : 1500;
        const membershipTier =
          level === "1" ? "bronze" : level === "2" ? "silver" : "gold";

        const { error: membershipError } = await supabase
          .from("memberships")
          .insert({
            user_id: authData.user.id,
            amount: membershipAmount,
            tier: membershipTier,
            status: "pending_approval",
          });

        if (membershipError) throw membershipError;

        toast.success(
          "Student registration successful! Please check your email to verify your account."
        );
        navigate("/login");
      }
    } catch (error: any) {
      console.error("Error registering:", error);

      // Handle specific error cases
      if (error.message.includes("User already registered")) {
        setError("This email is already registered. Please use a different email or try logging in instead.");
      } else if (error.message.includes("Invalid email")) {
        setError("Please enter a valid email address.");
      } else if (error.message.includes("Password")) {
        setError("Password must be at least 6 characters long.");
      } else {
        setError(error.message || "An error occurred during registration");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center py-12">
        <div className="w-full max-w-4xl px-4">
          <Card className="mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-iteam-primary">
                Student Registration
              </CardTitle>
              <CardDescription>
                Join I-Team Society as a Student Member
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Tabs value={activeTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Basic Information</TabsTrigger>
                  <TabsTrigger value="details" disabled={activeTab === "basic"}>
                    Student Details
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 pt-6">
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
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm Password *
                      </Label>
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

                  <div className="flex justify-end">
                    <Button
                      onClick={handleNextTab}
                      className="bg-iteam-primary hover:bg-iteam-primary/90"
                    >
                      Next: Student Details
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 pt-6">
                  <form onSubmit={handleRegister} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID *</Label>
                        <Input
                          id="studentId"
                          placeholder="Enter your student ID"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="level">Academic Level *</Label>
                        <Select value={level} onValueChange={setLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select your level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">
                              Level 1 (Rs. 500 - Bronze)
                            </SelectItem>
                            <SelectItem value="2">
                              Level 2 (Rs. 1000 - Silver)
                            </SelectItem>
                            <SelectItem value="3">
                              Level 3 (Rs. 1500 - Gold)
                            </SelectItem>
                            <SelectItem value="4">
                              Level 4+ (Rs. 1500 - Gold)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="degree">Degree Program *</Label>
                      <Input
                        id="degree"
                        placeholder="e.g., BSc Computer Science"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        required
                      />
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
                    <div className="space-y-2">
                      <FileUpload
                        label="Profile Photo (Optional)"
                        accept="image/*"
                        maxSize={2}
                        onFileSelect={setProfilePhoto}
                        preview={true}
                      />
                    </div>

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
                        All the details provided are accurate and true *
                      </Label>
                    </div>

                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveTab("basic")}
                      >
                        Back
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="bg-iteam-primary hover:bg-iteam-primary/90"
                      >
                        {loading
                          ? "Creating Account..."
                          : "Create Student Account"}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="text-center mb-8">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="text-iteam-primary hover:underline">
                Login here
              </Link>
            </p>
            <p className="text-gray-600 mt-2">
              Want to register as staff?{" "}
              <Link
                to="/register-staff"
                className="text-iteam-primary hover:underline"
              >
                Staff Registration
              </Link>
            </p>
          </div>

          <FAQ items={faqItems} className="mt-8" />
        </div>
      </div>
    </MainLayout>
  );
};

export default RegisterStudent;
