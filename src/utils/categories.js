import { getCategoryLabel } from './product';

const byOrder = (a, b) =>
  (a.sort_order ?? 0) - (b.sort_order ?? 0) || getCategoryLabel(a).localeCompare(getCategoryLabel(b));

// Top-level categories (sorted), each with its sorted `children`.
// Sub-categories whose parent no longer exists are listed as top-level.
export function categoryTree(categories) {
  const list = Array.isArray(categories) ? categories : [];
  const ids = new Set(list.map((c) => c.id));
  const roots = list.filter((c) => c.parent_id == null || !ids.has(c.parent_id)).sort(byOrder);
  return roots.map((root) => ({
    ...root,
    children: list.filter((c) => c.parent_id != null && c.parent_id === root.id).sort(byOrder),
  }));
}

// Select options: each top-level category followed by its sub-categories ("— Name")
export function categoryOptions(categories) {
  return categoryTree(categories).flatMap((root) => [
    { value: root.slug, label: getCategoryLabel(root) },
    ...root.children.map((child) => ({ value: child.slug, label: `— ${getCategoryLabel(child)}` })),
  ]);
}
