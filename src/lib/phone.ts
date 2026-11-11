// Normalisation des numéros de téléphone comoriens (+269 / 269 / 0...)
export function normalizePhone(input: string): string {
  let p = input.replace(/[\s.\-()]/g, "");
  if (p.startsWith("+269")) p = p.slice(4);
  else if (p.startsWith("269")) p = p.slice(3);
  else if (p.startsWith("0")) p = p.slice(1);
  p = p.replace(/[^\d]/g, "");
  return "+269" + p;
}

export function isValidComorianPhone(input: string): boolean {
  const p = normalizePhone(input);
  // 7 chiffres après +269, commençant généralement par 3, 4, 7, 8
  return /^\+269\d{7}$/.test(p);
}
