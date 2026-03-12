// Clean TweetX — Dynamic promoted tweet & modal hiding

(() => {
  const PROMOTED_LABELS = [
    "Promoted", "Ad",
    // French
    "Sponsorisé",
  ];

  const MARK_ATTR = "data-cleantweetx";

  // SVG path substring used in the promoted/ad icon (language-independent)
  const PROMOTED_SVG_PATH = "M20.75 2H3.25C2.007 2 1 3.007 1 4.25v15.5C1 20.993 2.007 22 3.25 22h17.5c1.243 0 2.25-1.007 2.25-2.25V4.25C22 3.007 20.993 2 20.75 2";

  let pending = false;

  function ScanCell(cell) {
    if (cell.hasAttribute(MARK_ATTR)) return;
    cell.setAttribute(MARK_ATTR, "1");

    // Check for promoted text spans
    const spans = cell.querySelectorAll("span");
    for (const span of spans) {
      const text = span.textContent.trim();
      if (PROMOTED_LABELS.includes(text)) {
        cell.style.display = "none";
        return;
      }
    }

    // Check for promoted SVG icon path (language-independent fallback)
    const svgs = cell.querySelectorAll("svg");
    for (const svg of svgs) {
      if (svg.innerHTML.includes(PROMOTED_SVG_PATH)) {
        cell.style.display = "none";
        return;
      }
    }
  }

  function HidePremiumModals() {
    const modals = document.querySelectorAll(
      'aside[aria-label="Subscribe to Premium"], [data-testid="sheetDialog"]'
    );
    for (const modal of modals) {
      if (!modal.hasAttribute(MARK_ATTR)) {
        modal.setAttribute(MARK_ATTR, "1");
        modal.style.display = "none";
      }
    }
  }

  function ProcessMutations() {
    pending = false;

    const cells = document.querySelectorAll(
      `[data-testid="cellInnerDiv"]:not([${MARK_ATTR}])`
    );
    for (const cell of cells) {
      ScanCell(cell);
    }

    HidePremiumModals();
  }

  function ScheduleProcessing() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(ProcessMutations);
    }
  }

  const observer = new MutationObserver(ScheduleProcessing);

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // Run once immediately in case content is already present
  ScheduleProcessing();
})();
