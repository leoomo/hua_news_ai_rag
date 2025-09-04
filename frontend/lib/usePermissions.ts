/**
 * 简化版权限管理Hook
 * 去掉了通知和API管理相关的权限
 */

import { useState, useEffect, useCallback } from 'react';
import { userManagementApi } from './api';
import type { User } from './user-management-types';

// 权限定义
export const PERMISSIONS = {
  // 用户管理权限
  USER_READ: 'user:read',
  USER_WRITE: 'user:write',
  USER_DELETE: 'user:delete',
  
  // 文章管理权限
  ARTICLE_READ: 'article:read',
  ARTICLE_WRITE: 'article:write',
  ARTICLE_DELETE: 'article:delete',
  
  // RSS源管理权限
  RSS_READ: 'rss:read',
  RSS_WRITE: 'rss:write',
  RSS_DELETE: 'rss:delete',
  
  // 搜索权限
  SEARCH_READ: 'search:read',
  
  // 系统管理权限
  SYSTEM_READ: 'system:read',
  SYSTEM_WRITE: 'system:write',
  
  // 角色管理权限
  ROLE_READ: 'role:read',
  ROLE_WRITE: 'role:write',
  ROLE_DELETE: 'role:delete',
  
  // 用户组管理权限
  GROUP_READ: 'group:read',
  GROUP_WRITE: 'group:write',
  GROUP_DELETE: 'group:delete',
} as const;

// 权限类别
export const PERMISSION_CATEGORIES = {
  USER_MANAGEMENT: [PERMISSIONS.USER_READ, PERMISSIONS.USER_WRITE, PERMISSIONS.USER_DELETE],
  ARTICLE_MANAGEMENT: [PERMISSIONS.ARTICLE_READ, PERMISSIONS.ARTICLE_WRITE, PERMISSIONS.ARTICLE_DELETE],
  RSS_MANAGEMENT: [PERMISSIONS.RSS_READ, PERMISSIONS.RSS_WRITE, PERMISSIONS.RSS_DELETE],
  SYSTEM_MANAGEMENT: [PERMISSIONS.SYSTEM_READ, PERMISSIONS.SYSTEM_WRITE],
  ROLE_MANAGEMENT: [PERMISSIONS.ROLE_READ, PERMISSIONS.ROLE_WRITE, PERMISSIONS.ROLE_DELETE],
  GROUP_MANAGEMENT: [PERMISSIONS.GROUP_READ, PERMISSIONS.GROUP_WRITE, PERMISSIONS.GROUP_DELETE],
} as const;

// 角色权限映射
export const ROLE_PERMISSIONS = {
  admin: [
    ...PERMISSION_CATEGORIES.USER_MANAGEMENT,
    ...PERMISSION_CATEGORIES.ARTICLE_MANAGEMENT,
    ...PERMISSION_CATEGORIES.RSS_MANAGEMENT,
    ...PERMISSION_CATEGORIES.SYSTEM_MANAGEMENT,
    ...PERMISSION_CATEGORIES.ROLE_MANAGEMENT,
    ...PERMISSION_CATEGORIES.GROUP_MANAGEMENT,
    PERMISSIONS.SEARCH_READ,
  ],
  editor: [
    PERMISSIONS.USER_READ,
    ...PERMISSION_CATEGORIES.ARTICLE_MANAGEMENT,
    ...PERMISSION_CATEGORIES.RSS_MANAGEMENT,
    PERMISSIONS.SEARCH_READ,
  ],
  user: [
    PERMISSIONS.ARTICLE_READ,
    PERMISSIONS.SEARCH_READ,
  ],
  guest: [
    PERMISSIONS.ARTICLE_READ,
  ],
} as const;

interface UsePermissionsOptions {
  userId?: number;
  permissions?: string[];
}

interface UsePermissionsReturn {
  permissions: string[];
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  canAccess: (requiredPermissions: string[]) => boolean;
  isLoading: boolean;
  error: string | null;
  refreshPermissions: () => Promise<void>;
}

