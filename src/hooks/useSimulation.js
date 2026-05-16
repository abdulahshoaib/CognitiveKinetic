/**
 * Hook for action simulation state.
 */
import { useState, useCallback } from 'react';
import { simulateAction } from '../services/simulation';

export function useSimulation() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const simulate = useCallback((action) => {
    setRunning(true);
    // Simulate async delay
    setTimeout(() => {
      const simResult = simulateAction(action);
      setResult(simResult);
      setRunning(false);
    }, 1500);
  }, []);

  return { result, running, simulate };
}

export default useSimulation;
