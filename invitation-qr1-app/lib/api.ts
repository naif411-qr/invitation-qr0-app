// API client for backend communication
import type { User, Group, Member, ScanLog, DesignTemplate } from '../types';

const API_BASE = '/api';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return response.json();
}

// Users API
export const usersAPI = {
  getAll: () => apiCall<User[]>('/users'),
  create: (user: Omit<User, 'id'> & { id?: string }) => apiCall<User>('/users', {
    method: 'POST',
    body: JSON.stringify(user),
  }),
  update: (id: string, user: Partial<User>) => apiCall<User>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(user),
  }),
  delete: (id: string) => apiCall<{ success: boolean }>(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Groups API
export const groupsAPI = {
  getAll: () => apiCall<Group[]>('/groups'),
  create: (group: Omit<Group, 'id' | 'createdAt'> & { id?: string }) => apiCall<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(group),
  }),
  update: (id: string, group: Partial<Group>) => apiCall<Group>(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(group),
  }),
  delete: (id: string) => apiCall<{ success: boolean }>(`/groups/${id}`, {
    method: 'DELETE',
  }),
};

// Members API
export const membersAPI = {
  getAll: () => apiCall<Member[]>('/members'),
  create: (member: Omit<Member, 'id'> & { id?: string }) => apiCall<Member>('/members', {
    method: 'POST',
    body: JSON.stringify(member),
  }),
  update: (id: string, member: Partial<Member>) => apiCall<Member>(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(member),
  }),
  delete: (id: string) => apiCall<{ success: boolean }>(`/members/${id}`, {
    method: 'DELETE',
  }),
};

// Scan Logs API
export const scanLogsAPI = {
  getAll: () => apiCall<ScanLog[]>('/scan-logs'),
  create: (log: Omit<ScanLog, 'id'> & { id?: string }) => apiCall<ScanLog>('/scan-logs', {
    method: 'POST',
    body: JSON.stringify(log),
  }),
};

// Design Templates API
export const designsAPI = {
  getAll: () => apiCall<DesignTemplate[]>('/designs'),
  create: (design: Omit<DesignTemplate, 'id'> & { id?: string }) => apiCall<DesignTemplate>('/designs', {
    method: 'POST',
    body: JSON.stringify(design),
  }),
  update: (id: string, design: Partial<DesignTemplate>) => apiCall<DesignTemplate>(`/designs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(design),
  }),
  delete: (id: string) => apiCall<{ success: boolean }>(`/designs/${id}`, {
    method: 'DELETE',
  }),
};

// Messages API
export const messagesAPI = {
  get: () => apiCall<{ id: string; thankYouMessage: string; followUpMessage: string; rsvpMessage?: string } | null>('/messages'),
  update: (id: string, messages: { thankYouMessage?: string; followUpMessage?: string; rsvpMessage?: string }) => 
    apiCall<{ id: string; thankYouMessage: string; followUpMessage: string; rsvpMessage?: string }>(`/messages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(messages),
    }),
  create: (messages: { thankYouMessage: string; followUpMessage: string; rsvpMessage?: string }) =>
    apiCall<{ id: string; thankYouMessage: string; followUpMessage: string; rsvpMessage?: string }>('/messages', {
      method: 'POST',
      body: JSON.stringify({ id: crypto.randomUUID(), ...messages }),
    }),
};

// Initialize database with default data
export const initDB = () => apiCall<{ success: boolean }>('/init', { method: 'POST' });
