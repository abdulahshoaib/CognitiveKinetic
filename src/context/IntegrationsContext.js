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

const IntegrationsContext = createContext({
  actionApis: [],
  newsAggregators: [],
  newsSystemPrompt: DEFAULT_NEWS_PROMPT,
  addActionApi: noop,
  updateActionApi: noop,
  removeActionApi: noop,
  addNewsAggregator: noop,
  updateNewsAggregator: noop,
  removeNewsAggregator: noop,
  setNewsAggregators: noop,
  updateNewsSystemPrompt: noop,
});

const createId = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export function IntegrationsProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(defaultIntegrations);

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

  const value = useMemo(() => ({
    actionApis: state.actionApis,
    newsAggregators: state.newsAggregators,
    newsSystemPrompt: state.newsSystemPrompt,
    addActionApi,
    updateActionApi,
    removeActionApi,
    addNewsAggregator,
    updateNewsAggregator,
    removeNewsAggregator,
    setNewsAggregators,
    updateNewsSystemPrompt,
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
  ]);

  return (
    <IntegrationsContext.Provider value={value}>
      {children}
    </IntegrationsContext.Provider>
  );
}

export const useIntegrations = () => useContext(IntegrationsContext);
