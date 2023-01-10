import React, { useCallback, useEffect, useState } from 'react';

function useCopyToClipboard(resetIsCopiedInterval = null) {
  const [isCopied, setIsCopied] = useState(false);
  const [support, setSupport] = useState(!!navigator.clipboard);

  const copyToClipboard = useCallback((value) => {
    if (support) {
      try {
        navigator.clipboard.writeText(value);
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 2000);
      } catch (e) {
        setSupport(false);
      }
    }
  }, []);

  useEffect(() => {
    let timeout;
    if (isCopied && resetIsCopiedInterval) {
      timeout = setTimeout(() => setIsCopied(false), resetIsCopiedInterval);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [isCopied, resetIsCopiedInterval]);

  return [isCopied, copyToClipboard];
}

export default useCopyToClipboard;
