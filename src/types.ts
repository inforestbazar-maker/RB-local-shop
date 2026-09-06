export interface Location {
  lat: number;
  lng: number;
  address: string;
  district: string;
  division?: string;
  thana?: string;
}

export type UserRole = 'user' | 'merchant' | 'rider' | 'admin';

export interface SavedAddress {
  id: string;
  title: string; // 'বাসা (Home)', 'অফিস (Office)', 'গ্রামের বাড়ি (Hometown)', 'অন্যান্য (Other)'
  recipientName: string;
  phone: string;
  address: string;
  division: string;
  district: string;
  thana: string;
  isDefault: boolean;
  notes?: string;
}

export interface UserCoupon {
  id: string;
  code: string;
  title: string;
  discountType: 'percentage' | 'flat';
  discountValue: number;
  minSpend: number;
  maxDiscount?: number;
  expiryDate: string;
  description: string;
  category?: string;
  isUsed?: boolean;
}

export interface DeliveryJob {
  id: string;
  bookingId: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  division: string;
  district: string;
  thana: string;
  itemsCount: number;
  totalOrderPrice: number;
  deliveryFee: number;
  paymentType: 'cod' | 'paid_online';
  status: 'available' | 'accepted' | 'picked_up' | 'delivered';
  assignedRiderPhone?: string;
  assignedRiderName?: string;
  acceptedAt?: string;
  deliveredAt?: string;
}

export interface User {
  phone: string;
  name: string;
  role: UserRole;
  location?: Location;
  favorites: string[]; // Business IDs
  createdAt: string;
  email?: string;
  password?: string;
  image?: string;
  designation?: string;
  bio?: string;
  tradeLicenseNo?: string;
  tradeLicenseImage?: string;
  isMerchantVerified?: boolean;
  tradeLicenseStatus?: 'pending' | 'approved' | 'rejected';
  tradeLicenseRejectReason?: string;
  walletBalance?: number;
  rewardPoints?: number;
  savedAddresses?: SavedAddress[];
  savedBankAccounts?: SavedBankAccount[];
  walletTransactions?: WalletTransaction[];
  claimedCoupons?: (string | UserCoupon)[]; // coupon codes or full objects
  userCoupons?: UserCoupon[];
  referralCode?: string;
  referredBy?: string;
  referralCount?: number;
  totalReferralBonus?: number;
  riderVehicleType?: 'bicycle' | 'motorcycle' | 'walking' | 'van';
  riderNidNumber?: string;
  riderNidImage?: string;
  isRiderVerified?: boolean;
  riderActiveStatus?: boolean;
  riderTotalDeliveries?: number;
  riderTotalEarnings?: number;
}

export interface WholesaleTier {
  minQty: number;
  price: number;
  label?: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  description?: string;
  isAvailable: boolean;
  isApproved?: boolean;
  isWholesaleAvailable?: boolean;
  wholesalePrice?: number;
  wholesaleMinQty?: number;
  wholesaleUnit?: string;
  wholesaleTiers?: WholesaleTier[];
  wholesaleStock?: number;
}

export interface ServiceItem {
  id: string;
  name: string;
  charge: number;
  description?: string;
  isAvailable: boolean;
  isApproved?: boolean;
}

export type BusinessCategory =
  | 'grocery'
  | 'pharmacy'
  | 'electrician'
  | 'plumber'
  | 'mason'
  | 'restaurant'
  | 'transport'
  | 'tutor'
  | 'parlor'
  | 'mechanic'
  | 'wholesale'
  | string;

export interface Review {
  id: string;
  businessId: string;
  userName: string;
  userPhone: string;
  rating: number;
  comment: string;
  images: string[];
  date: string;
  isReported?: boolean;
  reportReason?: string;
}

export interface Offer {
  id: string;
  title: string;
  code: string;
  discountPercent: number;
  description: string;
  expiryDate: string;
  minSpend?: number;
  discountType?: 'percentage' | 'flat';
  discountValue?: number;
  maxDiscount?: number;
  isActive?: boolean;
}

