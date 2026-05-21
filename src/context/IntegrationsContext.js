import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import {
  listenActionApiSettings,
  listenNewsFeedSettings,
  saveActionApiSettings,
  saveNewsFeedSettings,
} from '../services/feedService';

const STORAGE_KEY = '@relay_integrations_';
const LOGS_STORAGE_KEY = '@relay_integration_logs_';

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
      name: 'Google News',
      type: 'google_news',
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
    sourceName: 'Custom RSS',
    status: 'failed',
    errorType: 'Feed Unreachable',
    message: 'RSS endpoint returned an invalid response.',
    reason: 'Custom RSS sources must expose a valid RSS or Atom feed. The agent will skip failed sources and only show selected relevant items from successful sources.',
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
    let unsubscribeSettings = null;
    let unsubscribeApiSettings = null;

    const load = async () => {
      if (!user?.uid) {
        setState(defaultIntegrations);
        setSyncLogs(defaultSyncLogs);
        return;
      }

      try {
        const stored = await AsyncStorage.getItem(`${STORAGE_KEY}${user.uid}`);
        if (!mounted) return;
        if (!stored) {
          setState(defaultIntegrations);
        } else {
          const parsed = JSON.parse(stored);
          setState({
            actionApis: Array.isArray(parsed.actionApis) ? parsed.actionApis : defaultIntegrations.actionApis,
            newsAggregators: Array.isArray(parsed.newsAggregators) ? parsed.newsAggregators : defaultIntegrations.newsAggregators,
            newsSystemPrompt: parsed.newsSystemPrompt || DEFAULT_NEWS_PROMPT,
          });
        }

        const storedLogs = await AsyncStorage.getItem(`${LOGS_STORAGE_KEY}${user.uid}`);
        if (!mounted) return;
        setSyncLogs(storedLogs ? JSON.parse(storedLogs) : defaultSyncLogs);
      } catch (error) {
        console.warn('Unable to load integration settings:', error);
        setState(defaultIntegrations);
        setSyncLogs(defaultSyncLogs);
      }

      unsubscribeSettings = listenNewsFeedSettings(user.uid, async (settings) => {
        if (!mounted || !settings) return;
        setState(prev => {
          const nextState = {
            ...prev,
            newsAggregators: Array.isArray(settings.sources) ? settings.sources : prev.newsAggregators,
            newsSystemPrompt: settings.systemPrompt || prev.newsSystemPrompt || DEFAULT_NEWS_PROMPT,
          };
          AsyncStorage.setItem(`${STORAGE_KEY}${user.uid}`, JSON.stringify(nextState)).catch((error) => {
            console.warn('Unable to mirror news feed settings locally:', error);
          });
          return nextState;
        });
      }, (error) => {
        console.warn('Unable to listen for news feed settings:', error);
      });

      unsubscribeApiSettings = listenActionApiSettings(user.uid, async (settings) => {
        if (!mounted || !settings) return;
        setState(prev => {
          const nextState = {
            ...prev,
            actionApis: Array.isArray(settings.apis) ? settings.apis : prev.actionApis,
          };
          AsyncStorage.setItem(`${STORAGE_KEY}${user.uid}`, JSON.stringify(nextState)).catch((error) => {
            console.warn('Unable to mirror action API settings locally:', error);
          });
          return nextState;
        });
      }, (error) => {
        console.warn('Unable to listen for action API settings:', error);
      });
    };

    load();

    return () => {
      mounted = false;
      if (unsubscribeSettings) unsubscribeSettings();
      if (unsubscribeApiSettings) unsubscribeApiSettings();
    };
  }, [user?.uid]);

  const persist = useCallback(async (nextState) => {
    setState(nextState);
    if (!user?.uid) return;
    try {
      await AsyncStorage.setItem(`${STORAGE_KEY}${user.uid}`, JSON.stringify(nextState));
    } catch (error) {
      console.warn('Unable to save integration settings locally:', error);
    }

    // Save news feed settings to Firestore
    try {
      await saveNewsFeedSettings(user.uid, {
        systemPrompt: nextState.newsSystemPrompt,
        sources: nextState.newsAggregators,
      });
    } catch (error) {
      console.error('[IntegrationsContext] Firestore news feed write FAILED:', error);
    }

    // Save action API settings to Firestore
    try {
      await saveActionApiSettings(user.uid, {
        apis: nextState.actionApis,
      });
      console.log(`[IntegrationsContext] Saved ${nextState.actionApis.length} action API(s) to Firestore.`);
    } catch (error) {
      console.error('[IntegrationsContext] Firestore action API write FAILED:', error);
    }
  }, [user?.uid]);

  const saveSyncLogs = useCallback(async (nextLogs) => {
    if (!user?.uid) return;
    try {
      await AsyncStorage.setItem(`${LOGS_STORAGE_KEY}${user.uid}`, JSON.stringify(nextLogs));
    } catch (error) {
      console.warn('Unable to save integration logs:', error);
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
    setSyncLogs(prev => {
      const nextLogs = [{ ...log, id: createId('log'), timestamp: 'Just now' }, ...prev];
      saveSyncLogs(nextLogs);
      return nextLogs;
    });
  }, [saveSyncLogs]);

  const clearSyncLogs = useCallback(() => {
    setSyncLogs([]);
    saveSyncLogs([]);
  }, [saveSyncLogs]);

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
