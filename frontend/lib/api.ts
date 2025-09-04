import axios from 'axios';
import { getAuthToken } from '@/lib/auth';
import type {
  User, UserRole, UserGroup, UserGroupMember, UserPreference,
  UserActivityLog, UserSession, UserFormData, UserRoleFormData, 
  UserGroupFormData, UserPreferenceFormData, UserQueryParams,
  ActivityLogQueryParams, UserStats, ActivityStats, PaginatedResponse
} from './user-management-types';

const baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5050';
export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 简化版用户管理API
export const userManagementApi = {
  // 用户管理
  users: {
    // 获取用户列表
    list: (params?: UserQueryParams) => 
      api.get<PaginatedResponse<User>>('/api/users', { params }),
    
    // 获取用户详情
    get: (id: number) => 
      api.get<User>(`/api/users/${id}`),
    
    // 创建用户
    create: (data: UserFormData) => 
      api.post<User>('/api/users', data),
    
    // 更新用户
    update: (id: number, data: Partial<UserFormData>) => 
      api.patch<User>(`/api/users/${id}`, data),
    
    // 删除用户
    delete: (id: number) => 
      api.delete(`/api/users/${id}`),
    
    // 切换用户状态
    toggleStatus: (id: number, isActive: boolean) => 
      api.patch(`/api/users/${id}/status`, { is_active: isActive }),
    
    // 重置密码
    resetPassword: (id: number, newPassword: string) => 
      api.patch(`/api/users/${id}/password`, { password: newPassword }),
    
    // 获取用户统计
    getStats: () => 
      api.get<UserStats>('/api/users/stats'),
  },

  // 角色管理
  roles: {
    // 获取角色列表
    list: () => 
      api.get<UserRole[]>('/api/user-roles'),
    
    // 获取角色详情
    get: (id: number) => 
      api.get<UserRole>(`/api/user-roles/${id}`),
    
    // 创建角色
    create: (data: UserRoleFormData) => 
      api.post<UserRole>('/api/user-roles', data),
    
    // 更新角色
    update: (id: number, data: Partial<UserRoleFormData>) => 
      api.patch<UserRole>(`/api/user-roles/${id}`, data),
    
    // 删除角色
    delete: (id: number) => 
      api.delete(`/api/user-roles/${id}`),
  },

  // 用户组管理
  groups: {
    // 获取用户组列表
    list: () => 
      api.get<UserGroup[]>('/api/user-groups'),
    
    // 获取用户组详情
    get: (id: number) => 
      api.get<UserGroup>(`/api/user-groups/${id}`),
    
    // 创建用户组
    create: (data: UserGroupFormData) => 
      api.post<UserGroup>('/api/user-groups', data),
    
    // 更新用户组
    update: (id: number, data: Partial<UserGroupFormData>) => 
      api.patch<UserGroup>(`/api/user-groups/${id}`, data),
    
    // 删除用户组
    delete: (id: number) => 
      api.delete(`/api/user-groups/${id}`),
    
    // 获取组成员
    getMembers: (groupId: number) => 
      api.get<UserGroupMember[]>(`/api/user-groups/${groupId}/members`),
    
    // 添加成员
    addMember: (groupId: number, userId: number, role: 'member' | 'admin' = 'member') => 
      api.post(`/api/user-groups/${groupId}/members`, { user_id: userId, role }),
    
    // 移除成员
    removeMember: (groupId: number, userId: number) => 
      api.delete(`/api/user-groups/${groupId}/members/${userId}`),
    
    // 更新成员角色
    updateMemberRole: (groupId: number, userId: number, role: 'member' | 'admin') => 
      api.patch(`/api/user-groups/${groupId}/members/${userId}`, { role }),
  },

  // 用户偏好设置
  preferences: {
    // 获取所有偏好设置
    list: () => 
      api.get<UserPreference[]>('/api/user-preferences'),
    
    // 获取用户偏好
    getUserPreferences: (userId: number) => 
      api.get<UserPreference[]>(`/api/users/${userId}/preferences`),
    
    // 设置用户偏好
    setPreference: (userId: number, data: UserPreferenceFormData) => 
      api.post<UserPreference>(`/api/users/${userId}/preferences`, data),
    
    // 更新用户偏好
    updatePreference: (userId: number, key: string, value: any) => 
      api.patch(`/api/users/${userId}/preferences/${key}`, { preference_value: value }),
    
    // 删除用户偏好
    deletePreference: (userId: number, key: string) => 
      api.delete(`/api/users/${userId}/preferences/${key}`),
  },

  // 用户活动日志
  activityLogs: {
    // 获取活动日志
    list: (params?: ActivityLogQueryParams) => 
      api.get<PaginatedResponse<UserActivityLog>>('/api/user-activity-logs', { params }),
    
    // 获取用户活动日志
    getUserActivities: (userId: number, params?: ActivityLogQueryParams) => 
      api.get<PaginatedResponse<UserActivityLog>>(`/api/users/${userId}/activities`, { params }),
    
    // 获取活动统计
    getStats: (params?: ActivityLogQueryParams) => 
      api.get<ActivityStats>('/api/user-activity-logs/stats', { params }),
  },

  // 会话管理
  sessions: {
    // 获取所有会话
    list: () => 
      api.get<UserSession[]>('/api/user-sessions'),
    
    // 获取用户会话
    getUserSessions: (userId: number) => 
      api.get<UserSession[]>(`/api/users/${userId}/sessions`),
    
    // 撤销会话
    revokeSession: (sessionId: number) => 
      api.delete(`/api/user-sessions/${sessionId}`),
    
    // 撤销所有会话
    revokeAllSessions: (userId: number) => 
      api.delete(`/api/users/${userId}/sessions`),
  },

  // 权限检查
  permissions: {
    // 检查用户权限
    checkUserPermission: (userId: number, permission: string) => 
      api.get<{ has_permission: boolean }>(`/api/users/${userId}/permissions/${permission}`),
    
    // 获取用户权限列表
    getUserPermissions: (userId: number) => 
      api.get<string[]>(`/api/users/${userId}/permissions`),
  }
};

