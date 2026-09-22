"use client";

import { useState } from "react";
import { money, num } from "@/core/money";
import { Button, Field, Input, Select } from "./ui";

export type DressOption = {
  id: string;
  name: string;
  rentalPrice: number;
  depositAmount: number;
  qtyTotal: number;
};

type Line = {
  key: string;
  dressId: string;
  qty: number;
  unitRental: string;
  unitDeposit: string;
};

export function BookingLinesEditor({
  dresses,
  initial,
}: {
  dresses: DressOption[];
  initial?: { dressId: string; qty: number; unitRental: number; unitDeposit: number }[];
}) {
  const [lines, setLines] = useState<Line[]>(() => {
    if (initial?.length) {
      return initial.map((l, i) => ({
        key: `i${i}`,
        dressId: l.dressId,
        qty: l.qty,
        unitRental: String(num(l.unitRental)),
        unitDeposit: String(num(l.unitDeposit)),
      }));
    }
    const first = dresses[0];
    return [
      {
        key: "0",
        dressId: first?.id ?? "",
        qty: 1,
        unitRental: first ? String(num(first.rentalPrice)) : "0",
        unitDeposit: first ? String(num(first.depositAmount)) : "0",
      },
    ];
  });

  function setDress(key: string, dressId: string) {
    const d = dresses.find((x) => x.id === dressId);
    setLines((prev) =>
      prev.map((l) =>
        l.key === key
          ? {
              ...l,
              dressId,
              unitRental: d ? String(num(d.rentalPrice)) : l.unitRental,
              unitDeposit: d ? String(num(d.depositAmount)) : l.unitDeposit,
            }
          : l,
      ),
    );
  }

  const totalRental = lines.reduce((s, l) => s + l.qty * Number(l.unitRental || 0), 0);
  const totalDeposit = lines.reduce((s, l) => s + l.qty * Number(l.unitDeposit || 0), 0);

  return (
    <div className="flex flex-col gap-3">
      {lines.map((l) => (
        <div key={l.key} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-4">
          <Field label="Dress">
            <Select
              name="line_dressId"
              value={l.dressId}
              onChange={(e) => setDress(l.key, e.target.value)}
              required
            >
              <option value="">Select…</option>
              {dresses.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} (×{d.qtyTotal})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Qty">
            <Input
              name="line_qty"
              type="number"
              min={1}
              value={l.qty}
              onChange={(e) =>
                setLines((prev) =>
                  prev.map((x) => (x.key === l.key ? { ...x, qty: Number(e.target.value) || 1 } : x)),
                )
              }
            />
          </Field>
          <Field label="Rental / unit">
            <Input
              name="line_unitRental"
              inputMode="decimal"
              value={l.unitRental}
              onChange={(e) =>
                setLines((prev) =>
                  prev.map((x) => (x.key === l.key ? { ...x, unitRental: e.target.value } : x)),
                )
              }
            />
          </Field>
          <Field label="Deposit / unit">
            <Input
              name="line_unitDeposit"
              inputMode="decimal"
              value={l.unitDeposit}
              onChange={(e) =>
                setLines((prev) =>
                  prev.map((x) => (x.key === l.key ? { ...x, unitDeposit: e.target.value } : x)),
                )
              }
            />
          </Field>
        </div>
      ))}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            const d = dresses[0];
            setLines((prev) => [
              ...prev,
              {
                key: String(Date.now()),
                dressId: d?.id ?? "",
                qty: 1,
                unitRental: d ? String(num(d.rentalPrice)) : "0",
                unitDeposit: d ? String(num(d.depositAmount)) : "0",
              },
            ]);
          }}
        >
          Add line
        </Button>
        <p className="text-sm text-muted">
          Rental <span className="font-semibold text-ink num">{money(totalRental)}</span>
          {" · "}
          Deposit <span className="font-semibold text-ink num">{money(totalDeposit)}</span>
        </p>
      </div>
    </div>
  );
}
