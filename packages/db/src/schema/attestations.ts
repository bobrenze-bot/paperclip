import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { companies } from "./companies.js";
import { agents } from "./agents.js";

/**
 * Ed25519 key pairs for cryptographic identity verification.
 * Each agent can have multiple key pairs for different purposes.
 */
export const keyPairs = pgTable(
  "key_pairs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    agentId: uuid("agent_id").references(() => agents.id),
    alias: text("alias").notNull(),
    /** Public key in SPKI format (DER-encoded, base64-encoded string) */
    publicKeySpkiDerBase64: text("public_key_spki_der_base64").notNull().unique(),
    /** Private key in PKCS8 format (PEM string, encrypted at rest) */
    privateKeyPemEncrypted: text("private_key_pem_encrypted").notNull(),
    /** Key purpose: 'identity', 'attestation', 'credential_issuance' */
    purpose: text("purpose").notNull().default("identity"),
    /** Whether this key is active */
    isActive: boolean("is_active").notNull().default(true),
    /** Key creation timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Key rotation timestamp (null if first key) */
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    /** Key expiration timestamp (null if no expiry) */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** Key metadata */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    /** Deletion timestamp (soft delete) */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    companyAgentIdx: index("key_pairs_company_agent_idx").on(table.companyId, table.agentId),
    companyIdIdx: index("key_pairs_company_idx").on(table.companyId),
    isActiveIdx: index("key_pairs_is_active_idx").on(table.isActive),
    purposeIdx: index("key_pairs_purpose_idx").on(table.purpose),
    publicKeyIdx: uniqueIndex("key_pairs_public_key_uq").on(table.publicKeySpkiDerBase64),
  }),
);

/**
 * Attestation records - cryptographic signatures on reputation claims.
 * Each attestation proves an agent verified a claim at a point in time.
 */
export const attestations = pgTable(
  "attestations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    /** ID of the agent making the claim (claimer) */
    claimerId: uuid("claimer_id").notNull().references(() => agents.id),
    /** ID of the agent being attested (subject) */
    subjectId: uuid("subject_id").notNull().references(() => agents.id),
    /** ID of the key pair used for signing */
    keyPairId: uuid("key_pair_id").references(() => keyPairs.id),
    /** Attestation type: 'task_completion', 'skill_competency', 'reliability', 'expertise' */
    type: text("type").notNull(),
    /** Domain being attested: 'coding', 'research', 'writing', etc. */
    domain: text("domain").notNull(),
    /** Claim metadata (JSON) - what was claimed */
    claim: jsonb("claim").$type<Record<string, unknown>>().notNull(),
    /** Cryptographic signature (base64-encoded) */
    signatureBase64: text("signature_base64").notNull(),
    /** Hash of the signed payload (for verification) */
    payloadHash: text("payload_hash").notNull(),
    /** Timestamp of the attestation */
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
    /** Status: 'active', 'revoked', 'expired' */
    status: text("status").notNull().default("active"),
    /** Revocation reason if revoked */
    revocationReason: text("revocation_reason"),
    /** Revocation timestamp */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    /** Attestation metadata */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    /** Creation timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("attestations_company_idx").on(table.companyId),
    claimerIdx: index("attestations_claimer_idx").on(table.companyId, table.claimerId),
    subjectIdx: index("attestations_subject_idx").on(table.companyId, table.subjectId),
    keyPairIdx: index("attestations_key_pair_idx").on(table.keyPairId),
    typeDomainIdx: index("attestations_type_domain_idx").on(table.type, table.domain),
    timestampIdx: index("attestations_timestamp_idx").on(table.timestamp),
    statusIdx: index("attestations_status_idx").on(table.status),
  }),
);

/**
 * Verifiable Credentials (W3C vc-data-model-2.0 compliant).
 * Full VC data structure that can be issued, stored, and verified.
 */
export const verifiableCredentials = pgTable(
  "verifiable_credentials",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    /** Credential ID (URI- or UUID-based) */
    credentialId: text("credential_id").notNull(),
    /** Issuer agent ID */
    issuerId: uuid("issuer_id").notNull().references(() => agents.id),
    /** Subject ID (agent receiving credential) */
    subjectId: uuid("subject_id").notNull().references(() => agents.id),
    /** Credential type(s): 'VerifiableCredential', 'TaskCompletion', 'Skill', etc. */
    credentialTypes: text("credential_types", { 
      enum: ["VerifiableCredential", "TaskCompletion", "Skill", "Expertise", "Reliability"]
    }).array().notNull(),
    /** Credential subject data (JSON) */
    credentialSubject: jsonb("credential_subject").$type<Record<string, unknown>>().notNull(),
    /** Proof data (Ed25519 signature, etc.) */
    proof: jsonb("proof").$type<Record<string, unknown>>().notNull(),
    /** VC metadata */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    /** Status: 'active', 'revoked', 'suspended' */
    status: text("status").notNull().default("active"),
    /** Issuance timestamp */
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    /** Expiration timestamp */
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** Revocation timestamp */
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    /** Revocation reason */
    revocationReason: text("revocation_reason"),
    /** Creation timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyIdx: index("verifiable_credentials_company_idx").on(table.companyId),
    issuerIdx: index("verifiable_credentials_issuer_idx").on(table.issuerId),
    subjectIdx: index("verifiable_credentials_subject_idx").on(table.subjectId),
    credentialIdIdx: uniqueIndex("verifiable_credentials_credential_id_uq").on(table.credentialId),
    statusIdx: index("verifiable_credentials_status_idx").on(table.status),
  }),
);

/**
 * External identity linkage - Moltbook registry integration.
 * Links Paperclip agent IDs to external identity providers.
 */
export const identityLinkages = pgTable(
  "identity_linkages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    companyId: uuid("company_id").notNull().references(() => companies.id),
    /** Paperclip agent ID */
    agentId: uuid("agent_id").notNull().references(() => agents.id),
    /** External provider: 'moltbook', 'github', 'twitter', etc. */
    provider: text("provider").notNull(),
    /** Provider-specific identity ID */
    providerIdentityId: text("provider_identity_id").notNull(),
    /** Public key from external provider (if available) */
    publicKeySpkiDerBase64: text("public_key_spki_der_base64"),
    /** Verification status: 'pending', 'verified', 'failed' */
    verificationStatus: text("verification_status").notNull().default("pending"),
    /** Verification timestamp */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    /** Verification method used */
    verificationMethod: text("verification_method"),
    /** Provider metadata */
    providerMetadata: jsonb("provider_metadata").$type<Record<string, unknown>>(),
    /** Whether this linkage is authoritative */
    isAuthoritative: boolean("is_authoritative").notNull().default(false),
    /** Creation timestamp */
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Updated timestamp */
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    companyAgentIdx: index("identity_linkages_company_agent_idx").on(table.companyId, table.agentId),
    providerIdx: index("identity_linkages_provider_idx").on(table.provider),
    providerIdentityIdx: uniqueIndex("identity_linkages_provider_identity_uq")
      .on(table.provider, table.providerIdentityId),
    agentProviderUnique: uniqueIndex("identity_linkages_agent_provider_uq")
      .on(table.agentId, table.provider),
  }),
);
