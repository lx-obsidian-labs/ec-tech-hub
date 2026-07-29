import Link from "next/link";

function buildGuidance(problem: string) {
  const text = problem.toLowerCase();
  const overheating = /hot|heat|overheat|burn|smoke|swollen|battery/.test(text);
  const power = /power|charge|switch|turn|boot|off|battery/.test(text);
  const network = /wifi|internet|network|router|connection/.test(text);
  return {
    causes: overheating ? ["Battery or charging fault", "Blocked ventilation", "Unsafe internal short"] : network ? ["Router or signal issue", "Incorrect network settings", "Service-provider outage"] : power ? ["Power adapter or cable issue", "Battery health problem", "Operating-system startup fault"] : ["Configuration issue", "Accessory or cable fault", "Hardware fault requiring inspection"],
    checks: overheating ? ["Disconnect power if safe", "Move the device away from flammable surfaces", "Let it cool without covering it"] : network ? ["Restart the router once", "Check another device on the same network", "Confirm the correct Wi-Fi network is selected"] : power ? ["Try a known-safe outlet", "Inspect the charger for visible damage", "Hold the power button for 10 seconds once"] : ["Write down exact error messages", "Remove recently connected accessories", "Restart once and observe changes"],
    stop: overheating ? "Stop immediately if there is heat, swelling, smoke, liquid damage, sparking, or smell." : "Stop if troubleshooting requires disassembly, electrical exposure, or the device becomes unsafe.",
    next: overheating ? "Request a repair or contact a qualified technician before further use." : "If the safe checks do not resolve it, prepare a repair request with the symptoms and device details.",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const query = (params.q || "").trim();
  const guidance = query ? buildGuidance(query) : null;
  return (
    <main id="main-content" className="bg-[var(--page-bg)]">
      <section className="container-grid py-16 sm:py-20 lg:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="rounded-[32px] bg-white p-8 shadow-[var(--shadow-soft)] sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--brand-blue)]">AI Assist</p>
            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] text-[var(--deep-navy)] sm:text-5xl">Understand the problem before choosing the next step.</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--secondary-text)]">Describe what is happening with your device and receive structured, safety-conscious guidance. This local guidance is deterministic until a configured AI provider is connected.</p>
            <form action="/ai-assist" className="mt-8 grid gap-3">
              <label htmlFor="ai-query" className="text-sm font-semibold text-[var(--deep-navy)]">Device problem</label>
              <textarea id="ai-query" name="q" defaultValue={query} required minLength={8} placeholder="Example: My laptop switches off a few minutes after starting." className="min-h-36 rounded-2xl border border-[var(--divider)] bg-white p-4 outline-none focus:ring-2 focus:ring-[var(--brand-blue)]" />
              <button className="inline-flex min-h-14 items-center justify-center rounded-[14px] bg-[var(--brand-blue)] px-6 font-semibold text-white">Get safe guidance</button>
            </form>
          </div>
          <div className="rounded-[32px] bg-[var(--deep-navy)] p-6 text-white shadow-[var(--shadow-soft)] sm:p-8">
            <h2 className="text-2xl font-bold tracking-[-0.03em]">Troubleshooting response</h2>
            {!guidance ? <p className="mt-4 leading-7 text-blue-50">Enter a device problem to generate structured checks. AI guidance may be incomplete and should not replace professional judgment.</p> : <div className="mt-6 grid gap-4">
              <Response title="Possible causes" items={guidance.causes} />
              <Response title="Safe checks" items={guidance.checks} />
              <article className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><h3 className="font-bold">When to stop</h3><p className="mt-2 text-sm leading-6 text-blue-50">{guidance.stop}</p></article>
              <article className="rounded-2xl bg-white p-4 text-[var(--deep-navy)]"><h3 className="font-bold">Recommended next action</h3><p className="mt-2 text-sm leading-6 text-[var(--secondary-text)]">{guidance.next}</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><Link href={`/repairs/new`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--brand-blue)] px-4 text-sm font-semibold text-white">Request repair</Link><Link href={`/technicians?problem=${encodeURIComponent(query)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--blue-surface)] px-4 text-sm font-semibold text-[var(--brand-blue)]">Find technician</Link></div></article>
            </div>}
            <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-[#7a4b00]">AI guidance may be incomplete. Stop troubleshooting if the device becomes hot, damaged, wet, electrically unsafe, or requires disassembly.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Response({ title, items }: { title: string; items: string[] }) {
  return <article className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10"><h3 className="font-bold">{title}</h3><ul className="mt-3 grid gap-2 text-sm leading-6 text-blue-50">{items.map((item) => <li key={item}>• {item}</li>)}</ul></article>;
}
