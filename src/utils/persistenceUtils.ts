import { User, Business } from '../types';

/**
 * Normalizes phone numbers for flawless comparison across Bengali and English digits,
 * spaces, symbols, and +88 prefix.
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  let cleaned = String(phone).replace(/[০-৯]/g, (d) => String(bengaliDigits.indexOf(d)));
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('880')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('88') && cleaned.length > 10) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Checks if a business belongs to the specified user.
 */
export function isUserShopOwner(business?: Business | null, user?: User | null): boolean {
  if (!business || !user) return false;

  const uPhone = normalizePhoneNumber(user.phone);
  const uEmail = (user.email || '').trim().toLowerCase();
  const uName = (user.name || '').trim().toLowerCase();

  const bOwnerPhone = normalizePhoneNumber(business.ownerPhone);
  const bPhone = normalizePhoneNumber(business.phone);
  const bOwnerEmail = (business.ownerEmail || '').trim().toLowerCase();
  const bOwnerName = (business.ownerName || '').trim().toLowerCase();

  // Match by normalized phone (exact or last 10 digits)
  if (uPhone) {
    if (bOwnerPhone && (uPhone === bOwnerPhone || uPhone.slice(-10) === bOwnerPhone.slice(-10))) return true;
    if (bPhone && (uPhone === bPhone || uPhone.slice(-10) === bPhone.slice(-10))) return true;
  }

  // Match by email
  if (uEmail && bOwnerEmail && uEmail === bOwnerEmail) {
    return true;
  }

  // Match by exact name + partial phone
  if (uName && bOwnerName && uName === bOwnerName && uPhone && bOwnerPhone && uPhone.slice(-8) === bOwnerPhone.slice(-8)) {
    return true;
  }

  return false;
}

/**
 * Finds the merchant business from database list, with automatic fallback to locally cached shop.
 */
export function findMerchantBusiness(businesses: Business[] | undefined, user?: User | null): Business | null {
  if (!user) return null;

  if (Array.isArray(businesses) && businesses.length > 0) {
    const found = businesses.find(b => isUserShopOwner(b, user));
    if (found) return found;
  }

  // Fallback to local storage cached merchant business if available
  try {
    const cachedBiz = localStorage.getItem('rb_local_merchant_biz');
    if (cachedBiz) {
      const parsed = JSON.parse(cachedBiz);
      if (isUserShopOwner(parsed, user)) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

/**
 * Safe local storage user retrieval
 */
export function getStoredLocalUser(): User | null {
  try {
    const cached = localStorage.getItem('rb_local_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && (parsed.phone || parsed.email || parsed.name)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to get stored local user:', e);
  }
  return null;
}

/**
 * Safe local storage user saving
 */
export function saveStoredLocalUser(user: User | null): void {
  try {
    if (user) {
      localStorage.setItem('rb_local_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('rb_local_user');
    }
  } catch (e) {
    console.error('Failed to save stored local user:', e);
  }
}

/**
 * Safe local storage cached DB retrieval
 */
export function getStoredLocalDb(): any | null {
  try {
    const cached = localStorage.getItem('rb_cached_db');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && Array.isArray(parsed.businesses) && parsed.businesses.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to get stored local DB:', e);
  }
  return null;
}

/**
 * Safe local storage cached DB saving
 */
export function saveStoredLocalDb(db: any): void {
  try {
    if (db && typeof db === 'object') {
      localStorage.setItem('rb_cached_db', JSON.stringify(db));
    }
  } catch (e) {
    // If quota exceeded due to base64 images, try saving without large strings
    try {
      const stripped = JSON.stringify(db, (key, value) => {
        if (typeof value === 'string' && value.startsWith('data:image/') && value.length > 30000) {
          return undefined;
        }
        return value;
      });
      localStorage.setItem('rb_cached_db', stripped);
    } catch (err) {
      console.warn('Could not save DB to localStorage:', err);
    }
  }
}

/**
 * Safe local storage cached Merchant Business retrieval
 */
export function getStoredLocalMerchantBiz(): Business | null {
  try {
    const cached = localStorage.getItem('rb_local_merchant_biz');
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object' && parsed.id) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to get stored local merchant biz:', e);
  }
  return null;
}

/**
 * Safe local storage cached Merchant Business saving
 */
export function saveStoredLocalMerchantBiz(biz: Business | null): void {
  try {
    if (biz) {
      localStorage.setItem('rb_local_merchant_biz', JSON.stringify(biz));
    } else {
      localStorage.removeItem('rb_local_merchant_biz');
    }
  } catch (e) {
    console.error('Failed to save stored local merchant biz:', e);
  }
}
