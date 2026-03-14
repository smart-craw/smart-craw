import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  routeCreateBot, 
  routeRemoveBot, 
  routeGetAllBots,
  routeGetMessages,
  routeApproval
} from './router.ts';
import { Action, Assistant } from '../../shared/models.ts';

// Mock the llm utils dependency
vi.mock('../llm_utils/bots.ts', () => ({
  createBot: vi.fn().mockReturnValue({
    id: 'mock-id',
    name: 'test-bot',
    definition: {
      'test-bot': {
        description: 'desc',
        prompt: 'prompt'
      }
    }
  }),
  botExecute: vi.fn()
}));

const mockWs = {
  send: vi.fn()
};

describe('Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('routeCreateBot', () => {
    it('should call insertBot and ws.send', () => {
      const insertBotMock = vi.fn();
      routeCreateBot(
        { name: 'test-bot', description: 'desc', instructions: 'instr' } as any,
        mockWs as any,
        insertBotMock
      );
      
      expect(insertBotMock).toHaveBeenCalledWith('mock-id', 'test-bot', 'desc', 'prompt');
      expect(mockWs.send).toHaveBeenCalled();
      
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.CreateBot);
      expect(sentData.name).toBe('test-bot');
    });
  });

  describe('routeRemoveBot', () => {
    it('should call removeBot', () => {
      const removeBotMock = vi.fn();
      routeRemoveBot({ id: 'bot-1' } as any, removeBotMock);
      
      expect(removeBotMock).toHaveBeenCalledWith('bot-1');
    });
  });

  describe('routeGetAllBots', () => {
    it('should call getBots and send result via websocket', () => {
      const getBotsMock = vi.fn().mockReturnValue([{ id: 'bot-1' }]);
      routeGetAllBots(mockWs as any, getBotsMock);
      
      expect(getBotsMock).toHaveBeenCalled();
      expect(mockWs.send).toHaveBeenCalled();
      
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.GetBots);
      expect(sentData.bots).toEqual([{ id: 'bot-1' }]);
    });
  });
  
  describe('routeGetMessages', () => {
    it('should call getMessages and send result', () => {
      const getMessagesMock = vi.fn().mockReturnValue([{ id: 'msg-1' }]);
      routeGetMessages({ id: 'bot-1' } as any, mockWs as any, getMessagesMock);
      
      expect(getMessagesMock).toHaveBeenCalledWith('bot-1');
      expect(mockWs.send).toHaveBeenCalled();
      
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.GetMessages);
      expect(sentData.id).toBe('bot-1');
      expect(sentData.messages).toEqual([{ id: 'msg-1' }]);
    });
  });

  describe('routeApproval', () => {
    it('should invoke pending approval function and send actioned message', () => {
      const resolveMock = vi.fn();
      const pendingApprovals = new Map<string, (approved: boolean) => void>();
      pendingApprovals.set('app-1', resolveMock);
      
      routeApproval(
        { id: 'app-1', approved: true } as any,
        mockWs as any,
        Assistant.Bot,
        pendingApprovals
      );
      
      expect(resolveMock).toHaveBeenCalledWith(true);
      expect(pendingApprovals.has('app-1')).toBe(false);
      expect(mockWs.send).toHaveBeenCalled();
      
      const sentData = JSON.parse(mockWs.send.mock.calls[0][0]);
      expect(sentData.action).toBe(Action.ApprovalActioned);
      expect(sentData.approved).toBe(true);
    });
  });
});
