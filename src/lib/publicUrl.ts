export function publicUrl(path: string): string {
  if (!path) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const base = import.meta.env.BASE_URL || "/";
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const relative = path.replace(/^\//, "");

  const baseTrim = baseWithSlash.replace(/^\/|\/$/g, "");
  if (baseTrim && relative.startsWith(`${baseTrim}/`)) {
    return `/${relative}`;
  }

  return `${baseWithSlash}${relative}`;
}
