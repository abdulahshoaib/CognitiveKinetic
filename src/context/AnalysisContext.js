import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { doc, collection, onSnapshot, query, orderBy, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../services/firebase';
import { runPipeline } from '../services/agent/orchestrator';
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
import {
  buildFeedItemContent,
  buildLocalLogEntry,
  getRunFeedStatus,
  normalizeAnalysisRun,
  normalizeAnalysisRunSnapshot,
  normalizeLogSnapshot,
  normalizeSimulationResult,
  updateActionStatusInResult,
} from '../utils/analysisContextUtils';

const noop = () => {};

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
});

export const AnalysisProvider = ({ children }) => {
  const { user } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState('idle'); // idle, loading_profile, ingesting, signals, relevance, insights, impact, actions, completed
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);
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

  // 0. Sync user-scoped feedItems in real-time with Firestore.
  useEffect(() => {
    if (!user) {
      setFeedItems([]);
      return;
    }

    return listenUserFeedItems(user.uid, setFeedItems, (err) => {
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
        setSystemState(null);
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
      setAnalysisHistory(normalizeAnalysisRunSnapshot(snap));
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

    // Start watchdog immediately — 20 seconds max for the entire pipeline (including backend Callable and Firestore updates)
    watchdogRef.timer = setTimeout(() => {
      console.warn('Analysis watchdog: pipeline did not complete in 20s');
      addLog('Pipeline timed out. Execution exceeded 20 seconds.', 'orchestrator', 'error');
      setIsAnalyzing(false);
      setCurrentStage('error');
      cleanupActiveRun();
    }, 20000);

    try {
      addLog('Initiating backend content-to-action analysis pipeline...', 'orchestrator');

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


  // 4. Trigger simulation using the real backend Callable Function
  const executeSimulation = useCallback(async (action, analysisId = null) => {
    if (!action || !user) return;
    const runId = analysisId || analysisResult?.id;
    if (!runId) {
      addLog('Simulation error: analysis run id is missing.', 'simulation', 'error');
      return;
    }

    setIsSimulating(true);
    setSimulationResult(null);

    const updateActionStatus = (status, logs = null) => {
      setAnalysisResult(prev =>
        prev?.id === runId ? updateActionStatusInResult(prev, action.id, status, logs) : prev
      );
    };

    updateActionStatus('running');

    try {
      addLog(`Initiating simulation run for action: ${action.title}`, 'simulation');

      const simulateActionCallable = httpsCallable(functions, 'simulateAction');
      const res = await simulateActionCallable({
        runId,
        actionId: action.id
      });

      const simResult = normalizeSimulationResult(action, res.data || {});
      const { logs, passed } = simResult;

      // Update client logs terminal
      logs.forEach(logLine => addLog(logLine, 'tool', 'info'));

      setSimulationResult(simResult);
      updateActionStatus(passed ? 'passed' : 'failed', logs);

      addLog(
        passed
          ? `Simulation finalized. State transition completed successfully.`
          : `Simulation failed. Manual intervention required.`,
        'simulation',
        passed ? 'success' : 'error'
      );

    } catch (error) {
      console.error("Simulation failed:", error);
      const errorMsg = error?.message || 'Unknown error';
      const errorCode = error?.code || 'unknown';
      const detailedError = `[${errorCode}] ${errorMsg}`;
      
      addLog(`Simulation error: ${detailedError}`, 'simulation', 'error');
      
      // Provide specific guidance based on error type
      if (errorCode === 'permission-denied') {
        addLog('Permission denied: Verify user authentication and Firestore rules.', 'simulation', 'error');
      } else if (errorCode === 'not-found') {
        addLog('Analysis run or action not found: Run may have expired.', 'simulation', 'error');
      } else if (errorCode === 'unauthenticated') {
        addLog('Authentication required: Please log in again.', 'simulation', 'error');
      }
      
      updateActionStatus('failed', [detailedError]);
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
      return null;
    }
  }, [user]);

  const addFeedItems = useCallback(async (items) => {
    if (!user) return;
    try {
      await addUserFeedItems(user.uid, items);
    } catch (e) {
      console.error("Error adding feed items:", e);
    }
  }, [user]);

  const refreshFeedItems = useCallback(async () => {
    if (!user) return { status: 'empty', items: [], syncLogs: [] };

    try {
      return await refreshUserFeed();
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
      const simulateActionCallable = httpsCallable(functions, 'simulateAction');
      await simulateActionCallable({runId: analysisId, actionId});
    } catch (error) {
      console.error("Simulation status update failed:", error);
      addLog(`Simulation status update failed: ${error.message}`, 'simulation', 'error');
    }
  }, [user, addLog]);

  const saveFeedItem = useCallback(async (feedItemId, saved = true) => {
    if (!user) return;
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
    try {
      await dismissUserFeedItem(user.uid, feedItemId);
      addLog(`Feed item dismissed and deleted.`, 'feed');
    } catch (e) {
      console.error("Error dismissing feed item:", e);
      addLog(`Failed to dismiss feed item: ${e.message}`, 'feed', 'error');
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

      await updateFeedItemStatus(user.uid, feedItemId, 'analyzing');

      await analyzeContent(content, null, feedItemId, item);

      await updateFeedItemStatus(user.uid, feedItemId, 'analyzed');

      addLog(`Feed item analysis complete.`, 'feed');
    } catch (e) {
      console.error("Error analyzing feed item:", e);
      addLog(`Failed to analyze feed item: ${e.message}`, 'feed', 'error');

      try {
        await updateFeedItemStatus(user.uid, feedItemId, 'unread');
      } catch (innerErr) {
        console.error("Error resetting feed item status:", innerErr);
      }
    }
  }, [user, feedItems, analyzeContent, addLog]);

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
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
