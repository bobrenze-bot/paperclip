import crypto, { randomUUID } from "node:crypto";
import type { Db } from "@paperclipai/db";
import { keyPairs, attestations, verifiableCredentials, identityLinkages } from "@paperclipai/db";
import { and, eq, desc } from "drizzle-orm";
import { logger } from "../middleware/logger.js";

// Type definitions for the service
type KeyPairPurpose = "identity" | "attestation" | "credential_issuance";
type AttestationType = "task_completion" | "skill_competency" | "reliability" | "expertise" | "quality" | "timeliness";
type AttestationStatus = "active" | "revoked" | "expired" | "pending";
type CredentialType = "VerifiableCredential" | "TaskCompletion" | "Skill" | "Expertise" | "Reliability" | "Identity";
type CredentialStatus = "active" | "revoked" | "suspended";
type IdentityProvider = "moltbook" | "github" | "twitter" | "linkedin" | "gitlab";
type IdentityVerificationStatus = "pending" | "verified" | "failed";
type ReputationDomain = 
  | "coding" | "research" | "writing" | "design" | "devops" | "management" | "sales" | "marketing" 
  | "customer_support" | "data_science" | "security" | "documentation";
type Ed25519PublicKeyBase64Url = string;
type Ed25519PrivateKeyPem = string;
type Ed25519SignatureBase64Url = string;
type CryptoPayloadHash = string;

interface KeyPairRecord {
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

interface AttestationRecord {
  id: string;
  companyId: string;
  claimerId: string;
  subjectId: string;
  keyPairId?: string;
  type: AttestationType;
  domain: ReputationDomain;
  claim: Record<string, unknown>;
  signatureBase64: Ed25519SignatureBase64Url;
  payloadHash: CryptoPayloadHash;
  timestamp: string;
  status: AttestationStatus;
  revocationReason?: string;
  revokedAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

interface VerifiableCredential {
  id?: string;
  type: CredentialType[];
  issuer: string;
  issuanceDate: string;
  expirationDate?: string;
  credentialSubject: Record<string, unknown>;
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: Ed25519SignatureBase64Url;
  };
  metadata?: Record<string, unknown>;
  status: CredentialStatus;
}

interface StoredVerifiableCredential {
  id: string;
  credentialId: string;
  issuerId: string;
  subjectId: string;
  credentialTypes: CredentialType[];
  credentialSubject: Record<string, unknown>;
  proof?: {
    type: string;
    created: string;
    proofPurpose: string;
    verificationMethod: string;
    jws: Ed25519SignatureBase64Url;
  };
  metadata?: Record<string, unknown>;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revocationReason?: string;
  createdAt: string;
  updatedAt: string;
}

interface IdentityLinkage {
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

interface AttestationPayload {
  claimerId: string;
  subjectId: string;
  type: AttestationType;
  domain: ReputationDomain;
  claim: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface VerificationResult {
  isValid: boolean;
  timestamp: string;
  keyPairId?: string;
  errorMessage?: string;
}

interface KeyPairOptions {
  alias?: string;
  purpose?: KeyPairPurpose;
  isActive?: boolean;
  expiresAt?: Date;
  metadata?: Record<string, unknown>;
  agentId?: string;
}

/**
 * Generate Ed25519 key pair in PKCS8 format
 */
export function generateEd25519KeyPair(): {
  publicKeySpkiDerBase64: Ed25519PublicKeyBase64Url;
  privateKeyPem: Ed25519PrivateKeyPem;
} {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });

  const publicKeySpkiDerBase64 = publicKey.toString("base64url");
  const privateKeyPem = privateKey as Ed25519PrivateKeyPem;

  return { publicKeySpkiDerBase64, privateKeyPem };
}

/**
 * Sign payload with Ed25519 private key
 */
export function signEd25519Payload(
  payload: string,
  privateKeyPem: Ed25519PrivateKeyPem,
): Ed25519SignatureBase64Url {
  const key = crypto.createPrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(payload, "utf8"), key);
  return signature.toString("base64url");
}

/**
 * Verify Ed25519 signature
 */
