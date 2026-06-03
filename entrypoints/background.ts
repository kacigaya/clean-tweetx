import { defineBackground, browser } from '#imports';
import { settings } from '@/utils/settings';

export default defineBackground(() => {
  function updateBadge(enabled: boolean): void {
    browser.action.setBadgeText({ text: enabled ? '' : 'OFF' });
    browser.action.setBadgeBackgroundColor({ color: '#666' });
  }

  // Popup owns the toggle; just keep the OFF badge in sync with storage.
  settings.enabled.getValue().then(updateBadge);
  settings.enabled.watch(updateBadge);
});
