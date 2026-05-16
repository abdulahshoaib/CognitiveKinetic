/**
 * Hook for running the agent pipeline.
 */
import { useState, useCallback } from 'react';
import { runPipeline } from '../services/agent/orchestrator';

export function useAgent() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (content) => {
    setLoading(true);
    setError(null);
    try {
      const pipelineResult = await runPipeline(content);
      setResult(pipelineResult);
      return pipelineResult;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, error, execute };
}

export default useAgent;
