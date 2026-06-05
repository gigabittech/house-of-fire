import CommunityScreen from '../../screens/CommunityScreen';
import { CommunityFeatureGate } from '@/components/CommunityFeatureGate';

export default function Page() {
  return (
    <CommunityFeatureGate>
      <CommunityScreen />
    </CommunityFeatureGate>
  );
}
