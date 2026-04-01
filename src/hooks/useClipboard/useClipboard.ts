import { useCallback, useRef, useState } from "react";

type CopyStatus = "idle" | "copied" | "error";

interface UseClipboardOptions {
  /** How long (ms) before status resets back to "idle". Default: 2000 */
  timeout?: number;
}

interface UseClipboardReturn {
  copy: (text: string) => Promise<void>;
  status: CopyStatus;
  isCopied: boolean;
  error: Error | null;
}

export function useClipboard(
  options: UseClipboardOptions = {},
): UseClipboardReturn {
  const { timeout = 2000 } = options;

  const [status, setStatus] = useState<CopyStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = useCallback(
    async (text: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      try {
        await navigator.clipboard.writeText(text);
        setStatus("copied");
        setError(null);
      } catch (err) {
        try {
          const el = document.createElement("textarea");
          el.value = text;
          el.style.cssText = "position:fixed;opacity:0;pointer-events:none;";
          document.body.appendChild(el);
          el.focus();
          el.select();
          const ok = document.execCommand("copy");
          document.body.removeChild(el);
          if (!ok) throw new Error("execCommand returned false");
          setStatus("copied");
          setError(null);
        } catch (fallbackErr) {
          const e =
            fallbackErr instanceof Error
              ? fallbackErr
              : new Error(String(fallbackErr));
          setStatus("error");
          setError(e);
        }
      } finally {
        timerRef.current = setTimeout(() => {
          setStatus("idle");
        }, timeout);
      }
    },
    [timeout],
  );

  return {
    copy,
    status,
    isCopied: status === "copied",
    error,
  };
}
