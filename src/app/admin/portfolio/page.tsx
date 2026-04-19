"use client";

import AdminStepUpModal from "@/components/AdminStepUpModal";
import { useState, useEffect, useCallback, useRef } from "react";
import { api, getApiErrorMessage } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAdminStepUp } from "@/hooks/useAdminStepUp";
import type {
  AdminPortfolioItem,
  PaginatedResponse,
  ServiceCategory,
} from "@/types";
import { CATEGORY_LABELS } from "@/lib/utils";
import Spinner from "@/components/Spinner";
import EmptyState from "@/components/EmptyState";
import ConfirmModal from "@/components/ConfirmModal";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiEyeOff,
  FiArrowUp,
  FiArrowDown,
  FiX,
  FiImage,
  FiVideo,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

const CATEGORIES: ServiceCategory[] = [
  "BRIDAL",
  "NON_BRIDAL",
  "PARTY",
  "HAIR",
  "LASHES",
];

interface FormState {
  modelName: string;
  makeupType: string;
  description: string;
  category: ServiceCategory;
  instagramUrl: string;
  isPublished: boolean;
  sortOrder: number;
}

const emptyForm: FormState = {
  modelName: "",
  makeupType: "",
  description: "",
  category: "BRIDAL",
  instagramUrl: "",
  isPublished: false,
  sortOrder: 0,
};

