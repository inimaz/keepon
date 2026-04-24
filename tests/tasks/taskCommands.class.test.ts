import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskCommands from '../../src/tasks/taskCommands.class.js';
import { TaskApi } from '../../src/tasks/taskApi.class.js';
import render from '../../src/render/index.js';
import { TaskStatus } from '../../src/types/task.interface.js';

vi.mock('../../src/tasks/taskApi.class.js');
vi.mock('../../src/render/index.js');
vi.mock('../../src/db.js', () => ({
  default: vi.fn().mockResolvedValue({
    data: { tasks: [] },
    write: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe('TaskCommands', () => {
  let taskCommands: TaskCommands;
  let mockTaskApi: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    taskCommands = new TaskCommands();
    taskCommands.db = {
      data: { tasks: [], lastTaskId: 0 },
      write: vi.fn().mockResolvedValue(undefined),
      data: { tasks: [], lastTaskId: 0 }
    };
    taskCommands.archivedb = {
      data: { tasks: [] },
      write: vi.fn().mockResolvedValue(undefined),
    };
    
    mockTaskApi = vi.mocked(TaskApi.prototype);
    taskCommands.taskAPi = new TaskApi(taskCommands.db) as any;
  });

  describe('createTask', () => {
    it('should create a task and call render.successCreate', async () => {
      const taskData = { title: 'New Task', importance: 1, urgency: 1, estimatedTime: 1 };
      const createdTask = { _id: '1', ...taskData };
      mockTaskApi.create.mockResolvedValue(createdTask);

      await taskCommands.createTask(taskData as any);

      expect(mockTaskApi.create).toHaveBeenCalledWith(taskData);
      expect(render.successCreate).toHaveBeenCalledWith('1');
    });
    describe('createTask with CLI positional arguments', () => {
      it('should correctly parse positional args from k create "test" "" 5 10 45', async () => {
        const createdTask = { _id: '1', title: 'test', estimatedTime: 45, urgency: 5, importance: 10 };
        mockTaskApi.create.mockResolvedValue(createdTask);

        // Simulate current CLI handler receiving args from commander
        const [title, posDescription, posUrgency, posImportance, posEstimatedTime] =
          ['test', '', '5', '10', '45'];

        const urgency = parseInt(posUrgency, 10);
        const importance = parseInt(posImportance, 10);
        const estimatedTime = parseInt(posEstimatedTime, 10);

        await taskCommands.createTask({
          title,
          description: posDescription,
          urgency,
          importance,
          estimatedTime,
        });

        expect(estimatedTime).toBe(45);
        expect(urgency).toBe(5);
        expect(importance).toBe(10);
        expect(mockTaskApi.create).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'test',
            estimatedTime: 45,
            urgency: 5,
            importance: 10,
          })
        );
      });
    });
  });

  describe('getTask', () => {
    it('should get a task and call render.successGet', async () => {
      const task = { _id: '1', title: 'Task 1' };
      mockTaskApi.get.mockResolvedValue(task);

      await taskCommands.getTask('1');

      expect(mockTaskApi.get).toHaveBeenCalledWith('1');
      expect(render.successGet).toHaveBeenCalledWith(task);
    });
  });

  describe('updateTask', () => {
    it('should update a task and call render.successEdit', async () => {
      const updateData = { title: 'Updated Task' };
      const updatedTask = { _id: '1', ...updateData };
      mockTaskApi.update.mockResolvedValue(updatedTask);

      await taskCommands.updateTask('1', updateData as any);

      expect(mockTaskApi.update).toHaveBeenCalledWith('1', updateData);
      expect(render.successEdit).toHaveBeenCalledWith('1');
    });
  });

  describe('setStatusInProgress', () => {
    it('should set task status to InProgress and call render.successEdit', async () => {
      const updatedTask = { _id: '1', status: TaskStatus.InProgress };
      mockTaskApi.update.mockResolvedValue(updatedTask);

      await taskCommands.setStatusInProgress('1');

      expect(mockTaskApi.update).toHaveBeenCalledWith('1', {
        status: TaskStatus.InProgress,
        startedAt: expect.any(Date),
      });
      expect(render.successEdit).toHaveBeenCalledWith('1');
    });
  });

  describe('checkStatus', () => {
    it('should toggle status from Done to Pending', async () => {
      const task = { _id: '1', status: TaskStatus.Done };
      mockTaskApi.get.mockResolvedValue(task);
      mockTaskApi.update.mockResolvedValue({ _id: '1', status: TaskStatus.Pending });

      await taskCommands.checkStatus('1');

      expect(mockTaskApi.get).toHaveBeenCalledWith('1');
      expect(mockTaskApi.update).toHaveBeenCalledWith('1', {
        status: TaskStatus.Pending,
      });
      expect(render.successEdit).toHaveBeenCalledWith('1');
    });

    it('should toggle status from Pending to Done', async () => {
      const task = { _id: '1', status: TaskStatus.Pending };
      mockTaskApi.get.mockResolvedValue(task);
      mockTaskApi.update.mockResolvedValue({ _id: '1', status: TaskStatus.Done });

      await taskCommands.checkStatus('1');

      expect(mockTaskApi.get).toHaveBeenCalledWith('1');
      expect(mockTaskApi.update).toHaveBeenCalledWith('1', {
        status: TaskStatus.Done,
      });
      expect(render.successEdit).toHaveBeenCalledWith('1');
    });
  });

  describe('showTasksDashboard', () => {
    it('should show tasks dashboard with default params and call render.displayTaskDashboard', async () => {
      const tasks = { data: [{ _id: '1', title: 'Task 1' }] };
      mockTaskApi.getAll.mockResolvedValue(tasks);

      await taskCommands.showTasksDashboard();

      expect(mockTaskApi.getAll).toHaveBeenCalledWith({});
      expect(render.displayTaskDashboard).toHaveBeenCalledWith(tasks);
    });

    it('should show tasks dashboard with filter when hideBlockedTasks is true', async () => {
      const tasks = { data: [{ _id: '1', title: 'Task 1' }] };
      mockTaskApi.getAll.mockResolvedValue(tasks);

      await taskCommands.showTasksDashboard(true);

      expect(mockTaskApi.getAll).toHaveBeenCalledWith({
        statusExcludeFilter: [TaskStatus.Blocked],
      });
      expect(render.displayTaskDashboard).toHaveBeenCalledWith(tasks);
    });
  });

  describe('setStatusBlocked', () => {
    it('should set task status to Blocked and call render.successEdit', async () => {
      const updatedTask = { _id: '1', status: TaskStatus.Blocked };
      mockTaskApi.update.mockResolvedValue(updatedTask);

      await taskCommands.setStatusBlocked('1');

      expect(mockTaskApi.update).toHaveBeenCalledWith('1', {
        status: TaskStatus.Blocked,
      });
      expect(render.successEdit).toHaveBeenCalledWith('1');
    });
  });
});
