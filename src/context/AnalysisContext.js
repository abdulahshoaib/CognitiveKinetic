import React, { createContext, useState, useContext, useCallback } from 'react';
import { runPipeline } from '../services/agent/orchestrator';
import { usePreferences } from './PreferencesContext';

const noop = () => {};

const AnalysisContext = createContext({
  feedItems: [],
  selectedItem: null,
  setSelectedItem: noop,
  isAnalyzing: false,
  currentStage: 'idle',
  analysisResult: null,
  isSimulating: false,
  simulationResult: null,
  executionLogs: [],
  systemState: null,
  analyzeContent: noop,
  executeSimulation: noop,
  clearAnalysis: noop,
  addManualAnalysisItem: noop
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
  const [feedItems, setFeedItems] = useState(defaultFeedItems);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStage, setCurrentStage] = useState('idle'); // idle, loading_profile, ingesting, signals, relevance, insights, impact, actions, completed
  const [analysisResult, setAnalysisResult] = useState(null);
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

  const analyzeContent = useCallback(async (content, profileContext, sourceItemId = null) => {
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
      
      setAnalysisResult(result);
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

  const executeSimulation = useCallback(async (action) => {
    if (!action) return;
    setIsSimulating(true);
    setSimulationResult(null);
    try {
      addLog(`Initiating simulation run for action: ${action.title}`, 'simulation');
      
      const delayMs = preferences.motion === 'minimal' ? 0 : preferences.motion === 'reduced' ? 250 : 600;
      const delay = (multiplier = 1) => new Promise(res => setTimeout(res, delayMs * multiplier));
      await delay();
      
      addLog(`Reading base configuration values...`, 'simulation');
      const beforeState = { ...systemState };
      await delay();
      
      addLog(`Simulating API call / DB update to configure target: ${action.targetSystem}`, 'simulation');
      await delay(1.3);
      
      let afterState = { ...beforeState };
      let logs = [];
      
      if (action.actionType === 'pricing_adjust') {
        afterState.longDistanceSurcharge = 20;
        afterState.lastUpdate = 'Surcharge Active (+Rs. 20)';
        logs = [
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
          'API Request: POST /api/v1/routes/optimizer',
          'Payload: { avoidZone: "Mall Road Lahore", shiftWindows: ["08:00", "20:00"] }',
          'Response Status: 200 OK',
          'AI Dispatch Engine: Routing graph reconstructed to re-route 14 vehicles.',
          'Surcharge updated: Peak hour buffer raised to Rs. 30'
        ];
      } else {
        afterState.lastUpdate = 'Policy Updated (Manual)';
        logs = [
          'Notification Service: Dispatched urgent alert to operations team.',
          'Document Repository: Created policy amendment report.',
          'Task Queue: Added manual review task for account managers.'
        ];
      }
      
      setSystemState(afterState);
      logs.forEach(logLine => addLog(logLine, 'tool', 'info'));
      
      setSimulationResult({
        actionId: action.id,
        actionTitle: action.title,
        beforeState,
        afterState,
        logs
      });
      
      addLog(`Simulation finalized. State transition completed successfully.`, 'simulation', 'success');
    } finally {
      setIsSimulating(false);
    }
  }, [systemState, addLog, preferences.motion]);

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
      timestamp: 'Just now',
      relevanceStatus: 'pending',
      detectedTopics: ['Manual Parse']
    };
    setFeedItems(prev => [newItem, ...prev]);
    return newItem;
  }, []);

  return (
    <AnalysisContext.Provider value={{
      feedItems,
      selectedItem,
      setSelectedItem,
      isAnalyzing,
      currentStage,
      analysisResult,
      isSimulating,
      simulationResult,
      executionLogs,
      systemState,
      analyzeContent,
      executeSimulation,
      clearAnalysis,
      addManualAnalysisItem
    }}>
      {children}
    </AnalysisContext.Provider>
  );
};

export const useAnalysis = () => useContext(AnalysisContext);
