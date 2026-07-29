"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { saveRepairDraft, submitRepairRequest } from "@/lib/repairs/actions";
import { approximateAges, deviceCategories, provinces, servicePreferences, symptomOptions, urgencyOptions, warrantyStatuses, type RepairActionState, type RepairAttachmentInput, type RepairDraft } from "@/lib/repairs/types";
import { Icon } from "@/components/ui/icon";

const steps = ["Device Information", "Problem Description", "Photos & Attachments", "Location", "Review & Submit"] as const;
const maxDescription = 900;
const maxFileSize = 10 * 1024 * 1024;
const acceptedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

type UploadFile = { id: string; file: File; previewUrl?: string; status: "ready" | "uploading" | "uploaded" | "error"; progress: number; error?: string; uploaded?: RepairAttachmentInput };

export function RepairRequestFlow({ initialDraft, initialStep, profileId }: { initialDraft: RepairDraft | null; initialStep: number; profileId?: string }) {
  const [step, setStep] = useState(initialStep || 1);
  const [draft, setDraft] = useState<RepairDraft>(() => {
    if (initialDraft) return initialDraft;
    if (typeof window === "undefined") return {};
    const raw = window.localStorage.getItem("ec-repair-draft");
    if (!raw) return {};
    try { return JSON.parse(raw) as RepairDraft; } catch { return {}; }
  });
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [result, setResult] = useState<RepairActionState | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const firstErrorRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    window.localStorage.setItem("ec-repair-draft", JSON.stringify(draft));
  }, [draft]);

  useEffect(() => () => files.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl)), [files]);

  useEffect(() => {
    if (Object.keys(errors).length) firstErrorRef.current?.focus();
  }, [errors]);

  const summary = useMemo(() => [
    ["Device", [draft.deviceCategory, draft.brand, draft.model].filter(Boolean).join(" · ") || "Not completed"],
    ["Problem", draft.problemTitle || "Not completed"],
    ["Location", [draft.area, draft.city, draft.province].filter(Boolean).join(", ") || "Not completed"],
    ["Service", servicePreferences.find((item) => item.value === draft.servicePreference)?.label || "Not completed"],
  ], [draft]);

  function update<K extends keyof RepairDraft>(key: K, value: RepairDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => { const next = { ...current }; delete next[String(key)]; return next; });
  }

  function validate(targetStep = step) {
    const next: Record<string, string> = {};
    if (targetStep === 1) {
      if (!draft.deviceCategory) next.deviceCategory = "Choose a device category.";
      if (!draft.brand?.trim()) next.brand = "Enter the brand.";
      if (!draft.model?.trim()) next.model = "Enter the model, or type Unknown.";
      if (!draft.approximateAge) next.approximateAge = "Choose the approximate age.";
    }
    if (targetStep === 2) {
      if (!draft.problemTitle || draft.problemTitle.trim().length < 6) next.problemTitle = "Add a short problem title.";
      if (!draft.problemDescription || draft.problemDescription.trim().length < 30) next.problemDescription = "Describe the issue in at least 30 characters.";
      if (!draft.symptoms?.length) next.symptoms = "Select at least one symptom.";
      if (!draft.startedWhen?.trim()) next.startedWhen = "Tell us when it started.";
      if (!draft.urgency) next.urgency = "Choose an urgency.";
    }
    if (targetStep === 4) {
      if (!draft.province?.trim()) next.province = "Enter your province.";
      if (!draft.city?.trim()) next.city = "Enter your city.";
      if (!draft.area?.trim()) next.area = "Enter your area.";
      if (!draft.servicePreference) next.servicePreference = "Choose a service preference.";
    }
    if (targetStep === 5 && !confirmed) next.confirmationAccepted = "Confirm that the information is accurate.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validate(step)) return;
    const next = Math.min(step + 1, steps.length);
    setStep(next);
    startTransition(async () => { await saveRepairDraft({ currentStep: next, draft }); });
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    const incoming = Array.from(fileList).map<UploadFile>((file) => {
      if (!acceptedTypes.includes(file.type)) return { id: crypto.randomUUID(), file, status: "error", progress: 0, error: "Use JPG, PNG, WEBP, or PDF files." };
      if (file.size > maxFileSize) return { id: crypto.randomUUID(), file, status: "error", progress: 0, error: "Each file must be 10 MB or smaller." };
      return { id: crypto.randomUUID(), file, status: "ready", progress: 0, previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined };
    });
    setFiles((current) => [...current, ...incoming].slice(0, 8));
  }

  async function uploadReadyFiles() {
    if (!files.length) return [];
    if (!profileId) throw new Error("Your profile is not ready for file uploads yet.");
    const supabase = createClient();
    const uploaded: RepairAttachmentInput[] = [];
    for (const item of files) {
      if (item.status === "uploaded" && item.uploaded) { uploaded.push(item.uploaded); continue; }
      if (item.status === "error") continue;
      setFiles((current) => current.map((file) => file.id === item.id ? { ...file, status: "uploading", progress: 30 } : file));
      const safeName = item.file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 90);
      const storagePath = `${profileId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("repair-attachments").upload(storagePath, item.file, { contentType: item.file.type, upsert: false });
      if (error) {
        setFiles((current) => current.map((file) => file.id === item.id ? { ...file, status: "error", progress: 0, error: "Upload failed. Check storage policies and try again." } : file));
        throw new Error("One or more files could not be uploaded. Remove the failed file or try again.");
      }
      const metadata = { storagePath, fileName: item.file.name, contentType: item.file.type, fileSizeBytes: item.file.size };
      uploaded.push(metadata);
      setFiles((current) => current.map((file) => file.id === item.id ? { ...file, status: "uploaded", progress: 100, uploaded: metadata } : file));
    }
    return uploaded;
  }

  function handleSubmit() {
    if (![1, 2, 4, 5].every(validate)) return;
    setResult(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const attachments = await uploadReadyFiles();
        const response = await submitRepairRequest({ ...draft, confirmationAccepted: confirmed, attachments });
        setResult(response);
        if (response.fieldErrors) setErrors(response.fieldErrors);
        if (response.ok && response.redirectTo) {
          window.localStorage.removeItem("ec-repair-draft");
          window.location.assign(response.redirectTo);
        }
      } catch (error) {
        setResult({ ok: false, message: error instanceof Error ? error.message : "We could not submit the request. Please try again." });
      }
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
      <div className="rounded-[32px] bg-white p-5 shadow-[var(--shadow-soft)] sm:p-8">
        <StepIndicator step={step} />
        {Object.keys(errors).length ? <div ref={firstErrorRef} tabIndex={-1} role="alert" className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-[var(--danger)] outline-none">Please fix: {Object.values(errors)[0]}</div> : null}
        {result && !result.ok ? <div role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-[var(--danger)]">{result.message}</div> : null}
        {notice ? <div className="mt-4 rounded-2xl bg-[var(--trust-green-surface)] p-4 text-sm font-semibold text-[var(--trust-green)]">{notice}</div> : null}
        <div className="mt-8">
          {step === 1 ? <DeviceStep draft={draft} errors={errors} update={update} /> : null}
          {step === 2 ? <ProblemStep draft={draft} errors={errors} update={update} /> : null}
          {step === 3 ? <AttachmentStep files={files} addFiles={addFiles} removeFile={(id) => setFiles((current) => current.filter((item) => item.id !== id))} /> : null}
          {step === 4 ? <LocationStep draft={draft} errors={errors} update={update} /> : null}
          {step === 5 ? <ReviewStep draft={draft} files={files} confirmed={confirmed} setConfirmed={setConfirmed} errors={errors} goTo={setStep} /> : null}
        </div>
        <div className="mt-8 hidden items-center justify-between gap-3 border-t border-[var(--divider)] pt-6 sm:flex">
          <button type="button" onClick={goBack} disabled={step === 1 || isPending} className="min-h-12 rounded-[14px] bg-white px-5 text-sm font-semibold text-[var(--deep-navy)] shadow-[var(--shadow-soft)] disabled:cursor-not-allowed disabled:opacity-45">Back</button>
          <div className="flex gap-3">
            <button type="button" onClick={() => startTransition(async () => { const saved = await saveRepairDraft({ currentStep: step, draft }); setNotice(saved.message ?? null); })} disabled={isPending} className="min-h-12 rounded-[14px] px-5 text-sm font-semibold text-[var(--brand-blue)] hover:bg-[var(--blue-surface)] disabled:opacity-60">Save draft</button>
            {step < 5 ? <button type="button" onClick={goNext} disabled={isPending} className="min-h-12 rounded-[14px] bg-[var(--brand-blue)] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(21,94,239,0.22)] disabled:opacity-60">Continue</button> : <button type="button" onClick={handleSubmit} disabled={isPending} className="min-h-12 rounded-[14px] bg-[var(--brand-blue)] px-6 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(21,94,239,0.22)] disabled:opacity-60">{isPending ? "Submitting..." : "Submit Repair Request"}</button>}
          </div>
        </div>
      </div>
      <aside className="rounded-[28px] bg-[var(--deep-navy)] p-6 text-white shadow-[var(--shadow-soft)] lg:sticky lg:top-24">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">Request summary</p>
        <div className="mt-5 space-y-4">{summary.map(([label, value]) => <div key={label} className="rounded-2xl bg-white/8 p-4 ring-1 ring-white/10"><p className="text-xs uppercase tracking-[0.14em] text-blue-100">{label}</p><p className="mt-2 text-sm font-semibold text-white">{value}</p></div>)}</div>
        <p className="mt-5 text-sm leading-6 text-blue-50">After submission, EC TECH HUB records your request and shows a real backend reference number. Payments are arranged directly with providers unless otherwise stated.</p>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--divider)] bg-white/95 p-3 shadow-[0_-12px_30px_rgba(11,18,32,0.12)] backdrop-blur sm:hidden">
        <div className="flex gap-2">
          <button type="button" onClick={goBack} disabled={step === 1 || isPending} className="min-h-12 flex-1 rounded-[14px] bg-white px-4 text-sm font-semibold text-[var(--deep-navy)] shadow-[var(--shadow-soft)] disabled:opacity-45">Back</button>
          {step < 5 ? <button type="button" onClick={goNext} disabled={isPending} className="min-h-12 flex-[1.4] rounded-[14px] bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">Continue</button> : <button type="button" onClick={handleSubmit} disabled={isPending} className="min-h-12 flex-[1.6] rounded-[14px] bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white disabled:opacity-60">{isPending ? "Submitting..." : "Submit"}</button>}
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: number }) {
  return <div aria-label={`Step ${step} of ${steps.length}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-[var(--brand-blue)]">Step {step} of {steps.length}</p><p className="text-sm text-[var(--muted-text)]">{steps[step - 1]}</p></div><div className="mt-4 grid grid-cols-5 gap-2">{steps.map((label, index) => <div key={label} className={`h-2 rounded-full ${index + 1 <= step ? "bg-[var(--brand-blue)]" : "bg-[var(--secondary-surface)]"}`} />)}</div></div>;
}

