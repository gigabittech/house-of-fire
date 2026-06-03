import { use } from 'react';
import PostScreen from '../../../screens/PostScreen';

interface Props {
  params: Promise<{ postId: string }>;
}

export default function Page({ params }: Props) {
  const { postId } = use(params);
  return <PostScreen postId={postId} />;
}
