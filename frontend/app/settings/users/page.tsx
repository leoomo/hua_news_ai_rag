'use client';
import { useEffect, useState } from 'react';
import { Plus, Users, Settings, Activity, Shield } from 'lucide-react';
import { userManagementApi } from '@/lib/api';
import { useNotification, NotificationContainer } from '@/components/Notification';
import UserTable from '@/components/UserManagement/UserTable';
import UserForm from '@/components/UserManagement/UserForm';
import RoleTable from '@/components/UserManagement/RoleTable';
import RoleForm from '@/components/UserManagement/RoleForm';
import GroupTable from '@/components/UserManagement/GroupTable';
import GroupForm from '@/components/UserManagement/GroupForm';
import PreferenceTable from '@/components/UserManagement/PreferenceTable';
import PreferenceForm from '@/components/UserManagement/PreferenceForm';
import ActivityTable from '@/components/UserManagement/ActivityTable';
import SessionTable from '@/components/UserManagement/SessionTable';
import type { 
  User, UserFormData, UserQueryParams, UserStats, 
  UserRole, UserRoleFormData, UserGroup, UserGroupFormData, UserActivityLog, UserSession, 
  UserPreference, UserPreferenceFormData
} from '@/lib/user-management-types';

type TabType = 'users' | 'roles' | 'groups' | 'preferences' | 'activity' | 'sessions';

