/**
 * Public Repository Manager - For Public API Endpoints
 * 
 * This manager provides repository instances that use the public Supabase client
 * without any cookie-based authentication, ensuring proper anon role access.
 */

import { CustomerRepository } from './customer.repository';
import { CustomerDeviceRepository } from './customer-device.repository';
import { AppointmentRepository } from './appointment.repository';
import { FormSubmissionRepository } from './form-submission.repository';
import { createPublicClient } from '@/lib/supabase/public';

// Create singleton instances with public client
let publicClient: ReturnType<typeof createPublicClient> | null = null;

function getPublicClient() {
  if (!publicClient) {
    publicClient = createPublicClient();
  }
  return publicClient;
}

/**
 * Get repository instances for public API endpoints
 * These use the anon key without any authentication
 */
export const getPublicRepository = {
  customers: () => {
    const repo = new CustomerRepository(false);
    // Override the getClient method to use public client
    (repo as any).getClient = async () => getPublicClient();
    return repo;
  },
  
  customerDevices: () => {
    const repo = new CustomerDeviceRepository(false);
    (repo as any).getClient = async () => getPublicClient();
    return repo;
  },
  
  appointments: () => {
    const repo = new AppointmentRepository(false);
    (repo as any).getClient = async () => getPublicClient();
    return repo;
  },
  
  formSubmissions: () => {
    const repo = new FormSubmissionRepository(false);
    (repo as any).getClient = async () => getPublicClient();
    return repo;
  }
};