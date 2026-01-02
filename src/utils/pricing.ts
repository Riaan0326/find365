export const pricingConfig = {
  rides: {
    'car': 15,
    'minibus': 15,
    'tuktuk': 2,
    'taxi': 2,
    'motorcycle': 2,
    'bus': 50
  },
  delivery: {
    'car': 5,
    'motorcycle': 5,
    'tuktuk': 5,
    'panel-van': 20,
    'bakkie': 20,
    'truck': 50
  },
  assistance: {
    'moving-city': 50,
    'moving-national': 100,
    'towme': 35,
    'rubble-removal': 50
  },
  emergency: {
    'all': 50
  },
  tours: {
    'all': 100
  }
};

export const getCreditsForService = (transportType: string): number => {
  // Map transport types to pricing categories
  const serviceMapping: { [key: string]: { category: keyof typeof pricingConfig, type: string } } = {
    'car': { category: 'rides', type: 'car' },
    'minibus': { category: 'rides', type: 'minibus' },
    'tuktuk': { category: 'rides', type: 'tuktuk' },
    'taxi': { category: 'rides', type: 'taxi' },
    'motorcycle': { category: 'rides', type: 'motorcycle' },
    'bus': { category: 'rides', type: 'bus' },
    'delivery-car': { category: 'delivery', type: 'car' },
    'delivery-motorcycle': { category: 'delivery', type: 'motorcycle' },
    'delivery-tuktuk': { category: 'delivery', type: 'tuktuk' },
    'delivery-panel-van': { category: 'delivery', type: 'panel-van' },
    'delivery-bakkie': { category: 'delivery', type: 'bakkie' },
    'delivery-truck': { category: 'delivery', type: 'truck' },
    'moving-city': { category: 'assistance', type: 'moving-city' },
    'moving-national': { category: 'assistance', type: 'moving-national' },
    'towme': { category: 'assistance', type: 'towme' },
    'rubble-removal': { category: 'assistance', type: 'rubble-removal' },
    'emergency': { category: 'emergency', type: 'all' },
    'tours': { category: 'tours', type: 'all' }
  };

  const mapping = serviceMapping[transportType];
  if (!mapping) {
    console.warn(`Unknown transport type: ${transportType}, defaulting to 20 credits`);
    return 20; // Default fallback
  }

  const categoryConfig = pricingConfig[mapping.category] as any;
  return categoryConfig[mapping.type] || 20;
};