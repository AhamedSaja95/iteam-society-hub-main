
import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MembershipStatus } from "@/components/ui/MembershipBadge";
import { Link } from 'react-router-dom';

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
}

interface EventsCardProps {
  events: Event[];
  membershipStatus: MembershipStatus;
}

const EventsCard = ({ events, membershipStatus }: EventsCardProps) => {
  return (
    <Card className="col-span-4 md:col-span-8 lg:col-span-4">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
        <CardDescription>Stay updated on society events.</CardDescription>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <ul className="list-none pl-0">
            {events.map((event) => (
              <li key={event.id} className="mb-2">
                <strong>{event.title}</strong>
                <br />
                <small>
                  {event.date} at {event.location}
                </small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming events.</p>
        )}

        {membershipStatus === "active" as MembershipStatus ? (
          <Link to="/dashboard/events">
            <Button className="w-full mt-4" size="sm">
              View All Events
            </Button>
          </Link>
        ) : (
          <Button className="w-full mt-4" size="sm" variant="secondary" disabled>
            View All Events (Membership Required)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default EventsCard;
