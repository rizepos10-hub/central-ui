// ⚠️ TEMPORARY local QZ Tray signing (no backend required).
//
// This bundles a self-signed certificate AND its private key in the frontend so the app can sign QZ Tray
// requests in-browser TODAY, which makes QZ's "Remember this decision" checkbox available. Signing uses the
// browser-native Web Crypto API (RSASSA-PKCS1-v1_5 + SHA-512) — no third-party dependency.
//
// SECURITY: a private key in frontend code is downloadable by anyone. This is acceptable only as an interim
// measure for a trusted internal POS deployment. The production path is backend signing — see
// QZ-TRAY-TRUST.md. `qz-trust.ts` automatically prefers the backend signing endpoint when it is available,
// so deploying the backend later transparently retires this file's key.
//
// The key below is dedicated to QZ print-signing only (it authorises nothing else). Rotate it by generating
// a new pair (see QZ-TRAY-TRUST.md) and replacing both constants.

export const LOCAL_QZ_CERTIFICATE = `-----BEGIN CERTIFICATE-----
MIIDBTCCAe2gAwIBAgIUOoXLOJKQVAQ8IKSmgpH0opN3FMkwDQYJKoZIhvcNAQEL
BQAwKzESMBAGA1UEAwwJSGF5YW4gUE9TMRUwEwYDVQQKDAxIYXlhbiBSZXRhaWww
HhcNMjYwNjI1MTgzNDI0WhcNNDYwNjIwMTgzNDI0WjArMRIwEAYDVQQDDAlIYXlh
biBQT1MxFTATBgNVBAoMDEhheWFuIFJldGFpbDCCASIwDQYJKoZIhvcNAQEBBQAD
ggEPADCCAQoCggEBALTLQW/Hg4Wx6mMeK7yFfECkexJ2FmLZs2/h1X2muYbam+Uc
3vbfW6Isp5tNjN2iBQfjJ7i80sT99kFSXm3/ZTyBN1ll5VLzA1770ah7mTDhroFM
J780RPic1RbdmXqA+74hO/TIexk7ln8GQt5lxHRWsB7Q3/Doy5nvFYKDYkzFpz79
L5xtr63Zje1K5Nw3DlmwImDpa0EZiMrq9NghfheF5M8c/4TMXbcJhyeztOJ6uBT5
30gk/BYlV5yNo9K0EZIfKbXi3Y2r2If7M74nijx0jWQfTT5XmtxmHKbioRkz8V4D
LKIMYWK/pwEa5W7VGZCqca+4oC7d6vURixeTJP0CAwEAAaMhMB8wHQYDVR0OBBYE
FOr4X/PoTEbpfSuz00NR5HZEhc5fMA0GCSqGSIb3DQEBCwUAA4IBAQBNGYXN4nOq
VD/qxN3+rVftzYLXOrZulZRAWwrq947ar711VxIJmWgGUfFEG5wT5MIr177iychI
d9O7UTFBjUqT+S2nsUsDnD8FdMhCWLL/VeAROTB6YRHHPYyWj16LtIHvsXYERn+/
QR/dJ8cnHpwiBnYNDca4ZsF4VHChgTC2NlNiJQZ2hEYb2liyLbhM8X43XCfdaGfZ
VQwn+BoJc8OuYsfXsrH/Q9j4DWON5QF7wHQcnI3uUNE3pgTGzqmxHatmZJPl/iZH
oMsva7BIwtJti6Oh5l/c0mbtDPSzzkwYhKFrsSMRWUs0b97JeDRhkkrxzSrUUrpx
bQq0J5cI8ilZ
-----END CERTIFICATE-----`;

