const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CollectCandidates,
  PROMOTED_SVG_PATH,
  ScanCell,
  ShouldHidePremiumModal,
} = require("../content.js");

class FakeElement {
  constructor({ selectors = [], textContent = "", innerHTML = "" } = {}) {
    this.nodeType = 1;
    this.parentElement = null;
    this.textContent = textContent;
    this.innerHTML = innerHTML;
    this.style = {};
    this.attributes = new Map();
    this.selectorSet = new Set(selectors);
    this.children = [];
    this.queryMap = new Map();
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  setQueryResults(selector, results) {
    this.queryMap.set(selector, results);
  }

  matches(selector) {
    return this.selectorSet.has(selector);
  }

  closest(selector) {
    let current = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelectorAll(selector) {
    if (this.queryMap.has(selector)) {
      return this.queryMap.get(selector);
    }

    const matches = [];
    for (const child of this.children) {
      if (child.matches(selector)) {
        matches.push(child);
      }
      matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }

  querySelector(selector) {
    const matches = this.querySelectorAll(selector);
    return matches[0] || null;
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.has(name) ? this.attributes.get(name) : null;
  }
}

test("ScanCell hides promoted cells and supports rescanning", () => {
  const cell = new FakeElement();
  cell.setQueryResults("span", []);
  cell.setQueryResults("svg", []);

  assert.equal(ScanCell(cell), false);
  assert.equal(cell.style.display, undefined);

  const promotedSpan = new FakeElement({ textContent: "Promoted" });
  cell.setQueryResults("span", [promotedSpan]);

  assert.equal(ScanCell(cell), true);
  assert.equal(cell.style.display, "none");
  assert.equal(cell.getAttribute("data-cleantweetx-hidden"), "1");
});

test("ScanCell hides promoted SVG fallback matches", () => {
  const cell = new FakeElement();
  const svg = new FakeElement({ innerHTML: PROMOTED_SVG_PATH });
  cell.setQueryResults("span", []);
  cell.setQueryResults("svg", [svg]);

  assert.equal(ScanCell(cell), true);
  assert.equal(cell.style.display, "none");
});

test("ShouldHidePremiumModal ignores generic sheet dialogs", () => {
  const modal = new FakeElement({
    selectors: ['[data-testid="sheetDialog"]'],
    textContent: "Compose a post",
  });

  assert.equal(ShouldHidePremiumModal(modal), false);
});

test("ShouldHidePremiumModal hides premium dialogs via stable hints", () => {
  const modal = new FakeElement({ selectors: ['[data-testid="sheetDialog"]'] });
  const premiumLink = new FakeElement({ selectors: ['a[href*="/i/premium"]'] });
  modal.appendChild(premiumLink);

  assert.equal(ShouldHidePremiumModal(modal), true);
});

test("ShouldHidePremiumModal handles localized premium copy", () => {
  const modal = new FakeElement({
    selectors: ['[data-testid="sheetDialog"]'],
    textContent: "Abonnez-vous a Premium pour continuer",
  });

  assert.equal(ShouldHidePremiumModal(modal), true);
});

test("ScanCell matches promoted labels after normalization", () => {
  const cell = new FakeElement();
  const promotedSpan = new FakeElement({ textContent: "  Sponsorisé  " });
  cell.setQueryResults("span", [promotedSpan]);
  cell.setQueryResults("svg", []);

  assert.equal(ScanCell(cell), true);
  assert.equal(cell.style.display, "none");
});

test("CollectCandidates finds closest and descendant matches", () => {
  const root = new FakeElement();
  const wrapper = root.appendChild(new FakeElement());
  const cell = wrapper.appendChild(
    new FakeElement({ selectors: ['[data-testid="cellInnerDiv"]'] })
  );
  const nested = cell.appendChild(new FakeElement());

  const matches = CollectCandidates(nested, '[data-testid="cellInnerDiv"]');

  assert.deepEqual(Array.from(matches), [cell]);
});
