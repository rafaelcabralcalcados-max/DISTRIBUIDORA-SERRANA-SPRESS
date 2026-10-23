/**
 * WhatsApp Helper for Distribuidora Serrana Spress
 * Official Attendant Phone: (37) 99104-1958 -> 5537991041958
 */

import { ProductBox } from '../types';

export const SERRANA_WHATSAPP_NUMBER = '5537991041958';
export const SERRANA_WHATSAPP_DISPLAY = '(37) 99104-1958';

/**
 * Resolves a photo path or URL to an absolute HTTP URL suitable for WhatsApp previews.
 */
function resolvePhotoUrl(photo?: string | null): string {
  if (!photo) return '';
  if (photo.startsWith('http://') || photo.startsWith('https://')) {
    return photo;
  }
  if (typeof window !== 'undefined' && photo.startsWith('/')) {
    return `${window.location.origin}${photo}`;
  }
  return photo;
}

/**
 * Builds a direct WhatsApp chat link pre-filled with the product details and photo.
 */
export function getProductWhatsAppUrl(
  product: ProductBox,
  selectedColor?: string,
  selectedPhoto?: string | null
): string {
  // Best photo to include
  const photoCandidate = selectedPhoto
    || (product.colors && product.colors[0]?.images?.[0])
    || (product.photos && product.photos[0])
    || null;

  const absolutePhotoUrl = resolvePhotoUrl(photoCandidate);

  // Formatting price
  const formattedBoxPrice = product.pricePerBox.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formattedPairPrice = product.pricePerPair.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Color text
  let colorText = '';
  if (selectedColor) {
    colorText = `\n🎨 *Cor escolhida:* ${selectedColor}`;
  } else if (product.colors && product.colors.length > 0) {
    colorText = `\n🎨 *Cores disponíveis:* ${product.colors.map((c) => c.name).join(', ')}`;
  }

  // Size distribution / grade
  const gradeText =
    product.sizesDistribution && product.sizesDistribution.length > 0
      ? `\n📊 *Grade da Caixa (${product.pairsPerBox} pares):* ` +
        product.sizesDistribution.map((s) => `${s.size} (${s.quantity})`).join(', ')
      : `\n📦 *Quantidade:* ${product.pairsPerBox} pares por caixa`;

  // Photo text
  let photoText = '';
  if (absolutePhotoUrl && absolutePhotoUrl.startsWith('http')) {
    photoText = `\n\n📸 *Foto do Modelo:* ${absolutePhotoUrl}`;
  }

  const message =
    `Olá, equipe Serrana Spress! 👋\n` +
    `Sou lojista e tenho interesse no seguinte calçado do catálogo:\n\n` +
    `👟 *${product.name.toUpperCase()}*\n` +
    `🔖 *Referência:* ${product.referenceCode}` +
    colorText +
    `\n💰 *Valor:* R$ ${formattedBoxPrice} / caixa (R$ ${formattedPairPrice} / par)` +
    gradeText +
    photoText +
    `\n\nPoderiam me passar mais informações para fecharmos o pedido?`;

  return `https://wa.me/${SERRANA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