function FieldError({ message }: { message?: string }) { return message ? <p className="text-sm font-medium text-[var(--danger)]">{message}</p> : null; }
function inputClass(error?: string) { return `min-h-14 rounded-2xl border bg-white px-4 text-[var(--deep-navy)] outline-none transition focus:ring-2 focus:ring-[var(--brand-blue)] ${error ? "border-[var(--danger)]" : "border-[var(--divider)]"}`; }
function Label({ children, required = false }: { children: React.ReactNode; required?: boolean }) { return <span className="text-sm font-semibold text-[var(--deep-navy)]">{children}{required ? <span className="text-[var(--danger)]"> *</span> : null}</span>; }

function DeviceStep({ draft, errors, update }: { draft: RepairDraft; errors: Record<string, string>; update: <K extends keyof RepairDraft>(key: K, value: RepairDraft[K]) => void }) {
  return <section><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Device information</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">These details help technicians understand what parts, tools, or safe checks may be needed.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="grid gap-2"><Label required>Device category</Label><select value={draft.deviceCategory ?? ""} onChange={(e) => update("deviceCategory", e.target.value)} className={inputClass(errors.deviceCategory)}><option value="">Select category</option>{deviceCategories.map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.deviceCategory} /></label><label className="grid gap-2"><Label required>Brand</Label><input value={draft.brand ?? ""} onChange={(e) => update("brand", e.target.value)} placeholder="Apple, Samsung, HP, Dell" className={inputClass(errors.brand)} /><FieldError message={errors.brand} /></label><label className="grid gap-2"><Label required>Model</Label><input value={draft.model ?? ""} onChange={(e) => update("model", e.target.value)} placeholder="iPhone 12, Pavilion 15, Unknown" className={inputClass(errors.model)} /><FieldError message={errors.model} /></label><label className="grid gap-2"><Label required>Approximate age</Label><select value={draft.approximateAge ?? ""} onChange={(e) => update("approximateAge", e.target.value)} className={inputClass(errors.approximateAge)}><option value="">Select age</option>{approximateAges.map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.approximateAge} /></label><label className="grid gap-2"><Label>Warranty status</Label><select value={draft.warrantyStatus ?? ""} onChange={(e) => update("warrantyStatus", e.target.value)} className={inputClass()}><option value="">Optional</option>{warrantyStatuses.map((item) => <option key={item}>{item}</option>)}</select></label><label className="grid gap-2"><Label>Purchase date</Label><input type="date" value={draft.purchaseDate ?? ""} onChange={(e) => update("purchaseDate", e.target.value)} className={inputClass()} /></label></div></section>;
}