export function verifyEd25519Signature(
  signature: Ed25519SignatureBase64Url,
  payload: string,
  publicKeySpkiDerBase64: Ed25519PublicKeyBase64Url,
): boolean {
  try {
    const publicKeyBuffer = Buffer.from(publicKeySpkiDerBase64, "base64url");
    const signatureBuffer = Buffer.from(signature, "base64url");
    return crypto.verify(null, Buffer.from(payload, "utf8"), publicKeyBuffer, signatureBuffer);
  } catch (error) {
    logger.error({ error }, "Ed25519 signature verification failed");
    return false;
  }
}

/**
 * Hash payload for attestation
 */
export function hashPayload(payload: string): CryptoPayloadHash {
  return crypto.createHash("sha256").update(payload, "utf8").digest("hex");
}

/**
 * Key pair service for cryptographic identity verification
 */
export interface KeyPairService {
  generateKeyPair: (companyId: string, options?: KeyPairOptions) => Promise<KeyPairRecord>;
  getKeyPairByPublicKey: (companyId: string, publicKey: Ed25519PublicKeyBase64Url) => Promise<KeyPairRecord | null>;
  getActiveKeyPairs: (companyId: string, purpose?: KeyPairPurpose) => Promise<KeyPairRecord[]>;
  revokeKeyPair: (keyPairId: string) => Promise<void>;
  rotateKeyPair: (keyPairId: string, newAlias?: string) => Promise<KeyPairRecord>;
}

/**
 * Attestation service for cryptographic reputation claims
 */
export interface AttestationService {
  createAttestation: (
    companyId: string,
    claimerId: string,
    subjectId: string,
    payload: AttestationPayload,
    keyPairId: string,
  ) => Promise<AttestationRecord>;
  verifyAttestation: (
    signature: Ed25519SignatureBase64Url,
    payload: AttestationPayload,
    publicKey: Ed25519PublicKeyBase64Url,
  ) => VerificationResult;
  getAttestationsBySubject: (
    companyId: string,
    subjectId: string,
    status?: string,
  ) => Promise<AttestationRecord[]>;
  getAttestationsByClaimer: (
    companyId: string,
    claimerId: string,
    status?: string,
  ) => Promise<AttestationRecord[]>;
  revokeAttestation: (attestationId: string, reason: string) => Promise<void>;
}

/**
 * Verifiable Credential service (W3C vc-data-model-2.0 compliant)
 */
export interface VerifiableCredentialService {
  createVerifiableCredential: (
    companyId: string,
    issuerId: string,
    subjectId: string,
    credential: VerifiableCredential,
  ) => Promise<StoredVerifiableCredential>;
  verifyCredential: (
    credential: VerifiableCredential,
    issuerPublicKey: Ed25519PublicKeyBase64Url,
  ) => VerificationResult;
  getCredentialsBySubject: (companyId: string, subjectId: string) => Promise<StoredVerifiableCredential[]>;
  revokeCredential: (credentialId: string, reason: string) => Promise<void>;
}

/**
 * Identity linkage service for Moltbook registry integration
 */
export interface IdentityLinkageService {
  createLinkage: (
    companyId: string,
    agentId: string,
    provider: IdentityProvider,
    providerIdentityId: string,
    verificationMethod?: string,
  ) => Promise<IdentityLinkage>;
  verifyLinkage: (
    linkageId: string,
    providerData: Record<string, unknown>,
  ) => Promise<IdentityLinkage>;
  getLinkageByProvider: (
    companyId: string,
    agentId: string,
    provider: IdentityProvider,
  ) => Promise<IdentityLinkage | null>;
  getAuthoritativeLinkage: (companyId: string, agentId: string) => Promise<IdentityLinkage | null>;
}

/**
 * Build Key Pair Service
 */
