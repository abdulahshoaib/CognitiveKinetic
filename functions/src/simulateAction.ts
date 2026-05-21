import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp();
}

interface SimulateActionRequest {
  runId: string;
  actionId: string;
  action?: RecommendedAction;
  clientApis?: ActionApi[];
}

interface RecommendedAction {
  id: string;
  title?: string;
  actionType: string;
  simulationSupported?: boolean;
  simulationStatus?: string;
  simulationLogs?: string[];
  targetSystem?: string;
  [key: string]: unknown;
}

interface ActionApi {
  id?: string;
  name?: string;
  baseUrl?: string;
  docsText?: string;
  authType?: "none" | "bearer" | "api_key_header";
  headerName?: string;
  token?: string;
  actionTypes?: string[];
  enabled?: boolean;
}

interface EndpointPlan {
  api: ActionApi | null;
  method: string;
  url: string;
  payload: Record<string, unknown>;
  headers: Record<string, string>;
  curlPreview: string;
  selectionReason: string;
}

const DEFAULT_SYSTEM_STATE = {
  baseDeliveryFee: 100,
  longDistanceSurcharge: 0,
  peakHourSurcharge: 15,
  lastUpdate: "System Synced",
};

const clean = (value: unknown) => String(value || "").trim();

const joinUrl = (baseUrl: string, path: string) => {
  if (!path) return baseUrl;
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
};

