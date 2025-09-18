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
    
    console.log('[ApiKeysService] Verifying API key:', {
      keyPrefix: apiKey.substring(0, 8),
      hashPrefix: keyHash.substring(0, 8),
      origin
    });
    
    // Create a repository instance using public client for verification
    // This ensures we're using the anon key, not requiring authentication
    const verifyRepo = new ApiKeysRepository(false, true); // Use public client
    const client = await (verifyRepo as any).getClient();
    
    // First get the API key without the join to avoid the single object error
    const { data: apiKeyData, error: keyError } = await client
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .maybeSingle(); // Use maybeSingle to handle 0 or 1 results

    console.log('[ApiKeysService] API key query result:', {
      found: !!apiKeyData,
      error: keyError?.message,
      keyHash: keyHash.substring(0, 16),
      queryDetails: {
        table: 'api_keys',
        filter: `key_hash=${keyHash.substring(0, 8)}..., is_active=true`
      }
    });

    if (keyError || !apiKeyData) {
      // Let's also check if any API key exists with this prefix for debugging
      const { data: anyKey } = await client
        .from('api_keys')
        .select('key_prefix, key_hash, is_active')
        .eq('key_prefix', apiKey.substring(0, 8))
        .maybeSingle();
      
      console.log('[ApiKeysService] Debug - API key with prefix:', {
        keyPrefix: apiKey.substring(0, 8),
        foundWithPrefix: !!anyKey,
        details: anyKey ? {
          storedHashPrefix: anyKey.key_hash?.substring(0, 8),
          providedHashPrefix: keyHash.substring(0, 8),
          isActive: anyKey.is_active,
          hashMatches: anyKey.key_hash === keyHash
        } : null
      });
      
      return { valid: false, error: 'Invalid API key' };
    }

    // Now get the allowed domains separately if needed
    let allowedDomains = [];
    if (apiKeyData.id) {
      const { data: domains } = await client
        .from('allowed_domains')
        .select('domain, is_active')
        .eq('api_key_id', apiKeyData.id)
        .eq('is_active', true);
      
      allowedDomains = domains || [];
      apiKeyData.allowed_domains = allowedDomains;
    }

    // Check if the key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return { valid: false, error: 'API key has expired' };
    }

    // Check domain whitelist if domains are configured
    if (allowedDomains && allowedDomains.length > 0) {
      if (!origin) {
        return { valid: false, error: 'Origin header required' };
      }

      // Extract domain from origin
      const originDomain = new URL(origin).hostname;
      
      const isAllowed = allowedDomains.some((d: any) => 
        d.is_active && (
          d.domain === originDomain || 
          d.domain === '*' ||
          originDomain.endsWith(`.${d.domain}`)
        )
      );

      if (!isAllowed) {
        console.log('[ApiKeysService] Domain not whitelisted:', {
          originDomain,
          allowedDomains: allowedDomains.map(d => d.domain)
        });
        return { valid: false, error: 'Domain not whitelisted' };
      }
    }

    // Try to update last used timestamp, but don't fail validation if it doesn't work
    // (The update might fail due to RLS restrictions when using public client)
    try {
      // Only update if we have a service role key available
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await this.apiKeysRepo.update(apiKeyData.id, {
          last_used_at: new Date().toISOString()
        });
      }
    } catch (updateError) {
      // Log but don't fail the validation
      console.log('[ApiKeysService] Could not update last_used_at (non-critical):', {
        error: updateError instanceof Error ? updateError.message : 'Unknown error',
        apiKeyId: apiKeyData.id
      });
    }

    return { valid: true, apiKeyData };
  }
}