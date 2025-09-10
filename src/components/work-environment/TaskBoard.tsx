'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  MoreHorizontal,
  CheckSquare,
  Clock,
  Trash2,
  Edit
} from 'lucide-react';
import { useWorkspaceStore } from '@/hooks/useWorkspaceStore';

interface TaskBoardProps {
  cardId: string;
  onClose?: () => void;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  assignees?: string[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
  labels: string[];
  created: Date;
  updated: Date;
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

export function TaskBoard({ cardId, onClose }: TaskBoardProps) {
  const [newTaskDialog, setNewTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string>('');

  const { cards, addTask, moveTask, updateCard } = useWorkspaceStore();
  const card = cards.find(c => c.id === cardId);
  const taskBoardData = card?.taskBoardData;

  // Task creation state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [selectedColumn, setSelectedColumn] = useState('todo');

  const handleAddTask = () => {
    if (!taskTitle.trim()) return;

    if (editingTask) {
      // Update existing task
      if (taskBoardData) {
        const updatedColumns = taskBoardData.columns.map(col => ({
          ...col,
          tasks: col.tasks.map(t =>
            t.id === editingTask.id
              ? {
                  ...t,
                  title: taskTitle.trim(),
                  description: taskDescription.trim() || undefined,
                  priority: taskPriority,
                  dueDate: taskDueDate ? new Date(taskDueDate) : undefined,
                  updated: new Date()
                }
              : t
          )
        }));

        updateCard(cardId, {
          taskBoardData: {
            ...taskBoardData,
            columns: updatedColumns,
          }
        });
      }
    } else {
      // Create new task
      const newTaskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        dueDate: taskDueDate ? new Date(taskDueDate) : undefined,
      };

      addTask(cardId, selectedColumn, newTaskData);
    }

    // Reset form
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setEditingTask(null);
    setNewTaskDialog(false);
  };

  const handleDragStart = (task: Task, fromColumnId: string) => {
    setDraggedTask(task);
    setDraggedFromColumn(fromColumnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toColumnId: string) => {
    e.preventDefault();

    if (draggedTask && draggedFromColumn !== toColumnId) {
      moveTask(cardId, draggedTask.id, draggedFromColumn, toColumnId);
    }

    setDraggedTask(null);
    setDraggedFromColumn('');
  };

  const handleDeleteTask = (taskId: string) => {
    if (taskBoardData) {
      const updatedColumns = taskBoardData.columns.map(col => ({
        ...col,
        tasks: col.tasks.filter(t => t.id !== taskId)
      }));

      updateCard(cardId, {
        taskBoardData: {
          ...taskBoardData,
          columns: updatedColumns,
        }
      });
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description || '');
    setTaskPriority(task.priority);
    setTaskDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '');
    setNewTaskDialog(true);
  };

  const handleClose = () => {
    setNewTaskDialog(false);
    // Reset form
    setTaskTitle('');
    setTaskDescription('');
    setTaskPriority('medium');
    setTaskDueDate('');
    setEditingTask(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatDueDate = (date?: Date) => {
    if (!date) return null;

    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, urgent: true };
    if (diffDays === 0) return { text: 'Due today', urgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', urgent: true };
    if (diffDays <= 7) return { text: `Due in ${diffDays} days`, urgent: false };

    return { text: dueDate.toLocaleDateString(), urgent: false };
  };

  if (!taskBoardData) {
    return <div>Loading...</div>;
  }

  return (
    <Card className="w-full h-full flex flex-col bg-background/95 backdrop-blur-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Task Board</h3>
        <Dialog open={newTaskDialog} onOpenChange={setNewTaskDialog}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent onInteractOutside={handleClose}>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <Label htmlFor="taskDescription">Description</Label>
                <Textarea
                  id="taskDescription"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Enter task description (optional)"
                  rows={3}
                />
              </div>

              <div className={`grid gap-4 ${editingTask ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div>
                  <Label>Priority</Label>
                  <Select value={taskPriority} onValueChange={(value: any) => setTaskPriority(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!editingTask && (
                  <div>
                    <Label>Column</Label>
                    <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {taskBoardData.columns.map(column => (
                          <SelectItem key={column.id} value={column.id}>
                            {column.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                />
              </div>

              <Button onClick={handleAddTask} disabled={!taskTitle.trim()}>
                {editingTask ? 'Update Task' : 'Create Task'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 flex gap-4 overflow-x-auto">
        {taskBoardData.columns.map(column => (
          <div
            key={column.id}
            className="flex-shrink-0 w-80"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div
              className="p-3 rounded-t-lg mb-2"
              style={{ backgroundColor: column.color + '20' }}
            >
              <div className="flex items-center justify-between">
                <h4 className="font-medium" style={{ color: column.color }}>
                  {column.title}
                </h4>
                <Badge variant="secondary">
                  {column.tasks.length}
                </Badge>
              </div>
            </div>

            {/* Tasks */}
            <div className="space-y-2 min-h-[400px]">
              {column.tasks.map(task => {
                const dueDateInfo = formatDueDate(task.dueDate);

                return (
                  <Card
                    key={task.id}
                    className="p-3 cursor-move hover:shadow-md transition-shadow"
                    draggable
                    onDragStart={() => handleDragStart(task, column.id)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h5 className="font-medium text-sm leading-tight">
                          {task.title}
                        </h5>
                        <div className="flex items-center gap-1">
                          <span className="text-xs">{getPriorityIcon(task.priority)}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEditTask(task)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Task
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteTask(task.id)}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Task
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {task.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {dueDateInfo && (
                            <div className={`flex items-center gap-1 ${dueDateInfo.urgent ? 'text-red-600' : 'text-muted-foreground'}`}>
                              <Clock className="w-3 h-3" />
                              <span>{dueDateInfo.text}</span>
                            </div>
                          )}

                          {task.subtasks.length > 0 && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <CheckSquare className="w-3 h-3" />
                              <span>{task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}</span>
                            </div>
                          )}
                        </div>

                        {task.labels.length > 0 && (
                          <div className="flex gap-1">
                            {task.labels.slice(0, 2).map((label, index) => (
                              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                                {label}
                              </Badge>
                            ))}
                            {task.labels.length > 2 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{task.labels.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}

              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No tasks in {column.title}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
