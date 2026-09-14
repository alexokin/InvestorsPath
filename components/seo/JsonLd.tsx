/**
 * Renders a schema.org JSON-LD `<script>` tag from a plain JS object. Escapes
 * `<` as `<` so a literal `</script>` can never appear inside the JSON
 * string (the string is otherwise attacker-controlled content, e.g. lesson
 * titles), which would prematurely close the tag.
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
