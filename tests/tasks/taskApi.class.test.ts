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
            _id: '1',
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
            _id: '2',
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
    it('should return a task by id', async () => {
      const task = await taskApi.get('1');
      expect(task._id).toBe('1');
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
      expect(result.data[0]._id).toBe('2');
    });

    it('should apply sorting', async () => {
      const result = await taskApi.getAll({ sort: 'importance' as any, order: 'asc' });
      expect(result.data[0]._id).toBe('2');
    });

    it('should apply filtering by statusExcludeFilter', async () => {
      const result = await taskApi.getAll({ statusExcludeFilter: [TaskStatus.Done] });
      expect(result.data.length).toBe(1);
      expect(result.data[0]._id).toBe('1');
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
      expect(task._id).toBe('3');
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
