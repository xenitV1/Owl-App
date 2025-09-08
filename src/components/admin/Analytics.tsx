'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  MessageSquare, 
  Heart,
  Share2,
  Calendar,
  Clock,
  Target,
  Activity,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  userGrowth: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  postEngagement: {
    likes: number;
    comments: number;
    shares: number;
    total: number;
  };
  contentCategories: {
    [key: string]: {
      count: number;
      percentage: number;
    };
  };
  timeStats: {
    peakHours: number[];
    peakDays: string[];
  };
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
}

export function Analytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('users');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/analytics?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Mock data for demo
      setAnalytics({
        userGrowth: {
          daily: [120, 135, 142, 158, 165, 172, 180],
          weekly: [850, 920, 980, 1050, 1120, 1180, 1250],
          monthly: [3200, 3450, 3680, 3920, 4150, 4380, 4620]
        },
        postEngagement: {
          likes: 45280,
          comments: 18920,
          shares: 8750,
          total: 72950
        },
        contentCategories: {
          'Mathematics': { count: 1250, percentage: 25 },
          'Science': { count: 1000, percentage: 20 },
          'Literature': { count: 900, percentage: 18 },
          'History': { count: 750, percentage: 15 },
          'Other': { count: 1100, percentage: 22 }
        },
        timeStats: {
          peakHours: [15, 16, 17, 18, 19, 20],
          peakDays: ['Monday', 'Tuesday', 'Wednesday']
        },
        retention: {
          daily: 85,
          weekly: 72,
          monthly: 58
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getGrowthIcon = (isPositive: boolean) => {
    return isPositive ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    );
  };

  const getGrowthColor = (isPositive: boolean) => {
    return isPositive ? 'text-green-500' : 'text-red-500';
  };

  const getRetentionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Platform Analytics</h2>
          <p className="text-muted-foreground">Comprehensive insights into platform performance and user engagement</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.postEngagement.total)}</div>
            <p className="text-xs text-muted-foreground">
              Likes, comments, and shares
            </p>
            <div className="flex items-center gap-1 mt-1">
              {getGrowthIcon(true)}
              <span className={`text-xs ${getGrowthColor(true)}`}>
                +12% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.userGrowth.daily[analytics.userGrowth.daily.length - 1])}</div>
            <p className="text-xs text-muted-foreground">
              Active in last 24 hours
            </p>
            <div className="flex items-center gap-1 mt-1">
              {getGrowthIcon(true)}
              <span className={`text-xs ${getGrowthColor(true)}`}>
                +8% from yesterday
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Creation</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,245</div>
            <p className="text-xs text-muted-foreground">
              New posts this week
            </p>
            <div className="flex items-center gap-1 mt-1">
              {getGrowthIcon(true)}
              <span className={`text-xs ${getGrowthColor(true)}`}>
                +15% from last week
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Retention</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRetentionColor(analytics.retention.weekly)}`}>
              {analytics.retention.weekly}%
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly retention rate
            </p>
            <div className="flex items-center gap-1 mt-1">
              {getGrowthIcon(true)}
              <span className={`text-xs ${getGrowthColor(true)}`}>
                +3% improvement
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Engagement Breakdown</CardTitle>
            <CardDescription>Distribution of user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  <span>Likes</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Progress value={62} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{formatNumber(analytics.postEngagement.likes)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                  <span>Comments</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Progress value={26} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{formatNumber(analytics.postEngagement.comments)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-green-500" />
                  <span>Shares</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Progress value={12} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{formatNumber(analytics.postEngagement.shares)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Retention</CardTitle>
            <CardDescription>How well we retain users over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Daily Retention</span>
                  <span className={getRetentionColor(analytics.retention.daily)}>
                    {analytics.retention.daily}%
                  </span>
                </div>
                <Progress value={analytics.retention.daily} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Weekly Retention</span>
                  <span className={getRetentionColor(analytics.retention.weekly)}>
                    {analytics.retention.weekly}%
                  </span>
                </div>
                <Progress value={analytics.retention.weekly} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Monthly Retention</span>
                  <span className={getRetentionColor(analytics.retention.monthly)}>
                    {analytics.retention.monthly}%
                  </span>
                </div>
                <Progress value={analytics.retention.monthly} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Content Categories</CardTitle>
          <CardDescription>Distribution of educational content by subject</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.contentCategories).map(([category, data]) => (
              <div key={category} className="p-4 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{category}</span>
                  <Badge variant="outline">{data.percentage}%</Badge>
                </div>
                <Progress value={data.percentage} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {formatNumber(data.count)} posts
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Activity Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Peak Activity Hours</CardTitle>
            <CardDescription>When users are most active on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.timeStats.peakHours.map((hour, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{hour}:00</span>
                  <div className="flex items-center gap-2">
                    <Progress value={70 + (index * 5)} className="w-20 h-2" />
                    <span className="text-sm text-muted-foreground">High</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Active Days</CardTitle>
            <CardDescription>Days with highest user engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analytics.timeStats.peakDays.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm">{day}</span>
                  <div className="flex items-center gap-2">
                    <Progress value={85 - (index * 10)} className="w-20 h-2" />
                    <span className="text-sm text-muted-foreground">Peak</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}