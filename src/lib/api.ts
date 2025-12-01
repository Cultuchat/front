import { supabase } from './supabase';
import type { Event } from '@/types/event';

export async function getEvent(id: number): Promise<Event | null> {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getEvent:', error);
    throw error;
  }
}

export async function getEvents(filters?: {
  category?: string;
  district?: string;
  search?: string;
  is_free?: boolean;
  date_from?: string;
  date_to?: string;
}): Promise<Event[]> {
  try {
    let query = supabase
      .from('events')
      .select('*')
      .eq('is_active', true)
      .order('event_date', { ascending: true, nullsFirst: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.district) {
      query = query.eq('district', filters.district);
    }

    if (filters?.is_free !== undefined) {
      query = query.eq('is_free', filters.is_free);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    if (filters?.date_from) {
      query = query.gte('event_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('event_date', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getEvents:', error);
    throw error;
  }
}
