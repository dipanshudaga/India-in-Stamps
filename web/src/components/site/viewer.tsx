"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { StampDetail, type FlightOrigin } from "@/components/stamp-detail";

type Open = (id: number, rect: DOMRect) => void;
const Ctx = createContext<Open>(() => {});

// One stamp overlay for the whole site: any stamp button calls `useOpenStamp()(id, rect)`; the stamp
// then flies from where it sat on screen into the detail view.
export function StampViewer({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<number | null>(null);
  const [origin, setOrigin] = useState<FlightOrigin | null>(null);

  const open = useCallback<Open>((stampId, rect) => {
    const size = Math.max(rect.width, rect.height);
    setOrigin({ x: rect.left + rect.width / 2 - size / 2, y: rect.top + rect.height / 2 - size / 2, size });
    setId(stampId);
  }, []);
  const close = useCallback(() => setId(null), []);
  const value = useMemo(() => open, [open]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <StampDetail id={id} origin={origin} onClose={close} />
    </Ctx.Provider>
  );
}

export const useOpenStamp = () => useContext(Ctx);