export function buildKeyPairService(db: Db): KeyPairService {
  return {
    async generateKeyPair(companyId, options = {} as KeyPairOptions) {
      const { publicKeySpkiDerBase64, privateKeyPem } = generateEd25519KeyPair();
      
      // Note: In production, use sealer.encrypt(privateKeyPem) to encrypt private keys
      // For now, we'll store them as-is (should be encrypted at rest in real deployment)
      const encryptedPrivateKey = privateKeyPem;

      const [keyPair] = await db
        .insert(keyPairs)
        .values({
          companyId,
          agentId: options.agentId,
          alias: options.alias || `key-${Date.now()}`,
          publicKeySpkiDerBase64,
          privateKeyPemEncrypted: encryptedPrivateKey,
          purpose: options.purpose || "identity",
          isActive: options.isActive ?? true,
          expiresAt: options.expiresAt || null,
          metadata: options.metadata || null,
        })
        .returning();

      return keyPair as KeyPairRecord;
    },

    async getKeyPairByPublicKey(companyId, publicKey) {
      const [keyPair] = await db
        .select()
        .from(keyPairs)
        .where(
          and(eq(keyPairs.companyId, companyId), eq(keyPairs.publicKeySpkiDerBase64, publicKey)),
        )
        .limit(1);

      return keyPair || null;
    },

    async getActiveKeyPairs(companyId, purpose) {
      const whereConditions = [eq(keyPairs.companyId, companyId), eq(keyPairs.isActive, true)];
      if (purpose) {
        whereConditions.push(eq(keyPairs.purpose, purpose));
      }

      const result = await db
        .select()
        .from(keyPairs)
        .where(and(...whereConditions));

      return result as KeyPairRecord[];
    },

    async revokeKeyPair(keyPairId) {
      await db
        .update(keyPairs)
        .set({ isActive: false, deletedAt: new Date() })
        .where(eq(keyPairs.id, keyPairId));
    },

    async rotateKeyPair(keyPairId, newAlias) {
      const { publicKeySpkiDerBase64, privateKeyPem } = generateEd25519KeyPair();

      const [updated] = await db
        .update(keyPairs)
        .set({
          publicKeySpkiDerBase64,
          privateKeyPemEncrypted: privateKeyPem,
          rotatedAt: new Date(),
          alias: newAlias || undefined,
        })
        .where(eq(keyPairs.id, keyPairId))
        .returning();

      return updated as KeyPairRecord;
    },
  };
}

/**
 * Build Attestation Service
 */
export function buildAttestationService(db: Db): AttestationService {
  return {
    async createAttestation(companyId, claimerId, subjectId, payload, keyPairId) {
      const payloadString = JSON.stringify(payload);
      const payloadHash = hashPayload(payloadString);

      const keyPairRecord = await db.query.keyPairs.findFirst({
        where: and(eq(keyPairs.id, keyPairId), eq(keyPairs.companyId, companyId)),
      });

      if (!keyPairRecord) {
        throw new Error("Key pair not found or belongs to different company");
      }

      // Decrypt private key (in production, use sealer.decrypt)
      const decryptedPrivateKey = keyPairRecord.privateKeyPemEncrypted as Ed25519PrivateKeyPem;
      
      const signature = signEd25519Payload(payloadString, decryptedPrivateKey);

      const [attestation] = await db
        .insert(attestations)
        .values({
          companyId,
          claimerId,
          subjectId,
          keyPairId,
          type: payload.type,
          domain: payload.domain,
          claim: payload.claim,
          signatureBase64: signature,
          payloadHash,
          timestamp: payload.timestamp || new Date().toISOString(),
          status: "active",
          metadata: payload.metadata || null,
        })
        .returning();

      return attestation as AttestationRecord;
    },

    async verifyAttestation(signature, payload, publicKey) {
      const payloadString = JSON.stringify(payload);
      const isValid = verifyEd25519Signature(signature, payloadString, publicKey);

      return {
        isValid,
        timestamp: new Date().toISOString(),
        errorMessage: isValid ? undefined : "Signature verification failed",
      } as VerificationResult;
    },

    async getAttestationsBySubject(companyId, subjectId, status) {
      const whereConditions = [
        eq(attestations.companyId, companyId),
        eq(attestations.subjectId, subjectId),
      ];
      if (status) {
        whereConditions.push(eq(attestations.status, status));
      }

      const result = await db
        .select()
        .from(attestations)
        .where(and(...whereConditions))
        .orderBy(desc(attestations.timestamp));

      return result as AttestationRecord[];
    },

    async getAttestationsByClaimer(companyId, claimerId, status) {
      const whereConditions = [
        eq(attestations.companyId, companyId),
        eq(attestations.claimerId, claimerId),
      ];
      if (status) {
        whereConditions.push(eq(attestations.status, status));
      }

      const result = await db
        .select()
        .from(attestations)
        .where(and(...whereConditions))
        .orderBy(desc(attestations.timestamp));

      return result as AttestationRecord[];
    },

    async revokeAttestation(attestationId, reason) {
      await db
        .update(attestations)
        .set({
          status: "revoked",
          revocationReason: reason,
          revokedAt: new Date(),
        })
        .where(eq(attestations.id, attestationId));
    },
  };
}

