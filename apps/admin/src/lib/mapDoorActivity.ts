export interface ActivityEntry {
  time: string;
  name: string;
  tier: string;
  action: 'checked_in' | 'sold' | 'denied';
  detail?: string;
}

export function activityFromScan(result: {
  ok: boolean;
  holderName?: string;
  tierName?: string;
  message?: string;
}): ActivityEntry {
  const now = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  if (result.ok) {
    return {
      time: now,
      name: result.holderName ?? 'Guest',
      tier: result.tierName ?? 'GA',
      action: 'checked_in',
    };
  }
  return {
    time: now,
    name: result.holderName ?? 'Unknown',
    tier: '—',
    action: 'denied',
    detail: result.message,
  };
}

export function activityFromSell(result: {
  holderName: string;
  tierName: string;
  qty: number;
}): ActivityEntry {
  const now = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return {
    time: now,
    name: result.holderName,
    tier: result.qty > 1 ? `${result.tierName} ×${result.qty}` : result.tierName,
    action: 'sold',
  };
}
