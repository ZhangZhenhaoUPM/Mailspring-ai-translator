import { GoogleGenerativeAI } from '@google/generative-ai';

const mailspringExports = require('mailspring-exports') || {};
const AppEnv = mailspringExports.AppEnv;

const TARGET_LANGUAGES = [
  { value: 'zh-CN', label: 'Chinese (Simplified)', name: 'Simplified Chinese' },
  { value: 'zh-TW', label: 'Chinese (Traditional)', name: 'Traditional Chinese' },
  { value: 'en', label: 'English', name: 'English' },
  { value: 'ja', label: 'Japanese', name: 'Japanese' },
  { value: 'ko', label: 'Korean', name: 'Korean' },
  { value: 'es', label: 'Spanish', name: 'Spanish' },
  { value: 'fr', label: 'French', name: 'French' },
  { value: 'de', label: 'German', name: 'German' },
  { value: 'ru', label: 'Russian', name: 'Russian' },
  { value: 'pt', label: 'Portuguese', name: 'Portuguese' },
  { value: 'it', label: 'Italian', name: 'Italian' },
  { value: 'ar', label: 'Arabic', name: 'Arabic' }
];

const MODEL_OPTIONS = [
  { value: 'gemini-3-pro-preview', label: 'Gemini 3 Pro Preview' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview (fast)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (quality)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (fast)' },
  {
    value: 'gemini-2.5-flash-lite-preview-09-2025',
    label: 'Gemini 2.5 Flash-Lite Preview (09-2025)'
  }
];

const LANGUAGE_NAMES = TARGET_LANGUAGES.reduce((acc, item) => {
  acc[item.value] = item.name;
  return acc;
}, {});

const LIMITS = {
  MAX_INPUT_CHARS: 120000,
  MAX_SEGMENTS: 120,
  MAX_TOTAL_SEGMENT_CHARS: 80000,
  TIMEOUT_MS: 60000
};

function getFetch() {
  if (typeof fetch !== 'undefined') return fetch;
  if (typeof window !== 'undefined' && window.fetch) return window.fetch;
  if (typeof global !== 'undefined' && global.fetch) return global.fetch;
  return null;
}

async function fetchJsonWithTimeout(url, options, timeoutMs) {
  const fetcher = getFetch();
  if (!fetcher) {
    throw new Error('Fetch API is not available');
  }

  let controller = null;
  let signal = options && options.signal;
  if (typeof AbortController !== 'undefined') {
    controller = new AbortController();
    signal = controller.signal;
  }

  let timeoutId = null;
  if (controller) {
    timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);
  }

  try {
    const response = await fetcher(url, { ...(options || {}), signal });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage =
        (data && (data.error || data.message)) || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
    return data;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function readConfigValue(key, fallback) {
  try {
    if (AppEnv && AppEnv.config && AppEnv.config.get) {
      const value = AppEnv.config.get(key);
      return value === undefined || value === null ? fallback : value;
    }
  } catch (error) {
    console.warn('Failed to read AppEnv config:', error);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    }
  } catch (error) {
    console.warn('Failed to read local config:', error);
  }

  return fallback;
}

function writeConfigValue(key, value) {
  try {
    if (AppEnv && AppEnv.config && AppEnv.config.set) {
      AppEnv.config.set(key, value);
      return true;
    }
  } catch (error) {
    console.warn('Failed to write AppEnv config:', error);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
      return true;
    }
  } catch (error) {
    console.warn('Failed to write local config:', error);
  }

  return false;
}

function getConfig() {
  return {
    provider: readConfigValue('mailspring-ai-translator.provider', 'gemini'),
    apiKey: readConfigValue('mailspring-ai-translator.apiKey', ''),
    model: readConfigValue('mailspring-ai-translator.model', 'gemini-2.5-flash'),
    targetLanguage: readConfigValue(
      'mailspring-ai-translator.targetLanguage',
      'zh-CN'
    ),
    ollamaHost: readConfigValue(
      'mailspring-ai-translator.ollamaHost',
      'http://127.0.0.1:11434'
    ),
    ollamaModel: readConfigValue('mailspring-ai-translator.ollamaModel', 'qwen3')
  };
}

