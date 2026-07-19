// Mock database for PetOne PWA multicategory catalog and stores

export const CATEGORIES = [
  { id: 'alimentos', name: 'Alimentos', icon: 'pets' },
  { id: 'higiene', name: 'Higiene', icon: 'clean_hands' },
  { id: 'accesorios', name: 'Accesorios', icon: 'style' },
  { id: 'juguetes', name: 'Juguetes', icon: 'toys' },
  { id: 'farmacia', name: 'Farmacia', icon: 'medical_services' }
];

export const PRODUCTS = [
  // Alimentos
  {
    id: 'prod-1',
    category: 'alimentos',
    brand: 'Royal Canin',
    name: 'Medium Adult Dog Food',
    price: 34990,
    size: '15 kg',
    rating: 4.8,
    reviews: 124,
    description: 'Alimento premium balanceado formulado específicamente para perros de raza mediana en edad adulta.',
    imageBg: 'linear-gradient(135deg, #f87171, #ef4444)'
  },
  {
    id: 'prod-2',
    category: 'alimentos',
    brand: 'Pro Plan',
    name: 'OptiDerma Puppy Large Breed',
    price: 38990,
    size: '12 kg',
    rating: 4.9,
    reviews: 86,
    description: 'Fórmula hipoalergénica para cachorros de razas grandes con piel sensible y pelaje brillante.',
    imageBg: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
  },
  {
    id: 'prod-3',
    category: 'alimentos',
    brand: 'Acana',
    name: 'Wild Prairie Gato',
    price: 29990,
    size: '5.4 kg',
    rating: 4.7,
    reviews: 62,
    description: 'Inspirado en nuestras praderas, con pollo y pavo de corral, huevos enteros y pescado de captura silvestre.',
    imageBg: 'linear-gradient(135deg, #34d399, #10b981)'
  },
  
  // Higiene
  {
    id: 'prod-4',
    category: 'higiene',
    brand: 'EasyClean',
    name: 'Arena Sanitaria de Bentonita',
    price: 9990,
    size: '10 kg',
    rating: 4.5,
    reviews: 145,
    description: 'Arena aglutinante ultra absorbente con control de olores activo y fragancia lavanda.',
    imageBg: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
  },
  {
    id: 'prod-5',
    category: 'higiene',
    brand: 'Oster',
    name: 'Champú Avena y Coco para Perros',
    price: 7490,
    size: '500 ml',
    rating: 4.6,
    reviews: 43,
    description: 'Champú hidratante y calmante para pieles sensibles a base de extractos naturales.',
    imageBg: 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
  },

  // Accesorios
  {
    id: 'prod-6',
    category: 'accesorios',
    brand: 'Julius K9',
    name: 'Arnés Powerharness Camuflaje',
    price: 24990,
    size: 'Talla M',
    rating: 4.9,
    reviews: 210,
    description: 'Arnés ergonómico de alta resistencia con parches reflectantes intercambiables y asa de control.',
    imageBg: 'linear-gradient(135deg, #fb7185, #f43f5e)'
  },
  {
    id: 'prod-7',
    category: 'accesorios',
    brand: 'PetComfort',
    name: 'Cama Ortopédica Viscoelástica',
    price: 45990,
    size: '100x80 cm',
    rating: 4.8,
    reviews: 57,
    description: 'Cama para perros con espuma de memoria que alivia los puntos de presión en articulaciones.',
    imageBg: 'linear-gradient(135deg, #38bdf8, #0284c7)'
  },

  // Juguetes
  {
    id: 'prod-8',
    category: 'juguetes',
    brand: 'Kong',
    name: 'Classic Juguete de Caucho Rellenable',
    price: 11990,
    size: 'Talla L',
    rating: 5.0,
    reviews: 512,
    description: 'El estándar de oro en juguetes para perros. Fabricado con caucho natural súper duradero y resistente.',
    imageBg: 'linear-gradient(135deg, #fb923c, #ea580c)'
  },
  {
    id: 'prod-9',
    category: 'juguetes',
    brand: 'CatIt',
    name: 'Circuito de Diversión Senses 2.0',
    price: 18990,
    size: 'Única',
    rating: 4.7,
    reviews: 89,
    description: 'Circuito de velocidad con bola iluminada para estimular el instinto de caza de los gatos.',
    imageBg: 'linear-gradient(135deg, #4ade80, #22c55e)'
  },

  // Farmacia
  {
    id: 'prod-10',
    category: 'farmacia',
    brand: 'Bravecto',
    name: 'Antiparasitario Perros 10-20 kg',
    price: 27990,
    size: '1 Comprimido',
    rating: 4.9,
    reviews: 340,
    description: 'Comprimido masticable que proporciona 12 semanas de protección continua contra pulgas y garrapatas.',
    imageBg: 'linear-gradient(135deg, #c084fc, #9333ea)'
  },
  {
    id: 'prod-11',
    category: 'farmacia',
    brand: 'Frontline',
    name: 'Pipeta Antiparasitaria Gatos',
    price: 8990,
    size: '1 Pipeta',
    rating: 4.6,
    reviews: 180,
    description: 'Solución tópica puntual para la prevención y tratamiento de pulgas, garrapatas y piojos en gatos.',
    imageBg: 'linear-gradient(135deg, #f472b6, #db2777)'
  }
];

