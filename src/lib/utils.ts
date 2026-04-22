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
    .replace(/^-+|-+$/g, '');
}

export function sanitizeUsername(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function normalizeSearchText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, ' ')
    .replace(/\s+/g, ' ');
}

export function similarityScore(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  const n1 = normalizeSearchText(s1);
  const n2 = normalizeSearchText(s2);
  
  if (n1 === n2) return 1;
  if (n1.includes(n2) || n2.includes(n1)) return 0.8;

  const longer = n1.length > n2.length ? n1 : n2;
  const shorter = n1.length > n2.length ? n2 : n1;
  
  const longerLength = longer.length;
  if (longerLength === 0) return 1.0;
  
  const editDistance = (a: string, b: string) => {
    const costs = [];
    for (let i = 0; i <= a.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= b.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (a.charAt(i - 1) !== b.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[b.length] = lastValue;
    }
    return costs[b.length];
  };

  return (longerLength - editDistance(longer, shorter)) / longerLength;
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

export function formatJoinedDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function safeJsonStringify(obj: any): string {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }

    if (
      typeof key === 'string' &&
      (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance'))
    ) {
      return '[React Internal]';
    }

    if (typeof value === 'object' && value !== null) {
      if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
        return `[HTMLElement: ${value.tagName}]`;
      }
      if (value.nodeType && value.nodeName) {
        return `[DOM Node: ${value.nodeName}]`;
      }
      if (value.constructor?.name === 'FiberNode' || value._reactInternalFiber || value._reactEvents) {
        return '[Fiber Node]';
      }
      if (value.stateNode && (value.stateNode instanceof HTMLElement || value.stateNode.tagName)) {
        return '[Fiber Node with DOM]';
      }
    }
    return value;
  });
}
