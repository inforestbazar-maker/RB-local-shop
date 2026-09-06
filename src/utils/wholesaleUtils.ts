import { Product, Business, WholesaleTier } from '../types';

/**
 * Calculates the effective price per unit and total price based on product wholesale settings,
 * tiered volume discounts, and business-level wholesale defaults.
 */
export function getEffectiveProductPrice(
  product: Product,
  quantity: number = 1,
  business?: Partial<Business>,
  _isVerifiedMerchant?: boolean
): {
  unitPrice: number;
  totalPrice: number;
  isWholesaleApplied: boolean;
  regularTotal: number;
  savings: number;
  wholesaleDiscountSavings: number;
  activeTier?: WholesaleTier;
  tierApplied?: WholesaleTier;
  wholesaleMinQty: number;
  wholesaleUnit: string;
} {
  const regularPrice = product.price || 0;
  const regularTotal = regularPrice * quantity;
  const wholesaleUnit = product.wholesaleUnit || 'পিস';

  // Determine if wholesale is enabled for this product or by business default
  const isProductWholesale = product.isWholesaleAvailable === true || (business?.isWholesale === true && product.isWholesaleAvailable !== false);
  const minQty = product.wholesaleMinQty || business?.wholesaleMinQtyDefault || 5;

  if (!isProductWholesale) {
    return {
      unitPrice: regularPrice,
      totalPrice: regularTotal,
      isWholesaleApplied: false,
      regularTotal,
      savings: 0,
      wholesaleDiscountSavings: 0,
      wholesaleMinQty: minQty,
      wholesaleUnit
    };
  }

  // Check custom tiered pricing first (sort descending by minQty to find highest applicable tier)
  if (product.wholesaleTiers && product.wholesaleTiers.length > 0) {
    const sortedTiers = [...product.wholesaleTiers].sort((a, b) => b.minQty - a.minQty);
    const matchedTier = sortedTiers.find(t => quantity >= t.minQty);

    if (matchedTier && matchedTier.price > 0 && matchedTier.price < regularPrice) {
      const unitPrice = matchedTier.price;
      const totalPrice = unitPrice * quantity;
      const savings = Math.max(0, regularTotal - totalPrice);
      return {
        unitPrice,
        totalPrice,
        isWholesaleApplied: true,
        regularTotal,
        savings,
        wholesaleDiscountSavings: savings,
        activeTier: matchedTier,
        tierApplied: matchedTier,
        wholesaleMinQty: minQty,
        wholesaleUnit
      };
    }
  }

  // Check product-specific wholesale price
  if (quantity >= minQty) {
    let unitPrice = product.wholesalePrice && product.wholesalePrice > 0 
      ? product.wholesalePrice 
      : (business?.wholesaleDiscountPercentage && business.wholesaleDiscountPercentage > 0
          ? Math.round(regularPrice * (1 - business.wholesaleDiscountPercentage / 100))
          : regularPrice);

    // If wholesale price is still same or higher than retail, keep regular
    if (unitPrice > 0 && unitPrice < regularPrice) {
      const totalPrice = unitPrice * quantity;
      const savings = Math.max(0, regularTotal - totalPrice);
      return {
        unitPrice,
        totalPrice,
        isWholesaleApplied: true,
        regularTotal,
        savings,
        wholesaleDiscountSavings: savings,
        wholesaleMinQty: minQty,
        wholesaleUnit
      };
    }
  }

  return {
    unitPrice: regularPrice,
    totalPrice: regularTotal,
    isWholesaleApplied: false,
    regularTotal,
    savings: 0,
    wholesaleDiscountSavings: 0,
    wholesaleMinQty: minQty,
    wholesaleUnit
  };
}

/**
 * Returns formatted unit name in Bengali
 */
export function formatWholesaleUnit(unit?: string): string {
  if (!unit) return 'পিস';
  return unit;
}

/**
 * Standard Bangladeshi wholesale commercial units
 */
export const WHOLESALE_UNITS = [
  { id: 'পিস', label: 'পিস (Pcs / Unit)' },
  { id: 'কেজি', label: 'কেজি (Kilogram / Kg)' },
  { id: 'বস্তা', label: 'বস্তা (Sack / Bag - 25kg/50kg)' },
  { id: 'কার্টন', label: 'কার্টন (Master Carton)' },
  { id: 'ডজন', label: 'ডজন (Dozen - 12 Pcs)' },
  { id: 'বক্স', label: 'বক্স (Inner Box)' },
  { id: 'বান্ডিল', label: 'বান্ডিল (Bundle)' },
  { id: 'লিটার', label: 'লিটার (Liter)' },
  { id: 'মন', label: 'মন (Maund - 40 Kg)' },
  { id: 'টিন', label: 'টিন (Tin / Can)' },
  { id: 'কেস', label: 'কেস (Case)' },
  { id: 'প্যাকেট', label: 'প্যাকেট (Packet)' }
];
