'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getPocketBase } from '@/lib/pocketbase';
import type { RecordModel } from 'pocketbase';

interface AuthContextType {
  user: RecordModel | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, passwordConfirm: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RecordModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only initialize in browser
    if (typeof window === 'undefined') {
      return;
    }

    const pb = getPocketBase();

    // Check if user is already authenticated
    setUser(pb.authStore.model as RecordModel | null);
    setIsLoading(false);

    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model as RecordModel | null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const pb = getPocketBase();
    await pb.collection('users').authWithPassword(email, password);
  };

  const signup = async (email: string, password: string, passwordConfirm: string) => {
    const pb = getPocketBase();
    await pb.collection('users').create({
      email,
      password,
      passwordConfirm,
    });
    // Auto-login after signup
    await pb.collection('users').authWithPassword(email, password);
  };

  const logout = () => {
    const pb = getPocketBase();
    pb.authStore.clear();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
