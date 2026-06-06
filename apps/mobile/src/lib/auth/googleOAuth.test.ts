import { describe, expect, it } from 'vitest';
import {
  avatarUrlFromGoogleMetadata,
  buildAuthCallbackUrl,
  displayNameFromGoogleMetadata,
  sanitizeAuthNext,
} from './googleOAuth';

describe('sanitizeAuthNext', () => {
  it('defaults empty to home', () => {
    expect(sanitizeAuthNext('')).toBe('/');
  });

  it('rejects protocol-relative paths', () => {
    expect(sanitizeAuthNext('//evil.com')).toBe('/');
  });

  it('allows in-app paths', () => {
    expect(sanitizeAuthNext('/onboarding?oauth=complete')).toBe('/onboarding?oauth=complete');
  });
});

describe('buildAuthCallbackUrl', () => {
  it('includes next and flow in callback URL', () => {
    const url = buildAuthCallbackUrl({
      origin: 'http://localhost:3000',
      next: '/',
      flow: 'sign_in',
    });
    expect(url).toBe(
      'http://localhost:3000/auth/callback/client?next=%2F&flow=sign_in',
    );
  });

  it('encodes onboarding return path', () => {
    const url = buildAuthCallbackUrl({
      origin: 'https://houseoffire.events',
      next: '/onboarding?oauth=complete',
      flow: 'sign_up',
    });
    expect(url).toContain('next=%2Fonboarding%3Foauth%3Dcomplete');
    expect(url).toContain('flow=sign_up');
  });
});

describe('displayNameFromGoogleMetadata', () => {
  it('prefers full_name from Google metadata', () => {
    expect(
      displayNameFromGoogleMetadata({ full_name: 'Alex Rivera' }, 'alex@example.com'),
    ).toBe('Alex Rivera');
  });

  it('falls back to email prefix', () => {
    expect(displayNameFromGoogleMetadata({}, 'alex@example.com')).toBe('alex');
  });

  it('combines given and family names', () => {
    expect(
      displayNameFromGoogleMetadata({ given_name: 'Alex', family_name: 'Rivera' }, null),
    ).toBe('Alex Rivera');
  });
});

describe('avatarUrlFromGoogleMetadata', () => {
  it('reads avatar_url or picture', () => {
    expect(avatarUrlFromGoogleMetadata({ avatar_url: 'https://cdn.example/a.png' })).toBe(
      'https://cdn.example/a.png',
    );
    expect(avatarUrlFromGoogleMetadata({ picture: 'https://cdn.example/b.png' })).toBe(
      'https://cdn.example/b.png',
    );
  });

  it('returns null when missing', () => {
    expect(avatarUrlFromGoogleMetadata({})).toBeNull();
  });
});
