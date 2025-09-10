'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  Timer,
  Coffee,
  Brain,
  Target
} from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface PomodoroTimerProps {
  cardId: string;
  onClose?: () => void;
}

export function PomodoroTimer({ cardId, onClose }: PomodoroTimerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [currentSession, setCurrentSession] = useState(1);
  const [isBreak, setIsBreak] = useState(false);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { cards, startPomodoro, pausePomodoro, resetPomodoro } = useWorkspaceStore();
  const card = cards.find(c => c.id === cardId);
  const pomodoroData = card?.pomodoroData;

  // Initialize audio for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3'); // You'll need to add this audio file
    audioRef.current.volume = 0.5;
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Update store when timer state changes
  useEffect(() => {
    if (pomodoroData) {
      // Update local state from store
      setIsRunning(pomodoroData.isRunning);
      setTimeLeft(pomodoroData.timeLeft);
      setCurrentSession(pomodoroData.currentSession);
      setIsBreak(pomodoroData.isBreak);
      setCyclesCompleted(pomodoroData.cyclesCompleted);
    }
  }, [pomodoroData]);

  const playNotification = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Pomodoro Timer', {
            body: isBreak ? 'Break time is over! Time to focus.' : 'Focus session completed! Take a break.',
            icon: '/favicon.ico'
          });
        }
      });
    }
  };

  const handleSessionComplete = () => {
    playNotification();
    setIsRunning(false);

    if (isBreak) {
      // Break is over, start next work session
      setIsBreak(false);
      setCurrentSession(prev => prev + 1);
      setTimeLeft(pomodoroData?.workDuration ? pomodoroData.workDuration * 60 : 25 * 60);
    } else {
      // Work session is over, start break
      const isLongBreak = currentSession % (pomodoroData?.sessionsUntilLongBreak || 4) === 0;
      setIsBreak(true);

      if (isLongBreak) {
        setTimeLeft(pomodoroData?.longBreakDuration ? pomodoroData.longBreakDuration * 60 : 15 * 60);
      } else {
        setTimeLeft(pomodoroData?.breakDuration ? pomodoroData.breakDuration * 60 : 5 * 60);
      }

      if (currentSession % (pomodoroData?.sessionsUntilLongBreak || 4) === 0) {
        setCyclesCompleted(prev => prev + 1);
        setCurrentSession(1);
      }
    }
  };

  const handleStart = () => {
    startPomodoro(cardId);
  };

  const handlePause = () => {
    pausePomodoro(cardId);
  };

  const handleReset = () => {
    resetPomodoro(cardId);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
    if (!pomodoroData) return 0;
    const totalTime = isBreak
      ? (currentSession % pomodoroData.sessionsUntilLongBreak === 0
          ? pomodoroData.longBreakDuration
          : pomodoroData.breakDuration) * 60
      : pomodoroData.workDuration * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  const getSessionType = () => {
    if (isBreak) {
      return currentSession % (pomodoroData?.sessionsUntilLongBreak || 4) === 0 ? 'Long Break' : 'Short Break';
    }
    return 'Focus Session';
  };

  const getSessionIcon = () => {
    if (isBreak) {
      return currentSession % (pomodoroData?.sessionsUntilLongBreak || 4) === 0
        ? Coffee
        : Timer;
    }
    return Brain;
  };

  const SessionIcon = getSessionIcon();

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur-sm">
      <Tabs defaultValue="timer" className="flex flex-col h-full">
        <TabsList className="grid w-full grid-cols-3 m-4">
          <TabsTrigger value="timer" className="flex items-center gap-2">
            <Timer className="w-4 h-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="text-center space-y-6">
            {/* Session Info */}
            <div className="flex items-center justify-center gap-2">
              <SessionIcon className="w-6 h-6" />
              <Badge variant={isBreak ? "secondary" : "default"}>
                {getSessionType()}
              </Badge>
              <Badge variant="outline">
                Session {currentSession}
              </Badge>
            </div>

            {/* Timer Display */}
            <div className="relative">
              <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center">
                <div className="text-4xl font-mono font-bold">
                  {formatTime(timeLeft)}
                </div>
              </div>
              <Progress
                value={getProgress()}
                className="absolute inset-0 w-full h-full rounded-full"
                style={{
                  background: 'transparent',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              {!isRunning ? (
                <Button onClick={handleStart} size="lg" className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Start
                </Button>
              ) : (
                <Button onClick={handlePause} size="lg" variant="secondary" className="flex items-center gap-2">
                  <Pause className="w-5 h-5" />
                  Pause
                </Button>
              )}

              <Button onClick={handleReset} variant="outline" size="lg" className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5" />
                Reset
              </Button>
            </div>

            {/* Cycle Info */}
            <div className="text-sm text-muted-foreground">
              <div>Cycles Completed: {cyclesCompleted}</div>
              <div>Total Focus Time: {pomodoroData?.totalFocusTime || 0} minutes</div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Statistics
            </h3>

            {pomodoroData?.statistics && (
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-2xl font-bold">{pomodoroData.statistics.totalSessions}</div>
                  <div className="text-sm text-muted-foreground">Total Sessions</div>
                </Card>

                <Card className="p-4">
                  <div className="text-2xl font-bold">{pomodoroData.statistics.totalFocusTime}m</div>
                  <div className="text-sm text-muted-foreground">Total Focus Time</div>
                </Card>

                <Card className="p-4">
                  <div className="text-2xl font-bold">{pomodoroData.statistics.averageSession}m</div>
                  <div className="text-sm text-muted-foreground">Average Session</div>
                </Card>

                <Card className="p-4">
                  <div className="text-2xl font-bold">{pomodoroData.statistics.longestSession}m</div>
                  <div className="text-sm text-muted-foreground">Longest Session</div>
                </Card>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Timer Settings
            </h3>

            <div className="text-sm text-muted-foreground">
              Settings will be implemented in the next update.
              Current defaults:
              <ul className="mt-2 space-y-1">
                <li>• Focus: {pomodoroData?.workDuration || 25} minutes</li>
                <li>• Short Break: {pomodoroData?.breakDuration || 5} minutes</li>
                <li>• Long Break: {pomodoroData?.longBreakDuration || 15} minutes</li>
                <li>• Sessions until long break: {pomodoroData?.sessionsUntilLongBreak || 4}</li>
              </ul>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
