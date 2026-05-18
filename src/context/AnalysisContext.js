import React, { createContext, useState, useContext, useCallback } from 'react';
import { runPipeline } from '../services/agent/orchestrator';
import { useIntegrations } from './IntegrationsContext';
import { usePreferences } from './PreferencesContext';
import { buildReportTitle } from '../utils/reportTitles';

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
  viewAnalysis: noop,
  markActionSimulated: noop,
});

const defaultFeedItems = [
  {
    id: 'feed_1',
    sourceType: 'news',
    sourceName: 'National Petroleum Review',
    title: 'Fuel prices increased by 12% effective immediately',
    body: 'The Ministry of Energy has announced a sudden 12% hike in base fuel and diesel prices, effective midnight. The adjustment is attributed to global crude price spikes and fluctuations in import tariffs. Transportation networks and heavy haulers are advised to brace for severe operational margin pressures.',
    timestamp: '15 mins ago',
    relevanceStatus: 'pending',
    detectedTopics: ['Fuel Costs', 'Logistics', 'Operational Costs']
  },
  {
    id: 'feed_2',
    sourceType: 'alert',
    sourceName: 'Lahore Traffic Authority',
    title: 'Commercial vehicle restrictions on Mall Road Lahore',
    body: 'Effective tomorrow, heavy cargo vehicles and commercial delivery vans will face strict access hours on Mall Road and central Lahore areas due to environmental smog control measures. Operations restricted between 8:00 AM and 8:00 PM.',
    timestamp: '2 hours ago',
    relevanceStatus: 'pending',
    detectedTopics: ['Lahore Operations', 'Regulatory Constraints']
  },
  {
    id: 'feed_3',
    sourceType: 'sports',
    sourceName: 'CricBuzz Pakistan',
    title: 'Lahore Qalandars announce new training campus in Karachi',
    body: 'The Lahore Qalandars franchise has unveiled state-of-the-art practice facilities in Karachi to groom local talent ahead of the upcoming PSL season. Selected training sessions will be open to the public.',
    timestamp: '4 hours ago',
    relevanceStatus: 'pending',
    detectedTopics: ['Cricket', 'Local Events']
  },
  {
    id: 'feed_4',
    sourceType: 'entertainment',
    sourceName: 'Showbiz Herald',
    title: 'International Film Festival returns to Islamabad',
    body: 'The annual cultural arts and movie gala is set to take place at the national auditorium in Islamabad next month, showcasing over 40 award-winning independent films from across Asia.',
    timestamp: '1 day ago',
    relevanceStatus: 'pending',
    detectedTopics: ['Culture', 'Social Events']
  }
];

