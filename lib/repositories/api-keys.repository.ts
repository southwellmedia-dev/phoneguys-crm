import { BaseRepository } from './base.repository';
import { Database } from '@/lib/types/database.types';

type ApiKey = Database['public']['Tables']['api_keys']['Row'];
type ApiKeyInsert = Database['public']['Tables']['api_keys']['Insert'];
type ApiKeyUpdate = Database['public']['Tables']['api_keys']['Update'];

export class ApiKeysRepository extends BaseRepository<ApiKey> {
  constructor(useServiceRole = false, usePublicClient = false) {
    super('api_keys', useServiceRole, usePublicClient);
  }

  async findAll() {
    const client = await this.getClient();
    const query = client
      .from(this.tableName)
      .select(`
        *,
        allowed_domains (
          id,
          domain,
          is_active
        )
      `)
      .order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch API keys: ${error.message}`);
    }
    return { data, error: null };
  }

  async findById(id: string) {
    const client = await this.getClient();
    const query = client
      .from(this.tableName)
      .select(`
        *,
        allowed_domains (
          id,
          domain,
          is_active
        )
      `)
      .eq('id', id)
      .single();

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to fetch API key: ${error.message}`);
    }
    return { data, error: null };
  }

  async create(data: ApiKeyInsert) {
    const client = await this.getClient();
    const query = client
      .from(this.tableName)
      .insert(data)
      .select()
      .single();

    const { data: created, error } = await query;
    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`);
    }
    return { data: created, error: null };
  }

  async update(id: string, data: ApiKeyUpdate) {
    const client = await this.getClient();
    const query = client
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    const { data: updated, error } = await query;
    if (error) {
      throw new Error(`Failed to update API key: ${error.message}`);
    }
    return { data: updated, error: null };
  }

  async delete(id: string) {
    const client = await this.getClient();
    const query = client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    const { error } = await query;
    if (error) {
      throw new Error(`Failed to delete API key: ${error.message}`);
    }
    return { data: null, error: null };
  }

  // Domain management
  async addDomains(apiKeyId: string, domains: string[]) {
    const client = await this.getClient();
    const domainRecords = domains.map(domain => ({
      api_key_id: apiKeyId,
      domain: domain.toLowerCase().trim()
    }));

    const query = client
      .from('allowed_domains')
      .insert(domainRecords);

    const { data, error } = await query;
    if (error) {
      throw new Error(`Failed to add domains: ${error.message}`);
    }
    return { data, error: null };
  }

  async removeDomains(apiKeyId: string) {
    const client = await this.getClient();
    const query = client
      .from('allowed_domains')
      .delete()
      .eq('api_key_id', apiKeyId);

    const { error } = await query;
    if (error) {
      throw new Error(`Failed to remove domains: ${error.message}`);
    }
    return { data: null, error: null };  }

  async updateDomains(apiKeyId: string, domains: string[]) {
    // First remove existing domains
    await this.removeDomains(apiKeyId);
    
    // Then add new ones if provided
    if (domains.length > 0) {
      return this.addDomains(apiKeyId, domains);
    }
    
    return { data: [], error: null };
  }
}