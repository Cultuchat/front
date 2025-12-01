/**
 * Category icons and descriptions.
 * Category names come from the API, but icons and descriptions are static.
 */

export const CATEGORY_METADATA: Record<string, { icon: string; description: string }> = {
  "Música": { icon: "🎵", description: "Conciertos, festivales musicales, recitales" },
  "Arte": { icon: "🎨", description: "Exposiciones, galerías, arte urbano" },
  "Teatro": { icon: "🎭", description: "Obras de teatro, stand-up, performances" },
  "Danza": { icon: "💃", description: "Ballet, danza contemporánea, folklórica" },
  "Festivales": { icon: "🎪", description: "Festivales culturales y temáticos" },
  "Gastronomía": { icon: "🍽️", description: "Ferias gastronómicas, degustaciones" },
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_METADATA[category]?.icon || "🎭";
}

export function getCategoryDescription(category: string): string {
  return CATEGORY_METADATA[category]?.description || "Eventos culturales";
}
