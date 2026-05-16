import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Settings, Zap, FileText, Landmark } from 'lucide-react';
import { api } from '../../lib/api';
import type { BankingConnectorConfig, BankingConnectorTestResponse } from '../../api/llmConfig';

interface LLMTunnelConfig {
  id: number;
  environment: string;
  tunnel_url: string;
  tunnel_auth_token_masked?: string;
  ollama_model_default: string;
  request_timeout_sec: number;
  is_active: boolean;
  last_connectivity_check?: string;
  last_error?: string;
}

interface OllamaModel {
  name: string;
  size_gb: number;
  available: boolean;
}

interface AgentPromptConfig {
  id: number;
  agent_name: string;
  environment: string;
  system_prompt: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  notes?: string;
}

type TabType = 'connection' | 'models' | 'prompts' | 'banking';

export default function AdminLLMConfig() {
  const [activeTab, setActiveTab] = useState<TabType>('connection');
  const [environment, setEnvironment] = useState<string>('development');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-600" />
          LLM Configuration
        </h1>
        <p className="text-slate-600 mt-2">
          Manage Ollama tunnel connections, discover models, and customize agent prompts
        </p>
      </div>

      {/* Environment Selector */}
      <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg">
        <label className="font-semibold text-slate-700">Environment:</label>
        <select
          value={environment}
          onChange={(e) => {
            setEnvironment(e.target.value);
            clearMessages();
          }}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => {
            setActiveTab('connection');
            clearMessages();
          }}
          className={`px-4 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'connection'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          Connection Settings
        </button>
        <button
          onClick={() => {
            setActiveTab('models');
            clearMessages();
          }}
          className={`px-4 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'models'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Zap className="w-4 h-4" />
          Models
        </button>
        <button
          onClick={() => {
            setActiveTab('prompts');
            clearMessages();
          }}
          className={`px-4 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'prompts'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Prompts
        </button>
        <button
          onClick={() => {
            setActiveTab('banking');
            clearMessages();
          }}
          className={`px-4 py-3 font-semibold flex items-center gap-2 ${
            activeTab === 'banking'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Banking Proxy
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg border border-green-100 flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'connection' && (
          <ConnectionSettingsPanel
            environment={environment}
            onError={setError}
            onSuccess={setSuccess}
          />
        )}
        {activeTab === 'models' && (
          <ModelsPanel
            environment={environment}
            onError={setError}
          />
        )}
        {activeTab === 'prompts' && (
          <PromptsPanel
            environment={environment}
            onError={setError}
            onSuccess={setSuccess}
          />
        )}
        {activeTab === 'banking' && (
          <BankingProxyPanel
            environment={environment}
            onError={setError}
            onSuccess={setSuccess}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Connection Settings Panel
// ============================================================================

function ConnectionSettingsPanel({
  environment,
  onError,
  onSuccess,
}: {
  environment: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}) {
  const [config, setConfig] = useState<LLMTunnelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    tunnel_url: '',
    tunnel_auth_token: '',
    ollama_model_default: 'qwen3:8b',
    request_timeout_sec: 30,
  });

  useEffect(() => {
    loadConfig();
  }, [environment]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/llm/tunnel/${environment}`);
      setConfig(response.data);
      setFormData({
        tunnel_url: response.data.tunnel_url || '',
        tunnel_auth_token: '',
        ollama_model_default: response.data.ollama_model_default || 'qwen3:8b',
        request_timeout_sec: response.data.request_timeout_sec || 30,
      });
    } catch (error) {
      onError('Failed to load tunnel configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.tunnel_url.trim()) {
      onError('Tunnel URL is required');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put(`/api/admin/llm/tunnel/${environment}`, {
        tunnel_url: formData.tunnel_url,
        tunnel_auth_token: formData.tunnel_auth_token || undefined,
        ollama_model_default: formData.ollama_model_default,
        request_timeout_sec: formData.request_timeout_sec,
      });

      setConfig(response.data);
      onSuccess('Tunnel configuration updated successfully');
      setFormData({ ...formData, tunnel_auth_token: '' });
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to update configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnectivity = async () => {
    setSaving(true);
    try {
      const response = await api.post(
        `/api/admin/llm/tunnel/${environment}/test`,
        {}
      );

      if (response.data.status === 'ok') {
        onSuccess(
          `Connectivity test passed! Found ${response.data.models_count} models. Response time: ${response.data.response_time_ms}ms`
        );
      } else {
        onError(`Connectivity test failed: ${response.data.error}`);
      }
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Connectivity test failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Tunnel URL */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Tunnel URL (ngrok or custom)
          </label>
          <input
            type="text"
            placeholder="https://abc123.ngrok.io"
            value={formData.tunnel_url}
            onChange={(e) => setFormData({ ...formData, tunnel_url: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-slate-500 mt-1">
            Base URL of your ngrok tunnel or secure endpoint to local Ollama
          </p>
        </div>

        {/* Auth Token */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Auth Token (optional)
          </label>
          <input
            type="password"
            placeholder="Leave empty to keep current token"
            value={formData.tunnel_auth_token}
            onChange={(e) => setFormData({ ...formData, tunnel_auth_token: e.target.value })}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {config?.tunnel_auth_token_masked && (
            <p className="text-sm text-slate-500 mt-1">
              Current token: {config.tunnel_auth_token_masked}
            </p>
          )}
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Default Ollama Model
          </label>
          <input
            type="text"
            placeholder="qwen3:8b"
            value={formData.ollama_model_default}
            onChange={(e) =>
              setFormData({ ...formData, ollama_model_default: e.target.value })
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-slate-500 mt-1">
            Default model to use from the Ollama instance
          </p>
        </div>

        {/* Timeout */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Request Timeout (seconds)
          </label>
          <input
            type="number"
            min="5"
            max="300"
            value={formData.request_timeout_sec}
            onChange={(e) =>
              setFormData({
                ...formData,
                request_timeout_sec: parseInt(e.target.value),
              })
            }
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status */}
        {config && (
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="text-sm font-semibold text-slate-700 mb-2">Status</div>
            <div className="space-y-1 text-sm text-slate-600">
              <p>
                <span className="font-semibold">Active:</span>{' '}
                {config.is_active ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </p>
              {config.last_connectivity_check && (
                <p>
                  <span className="font-semibold">Last Check:</span>{' '}
                  {new Date(config.last_connectivity_check).toLocaleString()}
                </p>
              )}
              {config.last_error && (
                <p>
                  <span className="font-semibold">Last Error:</span>{' '}
                  <span className="text-red-600">{config.last_error}</span>
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
        <button
          onClick={handleTestConnectivity}
          disabled={saving || !formData.tunnel_url}
          className="flex-1 bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 disabled:bg-slate-400"
        >
          {saving ? 'Testing...' : 'Test Connectivity'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Models Panel
// ============================================================================

function ModelsPanel({
  environment,
  onError,
}: {
  environment: string;
  onError: (msg: string) => void;
}) {
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadModels();
  }, [environment]);

  const loadModels = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/llm/models?environment=${environment}`);
      setModels(response.data.models || []);
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to load models');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading models...</div>;
  }

  if (models.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
        <p className="text-slate-500">
          No models available. Configure tunnel connection and run connectivity test first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">
          Available Models ({models.length})
        </h3>
        <button
          onClick={loadModels}
          className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-2">
        {models.map((model) => (
          <div
            key={model.name}
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div>
              <p className="font-semibold text-slate-900">{model.name}</p>
              <p className="text-sm text-slate-500">Size: {model.size_gb.toFixed(2)} GB</p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                model.available
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {model.available ? 'Available' : 'Unavailable'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Prompts Panel
// ============================================================================

function PromptsPanel({
  environment,
  onError,
  onSuccess,
}: {
  environment: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}) {
  const [prompts, setPrompts] = useState<AgentPromptConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [editingPrompt, setEditingPrompt] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPrompts();
  }, [environment]);

  const loadPrompts = async () => {
    try {
      const response = await api.get(
        `/api/admin/llm/prompts?agent=${selectedAgent}&environment=${environment}`
      );
      setPrompts(response.data.prompts || []);
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to load prompts');
    }
  };

  const handlePublish = async () => {
    if (!selectedAgent || !editingPrompt.trim()) {
      onError('Agent and prompt text are required');
      return;
    }

    setSaving(true);
    try {
      await api.put(
        `/api/admin/llm/prompts/${selectedAgent}/publish?environment=${environment}`,
        { system_prompt: editingPrompt }
      );
      onSuccess('Prompt published successfully');
      loadPrompts();
      setEditingPrompt('');
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to publish prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleRollback = async (version: number) => {
    setSaving(true);
    try {
      await api.post(
        `/api/admin/llm/prompts/${selectedAgent}/rollback?environment=${environment}&target_version=${version}`,
        {}
      );
      onSuccess(`Rolled back to version ${version}`);
      loadPrompts();
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to rollback prompt');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Selector */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Select Agent
        </label>
        <select
          value={selectedAgent}
          onChange={(e) => {
            setSelectedAgent(e.target.value);
            setEditingPrompt('');
          }}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose an agent...</option>
          <option value="coordinator">Coordinator</option>
          <option value="payment_agent">Payment Agent</option>
          <option value="communication_agent">Communication Agent</option>
          <option value="autosavings_agent">AutoSavings Agent</option>
          <option value="opportunity_agent">Opportunity Agent</option>
        </select>
      </div>

      {selectedAgent && (
        <>
          {/* Prompt Editor */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              System Prompt
            </label>
            <textarea
              value={editingPrompt}
              onChange={(e) => setEditingPrompt(e.target.value)}
              placeholder="Enter the system prompt for this agent..."
              rows={10}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <button
              onClick={handlePublish}
              disabled={saving || !editingPrompt.trim()}
              className="mt-4 bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
            >
              {saving ? 'Publishing...' : 'Publish New Version'}
            </button>
          </div>

          {/* Version History */}
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Version History</h3>
            {prompts.length === 0 ? (
              <p className="text-slate-500">No versions available</p>
            ) : (
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        Version {prompt.version} {prompt.is_active && <span className="text-green-600">(Active)</span>}
                      </p>
                      <p className="text-sm text-slate-500">
                        By {prompt.created_by} • {new Date(prompt.created_at).toLocaleString()}
                      </p>
                      {prompt.notes && (
                        <p className="text-sm text-slate-600 mt-1">{prompt.notes}</p>
                      )}
                    </div>
                    {!prompt.is_active && (
                      <button
                        onClick={() => handleRollback(prompt.version)}
                        disabled={saving}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-slate-400"
                      >
                        Rollback
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function BankingProxyPanel({
  environment,
  onError,
  onSuccess,
}: {
  environment: string;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}) {
  const [config, setConfig] = useState<BankingConnectorConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    base_url: '',
    secret: '',
    request_timeout_sec: 10,
  });

  useEffect(() => {
    loadConfig();
  }, [environment]);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/banking/connector/${environment}`);
      setConfig(response.data);
      setFormData({
        base_url: response.data.base_url || '',
        secret: '',
        request_timeout_sec: response.data.request_timeout_sec || 10,
      });
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to load banking connector config');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!formData.base_url.trim()) {
      onError('Banking base URL is required');
      return;
    }
    setSaving(true);
    try {
      const response = await api.put(`/api/admin/banking/connector/${environment}`, formData);
      setConfig(response.data);
      setFormData((current) => ({ ...current, secret: '' }));
      onSuccess('Banking connector updated successfully');
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Failed to update banking connector');
    } finally {
      setSaving(false);
    }
  };

  const testConfig = async () => {
    setSaving(true);
    try {
      const response = await api.post<BankingConnectorTestResponse>(
        `/api/admin/banking/connector/${environment}/test`,
        {}
      );
      if (response.data.status === 'ok') {
        onSuccess(`Banking connector test passed. Providers: ${response.data.providers_count ?? 0}`);
      } else {
        onError(response.data.error || 'Banking connector test failed');
      }
    } catch (error: any) {
      onError(error.response?.data?.detail || 'Banking connector test failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500">Loading banking connector...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Mock Bank Base URL</label>
        <input
          type="text"
          value={formData.base_url}
          onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
          placeholder="https://mockbank.example.com"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Bank API Secret</label>
        <input
          type="password"
          value={formData.secret}
          onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
          placeholder="Leave blank to keep current secret"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {config?.secret_masked && (
          <p className="text-sm text-slate-500 mt-1">Current secret: {config.secret_masked}</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">Request Timeout (seconds)</label>
        <input
          type="number"
          min="3"
          max="120"
          value={formData.request_timeout_sec}
          onChange={(e) => setFormData({ ...formData, request_timeout_sec: parseInt(e.target.value) })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-4">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="flex-1 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-slate-400"
        >
          {saving ? 'Saving...' : 'Save Banking Connector'}
        </button>
        <button
          onClick={testConfig}
          disabled={saving || !formData.base_url}
          className="flex-1 bg-slate-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-700 disabled:bg-slate-400"
        >
          {saving ? 'Testing...' : 'Test Banking Connector'}
        </button>
      </div>
      {config && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm text-slate-600">
          <p><span className="font-semibold">Active:</span> {config.is_active ? 'Yes' : 'No'}</p>
          {config.last_connectivity_check && (
            <p><span className="font-semibold">Last Check:</span> {new Date(config.last_connectivity_check).toLocaleString()}</p>
          )}
          {config.last_error && (
            <p><span className="font-semibold">Last Error:</span> <span className="text-red-600">{config.last_error}</span></p>
          )}
        </div>
      )}
    </div>
  );
}
