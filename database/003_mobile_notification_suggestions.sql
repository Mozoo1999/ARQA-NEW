-- ARQA: consented mobile-notification intake and approval-based suggestions.
-- Store only sources and content categories explicitly approved for the device/user.

CREATE TYPE arqa_mobile_source_kind AS ENUM ('android_notification', 'whatsapp_business_webhook', 'manual_import', 'bank_webhook');
CREATE TYPE arqa_device_signal_status AS ENUM ('received', 'parsed', 'ignored', 'failed', 'expired');
CREATE TYPE arqa_financial_direction AS ENUM ('received', 'sent');
CREATE TYPE arqa_suggestion_status AS ENUM ('new', 'approved', 'dismissed', 'expired', 'failed');

CREATE TABLE mobile_capture_consents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,
  device_id text NOT NULL,
  source_kind arqa_mobile_source_kind NOT NULL,
  package_name text,
  purpose text NOT NULL,
  granted_at timestamptz NOT NULL,
  revoked_at timestamptz,
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (revoked_at IS NULL OR revoked_at >= granted_at)
);

CREATE TABLE external_identity_mappings (
  id uuid PRIMARY KEY,
  normalized_identifier text NOT NULL,
  identifier_kind text NOT NULL CHECK (identifier_kind IN ('phone', 'account', 'wallet')),
  entity_type text NOT NULL CHECK (entity_type IN ('customer', 'supplier', 'asset', 'driver', 'contact')),
  entity_id uuid NOT NULL,
  display_name text NOT NULL,
  relationship_label text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (normalized_identifier, identifier_kind, entity_type, entity_id)
);

CREATE TABLE device_signal_events (
  id uuid PRIMARY KEY,
  consent_id uuid NOT NULL REFERENCES mobile_capture_consents(id),
  source_kind arqa_mobile_source_kind NOT NULL,
  source_package text,
  source_event_id text,
  fingerprint char(64) NOT NULL,
  occurred_at timestamptz NOT NULL,
  encrypted_preview bytea,
  extracted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status arqa_device_signal_status NOT NULL DEFAULT 'received',
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (consent_id, fingerprint)
);

CREATE TABLE financial_signals (
  id uuid PRIMARY KEY,
  device_signal_event_id uuid NOT NULL REFERENCES device_signal_events(id) ON DELETE CASCADE,
  provider text NOT NULL,
  direction arqa_financial_direction NOT NULL,
  amount numeric(16,4) NOT NULL CHECK (amount > 0),
  currency char(3) NOT NULL,
  counterparty_identifier text,
  external_reference text,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE action_suggestions (
  id uuid PRIMARY KEY,
  device_signal_event_id uuid NOT NULL REFERENCES device_signal_events(id) ON DELETE CASCADE,
  financial_signal_id uuid REFERENCES financial_signals(id) ON DELETE CASCADE,
  suggestion_type text NOT NULL CHECK (suggestion_type IN (
    'customer_payment_draft', 'asset_payment_draft', 'supplier_payment_draft', 'collection_follow_up'
  )),
  target_entity_type text,
  target_entity_id uuid,
  title text NOT NULL,
  explanation text NOT NULL,
  confidence numeric(5,4) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
  proposed_payload jsonb NOT NULL,
  status arqa_suggestion_status NOT NULL DEFAULT 'new',
  decided_by_user_id uuid,
  decided_at timestamptz,
  resulting_entity_type text,
  resulting_entity_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX mobile_capture_consents_active_lookup
  ON mobile_capture_consents (user_id, device_id, source_kind)
  WHERE revoked_at IS NULL;
CREATE INDEX device_signal_events_status_lookup
  ON device_signal_events (status, occurred_at DESC);
CREATE INDEX external_identity_phone_lookup
  ON external_identity_mappings (normalized_identifier)
  WHERE active = true;
CREATE INDEX action_suggestions_inbox_lookup
  ON action_suggestions (status, created_at DESC);
