"use client";

/**
 * Algorithm Analytics Dashboard
 * Algoritma performans metrikleri ve analiz paneli
 */

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  TrendingUp,
  Users,
  Database,
  Activity,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface AlgorithmMetrics {
  avgCalculationTime: number;
  p95CalculationTime: number;
  p99CalculationTime: number;
  cacheHitRate: number;
  errorRate: number;
  userSatisfactionScore: number;
  diversityScore: number;
  driftDetectionRate: number;
  stampedeCount: number;
  qualityFilterRate: number;
}

interface AlgorithmStats {
  totalVectors: number;
  totalInteractions: number;
  activeUsers24h: number;
  totalPosts: number;
  avgVectorAge: number;
  interactionTypes: Record<string, number>;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  checks: Record<string, any>;
  recommendations: string[];
}

export default function AlgorithmAnalytics() {
  const [metrics, setMetrics] = useState<AlgorithmMetrics | null>(null);
  const [stats, setStats] = useState<AlgorithmStats | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch algorithm metrics
      const metricsRes = await fetch("/api/algorithm/metrics");
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData.metrics);
      }

      // Fetch algorithm stats
      const statsRes = await fetch("/api/algorithm/stats");
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch health status
      const healthRes = await fetch("/api/algorithm/health");
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "healthy":
      case "ok":
        return "bg-green-500";
      case "degraded":
      case "warning":
        return "bg-yellow-500";
      case "unhealthy":
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "healthy":
      case "ok":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "degraded":
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "unhealthy":
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Loading algorithm analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-500">Error: {error}</p>
            <Button onClick={fetchData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Algorithm Analytics
          </h2>
          <p className="text-muted-foreground">
            Gerçek zamanlı algoritma performans metrikleri ve analizler
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* System Health Status */}
      {health && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(health.status)}
                <CardTitle>System Health</CardTitle>
              </div>
              <Badge className={getStatusColor(health.status)}>
                {health.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Database</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(health.checks.database?.status)}
                  <span className="text-sm font-medium">
                    {health.checks.database?.status || "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tables</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(health.checks.tables?.status)}
                  <span className="text-sm font-medium">
                    {health.checks.tables?.message || "N/A"}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Interactions</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(health.checks.interactions?.status)}
                  <span className="text-sm font-medium">
                    {health.checks.interactions?.total || 0} total
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Cache Config</p>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(health.checks.cacheConfiguration?.status)}
                  <span className="text-sm font-medium">
                    {health.checks.cacheConfiguration?.vectorCacheTTL || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="users">Users & Vectors</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  User Vectors
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalVectors || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Avg age: {stats?.avgVectorAge?.toFixed(1) || 0}h
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Interactions
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.totalInteractions || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active 24h: {stats?.activeUsers24h || 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Cache Hit Rate
                </CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((metrics?.cacheHitRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">Target: &gt;70%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Response Time
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {metrics?.avgCalculationTime?.toFixed(0) || 0}ms
                </div>
                <p className="text-xs text-muted-foreground">
                  P95: {metrics?.p95CalculationTime?.toFixed(0) || 0}ms
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {health && health.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  System optimization suggestions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {health.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
                <CardDescription>
                  Algorithm calculation performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average</span>
                    <span className="text-sm font-medium">
                      {metrics?.avgCalculationTime?.toFixed(2) || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">P95</span>
                    <span className="text-sm font-medium">
                      {metrics?.p95CalculationTime?.toFixed(2) || 0}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">P99</span>
                    <span className="text-sm font-medium">
                      {metrics?.p99CalculationTime?.toFixed(2) || 0}ms
                    </span>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Target</span>
                      <span className="text-sm text-muted-foreground">
                        &lt; 500ms
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>
                  Algorithm effectiveness indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Error Rate</span>
                    <Badge
                      variant={
                        metrics && metrics.errorRate < 0.05
                          ? "default"
                          : "destructive"
                      }
                    >
                      {((metrics?.errorRate || 0) * 100).toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Diversity Score</span>
                    <Badge variant="outline">
                      {((metrics?.diversityScore || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Drift Detection Rate</span>
                    <Badge variant="outline">
                      {((metrics?.driftDetectionRate || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Quality Filter Rate</span>
                    <Badge variant="outline">
                      {((metrics?.qualityFilterRate || 0) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users & Vectors Tab */}
        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Interest Vectors</CardTitle>
                <CardDescription>
                  Cached user preference vectors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Vectors</span>
                    <span className="text-2xl font-bold">
                      {stats?.totalVectors || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Age</span>
                    <span className="text-sm font-medium">
                      {stats?.avgVectorAge?.toFixed(1) || 0} hours
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cache TTL</span>
                    <Badge variant="outline">4 hours</Badge>
                  </div>
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground">
                      Vectors are recalculated every 4 hours to maintain user
                      preference stability
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Users</CardTitle>
                <CardDescription>User activity metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last 24 Hours</span>
                    <span className="text-2xl font-bold">
                      {stats?.activeUsers24h || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Total Posts</span>
                    <span className="text-sm font-medium">
                      {stats?.totalPosts || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interaction Types</CardTitle>
              <CardDescription>
                Distribution of user interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.interactionTypes &&
              Object.keys(stats.interactionTypes).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(stats.interactionTypes).map(
                    ([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium">{type}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-muted-foreground">
                            {count} interactions
                          </span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  (count / (stats?.totalInteractions || 1)) *
                                    100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No interaction data available
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">VIEW Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">1</p>
                <p className="text-xs text-muted-foreground">
                  Basic interaction
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">LIKE Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">3</p>
                <p className="text-xs text-muted-foreground">
                  Medium engagement
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">COMMENT/SHARE Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">5-8</p>
                <p className="text-xs text-muted-foreground">High engagement</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
