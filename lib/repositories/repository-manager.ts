/**
 * Repository Manager - Server-Side Only
 * 
 * This singleton manager ensures repository instances are reused across requests
 * to improve performance and reduce memory overhead.
 * 
 * SECURITY: This must only be used in server-side code (API routes, server components).
 * Never import this in client components or browser code.
 */

import { BaseRepository } from './base.repository';

// Ensure this is only used server-side
if (typeof window !== 'undefined') {
  throw new Error(
    'RepositoryManager is server-side only and cannot be used in client components. ' +
    'This is a security measure to prevent service role key exposure.'
  );
}

type RepositoryConstructor<T extends BaseRepository<any>> = {
  new (useServiceRole?: boolean): T;
};

interface RepositoryInstance {
  instance: BaseRepository<any>;
  lastAccessed: number;
  useServiceRole: boolean;
}

/**
 * Singleton manager for repository instances
 * Implements instance pooling and automatic cleanup of stale instances
 */
export class RepositoryManager {
  private static instances = new Map<string, RepositoryInstance>();
  private static readonly INSTANCE_TTL = 5 * 60 * 1000; // 5 minutes TTL
  private static cleanupInterval: NodeJS.Timeout | null = null;

  /**
   * Get or create a repository instance
   * @param RepoClass The repository class to instantiate
   * @param useServiceRole Whether to use service role (defaults to false)
   * @returns The repository instance
   */
  static get<T extends BaseRepository<any>>(
    RepoClass: RepositoryConstructor<T>,
    useServiceRole = false
  ): T {
    // Create a unique key for this repository + role combination
    const key = `${RepoClass.name}-${useServiceRole}`;
    
    const now = Date.now();
    const existing = this.instances.get(key);

    // Return existing instance if it's still fresh
    if (existing && (now - existing.lastAccessed) < this.INSTANCE_TTL) {
      existing.lastAccessed = now;
      return existing.instance as T;
    }

    // Create new instance
    const instance = new RepoClass(useServiceRole);
    this.instances.set(key, {
      instance,
      lastAccessed: now,
      useServiceRole
    });

    // Start cleanup interval if not already running
    this.startCleanupInterval();

    return instance as T;
  }

  /**
   * Clear a specific repository instance
   * Useful for testing or manual cache invalidation
   */
  static clear<T extends BaseRepository<any>>(
    RepoClass: RepositoryConstructor<T>,
    useServiceRole = false
  ): void {
    const key = `${RepoClass.name}-${useServiceRole}`;
    this.instances.delete(key);
  }

  /**
   * Clear all repository instances
   * Useful for testing or complete cache invalidation
   */
  static clearAll(): void {
    this.instances.clear();
  }

  /**
   * Get current instance count
   * Useful for monitoring and debugging
   */
  static getInstanceCount(): number {
    return this.instances.size;
  }

  /**
   * Get instance statistics
   * Useful for monitoring repository usage patterns
   */
  static getStats(): {
    totalInstances: number;
    instances: Array<{
      name: string;
      useServiceRole: boolean;
      lastAccessed: Date;
      age: number;
    }>;
  } {
    const now = Date.now();
    const instances = Array.from(this.instances.entries()).map(([key, value]) => {
      const [name] = key.split('-');
      return {
        name,
        useServiceRole: value.useServiceRole,
        lastAccessed: new Date(value.lastAccessed),
        age: now - value.lastAccessed
      };
    });

    return {
      totalInstances: this.instances.size,
      instances
    };
  }

  /**
   * Start the cleanup interval to remove stale instances
   */
  private static startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);

    // Ensure cleanup interval doesn't prevent process termination
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up stale repository instances
   */
  private static cleanup(): void {
    const now = Date.now();
    const staleKeys: string[] = [];

    // Find stale instances
    this.instances.forEach((instance, key) => {
      if (now - instance.lastAccessed > this.INSTANCE_TTL) {
        staleKeys.push(key);
      }
    });

    // Remove stale instances
    staleKeys.forEach(key => {
      this.instances.delete(key);
      console.log(`[RepositoryManager] Cleaned up stale instance: ${key}`);
    });

    // Stop cleanup interval if no instances remain
    if (this.instances.size === 0 && this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Graceful shutdown - clear all instances and stop cleanup
   */
  static shutdown(): void {
    this.clearAll();
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Export convenience functions for common repositories
import { RepairTicketRepository } from './repair-ticket.repository';
import { CustomerRepository } from './customer.repository';
import { UserRepository } from './user.repository';
import { DeviceRepository } from './device.repository';
import { AppointmentRepository } from './appointment.repository';
import { TicketNoteRepository } from './ticket-note.repository';
import { ServiceRepository } from './service.repository';
import { CustomerDeviceRepository } from './customer-device.repository';
import { AvailabilityRepository } from './availability.repository';
import { FormSubmissionRepository } from './form-submission.repository';

/**
 * Convenience function to get commonly used repositories
 * This provides better type inference and IDE support
 */
export const getRepository = {
  tickets: (useServiceRole = false) => 
    RepositoryManager.get(RepairTicketRepository, useServiceRole),
  
  customers: (useServiceRole = false) => 
    RepositoryManager.get(CustomerRepository, useServiceRole),
  
  users: (useServiceRole = false) => 
    RepositoryManager.get(UserRepository, useServiceRole),
  
  devices: (useServiceRole = false) => 
    RepositoryManager.get(DeviceRepository, useServiceRole),
  
  appointments: (useServiceRole = false) => 
    RepositoryManager.get(AppointmentRepository, useServiceRole),
  
  notes: (useServiceRole = false) => 
    RepositoryManager.get(TicketNoteRepository, useServiceRole),
  
  services: (useServiceRole = false) => 
    RepositoryManager.get(ServiceRepository, useServiceRole),
  
  customerDevices: (useServiceRole = false) => 
    RepositoryManager.get(CustomerDeviceRepository, useServiceRole),
  
  availability: (useServiceRole = false) => 
    RepositoryManager.get(AvailabilityRepository, useServiceRole),
  
  formSubmissions: (useServiceRole = false) => 
    RepositoryManager.get(FormSubmissionRepository, useServiceRole),
};