"use strict";
// Clean TweetX — Dynamic promoted tweet & modal hiding
const PROMOTED_LABELS = [
    "promoted",
    "ad",
    // French
    "sponsorise",
    // Spanish
    "promocionado",
    // German
    "gesponsert",
    // Italian
    "sponsorizzato",
    // Portuguese
    "promovido",
];
const CELL_SELECTOR = '[data-testid="cellInnerDiv"]';
const MODAL_SELECTOR = 'aside[aria-label="Subscribe to Premium"], [data-testid="sheetDialog"]';
const HIDDEN_ATTR = "data-cleantweetx-hidden";
// SVG path substring used in the promoted/ad icon (language-independent)
const PROMOTED_SVG_PATH = "M20.75 2H3.25C2.007 2 1 3.007 1 4.25v15.5C1 20.993 2.007 22 3.25 22h17.5c1.243 0 2.25-1.007 2.25-2.25V4.25C22 3.007 20.993 2 20.75 2";
const PREMIUM_HINT_SELECTORS = [
    'a[href*="/i/premium"]',
    'a[href*="/i/premium_sign_up"]',
    'a[href*="/i/verified-orgs-signup"]',
    'a[href*="/i/verified-organizations"]',
    '[data-testid="premium-signup-tab"]',
    '[data-testid="premium-business-signup-tab"]',
];
const PREMIUM_TEXT_PATTERNS = [
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
function NormalizeText(text) {
    return (text || "")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
}
function IsElement(node) {
    return Boolean(node && node.nodeType === Node.ELEMENT_NODE);
}
function ToElement(node) {
    if (IsElement(node))
        return node;
    return node?.parentElement || null;
}
function CollectCandidates(element, selector) {
    const matches = new Set();
    if (!element)
        return matches;
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
function CellContainsPromotedContent(cell) {
    const spans = Array.from(cell.querySelectorAll("span"));
    for (const span of spans) {
        const text = NormalizeText(span.textContent);
        if (PROMOTED_LABELS.includes(text)) {
            return true;
        }
    }
    const svgs = Array.from(cell.querySelectorAll("svg"));
    for (const svg of svgs) {
        if (svg.innerHTML.includes(PROMOTED_SVG_PATH)) {
            return true;
        }
    }
    return false;
}
function HideElement(element) {
    element.setAttribute(HIDDEN_ATTR, "1");
    const styleTarget = element;
    if (styleTarget.style) {
        styleTarget.style.display = "none";
        return;
    }
    if (typeof HTMLElement !== "undefined" && element instanceof HTMLElement) {
        element.style.display = "none";
        return;
    }
    element.setAttribute("style", "display: none;");
}
function ScanCell(cell) {
    if (!cell || cell.getAttribute(HIDDEN_ATTR) === "1")
        return false;
    if (CellContainsPromotedContent(cell)) {
        HideElement(cell);
        return true;
    }
    return false;
}
function ShouldHidePremiumModal(modal) {
    if (!modal)
        return false;
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
function HidePremiumModal(modal) {
    if (modal.getAttribute(HIDDEN_ATTR) === "1")
        return false;
    if (!ShouldHidePremiumModal(modal))
        return false;
    HideElement(modal);
    return true;
}
function CreateProcessor(doc) {
    let pending = false;
    let fullScanRequested = false;
    const dirtyCells = new Set();
    const dirtyModals = new Set();
    function QueueElementWork(element) {
        for (const cell of CollectCandidates(element, CELL_SELECTOR)) {
            dirtyCells.add(cell);
        }
        for (const modal of CollectCandidates(element, MODAL_SELECTOR)) {
            dirtyModals.add(modal);
        }
    }
    function ProcessMutations() {
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
        for (const cell of cells) {
            ScanCell(cell);
        }
        for (const modal of modals) {
            HidePremiumModal(modal);
        }
    }
    function ScheduleProcessing() {
        if (!pending) {
            pending = true;
            requestAnimationFrame(ProcessMutations);
        }
    }
    function RequestFullScan() {
        fullScanRequested = true;
        ScheduleProcessing();
    }
    function HandleMutations(mutations) {
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
function SetEnabled(doc, enabled) {
    if (enabled) {
        doc.documentElement.classList.remove("cleantweetx-disabled");
    }
    else {
        doc.documentElement.classList.add("cleantweetx-disabled");
    }
}
function ShowHiddenElements(doc) {
    const hidden = doc.querySelectorAll(`[${HIDDEN_ATTR}="1"]`);
    for (const el of Array.from(hidden)) {
        el.removeAttribute(HIDDEN_ATTR);
        if (el instanceof HTMLElement) {
            el.style.display = "";
        }
        else {
            el.removeAttribute("style");
        }
    }
}
function Boot(doc) {
    const processor = CreateProcessor(doc);
    const observer = new MutationObserver(processor.HandleMutations);
    observer.observe(doc.documentElement, {
        childList: true,
        subtree: true,
    });
    processor.RequestFullScan();
    return {
        observer,
        processor,
    };
}
const api = {
    Boot,
    CellContainsPromotedContent,
    CollectCandidates,
    CreateProcessor,
    HidePremiumModal,
    NormalizeText,
    PROMOTED_LABELS,
    PROMOTED_SVG_PATH,
    ScanCell,
    ShouldHidePremiumModal,
};
if (typeof module !== "undefined") {
    module.exports = api;
}
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
    let instance = null;
    function Start() {
        if (instance)
            return;
        SetEnabled(document, true);
        instance = Boot(document);
    }
    function Stop() {
        if (!instance)
            return;
        instance.observer.disconnect();
        instance = null;
        SetEnabled(document, false);
        ShowHiddenElements(document);
    }
    // Listen for toggle messages from the background script
    if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener((message) => {
            if (message.type === "cleantweetx-toggle") {
                if (message.enabled) {
                    Start();
                }
                else {
                    Stop();
                }
            }
        });
    }
    // Check initial state from storage
    if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.get({ enabled: true }, (result) => {
            if (result.enabled) {
                Start();
            }
            else {
                SetEnabled(document, false);
            }
        });
    }
    else {
        Start();
    }
}
