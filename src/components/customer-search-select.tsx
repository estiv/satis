"use client";

import { useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui";

type Customer = { id: string; name: string; phone: string | null };

function label(customer: Customer) {
  return customer.phone ? `${customer.name} · ${customer.phone}` : customer.name;
}

export function CustomerSearchSelect({
  customers,
  defaultId = "",
  required,
}: {
  customers: Customer[];
  defaultId?: string;
  required?: boolean;
}) {
  const initial = customers.find((customer) => customer.id === defaultId);
  const [query, setQuery] = useState(initial ? label(initial) : "");
  const [selectedId, setSelectedId] = useState(defaultId);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return customers
      .filter((customer) => {
        if (!q) return true;
        return label(customer).toLowerCase().includes(q);
      })
      .slice(0, 8);
  }, [customers, query]);

  return (
    <div className="relative">
      <input type="hidden" name="customerId" value={selectedId} required={required} />
      <Input
        ref={inputRef}
        value={query}
        placeholder="Search name or phone"
        autoComplete="off"
        required={required}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          e.currentTarget.setCustomValidity("");
          setQuery(e.target.value);
          setSelectedId("");
          setOpen(true);
        }}
        onBlur={(e) => {
          if (required && !selectedId) e.currentTarget.setCustomValidity("Select a customer from the list");
          window.setTimeout(() => setOpen(false), 150);
        }}
      />
      {open && matches.length > 0 ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-white shadow-lg">
          {matches.map((customer) => (
            <li key={customer.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-teal/15"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSelectedId(customer.id);
                  setQuery(label(customer));
                  inputRef.current?.setCustomValidity("");
                  setOpen(false);
                }}
              >
                {label(customer)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && query.trim() && matches.length === 0 ? (
        <p className="absolute z-20 mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-muted shadow-lg">
          No matching customer
        </p>
      ) : null}
    </div>
  );
}
