import * as SecureStore from 'expo-secure-store';
import { AuthService, supabase } from './supabase';
import type { User, Session } from '@supabase/supabase-js';

const SESSION_KEY = 'tradeflow_session';
const TOKEN_KEY = 'tradeflow_token';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export class AuthManager {
  private static instance: AuthManager;
  private authStateListeners: ((state: AuthState) => void)[] = [];
  private currentState: AuthState = {
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  };

  private constructor() {
    this.initializeAuth();
  }

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private async initializeAuth() {
    try {
      console.log('AuthManager: Initializing auth...');
      
      // Check for existing session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
        return;
      }

      if (session?.user) {
        // Valid session found
        console.log('AuthManager: Found valid session for user:', session.user.email);
        this.updateAuthState({
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
        });
        
        // Save session to secure storage
        await this.saveSession(session);
      } else {
        // No valid session, check secure storage
        const savedSession = await this.getStoredSession();
        if (savedSession) {
          console.log('AuthManager: Found saved session, attempting to refresh...');
          // Try to refresh the session
          await this.refreshSession();
        } else {
          console.log('AuthManager: No stored session found, user needs to sign in');
          this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
        }
      }

      // Listen for auth state changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.saveSession(session);
          this.updateAuthState({
            user: session.user,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        } else if (event === 'SIGNED_OUT') {
          await this.clearSession();
          this.updateAuthState({
            user: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
          });
        } else if (event === 'TOKEN_REFRESHED' && session) {
          await this.saveSession(session);
          this.updateAuthState({
            user: session.user,
            session,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      });

      // Add a timeout to ensure loading state is cleared even if something goes wrong
      setTimeout(() => {
        if (this.currentState.isLoading) {
          console.log('AuthManager: Timeout reached, clearing loading state');
          this.updateAuthState({ isLoading: false });
        }
      }, 5000); // 5 second timeout

      // Also add an immediate check after initialization
      setTimeout(() => {
        if (this.currentState.isLoading) {
          console.log('AuthManager: Initialization completed but still loading, clearing state');
          this.updateAuthState({ isLoading: false });
        }
      }, 100); // 100ms delay to allow async operations to complete
      
    } catch (error) {
      console.error('Error initializing auth:', error);
      this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
    }
  }

  private updateAuthState(newState: Partial<AuthState>) {
    this.currentState = { ...this.currentState, ...newState };
    this.authStateListeners.forEach(listener => listener(this.currentState));
  }

  private async saveSession(session: Session) {
    try {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
      await SecureStore.setItemAsync(TOKEN_KEY, session.access_token);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private async getStoredSession(): Promise<Session | null> {
    try {
      const sessionString = await SecureStore.getItemAsync(SESSION_KEY);
      if (sessionString) {
        return JSON.parse(sessionString);
      }
    } catch (error) {
      console.error('Error getting stored session:', error);
    }
    return null;
  }

  private async clearSession() {
    try {
      await SecureStore.deleteItemAsync(SESSION_KEY);
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing session:', error);
    }
  }

  private async refreshSession() {
    try {
      console.log('AuthManager: Refreshing session...');
      const storedSession = await this.getStoredSession();
      
      if (!storedSession?.refresh_token) {
        console.log('AuthManager: No refresh token found - user needs to sign in');
        await this.clearSession();
        this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
        return;
      }

      const { data: { session }, error } = await supabase.auth.refreshSession({
        refresh_token: storedSession.refresh_token,
      });
      
      if (error) {
        // Handle session missing error gracefully (this is expected when no session exists)
        if (error.message.includes('Auth session missing') || error.message.includes('refresh_token_not_found') || error.message.includes('Invalid refresh token')) {
          console.log('AuthManager: Invalid or expired refresh token - user needs to sign in');
        } else {
          console.error('AuthManager: Error refreshing session:', error);
        }
        await this.clearSession();
        this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
        return;
      }

      if (session?.user) {
        await this.saveSession(session);
        this.updateAuthState({
          user: session.user,
          session,
          isLoading: false,
          isAuthenticated: true,
        });
        console.log('AuthManager: Session refreshed successfully for user:', session.user.email);
      } else {
        // No session returned - clear stored session
        console.log('AuthManager: No session returned from refresh - clearing stored session');
        await this.clearSession();
        this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
      }
    } catch (error) {
      // Handle session missing error gracefully
      if (error instanceof Error && (error.message.includes('Auth session missing') || error.message.includes('refresh_token_not_found') || error.message.includes('Invalid refresh token'))) {
        console.log('AuthManager: Invalid or expired refresh token - user needs to sign in');
      } else {
        console.error('AuthManager: Error in refreshSession:', error);
      }
      await this.clearSession();
      this.updateAuthState({ user: null, session: null, isLoading: false, isAuthenticated: false });
    }
  }

  // Public methods
  async signIn(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      this.updateAuthState({ isLoading: true });
      
      const result = await AuthService.signIn(email, password);
      
      if (result.error) {
        this.updateAuthState({ isLoading: false });
        return result;
      }

      // Session will be handled by onAuthStateChange
      return result;
    } catch (error) {
      this.updateAuthState({ isLoading: false });
      return { user: null, error };
    }
  }

  async signUp(email: string, password: string): Promise<{ user: User | null; error: any }> {
    try {
      this.updateAuthState({ isLoading: true });
      
      const result = await AuthService.signUp(email, password);
      
      // Always set loading to false after signup attempt
      // User will need to verify email and then sign in manually
      this.updateAuthState({ isLoading: false });
      
      return result;
    } catch (error) {
      this.updateAuthState({ isLoading: false });
      return { user: null, error };
    }
  }

  async signOut(): Promise<{ error: any }> {
    try {
      this.updateAuthState({ isLoading: true });
      
      const result = await AuthService.signOut();
      
      // Ensure we clear the session and update state even if onAuthStateChange doesn't trigger
      await this.clearSession();
      this.updateAuthState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });
      
      return result;
    } catch (error) {
      this.updateAuthState({ isLoading: false });
      return { error };
    }
  }

  getCurrentUser(): User | null {
    return this.currentState.user;
  }

  getAuthState(): AuthState {
    return this.currentState;
  }

  isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  isLoading(): boolean {
    return this.currentState.isLoading;
  }

  // Subscribe to auth state changes
  onAuthStateChange(listener: (state: AuthState) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Immediately call with current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  // Force refresh the auth state
  async forceRefresh(): Promise<void> {
    await this.refreshSession();
  }
} 