/**
 * Community board — nav tab, feeds, /community routes, and related settings.
 *
 * Set to `true` to re-enable everywhere. Search the repo for `COMMUNITY_FEATURE_ENABLED`.
 */
export const COMMUNITY_FEATURE_ENABLED = true;

/** Nav ids hidden when Community is disabled. */
export const COMMUNITY_EXCLUDED_NAV_IDS = COMMUNITY_FEATURE_ENABLED
  ? ([] as const)
  : (['community'] as const);
