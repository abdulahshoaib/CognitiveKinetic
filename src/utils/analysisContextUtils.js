import { buildReportTitle } from './reportTitles';

export const timestampToIso = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value?.toDate) return value.toDate().toISOString();
  return null;
};

export const normalizeAnalysisRun = (id, data, overrides = {}) => {
  const sourceContent = overrides.content || data.sourceContent || '';
  const relevanceScore = data.relevance?.score ?? data.relevanceScore ?? 0;
  const createdAt = timestampToIso(data.createdAt) || new Date().toISOString();
  const updatedAt = timestampToIso(data.updatedAt) || createdAt;
  const completedAt = timestampToIso(data.completedAt);
  const reportTitle = buildReportTitle(sourceContent, data);
  const snapshotItem = data.articleSnapshot
    ? {
        id: data.sourceItemId || null,
        sourceType: 'feed',
        sourceName: data.articleSnapshot.sourceName || 'Content Source',
        title: data.articleSnapshot.title || reportTitle,
        body: data.articleSnapshot.brief || sourceContent,
        timestamp: data.articleSnapshot.publishedAt || null,
        url: data.articleSnapshot.url || '',
        sourceUrl: data.articleSnapshot.url || '',
        detectedTopics: [],
      }
    : null;
  const sourceItem = overrides.sourceItem
    ? {
        id: overrides.sourceItem.id || overrides.sourceItemId || null,
        sourceType: overrides.sourceItem.sourceType || 'content',
        sourceName: overrides.sourceItem.sourceName || 'Analyzed Content',
        title: overrides.sourceItem.title || reportTitle,
        body: overrides.sourceItem.body || sourceContent,
        timestamp: overrides.sourceItem.timestamp || null,
        url: overrides.sourceItem.url || overrides.sourceItem.sourceUrl || '',
        sourceUrl: overrides.sourceItem.sourceUrl || overrides.sourceItem.url || '',
        detectedTopics: Array.isArray(overrides.sourceItem.detectedTopics)
          ? overrides.sourceItem.detectedTopics
          : [],
      }
    : snapshotItem;

  return {
    id,
    ...data,
    createdAt,
    updatedAt,
    completedAt,
    analyzedAt: completedAt || updatedAt || createdAt,
    relevanceScore,
    isRelevant: data.status !== 'ignored' && relevanceScore >= 30,
    reportTitle,
    sourceContent,
    sourceItem,
    sourceItemId: overrides.sourceItemId || data.sourceItemId || sourceItem?.id || null,
    sourceTitle: sourceItem?.title || reportTitle,
    sourceName: sourceItem?.sourceName || (data.sourceItemId ? 'Content Source' : 'Manual Input'),
    sourceUrl: sourceItem?.url || '',
    sourceBody: sourceItem?.body || sourceContent,
    sourceTimestamp: sourceItem?.timestamp || null,
    sourceTopics: sourceItem?.detectedTopics || [],
    impactMatrix: data.impactMatrix || {
      overallRisk: data.impact?.riskLevel || 'Moderate',
    },
  };
};

export const normalizeAnalysisRunSnapshot = (snap) => {
  const history = [];
  snap.forEach((docSnap) => {
    history.push(normalizeAnalysisRun(docSnap.id, docSnap.data()));
  });
  return history;
};

export const getSnapshotDocs = (snap) => {
  const docs = [];
  snap.forEach((docSnap) => {
    docs.push({
      id: docSnap.id,
      ...docSnap.data(),
    });
  });
  return docs;
};

export const buildLocalLogEntry = (message, stage = 'system', level = 'info') => {
  const timestamp = new Date().toLocaleTimeString();
  return {
    id: Math.random().toString(36).substr(2, 9),
    timestamp: `[${timestamp}]`,
    stage,
    message,
    level,
  };
};

export const normalizeLogDoc = (logDoc) => {
  const logData = logDoc.data();
  return {
    id: logDoc.id,
    timestamp: logData.timestamp ? `[${logData.timestamp.toDate?.()?.toLocaleTimeString() || new Date().toLocaleTimeString()}]` : '',
    stage: logData.stage || 'system',
    message: logData.message || '',
    level: logData.level || 'info',
  };
};

export const normalizeLogSnapshot = (snap) => {
  const logs = [];
  snap.forEach((logDoc) => {
    logs.push(normalizeLogDoc(logDoc));
  });
  return logs;
};

export const getRunFeedStatus = (relevanceScore = 0) => {
  if (relevanceScore >= 75) return 'high-impact';
  if (relevanceScore > 40) return 'relevant';
  return 'ignored';
};

export const updateActionStatusInResult = (result, actionId, status, logs = null) => {
  if (!result) return result;

  return {
    ...result,
    recommendedActions: (result.recommendedActions || []).map((action) =>
      action.id === actionId
        ? {...action, simulationStatus: status, simulationLogs: logs}
        : action
    ),
  };
};

export const normalizeSimulationResult = (action, result = {}) => {
  const passed = result.status === 'succeeded' || result.passed === true;
  const beforeState = result.beforeState || {};
  const afterState = result.afterState || beforeState;
  const logs = Array.isArray(result.logs) ? result.logs : [];

  return {
    actionId: action.id,
    actionTitle: action.title,
    beforeState,
    afterState,
    logs,
    passed,
    status: result.status || (passed ? 'succeeded' : 'failed'),
    simId: result.simId || null,
  };
};

export const buildManualFeedItem = (title, body) => ({
  sourceType: 'manual',
  sourceName: 'Manual Input',
  title,
  body,
  url: '',
  sourceUrl: '',
  timestamp: 'Just now',
  relevanceStatus: 'pending',
  detectedTopics: [],
  createdAt: new Date().toISOString(),
});

export const normalizeFeedRefreshResponse = (data = {}) => ({
  status: data?.status || 'empty',
  items: Array.isArray(data?.items) ? data.items : [],
  syncLogs: Array.isArray(data?.syncLogs) ? data.syncLogs : [],
});

export const buildFeedRefreshError = (error) => ({
  status: 'error',
  items: [],
  syncLogs: [{
    type: 'pull',
    sourceName: 'Content Feed',
    status: 'failed',
    errorType: 'Callable Error',
    message: error.message,
    reason: 'The backend feed collection function did not complete successfully.',
  }],
});

export const buildFeedItemContent = (item) => (
  `${item.title || ''}\n\n${item.summary || ''}\n\nSource: ${item.sourceName || 'Unknown'}`
);
