// Shared settings. Every feature defaults true (hidden) → no async wait, no flash on load.
import { storage } from '#imports';

export type FeatureKey =
  | 'sidebar'
  | 'promoted'
  | 'grok'
  | 'premium'
  | 'creatorStudio'
  | 'verifiedOrgs';

export type SettingKey = 'enabled' | FeatureKey;

export type FeatureDescriptor = {
  key: FeatureKey;
  label: string;
  description: string;
};

export const FEATURES: FeatureDescriptor[] = [
  {
    key: 'sidebar',
    label: 'Right sidebar',
    description: 'Trending, who to follow, promotions',
  },
  {
    key: 'promoted',
    label: 'Promoted tweets',
    description: 'Ads detected as you scroll',
  },
  {
    key: 'grok',
    label: 'Grok AI',
    description: 'Nav link, drawer, image gen, actions',
  },
  {
    key: 'premium',
    label: 'Premium upsells',
    description: 'Signup links, tabs, subscription modals',
  },
  {
    key: 'creatorStudio',
    label: 'Creator Studio',
    description: 'Nav link',
  },
  {
    key: 'verifiedOrgs',
    label: 'Verified Organizations',
    description: 'Nav link',
  },
];

// Class added to <html> when a feature is OFF (opt-out). Static CSS hides by default.
export const SHOW_CLASS: Record<FeatureKey, string> = {
  sidebar: 'ctx-show-sidebar',
  promoted: 'ctx-show-promoted',
  grok: 'ctx-show-grok',
  premium: 'ctx-show-premium',
  creatorStudio: 'ctx-show-creator-studio',
  verifiedOrgs: 'ctx-show-verified-orgs',
};

export const DISABLED_CLASS = 'cleantweetx-disabled';

// Helper keeps the `fallback` overload so getValue()/watch() type as boolean, not boolean | null.
function flag(key: SettingKey) {
  return storage.defineItem<boolean>(`local:${key}`, { fallback: true });
}

type Item = ReturnType<typeof flag>;

export const settings: Record<SettingKey, Item> = {
  enabled: flag('enabled'),
  sidebar: flag('sidebar'),
  promoted: flag('promoted'),
  grok: flag('grok'),
  premium: flag('premium'),
  creatorStudio: flag('creatorStudio'),
  verifiedOrgs: flag('verifiedOrgs'),
};

export type SettingsState = Record<SettingKey, boolean>;

export async function readAllSettings(): Promise<SettingsState> {
  const entries = await Promise.all(
    (Object.keys(settings) as SettingKey[]).map(
      async (key) => [key, await settings[key].getValue()] as const,
    ),
  );
  return Object.fromEntries(entries) as SettingsState;
}
