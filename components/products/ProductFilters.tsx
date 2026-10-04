"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Category, Collection } from "@/lib/api/client";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "popular", label: "Most popular" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];

const COLOR_PRESETS = [
  { name: "Ivory", hex: "#F5F0E8" },
  { name: "Taupe", hex: "#A69A89" },
  { name: "Espresso", hex: "#2A2521" },
  { name: "Olive", hex: "#737963" },
  { name: "Black", hex: "#1A1A1A" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Beige", hex: "#D8CBB8" },
  { name: "Grey", hex: "#8A8A8A" },
];

export function ProductFilters({
  categories,
  collections,
  lockedCategory,
}: {
  categories: Category[];
  collections: Collection[];
  lockedCategory?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");

  const navigate = (params: URLSearchParams) => {
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    params.delete("page");
    navigate(params);
  };

  const activeColor = searchParams.get("color") ?? "";
  const inStock = searchParams.get("inStock") === "true";
  const activeCollection = searchParams.get("collection") ?? "";
  const activeCategory = searchParams.get("category") ?? lockedCategory ?? "";
  const sort = searchParams.get("sort") ?? "featured";

  const applyPrice = () =>
    setParams({ minPrice: minPrice || null, maxPrice: maxPrice || null });

  const clearAll = () => {
    setMinPrice("");
    setMaxPrice("");
    const params = new URLSearchParams();
    if (lockedCategory) params.set("category", lockedCategory);
    navigate(params);
  };

  const sortSelect = (
    <Select
      aria-label="Sort products"
      value={sort}
      onChange={(e) => setParams({ sort: e.target.value })}
      options={SORT_OPTIONS}
      className="!w-auto"
    />
  );

  const filters = (
    <div className="space-y-7">
      {!lockedCategory && categories.length > 0 && (
        <FilterGroup label="Category">
          <ul className="space-y-2">
            <li>
              <FilterLink
                active={!activeCategory}
                label="All products"
                onClick={() => setParams({ category: null })}
              />
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <FilterLink
                  active={activeCategory === c.slug}
                  label={c.name}
                  onClick={() => setParams({ category: c.slug })}
                />
              </li>
            ))}
          </ul>
        </FilterGroup>
      )}

      {collections.length > 0 && (
        <FilterGroup label="Collection">
          <Select
            aria-label="Filter by collection"
            value={activeCollection}
            onChange={(e) => setParams({ collection: e.target.value || null })}
            options={[
              { value: "", label: "All collections" },
              ...collections.map((c) => ({ value: c.slug, label: c.name })),
            ]}
          />
        </FilterGroup>
      )}

      <FilterGroup label="Price (PKR)">
        <div className="flex items-center gap-2">
          <Input
            aria-label="Minimum price"
            type="number"
            min={0}
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
          <span className="text-taupe">–</span>
          <Input
            aria-label="Maximum price"
            type="number"
            min={0}
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" className="mt-3" onClick={applyPrice}>
          Apply
        </Button>
      </FilterGroup>

      <FilterGroup label="Colour">
        <div className="flex flex-wrap gap-2">
          {COLOR_PRESETS.map((c) => {
            const active = activeColor.toLowerCase() === c.name.toLowerCase();
            return (
              <button
                key={c.name}
                type="button"
                title={c.name}
                aria-label={`Filter by colour ${c.name}`}
                aria-pressed={active}
                onClick={() => setParams({ color: active ? null : c.name })}
                className={`h-8 w-8 rounded-full border transition-all ${
                  active
                    ? "scale-110 border-espresso ring-2 ring-espresso ring-offset-2 ring-offset-ivory"
                    : "border-espresso/20 hover:scale-105"
                }`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>
        {activeColor && (
          <button
            type="button"
            onClick={() => setParams({ color: null })}
            className="mt-2 font-sans text-xs text-espresso-muted underline hover:text-espresso"
          >
            Clear colour
          </button>
        )}
      </FilterGroup>

      <FilterGroup label="Availability">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) =>
              setParams({ inStock: e.target.checked ? "true" : null })
            }
            className="h-4 w-4 accent-[#737963]"
          />
          <span className="font-sans text-sm text-espresso">In stock only</span>
        </label>
      </FilterGroup>

      <button
        type="button"
        onClick={clearAll}
        className="font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted underline hover:text-espresso"
      >
        Clear all filters
      </button>
    </div>
  );

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          className="inline-flex items-center gap-2 rounded-full border border-espresso/20 px-5 py-2.5 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
          Filters
          <ChevronDown
            className={`h-4 w-4 transition-transform ${mobileOpen ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {sortSelect}
      </div>
      {mobileOpen && (
        <div className="mb-8 rounded-2xl border border-espresso/10 bg-ivory-light p-6 lg:hidden">
          {filters}
        </div>
      )}

      <div className="hidden lg:block">
        <div className="mb-6 flex items-center justify-between gap-3">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso">
            Filters
          </h2>
          {sortSelect}
        </div>
        {filters}
      </div>
    </>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 font-sans text-xs font-semibold uppercase tracking-widest2 text-espresso-muted">
        {label}
      </h3>
      {children}
    </div>
  );
}

function FilterLink({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`font-sans text-sm transition-colors ${
        active
          ? "font-semibold text-espresso"
          : "text-espresso-muted hover:text-espresso"
      }`}
    >
      {label}
    </button>
  );
}
