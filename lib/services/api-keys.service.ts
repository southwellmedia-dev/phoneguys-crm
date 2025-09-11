import { ApiKeysRepository } from '@/lib/repositories/api-keys.repository';
import crypto from 'crypto';

export interface CreateApiKeyData {
  name: string;
  description?: string;
  domains?: string[];
  permissions?: string[];
  expiresInDays?: number;
  userId: string;
}

export interface UpdateApiKeyData {
  name?: string;
  description?: string;
  is_active?: boolean;
  domains?: string[];
  rate_limit_per_hour?: number;
}

export class ApiKeysService {
  private apiKeysRepo: ApiKeysRepository;

  constructor() {
    this.apiKeysRepo = new ApiKeysRepository();
  }

  // Generate a secure API key
  generateApiKey(): { key: string; hash: string; prefix: string } {
    const key = `tpg_${crypto.randomBytes(32).toString('base64url')}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    const prefix = key.substring(0, 8);
    
    return { key, hash, prefix };
  }

  async getAllApiKeys() {
    return this.apiKeysRepo.findAll();
  }

  async getApiKeyById(id: string) {
    return this.apiKeysRepo.findById(id);
  }

  async createApiKey(data: CreateApiKeyData) {
    const { key, hash, prefix } = this.generateApiKey();
    
    // Calculate expiration date if specified
    let expiresAt = null;
    if (data.expiresInDays) {
      const date = new Date();
      date.setDate(date.getDate() + data.expiresInDays);
      expiresAt = date.toISOString();
    }

    // Create the API key
    const apiKeyResult = await this.apiKeysRepo.create({
      name: data.name,
      description: data.description || null,
      key_hash: hash,
      key_prefix: prefix,
      permissions: data.permissions || ['form_submission'],
      expires_at: expiresAt,
      created_by: data.userId,
      is_active: true,
      rate_limit_per_hour: 100
    });

    if (apiKeyResult.error || !apiKeyResult.data) {
      throw new Error('Failed to create API key');
    }

    // Add allowed domains if provided
    if (data.domains && data.domains.length > 0) {
      await this.apiKeysRepo.addDomains(apiKeyResult.data.id, data.domains);
    }

    // Return the API key with the actual key (only time it's shown)
    return {
      ...apiKeyResult.data,
      key // Include the actual key only on creation
    };
  }

  async updateApiKey(id: string, data: UpdateApiKeyData) {
    const updates: any = { updated_at: new Date().toISOString() };
    
    if (typeof data.is_active === 'boolean') updates.is_active = data.is_active;
    if (data.name) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.rate_limit_per_hour) updates.rate_limit_per_hour = data.rate_limit_per_hour;

    const result = await this.apiKeysRepo.update(id, updates);

    // Update domains if provided
    if (data.domains !== undefined) {
      await this.apiKeysRepo.updateDomains(id, data.domains);
    }

    return result;
  }

  async deleteApiKey(id: string) {
    return this.apiKeysRepo.delete(id);
  }

  // Verify an API key for external requests
  async verifyApiKey(apiKey: string, origin: string | null) {
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    // Create a separate repository instance for verification
    const verifyRepo = new ApiKeysRepository();
    const client = await (verifyRepo as any).getClient();
    
    const query = client
      .from('api_keys')
      .select(`
        *,
        allowed_domains (
          domain,
          is_active
        )
      `)
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    const { data: apiKeyData, error } = await query;

    if (error || !apiKeyData) {
      return { valid: false, error: 'Invalid API key' };
    }

    // Check if the key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check domain whitelist if domains are configured
    if (apiKeyData.allowed_domains && apiKeyData.allowed_domains.length > 0) {
      if (!origin) {
        return { valid: false, error: 'Origin header required' };
      }

      // Extract domain from origin
      const originDomain = new URL(origin).hostname;
      
      const isAllowed = apiKeyData.allowed_domains.some((d: any) => 
        d.is_active && (
          d.domain === originDomain || 
          d.domain === '*' ||
          originDomain.endsWith(`.${d.domain}`)
        )
      );

      if (!isAllowed) {
        return { valid: false, error: 'Domain not whitelisted' };
      }
    }

    // Update last used timestamp
    await this.apiKeysRepo.update(apiKeyData.id, {
      last_used_at: new Date().toISOString()
    });

    return { valid: true, apiKeyData };
  }
}