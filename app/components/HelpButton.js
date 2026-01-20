"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const HELP_COPY = {
  "owner-dashboard": {
    title: "Owner dashboard",
    items: [
      "Create properties and employees (within your subscription limits).",
      "Open a property to create tasks and see pending tasks.",
      "Assign employees to properties and assign properties to employees.",
      "Pending tasks stay pending until someone marks them done.",
      "To see completed task history, use the date filter on a property page.",
    ],
  },
  "employee-dashboard": {
    title: "Employee dashboard",
    items: [
      "You only see properties assigned to you.",
      "Open a property to create a task or mark tasks as done.",
      "If a task is not completed, it stays pending so it won't be forgotten.",
      "To see completed task history, use the date filter on the property page.",
    ],
  },
  "property-page": {
    title: "Property tasks",
    items: [
      "Create a task to add it to the Pending list.",
      "Mark Done moves a task to Completed.",
      "Pending tasks remain until completed by an owner or employee.",
      "Completed tasks are shown when you select dates and tap Filter.",
    ],
  },
  "owner-employee-detail": {
    title: "Employee details",
    items: [
      "Select properties to assign to this employee.",
      "Assigned properties control what the employee can see and work on.",
      "Employees can create tasks and complete tasks on assigned properties.",
    ],
  },
  admin: {
    title: "Admin",
    items: [
      "Set owner subscription limits (max properties/employees) and expiry date.",
      "If an owner expires, they cannot access properties/employees until renewed.",
    ],
  },
};

export default function HelpButton({ context = "property-page" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 16 });

  const copy = HELP_COPY[context] || HELP_COPY["property-page"];

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onDown = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    // align popover to the right edge of the button, below it
    const top = rect.bottom + 8;
    const right = Math.max(16, window.innerWidth - rect.right);
    setPos({ top, right });
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-700 text-[11px] text-slate-400 hover:text-slate-100 hover:border-slate-500 bg-slate-950"
        aria-label="Help"
      >
        i
      </button>

      {open && mounted && createPortal(
        <div
          className="fixed w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-2xl z-[9999]"
          style={{ top: pos.top, right: pos.right }}
        >
          <div className="text-xs font-medium text-slate-100 mb-2">{copy.title}</div>
          <ul className="space-y-1 text-xs text-slate-300">
            {copy.items.map((t, idx) => (
              <li key={idx} className="leading-relaxed">
                - {t}
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}

