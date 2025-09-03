import { UserRepository } from '../repositories/user.repository';
import { User, UserRole } from '../types/database.types';
import { createClient } from '../supabase/server';

// Permission definitions
export enum Permission {
  // Ticket permissions
  TICKET_VIEW = 'ticket:view',
  TICKET_CREATE = 'ticket:create',
  TICKET_UPDATE = 'ticket:update',
  TICKET_DELETE = 'ticket:delete',
  TICKET_ASSIGN = 'ticket:assign',
  TICKET_CHANGE_STATUS = 'ticket:change_status',
  
  // Customer permissions
  CUSTOMER_VIEW = 'customer:view',
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  CUSTOMER_EXPORT = 'customer:export',
  
  // Timer permissions
  TIMER_START = 'timer:start',
  TIMER_STOP = 'timer:stop',
  TIMER_VIEW_ALL = 'timer:view_all',
  TIMER_EDIT = 'timer:edit',
  
  // Notification permissions
  NOTIFICATION_VIEW = 'notification:view',
  NOTIFICATION_SEND = 'notification:send',
  NOTIFICATION_MANAGE = 'notification:manage',
  
  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_GENERATE = 'report:generate',
  REPORT_EXPORT = 'report:export',
  REPORT_FINANCIAL = 'report:financial',
  
  // User management permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_CHANGE_ROLE = 'user:change_role',
  
  // System permissions
  SYSTEM_SETTINGS = 'system:settings',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_LOGS = 'system:logs',
  API_KEY_MANAGE = 'api:key_manage',
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    // Admin has all permissions
    ...Object.values(Permission)
  ],
  manager: [
    // Manager permissions
    Permission.TICKET_VIEW,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.TICKET_ASSIGN,
    Permission.TICKET_CHANGE_STATUS,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.CUSTOMER_EXPORT,
    Permission.TIMER_VIEW_ALL,
    Permission.TIMER_EDIT,
    Permission.NOTIFICATION_VIEW,
    Permission.NOTIFICATION_SEND,
    Permission.NOTIFICATION_MANAGE,
    Permission.REPORT_VIEW,
    Permission.REPORT_GENERATE,
    Permission.REPORT_EXPORT,
    Permission.REPORT_FINANCIAL,
    Permission.USER_VIEW,
    Permission.SYSTEM_SETTINGS,
  ],
  technician: [
    // Technician permissions
    Permission.TICKET_VIEW,
    Permission.TICKET_CREATE,
    Permission.TICKET_UPDATE,
    Permission.TICKET_CHANGE_STATUS,
    Permission.CUSTOMER_VIEW,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_UPDATE,
    Permission.TIMER_START,
    Permission.TIMER_STOP,
    Permission.NOTIFICATION_VIEW,
    Permission.REPORT_VIEW,
  ]
};

// Resource-based permissions
interface ResourcePermission {
  resource: string;
  resourceId?: string;
  permission: Permission;
  condition?: (user: User, resource: any) => boolean;
}

export class AuthorizationService {
  private userRepo: UserRepository;
  private static permissionCache = new Map<string, Set<Permission>>();

  constructor(useServiceRole = false) {
    this.userRepo = new UserRepository(useServiceRole);
  }