function ProblemStep({ draft, errors, update }: { draft: RepairDraft; errors: Record<string, string>; update: <K extends keyof RepairDraft>(key: K, value: RepairDraft[K]) => void }) {
  const count = draft.problemDescription?.length ?? 0;
  function toggleSymptom(item: string) { const current = draft.symptoms ?? []; update("symptoms", current.includes(item) ? current.filter((value) => value !== item) : [...current, item]); }
  return <section><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Problem description</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Clear symptoms reduce back-and-forth and help the right technician evaluate the request.</p><div className="mt-5 rounded-2xl bg-[var(--blue-surface)] p-4 text-sm text-[var(--secondary-text)]">Try: â€œMy laptop shuts down after five minutesâ€, â€œMy phone screen is crackedâ€, or â€œMy printer wonâ€™t connect to Wiâ€‘Fi.â€</div><div className="mt-6 grid gap-5"><label className="grid gap-2"><Label required>Problem title</Label><input value={draft.problemTitle ?? ""} onChange={(e) => update("problemTitle", e.target.value)} className={inputClass(errors.problemTitle)} placeholder="Short summary of the issue" /><FieldError message={errors.problemTitle} /></label><label className="grid gap-2"><Label required>Problem description</Label><textarea maxLength={maxDescription} value={draft.problemDescription ?? ""} onChange={(e) => update("problemDescription", e.target.value)} className={`${inputClass(errors.problemDescription)} min-h-36 py-4`} placeholder="Describe what happened, when it started, and what you have already tried." /><div className="flex justify-between gap-3"><FieldError message={errors.problemDescription} /><p className="ml-auto text-sm text-[var(--muted-text)]">{count}/{maxDescription}</p></div></label><fieldset className="grid gap-3"><legend><Label required>Symptoms</Label></legend><div className="grid gap-3 sm:grid-cols-2">{symptomOptions.map((item) => <label key={item} className={`flex min-h-12 items-center gap-3 rounded-2xl p-3 text-sm ring-1 ${draft.symptoms?.includes(item) ? "bg-[var(--blue-surface)] text-[var(--brand-blue)] ring-[var(--brand-blue)]" : "bg-white text-[var(--secondary-text)] ring-[var(--divider)]"}`}><input type="checkbox" checked={draft.symptoms?.includes(item) ?? false} onChange={() => toggleSymptom(item)} />{item}</label>)}</div><FieldError message={errors.symptoms} /></fieldset><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2"><Label required>When did it start?</Label><input value={draft.startedWhen ?? ""} onChange={(e) => update("startedWhen", e.target.value)} placeholder="Today, last week, after an update" className={inputClass(errors.startedWhen)} /><FieldError message={errors.startedWhen} /></label><label className="grid gap-2"><Label>Repaired before?</Label><select value={draft.repairedBefore ?? "no"} onChange={(e) => update("repairedBefore", e.target.value)} className={inputClass()}><option value="no">No</option><option value="yes">Yes</option><option value="not_sure">Not sure</option></select></label></div><fieldset className="grid gap-3"><legend><Label required>Estimated urgency</Label></legend><div className="grid gap-3 md:grid-cols-2">{urgencyOptions.map((item) => <label key={item.value} className={`rounded-2xl p-4 ring-1 ${draft.urgency === item.value ? "bg-[var(--blue-surface)] ring-[var(--brand-blue)]" : "bg-white ring-[var(--divider)]"}`}><input className="sr-only" type="radio" checked={draft.urgency === item.value} onChange={() => update("urgency", item.value)} /><span className="font-semibold text-[var(--deep-navy)]">{item.label}</span><span className="mt-1 block text-sm text-[var(--secondary-text)]">{item.description}</span></label>)}</div><FieldError message={errors.urgency} /></fieldset></div></section>;
}

