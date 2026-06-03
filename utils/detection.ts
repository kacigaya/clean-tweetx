// Pure DOM detection for promoted tweets + premium modals. No global access at import → unit-testable.

// "Promoted"/"Ad" label text in supported languages.
export const PROMOTED_LABELS = [
  'promoted',
  'ad',
  'sponsorise',
  'promocionado',
  'gesponsert',
  'sponsorizzato',
  'promovido',
];

export const CELL_SELECTOR = '[data-testid="cellInnerDiv"]';
export const MODAL_SELECTOR =
  'aside[aria-label="Subscribe to Premium"], [data-testid="sheetDialog"]';
export const HIDDEN_ATTR = 'data-cleantweetx-hidden';

// Language-independent fingerprint of the promoted/ad icon.
export const PROMOTED_SVG_PATH =
  'M20.75 2H3.25C2.007 2 1 3.007 1 4.25v15.5C1 20.993 2.007 22 3.25 22h17.5c1.243 0 2.25-1.007 2.25-2.25V4.25C22 3.007 20.993 2 20.75 2';

export const PREMIUM_HINT_SELECTORS = [
  'a[href*="/i/premium"]',
  'a[href*="/i/premium_sign_up"]',
  'a[href*="/i/verified-orgs-signup"]',
  'a[href*="/i/verified-organizations"]',
  '[data-testid="premium-signup-tab"]',
  '[data-testid="premium-business-signup-tab"]',
];

export const PREMIUM_TEXT_PATTERNS = [
  /subscribe to premium/,
  /upgrade to premium/,
  /try premium/,
  /premium\+/,
  /get verified/,
  /join premium/,
  /unlock premium/,
  /subscribe now/,
  /abonnez-vous a premium/,
  /passer a premium/,
  /obtenez la certification/,
  /suscribete a premium/,
  /subscribete a premium/,
  /mejora a premium/,
  /hazte premium/,
  /obten la verificacion/,
  /jetzt premium abonnieren/,
  /auf premium upgraden/,
  /lass dich verifizieren/,
  /abbonati a premium/,
  /passa a premium/,
  /ottieni la verifica/,
  /assine premium/,
  /faca upgrade para premium/,
  /faca o upgrade para premium/,
  /obtenha verificacao/,
];

export function NormalizeText(text: string | null | undefined): string {
  return (text || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function IsElement(node: Node | null | undefined): node is Element {
  return Boolean(node && node.nodeType === Node.ELEMENT_NODE);
}

export function ToElement(node: Node | null | undefined): Element | null {
  if (IsElement(node)) return node;
  return node?.parentElement || null;
}

export function CollectCandidates(
  element: Element | null,
  selector: string,
): Set<Element> {
  const matches = new Set<Element>();

  if (!element) return matches;

  if (element.matches(selector)) {
    matches.add(element);
  }

  const closest = element.closest(selector);
  if (closest) {
    matches.add(closest);
  }

  const descendants = Array.from(element.querySelectorAll(selector));
  for (const descendant of descendants) {
    matches.add(descendant);
  }

  return matches;
}

export function CellContainsPromotedContent(cell: Element): boolean {
  const spans = Array.from(cell.querySelectorAll('span'));
  for (const span of spans) {
    const text = NormalizeText(span.textContent);
    if (PROMOTED_LABELS.includes(text)) {
      return true;
    }
  }

  const svgs = Array.from(cell.querySelectorAll('svg'));
  for (const svg of svgs) {
    if (svg.innerHTML.includes(PROMOTED_SVG_PATH)) {
      return true;
    }
  }

  return false;
}

export function HideElement(element: Element): void {
  element.setAttribute(HIDDEN_ATTR, '1');

  const styleTarget = element as Element & {
    style?: {
      display?: string;
    };
  };

  if (styleTarget.style) {
    styleTarget.style.display = 'none';
    return;
  }

  if (typeof HTMLElement !== 'undefined' && element instanceof HTMLElement) {
    element.style.display = 'none';
    return;
  }

  element.setAttribute('style', 'display: none;');
}

export function ScanCell(cell: Element | null): boolean {
  if (!cell || cell.getAttribute(HIDDEN_ATTR) === '1') return false;

  if (CellContainsPromotedContent(cell)) {
    HideElement(cell);
    return true;
  }

  return false;
}

export function ShouldHidePremiumModal(modal: Element | null): boolean {
  if (!modal) return false;

  if (modal.matches('aside[aria-label="Subscribe to Premium"]')) {
    return true;
  }

  for (const selector of PREMIUM_HINT_SELECTORS) {
    if (modal.querySelector(selector)) {
      return true;
    }
  }

  const text = NormalizeText(modal.textContent);
  return PREMIUM_TEXT_PATTERNS.some((pattern) => pattern.test(text));
}

export function HidePremiumModal(modal: Element): boolean {
  if (modal.getAttribute(HIDDEN_ATTR) === '1') return false;
  if (!ShouldHidePremiumModal(modal)) return false;

  HideElement(modal);
  return true;
}

export type ProcessorFlags = {
  promoted: boolean;
  premium: boolean;
};

export type Processor = ReturnType<typeof CreateProcessor>;

// Batches observer work into one rAF pass. Reads `flags` live so toggles apply without reload.
export function CreateProcessor(doc: Document, flags: ProcessorFlags) {
  let pending = false;
  let fullScanRequested = false;
  const dirtyCells = new Set<Element>();
  const dirtyModals = new Set<Element>();

  function QueueElementWork(element: Element | null): void {
    for (const cell of CollectCandidates(element, CELL_SELECTOR)) {
      dirtyCells.add(cell);
    }

    for (const modal of CollectCandidates(element, MODAL_SELECTOR)) {
      dirtyModals.add(modal);
    }
  }

  function ProcessMutations(): void {
    pending = false;

    const cells = fullScanRequested
      ? Array.from(doc.querySelectorAll(CELL_SELECTOR))
      : Array.from(dirtyCells);
    const modals = fullScanRequested
      ? Array.from(doc.querySelectorAll(MODAL_SELECTOR))
      : Array.from(dirtyModals);

    dirtyCells.clear();
    dirtyModals.clear();
    fullScanRequested = false;

    if (flags.promoted) {
      for (const cell of cells) {
        ScanCell(cell);
      }
    }

    if (flags.premium) {
      for (const modal of modals) {
        HidePremiumModal(modal);
      }
    }
  }

  function ScheduleProcessing(): void {
    if (!pending) {
      pending = true;
      requestAnimationFrame(ProcessMutations);
    }
  }

  function RequestFullScan(): void {
    fullScanRequested = true;
    ScheduleProcessing();
  }

  function HandleMutations(mutations: MutationRecord[]): void {
    for (const mutation of mutations) {
      QueueElementWork(ToElement(mutation.target));

      for (const node of Array.from(mutation.addedNodes)) {
        QueueElementWork(ToElement(node));
      }
    }

    ScheduleProcessing();
  }

  return {
    HandleMutations,
    ProcessMutations,
    QueueElementWork,
    RequestFullScan,
  };
}

export function ShowHiddenElements(doc: Document): void {
  const hidden = doc.querySelectorAll(`[${HIDDEN_ATTR}="1"]`);
  for (const el of Array.from(hidden)) {
    el.removeAttribute(HIDDEN_ATTR);
    if (el instanceof HTMLElement) {
      el.style.display = '';
    } else {
      el.removeAttribute('style');
    }
  }
}
