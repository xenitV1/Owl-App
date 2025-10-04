'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
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
  const startAudioRef = useRef<HTMLAudioElement | null>(null);
  const completeAudioRef = useRef<HTMLAudioElement | null>(null);

  const { cards, startPomodoro, pausePomodoro, resetPomodoro, updateCard } = useWorkspaceStore();
  const card = cards.find(c => c.id === cardId);
  const pomodoroData = card?.pomodoroData;

  // Initialize audio for notifications (preload for instant playback)
  useEffect(() => {
    startAudioRef.current = new Audio('/api/sounds/pomodoro-start.mp3');
    startAudioRef.current.volume = 0.6;
    startAudioRef.current.preload = 'auto';
    
    completeAudioRef.current = new Audio('/api/sounds/pomodoro-complete.mp3');
    completeAudioRef.current.volume = 0.7;
    completeAudioRef.current.preload = 'auto';
    
    // Preload both sounds
    startAudioRef.current.load();
    completeAudioRef.current.load();
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

  const playStartSound = useCallback(() => {
    if (startAudioRef.current) {
      // Reset to beginning for instant replay
      startAudioRef.current.currentTime = 0;
      // Play immediately (synchronous with click)
      const playPromise = startAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('[Pomodoro] Failed to play start sound:', err);
        });
      }
      console.log('[Pomodoro] Start sound played');
    }
  }, []);

  const playCompleteSound = useCallback(() => {
    if (completeAudioRef.current) {
      // Reset to beginning for instant replay
      completeAudioRef.current.currentTime = 0;
      // Play immediately
      const playPromise = completeAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn('[Pomodoro] Failed to play complete sound:', err);
          // Fallback to browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Pomodoro Timer', {
              body: isBreak ? 'Break time is over! Time to focus.' : 'Focus session completed! Take a break.',
              icon: '/favicon.ico'
            });
          }
        });
      }
      console.log('[Pomodoro] Complete sound played');
    }
  }, [isBreak]);

  const handleSessionComplete = () => {
    playCompleteSound();
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
    playStartSound();
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

        <TabsContent value="settings" className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Timer Settings
            </h3>

            <div className="space-y-4">
              {/* Work Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Focus Duration (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newDuration = Math.max(5, (pomodoroData.workDuration || 25) - 5);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          workDuration: newDuration 
                        } as any
                      });
                    }}
                  >
                    -5
                  </Button>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    step="5"
                    value={pomodoroData?.workDuration || 25}
                    onChange={(e) => {
                      if (!pomodoroData) return;
                      const newDuration = Math.max(5, Math.min(60, parseInt(e.target.value) || 25));
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          workDuration: newDuration 
                        } as any
                      });
                    }}
                    className="flex-1 text-center font-mono font-bold text-lg h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newDuration = Math.min(60, (pomodoroData.workDuration || 25) + 5);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          workDuration: newDuration 
                        } as any
                      });
                    }}
                  >
                    +5
                  </Button>
                </div>
              </div>

              {/* Short Break Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Timer className="w-4 h-4" />
                  Short Break (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newDuration = Math.max(1, (pomodoroData.breakDuration || 5) - 1);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          breakDuration: newDuration 
                        } as any
                      });
                    }}
                  >
                    -1
                  </Button>
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    step="1"
                    value={pomodoroData?.breakDuration || 5}
                    onChange={(e) => {
                      if (!pomodoroData) return;
                      const newDuration = Math.max(1, Math.min(15, parseInt(e.target.value) || 5));
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          breakDuration: newDuration 
                        } as any
                      });
                    }}
                    className="flex-1 text-center font-mono font-bold text-lg h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newDuration = Math.min(15, (pomodoroData.breakDuration || 5) + 1);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          breakDuration: newDuration 
                        } as any
                      });
                    }}
                  >
                    +1
                  </Button>
                </div>
              </div>

              {/* Long Break Duration */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Coffee className="w-4 h-4" />
                  Long Break (minutes)
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newDuration = Math.max(10, (pomodoroData.longBreakDuration || 15) - 5);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          longBreakDuration: newDuration 
                        } as any
                      });
                    }}
                  >
                    -5
                  </Button>
                  <Input
                    type="number"
                    min="10"
                    max="30"
                    step="5"
                    value={pomodoroData?.longBreakDuration || 15}
                    onChange={(e) => {
                      if (!pomodoroData) return;
                      const newDuration = Math.max(10, Math.min(30, parseInt(e.target.value) || 15));
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          longBreakDuration: newDuration 
                        } as any
                      });
                    }}
                    className="flex-1 text-center font-mono font-bold text-lg h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newDuration = Math.min(30, (pomodoroData.longBreakDuration || 15) + 5);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          longBreakDuration: newDuration 
                        } as any
                      });
                    }}
                  >
                    +5
                  </Button>
                </div>
              </div>

              {/* Sessions until long break */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Sessions Until Long Break
                </label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newSessions = Math.max(2, (pomodoroData.sessionsUntilLongBreak || 4) - 1);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          sessionsUntilLongBreak: newSessions 
                        } as any
                      });
                    }}
                  >
                    -1
                  </Button>
                  <Input
                    type="number"
                    min="2"
                    max="8"
                    step="1"
                    value={pomodoroData?.sessionsUntilLongBreak || 4}
                    onChange={(e) => {
                      if (!pomodoroData) return;
                      const newSessions = Math.max(2, Math.min(8, parseInt(e.target.value) || 4));
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          sessionsUntilLongBreak: newSessions 
                        } as any
                      });
                    }}
                    className="flex-1 text-center font-mono font-bold text-lg h-10"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (!pomodoroData) return;
                      const newSessions = Math.min(8, (pomodoroData.sessionsUntilLongBreak || 4) + 1);
                      updateCard(cardId, {
                        pomodoroData: { 
                          ...pomodoroData, 
                          sessionsUntilLongBreak: newSessions 
                        } as any
                      });
                    }}
                  >
                    +1
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  💡 Tip: Changes apply to the next session
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