function saveConfig({ provider, apiKey, model, targetLanguage, ollamaHost, ollamaModel }) {
  const normalized = {
    provider: provider || 'gemini',
    apiKey: (apiKey || '').trim(),
    model: (model || '').trim() || 'gemini-2.5-flash',
    targetLanguage: targetLanguage || 'zh-CN',
    ollamaHost: (ollamaHost || '').trim() || 'http://127.0.0.1:11434',
    ollamaModel: (ollamaModel || '').trim() || 'qwen3'
  };

  const okProvider = writeConfigValue(
    'mailspring-ai-translator.provider',
    normalized.provider
  );
  const okApi = writeConfigValue(
    'mailspring-ai-translator.apiKey',
    normalized.apiKey
  );
  const okModel = writeConfigValue(
    'mailspring-ai-translator.model',
    normalized.model
  );
  const okLang = writeConfigValue(
    'mailspring-ai-translator.targetLanguage',
    normalized.targetLanguage
  );

  const okHost = writeConfigValue(
    'mailspring-ai-translator.ollamaHost',
    normalized.ollamaHost
  );
  const okOllamaModel = writeConfigValue(
    'mailspring-ai-translator.ollamaModel',
    normalized.ollamaModel
  );

  return okProvider && okApi && okModel && okLang && okHost && okOllamaModel;
}

function extractPlainText(htmlBody) {
  if (!htmlBody) return '';

  let text = htmlBody.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, ' ').trim();
  return text;
}

function withTimeout(promise, timeoutMs) {
  let timeoutId = null;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Translation request timed out'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  });
}

function sanitizeHtmlFragment(html) {
  const container = document.createElement('div');
  container.innerHTML = html || '';

  container.querySelectorAll('script, style, link, meta').forEach((node) => {
    node.remove();
  });

  container.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attr) => {
      if (/^on/i.test(attr.name)) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return container.innerHTML;
}

function stripMediaFromHtml(html) {
  const container = document.createElement('div');
  container.innerHTML = html || '';

  container
    .querySelectorAll(
      'img, picture, video, audio, source, svg, canvas, iframe, object, embed'
    )
    .forEach((node) => {
      node.remove();
    });

  container.querySelectorAll('*').forEach((node) => {
    ['src', 'srcset', 'poster'].forEach((attr) => {
      if (node.hasAttribute(attr)) {
        node.removeAttribute(attr);
      }
    });
  });

  return container.innerHTML;
}

function extractSegmentsFromHtml(htmlBody) {
  const container = document.createElement('div');
  container.innerHTML = htmlBody || '';

  container.querySelectorAll('script, style, link, meta').forEach((node) => {
    node.remove();
  });

  const blockSelector =
    'p, li, blockquote, h1, h2, h3, h4, h5, h6, pre, div';
  const blockSet = new Set(
    blockSelector
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  );

  const elements = Array.from(container.querySelectorAll(blockSelector));
  const segments = [];
  let totalTextChars = 0;
  let truncated = false;

  const isLeafBlock = (element) => {
    if (!element || !element.querySelector) return false;
    const childBlocks = element.querySelectorAll(blockSelector);
    return childBlocks.length === 0;
  };

  elements.forEach((element) => {
    if (segments.length >= LIMITS.MAX_SEGMENTS) {
      truncated = true;
      return;
    }

    const tag = element.tagName ? element.tagName.toLowerCase() : '';
    if (!blockSet.has(tag)) return;
    if (!isLeafBlock(element)) return;

    const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
    if (!text) return;

    totalTextChars += text.length;
    if (totalTextChars > LIMITS.MAX_TOTAL_SEGMENT_CHARS) {
      truncated = true;
      return;
    }

    const id = `seg_${segments.length + 1}`;
    element.setAttribute('data-translation-id', id);
    segments.push({ id, html: stripMediaFromHtml(element.innerHTML) });
  });

  return { container, segments, truncated };
}

function extractJsonPayload(text) {
  if (!text) return null;
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');
  let start = -1;
  let end = -1;

  if (firstBrace === -1 && firstBracket === -1) return null;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = text.lastIndexOf('}');
  } else {
    start = firstBracket;
    end = text.lastIndexOf(']');
  }

  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

async function translate(text) {
  if (!text || text.trim().length === 0) {
    return { success: false, error: 'No text to translate' };
  }

  if (text.length > LIMITS.MAX_INPUT_CHARS) {
    return { success: false, error: 'Content too large to translate' };
  }

  const config = getConfig();
  if (config.provider === 'ollama') {
    return translateWithOllama(text, config);
  }
  return translateWithGemini(text, config);
}

async function translateHtmlByParagraph(htmlBody) {
  if (!htmlBody || htmlBody.trim().length === 0) {
    return { success: false, error: 'No content to translate' };
  }

  if (htmlBody.length > LIMITS.MAX_INPUT_CHARS) {
    return { success: false, error: 'Content too large to translate' };
  }

  const { container, segments, truncated } = extractSegmentsFromHtml(htmlBody);
  if (segments.length === 0) {
    return { success: false, error: 'No translatable paragraphs found' };
  }
  if (truncated) {
    return { success: false, error: 'Content too large to translate safely' };
  }

  const config = getConfig();
  if (config.provider === 'ollama') {
    return translateHtmlByParagraphWithOllama(container, segments, config);
  }
  return translateHtmlByParagraphWithGemini(container, segments, config);
}

