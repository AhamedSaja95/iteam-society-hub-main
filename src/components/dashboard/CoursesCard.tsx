
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

interface Course {
  id: number;
  title: string;
  progress: number;
}

interface CoursesCardProps {
  courses: Course[];
  membershipStatus: MembershipStatus;
}

const CoursesCard = ({ courses, membershipStatus }: CoursesCardProps) => {
  return (
    <Card className="col-span-4 md:col-span-8 lg:col-span-4">
      <CardHeader>
        <CardTitle>My Courses</CardTitle>
        <CardDescription>Track your learning progress.</CardDescription>
      </CardHeader>
      <CardContent>
        {courses.length > 0 ? (
          <ul className="list-none pl-0">
            {courses.map((course) => (
              <li key={course.id} className="mb-2">
                <strong>{course.title}</strong>
                <br />
                <small>Progress: {course.progress}%</small>
              </li>
            ))}
          </ul>
        ) : (
          <p>No courses enrolled.</p>
        )}

        {membershipStatus === "active" as MembershipStatus ? (
          <Button className="w-full mt-4" size="sm">
            Continue Learning
          </Button>
        ) : (
          <Button className="w-full mt-4" size="sm" variant="secondary" disabled>
            Continue Learning (Membership Required)
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default CoursesCard;
