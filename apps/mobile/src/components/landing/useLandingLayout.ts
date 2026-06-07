'use client';

export const landingColumnClassName = 'hof-landing-column';

/** Shared horizontal track — every landing section uses this for aligned edges. */
export function useLandingLayout() {
  return { pageColumnClassName: landingColumnClassName };
}
