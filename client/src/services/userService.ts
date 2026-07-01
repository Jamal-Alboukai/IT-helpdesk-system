import api from './api';

export interface AgentLookup {
  id: string;
  fullName: string;
  email: string;
}

export interface UserListItem {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  roleId: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  createdAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  tempPassword: string;
  roleId: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  roleId?: string;
}

export interface RoleLookup {
  id: string;
  name: string;
}

export const userService = {
  getAllUsers: async (): Promise<UserListItem[]> => {
    const response = await api.get('/user');
    return response.data;
  },

  getAgents: async (): Promise<AgentLookup[]> => {
    const response = await api.get('/user/agents');
    return response.data;
  },

  getUserById: async (id: string): Promise<UserDetail> => {
    const response = await api.get(`/user/${id}`);
    return response.data;
  },

  createUser: async (data: CreateUserRequest): Promise<UserDetail> => {
    const response = await api.post('/user', data);
    return response.data;
  },

  updateUser: async (
    id: string,
    data: UpdateUserRequest
  ): Promise<UserDetail> => {
    const response = await api.put(`/user/${id}`, data);
    return response.data;
  },

  toggleActive: async (id: string): Promise<void> => {
    await api.put(`/user/${id}/toggle-active`);
  },

  getRoles: async (): Promise<RoleLookup[]> => {
    const response = await api.get('/user/roles');
    return response.data;
  },
};