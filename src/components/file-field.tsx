"use client";

import { useState } from "react";

export function FileField({
  label,
  name,
  accept,
  maxMb,
  required = true,
}: {
  label: string;
  name: string;
  accept?: string;
  maxMb: number;
  required?: boolean;
}) {
  const [error, setError] = useState("");
  const maxBytes = maxMb * 1024 * 1024;

  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      {label}
      <input
        name={name}
        type="file"
        accept={accept}
        required={required}
        className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-950 shadow-sm"
        onChange={(event) => {
          const input = event.currentTarget;
          const file = input.files?.[0];

          if (file && file.size > maxBytes) {
            const message = `${file.name} is too large. Upload a file ${maxMb} MB or smaller.`;
            input.value = "";
            input.setCustomValidity(message);
            setError(message);
            return;
          }

          input.setCustomValidity("");
          setError("");
        }}
      />
      <span className={error ? "text-sm text-red-700" : "text-xs text-slate-500"}>
        {error || `Maximum file size: ${maxMb} MB.`}
      </span>
    </label>
  );
}
