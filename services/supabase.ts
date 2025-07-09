import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { getEmailConfirmationURL } from './authConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Supabase configuration from app.json
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase configuration. Please add your Supabase URL and anon key to app.json extra configuration.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export class AuthService {
  static async signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getEmailConfirmationURL(),
        },
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing up:', error);
      return { user: null, error };
    }
  }

  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error signing in:', error);
      return { user: null, error };
    }
  }

  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error);
      return { error };
    }
  }

  static async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
}

export class InventoryService {
  static async getInventoryItems(userId: string) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      return { data: null, error };
    }
  }

  static async createInventoryItem(item: any) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return { data: null, error };
    }
  }

  static async updateInventoryItem(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return { data: null, error };
    }
  }

  static async deleteInventoryItem(id: string) {
    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return { error };
    }
  }
} 