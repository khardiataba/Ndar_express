// frontend/src/utils/serviceDefaults.js

export const defaultServiceImages = {
  "rides": "🚗",
  "pâtissier": "🍰",
  "restaurant": "🍽️",
  "électricien": "💡",
  "livreur": "🚚",
  "coiffure-beaute": "💇",
  "menuisier": "🪑",
  "maçon": "🧱",
  "peintre": "🎨",
  "lavage-automobile": "🚗",
  "plomberie": "🔧",
  "jardinage": "🌱",
  "menuiserie": "🪚",
  "macon": "🧱",
  "beaute": "💄",
  "food": "🍕",
};

export const getServiceImageUrl = (category, type) => {
  // Try exact match first
  if (defaultServiceImages[category]) {
    return defaultServiceImages[category];
  }
  
  // Try type-based match
  if (type === "restaurant" && defaultServiceImages[category]) {
    return defaultServiceImages[category];
  }
  
  // Fallback
  return "🔧";
};

export const enrichItemWithImage = (item) => {
  return {
    ...item,
    image: item.image || getServiceImageUrl(item.category, item.type),
    iconSymbol: item.iconSymbol || getServiceImageUrl(item.category, item.type)
  };
};

export const enrichItemsWithImages = (items) => {
  return items.map(enrichItemWithImage);
};
