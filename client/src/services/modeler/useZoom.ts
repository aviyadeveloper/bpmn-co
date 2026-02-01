import { useCallback } from "react";
import { modelerStore } from "./modelerStore";

export function useZoom() {
  const zoomIn = useCallback(() => {
    const modeler = modelerStore.get();
    if (!modeler) return;
    const zoomScroll = modeler.get("zoomScroll") as any;
    zoomScroll.stepZoom(1);
  }, []);

  const zoomOut = useCallback(() => {
    const modeler = modelerStore.get();
    if (!modeler) return;
    const zoomScroll = modeler.get("zoomScroll") as any;
    zoomScroll.stepZoom(-1);
  }, []);

  return {
    zoomIn,
    zoomOut,
  };
}
