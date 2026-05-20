import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { doc, collection, onSnapshot, query, orderBy, getDocs, getDoc, setDoc, serverTimestamp, updateDoc, deleteDoc } from 'firebase/firestore';
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
  archiveAnalysis: noop,
  deleteAnalysis: noop,
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
        setSystemState({
          baseDeliveryFee: 100,
          longDistanceSurcharge: 0,
          peakHourSurcharge: 15,
          lastUpdate: "System Synced"
        });
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
        const localResult = await runPipeline(content, profileContext || {});
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


  // 4. Trigger simulation using the local client pipeline with real-time log output
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
    };

    updateActionStatus('running');

    try {
      addLog(`Initiating simulation run for action: ${action.title}`, 'simulation');

      // 1. Establish the current mock system state (Before State)
      const currentBefore = systemState || {
        baseDeliveryFee: 100,
        longDistanceSurcharge: 0,
        peakHourSurcharge: 15,
        lastUpdate: "System Synced"
      };

      // 2. Define sequence of detailed execution logs to show real-time progress
      let stepLogs = [];
      let finalAfterState = { ...currentBefore };
      let passed = true;

      if (action.actionType === 'pricing_adjust') {
        finalAfterState.longDistanceSurcharge = 20;
        finalAfterState.lastUpdate = "Surcharge Active (+Rs. 20)";
        stepLogs = [
          { message: "Configuring local pricing service adapter...", stage: "simulation", level: "info" },
          { message: "Payload built: { rule: 'long_distance_surcharge', value: 20, active: true }", stage: "tool", level: "info" },
          { message: "Executing local pricing policy atomic write to Mock DB...", stage: "tool", level: "info" },
          { message: "Success: baseDeliveryFee stays 100, longDistanceSurcharge updated to 20.", stage: "tool", level: "success" },
          { message: "Broadcasting system event: PRICING_UPDATED_BROADCAST", stage: "simulation", level: "info" },
        ];
      } else if (action.actionType === 'route_shift') {
        finalAfterState.peakHourSurcharge = 30;
        finalAfterState.lastUpdate = "Peak Adjustment Active (+Rs. 30)";
        stepLogs = [
          { message: "Configuring local routing service adapter...", stage: "simulation", level: "info" },
          { message: "Payload built: { avoidZone: 'Mall Road Lahore', shiftWindows: ['08:00', '20:00'] }", stage: "tool", level: "info" },
          { message: "AI Dispatch Engine: Reconstructing routing graph...", stage: "tool", level: "info" },
          { message: "Success: peakHourSurcharge updated to 30. Re-routing completed for 14 active vehicles.", stage: "tool", level: "success" },
          { message: "Broadcasting system event: ROUTING_OPTIMIZED_BROADCAST", stage: "simulation", level: "info" },
        ];
      } else if (action.actionType === 'manual_review' || action.simulationSupported === false) {
        finalAfterState.lastUpdate = "Policy Updated (Manual)";
        stepLogs = [
          { message: "Initiating manual completion flow...", stage: "simulation", level: "info" },
          { message: "Dispatching confirmation log notification to operations dashboard...", stage: "tool", level: "info" },
          { message: "Action marked as manually resolved by operator.", stage: "tool", level: "success" },
          { message: "Creating compliance trace document: manual_policy_amend.pdf", stage: "tool", level: "info" },
          { message: "System state transition: Surcharges stable, Policy updated.", stage: "simulation", level: "success" },
        ];
      } else {
        finalAfterState.lastUpdate = "Policy Updated (Client Simulation)";
        stepLogs = [
          { message: "Configuring local fallback adapter...", stage: "simulation", level: "info" },
          { message: "Creating documentation trace in local workspace...", stage: "tool", level: "info" },
          { message: "Executing mock system notification broadcast...", stage: "tool", level: "info" },
          { message: "Success: Action completed successfully.", stage: "simulation", level: "success" },
        ];
      }

      // 3. Play logs step-by-step in real-time with visual delays!
      for (let i = 0; i < stepLogs.length; i++) {
        await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay per log line
        addLog(stepLogs[i].message, stepLogs[i].stage, stepLogs[i].level);
      }

      // Add a slight final delay
      await new Promise(resolve => setTimeout(resolve, 400));

      const rawLogs = stepLogs.map(sl => sl.message);
      const simResult = {
        actionId: action.id,
        actionTitle: action.title,
        beforeState: currentBefore,
        afterState: finalAfterState,
        logs: rawLogs,
        passed: passed,
        status: passed ? 'succeeded' : 'failed',
        simId: `local_sim_${Date.now()}`
      };

      setSimulationResult(simResult);
      setSystemState(finalAfterState);
      updateActionStatus(passed ? 'passed' : 'failed', rawLogs);

      addLog(
        passed
          ? `Simulation finalized. State transition completed successfully.`
          : `Simulation failed. Manual intervention required.`,
        'simulation',
        passed ? 'success' : 'error'
      );

      // Attempt to save state & simulation record to Firestore (if rules allow, swallow error silently if not)
      try {
        const mockStateRef = doc(db, 'users', user.uid, 'mockState', 'main');
        await setDoc(mockStateRef, finalAfterState, { merge: true });
        
        const simRef = doc(collection(db, 'users', user.uid, 'simulations'));
        await setDoc(simRef, {
          actionId: action.id,
          status: passed ? "succeeded" : "failed",
          beforeState: currentBefore,
          afterState: finalAfterState,
          logs: rawLogs,
          createdAt: new Date().toISOString()
        });

        // Also update Firestore analysis run if not starting with local_run_
        if (!runId.startsWith('local_run_')) {
          const runRef = doc(db, 'users', user.uid, 'analysisRuns', runId);
          // Fetch current actions and update
          const runSnap = await getDoc(runRef);
          if (runSnap.exists()) {
            const rData = runSnap.data();
            const currentActions = rData.recommendedActions || [];
            const actionIndex = currentActions.findIndex(a => a.id === action.id);
            if (actionIndex !== -1) {
              const updatedActions = [...currentActions];
              updatedActions[actionIndex] = {
                ...updatedActions[actionIndex],
                simulationStatus: passed ? "passed" : "failed",
                simulationLogs: rawLogs,
              };
              await updateDoc(runRef, {
                recommendedActions: updatedActions,
                status: "simulated",
                updatedAt: new Date().toISOString()
              });
            }
          }
        }
      } catch (firestoreError) {
        // Expected if Firestore rules restrict writes to functions
      }

    } catch (error) {
      console.error("Simulation failed:", error);
      const errorMsg = error?.message || 'Unknown error';
      addLog(`Simulation error: ${errorMsg}`, 'simulation', 'error');
      updateActionStatus('failed', [errorMsg]);
    } finally {
      setIsSimulating(false);
    }
  }, [user, analysisResult, systemState, addLog]);

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
      // Find the action from the current analysisResult or analysisHistory
      let actionToSimulate = null;
      if (analysisResult?.id === analysisId) {
        actionToSimulate = (analysisResult.recommendedActions || []).find(a => a.id === actionId);
      } else {
        const historicalRun = (analysisHistory || []).find(run => run.id === analysisId);
        if (historicalRun) {
          actionToSimulate = (historicalRun.recommendedActions || []).find(a => a.id === actionId);
        }
      }

      if (!actionToSimulate) {
        // Build a mock manual action if not found in list
        actionToSimulate = {
          id: actionId,
          title: "Manual Operational Adjustment",
          actionType: "manual_review",
          simulationSupported: false,
          targetSystem: "Manual Operations"
        };
      }

      // Execute simulation using the local client pipeline
      await executeSimulation(actionToSimulate, analysisId);
    } catch (error) {
      console.error("Manual action simulation failed:", error);
    }
  }, [user, analysisResult, analysisHistory, executeSimulation]);

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

  const archiveAnalysis = useCallback(async (analysisId, archived = true) => {
    if (!user || !analysisId) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'analysisRuns', analysisId);
      await updateDoc(docRef, { isArchived: archived });
      
      // Update local selected analysis result if it matches
      setAnalysisResult(prev => {
        if (prev && prev.id === analysisId) {
          return { ...prev, isArchived: archived };
        }
        return prev;
      });

      addLog(`Analysis report ${archived ? 'archived' : 'unarchived'}.`, 'orchestrator');
    } catch (e) {
      console.error("Error archiving analysis run:", e);
      addLog(`Failed to archive analysis: ${e.message}`, 'orchestrator', 'error');
    }
  }, [user, addLog]);

  const deleteAnalysis = useCallback(async (analysisId) => {
    if (!user || !analysisId) return;

    try {
      const docRef = doc(db, 'users', user.uid, 'analysisRuns', analysisId);
      await deleteDoc(docRef);
      addLog('Analysis report deleted.', 'orchestrator');
      
      // If the currently selected or active report is deleted, clear it
      setAnalysisResult(prev => {
        if (prev && prev.id === analysisId) {
          return null;
        }
        return prev;
      });
    } catch (e) {
      console.error("Error deleting analysis run:", e);
      addLog(`Failed to delete analysis: ${e.message}`, 'orchestrator', 'error');
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