function AttachmentStep({ files, addFiles, removeFile }: { files: UploadFile[]; addFiles: (files: FileList | null) => void; removeFile: (id: string) => void }) {
  return <section><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Photos and attachments</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Photos are optional but can help technicians understand visible damage, error messages, ports, model labels, or accessories.</p><label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }} className="mt-6 grid cursor-pointer place-items-center rounded-[24px] border border-dashed border-blue-200 bg-[var(--blue-surface)] p-8 text-center"><Icon name="upload" className="size-8 text-[var(--brand-blue)]" /><span className="mt-3 font-semibold text-[var(--deep-navy)]">Drop files here or tap to upload</span><span className="mt-1 text-sm text-[var(--secondary-text)]">JPG, PNG, WEBP, or PDF. Up to 10 MB each.</span><input className="sr-only" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => addFiles(e.target.files)} /></label><div className="mt-5 grid gap-3">{files.map((item) => <div key={item.id} className="flex items-center gap-4 rounded-2xl bg-white p-3 ring-1 ring-[var(--divider)]">{item.previewUrl ? <Image src={item.previewUrl} alt="Selected attachment preview" width={56} height={56} unoptimized className="size-14 rounded-xl object-cover" /> : <div className="grid size-14 place-items-center rounded-xl bg-[var(--secondary-surface)] text-xs font-bold text-[var(--secondary-text)]">PDF</div>}<div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[var(--deep-navy)]">{item.file.name}</p><p className="text-xs text-[var(--muted-text)]">{Math.ceil(item.file.size / 1024)} KB · {item.status}</p>{item.error ? <p className="text-xs font-semibold text-[var(--danger)]">{item.error}</p> : null}<div className="mt-2 h-1.5 rounded-full bg-[var(--secondary-surface)]"><div className="h-full rounded-full bg-[var(--brand-blue)]" style={{ width: `${item.progress}%` }} /></div></div><button type="button" onClick={() => removeFile(item.id)} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-[var(--danger)] hover:bg-red-50">Remove</button></div>)}</div></section>;
}

