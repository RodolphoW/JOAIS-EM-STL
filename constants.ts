import { JewelryItem } from './types';

export const MOCK_ITEMS: JewelryItem[] = [
  {
    id: '001',
    name: 'Anel Ouro Telado com Forro',
    category: 'Anel',
    subcategory: 'Fundição direta',
    description: 'Anel em ouro trabalhado com 2 estilos de telas e com forro. Peça otimizada para fundição direta com estrutura reforçada.',
    imageUrl: 'https://i.ibb.co/1ttL0nQR/AN-03.jpg',
    images: [
      'https://i.ibb.co/1ttL0nQR/AN-03.jpg',
      'https://i.ibb.co/NntGdYf0/AN-03.jpg',
      'https://i.ibb.co/gM80ThSZ/AN-003.jpg'
    ],
    downloadCount: 0,
    material: 'Ouro',
    weight: '2.7g - 3.0g',
    sku: '001',
    createdAt: new Date().toLocaleDateString('pt-BR'),
    ringSize: '20',
    stoneCount: 9,
    stoneSize: '1mm',
    stoneShape: 'Redonda',
    price: 39.90
  },
  {
    id: '1',
    name: 'Pingente Gota Dourada',
    category: 'Pingente',
    subcategory: 'Orgânicos',
    description: 'Um pingente elegante em formato de gota com acabamento suave, ideal para impressão em resina. Design fluido que reflete a luz de maneira única.',
    imageUrl: 'https://picsum.photos/400/400?random=1',
    images: [
      'https://picsum.photos/400/400?random=1',
      'https://picsum.photos/400/400?random=11',
      'https://picsum.photos/400/400?random=111'
    ],
    downloadCount: 124,
    material: 'Ouro 18k / Prata 950',
    weight: '2.5g (Au) / 1.8g (Ag)',
    sku: 'PG-001-GTA',
    createdAt: '10/02/2024',
    stoneCount: 1,
    stoneSize: '5mm',
    stoneShape: 'Gota',
    price: 0 // Free
  },
  {
    id: '2',
    name: 'Anel Solitário Moderno',
    category: 'Anel',
    subcategory: 'Solitário',
    description: 'Design contemporâneo de anel solitário, otimizado para fundição. Garra baixa para maior conforto no uso diário.',
    imageUrl: 'https://picsum.photos/400/400?random=2',
    images: [
      'https://picsum.photos/400/400?random=2',
      'https://picsum.photos/400/400?random=22',
      'https://picsum.photos/400/400?random=222'
    ],
    downloadCount: 89,
    material: 'Ouro 18k',
    weight: '3.8g',
    sku: 'AN-SOL-MOD',
    createdAt: '15/02/2024',
    ringSize: '16 (Ajustável)',
    stoneCount: 1,
    stoneSize: '6mm',
    stoneShape: 'Redonda (Brilhante)',
    price: 29.90
  },
  {
    id: '3',
    name: 'Bracelete Geométrico',
    category: 'Bracelete',
    description: 'Bracelete largo com padrões geométricos vazados. Estrutura reforçada para impressão 3D direta.',
    imageUrl: 'https://picsum.photos/400/400?random=3',
    images: [
      'https://picsum.photos/400/400?random=3',
      'https://picsum.photos/400/400?random=33',
      'https://picsum.photos/400/400?random=333'
    ],
    downloadCount: 45,
    material: 'Prata 925 / Latão',
    weight: '12g (Ag)',
    sku: 'BR-GEO-05',
    createdAt: '20/02/2024',
    stoneCount: 0,
    price: 0 // Free
  },
  {
    id: '4',
    name: 'Brincos Cascata',
    category: 'Brincos',
    description: 'Brincos longos articulados, requer suporte mínimo. Movimento natural e leveza.',
    imageUrl: 'https://picsum.photos/400/400?random=4',
    images: [
      'https://picsum.photos/400/400?random=4',
      'https://picsum.photos/400/400?random=44',
      'https://picsum.photos/400/400?random=444'
    ],
    downloadCount: 210,
    material: 'Ouro Branco 18k',
    weight: '4.2g (Par)',
    sku: 'BRC-CAS-L',
    createdAt: '01/03/2024',
    stoneCount: 12,
    stoneSize: '2mm',
    stoneShape: 'Redonda',
    price: 45.00
  },
  {
    id: '5',
    name: 'Anel de Caveira',
    category: 'Anel',
    description: 'Anel detalhado com motivo de caveira, alta definição. Ideal para oxidação e acabamento rústico.',
    imageUrl: 'https://picsum.photos/400/400?random=5',
    images: [
      'https://picsum.photos/400/400?random=5',
      'https://picsum.photos/400/400?random=55',
      'https://picsum.photos/400/400?random=555'
    ],
    downloadCount: 300,
    material: 'Prata 950',
    weight: '15g',
    sku: 'AN-SKL-HD',
    createdAt: '05/03/2024',
    ringSize: '22',
    stoneCount: 2,
    stoneSize: '3mm (Olhos)',
    stoneShape: 'Redonda',
    price: 15.90
  }
];

export const CATEGORIES = [
  { 
    id: 'Pingente', 
    label: 'Pingente STL',
    subcategories: ['Religiosos', 'Corações', 'Animais', 'Telados', 'Orgânicos', 'Fundição direta']
  },
  { 
    id: 'Anel', 
    label: 'Anel STL',
    subcategories: ['Solitário', 'Formatura', 'Alianças', 'Chuveiros', 'Meia Alianças', 'Orgânicos', 'Religiosos', 'Fundição direta']
  },
  { 
    id: 'Bracelete', 
    label: 'Bracelete STL',
    subcategories: ['Rígido', 'Corrente', 'Articulado', 'Minimalista']
  },
  { 
    id: 'Brincos', 
    label: 'Brincos STL',
    subcategories: ['Argolas', 'Cascata', 'Pequenos', 'Pressão']
  },
  { 
    id: 'Colecoes', 
    label: 'Coleções',
    subcategories: ['Verão', 'Inverno', 'Luxo', 'Natureza', 'Geométrico']
  },
];