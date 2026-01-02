// Single source of truth for all service options across the app
export const serviceOptions = [
  { category: 'Ride', items: [
    { value: 'car', label: 'Car', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/ucjcj56scsuukzi3phh7.png' },
    { value: 'tuktuk', label: 'TukTuk', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/re55d084q7rqw9gbvjba.png' },
    { value: 'taxi', label: 'Taxi', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/urutkekphmv2voenr9zh.png' },
    { value: 'minibus', label: 'Minibus (Shuttle)', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/fhjgt8kgbc248kl72lzu.png' },
    { value: 'motorcycle', label: 'Motorcycle', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/ccof46et96byyjvkikuf.png' },
    { value: 'bus', label: 'Bus', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/ehytcuqrygo8i2lipon6.png' }
  ]},
  { category: 'Delivery', items: [
    { value: 'delivery-car', label: 'Car', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/zzpux7hyikay0g86so92.png' },
    { value: 'delivery-motorcycle', label: 'Motorcycle', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/gkrav2nt62zlpdg3bz3e.png' },
    { value: 'delivery-tuktuk', label: 'TukTuk', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/b7snaunxbkkqpcky9pxe.png' },
    { value: 'delivery-panelvan', label: 'Panel Van', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/l6oaphdyohx4pupina2t.png' },
    { value: 'delivery-bakkie', label: 'Bakkie', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996319/qa7rnhjmg8rmuhqqmagz.png' },
    { value: 'delivery-truck', label: 'Truck', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/stoqoxiwnnsiabdcg6v1.png' }
  ]},
  { category: 'Assistance', items: [
    { value: 'moving-city', label: 'Moving - City', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996320/ktvhz1mihyj5srp9oqnq.png' },
    { value: 'moving-national', label: 'Moving - National', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/acsoomrifh5dbez7dcbg.png' },
    { value: 'towme-car', label: 'TowMe with Car', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/sjmetyyfuekt0gnjcgyu.png' },
    { value: 'towme-bakkie', label: 'TowMe with Bakkie', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/hxcclgtzy6bdygujqrqw.png' },
    { value: 'towme-truck', label: 'TowMe with Truck', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/ivbvfqdpyphxmxg5z6fm.png' },
    { value: 'rubble-removal-bakkie', label: 'Rubble Removal - Bakkie', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/hlsld1wiugo7vq2mbrtd.png' },
    { value: 'rubble-removal-truck', label: 'Rubble Removal - Truck', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/ldlekywovoikjs2f7npx.png' }
  ]},
  { category: 'Emergency', items: [
    { value: 'towing-car', label: 'Towing of Car/SUV', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996321/fl0lme146swd4snkev6i.png' },
    { value: 'towing-lowbed', label: 'Towing with Lowbed', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996322/xf6cwo1nkdff8z55o5k5.png' },
    { value: 'towing-truck', label: 'Towing of Truck/Bus', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/cayczfi9ezhrgrmlkeyp.png' },
    { value: 'flat-battery', label: 'Flat Battery ', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996322/daydpmbtuwz1fkexcmih.png' },
    { value: 'flat-tyre', label: 'Flat Tyre', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/mocgg1tvonkavje8oioo.png' },
	{ value: 'dead-engine', label: 'Engine "Dead"', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/fhmhyk3bwclkc97aq84q.png' }
  ]},
  { category: 'Frolic', items: [
    { value: 'frolic-classic-car', label: 'Classic Car', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996322/zq9krobb3zkserg83pvt.png' },
    { value: 'frolic-modern-car', label: 'Modern Car', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/tspvy7nykdgopenghyjg.png' },
    { value: 'frolic-limo', label: 'Limo', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/tjtwpcrlgrbmwfo6rfa0.png' },
    { value: 'frolic-party-bus', label: 'Party Bus', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996323/ljh6kyymbym72evbysve.png' }
  ]},
  { category: 'Tour', items: [
    { value: 'bus-tour', label: 'Bus', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996324/elw1qle3fo2hcybkiltu.png' },
    { value: 'shuttle-tour', label: 'Shuttle', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996324/rxpcntdlxoj4j7jypbze.png' },
    { value: 'motorcycle-tour', label: 'Motorcycle', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996324/ilut1e5li9hdso4j6fqd.png' },
    { value: 'international', label: 'International', emoji: 'https://res.cloudinary.com/duqmfy7z7/image/upload/v1766996332/muvb9mstuhqjn6hyf3n6.png' }
  ]}
];

// Helper function to get emoji for map markers
export const getServiceEmoji = (transportType: string): string => {
  for (const category of serviceOptions) {
    const item = category.items.find(item => item.value === transportType);
    if (item) {
      // Return fallback emoji for URLs since map markers can't display images
      return item.emoji.startsWith('http') ? '🚗' : item.emoji;
    }
  }
  return '📍'; // default marker
};

