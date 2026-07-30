import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { VariantTree, type VariantTreeProps } from '../VariantTree';
import type { TreeItem } from '@/lib/cakeCatalog/types';

/**
 * The tree is deliberately presentational, so the fixture is a hand-written
 * `TreeItem[]` — no store, no context, and therefore no IndexedDB (which jsdom
 * does not implement).
 */
const items: TreeItem[] = [
  {
    kind: 'node',
    key: 'cake-1>shape-heart',
    depth: 0,
    path: ['shape-heart'],
    valueId: 'shape-heart',
    valueName: 'قلب',
    levelName: 'الشكل',
    priceDelta: 25,
    imageId: null,
    fill: 0,
    total: 4,
    hasChildren: true,
    expanded: true,
  },
  {
    kind: 'node',
    key: 'cake-1>shape-heart>flavor-choco',
    depth: 1,
    path: ['shape-heart', 'flavor-choco'],
    valueId: 'flavor-choco',
    valueName: 'شوكولاتة',
    levelName: 'النكهة',
    priceDelta: 0,
    imageId: 'img-1',
    fill: 2,
    total: 2,
    hasChildren: false,
    expanded: false,
  },
  {
    kind: 'node',
    key: 'cake-1>shape-round',
    depth: 0,
    path: ['shape-round'],
    valueId: 'shape-round',
    valueName: 'دائري',
    levelName: 'الشكل',
    priceDelta: 0,
    imageId: null,
    fill: 1,
    total: 4,
    hasChildren: true,
    expanded: false,
  },
  {
    kind: 'add',
    key: 'add:cake-1',
    depth: 0,
    levelIndex: 0,
    levelName: 'الشكل',
  },
];

function renderTree(overrides: Partial<VariantTreeProps> = {}) {
  const props: VariantTreeProps = {
    items,
    levelCount: 2,
    selectedKey: null,
    thumbUrlFor: (imageId) => (imageId ? `blob:${imageId}` : undefined),
    onSelect: vi.fn(),
    onToggle: vi.fn(),
    onDropFile: vi.fn(),
    onAddValue: vi.fn(async () => true),
    ...overrides,
  };
  return { props, ...render(<VariantTree {...props} />) };
}

/** Node rows are the only `div[role="treeitem"]`, in the order they were passed. */
function rowElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>('div[role="treeitem"]'));
}

describe('<VariantTree>', () => {
  it('tones the roll-up counter by coverage', () => {
    renderTree();

    expect(screen.getByText('0/4')).toHaveClass('text-destructive');
    expect(screen.getByText('2/2')).toHaveClass('text-success');
    expect(screen.getByText('1/4')).toHaveClass('text-muted-foreground');
  });

  it('labels every icon-only button in Arabic', () => {
    const { container } = renderTree();

    const carets = container.querySelectorAll<HTMLButtonElement>('button');
    const iconOnly = Array.from(carets).filter((button) => button.textContent?.trim() === '');
    expect(iconOnly).toHaveLength(2);
    for (const button of iconOnly) {
      expect(button.getAttribute('aria-label')?.length ?? 0).toBeGreaterThan(0);
    }
    expect(screen.getByLabelText('طيّ')).toBeInTheDocument();
    expect(screen.getByLabelText('توسيع')).toBeInTheDocument();
  });

  it('indents with the logical padding property, never paddingLeft', () => {
    const { container } = renderTree();
    const [root, child] = rowElements(container);

    expect(root.getAttribute('style')).toContain('padding-inline-start: 12px');
    expect(child.getAttribute('style')).toContain('padding-inline-start: 36px');
    expect(container.innerHTML).not.toContain('padding-left');
  });

  it('selects a row on click with its key and path', () => {
    const { container, props } = renderTree();

    fireEvent.click(rowElements(container)[0]);

    expect(props.onSelect).toHaveBeenCalledWith('cake-1>shape-heart', ['shape-heart']);
  });

  it('toggles from the caret without also selecting the row', () => {
    const { props } = renderTree();

    fireEvent.click(screen.getByLabelText('طيّ'));

    expect(props.onToggle).toHaveBeenCalledWith('cake-1>shape-heart');
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  /**
   * Regression: rows were `role="button"` wrapping the caret button, which is
   * invalid nested-interactive ARIA and made each row's accessible name absorb
   * the caret's «توسيع» — so "the expand control" resolved to the whole row.
   */
  it('keeps the caret label out of the row name and exposes tree semantics', () => {
    const { container } = renderTree();

    const [root, child] = rowElements(container);
    expect(root).toHaveAttribute('aria-label', 'قلب — الشكل');
    expect(root.getAttribute('aria-label')).not.toContain('طيّ');
    expect(root).toHaveAttribute('aria-expanded', 'true');
    expect(root).toHaveAttribute('aria-level', '1');
    expect(child).toHaveAttribute('aria-level', '2');
    // A leaf must not claim to be expandable.
    expect(child).not.toHaveAttribute('aria-expanded');
    expect(container.querySelectorAll('div[role="button"]')).toHaveLength(0);
    expect(container.querySelector('[role="tree"]')).toBeInTheDocument();
  });

  it('offers an add-row input naming its level and clears it on success', async () => {
    const { props } = renderTree();
    const input = screen.getByPlaceholderText(/أضف الشكل/);

    fireEvent.change(input, { target: { value: '  نجمة  ' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(props.onAddValue).toHaveBeenCalledWith(0, 'نجمة');
    await waitFor(() => expect(input).toHaveValue(''));
  });

  // A duplicate-name rejection must leave the typed text for correction.
  it('keeps the add-row draft when the add is rejected', async () => {
    const { props } = renderTree({ onAddValue: vi.fn(async () => false) });
    const input = screen.getByPlaceholderText(/أضف الشكل/);

    fireEvent.change(input, { target: { value: 'قلب' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(props.onAddValue).toHaveBeenCalledWith(0, 'قلب');
    await waitFor(() => expect(props.onAddValue).toHaveReturned());
    expect(input).toHaveValue('قلب');
  });

  // One tab stop for the whole tree; arrows move focus between rows.
  it('uses a roving tabindex and moves focus with the arrow keys', () => {
    const { container } = renderTree();
    const rows = rowElements(container);

    expect(rows.map((r) => r.tabIndex)).toEqual([0, -1, -1]);

    rows[0].focus();
    fireEvent.keyDown(rows[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(rows[1]);
    fireEvent.keyDown(rows[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(rows[0]);
  });

  it('shows the empty state when there is nothing to render', () => {
    renderTree({ items: [] });

    expect(screen.getByText('لا توجد خيارات بعد')).toBeInTheDocument();
  });
});
