import { BaseRepository } from './base.repository';
import { Database } from '@/lib/types/database.types';

type FormSubmission = Database['public']['Tables']['form_submissions']['Row'];
type FormSubmissionInsert = Database['public']['Tables']['form_submissions']['Insert'];
type FormSubmissionUpdate = Database['public']['Tables']['form_submissions']['Update'];

export class FormSubmissionRepository extends BaseRepository<FormSubmission> {
  constructor(useServiceRole = false) {
    super('form_submissions', useServiceRole);
  }

  /**
   * Create a new form submission record
   */
  async create(data: FormSubmissionInsert): Promise<FormSubmission> {
    const submission = await super.create({
      ...data,
      created_at: data.created_at || new Date().toISOString()
    });
    
    return submission;
  }

  /**
   * Find submissions by email
   */
  async findByEmail(email: string): Promise<FormSubmission[]> {
    return this.findMany({ customer_email: email });
  }

  /**
   * Find submissions by status
   */
  async findByStatus(status: string): Promise<FormSubmission[]> {
    return this.findMany({ status });
  }

  /**
   * Get pending submissions
   */
  async getPendingSubmissions(): Promise<FormSubmission[]> {
    return this.findByStatus('pending');
  }

  /**
   * Update submission status
   */
  async updateStatus(id: string, status: string, appointmentId?: string): Promise<FormSubmission | null> {
    const updateData: FormSubmissionUpdate = {
      status,
      processed_at: new Date().toISOString()
    };

    if (appointmentId) {
      updateData.appointment_id = appointmentId;
    }

    return this.update(id, updateData);
  }

  /**
   * Get recent submissions
   */
  async getRecentSubmissions(limit: number = 10): Promise<FormSubmission[]> {
    const client = await this.getClient();
    const query = client
      .from(this.table)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    return this.handleResponse(query);
  }

  /**
   * Get submissions by form type
   */
  async getByFormType(formType: string): Promise<FormSubmission[]> {
    return this.findMany({ form_type: formType });
  }

  /**
   * Get submissions within date range
   */
  async getByDateRange(startDate: string, endDate: string): Promise<FormSubmission[]> {
    const client = await this.getClient();
    const query = client
      .from(this.table)
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    return this.handleResponse(query);
  }
}