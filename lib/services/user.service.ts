import { createServiceClient } from '@/lib/supabase/service';
import { getRepository } from '@/lib/repositories/repository-manager';
import { User, UserRole } from '@/lib/types/database.types';
import { inviteUserSchema, InviteUserInput, UpdateUserInput } from '@/lib/validations/user.schema';

/**
 * Service class for user management operations
 * Handles business logic for user invitation, management, and onboarding
 */
export class UserService {
  private get userRepo() {
    return getRepository.users(true); // Use service role for admin operations
  }

  /**
   * Invites a new user to the system
   * Creates user in auth and adds record to users table
   * @param data - User invitation data
   * @returns Promise<User> - The created user record
   * @throws {Error} If invitation fails
   */
  async inviteUser(data: InviteUserInput): Promise<User> {
    // Validate input
    const validated = inviteUserSchema.parse(data);

    // Create user in Supabase Auth using service client
    const supabase = createServiceClient();
    
    const { data: authUser, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      validated.email,
      {
        data: {
          full_name: validated.full_name,
          role: validated.role,
          invited_by_admin: true,
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('54321', '3000')}/auth/accept-invitation`,
      }
    );

    if (authError || !authUser.user) {
      console.error('Auth invitation error:', authError);
      throw new Error(`Failed to invite user: ${authError?.message || 'Unknown error'}`);
    }

    // The user record will be automatically created by the handle_new_user trigger
    // So we just need to wait a moment and then fetch the created user
    try {
      // Give the trigger a moment to execute
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fetch the user that was created by the trigger
      const user = await this.userRepo.findByEmail(validated.email);
      
      if (!user) {
        throw new Error('User record was not created by the trigger');
      }
      
      console.log('User record created by trigger:', user);
      return user;
    } catch (error) {
      // If something went wrong, clean up the auth user
      console.error('Failed to retrieve user record after invitation:', error);
      
      try {
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log('Cleaned up auth user after trigger failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError);
      }
      
      throw new Error(`Failed to complete user invitation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Updates user information
   * @param userId - User ID to update
   * @param updates - Fields to update
   * @returns Promise<User> - Updated user
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update in our users table
    const updatedUser = await this.userRepo.update(userId, updates);

    // If role is being updated, also update auth metadata
    if (updates.role) {
      const supabase = createServiceClient();
      await supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          role: updates.role
        }
      });
    }

    return updatedUser;
  }

  /**
   * Completely deletes a user from both auth and database
   * @param userId - User ID to delete
   * @returns Promise<void>
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const supabase = createServiceClient();
    
    try {
      // Delete from auth schema first
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting from auth:', authError);
        throw new Error(`Failed to delete user from auth: ${authError.message}`);
      }

      // Delete from public users table
      const deleted = await this.userRepo.delete(userId);
      if (!deleted) {
        throw new Error('Failed to delete user from database');
      }

      console.log('User deleted successfully from both auth and database');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Reactivates a deactivated user
   * @param userId - User ID to reactivate
   * @returns Promise<void>
   */
  async reactivateUser(userId: string): Promise<void> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove ban from auth
    const supabase = createServiceClient();
    await supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none'
    });
  }

  /**
   * Gets all users with optional role filter
   * @param role - Optional role filter
   * @returns Promise<User[]> - List of users
   */
  async getUsers(role?: UserRole): Promise<User[]> {
    if (role) {
      return this.userRepo.findAll({ role });
    }
    return this.userRepo.findAll();
  }

  /**
   * Gets user statistics
   * @returns Promise<object> - User statistics
   */
  async getUserStatistics(): Promise<{
    total: number;
    by_role: Record<UserRole, number>;
  }> {
    const allUsers = await this.userRepo.findAll({});
    
    const stats = {
      total: allUsers.length,
      by_role: {
        admin: 0,
        manager: 0,
        technician: 0,
      } as Record<UserRole, number>,
    };

    allUsers.forEach(user => {
      stats.by_role[user.role]++;
    });

    return stats;
  }
}