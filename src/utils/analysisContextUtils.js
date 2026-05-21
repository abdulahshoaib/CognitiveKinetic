import { buildReportTitle } from './reportTitles';

const titleCase = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const normalizeSignal = (signal, index) => {
  if (typeof signal === 'string') {
    return {
      id: `sig_${index}`,
      label: signal,
      evidence: signal,
      metric: '',
      severity: 'medium',
    };
  }

  const label = signal?.label || signal?.title || signal?.name || signal?.metric || `Signal ${index + 1}`;
  return {
    id: signal?.id || `sig_${index}`,
    ...signal,
    label,
    evidence: signal?.evidence || signal?.description || signal?.details || label,
    severity: signal?.severity || 'medium',
  };
};

const normalizeInsight = (insight, index) => {
  if (typeof insight === 'string') {
    const firstSentence = insight.split(/[.!?]/).find(Boolean)?.trim();
    return {
      id: `ins_${index}`,
      title: firstSentence || `Insight ${index + 1}`,
      description: insight,
      evidence: 'Generated from extracted signals and saved profile.',
      affectedArea: 'Operations',
      priority: 'medium',
    };
  }

  const description = insight?.description || insight?.details || insight?.summary || insight?.text || '';
  return {
    id: insight?.id || `ins_${index}`,
    ...insight,
    title: insight?.title || description.split(/[.!?]/).find(Boolean)?.trim() || `Insight ${index + 1}`,
    description,
    evidence: insight?.evidence || 'Generated from extracted signals and saved profile.',
    affectedArea: insight?.affectedArea || insight?.area || 'Operations',
    priority: insight?.priority || 'medium',
  };
};

export const normalizeImpact = (impact = {}) => {
  if (!impact) return null;

  const rawRisk = impact.riskLevel || impact.level || impact.severity || 'medium';
  const normalizedRisk = String(rawRisk).toLowerCase();
  const riskLevel = ['none', 'low', 'medium', 'moderate', 'high', 'critical'].includes(normalizedRisk)
    ? titleCase(normalizedRisk === 'moderate' ? 'medium' : normalizedRisk)
    : String(rawRisk);
  const details = impact.details || impact.explanation || impact.shortTerm || '';

  return {
    ...impact,
    riskLevel,
    details,
    shortTerm: impact.shortTerm || details || 'Operational impact requires review.',
    mediumTerm: impact.mediumTerm || impact.longTerm || 'Monitor the affected operating metrics and adjust if conditions persist.',
    explanation: impact.explanation || details || 'Impact generated from extracted signals and saved profile.',
  };
};

const normalizeAction = (action, index) => {
  const base = typeof action === 'string'
    ? { title: action, description: action }
    : (action || {});

  const title = base.title || base.name || `Recommended Action ${index + 1}`;
  return {
    id: base.id || `act_${index}`,
    ...base,
    title,
    description: base.description || base.details || title,
    rationale: base.rationale || base.reason || base.description || 'Recommended from the current impact analysis.',
    urgency: base.urgency || 'medium',
    confidence: base.confidence || 'moderate (75%)',
    actionType: base.actionType || 'manual_review',
    targetSystem: base.targetSystem || 'Operations Board',
    simulationSupported: base.simulationSupported === true,
    simulationStatus: base.simulationStatus || 'pending',
  };
};

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
  const signals = Array.isArray(data.signals) ? data.signals.map(normalizeSignal) : [];
  const insights = Array.isArray(data.insights) ? data.insights.map(normalizeInsight) : [];
  const impact = normalizeImpact(data.impact);
  const recommendedActions = Array.isArray(data.recommendedActions)
    ? data.recommendedActions.map(normalizeAction)
    : [];
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
    signals,
    insights,
    impact,
    recommendedActions,
    isArchived: !!data.isArchived,
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
      overallRisk: impact?.riskLevel || 'Moderate',
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
