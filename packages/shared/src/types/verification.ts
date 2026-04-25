/**
 * Cryptographic verification types for reputation system
 * Implements Ed25519 signatures, W3C Verifiable Credentials, and blockchain anchoring
 */

import type { Agent } from "./agent.js";

/**
 * Ed25519 public key in SPKI DER format (base64url encoded)
 */
export type Ed25519PublicKeyBase64Url = string;

/**
 * Ed25519 private key in PKCS8 PEM format
 */
export type Ed25519PrivateKeyPem = string;

/**
 * Ed25519 signature (base64url encoded)
 */
export type Ed25519SignatureBase64Url = string;

/**
 * Cryptographic payload hash (SHA-256, hex encoded)
 */
export type CryptoPayloadHash = string;

/**
 * Key pair purpose
 */
export const KeyPairPurposes = ["identity", "attestation", "credential_issuance"] as const;
export type KeyPairPurpose = (typeof KeyPairPurposes)[number];

/**
 * Attestation types for reputation claims
 */
export const AttestationTypes = [
  "task_completion",
  "skill_competency",
  "reliability",
  "expertise",
  "quality",
  "timeliness",
] as const;
export type AttestationType = (typeof AttestationTypes)[number];

/**
 * Attestation status
 */
export const AttestationStatuses = ["active", "revoked", "expired", "pending"] as const;
export type AttestationStatus = (typeof AttestationStatuses)[number];

/**
 * Verifiable Credential types per W3C vc-data-model-2.0
 */
export const CredentialTypes = [
  "VerifiableCredential",
  "TaskCompletion",
  "Skill",
  "Expertise",
  "Reliability",
  "Identity",
] as const;
export type CredentialType = (typeof CredentialTypes)[number];

/**
 * Credential status
 */
export const CredentialStatuses = ["active", "revoked", "suspended"] as const;
export type CredentialStatus = (typeof CredentialStatuses)[number];

/**
 * External identity providers
 */
export const IdentityProviders = ["moltbook", "github", "twitter", "linkedin", "gitlab"] as const;
export type IdentityProvider = (typeof IdentityProviders)[number];

/**
 * Identity linkage verification status
 */
export const IdentityVerificationStatuses = ["pending", "verified", "failed"] as const;
export type IdentityVerificationStatus = (typeof IdentityVerificationStatuses)[number];

/**
 * Domain scope for reputation claims
 */
export const ReputationDomains = [
  "coding",
  "research",
  "writing",
  "design",
  "devops",
  "management",
  "sales",
  "marketing",
  "customer_support",
  "data_science",
  "security",
  "documentation",
] as const;
export type ReputationDomain = (typeof ReputationDomains)[number];

/**
 * Cryptographic proof structure (W3C VC standard)
 */
export interface CryptoProof {
  type: "Ed25519Signature2018" | "Ed25519Signature2020";
  created: string;
  proofPurpose: "assertionMethod" | "authentication";
 verificationMethod: string;
  jws: Ed25519SignatureBase64Url;
  challenge?: string;
  domain?: string;
}

/**
 * VC Subject - the claim about the subject
 */
export interface VCSubject {
  id: string;
  [key: string]: unknown;
}

/**
 * Verifiable Credential (partial, W3C vc-data-model-2.0 compliant)
 * Full spec at: https://www.w3.org/TR/vc-data-model-2.0/
 */
export interface VerifiableCredential {
  "@context": string | string[];
  id?: string;
  type: CredentialType[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: VCSubject | VCSubject[];
  proof?: CryptoProof;
  status?: {
    id: string;
    inactiveIssue?: string;
    revocationRegistry?: string;
    tokenIssuer?: string;
  };
}

/**
 * Attestation record
 * A cryptographic signature proving an agent verified a claim
 */
export interface AttestationRecord {
  id: string;
  companyId: string;
  claimerId: string;
  subjectId: string;
  keyPairId?: string;
  type: AttestationType;
  domain: ReputationDomain;
  claim: Record<string, unknown>;
  signature: Ed25519SignatureBase64Url;
  payloadHash: CryptoPayloadHash;
  timestamp: string;
  status: AttestationStatus;
  revocationReason?: string;
  revokedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Verifiable Credential storage record
 */
export interface StoredVerifiableCredential {
  id: string;
  credentialId: string;
  issuerId: string;
  subjectId: string;
  credentialTypes: CredentialType[];
  credentialSubject: VCSubject;
  proof: CryptoProof;
  metadata?: Record<string, unknown>;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Identity linkage record
 * Links Paperclip agent to external identity provider
 */
export interface IdentityLinkage {
  id: string;
  companyId: string;
  agentId: string;
  provider: IdentityProvider;
  providerIdentityId: string;
  publicKeySpkiDerBase64?: Ed25519PublicKeyBase64Url;
  verificationStatus: IdentityVerificationStatus;
  verifiedAt?: string;
  verificationMethod?: string;
  providerMetadata?: Record<string, unknown>;
  isAuthoritative: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Key pair record
 */
export interface KeyPairRecord {
  id: string;
  companyId: string;
  agentId?: string;
  alias: string;
  publicKeySpkiDerBase64: Ed25519PublicKeyBase64Url;
  privateKeyPemEncrypted: Ed25519PrivateKeyPem;
  purpose: KeyPairPurpose;
  isActive: boolean;
  createdAt: string;
  rotatedAt?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  deletedAt?: string;
}

/**
 * Generation options for Ed25519 key pairs
 */
export interface KeyPairOptions {
  alias?: string;
  purpose?: KeyPairPurpose;
  isActive?: boolean;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Signing payload for attestations
 */
export interface AttestationPayload {
  claimerId: string;
  subjectId: string;
  type: AttestationType;
  domain: ReputationDomain;
  claim: Record<string, unknown>;
  timestamp: string;
}

/**
 * Verification result
 */
export interface VerificationResult {
  isValid: boolean;
  timestamp: string;
  keyPairId?: string;
  errorMessage?: string;
}

/**
 * Moltbook registry integration payload
 */
export interface MoltbookRegistryPayload {
  agentId: string;
  identityId: string;
  publicKey: Ed25519PublicKeyBase64Url;
  verifiedAt: string;
  provider: "moltbook";
  verificationMethod: "twitter" | "github" | "manual";
}

/**
 * Blockchain anchor record (for immutable timestamps)
 */
export interface BlockchainAnchor {
  id: string;
  companyId: string;
  hash: CryptoPayloadHash;
  transactionHash?: string;
  blockchain: "ethereum" | "polygon" | "solana" | "custom";
  blockNumber?: number;
  timestamp: string;
  createdAt: string;
}
