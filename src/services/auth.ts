const TOKEN_KEY = 'productivity_auth_token';
const USER_KEY = 'productivity_auth_user';

export interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
}

export async function loginUser(username: string, password: string): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, data.user?.username || username);
      return { success: true };
    }
    return { success: false, message: data.message || 'Authentication failed' };
  } catch (err) {
    // If running in preview or offline environment where server fetch might fail,
    // we provide a safe fallback so the user can test seamlessly
    console.error('Login request failed', err);
    return { success: false, message: 'Server connection error. Please try again.' };
  }
}

export async function verifyAuth(): Promise<{ isValid: boolean; username: string | null }> {
  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);
  if (!token) {
    return { isValid: false, username: null };
  }

  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.valid) {
        const username = data.user?.username && data.user.username !== 'admin' && data.user.username !== 'Alex'
          ? data.user.username
          : (user && user !== 'admin' && user !== 'Alex' ? user : 'Ravora');
        return { isValid: true, username };
      }
    }
  } catch (e) {
    // If backend isn't reachable but token exists, maintain session
    if (token) {
      return { isValid: true, username: (user && user !== 'admin' && user !== 'Alex') ? user : 'Ravora' };
    }
  }

  // Token expired or invalid
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  return { isValid: false, username: null };
}

export async function getAuthHint(): Promise<{ isCustom: boolean; configuredUsername: string; defaultHint: string | null }> {
  try {
    const res = await fetch('/api/auth/hint');
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    // fallback
  }
  return {
    isCustom: false,
    configuredUsername: 'Ravora',
    defaultHint: 'Default: Ravora / password123',
  };
}

export function logoutUser(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser(): string | null {
  const user = localStorage.getItem(USER_KEY);
  if (!user || user === 'Alex' || user === 'admin') {
    return 'Ravora';
  }
  return user;
}
