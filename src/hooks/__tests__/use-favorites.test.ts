import { renderHook, act, waitFor } from '@testing-library/react';
import { useFavorites } from '../use-favorites';
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
  category: 'Música',
  event_date: '2025-12-01T19:00:00Z',
  event_time: '19:00',
  venue_name: 'Test Venue',
  district: 'Miraflores',
  city: 'Lima',
  is_free: false,
  price_text: 'S/ 50',
  source_name: 'Test Source',
  source_url: 'https://example.com',
  tags: [],
  embedding_generated: false,
  is_active: true,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useFavorites', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('localStorage mode (unauthenticated)', () => {
    it('should initialize with empty favorites', () => {
      const { result } = renderHook(() => useFavorites());
      expect(result.current.favorites).toEqual([]);
      expect(result.current.isLoading).toBe(false);
    });

    it('should add a favorite to localStorage', async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(1);
        expect(result.current.favorites[0].id).toBe(mockEvent.id);
      });

      // Verify localStorage
      const stored = localStorage.getItem('cultuchat_favorites');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed).toHaveLength(1);
    });

    it('should remove a favorite from localStorage', async () => {
      const { result } = renderHook(() => useFavorites());

      act(() => {
        result.current.addFavorite(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(1);
      });

      act(() => {
        result.current.removeFavorite(mockEvent.id);
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(0);
      });
    });

    it('should check if event is favorited', async () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite(mockEvent.id)).toBe(false);

      act(() => {
        result.current.addFavorite(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isFavorite(mockEvent.id)).toBe(true);
      });
    });

    it('should toggle favorite status', async () => {
      const { result } = renderHook(() => useFavorites());

      expect(result.current.isFavorite(mockEvent.id)).toBe(false);

      await act(async () => {
        await result.current.toggleFavorite(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isFavorite(mockEvent.id)).toBe(true);
      });

      await act(async () => {
        await result.current.toggleFavorite(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.isFavorite(mockEvent.id)).toBe(false);
      });
    });
  });

  describe('Supabase mode (authenticated)', () => {
    beforeEach(() => {
      // Mock authenticated user
      const useAuthModule = jest.requireMock('../use-auth') as { useAuth: jest.Mock };
      useAuthModule.useAuth.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });
    });

    it('should load favorites from Supabase', async () => {
      const mockSupabaseData = [
        {
          id: 1,
          user_id: 'test-user-id',
          event_id: 1,
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

      const { result } = renderHook(() => useFavorites());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.favorites).toHaveLength(1);
      });
    });

    it('should add favorite to Supabase', async () => {
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      const { result } = renderHook(() => useFavorites());

      await act(async () => {
        await result.current.addFavorite(mockEvent);
      });

      await waitFor(() => {
        expect(result.current.favorites).toHaveLength(1);
      });
    });
  });

  describe('Migration', () => {
    it('should migrate localStorage favorites to Supabase on login', async () => {
      // Set up localStorage favorites
      const localFavorites = [mockEvent];
      localStorage.setItem('cultuchat_favorites', JSON.stringify(localFavorites));

      // Mock authenticated user
      const useAuthModule = jest.requireMock('../use-auth') as { useAuth: jest.Mock };
      useAuthModule.useAuth.mockReturnValue({
        user: { id: 'test-user-id', email: 'test@example.com' },
        isAuthenticated: true,
        isLoading: false,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
        single: jest.fn().mockResolvedValue({ data: {}, error: null }),
      });

      renderHook(() => useFavorites());

      await waitFor(() => {
        expect(supabase.from).toHaveBeenCalledWith('user_favorites');
      });
    });
  });
});
