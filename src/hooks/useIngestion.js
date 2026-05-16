/**
 * Hook for content ingestion state management.
 */
import { useState, useCallback } from 'react';
import { parseTextInput } from '../services/ingestion';

export function useIngestion() {
  const [content, setContent] = useState(null);
  const [history, setHistory] = useState([]);

  const ingest = useCallback((text) => {
    const parsed = parseTextInput(text);
    setContent(parsed);
    setHistory((prev) => [parsed, ...prev]);
    return parsed;
  }, []);

  const clear = useCallback(() => {
    setContent(null);
  }, []);

  return { content, history, ingest, clear };
}

export default useIngestion;
