/**
 * Serialize structured data for embedding in a <script> tag.
 * Escaping `<` prevents a value such as `</script>` from terminating the
 * element early and turning stored content into markup.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
