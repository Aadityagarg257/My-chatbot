import { useState, useEffect } from 'react';

export const useSettings = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [provider, setProvider] = useState<'openai' | 'gemini' | 'perplexity'>('openai');
  const [model, setModel] = useState<string>('gpt-3.5-turbo');

  useEffect(() => {
    const storedKey = localStorage.getItem('ai-chat-api-key');
    const storedProvider = localStorage.getItem('ai-chat-provider');
    const storedModel = localStorage.getItem('ai-chat-model');
    
    if (storedKey) setApiKey(storedKey);
    if (storedProvider) setProvider(storedProvider as any);
    if (storedModel) setModel(storedModel);
  }, []);

  const saveSettings = (key: string, prov: 'openai' | 'gemini' | 'perplexity', mod: string) => {
    localStorage.setItem('ai-chat-api-key', key);
    localStorage.setItem('ai-chat-provider', prov);
    localStorage.setItem('ai-chat-model', mod);
    setApiKey(key);
    setProvider(prov);
    setModel(mod);
  };

  return { apiKey, provider, model, saveSettings };
};

export async function fetchWikipediaSummary(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.query?.search?.length) return null;

    const pageId = searchData.query.search[0].pageid;
    const contentUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&pageids=${pageId}&format=json&origin=*`;
    const contentRes = await fetch(contentUrl);
    const contentData = await contentRes.json();
    
    return contentData.query.pages[pageId].extract;
  } catch (e) {
    console.error("Wiki Error", e);
    return null;
  }
}

export async function generateChatTitle(message: string, apiKey?: string, provider?: string, model?: string): Promise<string> {
  // Simple heuristic fallback
  const simpleTitle = message.split(' ').slice(0, 5).join(' ') + (message.length > 30 ? '...' : '');
  
  if (!apiKey) return simpleTitle;

  try {
    // Try to ask LLM for a title if key exists
    const prompt = `Summarize this message into a short 3-5 word title: "${message}"`;
    const title = await callLLM([{ role: 'user', content: prompt }], apiKey, provider as any, model as any);
    return title.replace(/['"]/g, '').trim();
  } catch (e) {
    return simpleTitle;
  }
}

export async function callLLM(
  messages: { role: string, content: string }[], 
  apiKey: string, 
  provider: 'openai' | 'gemini' | 'perplexity',
  model: string
) {
  if (!apiKey) throw new Error("No API Key");

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  let url = '';
  let body = {};

  if (provider === 'openai') {
    url = 'https://api.openai.com/v1/chat/completions';
    body = {
      model: model || 'gpt-3.5-turbo',
      messages: messages,
      temperature: 0.7
    };
  } else if (provider === 'perplexity') {
    url = 'https://api.perplexity.ai/chat/completions';
    body = {
      model: model || 'llama-3.1-sonar-small-128k-online',
      messages: messages,
    };
  } else if (provider === 'gemini') {
    // Gemini often uses a different URL structure/key param, handling simplified standard OpenAI-compat proxies or direct REST
    // For direct REST with key in URL:
    url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
    // Gemini payload is different
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });
    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Error from Gemini";
  }

  // Standard OpenAI compatible fetch
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error: ${err}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
