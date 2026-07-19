/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Warga } from './types';
import { initLocalStorage, syncDatabaseFromServer } from './data';
import LoginScreen from './components/LoginScreen';
import WargaDashboard from './components/WargaDashboard';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Warga | null>(null);

  useEffect(() => {
    // 1. Initialize local DB with high-fidelity mock data if empty
    initLocalStorage();

    // 2. Sync from real PostgreSQL database
    syncDatabaseFromServer().then((success) => {
      if (success) {
        console.log('Successfully loaded data from PostgreSQL!');
        // Recover existing session from LocalStorage after sync
        const storedUser = localStorage.getItem('arsanta_session');
        if (storedUser) {
          try {
            setCurrentUser(JSON.parse(storedUser));
          } catch (err) {
            console.error('Failed to parse session:', err);
          }
        }
      }
    });

    // 3. Fallback: Try to recover existing session from LocalStorage (optional, for great UX)
    const storedUser = localStorage.getItem('arsanta_session');
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Failed to parse session:', err);
      }
    }
  }, []);

  const handleLoginSuccess = (user: Warga) => {
    setCurrentUser(user);
    localStorage.setItem('arsanta_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('arsanta_session');
  };

  // Render pipeline based on auth session & role
  return (
    <div className="min-h-screen bg-brand-bg text-text-main selection:bg-primary/20 selection:text-primary-dark">
      {!currentUser ? (
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.role === 'admin' ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <WargaDashboard user={currentUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