const parseEndpointFromDocs = (api: ActionApi) => {
  const docs = clean(api.docsText);
  const match = docs.match(/\b(GET|POST|PUT|PATCH|DELETE)\s+([^\s`]+)/i);
  return {
    method: (match?.[1] || "POST").toUpperCase(),
    path: match?.[2] || "",
  };
};

const pickActionApi = (apis: ActionApi[], action: RecommendedAction) => {
  const enabled = apis.filter((api) => api.enabled !== false && api.baseUrl);
  const actionType = clean(action.actionType);
  const exact = enabled.find((api) => (
    Array.isArray(api.actionTypes) &&
    api.actionTypes.includes(actionType)
  ));

  if (exact) {
    return {
      api: exact,
      reason: `Matched action type "${actionType}" to API "${exact.name}".`,
    };
  }

  const custom = enabled.find((api) => (
    Array.isArray(api.actionTypes) &&
    api.actionTypes.includes("custom")
  ));

  if (custom) {
    return {
      api: custom,
      reason: `No exact API match. Used custom API "${custom.name}".`,
    };
  }

  return {
    api: enabled[0] || null,
    reason: enabled[0]
      ? `No exact API match. Used first enabled API "${enabled[0].name}".`
      : "No enabled action API found in Profile Settings.",
  };
};

const buildPayload = (action: RecommendedAction) => {
  const base = {
    actionId: action.id,
    actionType: action.actionType,
    title: action.title || "Selected Action",
    targetSystem: action.targetSystem || "Configured API",
    dryRun: true,
  };

  if (action.actionType === "pricing_adjust") {
    return {
      ...base,
      rule: "long_distance_surcharge",
      value: 20,
      active: true,
    };
  }

  if (action.actionType === "route_shift") {
    return {
      ...base,
      avoidZone: "Mall Road Lahore",
      shiftWindows: ["08:00", "20:00"],
    };
  }

  return base;
};

const buildHeaders = (api: ActionApi) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = clean(api.token);

  if (api.authType === "bearer" && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (api.authType === "api_key_header" && token) {
    headers[clean(api.headerName) || "X-API-Key"] = token;
  }

  return headers;
};

const redactHeaders = (headers: Record<string, string>) => {
  const result: Record<string, string> = {};
  Object.entries(headers).forEach(([key, value]) => {
    result[key] = key.toLowerCase() === "content-type" ? value : "***";
  });
  return result;
};

const buildCurlPreview = (
  method: string,
  url: string,
  headers: Record<string, string>,
  payload: Record<string, unknown>
) => {
  const headerArgs = Object.entries(redactHeaders(headers))
    .map(([key, value]) => `-H "${key}: ${value}"`)
    .join(" ");
  return `curl -X ${method} "${url}" ${headerArgs} -d '${JSON.stringify(payload)}'`;
};

const buildEndpointPlan = (
  apis: ActionApi[],
  action: RecommendedAction
): EndpointPlan => {
  const {api, reason} = pickActionApi(apis, action);
  if (!api?.baseUrl) {
    return {
      api: null,
      method: "POST",
      url: "",
      payload: buildPayload(action),
      headers: {"Content-Type": "application/json"},
      curlPreview: "",
      selectionReason: reason,
    };
  }

  const endpoint = parseEndpointFromDocs(api);
  const payload = buildPayload(action);
  const headers = buildHeaders(api);
  const url = joinUrl(api.baseUrl, endpoint.path);

  return {
    api,
    method: endpoint.method,
    url,
    payload,
    headers,
    curlPreview: buildCurlPreview(endpoint.method, url, headers, payload),
    selectionReason: reason,
  };
};

const applyStateChange = (
  action: RecommendedAction,
  beforeState: Record<string, unknown>,
  passed: boolean
) => {
  if (!passed) return beforeState;
  const afterState = {...beforeState};

  if (action.actionType === "pricing_adjust") {
    afterState.longDistanceSurcharge = 20;
    afterState.lastUpdate = "Surcharge Active (+Rs. 20)";
  } else if (action.actionType === "route_shift") {
    afterState.peakHourSurcharge = 30;
    afterState.lastUpdate = "Peak Adjustment Active (+Rs. 30)";
  } else {
    afterState.lastUpdate = "Action API accepted dry-run request";
  }

  return afterState;
};

const callActionApi = async (plan: EndpointPlan) => {
  if (!plan.api || !plan.url) {
    return {
      ok: false,
      status: 0,
      statusText: "No API configured",
      body: "",
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(plan.url, {
      method: plan.method,
      headers: plan.headers,
      body: JSON.stringify(plan.payload),
      signal: controller.signal,
    });
    const body = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: body.slice(0, 500),
    };
  } finally {
    clearTimeout(timer);
  }
};

export const simulateAction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Authentication required to call this endpoint."
    );
  }

  const {runId, actionId, action: requestAction, clientApis} =
    request.data as SimulateActionRequest;
  const uid = request.auth.uid;

  if (!runId || !actionId) {
    throw new HttpsError(
      "invalid-argument",
      "Both runId and actionId must be provided."
    );
  }

  const db = admin.firestore();
  const mockStateRef = db.doc(`users/${uid}/mockState/main`);
  const runRef = db.doc(`users/${uid}/analysisRuns/${runId}`);
  const apiSettingsRef = db.doc(`users/${uid}/settings/actionApis`);

  const [mockStateSnap, runSnap, apiSettingsSnap] = await Promise.all([
    mockStateRef.get(),
    runRef.get(),
    apiSettingsRef.get(),
  ]);

  const runData = runSnap.exists ? runSnap.data() || {} : {};
  if (runData.uid && runData.uid !== uid) {
    throw new HttpsError(
      "permission-denied",
      "You do not have permission to simulate this action on another user's analysis."
    );
  }

  const recommendedActions =
    (runData.recommendedActions || []) as RecommendedAction[];
  const foundAction = recommendedActions.find((item) => item.id === actionId);
  const action = foundAction || requestAction;

  if (!action) {
    throw new HttpsError(
      "not-found",
      `Action ${actionId} not found in this run.`
    );
  }

  const beforeState = {
    ...DEFAULT_SYSTEM_STATE,
    ...(mockStateSnap.exists ? mockStateSnap.data() || {} : {}),
  };

  // Use Firestore APIs first; fall back to client-provided APIs if empty
  let apis = (apiSettingsSnap.data()?.apis || []) as ActionApi[];
  if (apis.length === 0 && Array.isArray(clientApis) && clientApis.length > 0) {
    apis = clientApis;
    // Persist the client-provided APIs to Firestore so future calls find them
    try {
      await apiSettingsRef.set(
        {apis: clientApis, updatedAt: admin.firestore.FieldValue.serverTimestamp()},
        {merge: true}
      );
    } catch (persistErr) {
      console.warn("Unable to persist client APIs to Firestore:", persistErr);
    }
  }

  const plan = buildEndpointPlan(apis, action);
  const logs = [
    `Action selected: ${action.title || action.id}`,
    plan.selectionReason,
  ];

  if (plan.api) {
    logs.push(`Endpoint chosen: ${plan.method} ${plan.url}`);
    logs.push(`Payload prepared: ${JSON.stringify(plan.payload)}`);
    logs.push(`cURL preview: ${plan.curlPreview}`);
  } else {
    logs.push("Open Profile Settings > Action APIs to add an endpoint.");
  }

  let apiResult;
  try {
    apiResult = await callActionApi(plan);
    logs.push(
      `API response: ${apiResult.status} ${apiResult.statusText}`.trim()
    );
    if (apiResult.body) {
      logs.push(`Response body: ${apiResult.body}`);
    }
  } catch (error: any) {
    apiResult = {
      ok: false,
      status: 0,
      statusText: error?.message || "Request failed",
      body: "",
    };
    logs.push(`API request failed: ${apiResult.statusText}`);
  }

  const passed = !!apiResult.ok;
  const afterState = applyStateChange(action, beforeState, passed);
  logs.push(
    passed
      ? "State update applied because API accepted request."
      : "State unchanged because API call did not succeed."
  );

  const simRef = db.collection(`users/${uid}/simulations`).doc();
  const simRecord = {
    actionId,
    actionTitle: String(action.title || "Selected Action"),
    status: passed ? "succeeded" : "failed",
    passed,
    apiName: plan.api?.name || null,
    endpoint: plan.url || null,
    method: plan.method,
    requestPayload: plan.payload,
    responseStatus: apiResult.status,
    responseText: apiResult.body || "",
    beforeState,
    afterState,
    logs,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await db.runTransaction(async (transaction) => {
    const freshRunSnap = runSnap.exists
      ? await transaction.get(runRef)
      : null;

    if (passed) {
      transaction.set(mockStateRef, afterState, {merge: true});
    }
    transaction.set(simRef, simRecord);

    if (!freshRunSnap?.exists) return;
    const freshData = freshRunSnap.data() || {};
    const currentActions =
      (freshData.recommendedActions || []) as RecommendedAction[];
    const actionIndex = currentActions.findIndex(
      (item) => item.id === actionId
    );
    if (actionIndex === -1) return;

    const updatedActions = [...currentActions];
    updatedActions[actionIndex] = {
      ...updatedActions[actionIndex],
      simulationStatus: passed ? "passed" : "failed",
      simulationLogs: logs,
    };

    transaction.update(runRef, {
      recommendedActions: updatedActions,
      status: passed ? "simulated" : "simulation_failed",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return {
    simId: simRef.id,
    runId,
    actionId,
    actionTitle: String(action.title || "Selected Action"),
    status: passed ? "succeeded" : "failed",
    passed,
    beforeState,
    afterState,
    logs,
    apiName: plan.api?.name || null,
    endpoint: plan.url || null,
    method: plan.method,
    requestPayload: plan.payload,
    responseStatus: apiResult.status,
    responseText: apiResult.body || "",
  };
});
