'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Calendar,
  Plus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Repeat,
  Edit,
  Trash2,
  Bell
} from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface CalendarViewProps {
  cardId: string;
  onClose?: () => void;
}

interface Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  color: string;
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: Date;
  };
}

export function CalendarView({ cardId, onClose }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [newEventDialog, setNewEventDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Event creation state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStart, setEventStart] = useState('');
  const [eventEnd, setEventEnd] = useState('');
  const [eventColor, setEventColor] = useState('#3b82f6');
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);

  const { cards, updateCard } = useWorkspaceStore();
  const card = cards.find(c => c.id === cardId);
  const calendarData = card?.calendarData;

  const handleAddEvent = () => {
    if (!eventTitle.trim() || !eventStart || !eventEnd) return;

    const newEvent: Event = {
      id: `event-${Date.now()}`,
      title: eventTitle.trim(),
      start: new Date(eventStart),
      end: new Date(eventEnd),
      description: eventDescription.trim() || undefined,
      color: eventColor,
      ...(isRecurring && {
        recurring: {
          frequency: recurrenceFrequency,
          interval: recurrenceInterval,
        }
      }),
    };

    if (calendarData) {
      const updatedEvents = [...calendarData.events, newEvent];
      updateCard(cardId, {
        calendarData: {
          ...calendarData,
          events: updatedEvents,
        }
      });
    }

    // Reset form
    setEventTitle('');
    setEventDescription('');
    setEventStart('');
    setEventEnd('');
    setEventColor('#3b82f6');
    setIsRecurring(false);
    setNewEventDialog(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (calendarData) {
      const updatedEvents = calendarData.events.filter(e => e.id !== eventId);
      updateCard(cardId, {
        calendarData: {
          ...calendarData,
          events: updatedEvents,
        }
      });
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getEventsForDate = (date: Date) => {
    if (!calendarData) return [];

    return calendarData.events.filter(event => {
      const eventDate = new Date(event.start);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const colorOptions = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = getDaysInMonth(currentDate);

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendar
          </h3>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('month')}
              className={view === 'month' ? 'bg-primary/10' : ''}
            >
              Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('week')}
              className={view === 'week' ? 'bg-primary/10' : ''}
            >
              Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView('day')}
              className={view === 'day' ? 'bg-primary/10' : ''}
            >
              Day
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="font-medium min-w-[140px] text-center">
            {formatMonthYear(currentDate)}
          </span>

          <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Dialog open={newEventDialog} onOpenChange={setNewEventDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="eventTitle">Event Title</Label>
                  <Input
                    id="eventTitle"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Enter event title"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDescription">Description (Optional)</Label>
                  <Textarea
                    id="eventDescription"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Enter event description"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventStart">Start Date & Time</Label>
                    <Input
                      id="eventStart"
                      type="datetime-local"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="eventEnd">End Date & Time</Label>
                    <Input
                      id="eventEnd"
                      type="datetime-local"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {colorOptions.map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${
                          eventColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEventColor(color)}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="recurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="recurring" className="text-sm">Recurring Event</Label>
                </div>

                {isRecurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequency</Label>
                      <Select value={recurrenceFrequency} onValueChange={(value: any) => setRecurrenceFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Every</Label>
                      <Input
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                <Button onClick={handleAddEvent} disabled={!eventTitle.trim()}>
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="p-2 bg-muted/20 rounded" />;
            }

            const eventsForDate = getEventsForDate(date);
            const isToday = date.toDateString() === new Date().toDateString();

            return (
              <div
                key={date.toISOString()}
                className={`p-2 border rounded cursor-pointer hover:bg-muted/50 transition-colors ${
                  isToday ? 'bg-primary/10 border-primary' : 'border-border'
                }`}
                onClick={() => setSelectedDate(date)}
              >
                <div className="text-sm font-medium mb-1">
                  {date.getDate()}
                </div>

                <div className="space-y-1">
                  {eventsForDate.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className="text-xs p-1 rounded truncate"
                      style={{ backgroundColor: event.color + '20', color: event.color }}
                    >
                      {event.title}
                    </div>
                  ))}

                  {eventsForDate.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{eventsForDate.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Events List for Selected Date */}
      {selectedDate && (
        <div className="mt-4 p-4 border-t">
          <h4 className="font-medium mb-2">
            Events for {selectedDate.toLocaleDateString()}
          </h4>

          <div className="space-y-2">
            {getEventsForDate(selectedDate).map(event => (
              <Card key={event.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <h5 className="font-medium text-sm">{event.title}</h5>
                      {event.recurring && (
                        <Badge variant="outline" className="text-xs">
                          <Repeat className="w-3 h-3 mr-1" />
                          {event.recurring.frequency}
                        </Badge>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-xs text-muted-foreground mb-2">
                        {event.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {' '}
                          {event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteEvent(event.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {getEventsForDate(selectedDate).length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                No events for this date
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