export const AnalysisProvider = ({ children }) => {
  const { preferences } = usePreferences();
  const { actionApis } = useIntegrations();
  const [feedItems, setFeedItems] = useState(defaultFeedItems);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState('idle'); // idle, loading_profile, ingesting, signals, relevance, insights, impact, actions, completed
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [executionLogs, setExecutionLogs] = useState([]);

  // Custom mock state representing system settings that simulations will modify
  const [systemState, setSystemState] = useState({
    baseDeliveryFee: 100,
    longDistanceSurcharge: 0,
    peakHourSurcharge: 15,
    lastUpdate: 'System Synced'
  });

  const addLog = useCallback((message, stage = 'system', level = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setExecutionLogs((prev) => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: `[${timestamp}]`,
      stage,
      message,
      level
    }]);
  }, []);

  const analyzeContent = useCallback(async (content, profileContext, sourceItemId = null, sourceItem = null) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    setSimulationResult(null);
    setExecutionLogs([]);

    const delayMs = preferences.motion === 'minimal' ? 0 : preferences.motion === 'reduced' ? 300 : 800;
    const delay = () => new Promise(res => setTimeout(res, delayMs));

    // Stage 1: Load saved profile
    setCurrentStage('loading_profile');
    addLog(`Loading active business profile context for '${profileContext?.businessName || 'Apex Logistics'}'`, 'profile');
    await delay();

    // Stage 2: Ingestion
    setCurrentStage('ingesting');
    addLog(`Ingesting new content block. Size: ${content.length} characters.`, 'ingestion');
    await delay();

    // Stage 3: Extract signals
    setCurrentStage('signals');
    addLog('Extracting entities, numeric values, and keywords...', 'signals');
    await delay();

    // Stage 4: Check relevance
    setCurrentStage('relevance');
    addLog('Running multi-factor semantic alignment check against active profile...', 'relevance');
    await delay();

    // Stage 5: Insights
    setCurrentStage('insights');
    addLog('Formulating operational insights and risk priorities...', 'insights');
    await delay();

    // Stage 6: Impact
    setCurrentStage('impact');
    addLog('Modeling financial, structural, and regulatory impacts...', 'impact');
    await delay();

    // Stage 7: Actions
    setCurrentStage('actions');
    addLog('Compiling recommended actions and decision parameters...', 'actions');
    await delay();

    // Call orchestrator pipeline to build the actual structured results
    try {
      const result = await runPipeline(content, profileContext);

      // Update feed item relevance status in the feed list if it matches an existing item ID
      const itemIdToUpdate = sourceItemId || result.feedItemId;
      if (itemIdToUpdate) {
        setFeedItems(prev => prev.map(item =>
          item.id === itemIdToUpdate
            ? {
                ...item,
                relevanceStatus: result.relevanceScore >= 75 ? 'high-impact' : result.relevanceScore > 40 ? 'relevant' : 'ignored'
              }
            : item
        ));
      }

      // Add simulation status tracking to each recommended action
      const sourceSnapshot = sourceItem ? {
        id: sourceItem.id || sourceItemId || null,
        sourceType: sourceItem.sourceType || 'content',
        sourceName: sourceItem.sourceName || 'Analyzed Content',
        title: sourceItem.title || buildReportTitle(content, result),
        body: sourceItem.body || content,
        timestamp: sourceItem.timestamp || null,
        url: sourceItem.url || sourceItem.sourceUrl || '',
        sourceUrl: sourceItem.sourceUrl || sourceItem.url || '',
        detectedTopics: Array.isArray(sourceItem.detectedTopics) ? sourceItem.detectedTopics : [],
      } : null;

      const enrichedResult = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        analyzedAt: new Date().toISOString(),
        reportTitle: buildReportTitle(content, result),
        sourceContent: content.substring(0, 200),
        sourceItem: sourceSnapshot,
        sourceItemId: sourceItemId || sourceSnapshot?.id || null,
        sourceTitle: sourceSnapshot?.title || buildReportTitle(content, result),
        sourceName: sourceSnapshot?.sourceName || (sourceItemId ? 'News Source' : 'Manual Input'),
        sourceUrl: sourceSnapshot?.url || '',
        sourceBody: sourceSnapshot?.body || content,
        sourceTimestamp: sourceSnapshot?.timestamp || null,
        sourceTopics: sourceSnapshot?.detectedTopics || [],
        recommendedActions: (result.recommendedActions || []).map(action => ({
          ...action,
          simulationStatus: 'pending', // pending | running | passed | failed
          simulationLogs: null,
        })),
      };

      setAnalysisResult(enrichedResult);

      // Add to history
      setAnalysisHistory(prev => [enrichedResult, ...prev]);

      result.traceLogs.forEach(log => {
        addLog(log.message, log.stage, log.level);
      });

      setCurrentStage('completed');
      addLog('Agent pipeline run completed successfully. Awaiting operator decisions.', 'orchestrator', 'success');
    } catch (error) {
      console.error('Pipeline failed:', error);
      addLog(`Pipeline execution halted: ${error.message}`, 'orchestrator', 'error');
      setCurrentStage('idle');
    } finally {
      setIsAnalyzing(false);
    }
  }, [addLog, preferences.motion]);

  const executeSimulation = useCallback(async (action, analysisId = null) => {
    if (!action) return;
    setIsSimulating(true);
    setSimulationResult(null);

    // Mark action as running in both current result and history
    const updateActionStatus = (status, logs = null) => {
      const updater = (result) => {
        if (!result) return result;
        return {
          ...result,
          recommendedActions: (result.recommendedActions || []).map(a =>
            a.id === action.id ? { ...a, simulationStatus: status, simulationLogs: logs } : a
          ),
        };
      };
      setAnalysisResult(prev => updater(prev));
      setAnalysisHistory(prev => prev.map(h =>
        (analysisId ? h.id === analysisId : true) ? updater(h) : h
      ));
    };

    updateActionStatus('running');

    try {
      addLog(`Initiating simulation run for action: ${action.title}`, 'simulation');
      const configuredApi = actionApis.find(api =>
        api.enabled !== false &&
        (api.actionTypes || []).some(type => type === action.actionType || type === 'custom')
      );

      const delayMs = preferences.motion === 'minimal' ? 0 : preferences.motion === 'reduced' ? 250 : 600;
      const delay = (multiplier = 1) => new Promise(res => setTimeout(res, delayMs * multiplier));
      await delay();

      addLog(`Reading base configuration values...`, 'simulation');
      if (configuredApi) {
        addLog(`Configured API available: ${configuredApi.name} (${configuredApi.baseUrl})`, 'simulation');
      }
      const beforeState = { ...systemState };
      await delay();

      addLog(`Simulating API call / DB update to configure target: ${action.targetSystem}`, 'simulation');
      await delay(1.3);

      let afterState = { ...beforeState };
      let logs = [];
      let passed = true;

      if (action.actionType === 'pricing_adjust') {
        afterState.longDistanceSurcharge = 20;
        afterState.lastUpdate = 'Surcharge Active (+Rs. 20)';
        logs = [
          configuredApi ? `Configured API selected: ${configuredApi.name}` : 'Configured API selected: mock pricing service',
          'API Request: POST /api/v1/config/pricing-rules',
          'Payload: { rule: "long_distance_surcharge", value: 20, active: true }',
          'Response Status: 200 OK',
          'Database Write: Table [PricingRules] updated row [long_distance] with value [20]',
          'System event triggered: PRICING_UPDATED_BROADCAST'
        ];
      } else if (action.actionType === 'route_shift') {
        afterState.peakHourSurcharge = 30;
        afterState.lastUpdate = 'Peak Adjustment Active (+Rs. 30)';
        logs = [
          configuredApi ? `Configured API selected: ${configuredApi.name}` : 'Configured API selected: mock routing service',
          'API Request: POST /api/v1/routes/optimizer',
          'Payload: { avoidZone: "Mall Road Lahore", shiftWindows: ["08:00", "20:00"] }',
          'Response Status: 200 OK',
          'AI Dispatch Engine: Routing graph reconstructed to re-route 14 vehicles.',
          'Surcharge updated: Peak hour buffer raised to Rs. 30'
        ];
      } else if (action.actionType === 'manual_review') {
        // Manual actions "fail" simulation — need manual execution
        passed = false;
        logs = [
          'Simulation attempted for manual action type.',
          'Result: Cannot auto-execute — requires human operator intervention.',
          'Recommended: Execute this action manually through operations dashboard.',
        ];
      } else {
        afterState.lastUpdate = 'Policy Updated (Manual)';
        logs = [
          configuredApi ? `Configured API selected: ${configuredApi.name}` : 'Configured API selected: mock workflow service',
          'Notification Service: Dispatched urgent alert to operations team.',
          'Document Repository: Created policy amendment report.',
          'Task Queue: Added manual review task for account managers.'
        ];
      }

      if (passed) {
        setSystemState(afterState);
      }
      logs.forEach(logLine => addLog(logLine, 'tool', 'info'));

      const simResult = {
        actionId: action.id,
        actionTitle: action.title,
        beforeState,
        afterState: passed ? afterState : beforeState,
        logs,
        passed,
      };

      setSimulationResult(simResult);
      updateActionStatus(passed ? 'passed' : 'failed', logs);

      addLog(
        passed
          ? `Simulation finalized. State transition completed successfully.`
          : `Simulation failed. Manual intervention required.`,
        'simulation',
        passed ? 'success' : 'error'
      );
    } finally {
      setIsSimulating(false);
    }
  }, [actionApis, systemState, addLog, preferences.motion]);

  const clearAnalysis = useCallback(() => {
    setAnalysisResult(null);
    setIsSimulating(false);
    setSimulationResult(null);
    setExecutionLogs([]);
    setCurrentStage('idle');
    setSelectedItem(null);
  }, []);

  const addManualAnalysisItem = useCallback((title, body) => {
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      sourceType: 'manual',
      sourceName: 'Manual Input',
      title,
      body,
      url: '',
      sourceUrl: '',
      timestamp: 'Just now',
      relevanceStatus: 'pending',
      detectedTopics: ['Manual Parse']
    };
    setFeedItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  // Load a specific analysis from history into current view
  const viewAnalysis = useCallback((analysis) => {
    setAnalysisResult(analysis);
  }, []);

  // Mark an action as simulated in a specific analysis history entry
  const markActionSimulated = useCallback((analysisId, actionId, status, logs) => {
    const updater = (result) => {
      if (!result) return result;
      return {
        ...result,
        recommendedActions: (result.recommendedActions || []).map(a =>
          a.id === actionId ? { ...a, simulationStatus: status, simulationLogs: logs } : a
        ),
      };
    };
    setAnalysisResult(prev => prev?.id === analysisId ? updater(prev) : prev);
    setAnalysisHistory(prev => prev.map(h => h.id === analysisId ? updater(h) : h));
  }, []);

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
      viewAnalysis,
      markActionSimulated,
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
