"use client";

import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./use-auth";

export interface UserProfile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  preferred_categories?: string[];
  preferred_districts?: string[];
  notification_enabled: boolean;
  email_notifications: boolean;
  theme: "light" | "dark" | "system";
  language: string;
  profile_visibility: "public" | "private";
  created_at?: string;
  updated_at?: string;
}

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Create a new profile for the user
   */
  const createProfile = useCallback(async () => {
    if (!user) return;

    try {
      const newProfile: Partial<UserProfile> = {
        id: user.id,
        full_name: user.name || user.email?.split('@')[0],
        notification_enabled: true,
        email_notifications: false,
        theme: "system",
        language: "es",
        profile_visibility: "public"
      };

      const { data, error: insertError } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating profile:", insertError);
        setError(insertError.message);
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("Error creating profile:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, [user]);

  /**
   * Load user profile from Supabase
   */
  const loadProfile = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Profile doesn't exist, create one
          await createProfile();
        } else {
          console.error("Error loading profile:", fetchError);
          setError(fetchError.message);
        }
      } else {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [user, createProfile]);

  // Load profile on mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadProfile();
    } else {
      setProfile(null);
      setIsLoading(false);
    }
  }, [isAuthenticated, user, loadProfile]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const { data, error: updateError } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating profile:", updateError);
        setError(updateError.message);
        return false;
      }

      setProfile(data as UserProfile);
      return true;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, [user, profile]);

  /**
   * Update user avatar
   */
  const updateAvatar = useCallback(async (file: File) => {
    if (!user) return null;

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await updateProfile({ avatar_url: publicUrl });

      return publicUrl;
    } catch (err) {
      console.error("Error updating avatar:", err);
      return null;
    }
  }, [user, updateProfile]);

  /**
   * Add preferred category
   */
  const addPreferredCategory = useCallback(async (category: string) => {
    if (!profile) return;

    const currentCategories = profile.preferred_categories || [];
    if (currentCategories.includes(category)) return;

    const updated = [...currentCategories, category];
    await updateProfile({ preferred_categories: updated });
  }, [profile, updateProfile]);

  /**
   * Remove preferred category
   */
  const removePreferredCategory = useCallback(async (category: string) => {
    if (!profile) return;

    const currentCategories = profile.preferred_categories || [];
    const updated = currentCategories.filter(c => c !== category);
    await updateProfile({ preferred_categories: updated });
  }, [profile, updateProfile]);

  /**
   * Add preferred district
   */
  const addPreferredDistrict = useCallback(async (district: string) => {
    if (!profile) return;

    const currentDistricts = profile.preferred_districts || [];
    if (currentDistricts.includes(district)) return;

    const updated = [...currentDistricts, district];
    await updateProfile({ preferred_districts: updated });
  }, [profile, updateProfile]);

  /**
   * Remove preferred district
   */
  const removePreferredDistrict = useCallback(async (district: string) => {
    if (!profile) return;

    const currentDistricts = profile.preferred_districts || [];
    const updated = currentDistricts.filter(d => d !== district);
    await updateProfile({ preferred_districts: updated });
  }, [profile, updateProfile]);

  /**
   * Toggle notification setting
   */
  const toggleNotifications = useCallback(async () => {
    if (!profile) return;
    await updateProfile({ notification_enabled: !profile.notification_enabled });
  }, [profile, updateProfile]);

  /**
   * Toggle email notifications
   */
  const toggleEmailNotifications = useCallback(async () => {
    if (!profile) return;
    await updateProfile({ email_notifications: !profile.email_notifications });
  }, [profile, updateProfile]);

  /**
   * Set theme preference
   */
  const setTheme = useCallback(async (theme: "light" | "dark" | "system") => {
    if (!profile) return;
    await updateProfile({ theme });
  }, [profile, updateProfile]);

  /**
   * Set profile visibility
   */
  const setProfileVisibility = useCallback(async (visibility: "public" | "private") => {
    if (!profile) return;
    await updateProfile({ profile_visibility: visibility });
  }, [profile, updateProfile]);

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
    addPreferredCategory,
    removePreferredCategory,
    addPreferredDistrict,
    removePreferredDistrict,
    toggleNotifications,
    toggleEmailNotifications,
    setTheme,
    setProfileVisibility,
    refreshProfile: loadProfile
  };
}
