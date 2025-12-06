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

