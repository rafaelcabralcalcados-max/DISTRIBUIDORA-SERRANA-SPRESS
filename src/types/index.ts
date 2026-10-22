export type UserRole = 'admin' | 'manufacturer' | 'retailer';

export interface SizeRatio {
  size: string; // e.g. "34", "35", "36" or "26/27", "28/29"
  quantity: number; // pairs of this specific size
}

export interface Manufacturer {
  id: string;
  role: 'manufacturer';
  brandName: string;
  legalName: string;
  cnpj: string;
  city: string; // Nova Serrana - MG, etc.
  state: string;
  phone: string;
  email: string;
  password?: string;
  bio?: string;
  commissionRateAccepted: number; // e.g. 8.5%
  termsAccepted: boolean;
  termsAcceptedAt: string;
  isVerified: boolean;
  address?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
}

export interface Retailer {
  id: string;
  role: 'retailer';
  storeName: string;
  legalName: string;
  cnpj: string;
  contactPerson: string;
  email: string;
  password?: string;
  phone: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
}

export interface AdminUser {
  id: string;
  role: 'admin';
  name: string;
  email: string;
}

export type CurrentUser = Manufacturer | Retailer | AdminUser;

export type ProductCategory =
  | 'chinelos'
  | 'sandalias'
  | 'esportivo'
  | 'casual'
  | 'sapatilhas'
  | 'infantil'
  | 'bota'
  | 'outro';

export interface ColorOption {
  id: string;
  name: string; // e.g. "Preto / Branco", "Total Black", "Azul Marinho"
  hexColor?: string; // hex code for visual badge e.g. "#111111"
  images: string[]; // Multiple photos for this specific color!
  stockBoxes?: number; // Stock of boxes specifically for this color!
}

export interface ProductBox {
  id: string;
  manufacturerId: string;
  manufacturerName: string;
  manufacturerCity: string;
  name: string;
  referenceCode: string;
  category: ProductCategory;
  description: string;
  upperMaterial: string; // Cabedal (e.g. Mesh respirável, Sintético premium)
  soleMaterial: string;  // Sola (e.g. EVA microexpandido, Borracha TR)
  insoleMaterial: string;// Palmilha
  pricePerPair: number;
  pairsPerBox: number;
  pricePerBox: number; // pricePerPair * pairsPerBox
  sizesDistribution: SizeRatio[];
  stockBoxes: number;
  leadTimeDays: number; // Prazo de produção ou 0 para pronta entrega
  photos: string[]; // General photos or primary photo list
  colors?: ColorOption[]; // Color options, each containing multiple images!
  createdAt: string;
}

export interface CartItem {
  product: ProductBox;
  boxQuantity: number;
  selectedColor?: string; // e.g. "Preto / Branco"
  selectedColorHex?: string;
  selectedColorPhoto?: string;
}

export type LogisticsType = 'entrega_cd_serron';

export interface LogisticsOption {
  type: LogisticsType;
  label: string;
  notes?: string;
  trackingCode?: string;
  assignedAt: string;
  assignedBy: string;
}

export type PayoutStatus = 'pendente' | 'agendado' | 'repassado';
export type OrderStatus = 'pago_aguardando_logistica' | 'logistica_definida' | 'em_transito' | 'entregue';
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

export interface OrderItem {
  productId: string;
  productName: string;
  referenceCode: string;
  manufacturerId: string;
  manufacturerName: string;
  boxQuantity: number;
  pairsPerBox: number;
  totalPairs: number;
  sizesDistribution: SizeRatio[];
  pricePerBox: number;
  totalItemPrice: number;
  photo?: string;
  selectedColor?: string;
}

export interface Order {
  id: string; // e.g. "PED-8421"
  retailerId: string;
  retailerName: string;
  retailerCnpj: string;
  retailerPhone: string;
  deliveryAddress: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  items: OrderItem[];
  totalGrossAmount: number;
  shippingCost: number;
  totalFinalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pago';
  platformCommissionPercent: number; // e.g. 8.5
  platformCommissionAmount: number;  // gross * 8.5%
  manufacturerNetPayout: number;     // gross - commission
  payoutStatus: PayoutStatus;
  payoutDate?: string;
  payoutReceiptNote?: string;
  logistics?: LogisticsOption;
  orderStatus: OrderStatus;
  createdAt: string;
}
