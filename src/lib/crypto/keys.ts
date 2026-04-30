import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM Verschlüsselung für User-API-Keys.
 *
 * Master-Key liegt in env (`API_KEY_ENCRYPTION_SECRET`) als 64-stelliger
 * Hex-String (= 32 Byte). Generieren via:
 *   `openssl rand -hex 32`
 *
 * Pro Key wird ein frischer 12-Byte-IV erzeugt. Auth-Tag separat gespeichert.
 */

const ALGO = "aes-256-gcm" as const;
const IV_LENGTH = 12;

function getMasterKey(): Buffer {
  const hex = process.env.API_KEY_ENCRYPTION_SECRET;
  if (!hex) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET fehlt in env. Erzeuge mit `openssl rand -hex 32`.",
    );
  }
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error("API_KEY_ENCRYPTION_SECRET muss 64 Hex-Zeichen lang sein (= 32 Byte).");
  }
  return Buffer.from(hex, "hex");
}

export type EncryptedPayload = {
  encrypted_key: string; // base64
  iv: string; // base64
  auth_tag: string; // base64
};

export function encryptApiKey(plaintext: string): EncryptedPayload {
  const masterKey = getMasterKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGO, masterKey, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encrypted_key: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    auth_tag: authTag.toString("base64"),
  };
}

export function decryptApiKey(payload: EncryptedPayload): string {
  const masterKey = getMasterKey();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.auth_tag, "base64");
  const encrypted = Buffer.from(payload.encrypted_key, "base64");
  const decipher = createDecipheriv(ALGO, masterKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

export function keyHint(plaintext: string): string {
  const trimmed = plaintext.trim();
  return trimmed.length <= 4 ? trimmed : trimmed.slice(-4);
}
