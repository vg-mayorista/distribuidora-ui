export function getProductEmoji(name: string): string {
  const n = name.toLowerCase();
  if (/yerba|mate/.test(n)) return '🌿';
  if (/azúcar|sal/.test(n)) return '🧂';
  if (/aceite|oliva/.test(n)) return '🫒';
  if (/arroz|harina/.test(n)) return '🌾';
  if (/fideos|tallar|spaghetti/.test(n)) return '🍝';
  if (/lentejas|poroto|garbanz/.test(n)) return '🫘';
  if (/coca|gaseosa/.test(n)) return '🥤';
  if (/agua/.test(n)) return '💧';
  if (/jugo/.test(n)) return '🧃';
  if (/cerveza/.test(n)) return '🍺';
  if (/vino/.test(n)) return '🍷';
  if (/leche/.test(n)) return '🥛';
  if (/yogur/.test(n)) return '🥛';
  if (/queso/.test(n)) return '🧀';
  if (/manteca/.test(n)) return '🧈';
  if (/detergente|lavavajilla/.test(n)) return '🧴';
  if (/lavandina/.test(n)) return '🧪';
  if (/rollo|papel/.test(n)) return '🧻';
  if (/carne|asado/.test(n)) return '🥩';
  if (/pollo/.test(n)) return '🍗';
  return '📦';
}
