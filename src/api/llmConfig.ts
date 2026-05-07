/**
 * Type definitions for LLM Configuration Admin APIs.
 * Manual types (not auto-generated) for new admin LLM endpoints.
 */

// Tunnel Configuration Types
export interface LLMTunnelConfig {
  id: number;
  environment: 'development' | 'staging' | 'production';
  provider_type: string; // "ngrok"
  tunnel_url: string;
  tunnel_auth_token_masked?: string;
  ollama_model_default: string;
  request_timeout_sec: number;
  is_active: boolean;
  last_connectivity_check?: string; // ISO datetime
  last_error?: string;
  created_by: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
}

export interface LLMTunnelConfigCreate {
  tunnel_url: string;
  tunnel_auth_token?: string;
  ollama_model_default: string;
  request_timeout_sec: number;
}

// Model Discovery Types
export interface OllamaModel {
  name: string;
  size_gb: number;
  size_bytes: number;
  available: boolean;
}

export interface ModelListResponse {
  models: OllamaModel[];
  model_count: number;
}

export interface ConnectivityTestResult {
  status: 'ok' | 'error';
  models_count?: number;
  response_time_ms?: number;
  error?: string;
}

// Prompt Configuration Types
export interface AgentPromptConfig {
  id: number;
  agent_name: string;
  environment: 'development' | 'staging' | 'production';
  system_prompt: string;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  notes?: string;
}

export interface AgentPromptConfigCreate {
  system_prompt: string;
  notes?: string;
}

export interface PromptListResponse {
  prompts: AgentPromptConfig[];
  total_count: number;
}

// Error Response Types
export interface ErrorResponse {
  status: 'error';
  code: string;
  message: string;
  remediation?: string;
}
