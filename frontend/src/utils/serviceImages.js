// frontend/src/utils/serviceImages.js

const serviceImageMap = {
  menuisier: {
    emoji: "🪚",
    icon: "🪑",
    color: "#8B4513",
    description: "Menuiserie"
  },
  maçon: {
    emoji: "🧱",
    icon: "🏗️",
    color: "#A9714F",
    description: "Maçonnerie"
  },
  peintre: {
    emoji: "🎨",
    icon: "🎭",
    color: "#FF6B6B",
    description: "Peinture"
  },
  électricien: {
    emoji: "💡",
    icon: "⚡",
    color: "#FFD700",
    description: "Électricité"
  },
  pâtissier: {
    emoji: "🥐",
    icon: "🍰",
    color: "#FF69B4",
    description: "Food & Bakery"
  },
  "coiffure-beaute": {
    emoji: "💇",
    icon: "💄",
    color: "#DA70D6",
    description: "Coiffure & Beauté"
  },
  livreur: {
    emoji: "🛵",
    icon: "📦",
    color: "#FF8C00",
    description: "Livraison"
  },
  autres: {
    emoji: "🧩",
    icon: "⚙️",
    color: "#4169E1",
    description: "Autres"
  }
}

export const getServiceImage = (category) => {
  return serviceImageMap[category] || serviceImageMap.autres
}

export const generateServiceImageSvg = (category, size = 200) => {
  const service = getServiceImage(category)
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${service.color};stop-opacity:1" />
          <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#grad)"/>
      <text x="50%" y="50%" font-size="80" text-anchor="middle" dominant-baseline="central" font-family="Arial">
        ${service.emoji}
      </text>
      <text x="50%" y="85%" font-size="16" text-anchor="middle" font-family="Arial" fill="white" font-weight="bold">
        ${service.description}
      </text>
    </svg>
  `
  return `data:image/svg+xml;base64,${btoa(svg)}`
}

export const getServiceColor = (category) => {
  return getServiceImage(category).color
}

export const getServiceEmoji = (category) => {
  return getServiceImage(category).emoji
}