const LOCAL_QZ_PRIVATE_KEY_PKCS8 = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC0y0Fvx4OFsepj
Hiu8hXxApHsSdhZi2bNv4dV9prmG2pvlHN7231uiLKebTYzdogUH4ye4vNLE/fZB
Ul5t/2U8gTdZZeVS8wNe+9Goe5kw4a6BTCe/NET4nNUW3Zl6gPu+ITv0yHsZO5Z/
BkLeZcR0VrAe0N/w6MuZ7xWCg2JMxac+/S+cba+t2Y3tSuTcNw5ZsCJg6WtBGYjK
6vTYIX4XheTPHP+EzF23CYcns7TiergU+d9IJPwWJVecjaPStBGSHym14t2Nq9iH
+zO+J4o8dI1kH00+V5rcZhym4qEZM/FeAyyiDGFiv6cBGuVu1RmQqnGvuKAu3er1
EYsXkyT9AgMBAAECggEAM6Hip8YucRWtDy6UJgxnPlzbCxwva36p6Ldxzac6T+GJ
6SZUJOQIGuou2cMNilRVpHmCpBdFCF5RIDmiXz6zjlKG2KCpnAVr/onjR/84ckXZ
nPJ/XXNTiT7c+mFCDkLc4mFCareAtGWYpuFGYpZkwybouHxFoFsTnnwxw+q6vZqv
FiQTGOZ6HVFCVsyrxdveBTNh4wNIgh4Z+YpNI5rnPhru/cY18s5Q4K7HJHq3p/CY
+zE6krq2xUHLERgUSNJxM4nR3NSRm9dpibsirNKn1GO4a7wTgxIq+3SEHe/f0DJK
ccLLC53PN7gL93UI9O3oxeJXPm5rIEoXed1O/YLznwKBgQD2QjL+ALonPJcEjuaG
Sb5mOlC6on+SAcRoXq45mlOePYBxvUk0dBXylCOUYWRNy/p68brbTuDMtcHVvJGH
IzDlYo1r6LXHY/i5rv7ugJtBsJJ9M8k3nxZ4K65zAjR6yUt2GQqXlQ5JB47e565b
D4GGAOiK8n2TTiZ+krWqcKnPWwKBgQC78hyzoSMfdGTTGtLgw3vTJSHhpfuOwLWE
/JaxypbDDZBFTQyfDoxBF0NeshGozPO8KL+jPPznQshEXFdS7RfsxOOlL68ye+Od
3wBTxEv+6xmlPHDuOKQurxw9vW/pkXUZy0iSjkie6TCGq/C0AgvAbW53FXT30Wo4
75W3SvokhwKBgQCGP/CsqJjTaySpR35FF07FTGVWWeBSKMR6YaN5o7iSO9UaLKcM
AX01ka0T50RXZSxYeg/0HzxOXYgejX6IvZaadu/CNEtlOAsQr2Yrf9EkLq6tst2v
hPsq6CVibYFOrw6Eg4JSwN/Y0FYDDyruWbWy6CveE/SBqckyl6iSEnmAoQKBgEl1
TPCMh5zQsmOsdUWyQiB5v+9hH5xhB9GNpByjcR+VmpDrl4ZHelwqioNll+9hA9bE
Gnrj6Hk/KeVGLj9UOeip38v9gj16HLHkqk0TSRy+qQxjPkRt0QYKHUCoXShuWNWX
Fatqf0nVHMlWRMMmlY9FdkqHEWuW5yyPv/WfEXvbAoGBAN9CewYMliKLuhHvbiNi
uzK9jsUNfy3wz6K2bcUaRKNewFiRBSr4VMGmYaKH2OGSfKvzrPplqznDeZUad1i2
NaJ8pXbs7BuOgi7X9nKqQBlsCd6VkYXqLcIdYz6OO0+vu5JbnT9tJDBi00rKjqu3
XG/OwYgefur5IrwDuMDVCxi1
-----END PRIVATE KEY-----`;

const pemBodyToArrayBuffer = (pem: string): ArrayBuffer => {
  const base64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

let signingKey: Promise<CryptoKey> | null = null;

const getSigningKey = (): Promise<CryptoKey> => {
  if (!signingKey) {
    signingKey = crypto.subtle.importKey(
      'pkcs8',
      pemBodyToArrayBuffer(LOCAL_QZ_PRIVATE_KEY_PKCS8),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-512' },
      false,
      ['sign']
    );
  }
  return signingKey;
};

export const signLocally = async (toSign: string): Promise<string> => {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(toSign));
  const bytes = new Uint8Array(signature);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};
