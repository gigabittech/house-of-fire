export interface VapidConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export class PushConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PushConfigError';
  }
}

export function readVapidConfigFromEnv(env: NodeJS.ProcessEnv = process.env): VapidConfig {
  const publicKey = env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? env.VAPID_PUBLIC_KEY?.trim();
  const privateKey = env.VAPID_PRIVATE_KEY?.trim();
  const subject = env.VAPID_SUBJECT?.trim() ?? 'mailto:tickets@houseoffire.club';

  if (!publicKey || !privateKey) {
    throw new PushConfigError(
      'VAPID keys are not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.',
    );
  }

  return { publicKey, privateKey, subject };
}

export function isVapidConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    readVapidConfigFromEnv(env);
    return true;
  } catch {
    return false;
  }
}