export function usePermissions(options: UsePermissionsOptions = {}): UsePermissionsReturn {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPermissions = useCallback(async () => {
    if (!options.userId && !options.permissions) {
      setPermissions([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (options.permissions) {
        // 直接使用提供的权限
        setPermissions(options.permissions);
      } else if (options.userId) {
        // 从API获取用户权限
        const response = await userManagementApi.permissions.getUserPermissions(options.userId);
        setPermissions(response.data);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || '获取权限失败');
      setPermissions([]);
    } finally {
      setIsLoading(false);
    }
  }, [options.userId, options.permissions]);

  const hasPermission = useCallback((permission: string): boolean => {
    return permissions.includes(permission) || permissions.includes('*');
  }, [permissions]);

  const hasAnyPermission = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((requiredPermissions: string[]): boolean => {
    return requiredPermissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  const canAccess = useCallback((requiredPermissions: string[]): boolean => {
    return hasAnyPermission(requiredPermissions);
  }, [hasAnyPermission]);

  const refreshPermissions = useCallback(async () => {
    await loadPermissions();
  }, [loadPermissions]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccess,
    isLoading,
    error,
    refreshPermissions,
  };
}

// 基于角色的权限Hook
export function useRolePermissions(user: User | null): UsePermissionsReturn {
  const rolePermissions = user ? ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || [] : [];
  
  return usePermissions({
    permissions: rolePermissions,
  });
}

// 权限检查组件
interface PermissionGuardProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({ 
  permission, 
  permissions = [], 
  requireAll = false, 
  fallback = null, 
  children 
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();
  
  const requiredPermissions = permission ? [permission, ...permissions] : permissions;
  
  const hasAccess = requireAll 
    ? hasAllPermissions(requiredPermissions)
    : hasAnyPermission(requiredPermissions);
  
  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

// 权限检查Hook（用于组件内部）
export function usePermissionCheck(permission: string): boolean {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
}

// 批量权限检查Hook
export function usePermissionChecks(permissions: string[]): Record<string, boolean> {
  const { hasPermission } = usePermissions();
  
  return permissions.reduce((acc, permission) => {
    acc[permission] = hasPermission(permission);
    return acc;
  }, {} as Record<string, boolean>);
}

// 路由权限配置
export const ROUTE_PERMISSIONS = {
  '/settings/users': [PERMISSIONS.USER_READ],
  '/settings/users/create': [PERMISSIONS.USER_WRITE],
  '/settings/users/edit': [PERMISSIONS.USER_WRITE],
  '/settings/users/delete': [PERMISSIONS.USER_DELETE],
  '/settings/roles': [PERMISSIONS.ROLE_READ],
  '/settings/groups': [PERMISSIONS.GROUP_READ],
  '/settings/system': [PERMISSIONS.SYSTEM_READ],
  '/kb': [PERMISSIONS.ARTICLE_READ],
  '/kb/create': [PERMISSIONS.ARTICLE_WRITE],
  '/kb/edit': [PERMISSIONS.ARTICLE_WRITE],
  '/kb/delete': [PERMISSIONS.ARTICLE_DELETE],
  '/search': [PERMISSIONS.SEARCH_READ],
} as const;

// 路由权限检查Hook
export function useRoutePermission(route: string): boolean {
  const { canAccess } = usePermissions();
  const requiredPermissions = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS] || [];
  return canAccess(requiredPermissions);
}

// 权限工具函数
export const permissionUtils = {
  // 获取权限显示名称
  getPermissionName: (permission: string): string => {
    const permissionNames: Record<string, string> = {
      [PERMISSIONS.USER_READ]: '查看用户',
      [PERMISSIONS.USER_WRITE]: '管理用户',
      [PERMISSIONS.USER_DELETE]: '删除用户',
      [PERMISSIONS.ARTICLE_READ]: '查看文章',
      [PERMISSIONS.ARTICLE_WRITE]: '管理文章',
      [PERMISSIONS.ARTICLE_DELETE]: '删除文章',
      [PERMISSIONS.RSS_READ]: '查看RSS源',
      [PERMISSIONS.RSS_WRITE]: '管理RSS源',
      [PERMISSIONS.RSS_DELETE]: '删除RSS源',
      [PERMISSIONS.SEARCH_READ]: '执行搜索',
      [PERMISSIONS.SYSTEM_READ]: '查看系统信息',
      [PERMISSIONS.SYSTEM_WRITE]: '修改系统配置',
      [PERMISSIONS.ROLE_READ]: '查看角色',
      [PERMISSIONS.ROLE_WRITE]: '管理角色',
      [PERMISSIONS.ROLE_DELETE]: '删除角色',
      [PERMISSIONS.GROUP_READ]: '查看用户组',
      [PERMISSIONS.GROUP_WRITE]: '管理用户组',
      [PERMISSIONS.GROUP_DELETE]: '删除用户组',
    };
    return permissionNames[permission] || permission;
  },

  // 获取权限类别
  getPermissionCategory: (permission: string): string => {
    for (const [category, permissions] of Object.entries(PERMISSION_CATEGORIES)) {
      if (permissions.includes(permission as any)) {
        return category;
      }
    }
    return 'other';
  },

  // 检查是否为管理员权限
  isAdminPermission: (permission: string): boolean => {
    return PERMISSION_CATEGORIES.SYSTEM_MANAGEMENT.includes(permission as any) ||
           PERMISSION_CATEGORIES.ROLE_MANAGEMENT.includes(permission as any);
  },

  // 检查是否为编辑权限
  isEditorPermission: (permission: string): boolean => {
    return PERMISSION_CATEGORIES.ARTICLE_MANAGEMENT.includes(permission as any) ||
           PERMISSION_CATEGORIES.RSS_MANAGEMENT.includes(permission as any);
  },
};
