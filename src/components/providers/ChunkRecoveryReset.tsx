"use client";

import { useEffect } from "react";
import { clearChunkReloadMarker } from "@/lib/chunkRecovery";

export default function ChunkRecoveryReset() {
  useEffect(() => {
    clearChunkReloadMarker();
  }, []);

  return null;
}
