export function reorderByIds<T extends { id: string }>(items: T[], order: string[]): T[] | null {
  const byId = new Map(items.map((item) => [item.id, item]));
  if (
    order.length !== items.length ||
    new Set(order).size !== order.length ||
    order.some((id) => !byId.has(id))
  )
    return null;
  return order.map((id) => byId.get(id)!);
}
