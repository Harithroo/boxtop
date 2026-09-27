"use client";
import { useEffect, useState } from "react";

type Zone = { id: number; name: string; cities: string; fee: number };
type Day = { date: string; slots: { id: number; label: string; available: boolean; reason?: string; left: number }[] };

const fmt = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return { wd: dt.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }), day: d, mon: dt.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) };
};

/** City -> zone -> date -> slot. Writes hidden inputs zoneId, date, slotId, city into the parent form. */
export function DeliveryPicker({
  zones, lead = 0, sameDay = true, initial, onChange, required,
}: {
  zones: Zone[]; lead?: number; sameDay?: boolean; required?: boolean;
  initial?: { zoneId?: number; date?: string; slotId?: number; city?: string };
  onChange?: (v: { zone?: Zone; date?: string; slot?: string; city?: string }) => void;
}) {
  const cities = zones.flatMap((z) => z.cities.split(",").map((c) => ({ city: c.trim(), zone: z }))).filter((c) => c.city).sort((a, b) => a.city.localeCompare(b.city));
  const initialCity = initial?.city ?? (initial?.zoneId ? cities.find((c) => c.zone.id === initial.zoneId)?.city : undefined) ?? "";
  const [city, setCity] = useState(initialCity);
  const zone = cities.find((c) => c.city === city)?.zone;
  // calendar cached per zone; selections are corrected by derivation, not by effects
  const [cal, setCal] = useState<{ zoneId: number; days: Day[] } | null>(null);
  const [pickedDate, setDate] = useState(initial?.date ?? "");
  const [pickedSlot, setSlotId] = useState<number | undefined>(initial?.slotId);

  useEffect(() => {
    if (!zone) return;
    let live = true;
    fetch(`/api/delivery?zoneId=${zone.id}&lead=${lead}&sameDay=${sameDay ? 1 : 0}`).then((r) => r.json()).then((j: { days: Day[] }) => {
      if (live) setCal({ zoneId: zone.id, days: j.days });
    });
    return () => { live = false; };
  }, [zone?.id, lead, sameDay]); // eslint-disable-line react-hooks/exhaustive-deps

  const days = zone && cal?.zoneId === zone.id ? cal.days : null;
  const date = days?.find((d) => d.date === pickedDate) ? pickedDate : days?.[0]?.date ?? "";
  const day = days?.find((d) => d.date === date);
  const slotId = day?.slots.find((s) => s.id === pickedSlot && s.available) ? pickedSlot : day?.slots.find((s) => s.available)?.id;

  useEffect(() => {
    onChange?.({ zone, date, slot: day?.slots.find((s) => s.id === slotId)?.label, city });
  }, [zone?.id, date, slotId, city]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-w-0 space-y-3">
      <div>
        <label className="label" htmlFor="dp-city">Delivery city</label>
        <select id="dp-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} required={required}>
          <option value="">Choose the city</option>
          {cities.map((c) => <option key={c.city} value={c.city}>{c.city}</option>)}
        </select>
        {zone && <p className="hint mt-1">{zone.name}: delivery Rs. {zone.fee.toLocaleString("en-LK")}</p>}
      </div>
      <input type="hidden" name="zoneId" value={zone?.id ?? ""} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="date" value={date} />
      <input type="hidden" name="slotId" value={slotId ?? ""} />
      {zone && days === null && <p className="hint">Checking dates…</p>}
      {days && days.length === 0 && <p className="hint">No delivery dates open for this area right now. Message us on WhatsApp and we&apos;ll help.</p>}
      {days && days.length > 0 && (
        <>
          <div>
            <p className="label">Delivery date</p>
            <div className="flex gap-2 overflow-x-auto pb-1" role="radiogroup" aria-label="Delivery date">
              {days.map((d) => {
                const f = fmt(d.date); const on = d.date === date;
                return (
                  <button type="button" key={d.date} role="radio" aria-checked={on} onClick={() => setDate(d.date)}
                    className={`flex min-w-16 shrink-0 flex-col items-center rounded-md border px-3 py-2 text-sm ${on ? "border-2 border-brand bg-brand-soft" : "border-line bg-surface"}`}>
                    <span className="text-xs text-ink-muted">{f.wd}</span><span className="text-lg font-bold leading-6">{f.day}</span><span className="text-xs">{f.mon}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {day && (
            <div>
              <p className="label">Time slot</p>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Time slot">
                {day.slots.map((s) => (
                  <button type="button" key={s.id} role="radio" aria-checked={slotId === s.id} disabled={!s.available} onClick={() => setSlotId(s.id)}
                    className={`min-h-11 rounded-md border px-3 py-2 text-left text-sm disabled:opacity-50 ${slotId === s.id ? "border-2 border-brand bg-brand-soft" : "border-line bg-surface"}`}>
                    {s.label}{!s.available && <span className="block text-xs text-ink-muted">{s.reason}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
