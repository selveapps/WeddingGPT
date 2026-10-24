/**
 * Demo seed data for attire module development.
 */
import {
  createAttireItem, createFitting, createAccessory, createColorPalette,
  AttireRole, AttireStatus, GarmentType, FittingStatus, AccessoryCategory,
} from '../../../models/attire';

export function buildDemoAttire(weddingId = 'demo-wedding') {
  const dress = createAttireItem({
    weddingId, role: AttireRole.BRIDE, garmentType: GarmentType.DRESS,
    title: 'Ceremony gown', wearerName: 'Alex', color: 'Ivory', colorHex: '#FFFFF0',
    brand: 'Sample Atelier', size: '6', cost: 2400, status: AttireStatus.FITTING, isPrimary: true,
  });
  const suit = createAttireItem({
    weddingId, role: AttireRole.GROOM, garmentType: GarmentType.SUIT,
    title: 'Navy suit', wearerName: 'Jordan', color: 'Navy', colorHex: '#1B2838',
    brand: 'Suit Co', size: '40R', cost: 890, status: AttireStatus.ORDERED, isPrimary: true,
  });
  const bm = createAttireItem({
    weddingId, role: AttireRole.BRIDESMAID, garmentType: GarmentType.DRESS,
    title: 'Champagne satin', wearerName: 'Party', color: 'Champagne', colorHex: '#F7E7CE',
    cost: 180, status: AttireStatus.RESEARCHING, isPrimary: true,
  });
  const fitting = createFitting({
    weddingId, attireItemId: dress.id, status: FittingStatus.SCHEDULED,
    scheduledAt: new Date(Date.now() + 7 * 86400000).toISOString(),
    location: 'Atelier downtown', tailorName: 'Sam',
  });
  const veil = createAccessory({
    weddingId, attireItemId: dress.id, name: 'Cathedral veil',
    category: AccessoryCategory.VEIL, isMustHave: true,
  });
  const shoes = createAccessory({
    weddingId, attireItemId: dress.id, name: 'Ivory heels',
    category: AccessoryCategory.SHOES, cost: 220, isMustHave: true,
  });
  const palette = createColorPalette({
    weddingId, name: 'Main palette', isPrimary: true,
    colors: [
      { id: '1', name: 'Ivory', hex: '#FFFFF0' },
      { id: '2', name: 'Champagne', hex: '#F7E7CE' },
      { id: '3', name: 'Navy', hex: '#1B2838' },
      { id: '4', name: 'Blush', hex: '#E8B4B8' },
    ],
  });
  return { items: [dress, suit, bm], fittings: [fitting], accessories: [veil, shoes], palettes: [palette] };
}
