"use client";

import { useRef, useState, useTransition } from "react";
import { addRepairAttachments, cancelRepairRequest, confirmRepairCollection, decideRepairQuote } from "@/lib/repairs/actions";
import { createClient } from "@/lib/supabase/client";
import type { RepairAttachmentInput } from "@/lib/repairs/types";

type Props = {
  reference: string;
  profileId: string;
  canCancel: boolean;
  canConfirmCompletion: boolean;
  pendingQuoteId?: string;
};

const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const maxFileSize = 10 * 1024 * 1024;

export function RepairTrackingActions({ reference, profileId, canCancel, canConfirmCompletion, pendingQuoteId }: Props) {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function shareReference() {
    setError(null);
    const text = `EC TECH HUB repair reference: ${reference}`;
    try {
      if (navigator.share) await navigator.share({ title: "EC TECH HUB repair reference", text, url: window.location.href });
      else {
        await navigator.clipboard.writeText(text);
        setNotice("Repair reference copied to clipboard.");
      }
    } catch {
      setError("We could not share the reference from this browser. You can copy it manually from the page header.");
    }
  }

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    setNotice(null);
    const selected = Array.from(files);
    const invalid = selected.find((file) => !acceptedTypes.includes(file.type) || file.size > maxFileSize);
    if (invalid) {
      setError("Use JPG, PNG, WEBP, or PDF files up to 10 MB each.");
      return;
    }
    setUploading(true);
    try {
      const supabase = createClient();
      const uploaded: RepairAttachmentInput[] = [];
      for (const file of selected) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 90);
        const storagePath = `${profileId}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("repair-attachments").upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        uploaded.push({ storagePath, fileName: file.name, contentType: file.type, fileSizeBytes: file.size });
      }
      const result = await addRepairAttachments({ reference, attachments: uploaded });
      if (!result.ok) setError(result.message ?? "We could not add the uploaded files.");
      else setNotice(result.message ?? "Additional files uploaded.");
    } catch {
      setError("Upload failed. Check your connection and storage configuration, then try again.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function runAction(action: () => Promise<{ ok: boolean; message?: string }>) {
    setError(null);
    setNotice(null);
    startTransition(async () => {
      const result = await action();
      if (result.ok) setNotice(result.message ?? "Action completed.");
      else setError(result.message ?? "We could not complete that action.");
    });
  }

  return (
    <section aria-label="Repair actions" className="rounded-[28px] bg-white p-5 shadow-[var(--shadow-soft)]">
      <h2 className="text-lg font-bold text-[var(--deep-navy)]">Customer actions</h2>
      <p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Only actions available for the current repair status are enabled.</p>
      {notice ? <p className="mt-4 rounded-2xl bg-[var(--trust-green-surface)] p-3 text-sm font-semibold text-[var(--trust-green)]" role="status">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm font-semibold text-[var(--danger)]" role="alert">{error}</p> : null}
      <div className="mt-5 grid gap-3">
        {pendingQuoteId ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <button type="button" disabled={isPending} onClick={() => runAction(() => decideRepairQuote({ reference, quoteId: pendingQuoteId, decision: "approved" }))} className="min-h-12 rounded-[14px] bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">Approve Quote</button>
            <button type="button" disabled={isPending} onClick={() => runAction(() => decideRepairQuote({ reference, quoteId: pendingQuoteId, decision: "declined" }))} className="min-h-12 rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] ring-1 ring-[var(--divider)] disabled:opacity-60">Decline Quote</button>
          </div>
        ) : (
          <DisabledAction label="Approve Quote" reason="No quotation is awaiting approval." />
        )}
        <input ref={fileRef} type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" className="sr-only" onChange={(event) => uploadFiles(event.target.files)} />
        <button type="button" disabled={uploading || isPending} onClick={() => fileRef.current?.click()} className="min-h-12 rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] ring-1 ring-[var(--divider)] disabled:opacity-60">{uploading ? "Uploading..." : "Upload Additional Photos"}</button>
        <a href={`/contact?topic=repairs&reference=${encodeURIComponent(reference)}`} className="inline-flex min-h-12 items-center justify-center rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] ring-1 ring-[var(--divider)]">Send Message</a>
        <button type="button" onClick={shareReference} className="min-h-12 rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] ring-1 ring-[var(--divider)]">Share Repair Reference</button>
        {canConfirmCompletion ? <button type="button" disabled={isPending} onClick={() => runAction(() => confirmRepairCollection(reference))} className="min-h-12 rounded-[14px] bg-[var(--trust-green)] px-4 text-sm font-semibold text-white disabled:opacity-60">Confirm Collection</button> : <DisabledAction label="Confirm Collection" reason="Available once the repair is ready or completed." />}
        {canCancel ? <button type="button" disabled={isPending} onClick={() => runAction(() => cancelRepairRequest(reference))} className="min-h-12 rounded-[14px] bg-red-50 px-4 text-sm font-semibold text-[var(--danger)] disabled:opacity-60">Cancel Request</button> : <DisabledAction label="Cancel Request" reason="Cancellation is not available at this stage." />}
      </div>
    </section>
  );
}

function DisabledAction({ label, reason }: { label: string; reason: string }) {
  return <button type="button" disabled title={reason} className="min-h-12 rounded-[14px] bg-[var(--secondary-surface)] px-4 text-sm font-semibold text-[var(--muted-text)]">{label}</button>;
}