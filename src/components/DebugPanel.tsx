'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bug, 
  Trash2, 
  Download, 
  Settings, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Copy,
  Filter
} from 'lucide-react';
import debugLogger, { LogLevel, LogCategory, LogEntry } from '@/lib/debug';

export default function DebugPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [config, setConfig] = useState(debugLogger['config']);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all');

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const interval = setInterval(() => {
        const newLogs = debugLogger.getLogEntries();
        setLogs(newLogs);
        filterLogs(newLogs, selectedLevel, selectedCategory);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [selectedLevel, selectedCategory]);

  const filterLogs = (logsToFilter: LogEntry[], level: LogLevel | 'all', category: LogCategory | 'all') => {
    let filtered = logsToFilter;
    
    if (level !== 'all') {
      filtered = filtered.filter(log => log.level === level);
    }
    
    if (category !== 'all') {
      filtered = filtered.filter(log => log.category === category);
    }
    
    setFilteredLogs(filtered);
  };

  const handleLevelChange = (level: LogLevel | 'all') => {
    setSelectedLevel(level);
    filterLogs(logs, level, selectedCategory);
  };

  const handleCategoryChange = (category: LogCategory | 'all') => {
    setSelectedCategory(category);
    filterLogs(logs, selectedLevel, category);
  };

  const clearLogs = () => {
    debugLogger.clearLogs();
    setLogs([]);
    setFilteredLogs([]);
  };

  const exportLogs = () => {
    const logData = debugLogger.exportLogs();
    const blob = new Blob([logData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `owl-debug-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] [${log.category}] ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText).then(() => {
      debugLogger.info('general', 'Logs copied to clipboard');
    });
  };

  const updateConfig = (newConfig: Partial<typeof config>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    debugLogger.updateConfig(updatedConfig);
  };

  const getLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'error': return 'bg-red-500';
      case 'warn': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'debug': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryColor = (category: LogCategory): string => {
    switch (category) {
      case 'auth': return 'bg-purple-500';
      case 'api': return 'bg-green-500';
      case 'ui': return 'bg-blue-500';
      case 'performance': return 'bg-orange-500';
      case 'database': return 'bg-red-500';
      case 'network': return 'bg-indigo-500';
      case 'general': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="fixed bottom-4 right-4 z-50 shadow-lg"
        onClick={() => setIsVisible(true)}
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] shadow-xl border rounded-lg bg-background">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bug className="h-5 w-5" />
              Debug Panel
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsVisible(false)}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            Development debugging tools and logs
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Debug</label>
              <Switch
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig({ enabled: checked })}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Log Level</label>
              <Select 
                value={config.level} 
                onValueChange={(level: LogLevel) => updateConfig({ level })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </label>
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedLevel} onValueChange={handleLevelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="auth">Auth</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="ui">UI</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button size="sm" variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button size="sm" variant="outline" onClick={copyLogs}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
          </div>

          {/* Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Logs ({filteredLogs.length})</label>
              <Button size="sm" variant="ghost" onClick={() => {
                const newLogs = debugLogger.getLogEntries();
                setLogs(newLogs);
                filterLogs(newLogs, selectedLevel, selectedCategory);
              }}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-64 border rounded-md p-2">
              {filteredLogs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No logs to display
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.slice(-50).reverse().map((log, index) => (
                    <div key={index} className="text-xs space-y-1 p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-white ${getLevelColor(log.level)}`}>
                          {log.level}
                        </Badge>
                        <Badge variant="secondary" className={`text-white ${getCategoryColor(log.category)}`}>
                          {log.category}
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-mono text-xs break-all">
                        {log.message}
                      </div>
                      {log.context && (
                        <div className="text-muted-foreground text-xs">
                          Context: {log.context}
                        </div>
                      )}
                      {log.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Data</summary>
                          <pre className="mt-1 p-1 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}