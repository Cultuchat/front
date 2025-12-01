import { renderHook, act, waitFor } from '@testing-library/react';
import { useHistory } from '../use-history';
import { supabase } from '@/lib/supabase';
import type { Event } from '@/types/event';

// Mock useAuth hook
jest.mock('../use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  })),
}));

const mockEvent: Event = {
  id: 1,
  title: 'Test Event',
  description: 'Test Description',
  category: 'Teatro',
  event_date: '2025-12-01T19:00:00Z',
  event_time: '19:00',
  venue_name: 'Test Venue',
  district: 'Barranco',
  city: 'Lima',
  is_free: true,
  source_name: 'Test Source',
  source_url: 'https://example.com',
  tags: [],
  embedding_generated: false,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('localStorage mode (unauthenticated)', () => {
    it('should initialize with empty history', () => {
      const { result } = renderHook(() => useHistory());
      expect(result.current.history).toEqual([]);
    });

    it('should add event to history', async () => {
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.addToHistory(mockEvent, false);
      });

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].id).toBe(mockEvent.id);
        expect(result.current.history[0].interested).toBe(false);
      });
    });

    it('should add event as interested', async () => {
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.addToHistory(mockEvent, true);
      });

      await waitFor(() => {
        expect(result.current.history[0].interested).toBe(true);
      });
    });

    it('should mark event as interested', async () => {
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.addToHistory(mockEvent, false);
      });

      await act(async () => {
        await result.current.markAsInterested(mockEvent.id.toString());
      });

      await waitFor(() => {
        expect(result.current.history[0].interested).toBe(true);
      });
    });

    it('should clear history', async () => {
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.addToHistory(mockEvent, false);
      });

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
      });

      await act(async () => {
        await result.current.clearHistory();
      });

      await waitFor(() => {
        expect(result.current.history).toHaveLength(0);
      });

      expect(localStorage.getItem('cultuchat_history')).toBeNull();
    });

    it('should update existing event in history', async () => {
      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.addToHistory(mockEvent, false);
      });

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
      });

      // Add same event again
      await act(async () => {
        await result.current.addToHistory(mockEvent, true);
      });

      await waitFor(() => {
        // Should still have only 1 event, but updated
        expect(result.current.history).toHaveLength(1);
        expect(result.current.history[0].interested).toBe(true);
      });
    });
  });

  describe('Supabase mode (authenticated)', () => {
    beforeEach(() => {
      const useAuthModule = jest.requireMock('../use-auth') as { useAuth: jest.Mock };
      useAuthModule.useAuth.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('should load history from Supabase', async () => {
      const mockSupabaseData = [
        {
          id: 1,
          user_id: 'test-user-id',
          event_id: 1,
          visited_at: new Date().toISOString(),
          interested: false,
          events: mockEvent,
        },
      ];

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSupabaseData,
          error: null,
        }),
      });

      const { result } = renderHook(() => useHistory());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.history).toHaveLength(1);
      });
    });

    it('should add history to Supabase', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      const { result } = renderHook(() => useHistory());

      await act(async () => {
        await result.current.addToHistory(mockEvent, false);
      });

      await waitFor(() => {
        expect(result.current.history).toHaveLength(1);
      });
    });
  });
});
