export interface JewelryItem {
  id: string;
  name: string;
  category: 'Anel' | 'Pingente' | 'Bracelete' | 'Brincos' | 'Colecoes' | 'Outros';
  subcategory?: string; // For specific filtering
  description: string;
  imageUrl: string;
  images: string[]; // Array of 3 images
  price?: number; // Free or Paid
  downloadCount: number;
  // Technical Details
  material?: string;
  weight?: string;
  sku?: string;
  createdAt?: string;
  ringSize?: string; // Optional, mostly for rings
  stoneCount?: number;
  stoneSize?: string;
  stoneShape?: string;
}

export type ViewState = 'welcome' | 'discover' | 'details' | 'downloads' | 'profile' | 'listing' | 'explore' | 'favorites';

export interface User {
  name: string;
  downloads: string[]; // List of downloaded Item IDs
}