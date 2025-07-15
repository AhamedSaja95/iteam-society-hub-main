import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MembershipService } from "@/services/supabase/membership.service";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Edit,
  CheckCircle,
  XCircle,
  Calendar,
  CreditCard,
} from "lucide-react";

const MembershipManagement = () => {
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [newTier, setNewTier] = useState("");
  const [newEndDate, setNewEndDate] = useState("");

  const queryClient = useQueryClient();

  const { data: memberships = [], isLoading } = useQuery({
    queryKey: ["memberships"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("memberships")
        .select(
          `
          *,
          profiles!memberships_user_id_fkey(
            id,
            first_name,
            last_name,
            role
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateMembershipMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      // If updating to active status and no E-ID exists, generate one
      if (updates.status === "active") {
        const membership = memberships.find((m) => m.id === id);
        if (membership && !membership.eid) {
          // Generate unique E-ID
          const currentYear = new Date().getFullYear();
          const rolePrefix =
            membership.profiles?.role === "student"
              ? "STU"
              : membership.profiles?.role === "staff"
              ? "STF"
              : "ADM";

          // Get next available number for this role and year
          const { data: existingEids } = await supabase
            .from("memberships")
            .select("eid")
            .like("eid", `ITS/${currentYear}/${rolePrefix}/%`);

          const existingNumbers =
            existingEids
              ?.map((item) => {
                const parts = item.eid?.split("/");
                return parts && parts.length === 4 ? parseInt(parts[3]) : 0;
              })
              .filter((num) => !isNaN(num)) || [];

          const nextNumber =
            existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
          const eid = `ITS/${currentYear}/${rolePrefix}/${nextNumber
            .toString()
            .padStart(4, "0")}`;

          updates.eid = eid;
        }
      }

      const { data, error } = await supabase
        .from("memberships")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memberships"] });
      toast.success("Membership updated successfully");
      setEditDialogOpen(false);
      setSelectedMembership(null);
    },
    onError: (error) => {
      toast.error("Failed to update membership: " + error.message);
    },
  });

  const handleEditMembership = (membership) => {
    setSelectedMembership(membership);
    setNewStatus(membership.status);
    setNewTier(membership.tier);
    setNewEndDate(membership.end_date?.split("T")[0] || "");
    setEditDialogOpen(true);
  };

  const handleUpdateMembership = () => {
    if (!selectedMembership) return;

    const updates = {
      status: newStatus,
      tier: newTier,
      end_date: newEndDate,
    };

    updateMembershipMutation.mutate({
      id: selectedMembership.id,
      updates,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-800";
      case "pending_payment":
        return "bg-blue-100 text-blue-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case "gold":
        return "bg-yellow-100 text-yellow-800";
      case "silver":
        return "bg-gray-100 text-gray-800";
      case "bronze":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading memberships...</p>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const stats = {
    total: memberships.length,
    active: memberships.filter((m) => m.status === "active").length,
    pending: memberships.filter(
      (m) => m.status === "pending_approval" || m.status === "pending_payment"
    ).length,
    expired: memberships.filter((m) => m.status === "expired").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Membership Management
          </h1>
          <p className="text-gray-600">
            Manage and monitor all member subscriptions
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Members
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-900">
                  {stats.active}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-900">
                  {stats.expired}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Memberships Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Memberships</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>E-ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {membership.profiles?.first_name}{" "}
                          {membership.profiles?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {membership.user_id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {membership.profiles?.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(membership.tier)}>
                        {membership.tier?.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(membership.status)}>
                        {membership.status?.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {membership.start_date
                        ? new Date(membership.start_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      {membership.end_date
                        ? new Date(membership.end_date).toLocaleDateString()
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {membership.eid || "Not Generated"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditMembership(membership)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-4 w-4" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Membership Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Manage Membership</DialogTitle>
            <DialogDescription>
              Update membership details for{" "}
              {selectedMembership?.profiles?.first_name}{" "}
              {selectedMembership?.profiles?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_approval">
                    Pending Approval
                  </SelectItem>
                  <SelectItem value="pending_payment">
                    Pending Payment
                  </SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tier" className="text-right">
                Tier
              </Label>
              <Select value={newTier} onValueChange={setNewTier}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select tier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Bronze</SelectItem>
                  <SelectItem value="silver">Silver</SelectItem>
                  <SelectItem value="gold">Gold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                End Date
              </Label>
              <Input
                id="endDate"
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateMembership}
              disabled={updateMembershipMutation.isPending}
            >
              {updateMembershipMutation.isPending
                ? "Updating..."
                : "Update Membership"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembershipManagement;
