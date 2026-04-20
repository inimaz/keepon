import { describe, it, expect } from 'vitest';
import { calculatePriority } from '../../src/tasks/taskApi.class.js';

describe('calculatePriority', () => {
  it('should calculate priority correctly', () => {
    const task = {
      importance: 3,
      urgency: 3,
      estimatedTime: 1
    };
    const priority = calculatePriority(task as any);
    expect(priority).toBe(9);
  });

  it('should throw error if estimatedTime is missing', () => {
    const task = {
      importance: 3,
      urgency: 3
    };
    expect(() => calculatePriority(task as any)).toThrow('Task must have an estimated time');
  });

  it('should throw error if importance is missing', () => {
    const task = {
      urgency: 3,
      estimatedTime: 1
    };
    expect(() => calculatePriority(task as any)).toThrow('Task must have an importance');
  });

  it('should throw error if urgency is missing', () => {
    const task = {
      importance: 3,
      estimatedTime: 1
    };
    expect(() => calculatePriority(task as any)).toThrow('Task must have an urgency');
  });
});
