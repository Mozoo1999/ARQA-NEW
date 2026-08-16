-- ARQA Phase 1 extension: collections, multichannel communication and multimodal intake.
-- All externally supplied content remains a source record; business writes are traceable to it.

CREATE TYPE arqa_receivable_status AS ENUM (
  'open', 'partially_paid', 'promised', 'overdue', 'disputed', 'closed'
);
CREATE TYPE arqa_collection_status AS ENUM (
  'new', 'scheduled', 'in_progress', 'promise_to_pay', 'escalated', 'closed'
);
CREATE TYPE arqa_collection_reminder_status AS ENUM (
  'pending', 'prepared', 'sent', 'delivered', 'read', 'replied', 'failed', 'cancelled'
);
CREATE TYPE arqa_communication_channel AS ENUM (
  'whatsapp', 'in_app', 'email', 'sms', 'voice'
);
CREATE TYPE arqa_message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE arqa_message_status AS ENUM (
  'received', 'prepared', 'queued', 'sent', 'delivered', 'read', 'replied', 'failed'
);
CREATE TYPE arqa_asset_type AS ENUM ('image', 'audio', 'document', 'video');
CREATE TYPE arqa_analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'review_required');
CREATE TYPE arqa_voice_command_status AS ENUM (
  'recognized', 'needs_entity_resolution', 'needs_confirmation', 'executed', 'rejected', 'failed'
);

CREATE TABLE receivables (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id),
  project_id uuid REFERENCES projects(id),
  source_document_reference text,
  currency char(3) NOT NULL,
  original_amount numeric(16,4) NOT NULL CHECK (original_amount > 0),
  outstanding_amount numeric(16,4) NOT NULL CHECK (outstanding_amount >= 0),
  due_date date NOT NULL,
  status arqa_receivable_status NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (outstanding_amount <= original_amount)
);

CREATE TABLE collection_cases (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id),
  receivable_id uuid REFERENCES receivables(id),
  status arqa_collection_status NOT NULL DEFAULT 'new',
  owner_user_id uuid,
  next_action_at timestamptz,
  last_contact_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collection_reminders (
  id uuid PRIMARY KEY,
  collection_case_id uuid NOT NULL REFERENCES collection_cases(id),
  channel arqa_communication_channel NOT NULL,
  template_code text,
  rendered_body text,
  scheduled_at timestamptz NOT NULL,
  status arqa_collection_reminder_status NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_records (
  id uuid PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES customers(id),
  project_id uuid REFERENCES projects(id),
  received_amount numeric(16,4) NOT NULL CHECK (received_amount > 0),
  currency char(3) NOT NULL,
  payment_method text NOT NULL,
  external_reference text,
  received_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('draft', 'pending_verification', 'confirmed', 'reversed')),
  source_voice_command_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE payment_allocations (
  id uuid PRIMARY KEY,
  payment_record_id uuid NOT NULL REFERENCES payment_records(id) ON DELETE CASCADE,
  receivable_id uuid NOT NULL REFERENCES receivables(id),
  allocated_amount numeric(16,4) NOT NULL CHECK (allocated_amount > 0),
  UNIQUE (payment_record_id, receivable_id)
);

CREATE TABLE communication_messages (
  id uuid PRIMARY KEY,
  channel arqa_communication_channel NOT NULL,
  direction arqa_message_direction NOT NULL,
  status arqa_message_status NOT NULL,
  provider_message_id text,
  sender_address text,
  recipient_address text,
  body text,
  customer_id uuid REFERENCES customers(id),
  supplier_id uuid REFERENCES suppliers(id),
  project_id uuid REFERENCES projects(id),
  collection_case_id uuid REFERENCES collection_cases(id),
  occurred_at timestamptz NOT NULL,
  received_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, provider_message_id)
);

CREATE TABLE content_assets (
  id uuid PRIMARY KEY,
  communication_message_id uuid REFERENCES communication_messages(id) ON DELETE SET NULL,
  asset_type arqa_asset_type NOT NULL,
  object_key text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  byte_size bigint CHECK (byte_size >= 0),
  sha256 char(64),
  source_name text,
  captured_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE content_analyses (
  id uuid PRIMARY KEY,
  content_asset_id uuid NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  analysis_kind text NOT NULL CHECK (analysis_kind IN ('ocr', 'document_classification', 'document_extraction', 'audio_transcription', 'image_analysis')),
  status arqa_analysis_status NOT NULL DEFAULT 'pending',
  provider text,
  model_version text,
  confidence numeric(5,4) CHECK (confidence BETWEEN 0 AND 1),
  result jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed_by_user_id uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE voice_commands (
  id uuid PRIMARY KEY,
  source text NOT NULL CHECK (source IN ('in_app', 'quick_action', 'whatsapp_audio')),
  actor_user_id uuid,
  content_asset_id uuid REFERENCES content_assets(id),
  transcript text NOT NULL,
  normalized_transcript text NOT NULL,
  detected_language text,
  transcription_confidence numeric(5,4) CHECK (transcription_confidence BETWEEN 0 AND 1),
  intent text NOT NULL,
  extracted_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status arqa_voice_command_status NOT NULL DEFAULT 'recognized',
  resolved_entity_type text,
  resolved_entity_id uuid,
  confirmation_by_user_id uuid,
  confirmed_at timestamptz,
  executed_at timestamptz,
  execution_error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_records
  ADD CONSTRAINT payment_records_source_voice_command_fk
  FOREIGN KEY (source_voice_command_id) REFERENCES voice_commands(id);

CREATE TABLE command_executions (
  id uuid PRIMARY KEY,
  voice_command_id uuid NOT NULL REFERENCES voice_commands(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_entity_type text,
  target_entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  executed_by_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX receivables_due_lookup
  ON receivables (customer_id, status, due_date);
CREATE INDEX collection_reminders_schedule_lookup
  ON collection_reminders (status, scheduled_at);
CREATE INDEX communication_messages_customer_lookup
  ON communication_messages (customer_id, occurred_at DESC);
CREATE INDEX content_analyses_asset_lookup
  ON content_analyses (content_asset_id, status);
CREATE INDEX voice_commands_status_lookup
  ON voice_commands (status, created_at DESC);