/**
 * Build Verifiable Credential Service
 */
export function buildVerifiableCredentialService(db: Db): VerifiableCredentialService {
  return {
    async createVerifiableCredential(companyId, issuerId, subjectId, credential) {
      const [vc] = await db
        .insert(verifiableCredentials)
        .values({
          companyId,
          credentialId: credential.id || `vc:${randomUUID()}`,
          issuerId,
          subjectId,
          credentialTypes: credential.type,
          credentialSubject: credential.credentialSubject,
          proof: credential.proof || null,
          metadata: credential.metadata || null,
          status: credential.status || "active",
          issuedAt: credential.issuanceDate || new Date().toISOString(),
          expiresAt: credential.expirationDate || null,
          revokedAt: null,
        })
        .returning();

      return vc as StoredVerifiableCredential;
    },

    async verifyCredential(credential, issuerPublicKey) {
      if (!credential.proof?.jws) {
        return {
          isValid: false,
          timestamp: new Date().toISOString(),
          errorMessage: "Missing proof signature",
        } as VerificationResult;
      }

      const proofString = JSON.stringify({
        type: credential.proof.type,
        created: credential.proof.created,
        proofPurpose: credential.proof.proofPurpose,
        verificationMethod: credential.proof.verificationMethod,
      });

      const isValid = verifyEd25519Signature(
        credential.proof.jws,
        proofString,
        issuerPublicKey,
      );

      return {
        isValid,
        timestamp: new Date().toISOString(),
        errorMessage: isValid ? undefined : "Credential signature verification failed",
      } as VerificationResult;
    },

    async getCredentialsBySubject(companyId, subjectId) {
      const result = await db
        .select()
        .from(verifiableCredentials)
        .where(
          and(
            eq(verifiableCredentials.companyId, companyId),
            eq(verifiableCredentials.subjectId, subjectId),
            eq(verifiableCredentials.status, "active"),
          ),
        )
        .orderBy(desc(verifiableCredentials.issuedAt));

      return result as StoredVerifiableCredential[];
    },

    async revokeCredential(credentialId, reason) {
      await db
        .update(verifiableCredentials)
        .set({
          status: "revoked",
          revocationReason: reason,
          revokedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(verifiableCredentials.id, credentialId));
    },
  };
}

/**
 * Build Identity Linkage Service
 */
export function buildIdentityLinkageService(db: Db): IdentityLinkageService {
  return {
    async createLinkage(companyId, agentId, provider, providerIdentityId, verificationMethod) {
      const [linkage] = await db
        .insert(identityLinkages)
        .values({
          companyId,
          agentId,
          provider,
          providerIdentityId,
          publicKeySpkiDerBase64: null,
          verificationStatus: "pending",
          verificationMethod: verificationMethod || null,
          providerMetadata: null,
          isAuthoritative: false,
        })
        .returning();

      return linkage as IdentityLinkage;
    },

    async verifyLinkage(linkageId, providerData) {
      const [updated] = await db
        .update(identityLinkages)
        .set({
          verificationStatus: "verified",
          verifiedAt: new Date(),
          providerMetadata: providerData,
          isAuthoritative:
            providerData.isAuthoritative !== undefined ? providerData.isAuthoritative : false,
        })
        .where(eq(identityLinkages.id, linkageId))
        .returning();

      return updated as IdentityLinkage;
    },

    async getLinkageByProvider(companyId, agentId, provider) {
      const [linkage] = await db
        .select()
        .from(identityLinkages)
        .where(
          and(
            eq(identityLinkages.companyId, companyId),
            eq(identityLinkages.agentId, agentId),
            eq(identityLinkages.provider, provider),
          ),
        )
        .limit(1);

      return linkage || null;
    },

    async getAuthoritativeLinkage(companyId, agentId) {
      const [linkage] = await db
        .select()
        .from(identityLinkages)
        .where(
          and(
            eq(identityLinkages.companyId, companyId),
            eq(identityLinkages.agentId, agentId),
            eq(identityLinkages.isAuthoritative, true),
          ),
        )
        .limit(1);

      return linkage || null;
    },
  };
}
