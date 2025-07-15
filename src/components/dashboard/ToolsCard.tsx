
import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  Code, 
  ImageIcon, 
  MessageSquare, 
  Music, 
  Settings 
} from 'lucide-react';

interface Tool {
  name: string;
  href: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const ToolsCard = () => {
  const tools: Tool[] = [
    {
      name: "AI Image Generation",
      href: "/dashboard/ai-image",
      icon: ImageIcon,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      name: "Music Composer",
      href: "/dashboard/music",
      icon: Music,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      name: "Code Generator",
      href: "/dashboard/code",
      icon: Code,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      name: "Conversation",
      href: "/dashboard/conversation",
      icon: MessageSquare,
      color: "text-sky-500",
      bgColor: "bg-sky-500/10",
    },
    {
      name: "Video Generation",
      href: "/dashboard/video",
      icon: CalendarIcon,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      color: "text-zinc-500",
      bgColor: "bg-zinc-500/10",
    },
  ];

  return (
    <div className="col-span-4 md:col-span-8 lg:col-span-3">
      <Card>
        <CardHeader>
          <CardTitle>I-Team Tools</CardTitle>
          <CardDescription>
            AI powered tools to boost your productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tools.map((tool) => (
              <Link to={tool.href} key={tool.name} className="col-span-1">
                <div className="flex items-center p-3 w-full rounded-lg">
                  <div className={cn("p-2 w-fit rounded-md", tool.bgColor, tool.color)}>
                    <tool.icon className="w-4 h-4" />
                  </div>
                  <div className="font-semibold pl-2">{tool.name}</div>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ToolsCard;