export default function UsersSettingsPage() {
  const { showSuccess, showError, notifications } = useNotification();
  
  // 状态管理
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState(false);
  
  // 数据状态
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  
  // 分页和筛选
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<UserQueryParams>({});
  
  // 角色管理状态
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [roleLoading, setRoleLoading] = useState(false);
  
  // 用户组管理状态
  const [groupFormOpen, setGroupFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  
  // 偏好设置管理状态
  const [preferenceFormOpen, setPreferenceFormOpen] = useState(false);
  const [editingPreference, setEditingPreference] = useState<UserPreference | null>(null);
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  
  // 用户管理状态
  const [userFormOpen, setUserFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  // 加载数据
  const loadUsers = async (params?: UserQueryParams) => {
    try {
      setLoading(true);
      const response = await userManagementApi.users.list({
        page: currentPage,
        limit: 20,
        ...params
      });
      setUsers(response.data.data?.items || []);
      setTotalPages(response.data.data?.total_pages || 1);
    } catch (error: any) {
      console.error('加载用户列表失败:', error);
      setUsers([]);
      setTotalPages(1);
      showError('加载用户列表失败', error?.response?.data?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await userManagementApi.users.getStats();
      setUserStats(response.data);
    } catch (error: any) {
      console.error('加载用户统计失败:', error);
      setUserStats(null);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await userManagementApi.roles.list();
      setRoles(response.data.data || []);
    } catch (error: any) {
      console.error('加载角色列表失败:', error);
      setRoles([]);
    }
  };

  const loadGroups = async () => {
    try {
      const response = await userManagementApi.groups.list();
      setGroups(response.data.data || []);
    } catch (error: any) {
      console.error('加载用户组列表失败:', error);
      setGroups([]);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await userManagementApi.preferences.list();
      setPreferences(response.data || []);
    } catch (error: any) {
      console.error('加载偏好设置列表失败:', error);
      setPreferences([]);
    }
  };

  const loadActivities = async () => {
    try {
      const response = await userManagementApi.activityLogs.list();
      setActivities(response.data.data?.items || []);
    } catch (error: any) {
      console.error('加载活动日志列表失败:', error);
      setActivities([]);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await userManagementApi.sessions.list();
      setSessions(response.data || []);
    } catch (error: any) {
      console.error('加载会话列表失败:', error);
      setSessions([]);
    }
  };

  // 用户管理函数
  const handleCreateUser = () => {
    setEditingUser(null);
    setUserFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserFormOpen(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      return;
    }

    try {
      setUserLoading(true);
      await userManagementApi.users.delete(userId);
      showSuccess('删除成功', '用户已删除');
      loadUsers();
    } catch (error: any) {
      showError('删除失败', error?.response?.data?.message || '未知错误');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserSubmit = async (data: UserFormData) => {
    try {
      setUserLoading(true);
      if (editingUser) {
        await userManagementApi.users.update(editingUser.id, data);
        showSuccess('更新成功', '用户信息已更新');
      } else {
        await userManagementApi.users.create(data);
        showSuccess('创建成功', '新用户已创建');
      }
      setUserFormOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      showError(
        editingUser ? '更新失败' : '创建失败',
        error?.response?.data?.message || '未知错误'
      );
    } finally {
      setUserLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    // 暂时只是显示用户信息，可以后续扩展为详细页面
    alert(`用户详情：\n姓名：${user.full_name || user.username}\n邮箱：${user.email}\n角色：${user.role}\n状态：${user.is_active ? '激活' : '禁用'}`);
  };

  // 角色管理函数
  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleFormOpen(true);
  };

  const handleEditRole = (role: UserRole) => {
    setEditingRole(role);
    setRoleFormOpen(true);
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('确定要删除这个角色吗？此操作不可撤销。')) {
      return;
    }

    try {
      setRoleLoading(true);
      await userManagementApi.roles.delete(roleId);
      showSuccess('角色删除成功');
      loadRoles();
    } catch (error: any) {
      showError('删除角色失败', error?.response?.data?.message || '未知错误');
    } finally {
      setRoleLoading(false);
    }
  };

  const handleViewPermissions = (role: UserRole) => {
    // 可以打开一个模态框显示权限详情
    const permissions = role.permissions ? JSON.parse(role.permissions) : [];
    alert(`角色 "${role.display_name}" 的权限：\n${permissions.join('\n')}`);
  };

  const handleRoleSubmit = async (data: UserRoleFormData) => {
    try {
      setRoleLoading(true);
      
      if (editingRole) {
        // 更新角色
        await userManagementApi.roles.update(editingRole.id, data);
        showSuccess('角色更新成功');
      } else {
        // 创建角色
        await userManagementApi.roles.create(data);
        showSuccess('角色创建成功');
      }
      
      setRoleFormOpen(false);
      setEditingRole(null);
      loadRoles();
    } catch (error: any) {
      showError(
        editingRole ? '更新角色失败' : '创建角色失败', 
        error?.response?.data?.message || '未知错误'
      );
    } finally {
      setRoleLoading(false);
    }
  };

  // 用户组管理函数
  const handleCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormOpen(true);
  };

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group);
    setGroupFormOpen(true);
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('确定要删除这个用户组吗？此操作会同时移除所有成员关系，且不可撤销。')) {
      return;
    }

    try {
      setGroupLoading(true);
      await userManagementApi.groups.delete(groupId);
      showSuccess('用户组删除成功');
      loadGroups();
    } catch (error: any) {
      showError('删除用户组失败', error?.response?.data?.message || '未知错误');
    } finally {
      setGroupLoading(false);
    }
  };

  const handleManageMembers = (group: UserGroup) => {
    // TODO: 实现成员管理功能
    alert(`管理用户组 "${group.name}" 的成员功能开发中...`);
  };

  const handleViewGroupDetails = (group: UserGroup) => {
    // TODO: 实现查看详情功能
    alert(`用户组 "${group.name}" 的详细信息功能开发中...`);
  };

  const handleGroupSubmit = async (data: UserGroupFormData) => {
    try {
      setGroupLoading(true);
      
      if (editingGroup) {
        // 更新用户组
        await userManagementApi.groups.update(editingGroup.id, data);
        showSuccess('用户组更新成功');
      } else {
        // 创建用户组
        await userManagementApi.groups.create(data);
        showSuccess('用户组创建成功');
      }
      
      setGroupFormOpen(false);
      setEditingGroup(null);
      loadGroups();
    } catch (error: any) {
      showError(
        editingGroup ? '更新用户组失败' : '创建用户组失败', 
        error?.response?.data?.message || '未知错误'
      );
    } finally {
      setGroupLoading(false);
    }
  };

  // 偏好设置管理函数
  const handleCreatePreference = () => {
    setEditingPreference(null);
    setPreferenceFormOpen(true);
  };

  const handleEditPreference = (preference: UserPreference) => {
    setEditingPreference(preference);
    setPreferenceFormOpen(true);
  };

  const handleDeletePreference = async (preferenceId: number) => {
    if (!confirm('确定要删除这个偏好设置吗？此操作不可撤销。')) {
      return;
    }

    try {
      setPreferenceLoading(true);
      await userManagementApi.preferences.delete(preferenceId);
      showSuccess('偏好设置删除成功');
      loadPreferences();
    } catch (error: any) {
      showError('删除偏好设置失败', error?.response?.data?.message || '未知错误');
    } finally {
      setPreferenceLoading(false);
    }
  };

  const handleViewPreferenceDetails = (preference: UserPreference) => {
    // TODO: 实现查看详情功能
    alert(`偏好设置 "${preference.preference_key}" 的详细信息功能开发中...`);
  };

  const handlePreferenceSubmit = async (data: UserPreferenceFormData) => {
    try {
      setPreferenceLoading(true);
      
      if (editingPreference) {
        // 更新偏好设置
        await userManagementApi.preferences.update(editingPreference.id, data);
        showSuccess('偏好设置更新成功');
      } else {
        // 创建偏好设置
        await userManagementApi.preferences.create(data);
        showSuccess('偏好设置创建成功');
      }
      
      setPreferenceFormOpen(false);
      setEditingPreference(null);
      loadPreferences();
    } catch (error: any) {
      showError(
        editingPreference ? '更新偏好设置失败' : '创建偏好设置失败', 
        error?.response?.data?.message || '未知错误'
      );
    } finally {
      setPreferenceLoading(false);
    }
  };

  // 活动日志管理函数
  const handleViewActivityDetails = (activity: UserActivityLog) => {
    // TODO: 实现查看详情功能
    alert(`活动日志 "${activity.action}" 的详细信息功能开发中...`);
  };

  const handleActivityFilter = (filters: any) => {
    // TODO: 实现筛选功能
    console.log('活动日志筛选:', filters);
  };

  // 会话管理函数
  const handleViewSessionDetails = (session: UserSession) => {
    // TODO: 实现查看详情功能
    alert(`会话 "${session.id}" 的详细信息功能开发中...`);
  };

  const handleRevokeSession = async (sessionId: number) => {
    if (!confirm('确定要撤销这个会话吗？用户将需要重新登录。')) {
      return;
    }

    try {
      setLoading(true);
      await userManagementApi.sessions.revoke(sessionId);
      showSuccess('会话撤销成功');
      loadSessions();
    } catch (error: any) {
      showError('撤销会话失败', error?.response?.data?.message || '未知错误');
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载
  useEffect(() => {
    loadUsers(filters);
    loadUserStats();
    loadRoles();
    loadGroups();
    loadPreferences();
    loadActivities();
    loadSessions();
  }, [currentPage]);

  // 标签页配置
  const tabs = [
    { id: 'users' as TabType, label: '用户管理', icon: Users },
    { id: 'roles' as TabType, label: '角色权限', icon: Shield },
    { id: 'groups' as TabType, label: '用户组', icon: Users },
    { id: 'preferences' as TabType, label: '偏好设置', icon: Settings },
    { id: 'activity' as TabType, label: '活动日志', icon: Activity },
    { id: 'sessions' as TabType, label: '会话管理', icon: Shield }
  ];

  return (
    <>
      <NotificationContainer notifications={notifications} />
      
      <main className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">用户管理</h1>
            <p className="text-gray-600 mt-1">管理系统用户、角色权限和用户组</p>
          </div>
          {activeTab === 'users' && (
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建用户</span>
            </button>
          )}
          {activeTab === 'roles' && (
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建角色</span>
            </button>
          )}
          {activeTab === 'groups' && (
            <button
              onClick={handleCreateGroup}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建用户组</span>
            </button>
          )}
          {activeTab === 'preferences' && (
            <button
              onClick={handleCreatePreference}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>创建偏好设置</span>
            </button>
          )}
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* 用户管理标签页 */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* 统计卡片 */}
            {userStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">总用户数</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.total_users}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">活跃用户</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.active_users}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50 text-green-600">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">最近活动</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.recent_activity}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                      <Activity className="w-6 h-6" />
                    </div>
        </div>
      </div>

                <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">登录失败</p>
                      <p className="text-2xl font-bold text-gray-900">{userStats.failed_logins}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50 text-red-600">
                      <Shield className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 用户列表 */}
            <UserTable
              users={users}
              onEdit={handleEditUser}
              onDelete={handleDeleteUser}
              onView={handleViewUser}
              loading={loading}
            />
          </div>
        )}

        {/* 角色管理标签页 */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <RoleTable
              roles={roles}
              loading={loading}
              onEdit={handleEditRole}
              onDelete={handleDeleteRole}
              onViewPermissions={handleViewPermissions}
            />
          </div>
        )}

        {/* 用户组管理标签页 */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <GroupTable
              groups={groups}
              loading={loading}
              onEdit={handleEditGroup}
              onDelete={handleDeleteGroup}
              onManageMembers={handleManageMembers}
              onViewDetails={handleViewGroupDetails}
            />
          </div>
        )}

        {/* 偏好设置管理标签页 */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <PreferenceTable
              preferences={preferences}
              loading={loading}
              onEdit={handleEditPreference}
              onDelete={handleDeletePreference}
              onViewDetails={handleViewPreferenceDetails}
            />
          </div>
        )}

        {/* 活动日志管理标签页 */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            <ActivityTable
              activities={activities}
              loading={loading}
              onViewDetails={handleViewActivityDetails}
              onFilter={handleActivityFilter}
            />
          </div>
        )}

        {/* 会话管理标签页 */}
        {activeTab === 'sessions' && (
          <div className="space-y-6">
            <SessionTable
              sessions={sessions}
              loading={loading}
              onViewDetails={handleViewSessionDetails}
              onRevokeSession={handleRevokeSession}
            />
                    </div>
                  )}

        {/* 其他标签页内容 */}
        {activeTab !== 'users' && activeTab !== 'roles' && activeTab !== 'groups' && activeTab !== 'preferences' && activeTab !== 'activity' && activeTab !== 'sessions' && (
          <div className="rounded-xl border border-gray-200 bg-white/90 backdrop-blur-sm p-8 shadow-sm">
            <div className="text-center text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>{tabs.find(tab => tab.id === activeTab)?.label} 功能开发中...</p>
            </div>
      </div>
        )}

        {/* 角色表单模态框 */}
        <RoleForm
          role={editingRole}
          isOpen={roleFormOpen}
          onClose={() => {
            setRoleFormOpen(false);
            setEditingRole(null);
          }}
          onSubmit={handleRoleSubmit}
          loading={roleLoading}
        />

        {/* 用户组表单模态框 */}
        <GroupForm
          group={editingGroup}
          isOpen={groupFormOpen}
          onClose={() => {
            setGroupFormOpen(false);
            setEditingGroup(null);
          }}
          onSubmit={handleGroupSubmit}
          loading={groupLoading}
        />

        {/* 用户表单模态框 */}
        <UserForm
          user={editingUser}
          isOpen={userFormOpen}
          onClose={() => {
            setUserFormOpen(false);
            setEditingUser(null);
          }}
          onSubmit={handleUserSubmit}
          loading={userLoading}
        />

        {/* 偏好设置表单模态框 */}
        <PreferenceForm
          preference={editingPreference}
          isOpen={preferenceFormOpen}
          onClose={() => {
            setPreferenceFormOpen(false);
            setEditingPreference(null);
          }}
          onSubmit={handlePreferenceSubmit}
          loading={preferenceLoading}
        />
    </main>
    </>
  );
}

