// frontend/src/utils/serviceDefaults.js

export const defaultServiceImages = {
  "rides": "CAR",
  "pâtissier": "BAKERY",
  "restaurant": "FOOD",
  "électricien": "ELECTRICITE",
  "livreur": "DELIVERY",
  "coiffure-beaute": "BEAUTE",
  "menuisier": "MEUBLE",
  "maçon": "MACON",
  "peintre": "PEINTURE",
  "lavage-automobile": "CAR",
  "plomberie": "OUTIL",
  "jardinage": "JARDIN",
  "menuiserie": "MENUISERIE",
  "macon": "MACON",
  "beaute": "MAQUILLAGE",
  "food": "PIZZA",
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
  return "OUTIL";
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

