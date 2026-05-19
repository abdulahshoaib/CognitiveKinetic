/**
 * Feature 6: Action Simulation Service
 * Note: This service is deprecated. Use AnalysisContext.executeSimulation() instead,
 * which properly calls the Cloud Function.
 * Kept for backward compatibility.
 */

export function simulateAction(action) {
  console.warn(
    'Legacy simulateAction called. Use AnalysisContext.executeSimulation() for Cloud Function integration.'
  );
  // This should not be called - use Cloud Function via AnalysisContext
  return {
    action,
    success: false,
    logs: ['Error: This is a legacy mock - use AnalysisContext.executeSimulation()'],
    beforeState: {},
    afterState: {},
  };
}

export default { simulateAction };
