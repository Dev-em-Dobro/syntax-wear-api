import slugify from "slugify";

/**
 * Gera um slug a partir de um texto
 * @param text - Texto a ser convertido em slug
 * @returns Slug formatado (lowercase, sem caracteres especiais)
 */
export function generateSlug(text: string): string {
  const slugifyFn = (slugify as any).default || slugify;
  return slugifyFn(text, { lower: true, strict: true, locale: "pt" });
}
