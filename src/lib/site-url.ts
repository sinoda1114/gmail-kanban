/** `NEXT_PUBLIC_SITE_URL` を URL に変換する。未設定・不正形式は undefined。 */
export function parseSiteUrl(value: string | undefined): URL | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed);
  } catch {
    return undefined;
  }
}
