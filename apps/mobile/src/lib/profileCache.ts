import type { ProfileData, ProfileTicket } from './profileTypes';

type ProfileReactions = { fire: number; eyes: number; heart: number };

type ReferralData = {
  referral_code: string;
  referral_count: number;
  conversions: number;
};

export type ProfileCacheSnapshot = {
  profile: ProfileData | null;
  tickets: ProfileTicket[];
  reactions: ProfileReactions;
  referral: ReferralData | null;
};

let cache: ProfileCacheSnapshot | null = null;

export function readProfileCache(): ProfileCacheSnapshot | null {
  return cache;
}

export function writeProfileCache(partial: Partial<ProfileCacheSnapshot>): void {
  cache = {
    profile: partial.profile ?? cache?.profile ?? null,
    tickets: partial.tickets ?? cache?.tickets ?? [],
    reactions: partial.reactions ?? cache?.reactions ?? { fire: 0, eyes: 0, heart: 0 },
    referral: partial.referral !== undefined ? partial.referral : (cache?.referral ?? null),
  };
}

export function patchProfileCache(profile: Partial<ProfileData>): void {
  if (!cache?.profile) return;
  cache = { ...cache, profile: { ...cache.profile, ...profile } };
}

export function clearProfileCache(): void {
  cache = null;
}

export const PROFILE_UPDATED_EVENT = 'hof:profile-updated';

export function notifyProfileUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
}
