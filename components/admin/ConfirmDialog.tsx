"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { AdminButton } from "./AdminButton";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-800/10 text-red-800">
          <AlertTriangle size={20} />
        </div>
        <p className="pt-1.5 text-sm leading-relaxed text-espresso">{message}</p>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <AdminButton variant="secondary" onClick={onCancel} disabled={loading}>
          Cancel
        </AdminButton>
        <AdminButton variant="danger" onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </AdminButton>
      </div>
    </Modal>
  );
}
