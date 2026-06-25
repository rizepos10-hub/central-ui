import qz from 'qz-tray';
import { LOCAL_QZ_CERTIFICATE, signLocally } from './qz-local-credentials';

const QZ_TRUST_BASE = '/api/qz-tray';
const CERTIFICATE_URL = `${QZ_TRUST_BASE}/certificate`;
const SIGN_URL = `${QZ_TRUST_BASE}/sign`;
const QZ_SIGNATURE_ALGORITHM = 'SHA512';

let configured = false;
type SigningMode = 'backend' | 'local';
let signingMode: SigningMode = 'local';
let certificate: string | undefined;
let trustRequest: Promise<string> | null = null;

const loadTrust = (): Promise<string> => {
  if (certificate !== undefined) return Promise.resolve(certificate);
  if (!trustRequest) {
    trustRequest = fetch(CERTIFICATE_URL, { headers: { Accept: 'text/plain' }, credentials: 'same-origin' })
      .then(res => (res.ok ? res.text() : null))
      .then(text => {
        if (text && text.includes('BEGIN CERTIFICATE')) {
          signingMode = 'backend';
          certificate = text.trim();
        } else {
          signingMode = 'local';
          certificate = LOCAL_QZ_CERTIFICATE;
        }
        return certificate;
      })
      .catch(() => {
        signingMode = 'local';
        certificate = LOCAL_QZ_CERTIFICATE;
        return certificate;
      });
  }
  return trustRequest;
};

const requestBackendSignature = async (toSign: string): Promise<string> => {
  const res = await fetch(SIGN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain', Accept: 'text/plain' },
    credentials: 'same-origin',
    body: toSign,
  });
  if (!res.ok) throw new Error(`QZ Tray signing endpoint returned ${res.status}`);
  return (await res.text()).trim();
};

export const configureQzTrust = (): void => {
  if (configured) return;
  configured = true;

  qz.security.setCertificatePromise((resolve: (v?: unknown) => void) => {
    loadTrust()
      .then(cert => resolve(cert))
      .catch(() => resolve(LOCAL_QZ_CERTIFICATE));
  });

  qz.security.setSignatureAlgorithm(QZ_SIGNATURE_ALGORITHM);

  qz.security.setSignaturePromise((toSign: string) => (resolve: (v?: unknown) => void, reject: (e?: unknown) => void) => {
    loadTrust()
      .then(() => (signingMode === 'backend' ? requestBackendSignature(toSign) : signLocally(toSign)))
      .then(resolve)
      .catch(reject);
  });
};