async function translateWithGemini(text, config) {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'Gemini API Key not configured. Please set it in preferences.'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });
    const languageName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage;
    const prompt = `Translate the following text to ${languageName}. Only provide the translation without any additional explanation or commentary.\n\n${text}`;

    const result = await withTimeout(
      model.generateContent(prompt),
      LIMITS.TIMEOUT_MS
    );
    const response = await result.response;
    const translated = response.text();

    return {
      success: true,
      translatedText: translated.trim()
    };
  } catch (error) {
    console.error('Gemini translation error:', error);
    return {
      success: false,
      error: error.message || 'Translation failed'
    };
  }
}

async function translateHtmlByParagraphWithGemini(container, segments, config) {
  if (!config.apiKey) {
    return {
      success: false,
      error: 'Gemini API Key not configured. Please set it in preferences.'
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({ model: config.model });
    const languageName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage;

    const prompt =
      `Translate each HTML snippet into ${languageName}. ` +
      'Keep all HTML tags and attributes unchanged. ' +
      'Only translate human-readable text nodes. ' +
      'Return only JSON (no markdown) as an array of objects: ' +
      '[{"id":"seg_1","html":"..."}].';

    const payload = JSON.stringify(segments);
    const result = await withTimeout(
      model.generateContent(`${prompt}\n\n${payload}`),
      LIMITS.TIMEOUT_MS
    );
    const response = await result.response;
    const raw = response.text();
    return applyHtmlTranslations(container, raw);
  } catch (error) {
    console.error('Gemini translation error:', error);
    return {
      success: false,
      error: error.message || 'Translation failed'
    };
  }
}

async function translateWithOllama(text, config) {
  try {
    const languageName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage;
    const prompt = `Translate the following text to ${languageName}. Only provide the translation without any additional explanation or commentary.\n\n${text}`;
    const output = await ollamaGenerate(prompt, config);
    return {
      success: true,
      translatedText: (output || '').trim()
    };
  } catch (error) {
    console.error('Ollama translation error:', error);
    return {
      success: false,
      error: error.message || 'Translation failed'
    };
  }
}

async function translateHtmlByParagraphWithOllama(container, segments, config) {
  try {
    const languageName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage;
    const prompt =
      `Translate each HTML snippet into ${languageName}. ` +
      'Keep all HTML tags and attributes unchanged. ' +
      'Only translate human-readable text nodes. ' +
      'Return only JSON (no markdown) as an array of objects: ' +
      '[{"id":"seg_1","html":"..."}].';
    const payload = JSON.stringify(segments);
    const output = await ollamaGenerate(`${prompt}\n\n${payload}`, config);
    return applyHtmlTranslations(container, output);
  } catch (error) {
    console.error('Ollama translation error:', error);
    return {
      success: false,
      error: error.message || 'Translation failed'
    };
  }
}

function normalizeOllamaHost(host) {
  const value = (host || '').trim() || 'http://127.0.0.1:11434';
  return value.replace(/\/+$/, '');
}

async function ollamaGenerate(prompt, config) {
  const host = normalizeOllamaHost(config.ollamaHost);
  const model = (config.ollamaModel || '').trim() || 'qwen3';
  const url = `${host}/api/generate`;
  const data = await fetchJsonWithTimeout(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt,
        stream: false
      })
    },
    LIMITS.TIMEOUT_MS
  );

  if (!data || typeof data.response !== 'string') {
    throw new Error('Ollama response was empty');
  }

  return data.response;
}

function applyHtmlTranslations(container, rawText) {
  const jsonPayload = extractJsonPayload(rawText);
  if (!jsonPayload) {
    return { success: false, error: 'Translation response was not valid JSON' };
  }

  let parsed = null;
  try {
    parsed = JSON.parse(jsonPayload);
  } catch (parseError) {
    return { success: false, error: 'Failed to parse translation response' };
  }

  const translationsArray = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.translations)
      ? parsed.translations
      : null;

  if (!translationsArray) {
    return { success: false, error: 'Translation response missing data' };
  }

  const translationMap = new Map();
  translationsArray.forEach((item) => {
    if (!item || typeof item.id !== 'string') return;
    const html = typeof item.html === 'string' ? item.html : '';
    translationMap.set(item.id, sanitizeHtmlFragment(html));
  });

  const elements = container.querySelectorAll('[data-translation-id]');
  elements.forEach((element) => {
    const id = element.getAttribute('data-translation-id');
    const translatedHtml = translationMap.get(id);
    if (!translatedHtml) return;

    element.innerHTML = translatedHtml;
    element.removeAttribute('data-translation-id');
  });

  return {
    success: true,
    translatedHtml: container.innerHTML
  };
}
export const GeminiTranslationService = {
  getConfig,
  saveConfig,
  extractPlainText,
  translate,
  translateHtmlByParagraph
};

export { TARGET_LANGUAGES, MODEL_OPTIONS };