export default function AdminPortfolioPage() {
  const { showToast } = useToast();
  const { runWithStepUp, modalProps } = useAdminStepUp();
  const [items, setItems] = useState<AdminPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create / Edit form
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [saving, setSaving] = useState(false);

  const imageRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [publishLoadingId, setPublishLoadingId] = useState<string | null>(null);

  // Reorder
  const [reordering, setReordering] = useState(false);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<PaginatedResponse<AdminPortfolioItem>>(
        `/admin/portfolio?page=${page}&limit=20`
      );
      setItems(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Failed to load portfolio"), "error");
    } finally {
      setLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(null);
    setVideoPreview(null);
    setRemoveVideo(false);
    if (imageRef.current) imageRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
    setShowForm(false);
  };

  const openEdit = (item: AdminPortfolioItem) => {
    setEditId(item.id);
    setForm({
      modelName: item.modelName,
      makeupType: item.makeupType,
      description: item.description || "",
      category: item.category,
      instagramUrl: item.instagramUrl || "",
      isPublished: item.isPublished ?? false,
      sortOrder: item.sortOrder,
    });
    setImagePreview(item.imageUrl);
    setVideoPreview(item.videoUrl);
    setImageFile(null);
    setVideoFile(null);
    setRemoveVideo(false);
    if (imageRef.current) imageRef.current.value = "";
    if (videoRef.current) videoRef.current.value = "";
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setRemoveVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
    setVideoPreview(null);
    setRemoveVideo(true);
    if (videoRef.current) videoRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.modelName || !form.makeupType) {
      showToast("Model name and makeup type are required", "error");
      return;
    }
    if (!editId && !imageFile) {
      showToast("Image is required for new items", "error");
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("modelName", form.modelName);
      fd.append("makeupType", form.makeupType);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("instagramUrl", form.instagramUrl);
      fd.append("isPublished", String(form.isPublished));
      fd.append("sortOrder", String(form.sortOrder));
      if (imageFile) fd.append("image", imageFile);
      if (videoFile) fd.append("video", videoFile);
      if (editId && removeVideo) fd.append("removeVideo", "true");

      if (editId) {
        await api.putFormData(`/admin/portfolio/${editId}`, fd);
        showToast("Portfolio item updated");
      } else {
        await api.postFormData("/admin/portfolio", fd);
        showToast("Portfolio item created");
      }
      resetForm();
      fetchItems();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Save failed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/portfolio/${deleteId}`);
      showToast("Portfolio item deleted");
      setDeleteId(null);
      await fetchItems();
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Delete failed"), "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (id: string) => {
    setPublishLoadingId(id);

    await runWithStepUp(async () => {
      const res = await api.patch<{ message: string }>(`/admin/portfolio/${id}/publish`);
      showToast(res.message);
      await fetchItems();
    }, "Toggle failed");

    setPublishLoadingId(null);
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    const idx = items.findIndex((i) => i.id === id);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= items.length) return;

    const newItems = [...items];
    const tempOrder = newItems[idx].sortOrder;
    newItems[idx].sortOrder = newItems[swapIdx].sortOrder;
    newItems[swapIdx].sortOrder = tempOrder;
    [newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]];
    setItems(newItems);

    setReordering(true);
    try {
      await api.patch("/admin/portfolio/reorder", {
        items: newItems.map((i) => ({ id: i.id, sortOrder: i.sortOrder })),
      });
    } catch (err: unknown) {
      showToast(getApiErrorMessage(err, "Reorder failed"), "error");
      fetchItems();
    } finally {
      setReordering(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 rounded-lg bg-linear-to-r from-brand-pink to-brand-rose px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
        >
          {showForm ? (
            <>
              <FiX className="h-4 w-4" /> Cancel
            </>
          ) : (
            <>
              <FiPlus className="h-4 w-4" /> Add Item
            </>
          )}
        </button>
      </div>

      {/* Create / Edit form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="mb-6 overflow-hidden rounded-xl border border-white/8 bg-white/3 p-5"
          >
            <h3 className="mb-4 text-lg font-semibold">
              {editId ? "Edit Portfolio Item" : "New Portfolio Item"}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Model Name *
                </label>
                <input
                  type="text"
                  value={form.modelName}
                  onChange={(e) =>
                    setForm({ ...form, modelName: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Makeup Type *
                </label>
                <input
                  type="text"
                  value={form.makeupType}
                  onChange={(e) =>
                    setForm({ ...form, makeupType: e.target.value })
                  }
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Category
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value as ServiceCategory,
                    })
                  }
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Instagram URL
                </label>
                <input
                  type="url"
                  value={form.instagramUrl}
                  onChange={(e) =>
                    setForm({ ...form, instagramUrl: e.target.value })
                  }
                  placeholder="https://instagram.com/p/..."
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs text-white/40">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-white/20 focus:border-brand-pink/50 focus:outline-none"
                />
              </div>

              {/* Uploads */}
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Image {!editId && "*"}
                </label>
                <input
                  ref={imageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 py-3 text-sm text-white/40 transition hover:border-brand-pink/40 hover:text-brand-pink"
                >
                  <FiImage className="h-4 w-4" />
                  {imageFile
                    ? imageFile.name
                    : editId
                    ? "Replace image"
                    : "Choose image"}
                </button>
                {imagePreview && (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="mt-2 h-32 w-auto rounded-lg border border-white/8 object-cover"
                  />
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs text-white/40">
                  Video (optional)
                </label>
                <input
                  ref={videoRef}
                  type="file"
                  accept="video/*"
                  onChange={handleVideoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => videoRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 px-4 py-3 text-sm text-white/40 transition hover:border-brand-pink/40 hover:text-brand-pink"
                >
                  <FiVideo className="h-4 w-4" />
                  {videoFile
                    ? videoFile.name
                    : editId
                    ? "Replace video"
                    : "Choose video"}
                </button>
                {videoPreview && (
                  <div className="mt-2 space-y-2">
                    <video
                      src={videoPreview}
                      className="h-32 w-auto rounded-lg border border-white/8"
                      controls
                      muted
                    />
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-400/30 px-3 py-2 text-xs font-medium text-red-300 transition hover:border-red-300/50 hover:text-red-200"
                    >
                      <FiX className="h-3.5 w-3.5" />
                      Remove Video
                    </button>
                  </div>
                )}
                {editId && removeVideo && !videoPreview && (
                  <p className="mt-2 text-xs text-amber-200/80">
                    Video will be removed when you save this item.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-6 sm:col-span-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) =>
                      setForm({ ...form, isPublished: e.target.checked })
                    }
                    className="rounded border-white/20 bg-white/5 text-brand-pink accent-[#f9a8c9]"
                  />
                  <span className="text-white/60">Publish immediately</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40">Sort order:</label>
                  <input
                    type="number"
                    value={form.sortOrder}
                    onChange={(e) =>
                      setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })
                    }
                    className="w-20 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm focus:border-brand-pink/50 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-linear-to-r from-brand-pink to-brand-rose px-5 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editId
                  ? "Update Item"
                  : "Create Item"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Items list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No portfolio items"
          description='Add your first portfolio item by clicking "Add Item".'
        />
      ) : (
        <>
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`flex flex-col gap-4 rounded-xl border bg-white/3 p-4 sm:flex-row sm:items-center ${
                  item.isPublished ? "border-white/8" : "border-white/5 opacity-60"
                }`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.modelName}
                  className="h-20 w-20 shrink-0 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{item.modelName}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-xs text-white/40">
                      {CATEGORY_LABELS[item.category]}
                    </span>
                    {!item.isPublished && (
                      <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300">
                        Draft
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50">{item.makeupType}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs text-white/30 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => handleReorder(item.id, "up")}
                    disabled={idx === 0 || reordering}
                    className="rounded-lg p-2 text-white/30 transition hover:text-white disabled:opacity-20"
                    title="Move up"
                  >
                    <FiArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleReorder(item.id, "down")}
                    disabled={idx === items.length - 1 || reordering}
                    className="rounded-lg p-2 text-white/30 transition hover:text-white disabled:opacity-20"
                    title="Move down"
                  >
                    <FiArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleTogglePublish(item.id)}
                    disabled={publishLoadingId === item.id}
                    className="rounded-lg p-2 text-white/30 transition hover:text-brand-pink disabled:opacity-40"
                    title={item.isPublished ? "Unpublish" : "Publish"}
                  >
                    {item.isPublished ? (
                      <FiEyeOff className="h-4 w-4" />
                    ) : (
                      <FiEye className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => openEdit(item)}
                    className="rounded-lg p-2 text-white/30 transition hover:text-white"
                    title="Edit"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="rounded-lg p-2 text-white/30 transition hover:text-red-400"
                    title="Delete"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30"
              >
                <FiChevronLeft />
              </button>
              <span className="text-sm text-white/40">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-white/10 p-2 text-white/50 transition hover:text-white disabled:opacity-30"
              >
                <FiChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteId}
        title="Delete Portfolio Item"
        message="This will permanently delete this item and its files. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteId(null)}
        loading={deleting}
        variant="danger"
      />

      <AdminStepUpModal {...modalProps} />
    </div>
  );
}
