const HASH_PREFIX = 'sha256:';

export const hashPassword = async (password: string): Promise<string> => {
  if (!password) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  const hex = Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return HASH_PREFIX + hex;
};

export const isHashed = (password: string): boolean =>
  typeof password === 'string' && password.startsWith(HASH_PREFIX);

export const verifyPassword = async (plaintext: string, stored: string): Promise<boolean> => {
  if (!stored || !plaintext) return false;
  if (isHashed(stored)) {
    return (await hashPassword(plaintext)) === stored;
  }
  return plaintext === stored;
};