function LocationStep({ draft, errors, update }: { draft: RepairDraft; errors: Record<string, string>; update: <K extends keyof RepairDraft>(key: K, value: RepairDraft[K]) => void }) {
  return <section><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Location and service preference</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Location helps route the request to suitable local or remote support options.</p><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="grid gap-2"><Label required>Province</Label><select value={draft.province ?? ""} onChange={(e) => update("province", e.target.value)} className={inputClass(errors.province)}><option value="">Select province</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select><FieldError message={errors.province} /></label><label className="grid gap-2"><Label required>City</Label><input value={draft.city ?? ""} onChange={(e) => update("city", e.target.value)} autoComplete="address-level2" className={inputClass(errors.city)} placeholder="City or town" /><FieldError message={errors.city} /></label><label className="grid gap-2 sm:col-span-2"><Label required>Area</Label><input value={draft.area ?? ""} onChange={(e) => update("area", e.target.value)} autoComplete="address-level3" className={inputClass(errors.area)} placeholder="Suburb, township, village, or service area" /><FieldError message={errors.area} /></label></div><fieldset className="mt-6 grid gap-3"><legend><Label required>Preferred service</Label></legend><div className="grid gap-3 md:grid-cols-3">{servicePreferences.map((item) => <label key={item.value} className={`rounded-2xl p-4 ring-1 ${draft.servicePreference === item.value ? "bg-[var(--blue-surface)] ring-[var(--brand-blue)]" : "bg-white ring-[var(--divider)]"}`}><input className="sr-only" type="radio" checked={draft.servicePreference === item.value} onChange={() => update("servicePreference", item.value)} /><span className="font-semibold text-[var(--deep-navy)]">{item.label}</span><span className="mt-1 block text-sm text-[var(--secondary-text)]">{item.description}</span></label>)}</div><FieldError message={errors.servicePreference} /></fieldset><label className="mt-5 grid gap-2"><Label>Location or availability notes</Label><textarea value={draft.locationNotes ?? ""} onChange={(e) => update("locationNotes", e.target.value)} className={`${inputClass()} min-h-28 py-4`} placeholder="Example: Available after 5 PM. Please call before visiting." /></label></section>;
}

