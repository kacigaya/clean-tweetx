import { defineContentScript } from '#imports';
import './style.css';
import {
  CreateProcessor,
  ShowHiddenElements,
  type Processor,
  type ProcessorFlags,
} from '@/utils/detection';
import {
  settings,
  FEATURES,
  SHOW_CLASS,
  DISABLED_CLASS,
  type FeatureKey,
} from '@/utils/settings';

export default defineContentScript({
  matches: ['*://x.com/*', '*://twitter.com/*'],
  runAt: 'document_start',
  cssInjectionMode: 'manifest',

  async main() {
    const doc = document;
    const root = doc.documentElement;

    // Mutable; processor closes over it, so toggling a flag changes hiding live.
    const flags: ProcessorFlags = { promoted: true, premium: true };

    let processor: Processor | null = null;
    let observer: MutationObserver | null = null;

    function startProcessor(): void {
      if (observer) return;
      processor = CreateProcessor(doc, flags);
      observer = new MutationObserver(processor.HandleMutations);
      observer.observe(root, { childList: true, subtree: true });
      processor.RequestFullScan();
    }

    function stopProcessor(): void {
      observer?.disconnect();
      observer = null;
      processor = null;
    }

    // `on` = hidden. Add opt-out class only when feature is OFF.
    function applyFeatureClass(key: FeatureKey, on: boolean): void {
      root.classList.toggle(SHOW_CLASS[key], !on);
    }

    function setMaster(enabled: boolean): void {
      if (enabled) {
        root.classList.remove(DISABLED_CLASS);
        startProcessor();
      } else {
        root.classList.add(DISABLED_CLASS);
        stopProcessor();
        ShowHiddenElements(doc);
      }
    }

    // Defaults are all true → no classes added, CSS keeps everything hidden, no flash.
    const initial = await Promise.all(
      FEATURES.map(async (f) => [f.key, await settings[f.key].getValue()] as const),
    );
    for (const [key, on] of initial) {
      applyFeatureClass(key, on);
      if (key === 'promoted') flags.promoted = on;
      if (key === 'premium') flags.premium = on;
    }

    const enabled = await settings.enabled.getValue();
    setMaster(enabled);

    settings.enabled.watch((value) => setMaster(value));

    for (const f of FEATURES) {
      settings[f.key].watch((value) => {
        applyFeatureClass(f.key, value);
        if (f.key === 'promoted') flags.promoted = value;
        if (f.key === 'premium') flags.premium = value;
        // Re-enabling a dynamic feature must sweep already-rendered content.
        if (value && (f.key === 'promoted' || f.key === 'premium')) {
          processor?.RequestFullScan();
        }
      });
    }
  },
});
