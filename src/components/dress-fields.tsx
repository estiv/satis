"use client";

import { useState } from "react";
import { DRESS_CATEGORIES, DRESS_SIZES, parseDressSizes } from "@/core/labels";
import { Field, Input, Select, Textarea } from "@/components/ui";

const MAX_QTY = 24;

function sizeSlots(size: string | null | undefined, qty: number) {
  const parsed = parseDressSizes(size);
  return Array.from({ length: qty }, (_, i) => parsed[i] ?? "");
}

export function DressFields({
  dress,
}: {
  dress?: {
    name: string;
    category: string;
    size: string | null;
    color: string | null;
    notes: string | null;
    qtyTotal: number;
    rentalPrice: number;
    rentalPriceMax: number;
    depositAmount: number;
    listedPublic: boolean;
  };
}) {
  const startQty = Math.min(MAX_QTY, Math.max(1, dress?.qtyTotal ?? 1));
  const startLow = dress?.rentalPrice ?? 0;
  const startHigh = dress?.rentalPriceMax && dress.rentalPriceMax > startLow ? dress.rentalPriceMax : startLow;

  const [qtyText, setQtyText] = useState(String(startQty));
  const [sizes, setSizes] = useState(() => sizeSlots(dress?.size, startQty));
  const [low, setLow] = useState(startLow);
  const [high, setHigh] = useState(startHigh);

  function onQty(raw: string) {
    setQtyText(raw);
    const next = Math.floor(Number(raw));
    if (!Number.isFinite(next) || next < 1) return;
    setSizes((prev) => sizeSlots(prev.join(", "), Math.min(MAX_QTY, next)));
  }

  return (
    <>
      <Field label="Name">
        <Input name="name" required defaultValue={dress?.name} />
      </Field>
      <Field label="Category">
        <Select name="category" defaultValue={dress?.category ?? "OCCASIONAL"}>
          {Object.entries(DRESS_CATEGORIES).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quantity" hint="One size for each dress in stock. Every size in the list can be chosen.">
        <Input
          name="qtyTotal"
          inputMode="numeric"
          min={1}
          max={MAX_QTY}
          value={qtyText}
          onChange={(e) => onQty(e.target.value)}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        {sizes.map((size, i) => (
          <Field key={i} label={`Size ${i + 1}`}>
            <Select
              name="sizes"
              required
              value={size}
              onChange={(e) =>
                setSizes((prev) => prev.map((current, index) => (index === i ? e.target.value : current)))
              }
            >
              <option value="">Choose size</option>
              {DRESS_SIZES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        ))}
      </div>
      <Field label="Color">
        <Input name="color" defaultValue={dress?.color ?? ""} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lowest rental price">
          <Input
            name="rentalPrice"
            inputMode="decimal"
            required
            value={low}
            onChange={(e) => setLow(Number(e.target.value) || 0)}
          />
        </Field>
        <Field label="Highest rental price">
          <Input
            name="rentalPriceMax"
            inputMode="decimal"
            required
            value={high}
            onChange={(e) => setHigh(Number(e.target.value) || 0)}
          />
        </Field>
      </div>
      <Field label="Deposit">
        <Input
          name="depositAmount"
          inputMode="decimal"
          defaultValue={dress ? String(dress.depositAmount) : ""}
        />
      </Field>
      <Field label="Show on public shop">
        <Select name="listedPublic" defaultValue={dress?.listedPublic === false ? "0" : "1"}>
          <option value="1">Yes — listed</option>
          <option value="0">No — staff only</option>
        </Select>
      </Field>
      <Field label="Notes">
        <Textarea name="notes" defaultValue={dress?.notes ?? ""} />
      </Field>
      <Field label="Photo" hint="JPG, PNG or WebP">
        <Input name="photo" type="file" accept="image/*" />
      </Field>
    </>
  );
}
