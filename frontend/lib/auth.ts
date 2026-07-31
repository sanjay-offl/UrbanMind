export interface User {
  name: string;
  email: string;
  role: string;
}

export const DEMO_CREDENTIALS = {
  email: 'admin@urbanmind.io',
  password: 'demo1234',
  name: 'Admin User',
  role: 'Administrator',
};

const SESSION_KEY = 'um-session';

export function login(email: string, password: string): User | null {
  if (
    email.trim().toLowerCase() === DEMO_CREDENTIALS.email &&
    password === DEMO_CREDENTIALS.password
  ) {
    const user: User = {
      name: DEMO_CREDENTIALS.name,
      email: DEMO_CREDENTIALS.email,
      role: DEMO_CREDENTIALS.role,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
    return user;
  }
  return null;
}

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function logout(): void {
  localStorage.removeItem(SESSION_KEY);
}

export function updateSession(user: User): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function verifyPassword(password: string): boolean {
  return password === DEMO_CREDENTIALS.password;
}