export interface WalletTransaction {
  id: string;
  trxId?: string;
  type: 'credit' | 'debit' | 'subscription' | 'ad_payment' | 'booking_commission' | 'income' | 'payout' | string;
  category?: 'add_money' | 'send_money' | 'received_money' | 'bank_withdrawal' | 'order_payment' | 'cashback' | 'referral_bonus' | 'rider_earning' | 'reward_redeem' | string;
  title?: string;
  description?: string;
  amount: number;
  date: string;
  timestamp?: number;
  method?: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Bank' | 'Card' | 'Wallet' | 'Reward' | string;
  channelDetails?: {
    provider?: string;
    accountNumber?: string;
    accountTitle?: string;
    bankName?: string;
    branchName?: string;
    trxId?: string;
    senderPhone?: string;
    receiverPhone?: string;
    note?: string;
    fee?: number;
  };
  status?: 'completed' | 'pending' | 'failed';
}

export interface Business {
  id: string;
  ownerPhone: string;
  name: string;
  category: BusinessCategory;
  type: 'shop' | 'service'; // shop = product-based, service = booking-based
  phone: string;
  whatsapp?: string;
  websiteUrl?: string;
  logo?: string;
  images: string[];
  description: string;
  address: string;
  location: { lat: number; lng: number };
  division?: string;
  district?: string;
  thana?: string;
  isOpen: boolean;
  isApproved?: boolean;
  isWholesale?: boolean;
  wholesaleMode?: 'wholesale_only' | 'retail_and_wholesale';
  wholesaleMinOrderAmount?: number;
  wholesaleTerms?: string;
  wholesaleDiscountPercentage?: number;
  wholesaleMinQtyDefault?: number;
  hasHomeDelivery?: boolean;
  deliveryCharge?: number;
  products: Product[];
  services: ServiceItem[];
  rating: number;
  reviewsCount: number;
  reviews: Review[];
  isSponsored?: boolean;
  sponsoredRank?: number; // Higher number means higher placement
  subscriptionPlan: 'free' | 'silver' | 'gold' | 'diamond';
  subscriptionExpiry?: string;
  balance: number;
  transactions: WalletTransaction[];
  offers: Offer[];
  customers?: OfflineCustomer[];
  isSuspended?: boolean;
  isBannersAllowed?: boolean;
  isAutoItemApprovalAllowed?: boolean;
  isLedgerAllowed?: boolean;
  maxProductsLimit?: number;
  isOfferCreationAllowed?: boolean;
  commissionRateOverride?: number;
  ownerName?: string;
  ownerEmail?: string;
  planId?: string;
  createdAt?: string;
}

export interface OfflineCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  balanceDue: number; // For keeping track of dues (বাকি খাতা)
  createdAt: string;
}

export interface Booking {
  id: string;
  businessId: string;
  businessName: string;
  businessPhone: string;
  businessCategory: BusinessCategory;
  userPhone: string;
  userName: string;
  userAddress: string;
  type: 'order' | 'service';
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  bookingDate: string;
  bookingTime?: string; // For service bookings
  totalPrice: number;
  deliveryCharge?: number;
  status: 'pending' | 'accepted' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'bkash' | 'nagad' | 'rocket' | 'cod';
  paymentStatus: 'pending' | 'paid';
  advanceAmount?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  fromPhone: string;
  toPhone: string;
  text: string;
  image?: string;
  audio?: string;
  audioDuration?: number;
  attachmentType?: 'image' | 'audio' | 'location' | 'product_inquiry';
  locationData?: {
    lat: number;
    lng: number;
    address: string;
  };
  productData?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    shopName?: string;
  };
  timestamp: string;
  isRead: boolean;
}

export interface Complaint {
  id: string;
  userPhone: string;
  userName: string;
  businessId: string;
  businessName: string;
  subject: string;
  details: string;
  status: 'pending' | 'resolved';
  date: string;
}