function ReviewStep({ draft, files, confirmed, setConfirmed, errors, goTo }: { draft: RepairDraft; files: UploadFile[]; confirmed: boolean; setConfirmed: (value: boolean) => void; errors: Record<string, string>; goTo: (step: number) => void }) {
  const sections = [{ title: "Device", step: 1, rows: [["Category", draft.deviceCategory], ["Brand", draft.brand], ["Model", draft.model], ["Age", draft.approximateAge]] }, { title: "Problem", step: 2, rows: [["Title", draft.problemTitle], ["Description", draft.problemDescription], ["Symptoms", draft.symptoms?.join(", ")], ["Urgency", urgencyOptions.find((item) => item.value === draft.urgency)?.label]] }, { title: "Images", step: 3, rows: [["Attachments", files.length ? `${files.length} selected` : "No attachments added"]] }, { title: "Location", step: 4, rows: [["Province", draft.province], ["City", draft.city], ["Area", draft.area], ["Service", servicePreferences.find((item) => item.value === draft.servicePreference)?.label]] }];
  return <section><h2 className="text-2xl font-bold text-[var(--deep-navy)]">Review and submit</h2><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">Check your information before creating the repair request. You can edit any section.</p><div className="mt-6 grid gap-4">{sections.map((section) => <article key={section.title} className="rounded-[22px] bg-[var(--secondary-surface)] p-5"><div className="flex items-center justify-between gap-3"><h3 className="font-bold text-[var(--deep-navy)]">{section.title}</h3><button type="button" onClick={() => goTo(section.step)} className="text-sm font-semibold text-[var(--brand-blue)]">Edit</button></div><dl className="mt-4 grid gap-3 sm:grid-cols-2">{section.rows.map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-[0.14em] text-[var(--muted-text)]">{label}</dt><dd className="mt-1 text-sm font-semibold text-[var(--deep-navy)]">{value || "Not provided"}</dd></div>)}</dl></article>)}</div><label className="mt-6 flex gap-3 rounded-2xl bg-white p-4 text-sm leading-6 text-[var(--secondary-text)] ring-1 ring-[var(--divider)]"><input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1 size-4" /><span>I confirm that the information provided is accurate and that EC TECH HUB may use it to route this repair request.</span></label><FieldError message={errors.confirmationAccepted} /></section>;
}

