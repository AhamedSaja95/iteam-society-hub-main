import React, { useState, useEffect } from "react";
import { useNavigate, Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Calendar,
  Users,
  Settings,
  LogOut,
  Bell,
  User,
  FileText,
  LayoutDashboard,
  CreditCard,
  UserCheck,
  Activity,
  Zap,
  Menu,
  X,
  ChevronDown,
  Search,
  Plus,
  BarChart3,
  Shield,
  BookOpen,
  Award,
  Clock,
  TrendingUp,
  MessageSquare,
  HelpCircle,
  TestTube,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  badge?: string;
  children?: MenuItem[];
}

interface ModernSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  userRole: string;
  userName: string;
  userAvatar?: string;
  notifications: number;
}

const ModernSidebar = ({
  isCollapsed,
  onToggle,
  userRole,
  userName,
  userAvatar,
  notifications,
}: ModernSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  // notifications is passed as a prop, no need for local state

  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: "Logged out successfully" });
      navigate("/login");
    } catch (error) {
      toast({ variant: "destructive", title: "Error logging out" });
    }
  };

  // Role-based menu items
  const getMenuItems = (): MenuItem[] => {
    const baseItems: MenuItem[] = [
      {
        icon: <Home size={20} />,
        label: "Dashboard",
        href: "/dashboard",
      },
      {
        icon: <User size={20} />,
        label: "My Profile",
        href: "/dashboard/profile",
      },
      {
        icon: <Calendar size={20} />,
        label: "Events",
        href: "/dashboard/events",
        badge: "New",
      },
      {
        icon: <FileText size={20} />,
        label: "Membership",
        href: "/dashboard/membership",
      },
      {
        icon: <Bell size={20} />,
        label: "Notifications",
        href: "/dashboard/notifications",
        badge: notifications > 0 ? notifications.toString() : undefined,
      },
    ];

    if (userRole === "student") {
      return [
        ...baseItems,
        {
          icon: <LayoutDashboard size={20} />,
          label: "Modern Dashboard",
          href: "/dashboard/modern-student",
          badge: "New",
        },
        {
          icon: <Activity size={20} />,
          label: "Real-Time Dashboard",
          href: "/dashboard/realtime-student",
        },
        {
          icon: <Award size={20} />,
          label: "My Achievements",
          href: "/dashboard/achievements",
        },
      ];
    }

    if (userRole === "staff") {
      return [
        ...baseItems,
        {
          icon: <LayoutDashboard size={20} />,
          label: "Modern Dashboard",
          href: "/dashboard/modern-staff",
          badge: "New",
        },
        {
          icon: <Activity size={20} />,
          label: "Real-Time Dashboard",
          href: "/dashboard/realtime-staff",
        },
        {
          icon: <Plus size={20} />,
          label: "Create Event",
          href: "/dashboard/events",
        },
        {
          icon: <BarChart3 size={20} />,
          label: "Event Analytics",
          href: "/dashboard/events",
        },
      ];
    }

    if (userRole === "admin") {
      return [
        ...baseItems,
        {
          icon: <LayoutDashboard size={20} />,
          label: "Modern Dashboard",
          href: "/dashboard/admin/modern",
          badge: "New",
        },
        {
          icon: <Shield size={20} />,
          label: "Admin Panel",
          href: "/dashboard/admin",
          children: [
            {
              icon: <LayoutDashboard size={20} />,
              label: "Overview",
              href: "/dashboard/admin",
            },
            {
              icon: <Activity size={20} />,
              label: "Real-Time Admin",
              href: "/dashboard/admin/realtime",
            },
            {
              icon: <Users size={20} />,
              label: "User Management",
              href: "/dashboard/admin/users",
            },
            {
              icon: <UserCheck size={20} />,
              label: "Memberships",
              href: "/dashboard/admin/memberships",
            },
            {
              icon: <CreditCard size={20} />,
              label: "Payments",
              href: "/dashboard/admin/payments",
            },
          ],
        },
      ];
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const SidebarItem = ({
    item,
    isActive,
  }: {
    item: MenuItem;
    isActive: boolean;
  }) => (
    <Link
      to={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700",
        isActive
          ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
          : "text-gray-600 hover:text-gray-900",
        isCollapsed && "justify-center px-2"
      )}
    >
      <div className={cn("flex-shrink-0", isActive && "text-white")}>
        {item.icon}
      </div>
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <Badge
              variant={isActive ? "secondary" : "default"}
              className={cn(
                "text-xs px-2 py-0.5",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-50 h-screen bg-white border-r border-gray-200 shadow-xl transition-all duration-300",
        isCollapsed ? "w-16" : "w-72"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-100">
          {!isCollapsed && (
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center">
                <span className="text-white font-bold text-sm">IT</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  I-Team Society
                </h1>
                <p className="text-xs text-gray-500 capitalize">
                  {userRole} Portal
                </p>
              </div>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 hover:bg-gray-100"
          >
            {isCollapsed ? <Menu size={16} /> : <X size={16} />}
          </Button>
        </div>

        {/* User Profile */}
        {!isCollapsed && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-blue-100">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronDown size={14} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/profile'}>
                    <User className="mr-2 h-4 w-4" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/dashboard/notifications'}>
                    <Settings className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open('mailto:support@iteam.com', '_blank')}>
                    <HelpCircle className="mr-2 h-4 w-4" />
                    Help & Support
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-600"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <nav className="space-y-2">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <div key={index}>
                  <SidebarItem item={item} isActive={isActive} />
                  {item.children && !isCollapsed && (
                    <div className="ml-6 mt-2 space-y-1 border-l border-gray-200 pl-4">
                      {item.children.map((child, childIndex) => {
                        const isChildActive = location.pathname === child.href;
                        return (
                          <SidebarItem
                            key={childIndex}
                            item={child}
                            isActive={isChildActive}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-100">
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Quick Tip
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Use the real-time dashboard for live updates and analytics!
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

const ModernDashboardLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifications, setNotifications] = useState(0);
  const { user } = useAuth();
  const { userProfile } = useUser();
  const location = useLocation();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch notification count
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try {
        const { data } = await supabase
          .from("notifications")
          .select("id")
          .eq("user_id", user.id)
          .eq("read", false);
        setNotifications(data?.length || 0);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const userRole = userProfile?.role || "student";
  const userName = userProfile
    ? `${userProfile.first_name} ${userProfile.last_name}`
    : "User";
  const userAvatar = userProfile?.photo_url;

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/admin/modern")) return "Modern Admin Dashboard";
    if (path.includes("/admin/realtime")) return "Real-Time Admin Dashboard";
    if (path.includes("/modern-student")) return "Modern Student Dashboard";
    if (path.includes("/modern-staff")) return "Modern Staff Dashboard";
    if (path.includes("/realtime-student"))
      return "Student Real-Time Dashboard";
    if (path.includes("/realtime-staff")) return "Staff Real-Time Dashboard";
    if (path.includes("/admin")) return "Admin Panel";
    if (path.includes("/profile")) return "My Profile";
    if (path.includes("/events")) return "Events";
    if (path.includes("/membership")) return "Membership";
    if (path.includes("/notifications")) return "Notifications";
    return "Dashboard";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        userRole={userRole}
        userName={userName}
        userAvatar={userAvatar}
        notifications={notifications}
      />

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-72"
        )}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 h-16 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}{" "}
                  •{" "}
                  {currentTime.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-9 w-64 rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </Button>

                <Button variant="ghost" size="icon">
                  <MessageSquare className="h-5 w-5" />
                </Button>

                {(userRole === "staff" || userRole === "admin") && (
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )}
              </div>

              {/* User Avatar */}
              <Avatar className="h-8 w-8 ring-2 ring-blue-100">
                <AvatarImage src={userAvatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                  {userName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <div className="mx-auto max-w-7xl">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-white px-6 py-4">
          <div className="mx-auto max-w-7xl flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span>© 2024 I-Team Society</span>
              <Separator orientation="vertical" className="h-4" />
              <span>The Open University of Sri Lanka</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Last updated: {currentTime.toLocaleTimeString()}</span>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span>System Online</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ModernDashboardLayout;
