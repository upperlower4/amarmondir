import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word chars
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/--+/g, '-') // Replace multiple - with single -
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
    'Dhaka': 'bg-orange-100 text-orange-700',
    'Chattogram': 'bg-blue-100 text-blue-700',
    'Rajshahi': 'bg-green-100 text-green-700',
    'Khulna': 'bg-yellow-100 text-yellow-700',
    'Barishal': 'bg-red-100 text-red-700',
    'Sylhet': 'bg-purple-100 text-purple-700',
    'Rangpur': 'bg-teal-100 text-teal-700',
    'Mymensingh': 'bg-pink-100 text-pink-700',
  };
  return colors[division] || 'bg-gray-100 text-gray-700';
}

export function safeJsonStringify(obj: any): string {
  const cache = new WeakSet();
  return JSON.stringify(obj, (key, value) => {
    // Basic circular check (ignore property names)
    if (typeof value === 'object' && value !== null) {
      if (cache.has(value)) {
        return '[Circular]';
      }
      cache.add(value);
    }

    // Always ignore react-internal props
    if (typeof key === 'string' && (key.startsWith('__reactFiber') || key.startsWith('__reactProps') || key.startsWith('__reactInternalInstance'))) {
      return '[React Internal]';
    }

    if (typeof value === 'object' && value !== null) {
      // Handle DOM Elements
      if (typeof HTMLElement !== 'undefined' && value instanceof HTMLElement) {
        return `[HTMLElement: ${value.tagName}]`;
      }
      if (value.nodeType && value.nodeName) {
        return `[DOM Node: ${value.nodeName}]`;
      }

      // Handle Fiber Nodes
      if (value.constructor?.name === 'FiberNode' || value._reactInternalFiber || value._reactEvents) {
        return '[Fiber Node]';
      }
      
      // Handle known circular structures if they appear as values
      if (value.stateNode && (value.stateNode instanceof HTMLElement || value.stateNode.tagName)) {
        return '[Fiber Node with DOM]';
      }
    }
    return value;
  });
}