export const STORES = [
  {
    id: 'store-1',
    name: 'PetOne Providencia',
    address: 'Av. Providencia 1240, Providencia',
    lat: -33.4262,
    lng: -70.6183,
    distance: '1.2 km',
    stock: {
      'prod-1': 15,
      'prod-2': 4,
      'prod-3': 0,
      'prod-4': 20,
      'prod-5': 8,
      'prod-6': 12,
      'prod-7': 3,
      'prod-8': 25,
      'prod-9': 6,
      'prod-10': 30,
      'prod-11': 15
    }
  },
  {
    id: 'store-2',
    name: 'PetOne Las Condes',
    address: 'Av. Vitacura 5400, Vitacura',
    lat: -33.4025,
    lng: -70.5742,
    distance: '3.5 km',
    stock: {
      'prod-1': 8,
      'prod-2': 10,
      'prod-3': 12,
      'prod-4': 5,
      'prod-5': 15,
      'prod-6': 0,
      'prod-7': 6,
      'prod-8': 14,
      'prod-9': 10,
      'prod-10': 18,
      'prod-11': 22
    }
  },
  {
    id: 'store-3',
    name: 'PetOne Santiago Centro',
    address: 'Paseo Ahumada 250, Santiago',
    lat: -33.4429,
    lng: -70.6538,
    distance: '4.8 km',
    stock: {
      'prod-1': 0,
      'prod-2': 0,
      'prod-3': 15,
      'prod-4': 30,
      'prod-5': 2,
      'prod-6': 5,
      'prod-7': 0,
      'prod-8': 8,
      'prod-9': 0,
      'prod-10': 40,
      'prod-11': 45
    }
  }
];

export const TIPS_AND_CARE = {
  perros: [
    { type: 'vacuna', title: 'Vacuna Antirrábica', desc: 'Obligatoria anualmente. Protege a tu perro y tu familia.', periodMonths: 12 },
    { type: 'desparasitacion', title: 'Desparasitación Interna', desc: 'Sugerida cada 3 meses para evitar parásitos intestinales.', periodMonths: 3 },
    { type: 'alimentacion', title: 'Calcula su dosis diaria', desc: 'Los cachorros en crecimiento comen 3 a 4 veces al día; los adultos 2 veces.', periodMonths: 0 }
  ],
  gatos: [
    { type: 'vacuna', title: 'Vacuna Triple Felina', desc: 'Protección esencial anual contra enfermedades respiratorias y virales.', periodMonths: 12 },
    { type: 'higiene', title: 'Limpieza de Arenero', desc: 'Mantén la arena libre de desechos diariamente para evitar problemas renales por retención.', periodMonths: 0 },
    { type: 'juguete', title: 'Evita el sedentarismo', desc: 'Los gatos de interior necesitan al menos 20 minutos de juego activo diario con rascadores.', periodMonths: 0 }
  ]
};

// ================= FASE 2 DATA =================

export const SERVICES = [
  { id: 'srv-1', name: 'Corte de Pelo & Estética', type: 'peluqueria', price: 18990, icon: 'content_cut' },
  { id: 'srv-2', name: 'Baño Sanitario Hidratante', type: 'peluqueria', price: 12990, icon: 'shower' },
  { id: 'srv-3', name: 'Consulta Veterinaria General', type: 'veterinaria', price: 15000, icon: 'medical_information' },
  { id: 'srv-4', name: 'Vacunación Completa', type: 'veterinaria', price: 19990, icon: 'vaccines' }
];

export const STAFF = [
  { id: 'stf-1', name: 'Dra. Camila Fuentes', specialty: 'Veterinaria', rating: 4.9 },
  { id: 'stf-2', name: 'Rodrigo Espinoza', specialty: 'Estilista Canino', rating: 4.8 },
  { id: 'stf-3', name: 'Patricia Lagos', specialty: 'Estilista Felina/Canina', rating: 4.7 }
];

// Reglas de Venta Cruzada (Cross-selling): mapea categoría comprada -> productos recomendados
export const CROSS_SELL_RULES = {
  'alimentos': ['prod-8', 'prod-5'], // Si compra Alimento, sugerir Juguete Kong o Champú Oster
  'accesorios': ['prod-8', 'prod-7'], // Si compra Arnés Julius K9, sugerir Cama Ortopédica
  'farmacia': ['prod-4', 'prod-5']    // Si compra Antiparasitario, sugerir Arena Bentonita o Champú
};
