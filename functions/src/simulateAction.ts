import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface SimulateActionRequest {
  runId: string;
  actionId: string;
}

interface RecommendedAction {
  id: string;
  actionType: string;
  simulationSupported: boolean;
  simulationStatus?: string;
  simulationLogs?: string[];
  [key: string]: unknown;
}

export const simulateAction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to call this endpoint."
    );
  }

  const {runId, actionId} = request.data as SimulateActionRequest;
  const uid = request.auth.uid;

  if (!runId || !actionId) {
    throw new HttpsError(
      "invalid-argument",
      "Both runId and actionId must be provided."
    );
  }

  const db = admin.firestore();

  // Transaction to read and write states atomically
  const result = await db.runTransaction(async (transaction) => {
    const mockStateRef = db.doc(`users/${uid}/mockState/main`);
    const runRef = db.doc(`users/${uid}/analysisRuns/${runId}`);

    const mockStateSnap = await transaction.get(mockStateRef);
    const runSnap = await transaction.get(runRef);

    if (!runSnap.exists) {
      throw new HttpsError("not-found", `Analysis run ${runId} not found.`);
    }

    const runData = runSnap.data() || {};
    const recommendedActions =
      (runData.recommendedActions || []) as RecommendedAction[];

    // Find action
    const actionIndex = recommendedActions.findIndex(
      (a) => a.id === actionId
    );
    if (actionIndex === -1) {
      throw new HttpsError(
        "not-found",
        `Action ${actionId} not found in this run.`
      );
    }

    const action = recommendedActions[actionIndex];

    // Verify epoundsligibility
    if (action.simulationSupported !== true) {
      throw new HttpsError(
        "failed-precondition",
        "Action does not support simulation."
      );
    }

    // Get before state
    let beforeState = {
      baseDeliveryFee: 100,
      longDistanceSurcharge: 0,
      peakHourSurcharge: 15,
      lastUpdate: "System Synced",
    };

    if (mockStateSnap.exists) {
      beforeState = {...beforeState, ...mockStateSnap.data()};
    }

    const afterState = {...beforeState};
    let logs: string[] = [];
    let passed = true;

    if (action.actionType === "pricing_adjust") {
      afterState.longDistanceSurcharge = 20;
      afterState.lastUpdate = "Surcharge Active (+Rs. 20)";
      logs = [
        "Configured API selected: mock pricing service",
        "API Request: POST /api/v1/config/pricing-rules",
        "Payload: { rule: 'long_distance_surcharge', value: 20, active: true }",
        "Response Status: 200 OK",
        "Database Write: Table [PricingRules] " +
          "updated row [long_distance] with value [20]",
        "System event triggered: PRICING_UPDATED_BROADCAST",
      ];
    } else if (action.actionType === "route_shift") {
      afterState.peakHourSurcharge = 30;
      afterState.lastUpdate = "Peak Adjustment Active (+Rs. 30)";
      logs = [
        "Configured API selected: mock routing service",
        "API Request: POST /api/v1/routes/optimizer",
        "Payload: { avoidZone: 'Mall Road Lahore', " +
          "shiftWindows: ['08:00', '20:00'] }",
        "Response Status: 200 OK",
        "AI Dispatch Engine: Routing graph " +
          "reconstructed to re-route 14 vehicles.",
        "Surcharge updated: Peak hour buffer raised to Rs. 30",
      ];
    } else if (action.actionType === "manual_review") {
      passed = false;
      logs = [
        "Simulation attempted for manual action type.",
        "Result: Cannot auto-execute — requires human operator intervention.",
        "Recommended: Execute this action " +
          "manually through operations dashboard.",
      ];
    } else {
      afterState.lastUpdate = "Policy Updated (Manual)";
      logs = [
        "Configured API selected: mock workflow service",
        "Notification Service: Dispatched urgent alert to operations team.",
        "Document Repository: Created policy amendment report.",
        "Task Queue: Added manual review task for account managers.",
      ];
    }

    // Apply changes
    if (passed) {
      transaction.set(mockStateRef, afterState, {merge: true});
    }

    // Create simulation record
    const simRef = db.collection(`users/${uid}/simulations`).doc();
    const simId = simRef.id;
    const simRecord = {
      actionId,
      status: passed ? "succeeded" : "failed",
      beforeState,
      afterState: passed ? afterState : beforeState,
      logs,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    transaction.set(simRef, simRecord);

    // Update run recommendedActions array and status
    const updatedActions = [...recommendedActions];
    updatedActions[actionIndex] = {
      ...action,
      simulationStatus: passed ? "passed" : "failed",
      simulationLogs: logs,
    };

    transaction.update(runRef, {
      recommendedActions: updatedActions,
      status: "simulated",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      simId,
      status: passed ? "succeeded" : "failed",
      beforeState,
      afterState: passed ? afterState : beforeState,
      logs,
    };
  });

  return result;
});
