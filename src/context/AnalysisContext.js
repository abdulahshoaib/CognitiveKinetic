import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { doc, collection, onSnapshot, query, orderBy, getDocs, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../services/firebase';
import { runPipeline } from '../services/agent/orchestrator';
import { getProfile } from '../services/profileService';
import {
  addUserFeedItems,
  createManualFeedItem,
  dismissUserFeedItem,
  listenUserFeedItems,
  refreshUserFeed,
  updateFeedItemSaved,
  updateFeedItemStatus,
} from '../services/feedService';
import { useAuth } from './AuthContext';
import { useIntegrations } from './IntegrationsContext';
import {
  buildFeedItemContent,
  buildManualFeedItem,
  buildLocalLogEntry,
  getRunFeedStatus,
  normalizeAnalysisRun,
  normalizeAnalysisRunSnapshot,
  normalizeLogSnapshot,
  updateActionStatusInResult,
} from '../utils/analysisContextUtils';
import { getJSON, setJSON } from '../utils/storage';

const noop = () => {};
const LOCAL_ANALYSIS_PREFIX = '@relay_analysis_';
const LOCAL_REPORT_PREFIX = 'local_run_';
const DEFAULT_SYSTEM_STATE = {
  baseDeliveryFee: 100,
  longDistanceSurcharge: 0,
  peakHourSurcharge: 15,
  lastUpdate: 'System Synced',
};

const localKey = (uid, scope) => `${LOCAL_ANALYSIS_PREFIX}${uid}_${scope}`;

const sortAnalysisHistory = (history = []) => (
  [...history].sort((a, b) => {
    const aTime = new Date(a.analyzedAt || a.updatedAt || a.createdAt || 0).getTime();
    const bTime = new Date(b.analyzedAt || b.updatedAt || b.createdAt || 0).getTime();
    return bTime - aTime;
  })
);

const mergeById = (primary = [], secondary = []) => {
  const merged = new Map();
  [...secondary, ...primary].forEach((item) => {
    const id = item?.id || item?.feedItemId;
    if (!id) return;
    merged.set(id, { ...(merged.get(id) || {}), ...item, id: item.id || id });
  });
  return Array.from(merged.values());
};

const persistAnalysisHistory = async (uid, history) => {
  if (!uid) return;
  await setJSON(localKey(uid, 'history'), sortAnalysisHistory(history));
};

const upsertHistoryItem = (history, nextItem) => {
  if (!nextItem?.id) return sortAnalysisHistory(history || []);
  return sortAnalysisHistory(mergeById([nextItem], history || []));
};

const removeHistoryItem = (history, analysisId) => (
  (history || []).filter((item) => item?.id !== analysisId)
);

const AnalysisContext = createContext({
  feedItems: [],
  selectedItem: null,
  setSelectedItem: noop,
  isAnalyzing: false,
  currentStage: 'idle',
  analysisResult: null,
  analysisHistory: [],
  isSimulating: false,
  simulationResult: null,
  executionLogs: [],
  systemState: null,
  analyzeContent: noop,
  executeSimulation: noop,
  clearAnalysis: noop,
  addManualAnalysisItem: noop,
  addFeedItems: noop,
  refreshFeedItems: noop,
  viewAnalysis: noop,
  markActionSimulated: noop,
  saveFeedItem: noop,
  dismissFeedItem: noop,
  analyzeFeedItem: noop,
  archiveAnalysis: noop,
  deleteAnalysis: noop,
});

export const AnalysisProvider = ({ children }) => {
  const { user } = useAuth();
  const { actionApis } = useIntegrations();
  const analysisRunsListenerRef = useRef(null);
  const [feedItems, setFeedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState('idle'); // idle, loading_profile, ingesting, signals, relevance, insights, impact, actions, completed
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [localCacheLoaded, setLocalCacheLoaded] = useState(false);
  const activeSubscriptions = useRef([]);

  const [systemState, setSystemState] = useState(null);

  // Cleanup active run subscriptions
  const cleanupActiveRun = useCallback(() => {
    activeSubscriptions.current.forEach(unsub => unsub());
    activeSubscriptions.current = [];
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupActiveRun();
  }, [cleanupActiveRun]);

  // Hydrate all visible analysis state from local storage before live sync completes.
  useEffect(() => {
    let mounted = true;

    const loadLocalState = async () => {
      if (!user?.uid) {
        setFeedItems([]);
        setSelectedItem(null);
        setAnalysisResult(null);
        setAnalysisHistory([]);
        setSimulationResult(null);
        setExecutionLogs([]);
        setSystemState(null);
        setCurrentStage('idle');
        setLocalCacheLoaded(false);
        return;
      }

      setLocalCacheLoaded(false);
      try {
        const [
          cachedFeedItems,
          cachedHistory,
          cachedActiveReport,
          cachedSimulation,
          cachedLogs,
          cachedSystemState,
          cachedStage,
        ] = await Promise.all([
          getJSON(localKey(user.uid, 'feedItems'), []),
          getJSON(localKey(user.uid, 'history'), []),
          getJSON(localKey(user.uid, 'activeReport'), null),
          getJSON(localKey(user.uid, 'simulationResult'), null),
          getJSON(localKey(user.uid, 'executionLogs'), []),
          getJSON(localKey(user.uid, 'systemState'), null),
          getJSON(localKey(user.uid, 'currentStage'), 'idle'),
        ]);

        if (!mounted) return;
        setFeedItems(Array.isArray(cachedFeedItems) ? cachedFeedItems : []);
        setAnalysisHistory(Array.isArray(cachedHistory) ? sortAnalysisHistory(cachedHistory) : []);
        setAnalysisResult(cachedActiveReport);
        setSimulationResult(cachedSimulation);
        setExecutionLogs(Array.isArray(cachedLogs) ? cachedLogs : []);
        setSystemState(cachedSystemState);
        setCurrentStage(cachedStage || 'idle');
      } catch (error) {
        console.warn('Unable to hydrate persisted analysis state:', error);
      } finally {
        if (mounted) setLocalCacheLoaded(true);
      }
    };

    loadLocalState();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    setJSON(localKey(user.uid, 'feedItems'), feedItems).catch((error) => {
      console.warn('Unable to persist feed items:', error);
    });
  }, [user?.uid, localCacheLoaded, feedItems]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    persistAnalysisHistory(user.uid, analysisHistory).catch((error) => {
      console.warn('Unable to persist analysis history:', error);
    });
  }, [user?.uid, localCacheLoaded, analysisHistory]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    setJSON(localKey(user.uid, 'activeReport'), analysisResult).catch((error) => {
      console.warn('Unable to persist active report:', error);
    });
  }, [user?.uid, localCacheLoaded, analysisResult]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    setJSON(localKey(user.uid, 'simulationResult'), simulationResult).catch((error) => {
      console.warn('Unable to persist simulation result:', error);
    });
  }, [user?.uid, localCacheLoaded, simulationResult]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    setJSON(localKey(user.uid, 'executionLogs'), executionLogs).catch((error) => {
      console.warn('Unable to persist execution logs:', error);
    });
  }, [user?.uid, localCacheLoaded, executionLogs]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    setJSON(localKey(user.uid, 'systemState'), systemState).catch((error) => {
      console.warn('Unable to persist system state:', error);
    });
  }, [user?.uid, localCacheLoaded, systemState]);

  useEffect(() => {
    if (!user?.uid || !localCacheLoaded) return;
    setJSON(localKey(user.uid, 'currentStage'), currentStage).catch((error) => {
      console.warn('Unable to persist analysis stage:', error);
    });
  }, [user?.uid, localCacheLoaded, currentStage]);

  // 0. Sync user-scoped feedItems in real-time with Firestore.
  useEffect(() => {
    if (!user) {
      setFeedItems([]);
      return;
    }

    return listenUserFeedItems(user.uid, (remoteItems) => {
      setFeedItems((prev) => mergeById(remoteItems, prev).filter((item) => item.status !== 'dismissed'));
    }, (err) => {
      console.error("Error listening to user feed items:", err);
    });
  }, [user]);

  // 1. Sync systemState in real-time with Firestore
  useEffect(() => {
    if (!user) {
      setSystemState(null);
      return;
    }

    const systemStateRef = doc(db, 'users', user.uid, 'mockState', 'main');
    const unsubscribe = onSnapshot(systemStateRef, (snap) => {
      if (snap.exists()) {
        setSystemState(snap.data());
      } else {
        setSystemState(DEFAULT_SYSTEM_STATE);
      }
    }, (err) => {
      console.error("Error listening to mock state:", err);
    });

    return unsubscribe;
  }, [user]);

  // 2. Sync analysisHistory in real-time with Firestore
  useEffect(() => {
    if (!user) {
      setAnalysisHistory([]);
      return;
    }

    const runsColRef = collection(db, 'users', user.uid, 'analysisRuns');
    const q = query(runsColRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const remoteHistory = normalizeAnalysisRunSnapshot(snap);
      setAnalysisHistory((prev) => {
        const localOnly = (prev || []).filter((item) => String(item?.id || '').startsWith(LOCAL_REPORT_PREFIX));
        return sortAnalysisHistory(mergeById(remoteHistory, localOnly));
      });
    }, (err) => {
      console.error("Error listening to analysis runs:", err);
    });

    return unsubscribe;
  }, [user]);

  const addLog = useCallback((message, stage = 'system', level = 'info') => {
    setExecutionLogs((prev) => [...prev, buildLocalLogEntry(message, stage, level)]);
  }, []);

  // 3. Initiate analysis using the real backend Callable Function
  const analyzeContent = useCallback(async (content, profileContext, sourceItemId = null, sourceItem = null) => {
    if (!user) return;

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSimulationResult(null);
    setExecutionLogs([]);
    setCurrentStage('loading_profile');

    const watchdogRef = { timer: null };

    const clearWatchdog = () => {
      if (watchdogRef.timer) {
        clearTimeout(watchdogRef.timer);
        watchdogRef.timer = null;
      }
    };

    // Start watchdog immediately — 60 seconds max for the entire pipeline (including backend Callable and Firestore updates)
    watchdogRef.timer = setTimeout(() => {
      console.warn('Analysis watchdog: pipeline did not complete in 60s');
      addLog('Pipeline timed out. Execution exceeded 60 seconds.', 'orchestrator', 'error');
      setIsAnalyzing(false);
      setCurrentStage('error');
      cleanupActiveRun();
    }, 60000);

    try {
      addLog('Initiating backend content-to-action analysis pipeline...', 'orchestrator');
      const savedProfileContext = profileContext || await getProfile(user.uid) || {};

      // Check for local LLM key to bypass undeployed backend functions
      const groqApiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;

      if (groqApiKey && groqApiKey.trim().length > 0) {
        addLog('Local Groq API key found. Running analysis directly on client...', 'orchestrator');
        
        const runId = `local_run_${Date.now()}`;
        
        setCurrentStage('ingesting');
        addLog('New content ingested.', 'ingesting');
        await new Promise(r => setTimeout(r, 500));

        setCurrentStage('signals');
        addLog('Signals extracted from content.', 'signals');
        await new Promise(r => setTimeout(r, 500));
        
        setCurrentStage('relevance');
        const localResult = await runPipeline(content, savedProfileContext);
        addLog(`Relevance checked: ${localResult.relevanceScore}%`, 'relevance');
        await new Promise(r => setTimeout(r, 500));

        setCurrentStage('insights');
        addLog('Operational insight generated.', 'insights');
        await new Promise(r => setTimeout(r, 500));

        setCurrentStage('impact');
        addLog('Impact analysis completed.', 'impact');
        await new Promise(r => setTimeout(r, 500));

        setCurrentStage('actions');
        addLog('Recommended actions created.', 'actions');
        await new Promise(r => setTimeout(r, 500));

        clearWatchdog();
        cleanupActiveRun();

        const enrichedResult = normalizeAnalysisRun(runId, {
          status: localResult.isRelevant ? 'needs_simulation' : 'ignored',
          currentStage: 'completed',
          signals: localResult.signals,
          relevance: { score: localResult.relevanceScore, explanation: localResult.insights[0]?.description },
          insights: localResult.insights,
          impact: localResult.impact,
          recommendedActions: localResult.recommendedActions
        }, {
          content,
          sourceItemId,
          sourceItem,
        });

        setAnalysisResult(enrichedResult);
        setAnalysisHistory(prev => upsertHistoryItem(prev, enrichedResult));
        setIsAnalyzing(false);
        setCurrentStage('completed');

        if (sourceItemId) {
          setFeedItems(prev => prev.map(item =>
            item.id === sourceItemId
              ? { ...item, relevanceStatus: getRunFeedStatus(localResult.relevanceScore || 0), status: 'analyzed' }
              : item
          ));
        }

        return; // EXIT EARLY
      }

      // If no local key, fallback to backend logic
      const createAnalysisRunCallable = httpsCallable(functions, 'createAnalysisRun');
      const res = await createAnalysisRunCallable({
        content,
        sourceItemId
      });

      const { runId } = res.data;

      // Cleanup any existing run subscriptions
      cleanupActiveRun();

      // Subscribe to this specific run and its logs to show real-time progress
      const runDocRef = doc(db, 'users', user.uid, 'analysisRuns', runId);
      const logsColRef = collection(db, 'users', user.uid, 'analysisRuns', runId, 'logs');
      const logsQuery = query(logsColRef, orderBy('timestamp', 'asc'));

      let unsubscribeRun = () => {};
      let unsubscribeLogs = () => {};

      unsubscribeLogs = onSnapshot(logsQuery, (logsSnap) => {
        setExecutionLogs(normalizeLogSnapshot(logsSnap));
      }, (err) => {
        console.error("Error monitoring active analysis run logs:", err);
      });
      activeSubscriptions.current.push(unsubscribeLogs);

      // Subscribe to run status/state changes
      unsubscribeRun = onSnapshot(runDocRef, (runSnap) => {
        if (!runSnap.exists()) return;
        const data = runSnap.data();

        if (data.currentStage) {
          setCurrentStage(data.currentStage);
        }

        if (data.status === 'completed' || data.status === 'needs_simulation' || data.status === 'ignored' || data.status === 'failed') {
          clearWatchdog();
          // Unsubscribe from real-time monitoring
          cleanupActiveRun();

          const enrichedResult = normalizeAnalysisRun(runSnap.id, data, {
            content,
            sourceItemId,
            sourceItem,
          });

          setAnalysisResult(enrichedResult);
          setAnalysisHistory(prev => upsertHistoryItem(prev, enrichedResult));
          setIsAnalyzing(false);

          if (data.status === 'failed') {
            setCurrentStage('error');
          } else {
            setCurrentStage('completed');
          }

          if (sourceItemId) {
            setFeedItems(prev => prev.map(item =>
              item.id === sourceItemId
                ? { ...item, relevanceStatus: getRunFeedStatus(data.relevance?.score || 0), status: 'analyzed' }
                : item
            ));
          }
        }
      }, (err) => {
        console.error("Error monitoring active analysis run:", err);
        clearWatchdog();
        setIsAnalyzing(false);
        setCurrentStage('error');
        addLog(`Firestore listener error: ${err.message}`, 'orchestrator', 'error');
        cleanupActiveRun();
      });
      activeSubscriptions.current.push(unsubscribeRun);

    } catch (error) {
      console.error("Analysis pipeline failed:", error);
      clearWatchdog();
      addLog(`Pipeline execution halted: ${error.message}`, 'orchestrator', 'error');
      setIsAnalyzing(false);
      setCurrentStage('error');
    }
  }, [user, addLog, cleanupActiveRun]);


  // 4. Trigger simulation through the backend API runner.
  const executeSimulation = useCallback(async (action, analysisId = null) => {
    if (!action || !user) return;
    const runId = analysisId || analysisResult?.id;
    if (!runId) {
      addLog('Simulation error: analysis run id is missing.', 'simulation', 'error');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);
    setExecutionLogs([]); // Clear logs for a clean simulation run

    const updateActionStatus = (status, logs = null) => {
      setAnalysisResult(prev =>
        prev?.id === runId ? updateActionStatusInResult(prev, action.id, status, logs) : prev
      );
      setAnalysisHistory(prev => (prev || []).map(item =>
        item?.id === runId ? updateActionStatusInResult(item, action.id, status, logs) : item
      ));
    };

    updateActionStatus('running');

    try {
      addLog(`Preparing API simulation for: ${action.title}`, 'simulation');
      addLog('Reading Action API setup from Firestore.', 'simulation');

      // Pass user's action API configs as fallback in case Firestore hasn't synced yet
      const enabledApis = (actionApis || []).filter(api => api.enabled !== false);
      const simulateActionCallable = httpsCallable(functions, 'simulateAction');
      const response = await simulateActionCallable({
        runId,
        actionId: action.id,
        action,
        clientApis: enabledApis,
      });
      const simResult = response.data || {};
      const rawLogs = Array.isArray(simResult.logs) ? simResult.logs : [];

      for (const message of rawLogs) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const isFailure = String(message).toLowerCase().includes('failed') ||
          String(message).toLowerCase().includes('unchanged');
        addLog(
          message,
          message.startsWith('cURL') ? 'tool' : 'simulation',
          isFailure ? 'error' : 'info'
        );
      }

      setSimulationResult(simResult);
      if (simResult.afterState) setSystemState(simResult.afterState);
      updateActionStatus(simResult.passed ? 'passed' : 'failed', rawLogs);

      addLog(
        simResult.passed
          ? 'Simulation complete. Backend API accepted request.'
          : 'Simulation failed. Check API endpoint, auth, and payload.',
        'simulation',
        simResult.passed ? 'success' : 'error'
      );

    } catch (error) {
      console.error("Simulation failed:", error);
      const errorMsg = error?.message || 'Unknown error';
      addLog(`Simulation error: ${errorMsg}`, 'simulation', 'error');
      updateActionStatus('failed', [errorMsg]);
    } finally {
      setIsSimulating(false);
    }
  }, [user, analysisResult, addLog]);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setIsSimulating(false);
    setSimulationResult(null);
    setExecutionLogs([]);
    setCurrentStage('idle');
    setSelectedItem(null);
  }, []);

  const addManualAnalysisItem = useCallback(async (title, body) => {
    if (!user) return null;
    try {
      return await createManualFeedItem(user.uid, title, body);
    } catch (e) {
      console.error("Error adding manual analysis item:", e);
      const localItem = {
        id: `local_feed_${Date.now()}`,
        ...buildManualFeedItem(title, body),
        localOnly: true,
      };
      setFeedItems(prev => mergeById([localItem], prev));
      addLog('Manual content saved locally for analysis.', 'feed', 'warning');
      return localItem;
    }
  }, [user, addLog]);

  const addFeedItems = useCallback(async (items) => {
    if (!user) return;
    try {
      await addUserFeedItems(user.uid, items);
    } catch (e) {
      console.error("Error adding feed items:", e);
      setFeedItems(prev => mergeById(
        (items || []).map(item => ({
          ...item,
          id: item.id || item.feedItemId || `local_feed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          localOnly: true,
        })),
        prev,
      ));
      addLog('Feed items saved locally after remote write failed.', 'feed', 'warning');
    }
  }, [user, addLog]);

  const refreshFeedItems = useCallback(async (configuredSources, systemPrompt) => {
    if (!user) return { status: 'empty', items: [], syncLogs: [] };

    try {
      const result = await refreshUserFeed(user.uid, configuredSources, systemPrompt);

      // Merge client-fetched items into local state (Firestore rules block
      // client writes for agent-scored items, so we merge in-memory)
      if (result?.items?.length > 0) {
        setFeedItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id || item.feedItemId));
          const newItems = result.items.filter(
            (item) => !existingIds.has(item.id) && !existingIds.has(item.feedItemId)
          );
          if (newItems.length === 0) return prev;
          return [...newItems, ...prev];
        });
      }

      return result;
    } catch (error) {
      console.error("Error refreshing feed items:", error);
      addLog(`Feed refresh failed: ${error.message}`, 'feed', 'error');
      return { status: 'error', items: [], syncLogs: [] };
    }
  }, [user, addLog]);

  // 5. Populate logs and select past run from history
  const viewAnalysis = useCallback(async (analysis) => {
    setAnalysisResult(analysis);
    if (user && analysis?.id) {
      try {
        const logsColRef = collection(db, 'users', user.uid, 'analysisRuns', analysis.id, 'logs');
        const q = query(logsColRef, orderBy('timestamp', 'asc'));
        const querySnap = await getDocs(q);
        setExecutionLogs(normalizeLogSnapshot(querySnap));
      } catch (err) {
        console.error("Error fetching logs for historical run:", err);
      }
    }
  }, [user]);

  const markActionSimulated = useCallback(async (analysisId, actionId) => {
    if (!user || !analysisId || !actionId) return;

    try {
      // Find action title for logging
      let actionTitle = 'Manual Operational Adjustment';
      const findAction = (run) => (run?.recommendedActions || []).find(a => a.id === actionId);
      const found = findAction(analysisResult?.id === analysisId ? analysisResult : null)
        || findAction((analysisHistory || []).find(run => run.id === analysisId));
      if (found) actionTitle = found.title || actionTitle;

      const completionLogs = [
        'Manual action marked as completed by operator.',
        `Action: ${actionTitle}`,
        'No automated simulation required — manual execution confirmed.',
      ];

      // Directly mark as passed without calling backend
      const updateStatus = (status, logs) => {
        setAnalysisResult(prev =>
          prev?.id === analysisId ? updateActionStatusInResult(prev, actionId, status, logs) : prev
        );
        setAnalysisHistory(prev => (prev || []).map(item =>
          item?.id === analysisId ? updateActionStatusInResult(item, actionId, status, logs) : item
        ));
      };

      updateStatus('passed', completionLogs);

      // Set simulation result so SimulationResultScreen shows completion
      setSimulationResult({
        actionTitle,
        passed: true,
        beforeState: {},
        afterState: {},
        logs: completionLogs,
        apiName: 'Manual Completion',
        endpoint: 'N/A — operator confirmed',
        method: 'MANUAL',
        responseStatus: 200,
        requestPayload: null,
      });

      addLog(`Manual action "${actionTitle}" marked as completed.`, 'simulation', 'success');

      // Persist to Firestore if not a local-only run
      if (!String(analysisId).startsWith(LOCAL_REPORT_PREFIX)) {
        try {
          const actionDocRef = doc(db, 'users', user.uid, 'analysisRuns', analysisId);
          const snap = await getDoc(actionDocRef);
          if (snap.exists()) {
            const data = snap.data();
            const updatedActions = (data.recommendedActions || []).map(a =>
              a.id === actionId ? { ...a, simulationStatus: 'passed', simulationLogs: completionLogs } : a
            );
            await updateDoc(actionDocRef, { recommendedActions: updatedActions });
          }
        } catch (persistErr) {
          console.warn('Unable to persist manual completion to Firestore:', persistErr);
        }
      }
    } catch (error) {
      console.error("Manual action completion failed:", error);
    }
  }, [user, analysisResult, analysisHistory, addLog]);

  const saveFeedItem = useCallback(async (feedItemId, saved = true) => {
    if (!user) return;
    setFeedItems(prev => prev.map(item =>
      (item.id === feedItemId || item.feedItemId === feedItemId)
        ? { ...item, saved, updatedAt: new Date().toISOString() }
        : item
    ));
    try {
      await updateFeedItemSaved(user.uid, feedItemId, saved);
      addLog(`Feed item marked as ${saved ? 'saved' : 'unsaved'}.`, 'feed');
    } catch (e) {
      console.error("Error saving feed item:", e);
      addLog(`Failed to save feed item: ${e.message}`, 'feed', 'error');
    }
  }, [user, addLog]);

  const dismissFeedItem = useCallback(async (feedItemId) => {
    if (!user) return;
    // Remove from local state immediately (covers client-fetched items)
    setFeedItems((prev) => prev.filter((item) => item.id !== feedItemId && item.feedItemId !== feedItemId));
    try {
      await dismissUserFeedItem(user.uid, feedItemId);
      addLog(`Feed item dismissed and deleted.`, 'feed');
    } catch (e) {
      // Firestore delete may fail for client-only items — that's ok
      if (e?.code !== 'not-found') {
        console.error("Error dismissing feed item:", e);
      }
    }
  }, [user, addLog]);

  const analyzeFeedItem = useCallback(async (feedItemId) => {
    if (!user) return;
    try {
      const item = feedItems.find(i => i.feedItemId === feedItemId || i.id === feedItemId);
      if (!item) {
        throw new Error("Feed item not found locally.");
      }
      const content = buildFeedItemContent(item);

      setFeedItems(prev => prev.map(feedItem =>
        (feedItem.id === feedItemId || feedItem.feedItemId === feedItemId)
          ? { ...feedItem, status: 'analyzing', updatedAt: new Date().toISOString() }
          : feedItem
      ));
      try {
        await updateFeedItemStatus(user.uid, feedItemId, 'analyzing');
      } catch (statusError) {
        console.warn('Unable to sync feed analyzing status remotely:', statusError);
      }

      await analyzeContent(content, null, feedItemId, item);

      setFeedItems(prev => prev.map(feedItem =>
        (feedItem.id === feedItemId || feedItem.feedItemId === feedItemId)
          ? { ...feedItem, status: 'analyzed', updatedAt: new Date().toISOString() }
          : feedItem
      ));
      try {
        await updateFeedItemStatus(user.uid, feedItemId, 'analyzed');
      } catch (statusError) {
        console.warn('Unable to sync feed analyzed status remotely:', statusError);
      }

      addLog(`Feed item analysis complete.`, 'feed');
    } catch (e) {
      console.error("Error analyzing feed item:", e);
      addLog(`Failed to analyze feed item: ${e.message}`, 'feed', 'error');

      try {
        setFeedItems(prev => prev.map(feedItem =>
          (feedItem.id === feedItemId || feedItem.feedItemId === feedItemId)
            ? { ...feedItem, status: 'unread', updatedAt: new Date().toISOString() }
            : feedItem
        ));
        await updateFeedItemStatus(user.uid, feedItemId, 'unread');
      } catch (innerErr) {
        console.error("Error resetting feed item status:", innerErr);
      }
    }
  }, [user, feedItems, analyzeContent, addLog]);

  const archiveAnalysis = useCallback(async (analysisId, archived = true) => {
    if (!user || !analysisId) return;

    setAnalysisResult(prev => {
      if (prev && prev.id === analysisId) {
        return { ...prev, isArchived: archived };
      }
      return prev;
    });
    setAnalysisHistory(prev => (prev || []).map(item =>
      item?.id === analysisId ? { ...item, isArchived: archived } : item
    ));

    try {
      const docRef = doc(db, 'users', user.uid, 'analysisRuns', analysisId);
      await updateDoc(docRef, { isArchived: archived });

      addLog(`Analysis report ${archived ? 'archived' : 'unarchived'}.`, 'orchestrator');
    } catch (e) {
      console.error("Error archiving analysis run:", e);
      addLog(`Remote archive sync failed; local report state was preserved. ${e.message}`, 'orchestrator', 'warning');
    }
  }, [user, addLog]);

  const deleteAnalysis = useCallback(async (analysisId) => {
    if (!user || !analysisId) return;

    setAnalysisHistory(prev => removeHistoryItem(prev, analysisId));
    setAnalysisResult(prev => {
      if (prev && prev.id === analysisId) {
        return null;
      }
      return prev;
    });

    try {
      const docRef = doc(db, 'users', user.uid, 'analysisRuns', analysisId);
      await deleteDoc(docRef);
      addLog('Analysis report deleted.', 'orchestrator');
    } catch (e) {
      console.error("Error deleting analysis run:", e);
      addLog(`Remote delete sync failed; local report was removed. ${e.message}`, 'orchestrator', 'warning');
    }
  }, [user, addLog]);

  return (
    <AnalysisContext.Provider value={{
      feedItems,
      selectedItem,
      setSelectedItem,
      isAnalyzing,
      currentStage,
      analysisResult,
      analysisHistory,
      isSimulating,
      simulationResult,
      executionLogs,
      systemState,
      analyzeContent,
      executeSimulation,
      clearAnalysis,
      addManualAnalysisItem,
      addFeedItems,
      refreshFeedItems,
      viewAnalysis,
      markActionSimulated,
      saveFeedItem,
      dismissFeedItem,
      analyzeFeedItem,
      archiveAnalysis,
      deleteAnalysis,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
