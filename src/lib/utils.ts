import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

export function formatBadge(addedCount: number): string {
  if (addedCount >= 10) return 'মন্দির রক্ষক';
  if (addedCount >= 5) return 'নিবেদিত অবদানকারী';
  if (addedCount >= 2) return 'উদীয়মান অবদানকারী';
  return 'নতুন অবদানকারী';
}

export function getDivisionColor(division: string): string {
  const colors: Record<string, string> = {
    Dhaka: 'bg-orange-100 text-orange-700',
    Chattogram: 'bg-blue-100 text-blue-700',
    Rajshahi: 'bg-green-100 text-green-700',
    Khulna: 'bg-yellow-100 text-yellow-700',
    Barishal: 'bg-red-100 text-red-700',
    Sylhet: 'bg-purple-100 text-purple-700',
    Rangpur: 'bg-teal-100 text-teal-700',
    Mymensingh: 'bg-pink-100 text-pink-700',
  };
  return colors[division] || 'bg-gray-100 text-gray-700';
}

export function safeJsonStringify(obj: any): string {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) return '[Circular]';
      cache.add(value);
    }
    if (typeof key === 'string' && (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance'))) {
      return '[React Internal]';
    }
    if (typeof value === 'object' && value !== null) {
      if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) return `[HTMLElement: ${value.tagName}]`;
      if (value.nodeType && value.nodeName) return `[DOM Node: ${value.nodeName}]`;
      if (value.constructor?.name === 'FiberNode' || value._reactInternalFiber || value._reactEvents) return '[Fiber Node]';
      if (value.stateNode && (value.stateNode instanceof HTMLElement || value.stateNode.tagName)) return '[Fiber Node with DOM]';
    }
    return value;
  });
}

export function calculateContributionPoints(templesAdded = 0, editsMade = 0, photosAdded = 0) {
  return templesAdded * 10 + editsMade * 4 + photosAdded * 2;
}

export function getContributionBadge(points: number) {
  if (points >= 120) return 'মন্দির রক্ষক';
  if (points >= 60) return 'নিবেদিত অবদানকারী';
  if (points >= 20) return 'উদীয়মান অবদানকারী';
  return 'নতুন অবদানকারী';
}

export function normalizeText(text?: string | null) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function similarityScore(a?: string | null, b?: string | null) {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  const xSet = new Set(x.split(' '));
  const ySet = new Set(y.split(' '));
  const intersection = [...xSet].filter((word) => ySet.has(word)).length;
  const union = new Set([...xSet, ...ySet]).size;
  return union ? intersection / union : 0;
}

export function getTempleEditDiff(currentTemple: Record<string, any>, suggestedData: Record<string, any>) {
  return Object.entries(suggestedData || {}).filter(([key, value]) => {
    const currentValue = currentTemple?.[key];
    return JSON.stringify(currentValue ?? null) !== JSON.stringify(value ?? null);
  });
}
