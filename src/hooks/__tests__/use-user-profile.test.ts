import { renderHook, act, waitFor } from '@testing-library/react';
import { useUserProfile } from '../use-user-profile';
import { supabase } from '@/lib/supabase';

// Mock useAuth hook
jest.mock('../use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      user_metadata: {
        full_name: 'Test User',
      },
    },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

const mockProfile = {
  id: 'test-user-id',
  username: 'testuser',
  full_name: 'Test User',
  avatar_url: 'https://example.com/avatar.jpg',
  bio: 'Test bio',
  preferred_categories: ['Música', 'Teatro'],
  preferred_districts: ['Miraflores', 'Barranco'],
  notification_enabled: true,
  email_notifications: false,
  theme: 'system' as const,
  language: 'es',
  profile_visibility: 'public' as const,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
};

describe('useUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load user profile from Supabase', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null,
      }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.profile).toEqual(mockProfile);
    });
  });

  it('should create profile if it does not exist', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: null,
          error: { code: 'PGRST116' }, // Not found
        })
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.profile).toBeTruthy();
    });
  });

  it('should update profile', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockProfile, bio: 'Updated bio' },
          error: null,
        }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile);
    });

    await act(async () => {
      await result.current.updateProfile({ bio: 'Updated bio' });
    });

    await waitFor(() => {
      expect(result.current.profile?.bio).toBe('Updated bio');
    });
  });

  it('should add preferred category', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockProfile,
            preferred_categories: [...mockProfile.preferred_categories, 'Arte'],
          },
          error: null,
        }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile);
    });

    await act(async () => {
      await result.current.addPreferredCategory('Arte');
    });

    await waitFor(() => {
      expect(result.current.profile?.preferred_categories).toContain('Arte');
    });
  });

  it('should remove preferred category', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockProfile,
            preferred_categories: ['Teatro'],
          },
          error: null,
        }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile).toEqual(mockProfile);
    });

    await act(async () => {
      await result.current.removePreferredCategory('Música');
    });

    await waitFor(() => {
      expect(result.current.profile?.preferred_categories).not.toContain('Música');
    });
  });

  it('should toggle notifications', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockProfile,
            notification_enabled: false,
          },
          error: null,
        }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile?.notification_enabled).toBe(true);
    });

    await act(async () => {
      await result.current.toggleNotifications();
    });

    await waitFor(() => {
      expect(result.current.profile?.notification_enabled).toBe(false);
    });
  });

  it('should set theme', async () => {
    (supabase.from as jest.Mock).mockReturnValue({
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn()
        .mockResolvedValueOnce({
          data: mockProfile,
          error: null,
        })
        .mockResolvedValueOnce({
          data: {
            ...mockProfile,
            theme: 'dark',
          },
          error: null,
        }),
    });

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => {
      expect(result.current.profile?.theme).toBe('system');
    });

    await act(async () => {
      await result.current.setTheme('dark');
    });

    await waitFor(() => {
      expect(result.current.profile?.theme).toBe('dark');
    });
  });
});
