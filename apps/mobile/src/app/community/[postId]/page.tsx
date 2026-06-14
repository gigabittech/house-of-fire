import { use } from 'react';
import { CommunityFeatureGate } from '@/components/CommunityFeatureGate';
import PostScreen from '../../../screens/PostScreen';

interface Props {
  params: Promise<{ postId: string }>;
}

export default function Page({ params }: Props) {
  const { postId } = use(params);
  return (
    <CommunityFeatureGate>
      <PostScreen key={postId} postId={postId} />
    </CommunityFeatureGate>
  );
}