export interface AdCampaign {
  id: string;
  businessId: string;
  businessName: string;
  placement: 'homepage' | 'category' | 'search';
  bannerImage: string;
  budget: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
  views: number;
  clicks: number;
}

export interface CustomerProductOffer {
  id: string;
  buyerPhone: string;
  buyerName: string;
  offerPrice: number;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface CustomerProduct {
  id: string;
  sellerPhone: string;
  sellerName: string;
  sellerAddress?: string;
  division?: string;
  district?: string;
  thana?: string;
  name: string;
  brand?: string;
  price: number;
  originalPrice?: number;
  isNegotiable?: boolean;
  description: string;
  category: 'electronics' | 'books' | 'fashion' | 'furniture' | 'home' | 'hobbies' | 'vehicles' | 'other';
  condition: 'new' | 'like_new' | 'used' | 'fair';
  image?: string;
  images?: string[];
  deliveryType?: 'pickup_only' | 'delivery_available' | 'free_delivery';
  usedDuration?: string;
  warrantyInfo?: string;
  isAvailable: boolean;
  views?: number;
  isBoosted?: boolean;
  offers?: CustomerProductOffer[];
  createdAt: string;
}

export interface TickerMessage {
  id: string;
  text: string;
  detail: string;
}

export interface SellerTutorialStep {
  id: string;
  stepNumber: number;
  title: string;
  description: string;
  image?: string;
  keyTip?: string;
}

export interface SellerTutorial {
  id: string;
  title: string;
  category: string;
  categoryLabel: string;
  description: string;
  videoUrl?: string;
  thumbnail: string;
  duration: string;
  authorName: string;
  authorRole: string;
  images?: string[];
  tags: string[];
  createdAt: string;
  views: number;
  likes: number;
  steps: SellerTutorialStep[];
  aiGenerated?: boolean;
}

export interface SavedBankAccount {
  id: string;
  type: 'bank' | 'mfs';
  providerName: string; // e.g. "BRAC Bank", "Islami Bank", "bKash", "Nagad", "The City Bank"
  accountTitle: string; // e.g. "মো: আরিফুল ইসলাম"
  accountNumber: string; // e.g. "1501204829001" or "017XXXXXXXX"
  branchName?: string; // e.g. "Dhanmondi Branch"
  routingNumber?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface MfsGatewayProviderConfig {
  id: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'card' | 'bank' | 'cod';
  nameBn: string;
  nameEn: string;
  isEnabled: boolean;
  gatewayMode: 'direct_gateway' | 'manual_trx' | 'both';
  merchantAccountNumber: string;
  accountType: 'merchant' | 'agent' | 'personal';
  cashInFeePercent: number;
  cashOutFeePercent: number;
  minAmount: number;
  maxAmount: number;
  isSandbox: boolean;
  mode?: 'sandbox' | 'live';
  appKey?: string;
  appSecret?: string;
  username?: string;
  password?: string;
  noticeBanner?: string;
  instructionsBn?: string;
  bankDetails?: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    branchName: string;
    routingNumber: string;
  };
}

export interface PaymentGatewayGlobalConfig {
  masterEnabled: boolean;
  isSandbox?: boolean;
  defaultGateway: 'bkash' | 'nagad' | 'rocket' | 'card' | 'bank' | 'cod';
  enableWalletAddMoney: boolean;
  enableWalletSendMoney: boolean;
  enableWalletToMfsCashout: boolean;
  minAddMoneyAmount: number;
  maxAddMoneyAmount: number;
  walletToWalletFeePercent: number;
  walletToMfsFeePercent: number;
  mockOtpSimulation: boolean;
  bannerNotice: string;
  providers: {
    bkash: MfsGatewayProviderConfig;
    nagad: MfsGatewayProviderConfig;
    rocket: MfsGatewayProviderConfig;
    upay?: MfsGatewayProviderConfig;
    card?: MfsGatewayProviderConfig;
    bank?: MfsGatewayProviderConfig;
    cod?: MfsGatewayProviderConfig;
    [key: string]: MfsGatewayProviderConfig | undefined;
  };
}


