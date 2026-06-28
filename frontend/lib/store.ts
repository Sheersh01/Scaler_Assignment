import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  phone: string;
  display_name: string;
  avatar?: string;
  is_online: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  setAuth: (user, token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
    set({ user, token });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    set({ user: null, token: null });
  },
}));

interface SocketState {
  ws: WebSocket | null;
  connect: (userId: number) => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  ws: null,
  connect: (userId) => {
    if (get().ws) return;
    const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = url.replace('http', 'ws');
    
    const connectWs = () => {
      const ws = new WebSocket(`${wsUrl}/ws/${userId}`);
      
      ws.onopen = () => console.log('Global WS connected');
      ws.onclose = () => {
        // Auto-reconnect if the server drops the connection
        setTimeout(connectWs, 3000);
      };

      set({ ws });
    };

    connectWs();
  },
  disconnect: () => {
    const { ws } = get();
    if (ws) {
      ws.onclose = null; // Prevent auto-reconnect on explicit logout
      ws.close();
      set({ ws: null });
    }
  }
}));

interface ThemeState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },
  toggleTheme: () => {
    const newTheme = get().theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  }
}));
