import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Clean TweetX',
    description:
      'Cleans up X (Twitter) by hiding the sidebar, promoted tweets, Grok AI, and premium upsells.',
    permissions: ['storage'],
    action: {},
    icons: {
      16: 'icon/16.png',
      48: 'icon/48.png',
      128: 'icon/128.png',
    },
  },
});
