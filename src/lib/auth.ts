// Lightweight client-side auth for the FloodWise demo.
// NOTE: This is NOT secure authentication — credentials live in localStorage
// for the prototype only. It is structured so it can be swapped for Supabase
// Auth (from the original FloodWise spec) without changing the UI.

export type Role = "citizen" | "lgu";

export interface Session {
  name: string;
  email: string;
  role: Role;
}

interface StoredUser {
  name: string;
  email: string;
  password: string; // demo only — never do this in production
  role: Role;
}

const SESSION_KEY = "fw_session";
const USERS_KEY = "fw_users";

function readUsers(): Record<string, StoredUser> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeUsers(users: Record<string, StoredUser>) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

function saveSession(s: Session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export type AuthResult = { ok: true; session: Session } | { ok: false; error: string };

export function register(
  name: string,
  email: string,
  password: string,
  role: Role = "citizen",
): AuthResult {
  const e = email.trim().toLowerCase();
  if (!name.trim()) return { ok: false, error: "Please enter your name." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return { ok: false, error: "Enter a valid email." };
  if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };

  const users = readUsers();
  if (users[e]) return { ok: false, error: "An account with this email already exists." };

  users[e] = { name: name.trim(), email: e, password, role };
  writeUsers(users);
  const session: Session = { name: name.trim(), email: e, role };
  saveSession(session);
  return { ok: true, session };
}

export function login(email: string, password: string): AuthResult {
  const e = email.trim().toLowerCase();
  const users = readUsers();
  const user = users[e];
  if (!user || user.password !== password) {
    return { ok: false, error: "Incorrect email or password." };
  }
  const session: Session = { name: user.name, email: user.email, role: user.role };
  saveSession(session);
  return { ok: true, session };
}
