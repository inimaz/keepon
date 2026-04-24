import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskApi } from '../../src/tasks/taskApi.class.js';
import { TaskStatus } from '../../src/types/task.interface.js';

describe('TaskApi', () => {
  let mockDb: any;
  let taskApi: TaskApi;

  beforeEach(() => {
    mockDb = {
      data: {
        tasks: [
          {
            _id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            externalId: 1,
            title: 'Task 1',
            importance: 3,
            urgency: 3,
            estimatedTime: 1,
            status: TaskStatus.Pending,
            createdAt: new Date(),
            updatedAt: new Date(),
            labels: []
          },
          {
            _id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
            externalId: 2,
            title: 'Task 2',
            importance: 1,
            urgency: 1,
            estimatedTime: 5,
            status: TaskStatus.Done,
            createdAt: new Date(),
            updatedAt: new Date(),
            labels: []
          }
        ],
        lastTaskId: 2
      },
      write: vi.fn().mockResolvedValue(undefined)
    };
    taskApi = new TaskApi(mockDb);
  });

  describe('get', () => {
    it('should return a task by externalId', async () => {
      const task = await taskApi.get('1');
      expect(task._id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567890');
      expect(task.externalId).toBe(1);
      expect(task.title).toBe('Task 1');
    });

    it('should throw error if task not found', async () => {
      await expect(taskApi.get('3')).rejects.toThrow('Task not found');
    });
  });

  describe('getAll', () => {
    it('should return all tasks with default params', async () => {
      const result = await taskApi.getAll();
      expect(result.data.length).toBe(2);
    });

    it('should apply limit and offset', async () => {
      const result = await taskApi.getAll({ limit: 1, offset: 1 });
      expect(result.data[0].externalId).toBe(2);
    });

    it('should apply sorting', async () => {
      const result = await taskApi.getAll({ sort: 'importance' as any, order: 'asc' });
      expect(result.data[0].externalId).toBe(2);
    });

    it('should apply filtering by statusExcludeFilter', async () => {
      const result = await taskApi.getAll({ statusExcludeFilter: [TaskStatus.Done] });
      expect(result.data.length).toBe(1);
      expect(result.data[0].externalId).toBe(1);
    });

    it('should exclude blocked tasks when hideBlockedTasks is true', async () => {
      mockDb.data = {
        tasks: [
          {
            _id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
            externalId: 1,
            title: 'Task 1',
            importance: 5,
            urgency: 5,
            estimatedTime: 1,
            status: TaskStatus.Pending,
            createdAt: new Date(),
            updatedAt: new Date(),
            labels: [],
            timeSpent: 0,
          },
          {
            _id: 'd4e5f6a7-b8c9-0123-defa-234567890123',
            externalId: 2,
            title: 'Task 2',
            importance: 1,
            urgency: 1,
            estimatedTime: 1,
            status: TaskStatus.Blocked,
            createdAt: new Date(),
            updatedAt: new Date(),
            labels: [],
            timeSpent: 0,
          },
        ],
        lastTaskId: 2,
      };
      taskApi = new TaskApi(mockDb);
      const result = await taskApi.getAll({ hideBlockedTasks: true });
      expect(result.data.length).toBe(1);
      expect(result.data[0].externalId).toBe(1);
    });
  });

  describe('create', () => {
    it('should create a task', async () => {
      const newTaskData = {
        title: 'New Task',
        importance: 2,
        urgency: 2,
        estimatedTime: 2,
        labels: ['label1']
      };
       const task = await taskApi.create(newTaskData as any);
      expect(task.externalId).toBe(3);
      expect(task.title).toBe('New Task');
      expect(task.status).toBe(TaskStatus.Pending);
      expect(mockDb.data.lastTaskId).toBe(3);
      expect(mockDb.write).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update task properties', async () => {
      const updateData = { title: 'Updated Task', status: TaskStatus.InProgress };
      const task = await taskApi.update('1', { ...taskDto(updateData), ...updateData });
      expect(task.title).toBe('Updated Task');
      expect(task.status).toBe(TaskStatus.InProgress);
      expect(task.startedAt).toBeInstanceOf(Date);
      expect(mockDb.write).toHaveBeenCalled();
    });

    it('should update task to Done and set completedAt', async () => {
      const updateData = { status: TaskStatus.Done };
      const task = await taskApi.update('1', { ...taskDto(updateData), ...updateData });
      expect(task.status).toBe(TaskStatus.Done);
      expect(task.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('delete', () => {
    it('should delete a task', async () => {
      await taskApi.delete('1');
      expect(mockDb.data.tasks.length).toBe(1);
      expect(mockDb.write).toHaveBeenCalled();
    });

    it('should throw error if task not found', async () => {
      await expect(taskApi.delete('99')).rejects.toThrow('Task not found');
    });
  });

  describe('time tracking', () => {
    beforeEach(() => {
      mockDb.data = {
        tasks: [
          {
            _id: '12345678-1234-5678-1234-567812345678',
            externalId: 1,
            title: 'Task with time tracking',
            importance: 3,
            urgency: 3,
            estimatedTime: 10,
            status: TaskStatus.Pending,
            createdAt: new Date(),
            updatedAt: new Date(),
            labels: [],
            timeSpent: 0,
          },
        ],
        lastTaskId: 1,
      };
    });

    it('should initialize timeSpent to 0 for new tasks', async () => {
      const newTaskData = {
        title: 'New Task',
        importance: 2,
        urgency: 2,
        estimatedTime: 2,
      };
      const task = await taskApi.create(newTaskData as any);
      expect(task.timeSpent).toBe(0);
    });

    it('should set lastStartedAt when moving to InProgress', async () => {
      const task = await taskApi.update('1', { ...taskDto({ status: TaskStatus.InProgress }) });
      expect(task.startedAt).toBeInstanceOf(Date);
      expect(task.lastStartedAt).toBeInstanceOf(Date);
    });

    it('should accumulate time when moving away from InProgress to Pending', async () => {
      // First, start the task
      await taskApi.update('1', { ...taskDto({ status: TaskStatus.InProgress }) });
      
      // Get the task to see the lastStartedAt
      const task = await taskApi.get('1');
      const lastStartedAt = task.lastStartedAt.getTime();
      
      // Simulate time passing by directly setting lastStartedAt to 60 seconds ago
      const mockNow = new Date();
      mockDb.data.tasks[0].lastStartedAt = new Date(mockNow.getTime() - 60000); // 60 seconds ago
      
      // Now move to Pending
      const updatedTask = await taskApi.update('1', { ...taskDto({ status: TaskStatus.Pending }) });
      
      // timeSpent should now contain approximately 60000ms (1 minute)
      const duration = updatedTask.timeSpent;
      expect(duration).toBeGreaterThan(58000);
      expect(duration).toBeLessThan(62000);
      expect(updatedTask.lastStartedAt).toBeUndefined();
    });

    it('should accumulate time when moving from InProgress to Done', async () => {
      // Simulate the task being in InProgress status with a known lastStartedAt (60 seconds ago)
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      mockDb.data.tasks[0].lastStartedAt = new Date(new Date().getTime() - 60000);
      mockDb.data.tasks[0].timeSpent = 0;

      const updatedTask = await taskApi.update('1', { ...taskDto({ status: TaskStatus.Done }) });
      
      expect(updatedTask.completedAt).toBeInstanceOf(Date);
      expect(updatedTask.timeSpent).toBeGreaterThan(58000);
      expect(updatedTask.timeSpent).toBeLessThan(62000);
      expect(updatedTask.lastStartedAt).toBeUndefined();
    });

    it('should accumulate multiple sessions of time', async () => {
      // First session: simulate InProgress that ended
      mockDb.data.tasks[0].lastStartedAt = new Date(new Date().getTime() - 60000); // 60s in progress
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      await taskApi.update('1', { ...taskDto({ status: TaskStatus.Pending }) });
      
      const taskAfterFirstSession = await taskApi.get('1');
      const initialTimeSpent = taskAfterFirstSession.timeSpent;
      expect(initialTimeSpent).toBeGreaterThan(55000);
      
      // Second session: set up InProgress state again
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      mockDb.data.tasks[0].lastStartedAt = new Date(new Date().getTime() - 120000); // 120s in progress (simulated)
      mockDb.data.tasks[0].timeSpent = initialTimeSpent;
      
      // End second session
      await taskApi.update('1', { ...taskDto({ status: TaskStatus.Done }) });
      
      const finalTask = await taskApi.get('1');
      // Should have accumulated from both sessions (at least double the first)
      expect(finalTask.timeSpent).toBeGreaterThan(initialTimeSpent * 1.5);
    });

    it('should handle timeSpent for legacy tasks without timeSpent property', async () => {
      // Remove timeSpent to simulate legacy task
      const legacyTask = mockDb.data.tasks[0];
      delete (legacyTask as any).timeSpent;
      
      const updatedTask = await taskApi.update('1', { ...taskDto({ status: TaskStatus.InProgress }) });
      expect(updatedTask.timeSpent).toBe(0); // Should initialize to 0
    });

    it('should not update timeSpent when status doesn\'t change', async () => {
      await taskApi.update('1', { ...taskDto({ title: 'Updated Title' }) });
      
      const task = await taskApi.get('1');
      expect(task.timeSpent).toBe(0);
      expect(task.title).toBe('Updated Title');
    });
    it('should stop an InProgress task when another task starts as InProgress', async () => {
      // Setup: Task 1 is InProgress
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      mockDb.data.tasks[0].lastStartedAt = new Date(new Date().getTime() - 60000); // 60s ago
      mockDb.data.tasks[0].timeSpent = 0;
      
      // Setup: Task 2 is Pending
      mockDb.data.tasks[1] = {
        _id: 'task-2-id',
        externalId: 2,
        title: 'Task 2',
        importance: 3,
        urgency: 3,
        estimatedTime: 10,
        status: TaskStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
        labels: [],
        timeSpent: 0,
      };

      // Action: Start Task 2
      await taskApi.update('2', { ...taskDto({ status: TaskStatus.InProgress }) });

      // Assertions
      const task1 = await taskApi.get('1');
      const task2 = await taskApi.get('2');

      // Task 1 should have stopped and accumulated time
      expect(task1.status).toBe(TaskStatus.Pending);
      expect(task1.timeSpent).toBeGreaterThan(55000);
      expect(task1.lastStartedAt).toBeUndefined();

      // Task 2 should now be InProgress
      expect(task2.status).toBe(TaskStatus.InProgress);
      expect(task2.lastStartedAt).toBeInstanceOf(Date);
    });

    it('should not stop the same task when starting it', async () => {
      // Setup: Task 1 is InProgress
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      mockDb.data.tasks[0].lastStartedAt = new Date(new Date().getTime() - 60000); // 60s ago
      mockDb.data.tasks[0].timeSpent = 5000;

      // Action: Start Task 1 again (redundant)
      await taskApi.update('1', { ...taskDto({ status: TaskStatus.InProgress }) });

      const task1 = await taskApi.get('1');
      expect(task1.status).toBe(TaskStatus.InProgress);
      expect(task1.timeSpent).toBe(5000); // Should not have changed
    });

    it('should stop an InProgress task when another starts, even when lastStartedAt is a string (loaded from disk)', async () => {
      // Setup: Task 1 is InProgress with lastStartedAt as ISO string (simulating read from JSON)
      const dateStr = new Date(new Date().getTime() - 60000).toISOString();
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      mockDb.data.tasks[0].lastStartedAt = dateStr as any; // String instead of Date
      mockDb.data.tasks[0].timeSpent = 0;

      // Setup: Task 2 is Pending
      mockDb.data.tasks[1] = {
        _id: 'task-2-id',
        externalId: 2,
        title: 'Task 2',
        importance: 3,
        urgency: 3,
        estimatedTime: 10,
        status: TaskStatus.Pending,
        createdAt: new Date(),
        updatedAt: new Date(),
        labels: [],
        timeSpent: 0,
      };

      // Action: Start Task 2
      await taskApi.update('2', { ...taskDto({ status: TaskStatus.InProgress }) });

      // Assertions
      const task1 = await taskApi.get('1');
      expect(task1.status).toBe(TaskStatus.Pending);
      expect(task1.timeSpent).toBeGreaterThan(55000);
      expect(task1.lastStartedAt).toBeUndefined();
    });

    it('should accumulate time when moving away from InProgress, even when lastStartedAt is a string', async () => {
      // Setup: Task is InProgress with lastStartedAt as ISO string
      const dateStr = new Date(new Date().getTime() - 120000).toISOString();
      mockDb.data.tasks[0].status = TaskStatus.InProgress;
      mockDb.data.tasks[0].lastStartedAt = dateStr as any;
      mockDb.data.tasks[0].timeSpent = 0;

      // Action: Move to Pending
      const updatedTask = await taskApi.update('1', { ...taskDto({ status: TaskStatus.Pending }) });

      // Should have accumulated ~120s without crashing
      expect(updatedTask.timeSpent).toBeGreaterThan(118000);
      expect(updatedTask.timeSpent).toBeLessThan(122000);
      expect(updatedTask.lastStartedAt).toBeUndefined();
    });
    
  });
});

function taskDto(data: any) {
  return {
    title: 'dummy',
    importance: 1,
    urgency: 1,
    estimatedTime: 1,
    ...data
  };
}
