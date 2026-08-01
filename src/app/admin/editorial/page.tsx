"use client";

import { useMemo, useState, type FormEvent } from "react";
import AdminShell from "@/components/inmo/admin/AdminShell";
import type { EditorialPost } from "@/lib/inmoData";
import { useInmoStore } from "@/lib/inmoStore";
import { readAdminSession } from "@/lib/session";

const emptyPost = (): EditorialPost => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    coverImage: "",
    category: "Guías",
    metaTitle: "",
    metaDescription: "",
    published: false,
    publishedAt: now,
    createdAt: now,
    updatedAt: now,
  };
};

const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

export default function AdminEditorialPage() {
  const { state, updateState } = useInmoStore();
  const [form, setForm] = useState<EditorialPost>(emptyPost);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const posts = useMemo(
    () =>
      [...state.editorialPosts].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [state.editorialPosts]
  );

  const update = <K extends keyof EditorialPost>(key: K, value: EditorialPost[K]) =>
    setForm((prev) => ({
      ...prev,
      [key]: value,
      slug: key === "title" && !editingId ? slugify(String(value)) : prev.slug,
    }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    const adminId = readAdminSession()?.adminId;
    if (!adminId) {
      setMessage("La sesión venció. Volvé a ingresar.");
      return;
    }
    setSaving(true);
    try {
    const now = new Date().toISOString();
    const nextPost: EditorialPost = {
      ...form,
      slug: slugify(form.slug || form.title),
      metaTitle: form.metaTitle || form.title,
      metaDescription: form.metaDescription || form.excerpt,
      publishedAt: form.published ? form.publishedAt || now : form.publishedAt,
      updatedAt: now,
    };

    const response = await fetch("/api/admin/editorial", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-id": adminId,
      },
      body: JSON.stringify(nextPost),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      error?: string;
    } | null;
    if (!response.ok || !result?.ok) {
      setMessage(result?.error || "No se pudo guardar el artículo.");
      return;
    }


    updateState((prev) => ({
      ...prev,
      editorialPosts: editingId
        ? prev.editorialPosts.map((post) => (post.id === editingId ? nextPost : post))
        : [nextPost, ...prev.editorialPosts],
    }), { persist: false });
    setForm(emptyPost());
    setEditingId("");
    setMessage("Artículo guardado.");
    } catch {
      setMessage("No se pudo conectar con el servidor editorial.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (post: EditorialPost) => {
    setForm(post);
    setEditingId(post.id);
    setMessage("");
    document.getElementById("editorial-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const remove = async (postId: string) => {
    setMessage("");
    const adminId = readAdminSession()?.adminId;
    if (!adminId) {
      setMessage("La sesión venció. Volvé a ingresar.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/editorial?id=${encodeURIComponent(postId)}`, {
        method: "DELETE",
        headers: { "x-admin-id": adminId },
      });
      const result = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
      } | null;
      if (!response.ok || !result?.ok) {
        setMessage(result?.error || "No se pudo eliminar el artículo.");
        return;
      }
      updateState((prev) => ({
        ...prev,
        editorialPosts: prev.editorialPosts.filter((post) => post.id !== postId),
      }), { persist: false });
      setMessage("Artículo eliminado.");
    } catch {
      setMessage("No se pudo conectar con el servidor editorial.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell activeSection="editorial" title="Editorial" subtitle="Vivir Buenos Aires">
      <section id="editorial-form" className="mt-8 rounded-3xl bg-surface-container-lowest p-8">
        <h3 className="text-xl font-headline font-bold text-primary">
          {editingId ? "Editar artículo" : "Nuevo artículo"}
        </h3>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={form.title} onChange={(event) => update("title", event.target.value)} placeholder="Título" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
            <input required value={form.slug} onChange={(event) => update("slug", event.target.value)} placeholder="slug-url-amigable" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.category} onChange={(event) => update("category", event.target.value)} placeholder="Categoría" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
            <input value={form.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="Imagen destacada URL" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
          </div>
          <textarea required value={form.excerpt} onChange={(event) => update("excerpt", event.target.value)} placeholder="Bajada" rows={3} className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
          <textarea required value={form.body} onChange={(event) => update("body", event.target.value)} placeholder="Cuerpo del artículo" rows={9} className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.metaTitle} onChange={(event) => update("metaTitle", event.target.value)} placeholder="Meta título" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
            <input value={form.metaDescription} onChange={(event) => update("metaDescription", event.target.value)} placeholder="Meta descripción" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
          </div>
          <label className="flex items-center gap-3 text-sm font-bold text-primary">
            <input type="checkbox" checked={form.published} onChange={(event) => update("published", event.target.checked)} />
            Publicado
          </label>
          <div className="flex flex-wrap gap-3">
            <button disabled={saving} className="rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-on-primary disabled:cursor-wait disabled:opacity-60">
              {saving ? "Guardando..." : "Guardar artículo"}
            </button>
            {editingId ? (
              <button type="button" onClick={() => { setForm(emptyPost()); setEditingId(""); }} className="rounded-xl border border-outline-variant/40 px-5 py-3 text-xs font-black uppercase tracking-widest text-primary">
                Cancelar
              </button>
            ) : null}
          </div>
          {message ? <p className="text-sm font-semibold text-primary">{message}</p> : null}
        </form>
      </section>

      <section className="mt-8 grid gap-4">
        {posts.map((post) => (
          <article key={post.id} className="grid gap-4 rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {post.category} · {post.published ? "Publicado" : "Borrador"}
              </p>
              <h3 className="mt-2 text-xl font-headline font-bold text-primary">{post.title}</h3>
              <p className="mt-2 text-sm text-on-surface-variant">{post.excerpt}</p>
              <p className="mt-2 text-xs text-on-surface-variant">/{post.slug}</p>
            </div>
            <div className="flex gap-2">
              <button disabled={saving} onClick={() => edit(post)} className="rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-on-primary disabled:opacity-50">
                Editar
              </button>
              <button disabled={saving} onClick={() => void remove(post.id)} className="rounded-xl border border-outline-variant/40 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary disabled:opacity-50">
                Eliminar
              </button>
            </div>
          </article>
        ))}
      </section>
    </AdminShell>
  );
}
