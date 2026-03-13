// Clean TweetX — Background service worker for enable/disable toggle

chrome.action.onClicked.addListener(async (tab) => {
  const { enabled } = await chrome.storage.local.get({ enabled: true });
  const newState = !enabled;
  await chrome.storage.local.set({ enabled: newState });

  updateBadge(newState);

  const tabs = await chrome.tabs.query({ url: ["https://x.com/*", "https://twitter.com/*"] });
  for (const t of tabs) {
    chrome.tabs.sendMessage(t.id, { type: "cleantweetx-toggle", enabled: newState }).catch(() => {});
  }
});

function updateBadge(enabled) {
  chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
  chrome.action.setBadgeBackgroundColor({ color: "#666" });
}

// Set initial badge on startup
chrome.storage.local.get({ enabled: true }, ({ enabled }) => {
  updateBadge(enabled);
});
