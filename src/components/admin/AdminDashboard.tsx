"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Users,
  BarChart3,
  FileText,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Ban,
  Settings,
  Activity,
  Calendar,
  MapPin,
  BookOpen,
  MessageSquare,
  Heart,
  Share2,
  Filter,
  Search,
  Download,
} from "lucide-react";
import { UserManagement } from "./UserManagement";
import { Analytics } from "./Analytics";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ContentModeration } from "./ContentModeration";
import AlgorithmAnalytics from "./AlgorithmAnalytics";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  totalCommunities: number;
  totalGroups: number;
  userGrowth: number;
  postGrowth: number;
  reportGrowth: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  school?: string;
  grade?: string;
  favoriteSubject?: string;
  isVerified: boolean;
  createdAt: string;
  lastActive?: string;
  postCount: number;
  commentCount: number;
  reportCount: number;
  isSuspended: boolean;
  isBanned: boolean;
}

interface ActivityLog {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  adminName: string;
  timestamp: string;
  details: string;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalCommunities: 0,
    totalGroups: 0,
    userGrowth: 0,
    postGrowth: 0,
    reportGrowth: 0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("overview");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes, logsRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
        fetch("/api/admin/activity-logs"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setActivityLogs(logsData.logs);
      }
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? "text-green-500" : "text-red-500";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="algorithm">Algorithm</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalUsers)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active: {formatNumber(stats.activeUsers)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(stats.userGrowth)}
                  <span
                    className={`text-xs ${getGrowthColor(stats.userGrowth)}`}
                  >
                    {stats.userGrowth >= 0 ? "+" : ""}
                    {stats.userGrowth}% from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Posts
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalPosts)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Educational content
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(stats.postGrowth)}
                  <span
                    className={`text-xs ${getGrowthColor(stats.postGrowth)}`}
                  >
                    {stats.postGrowth >= 0 ? "+" : ""}
                    {stats.postGrowth}% from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Reports</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(stats.totalReports)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending: {stats.pendingReports}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(stats.reportGrowth)}
                  <span
                    className={`text-xs ${getGrowthColor(stats.reportGrowth)}`}
                  >
                    {stats.reportGrowth >= 0 ? "+" : ""}
                    {stats.reportGrowth}% from last month
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Communities
                </CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalCommunities}
                </div>
                <p className="text-xs text-muted-foreground">
                  Groups: {stats.totalGroups}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-xs text-green-500">All active</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest admin actions and system events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-start gap-3">
                      <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {log.adminName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {log.action} on {log.targetType} {log.targetId}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Health</CardTitle>
                <CardDescription>
                  Platform performance and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Report Resolution Rate</span>
                      <span>85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>User Engagement</span>
                      <span>92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Content Moderation</span>
                      <span>78%</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>System Performance</span>
                      <span>96%</span>
                    </div>
                    <Progress value={96} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Analytics />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-6">
          <ContentModeration />
        </TabsContent>

        {/* Algorithm Tab */}
        <TabsContent value="algorithm" className="space-y-6">
          <AlgorithmAnalytics />
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
              <CardDescription>
                Complete audit trail of all admin actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <Activity className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.adminName}</span>
                          <Badge variant="outline">{log.action}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {log.targetType} ID: {log.targetId}
                      </p>
                      <p className="text-sm mt-1">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
