"use client";

import { useId, useState, type DragEvent } from "react";
import type { EditorialContentBlock } from "@/lib/inmoData";

type UploadImage = (file: File) => Promise<string>;

type EditorialMediaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  uploadImage: UploadImage;
  hint?: string;
  previewClassName?: string;
};

export function EditorialMediaField({
  label,
  value,
  onChange,
  uploadImage,
  hint = "Arrastrá una imagen o elegí un archivo. JPG, PNG, WebP o AVIF, hasta 8 MB.",
  previewClassName = "h-44",
}: EditorialMediaFieldProps) {
  const inputId = useId();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const receiveFile = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      onChange(await uploadImage(file));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "No se pudo subir la imagen.");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    void receiveFile(event.dataTransfer.files[0]);
  };

  return (
    <div className="grid gap-3">
      <div
        onDragEnter={(event) => { event.preventDefault(); event.stopPropagation(); setDragging(true); }}
        onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }}
        onDragLeave={(event) => { event.preventDefault(); event.stopPropagation(); setDragging(false); }}
        onDrop={handleDrop}
        className={[
          "overflow-hidden rounded-2xl border border-dashed bg-surface-container-low transition",
          dragging ? "border-primary bg-primary-fixed/50" : "border-outline-variant/50",
        ].join(" ")}
      >
        {value ? (
          <div className="relative">
            <img src={value} alt="" className={`${previewClassName} w-full object-cover`} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur"
            >
              Quitar
            </button>
          </div>
        ) : (
          <label htmlFor={inputId} className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="material-symbols-outlined text-3xl text-primary">add_photo_alternate</span>
            <span className="text-xs font-black uppercase tracking-[0.18em] text-primary">
              {uploading ? "Subiendo..." : label}
            </span>
            <span className="max-w-md text-xs leading-5 text-on-surface-variant">{hint}</span>
          </label>
        )}
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          disabled={uploading}
          onChange={(event) => void receiveFile(event.target.files?.[0])}
        />
      </div>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="O pegá la URL de la imagen"
        className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary"
      />
      {error ? <p className="text-xs font-semibold text-error" role="alert">{error}</p> : null}
    </div>
  );
}

type EditorialBlocksEditorProps = {
  blocks: EditorialContentBlock[];
  onChange: (blocks: EditorialContentBlock[]) => void;
  uploadImage: UploadImage;
};

const newBlock = (type: EditorialContentBlock["type"]): EditorialContentBlock => ({
  id: crypto.randomUUID(),
  type,
  text: "",
  image: "",
  alt: "",
  caption: "",
  layout: "wide",
});

export function EditorialBlocksEditor({
  blocks,
  onChange,
  uploadImage,
}: EditorialBlocksEditorProps) {
  const [draggedId, setDraggedId] = useState("");

  const updateBlock = (id: string, patch: Partial<EditorialContentBlock>) =>
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  const moveBlock = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length || from === to) return;
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const dropBlock = (targetId: string) => {
    const from = blocks.findIndex((block) => block.id === draggedId);
    const to = blocks.findIndex((block) => block.id === targetId);
    if (from >= 0 && to >= 0) moveBlock(from, to);
    setDraggedId("");
  };

  return (
    <section className="rounded-3xl border border-outline-variant/25 bg-surface-container-low p-5 md:p-7">
      <div className="flex flex-col gap-4 border-b border-outline-variant/25 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Composición del artículo</p>
          <h4 className="mt-2 text-xl font-headline font-bold text-primary">Texto e imágenes reordenables</h4>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-on-surface-variant">
            Arrastrá las tarjetas para ordenar la historia. Las imágenes pueden ocupar todo el ancho o flotar a izquierda o derecha del texto siguiente.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" onClick={() => onChange([...blocks, newBlock("text")])} className="rounded-xl border border-primary/25 px-4 py-2 text-xs font-black uppercase tracking-widest text-primary">
            + Texto
          </button>
          <button type="button" onClick={() => onChange([...blocks, newBlock("image")])} className="rounded-xl bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-on-primary">
            + Imagen
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        {blocks.length ? blocks.map((block, index) => (
          <article
            key={block.id}
            draggable
            onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; setDraggedId(block.id); }}
            onDragEnd={() => setDraggedId("")}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); dropBlock(block.id); }}
            className={[
              "rounded-2xl border bg-surface-container-lowest p-4 transition md:p-5",
              draggedId === block.id ? "border-primary opacity-55" : "border-outline-variant/30",
            ].join(" ")}
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined cursor-grab text-xl text-on-surface-variant" aria-hidden="true">drag_indicator</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  {String(index + 1).padStart(2, "0")} · {block.type === "text" ? "Texto" : "Imagen"}
                </span>
              </div>
              <div className="flex gap-1">
                <button type="button" disabled={index === 0} onClick={() => moveBlock(index, index - 1)} aria-label="Subir bloque" className="rounded-lg p-2 text-primary disabled:opacity-25"><span className="material-symbols-outlined text-lg">arrow_upward</span></button>
                <button type="button" disabled={index === blocks.length - 1} onClick={() => moveBlock(index, index + 1)} aria-label="Bajar bloque" className="rounded-lg p-2 text-primary disabled:opacity-25"><span className="material-symbols-outlined text-lg">arrow_downward</span></button>
                <button type="button" onClick={() => onChange(blocks.filter((item) => item.id !== block.id))} aria-label="Eliminar bloque" className="rounded-lg p-2 text-error"><span className="material-symbols-outlined text-lg">delete</span></button>
              </div>
            </div>

            {block.type === "text" ? (
              <textarea
                value={block.text}
                onChange={(event) => updateBlock(block.id, { text: event.target.value })}
                placeholder="Escribí uno o varios párrafos..."
                rows={7}
                className="w-full rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold leading-7 outline-none focus:border-primary"
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                <EditorialMediaField
                  label="Subir imagen del artículo"
                  value={block.image}
                  onChange={(image) => updateBlock(block.id, { image })}
                  uploadImage={uploadImage}
                  previewClassName="h-64"
                />
                <div className="grid content-start gap-3">
                  <label className="grid gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Posición
                    <select value={block.layout} onChange={(event) => updateBlock(block.id, { layout: event.target.value as EditorialContentBlock["layout"] })} className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-primary outline-none focus:border-primary">
                      <option value="wide">Ancho completo</option>
                      <option value="left">A la izquierda del texto</option>
                      <option value="right">A la derecha del texto</option>
                    </select>
                  </label>
                  <input value={block.alt} onChange={(event) => updateBlock(block.id, { alt: event.target.value })} placeholder="Descripción accesible de la imagen" className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
                  <textarea value={block.caption} onChange={(event) => updateBlock(block.id, { caption: event.target.value })} placeholder="Epígrafe opcional" rows={3} className="rounded-xl border border-outline-variant/40 px-4 py-3 text-sm font-semibold outline-none focus:border-primary" />
                </div>
              </div>
            )}
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-outline-variant/50 p-10 text-center">
            <p className="text-sm font-semibold text-on-surface-variant">Agregá un bloque de texto o una imagen para empezar a componer el artículo.</p>
          </div>
        )}
      </div>
    </section>
  );
}
