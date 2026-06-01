// @hof/ui — House of Fire component library, productionized from the prototype
// (design/prototypes/hof-ui.jsx + posts-data.jsx). Consumes @hof/design-tokens.

export { Icon } from './Icon.js';
export type { IconName, IconProps } from './Icon.js';
export { HofButton } from './HofButton.js';
export type { HofButtonProps, ButtonVariant, ButtonSize } from './HofButton.js';
export { HofPill } from './HofPill.js';
export type { HofPillProps, PillTone, PillSize } from './HofPill.js';
export { HofCard } from './HofCard.js';
export type { HofCardProps } from './HofCard.js';
export { HofLogoMark } from './HofLogoMark.js';
export type { HofLogoMarkProps } from './HofLogoMark.js';
export { HofWordmark } from './HofWordmark.js';
export type { HofWordmarkProps } from './HofWordmark.js';
export { HofPhoto } from './HofPhoto.js';
export type { HofPhotoProps } from './HofPhoto.js';
export { PhotoPlaceholder } from './PhotoPlaceholder.js';
export type { PhotoPlaceholderProps } from './PhotoPlaceholder.js';
export { FakeQR } from './FakeQR.js';
export type { FakeQRProps } from './FakeQR.js';
export { HofBottomNav } from './HofBottomNav.js';
export type { HofBottomNavProps, NavId } from './HofBottomNav.js';
export { HofAppShell, HofContent } from './HofAppShell.js';
export type { HofAppShellProps, HofContentProps } from './HofAppShell.js';
export { useBreakpoint, useResponsive } from './useBreakpoint.js';
export type { Breakpoint } from './useBreakpoint.js';
export { HofTopBar } from './HofTopBar.js';
export type { HofTopBarProps } from './HofTopBar.js';
export { HofScreen, HofScroll, HofStatusbarSpacer, HofHomeSpacer } from './HofScreen.js';
export type { HofScreenProps, HofScrollProps } from './HofScreen.js';

export { HofSkeleton } from './HofSkeleton.js';
export type { HofSkeletonProps } from './HofSkeleton.js';
export { FeedSkeletonCard } from './FeedSkeletonCard.js';
export { EmptyState } from './EmptyState.js';
export type { EmptyStateProps } from './EmptyState.js';
export { ErrorState } from './ErrorState.js';
export type { ErrorStateProps } from './ErrorState.js';
export { HofToast } from './HofToast.js';
export type { HofToastProps, ToastKind } from './HofToast.js';
export { HofConfirm } from './HofConfirm.js';
export type { HofConfirmProps } from './HofConfirm.js';

// Feed / community atoms
export { FeedPost } from './feed/FeedPost.js';
export type { FeedPostProps } from './feed/FeedPost.js';
export { Avatar } from './feed/Avatar.js';
export type { AvatarProps } from './feed/Avatar.js';
export { ChannelTag } from './feed/ChannelTag.js';
export type { ChannelTagProps } from './feed/ChannelTag.js';
export { ReactionStrip } from './feed/ReactionStrip.js';
export type { ReactionStripProps } from './feed/ReactionStrip.js';
export { REACTION_EMOJI, totalReactions } from './feed/reactions.js';
export type {
  Post,
  PostAuthor,
  PostKind,
  Channel,
  Reply,
  ReactionKey,
  UserRole,
} from './feed/types.js';
