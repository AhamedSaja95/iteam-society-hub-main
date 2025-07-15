
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MembershipStatus } from "@/components/ui/MembershipBadge";
import { Link } from 'react-router-dom';

interface WelcomeCardProps {
  userName: string;
  membershipStatus: MembershipStatus;
}

const WelcomeCard = ({ userName, membershipStatus }: WelcomeCardProps) => {
  const renderActionButton = () => {
    if (membershipStatus === "active" as MembershipStatus) {
      return (
        <Link to="/dashboard/membership">
          <Button className="w-full mt-4" size="sm">
            View Membership
          </Button>
        </Link>
      );
    } else {
      return (
        <Link to="/dashboard/membership">
          <Button className="w-full mt-4" size="sm" variant="destructive">
            Complete Payment
          </Button>
        </Link>
      );
    }
  };

  return (
    <Card className="col-span-4 md:col-span-8 lg:col-span-4">
      <CardHeader>
        <CardTitle>Welcome, {userName}!</CardTitle>
        <CardDescription>
          {membershipStatus === "active" as MembershipStatus
            ? "You have full access to all features."
            : "Complete your payment to unlock all features."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          Your membership status is currently{" "}
          <Badge
            variant={membershipStatus === "active" as MembershipStatus ? "default" : "destructive"}
          >
            {membershipStatus}
          </Badge>
        </p>
        {renderActionButton()}
      </CardContent>
    </Card>
  );
};

export default WelcomeCard;