  /**
   * Check if user has a specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission
  ): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user || !user.role) {
      return false;
    }

    const permissions = this.getRolePermissions(user.role);
    return permissions.has(permission);
  }

  /**
   * Check multiple permissions (user must have all)
   */
  async hasAllPermissions(
    userId: string,
    permissions: Permission[]
  ): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user || !user.role) {
      return false;
    }

    const userPermissions = this.getRolePermissions(user.role);
    return permissions.every(p => userPermissions.has(p));
  }

  /**
   * Check multiple permissions (user must have at least one)
   */
  async hasAnyPermission(
    userId: string,
    permissions: Permission[]
  ): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user || !user.role) {
      return false;
    }

    const userPermissions = this.getRolePermissions(user.role);
    return permissions.some(p => userPermissions.has(p));
  }

  /**
   * Check if user can perform action on a specific resource
   */
  async canAccessResource(
    userId: string,
    resource: string,
    action: string,
    resourceData?: any
  ): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    if (!user || !user.role) {
      return false;
    }

    // Admin can access everything
    if (user.role === 'admin') {
      return true;
    }

    // Check resource-specific rules
    switch (resource) {
      case 'ticket':
        return this.canAccessTicket(user, action, resourceData);
      case 'customer':
        return this.canAccessCustomer(user, action, resourceData);
      case 'timer':
        return this.canAccessTimer(user, action, resourceData);
      case 'report':
        return this.canAccessReport(user, action);
      case 'user':
        return this.canAccessUser(user, action, resourceData);
      default:
        return false;
    }
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.getUserWithRole(userId);
    if (!user || !user.role) {
      return [];
    }

    return Array.from(this.getRolePermissions(user.role));
  }

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    return user?.role === 'admin';
  }

  /**
   * Check if user is manager or admin
   */
  async isManagerOrAbove(userId: string): Promise<boolean> {
    const user = await this.getUserWithRole(userId);
    return user?.role === 'admin' || user?.role === 'manager';
  }

  /**
   * Validate API key and get associated permissions
   */
  async validateApiKey(apiKey: string): Promise<{
    valid: boolean;
    permissions?: Permission[];
    scope?: string;
  }> {
    // In production, this would check against a database table of API keys
    // For now, we'll use a simple check
    
    if (apiKey === process.env.EXTERNAL_API_KEY) {
      // External API key for Astro website - limited permissions
      return {
        valid: true,
        permissions: [
          Permission.TICKET_CREATE,
          Permission.CUSTOMER_CREATE,
          Permission.CUSTOMER_VIEW
        ],
        scope: 'external'
      };
    }

    if (apiKey === process.env.INTERNAL_API_KEY) {
      // Internal API key - full permissions
      return {
        valid: true,
        permissions: Object.values(Permission),
        scope: 'internal'
      };
    }

    return { valid: false };
  }

  /**
   * Filter data based on user permissions
   */
  async filterDataByPermissions<T>(
    userId: string,
    data: T[],
    resource: string,
    getResourceId: (item: T) => string
  ): Promise<T[]> {
    const user = await this.getUserWithRole(userId);
    if (!user) {
      return [];
    }

    // Admin sees everything
    if (user.role === 'admin') {
      return data;
    }

    // Filter based on resource type and user role
    return data.filter(item => {
      const resourceId = getResourceId(item);
      return this.canViewResource(user, resource, resourceId, item);
    });
  }

  /**
   * Get role hierarchy level (for comparison)
   */
  getRoleLevel(role: UserRole): number {
    const levels: Record<UserRole, number> = {
      admin: 3,
      manager: 2,
      technician: 1
    };
    return levels[role] || 0;
  }

  /**
   * Check if user can modify another user
   */
  async canModifyUser(
    actingUserId: string,
    targetUserId: string
  ): Promise<boolean> {
    if (actingUserId === targetUserId) {
      return true; // Users can modify themselves
    }

    const [actingUser, targetUser] = await Promise.all([
      this.getUserWithRole(actingUserId),
      this.getUserWithRole(targetUserId)
    ]);

    if (!actingUser || !targetUser) {
      return false;
    }

    // Check role hierarchy
    const actingLevel = this.getRoleLevel(actingUser.role!);
    const targetLevel = this.getRoleLevel(targetUser.role!);

    // Can only modify users with lower role level
    return actingLevel > targetLevel;
  }

  /**
   * Create authorization context for request
   */
  async createAuthContext(userId: string): Promise<{
    userId: string;
    role: UserRole | null;
    permissions: Set<Permission>;
    isAdmin: boolean;
    isManager: boolean;
  }> {
    const user = await this.getUserWithRole(userId);
    const role = user?.role || null;
    const permissions = role ? this.getRolePermissions(role) : new Set<Permission>();

    return {
      userId,
      role,
      permissions,
      isAdmin: role === 'admin',
      isManager: role === 'manager'
    };
  }

  // Private helper methods

  private async getUserWithRole(userId: string): Promise<User | null> {
    try {
      return await this.userRepo.findById(userId);
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  }

  private getRolePermissions(role: UserRole): Set<Permission> {
    const cacheKey = role;
    
    if (!AuthorizationService.permissionCache.has(cacheKey)) {
      const permissions = new Set(ROLE_PERMISSIONS[role] || []);
      AuthorizationService.permissionCache.set(cacheKey, permissions);
    }

    return AuthorizationService.permissionCache.get(cacheKey)!;
  }

  private canAccessTicket(
    user: User,
    action: string,
    ticket?: any
  ): boolean {
    const role = user.role!;
    
    switch (action) {
      case 'view':
        return true; // All roles can view tickets
      case 'create':
        return true; // All roles can create tickets
      case 'update':
        if (role === 'technician') {
          // Technicians can only update tickets assigned to them
          return ticket?.assigned_to === user.id;
        }
        return true; // Managers can update any ticket
      case 'delete':
        return role === 'manager'; // Only managers and above can delete
      case 'assign':
        return role === 'manager'; // Only managers can assign
      default:
        return false;
    }
  }

  private canAccessCustomer(
    user: User,
    action: string,
    customer?: any
  ): boolean {
    const role = user.role!;
    
    switch (action) {
      case 'view':
        return true; // All roles can view customers
      case 'create':
        return true; // All roles can create customers
      case 'update':
        return true; // All roles can update customers
      case 'delete':
        return role === 'manager'; // Only managers and above
      case 'export':
        return role === 'manager'; // Only managers and above
      default:
        return false;
    }
  }

  private canAccessTimer(
    user: User,
    action: string,
    timer?: any
  ): boolean {
    const role = user.role!;
    
    switch (action) {
      case 'start':
      case 'stop':
        // Users can only control their own timers
        return !timer || timer.user_id === user.id;
      case 'view':
        // Technicians see own, managers see all
        if (role === 'technician') {
          return timer?.user_id === user.id;
        }
        return true;
      case 'edit':
        return role === 'manager'; // Only managers can edit time entries
      default:
        return false;
    }
  }

  private canAccessReport(
    user: User,
    action: string
  ): boolean {
    const role = user.role!;
    
    switch (action) {
      case 'view':
        return true; // All can view basic reports
      case 'generate':
        return role !== 'technician'; // Managers and above
      case 'export':
        return role !== 'technician'; // Managers and above
      case 'financial':
        return role === 'manager'; // Only managers and above see financial
      default:
        return false;
    }
  }

  private canAccessUser(
    user: User,
    action: string,
    targetUser?: any
  ): boolean {
    const role = user.role!;
    
    switch (action) {
      case 'view':
        return true; // All can view user list
      case 'create':
      case 'update':
      case 'delete':
      case 'change_role':
        return role === 'manager' || role === 'admin'; // Managers and above
      default:
        return false;
    }
  }

  private canViewResource(
    user: User,
    resource: string,
    resourceId: string,
    resourceData: any
  ): boolean {
    // Implement resource-specific view logic
    const role = user.role!;
    
    if (role === 'admin' || role === 'manager') {
      return true; // Managers and admins can view everything
    }

    // Technicians have limited view
    switch (resource) {
      case 'ticket':
        // Can view if assigned to them or created by them
        return resourceData.assigned_to === user.id || 
               resourceData.created_by === user.id;
      case 'timer':
        // Can only view own timers
        return resourceData.user_id === user.id;
      default:
        return true; // Default to allowing view
    }
  }

  /**
   * Log authorization attempt for audit
   */
  private async logAuthorizationAttempt(
    userId: string,
    permission: Permission,
    allowed: boolean,
    resource?: string,
    resourceId?: string
  ): Promise<void> {
    // In production, this would write to an audit log
    console.log('Authorization attempt:', {
      userId,
      permission,
      allowed,
      resource,
      resourceId,
      timestamp: new Date().toISOString()
    });
  }
}