// @hof/ui — House of Fire component library, productionized from the prototype
// (design/prototypes/hof-ui.jsx + posts-data.jsx). Consumes @hof/design-tokens.

export type { EmptyStateProps } from './EmptyState';
export { EmptyState } from './EmptyState';
export type { ErrorStateProps } from './ErrorState';
export { ErrorState } from './ErrorState';
export type { FakeQRProps } from './FakeQR';
export { FakeQR } from './FakeQR';
export { FeedSkeletonCard } from './FeedSkeletonCard';
export type { AvatarProps } from './feed/Avatar';
export { Avatar } from './feed/Avatar';
export type { ChannelTagProps } from './feed/ChannelTag';
export { ChannelTag } from './feed/ChannelTag';
export type { FeedPostProps } from './feed/FeedPost';
// Feed / community atoms
export { FeedPost } from './feed/FeedPost';
export type { ReactionStripProps } from './feed/ReactionStrip';
export { ReactionStrip } from './feed/ReactionStrip';
export { REACTION_EMOJI, totalReactions } from './feed/reactions';
export type {
  Channel,
  Post,
  PostAuthor,
  PostKind,
  ReactionKey,
  Reply,
  UserRole,
} from './feed/types';
export type { HofAppShellProps, HofContentProps } from './HofAppShell';
export { HofAppShell, HofContent } from './HofAppShell';
export type { HofBottomNavProps, NavId } from './HofBottomNav';
export { HofBottomNav } from './HofBottomNav';
export type { ButtonSize, ButtonVariant, HofButtonProps } from './HofButton';
export { HofButton } from './HofButton';
export type { HofCardProps } from './HofCard';
export { HofCard } from './HofCard';
export type { HofConfirmProps } from './HofConfirm';
export { HofConfirm } from './HofConfirm';
export type { HofLogoMarkProps } from './HofLogoMark';
export { HofLogoMark } from './HofLogoMark';
export type { HofPhotoProps } from './HofPhoto';
export { HofPhoto } from './HofPhoto';
export type { HofPillProps, PillSize, PillTone } from './HofPill';
export { HofPill } from './HofPill';
export type { HofScreenProps, HofScrollProps } from './HofScreen';
export { HofHomeSpacer, HofScreen, HofScroll, HofStatusbarSpacer } from './HofScreen';
export type { HofSkeletonProps } from './HofSkeleton';
export { HofSkeleton } from './HofSkeleton';
export type { HofToastProps, ToastKind } from './HofToast';
export { HofToast } from './HofToast';
export type { HofTopBarProps } from './HofTopBar';
export { HofTopBar } from './HofTopBar';
export type { HofWordmarkProps } from './HofWordmark';
export { HofWordmark } from './HofWordmark';
export type { IconName, IconProps } from './Icon';
export { Icon } from './Icon';
export type { PhotoPlaceholderProps } from './PhotoPlaceholder';
export { PhotoPlaceholder } from './PhotoPlaceholder';
export type { Breakpoint } from './useBreakpoint';
export { useBreakpoint, useResponsive } from './useBreakpoint';
