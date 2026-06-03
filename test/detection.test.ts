import { test, expect } from 'bun:test';

import {
  CollectCandidates,
  PROMOTED_SVG_PATH,
  ScanCell,
  ShouldHidePremiumModal,
} from '../utils/detection';

type FakeOpts = {
  selectors?: string[];
  textContent?: string;
  innerHTML?: string;
};

class FakeElement {
  nodeType = 1;
  parentElement: FakeElement | null = null;
  textContent: string;
  innerHTML: string;
  style: { display?: string } = {};
  attributes = new Map<string, string>();
  selectorSet: Set<string>;
  children: FakeElement[] = [];
  queryMap = new Map<string, FakeElement[]>();

  constructor({ selectors = [], textContent = '', innerHTML = '' }: FakeOpts = {}) {
    this.textContent = textContent;
    this.innerHTML = innerHTML;
    this.selectorSet = new Set(selectors);
  }

  appendChild(child: FakeElement): FakeElement {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  setQueryResults(selector: string, results: FakeElement[]): void {
    this.queryMap.set(selector, results);
  }

  matches(selector: string): boolean {
    return this.selectorSet.has(selector);
  }

  closest(selector: string): FakeElement | null {
    let current: FakeElement | null = this;
    while (current) {
      if (current.matches(selector)) return current;
      current = current.parentElement;
    }
    return null;
  }

  querySelectorAll(selector: string): FakeElement[] {
    if (this.queryMap.has(selector)) {
      return this.queryMap.get(selector)!;
    }

    const matches: FakeElement[] = [];
    for (const child of this.children) {
      if (child.matches(selector)) {
        matches.push(child);
      }
      matches.push(...child.querySelectorAll(selector));
    }
    return matches;
  }

  querySelector(selector: string): FakeElement | null {
    return this.querySelectorAll(selector)[0] || null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, String(value));
  }

  getAttribute(name: string): string | null {
    return this.attributes.has(name) ? this.attributes.get(name)! : null;
  }
}

const asElement = (el: FakeElement) => el as unknown as Element;

test('ScanCell hides promoted cells and supports rescanning', () => {
  const cell = new FakeElement();
  cell.setQueryResults('span', []);
  cell.setQueryResults('svg', []);

  expect(ScanCell(asElement(cell))).toBe(false);
  expect(cell.style.display).toBeUndefined();

  const promotedSpan = new FakeElement({ textContent: 'Promoted' });
  cell.setQueryResults('span', [promotedSpan]);

  expect(ScanCell(asElement(cell))).toBe(true);
  expect(cell.style.display).toBe('none');
  expect(cell.getAttribute('data-cleantweetx-hidden')).toBe('1');
});

test('ScanCell hides promoted SVG fallback matches', () => {
  const cell = new FakeElement();
  const svg = new FakeElement({ innerHTML: PROMOTED_SVG_PATH });
  cell.setQueryResults('span', []);
  cell.setQueryResults('svg', [svg]);

  expect(ScanCell(asElement(cell))).toBe(true);
  expect(cell.style.display).toBe('none');
});

test('ShouldHidePremiumModal ignores generic sheet dialogs', () => {
  const modal = new FakeElement({
    selectors: ['[data-testid="sheetDialog"]'],
    textContent: 'Compose a post',
  });

  expect(ShouldHidePremiumModal(asElement(modal))).toBe(false);
});

test('ShouldHidePremiumModal hides premium dialogs via stable hints', () => {
  const modal = new FakeElement({ selectors: ['[data-testid="sheetDialog"]'] });
  const premiumLink = new FakeElement({ selectors: ['a[href*="/i/premium"]'] });
  modal.appendChild(premiumLink);

  expect(ShouldHidePremiumModal(asElement(modal))).toBe(true);
});

test('ShouldHidePremiumModal handles localized premium copy', () => {
  const modal = new FakeElement({
    selectors: ['[data-testid="sheetDialog"]'],
    textContent: 'Abonnez-vous a Premium pour continuer',
  });

  expect(ShouldHidePremiumModal(asElement(modal))).toBe(true);
});

test('ScanCell matches promoted labels after normalization', () => {
  const cell = new FakeElement();
  const promotedSpan = new FakeElement({ textContent: '  Sponsorisé  ' });
  cell.setQueryResults('span', [promotedSpan]);
  cell.setQueryResults('svg', []);

  expect(ScanCell(asElement(cell))).toBe(true);
  expect(cell.style.display).toBe('none');
});

test('CollectCandidates finds closest and descendant matches', () => {
  const root = new FakeElement();
  const wrapper = root.appendChild(new FakeElement());
  const cell = wrapper.appendChild(
    new FakeElement({ selectors: ['[data-testid="cellInnerDiv"]'] }),
  );
  const nested = cell.appendChild(new FakeElement());

  const matches = CollectCandidates(asElement(nested), '[data-testid="cellInnerDiv"]');

  expect(Array.from(matches)).toEqual([asElement(cell)]);
});
