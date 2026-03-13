export function generateId(): string {
  return `card-${Math.random().toString(36).slice(2, 9)}-${Date.now()}`;
}
