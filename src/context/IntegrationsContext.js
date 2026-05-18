import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const STORAGE_KEY = '@cognitive_kinetic_integrations_';

export const DEFAULT_NEWS_PROMPT =
  'You are a news collection agent. Gather news relevant to fuel prices, transport and logistics regulation, trade disruptions, supply chain delays, and tax policy changes affecting commercial operations. Prioritize breaking alerts and policy changes over general market commentary.';

const defaultIntegrations = {
  actionApis: [
    {
      id: 'demo_pricing_api',
      name: 'Mock Pricing API',
      baseUrl: 'https://api.example.com/pricing',
      docsMode: 'text',
      docsText: 'POST /pricing-rules updates delivery fee rules. Body: { rule, value, active }.',
      docsDocument: null,
      authType: 'none',
      headerName: '',
      token: '',
      actionTypes: ['pricing_adjust'],
      enabled: true,
    },
  ],
  newsAggregators: [
    {
      id: 'google_news_default',
      name: 'Google News Logistics',
      type: 'google_news',
      sourceUrl: 'https://news.google.com/rss/search?q=fuel+logistics+pakistan',
      apiKey: '',
      keywords: ['fuel', 'logistics', 'tax'],
      enabled: true,
    },
  ],
  newsSystemPrompt: DEFAULT_NEWS_PROMPT,
};

const noop = () => {};

const defaultSyncLogs = [
  {
    id: 'log_1',
    timestamp: 'Just now',
    type: 'pull',
    sourceName: 'NewsAPI Logistics',
    status: 'failed',
    errorType: 'API Key Missing',
    message: 'Request rejected with status 401 Unauthorized.',
    reason: 'NewsAPI requires a valid, registered developer key. By default, the app uses an empty token. To fix this, obtain a key from newsapi.org and paste it in Profile Settings > News Sources.',
  },
  {
    id: 'log_2',
    timestamp: '10 mins ago',
    type: 'pull',
    sourceName: 'Reddit Logistics RSS',
    status: 'failed',
    errorType: 'Rate Limited (429)',
    message: 'HTTP response code: 429 Too Many Requests.',
    reason: 'Reddit RSS feeds throttle anonymous automated scrapers during peak times. The connection was temporarily blocked to prevent IP banning. Wait 15 minutes or configure OAuth credentials.',
  },
  {
    id: 'log_3',
    timestamp: '25 mins ago',
    type: 'pull',
    sourceName: 'Google News Logistics',
    status: 'success',
    message: 'HTTP 200 OK. Ingested 3 feed signals successfully.',
    reason: 'Google News RSS endpoint parsed without credentials. Data normalized and checked for profile relevance.',
  },
  {
    id: 'log_4',
    timestamp: '1 hour ago',
    type: 'api',
    sourceName: 'Mock Pricing API',
    status: 'failed',
    errorType: 'Authentication Error (401)',
    message: 'POST /pricing returned 401 Unauthorized.',
    reason: 'The action API attempted to modify mock base pricing but did not provide a custom authorization header. Please go to Profile > Settings > API Connectors and input your authentication details.',
  }
];

const IntegrationsContext = createContext({
  actionApis: [],
  newsAggregators: [],
  newsSystemPrompt: DEFAULT_NEWS_PROMPT,
  syncLogs: [],
  addActionApi: noop,
  updateActionApi: noop,
  removeActionApi: noop,
  addNewsAggregator: noop,
  updateNewsAggregator: noop,
  removeNewsAggregator: noop,
  setNewsAggregators: noop,
  updateNewsSystemPrompt: noop,
  addSyncLog: noop,
  clearSyncLogs: noop,
});

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function IntegrationsProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(defaultIntegrations);
  const [syncLogs, setSyncLogs] = useState(defaultSyncLogs);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (!user?.uid) {
        setState(defaultIntegrations);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(`${STORAGE_KEY}${user.uid}`);
        if (!mounted) return;
        if (!stored) {
          setState(defaultIntegrations);
          return;
        }
        const parsed = JSON.parse(stored);
        setState({
          actionApis: Array.isArray(parsed.actionApis) ? parsed.actionApis : defaultIntegrations.actionApis,
          newsAggregators: Array.isArray(parsed.newsAggregators) ? parsed.newsAggregators : defaultIntegrations.newsAggregators,
          newsSystemPrompt: parsed.newsSystemPrompt || DEFAULT_NEWS_PROMPT,
        });
      } catch (error) {
        console.warn('Unable to load integration settings:', error);
        setState(defaultIntegrations);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [user?.uid]);

  const persist = useCallback(async (nextState) => {
    setState(nextState);
    if (!user?.uid) return;
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY}${user.uid}`, JSON.stringify(nextState));
    } catch (error) {
      console.warn('Unable to save integration settings:', error);
    }
  }, [user?.uid]);

  const addActionApi = useCallback((api) => {
    persist({
      ...state,
      actionApis: [{ ...api, id: createId('api') }, ...state.actionApis],
    });
  }, [persist, state]);

  const updateActionApi = useCallback((id, updates) => {
    persist({
      ...state,
      actionApis: state.actionApis.map(api => api.id === id ? { ...api, ...updates } : api),
    });
  }, [persist, state]);

  const removeActionApi = useCallback((id) => {
    persist({
      ...state,
      actionApis: state.actionApis.filter(api => api.id !== id),
    });
  }, [persist, state]);

  const addNewsAggregator = useCallback((source) => {
    persist({
      ...state,
      newsAggregators: [{ ...source, id: createId('news') }, ...state.newsAggregators],
    });
  }, [persist, state]);

  const updateNewsAggregator = useCallback((id, updates) => {
    persist({
      ...state,
      newsAggregators: state.newsAggregators.map(source => source.id === id ? { ...source, ...updates } : source),
    });
  }, [persist, state]);

  const removeNewsAggregator = useCallback((id) => {
    persist({
      ...state,
      newsAggregators: state.newsAggregators.filter(source => source.id !== id),
    });
  }, [persist, state]);

  const setNewsAggregators = useCallback((sources) => {
    persist({
      ...state,
      newsAggregators: sources.map(source => ({
        ...source,
        id: source.id || createId('news'),
      })),
    });
  }, [persist, state]);

  const updateNewsSystemPrompt = useCallback((newsSystemPrompt) => {
    persist({ ...state, newsSystemPrompt });
  }, [persist, state]);

  const addSyncLog = useCallback((log) => {
    setSyncLogs(prev => [{ ...log, id: createId('log'), timestamp: 'Just now' }, ...prev]);
  }, []);

  const clearSyncLogs = useCallback(() => {
    setSyncLogs([]);
  }, []);

  const value = useMemo(() => ({
    actionApis: state.actionApis,
    newsAggregators: state.newsAggregators,
    newsSystemPrompt: state.newsSystemPrompt,
    syncLogs,
    addActionApi,
    updateActionApi,
    removeActionApi,
    addNewsAggregator,
    updateNewsAggregator,
    removeNewsAggregator,
    setNewsAggregators,
    updateNewsSystemPrompt,
    addSyncLog,
    clearSyncLogs,
  }), [
    addActionApi,
    addNewsAggregator,
    removeActionApi,
    removeNewsAggregator,
    setNewsAggregators,
    state,
    updateActionApi,
    updateNewsAggregator,
    updateNewsSystemPrompt,
    syncLogs,
    addSyncLog,
    clearSyncLogs,
  ]);

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export const useIntegrations = () => useContext(IntegrationsContext);
