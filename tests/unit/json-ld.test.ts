import { describe, it, expect } from "vitest";
import { serializeJsonLd } from "@/lib/utils/json-ld";

describe("serializeJsonLd", () => {
  it("round-trips normal structured data", () => {
    const data = { "@type": "Product", name: "Crinkle Georgette Hijab" };
    expect(JSON.parse(serializeJsonLd(data))).toEqual(data);
  });

  it("escapes closing script sequences from database content", () => {
    const data = { name: "</script><script>alert(1)</script>" };
    const out = serializeJsonLd(data);
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c/script>");
    expect(JSON.parse(out)).toEqual(data);
  });
});
