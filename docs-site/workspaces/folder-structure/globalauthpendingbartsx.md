---
title: Ws:Folder Structure:Globalauthpendingbartsx
sidebar_label: Ws:Folder Structure:Globalauthpendingbartsx
id: globalauthpendingbartsx
---

```
"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useIsMutating } from "@tanstack/react-query";

import { authMutationKeys } from "@/modules/Auth/hooks/authMutationKeys";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/**
 * Non-blocking global indicator while auth mutations run (mock or real API).
 * Mount once under QueryClientProvider.
 */
export function GlobalAuthPendingBar() {
  const pending = useIsMutating({
    predicate: (m) => {
      const key = m.options.mutationKey;
      return Array.isArray(key) && key[0] === authMutationKeys.all[0];
    },
  });

  if (pending === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[3000] h-1 overflow-hidden bg-primary-600/25"
      role="progressbar"
      aria-label="Request in progress"
      aria-busy="true"
    >
      <div className="h-full w-full animate-pulse bg-primary-600" />
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
```
