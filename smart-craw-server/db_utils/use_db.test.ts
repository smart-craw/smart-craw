import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockRun, mockGet, mockAll } = vi.hoisted(() => {
  return {
    mockRun: vi.fn(),
    mockGet: vi.fn(),
    mockAll: vi.fn(),
  };
});

vi.mock('node:sqlite', () => {
  return {
    DatabaseSync: class DatabaseSync {
      prepare = vi.fn().mockReturnValue({
        run: mockRun,
        get: mockGet,
        all: mockAll
      });
    }
  };
});

import { insertBot, getBot, getBots, removeBot, insertMessage, getMessages } from './use_db.ts';

describe('db_utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('insertBot', () => {
    it('should successfully execute run', () => {
      insertBot('123', 'Bot1', 'Desc1', 'Instr1');
      expect(mockRun).toHaveBeenCalledWith('123', 'Bot1', 'Desc1', 'Instr1');
    });

    it('should catch errors and log them without crashing', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRun.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      expect(() => insertBot('123', 'Bot1', 'Desc1', 'Instr1')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalledWith('Error inserting bot 123:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getBot', () => {
    it('should return a bot if found', () => {
      const mockResult = { id: '123', name: 'Bot1' };
      mockGet.mockReturnValueOnce(mockResult);
      const result = getBot('123');
      expect(result).toEqual(mockResult);
      expect(mockGet).toHaveBeenCalledWith('123');
    });

    it('should handle errors and return undefined', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGet.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      const result = getBot('123');
      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('getBots', () => {
    it('should return all bots', () => {
      const mockResult = [{ id: '123', name: 'Bot1' }];
      mockAll.mockReturnValueOnce(mockResult);
      expect(getBots()).toEqual(mockResult);
      expect(mockAll).toHaveBeenCalled();
    });

    it('should return an empty array on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAll.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      expect(getBots()).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('removeBot', () => {
    it('should execute run', () => {
      removeBot('123');
      expect(mockRun).toHaveBeenCalledWith('123');
    });

    it('should catch errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRun.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      expect(() => removeBot('123')).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('insertMessage', () => {
    it('should execute run with random UUID', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      insertMessage('bot-1', 'hello', 'thinking');
      
      // The first arg is a UUID
      expect(mockRun).toHaveBeenCalledWith(expect.any(String), 'bot-1', 'hello', 'thinking');
      consoleLogSpy.mockRestore();
    });

    it('should catch errors', () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockRun.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      expect(() => insertMessage('bot-1', 'hello', 'thinking')).not.toThrow();
      expect(consoleErrSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockRestore();
      consoleErrSpy.mockRestore();
    });
  });

  describe('getMessages', () => {
    it('should return all messages', () => {
      const mockResult = [{ id: 'msg-1', message: 'Hi' }];
      mockAll.mockReturnValueOnce(mockResult);
      
      expect(getMessages('bot-1')).toEqual(mockResult);
      expect(mockAll).toHaveBeenCalledWith('bot-1');
    });

    it('should return an empty array on error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockAll.mockImplementationOnce(() => { throw new Error('DB Error'); });
      
      expect(getMessages('bot-1')).toEqual([]);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
