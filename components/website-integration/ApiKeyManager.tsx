"use client";

import { useState, useEffect } from 'react';
import { 
  CardPremium,
  ButtonPremium,
  StatusBadge,
  InputPremium,
  AlertPremium,
  ModalPremium
} from '@/components/premium';
import { 
  Key,
  Plus,
  Copy,
  Trash2,
  Globe,
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  description?: string;
  is_active: boolean;
  permissions: string[];
  rate_limit_per_hour: number;
  last_used_at?: string;
  expires_at?: string;
  created_at: string;
  allowed_domains?: Array<{
    id: string;
    domain: string;
    is_active: boolean;
  }>;
}

interface ApiKeyManagerProps {
  onApiKeyChange?: (apiKey: string) => void;
}

export function ApiKeyManager({ onApiKeyChange }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domains: '',
    expiresInDays: ''
  });

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/admin/api-keys');
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    try {
      const domains = formData.domains
        .split('\n')
        .map(d => d.trim())
        .filter(d => d.length > 0);

      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          domains,
          expiresInDays: formData.expiresInDays ? parseInt(formData.expiresInDays) : null
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNewApiKey(data.data.key);
        // Notify parent component of new API key
        if (onApiKeyChange) {
          onApiKeyChange(data.data.key);
        }
        setShowCreateModal(false);
        setShowKeyModal(true);
        setFormData({ name: '', description: '', domains: '', expiresInDays: '' });
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
    }
  };

  const handleToggleActive = async (keyId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/api-keys/${keyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to toggle API key:', error);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/api-keys?id=${keyId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchApiKeys();
      }
    } catch (error) {
      console.error('Failed to delete API key:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getStatusBadge = (key: ApiKey) => {
    if (!key.is_active) {
      return <StatusBadge status="error" variant="soft">Disabled</StatusBadge>;
    }
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      return <StatusBadge status="warning" variant="soft">Expired</StatusBadge>;
    }
    return <StatusBadge status="success" variant="soft">Active</StatusBadge>;
  };

  return (
    <div className="space-y-6">
      <CardPremium
        title="API Keys"
        description="Manage API keys for external integrations"
        variant="default"
        actions={
          <ButtonPremium
            variant="gradient"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
          >
            Generate New Key
          </ButtonPremium>
        }
      >
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-muted-foreground">Loading API keys...</div>
          </div>
        ) : apiKeys.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No API Keys</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first API key to enable external integrations
            </p>
            <ButtonPremium
              variant="default"
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreateModal(true)}
            >
              Generate API Key
            </ButtonPremium>
          </div>
        ) : (
          <div className="space-y-4">
            {apiKeys.map((key) => (
              <div
                key={key.id}
                className="border rounded-lg p-4 space-y-3 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{key.name}</h4>
                      {getStatusBadge(key)}
                    </div>
                    {key.description && (
                      <p className="text-sm text-muted-foreground">{key.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Key className="h-3 w-3" />
                        {key.key_prefix}...
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created {format(new Date(key.created_at), 'MMM d, yyyy')}
                      </span>
                      {key.last_used_at && (
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Last used {format(new Date(key.last_used_at), 'MMM d, yyyy')}
                        </span>
                      )}
                      {key.expires_at && (
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Expires {format(new Date(key.expires_at), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ButtonPremium
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleActive(key.id, key.is_active)}
                    >
                      {key.is_active ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </ButtonPremium>
                    <ButtonPremium
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </ButtonPremium>
                  </div>
                </div>

                {key.allowed_domains && key.allowed_domains.length > 0 && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Allowed Domains
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {key.allowed_domains.map((domain) => (
                        <StatusBadge
                          key={domain.id}
                          status={domain.is_active ? 'info' : 'error'}
                          variant="outline"
                          className="text-xs"
                        >
                          {domain.domain}
                        </StatusBadge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardPremium>

      {/* Create API Key Modal */}
      <ModalPremium
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Generate New API Key"
        description="Create a new API key for external integrations"
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Key Name *</label>
            <InputPremium
              placeholder="e.g., Website Form Integration"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Description</label>
            <InputPremium
              placeholder="Optional description for this API key"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Allowed Domains (one per line)
            </label>
            <textarea
              className="w-full p-3 text-sm border rounded-lg resize-none"
              rows={3}
              placeholder="example.com&#10;app.example.com&#10;localhost:3000"
              value={formData.domains}
              onChange={(e) => setFormData({ ...formData, domains: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to allow requests from any domain (not recommended for production)
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Expiration (days)
            </label>
            <InputPremium
              type="number"
              placeholder="Leave empty for no expiration"
              value={formData.expiresInDays}
              onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <ButtonPremium
              variant="ghost"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </ButtonPremium>
            <ButtonPremium
              variant="gradient"
              onClick={handleCreateApiKey}
              disabled={!formData.name}
            >
              Generate Key
            </ButtonPremium>
          </div>
        </div>
      </ModalPremium>

      {/* Show New API Key Modal */}
      <ModalPremium
        open={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        title="API Key Generated Successfully"
        description="Save this key securely - it won't be shown again"
      >
        <div className="space-y-4">
          <AlertPremium variant="warning" title="Important">
            This is the only time you'll see this API key. Please copy and save it securely.
          </AlertPremium>

          <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
            {newApiKey}
          </div>

          <ButtonPremium
            variant="default"
            className="w-full"
            icon={<Copy className="h-4 w-4" />}
            onClick={() => copyToClipboard(newApiKey)}
          >
            Copy API Key
          </ButtonPremium>

          <ButtonPremium
            variant="ghost"
            className="w-full"
            onClick={() => {
              setShowKeyModal(false);
              setNewApiKey('');
            }}
          >
            I've Saved the Key
          </ButtonPremium>
        </div>
      </ModalPremium>
    </div>
  );
}