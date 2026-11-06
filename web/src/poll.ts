import { useEffect, useRef } from "react";
import { BACKOFF_MS, POLL_MS } from "./config";

/**
 * Run fn now and then every `every` ms, only while the tab is visible. After an error the next run
 * waits `onError` ms. A hidden tab pauses; showing it again resumes at the scheduled time.
 */
export function usePoll(fn: (isActive: () => boolean) => Promise<void>, key: unknown, every = POLL_MS, onError = BACKOFF_MS) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    let busy = false;
    let nextAt = 0;
    const schedule = (ms: number) => {
      clearTimeout(timer);
      nextAt = Date.now() + ms;
      if (!document.hidden && !stopped) timer = setTimeout(tick, ms);
    };
    const tick = async () => {
      if (document.hidden || busy || stopped) return;
      busy = true;
      let ms = every;
      try { await ref.current(() => !stopped); } catch { ms = onError; }
      busy = false;
      schedule(ms);
    };
    const onVis = () => {
      clearTimeout(timer);
      if (!document.hidden) timer = setTimeout(tick, Math.max(0, nextAt - Date.now()));
    };
    tick();
    document.addEventListener("visibilitychange", onVis);
    return () => { stopped = true; clearTimeout(timer); document.removeEventListener("visibilitychange", onVis); };
  }, [key, every, onError]);
}
