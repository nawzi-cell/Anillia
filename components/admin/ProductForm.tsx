"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ImagePlus, ArrowLeft } from "lucide-react";
import { apiFetch } from "./admin-api";
import { slugify } from "./format";
import { useToast } from "./Toast";
import { AdminInput } from "./AdminInput";
import { AdminSelect } from "./AdminSelect";
import { AdminTextarea } from "./AdminTextarea";
import { AdminButton } from "./AdminButton";
import { AdminCard } from "./AdminCard";
import { ConfirmDialog } from "./ConfirmDialog";
import { LoadingState, ErrorState } from "./Spinner";
import type { Category, Collection, ProductFull, ProductVariant } from "./types";

interface ProductFormProps {
  productId?: string;
}

interface VariantRow extends ProductVariant {
  _key: string;
}

const blankVariant = (): VariantRow => ({
  _key: `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  name: "",
  color: "",
  size: "",
  sku: "",
  price: null,
  compareAtPrice: null,
  active: true,
  sortOrder: 0,
  quantity: 0,
  lowStockThreshold: 5,
});

export function ProductForm({ productId }: ProductFormProps) {
  const isEdit = Boolean(productId);
  const router = useRouter();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Core fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [colorsInput, setColorsInput] = useState("");
  const [material, setMaterial] = useState("");
  const [careInstructions, setCareInstructions] = useState("");
  const [published, setPublished] = useState(false);
  const [featured, setFeatured] = useState(false);
  const [images, setImages] = useState<{ url: string; alt: string }[]>([
    { url: "", alt: "" },
  ]);
  const [variants, setVariants] = useState<VariantRow[]>([]);

  const slugSuggestion = useMemo(() => slugify(name), [name]);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cats, cols] = await Promise.all([
        apiFetch<Category[]>("/api/categories"),
        apiFetch<Collection[]>("/api/collections"),
      ]);
      setCategories(cats);
      setCollections(cols);

      if (productId) {
        const p = await apiFetch<ProductFull>(`/api/admin/products/${productId}`);
        setName(p.name ?? "");
        setSlug(p.slug ?? "");
        setSlugTouched(true);
        setDescription(p.description ?? "");
        setShortDescription(p.shortDescription ?? "");
        setPrice(p.price != null ? String(p.price) : "");
        setCompareAtPrice(p.compareAtPrice != null ? String(p.compareAtPrice) : "");
        setSku(p.sku ?? "");
        setCategoryId(p.categoryId ?? "");
        setCollectionIds(p.collections ?? []);
        setColorsInput((p.colors ?? []).join(", "));
        setMaterial(p.material ?? "");
        setCareInstructions(p.careInstructions ?? "");
        setPublished(Boolean(p.published));
        setFeatured(Boolean(p.featured));
        setImages(
          p.images && p.images.length > 0
            ? p.images.map((img) => ({ url: img.url, alt: img.alt ?? "" }))
            : [{ url: "", alt: "" }],
        );
        setVariants(
          (p.variants ?? []).map((v) => ({
            ...v,
            _key: v.id ?? blankVariant()._key,
          })),
        );
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load product.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleNameChange = (v: string) => {
    setName(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const toggleCollection = (id: string) => {
    setCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const updateVariant = (key: string, patch: Partial<VariantRow>) => {
    setVariants((prev) =>
      prev.map((v) => (v._key === key ? { ...v, ...patch } : v)),
    );
  };

  const removeVariant = (key: string) => {
    setVariants((prev) => prev.filter((v) => v._key !== key));
  };

  const numOrNull = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      error("Product name is required.");
      return;
    }
    const priceNum = Number(price);
    if (price.trim() === "" || Number.isNaN(priceNum) || priceNum < 0) {
      error("Enter a valid price in PKR.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugSuggestion,
        description: description.trim() || null,
        shortDescription: shortDescription.trim() || null,
        price: priceNum,
        compareAtPrice: numOrNull(compareAtPrice),
        sku: sku.trim() || null,
        categoryId: categoryId || null,
        collections: collectionIds,
        colors: colorsInput
          .split(",")
          .map((c) => c.trim())
          .filter(Boolean),
        material: material.trim() || null,
        careInstructions: careInstructions.trim() || null,
        published,
        featured,
        images: images
          .filter((img) => img.url.trim() !== "")
          .map((img, i) => ({
            url: img.url.trim(),
            alt: img.alt.trim() || name.trim(),
            sortOrder: i,
          })),
        variants: variants.map((v, i) => ({
          ...(v.id ? { id: v.id } : {}),
          name: v.name.trim() || `Variant ${i + 1}`,
          color: v.color?.trim() || null,
          size: v.size?.trim() || null,
          sku: v.sku.trim(),
          price: v.price ?? null,
          compareAtPrice: v.compareAtPrice ?? null,
          active: v.active,
          sortOrder: i,
          quantity: Number(v.quantity) || 0,
          lowStockThreshold: Number(v.lowStockThreshold) || 0,
        })),
      };

      if (isEdit) {
        await apiFetch(`/api/admin/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        success("Product updated.");
      } else {
        await apiFetch("/api/admin/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        success("Product created.");
      }
      router.push("/admin/products");
    } catch (err) {
      error(err instanceof Error ? err.message : "Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!productId) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      success("Product deleted.");
      router.push("/admin/products");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete product.";
      error(msg);
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <AdminCard>
        <LoadingState label="Loading product…" />
      </AdminCard>
    );
  }

  if (loadError) {
    return (
      <AdminCard>
        <ErrorState message={loadError} onRetry={() => void load()} />
      </AdminCard>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Basics */}
        <AdminCard
          title={isEdit ? "Product details" : "New product"}
          subtitle="Core catalogue information."
        >
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Premium Chiffon Hijab"
                required
              />
              <div>
                <AdminInput
                  label="Slug"
                  value={slug}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                    setSlugTouched(true);
                  }}
                  placeholder="premium-chiffon-hijab"
                  hint={
                    !slugTouched && slugSuggestion
                      ? `Auto-suggested: ${slugSuggestion}`
                      : undefined
                  }
                />
              </div>
            </div>
            <AdminTextarea
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Full product story, fabric details, styling notes…"
            />
            <AdminInput
              label="Short description"
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="One-line summary shown on cards and listings."
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <AdminInput
                label="Price (PKR)"
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="2490"
                required
              />
              <AdminInput
                label="Compare-at price (PKR)"
                type="number"
                min="0"
                step="any"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="Optional"
              />
              <AdminInput
                label="SKU"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                placeholder="ANI-HJB-001"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminSelect
                label="Category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">— No category —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </AdminSelect>
              <AdminInput
                label="Colors"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Ivory, Espresso, Olive"
                hint="Comma-separated — becomes the color array."
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminInput
                label="Material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Premium chiffon"
              />
              <AdminTextarea
                label="Care instructions"
                value={careInstructions}
                onChange={(e) => setCareInstructions(e.target.value)}
                rows={2}
                placeholder="Hand wash cold, line dry…"
              />
            </div>
            <fieldset>
              <legend className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-espresso-muted">
                Collections
              </legend>
              {collections.length === 0 ? (
                <p className="text-sm text-espresso-muted">
                  No collections yet — create one under Categories & Collections first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {collections.map((col) => {
                    const checked = collectionIds.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                          checked
                            ? "border-espresso bg-espresso text-ivory"
                            : "border-espresso/20 text-espresso-muted hover:border-espresso/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleCollection(col.id)}
                        />
                        {col.name}
                      </label>
                    );
                  })}
                </div>
              )}
            </fieldset>
            <div className="flex flex-wrap gap-6">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-espresso">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="h-4 w-4 accent-[#737963]"
                />
                Published
                <span className="font-normal text-espresso-muted">
                  (visible in store)
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-espresso">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="h-4 w-4 accent-[#737963]"
                />
                Featured
                <span className="font-normal text-espresso-muted">
                  (highlighted placement)
                </span>
              </label>
            </div>
          </div>
        </AdminCard>

        {/* Images */}
        <AdminCard
          title="Images"
          subtitle="Paste image URLs. Placeholder SVGs live under /images/products/*.svg."
          actions={
            <AdminButton
              variant="secondary"
              size="sm"
              icon={<ImagePlus size={15} />}
              onClick={() => setImages((prev) => [...prev, { url: "", alt: "" }])}
            >
              Add image
            </AdminButton>
          }
        >
          <div className="flex flex-col gap-3">
            {images.map((img, i) => (
              <div key={i} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <AdminInput
                  label={i === 0 ? "Image URL" : undefined}
                  value={img.url}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                    )
                  }
                  placeholder="/images/products/hijab-01.svg"
                />
                <AdminInput
                  label={i === 0 ? "Alt text" : undefined}
                  value={img.alt}
                  onChange={(e) =>
                    setImages((prev) =>
                      prev.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)),
                    )
                  }
                  placeholder="Descriptive alt text"
                />
                <AdminButton
                  variant="ghost"
                  size="sm"
                  icon={<Trash2 size={15} />}
                  onClick={() =>
                    setImages((prev) =>
                      prev.length > 1 ? prev.filter((_, j) => j !== i) : prev,
                    )
                  }
                  aria-label={`Remove image ${i + 1}`}
                  className="text-red-800"
                >
                  {""}
                </AdminButton>
              </div>
            ))}
          </div>
        </AdminCard>

        {/* Variants */}
        <AdminCard
          title="Variants"
          subtitle="Color / size combinations with their own SKU and stock."
          actions={
            <AdminButton
              variant="secondary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => setVariants((prev) => [...prev, blankVariant()])}
            >
              Add variant
            </AdminButton>
          }
        >
          {variants.length === 0 ? (
            <p className="text-sm text-espresso-muted">
              No variants yet. Products without variants sell as a single SKU —
              add variants for color/size options.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {variants.map((v, i) => (
                <div
                  key={v._key}
                  className="rounded-lg border border-espresso/10 bg-ivory p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="font-sans text-sm font-semibold text-espresso">
                      Variant {i + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeVariant(v._key)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-800 hover:underline"
                    >
                      <Trash2 size={13} /> Remove
                    </button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <AdminInput
                      label="Name"
                      value={v.name}
                      onChange={(e) => updateVariant(v._key, { name: e.target.value })}
                      placeholder="Ivory / M"
                    />
                    <AdminInput
                      label="Color"
                      value={v.color ?? ""}
                      onChange={(e) => updateVariant(v._key, { color: e.target.value })}
                      placeholder="Ivory"
                    />
                    <AdminInput
                      label="Size"
                      value={v.size ?? ""}
                      onChange={(e) => updateVariant(v._key, { size: e.target.value })}
                      placeholder="M"
                    />
                    <AdminInput
                      label="SKU"
                      value={v.sku}
                      onChange={(e) =>
                        updateVariant(v._key, { sku: e.target.value.toUpperCase() })
                      }
                      placeholder="ANI-HJB-001-IVM"
                    />
                    <AdminInput
                      label="Price override (PKR)"
                      type="number"
                      min="0"
                      step="any"
                      value={v.price ?? ""}
                      onChange={(e) =>
                        updateVariant(v._key, {
                          price: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      hint="Blank = product price"
                    />
                    <AdminInput
                      label="Compare-at (PKR)"
                      type="number"
                      min="0"
                      step="any"
                      value={v.compareAtPrice ?? ""}
                      onChange={(e) =>
                        updateVariant(v._key, {
                          compareAtPrice:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                    <AdminInput
                      label="Stock quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={v.quantity}
                      onChange={(e) =>
                        updateVariant(v._key, { quantity: Number(e.target.value) || 0 })
                      }
                    />
                    <AdminInput
                      label="Low-stock threshold"
                      type="number"
                      min="0"
                      step="1"
                      value={v.lowStockThreshold}
                      onChange={(e) =>
                        updateVariant(v._key, {
                          lowStockThreshold: Number(e.target.value) || 0,
                        })
                      }
                    />
                    <label className="flex cursor-pointer items-end gap-2.5 pb-2 text-sm font-medium text-espresso">
                      <input
                        type="checkbox"
                        checked={v.active}
                        onChange={(e) => updateVariant(v._key, { active: e.target.checked })}
                        className="h-4 w-4 accent-[#737963]"
                      />
                      Active
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            <AdminButton
              variant="secondary"
              onClick={() => router.push("/admin/products")}
              icon={<ArrowLeft size={15} />}
            >
              Back to products
            </AdminButton>
            {isEdit && (
              <AdminButton
                variant="danger"
                onClick={() => setConfirmDelete(true)}
                icon={<Trash2 size={15} />}
              >
                Delete
              </AdminButton>
            )}
          </div>
          <AdminButton type="submit" size="lg" loading={saving}>
            {isEdit ? "Save changes" : "Create product"}
          </AdminButton>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete product"
        message="This will permanently delete the product and its variants. If the product is referenced by existing orders, the server will refuse with an error."
        confirmLabel="Delete product"
        loading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setConfirmDelete(false)}
      />
    </>
  );
}
