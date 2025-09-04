/**
 * 简化版用户管理功能类型定义
 * 去掉了通知管理和API管理模块
 */

// 基础用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  full_name?: string;
  avatar_url?: string;
  phone?: string;
  department?: string;
  position?: string;
  timezone?: string;
  language?: string;
  email_verified?: boolean;
  phone_verified?: boolean;
  two_factor_enabled?: boolean;
  failed_login_attempts?: number;
  locked_until?: string;
  password_changed_at?: string;
  last_activity_at?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

// 用户角色类型
export interface UserRole {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
}

// 用户偏好设置类型
export interface UserPreference {
  id: number;
  user_id: number;
  preference_key: string;
  preference_value: any; // JSON 对象
  created_at: string;
  updated_at: string;
}

// 用户活动日志类型
export interface UserActivityLog {
  id: number;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: number;
  details?: any; // JSON 对象
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// 用户会话类型
export interface UserSession {
  id: number;
  user_id: number;
  session_token: string;
  refresh_token?: string;
  expires_at: string;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string;
}

// 用户组类型
export interface UserGroup {
  id: number;
  name: string;
  description?: string;
  created_by?: number;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

// 用户组成员类型
export interface UserGroupMember {
  id: number;
  group_id: number;
  user_id: number;
  role: 'member' | 'admin';
  joined_at: string;
  user?: User;
  group?: UserGroup;
}

// 表单数据类型
export interface UserFormData {
  username: string;
  email: string;
  role: string;
  full_name?: string;
  phone?: string;
  department?: string;
  position?: string;
  timezone?: string;
  language?: string;
  password?: string;
}

export interface UserRoleFormData {
  name: string;
  display_name: string;
  description?: string;
  permissions: string[];
  is_system_role?: boolean;
}

export interface UserGroupFormData {
  name: string;
  description?: string;
}

export interface UserPreferenceFormData {
  preference_key: string;
  preference_value: any;
}

// 查询参数类型
export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  department?: string;
  is_active?: boolean;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface ActivityLogQueryParams {
  page?: number;
  limit?: number;
  user_id?: number;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
}

// 统计数据类型
export interface UserStats {
  total_users: number;
  active_users: number;
  users_by_role: Record<string, number>;
  users_by_department: Record<string, number>;
  recent_activity: number;
  failed_logins: number;
}

export interface ActivityStats {
  total_activities: number;
  activities_by_action: Record<string, number>;
  activities_by_user: Record<string, number>;
  daily_activities: Array<{
    date: string;
    count: number;
  }>;
}

// 权限相关类型
export interface Permission {
  key: string;
  name: string;
  description: string;
  category: string;
}

export interface PermissionCategory {
  name: string;
  permissions: Permission[];
}

// API响应类型
export interface ApiResponse<T> {
  code: number;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// 组件Props类型
export interface UserManagementProps {
  currentUser: User;
  permissions: string[];
}

export interface UserTableProps {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (userId: number) => void;
  onToggleStatus: (userId: number, isActive: boolean) => void;
  loading?: boolean;
}

export interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export interface RoleManagementProps {
  roles: UserRole[];
  onEdit: (role: UserRole) => void;
  onDelete: (roleId: number) => void;
  onCreate: (data: UserRoleFormData) => void;
  loading?: boolean;
}

export interface GroupManagementProps {
  groups: UserGroup[];
  onEdit: (group: UserGroup) => void;
  onDelete: (groupId: number) => void;
  onCreate: (data: UserGroupFormData) => void;
  loading?: boolean;
}

export interface ActivityLogProps {
  activities: UserActivityLog[];
  onLoadMore: () => void;
  hasMore: boolean;
  loading?: boolean;
}

export interface SessionManagementProps {
  sessions: UserSession[];
  onRevoke: (sessionId: number) => void;
  onRevokeAll: (userId: number) => void;
  loading?: boolean;
}

export interface PreferenceSettingsProps {
  preferences: UserPreference[];
  onUpdate: (preference: UserPreference) => void;
  onReset: () => void;
  loading?: boolean;
}
