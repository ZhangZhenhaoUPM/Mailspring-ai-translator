"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MODEL_OPTIONS = exports.TARGET_LANGUAGES = exports.GeminiTranslationService = void 0;
const generative_ai_1 = require("@google/generative-ai");
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
exports.TARGET_LANGUAGES = TARGET_LANGUAGES;
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
exports.MODEL_OPTIONS = MODEL_OPTIONS;
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
    if (typeof fetch !== 'undefined')
        return fetch;
    if (typeof window !== 'undefined' && window.fetch)
        return window.fetch;
    if (typeof global !== 'undefined' && global.fetch)
        return global.fetch;
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
        const response = await fetcher(url, Object.assign(Object.assign({}, (options || {})), { signal }));
        const data = await response.json().catch(() => null);
        if (!response.ok) {
            const errorMessage = (data && (data.error || data.message)) || `HTTP ${response.status}`;
            throw new Error(errorMessage);
        }
        return data;
    }
    finally {
        if (timeoutId)
            clearTimeout(timeoutId);
    }
}
function readConfigValue(key, fallback) {
    try {
        if (AppEnv && AppEnv.config && AppEnv.config.get) {
            const value = AppEnv.config.get(key);
            return value === undefined || value === null ? fallback : value;
        }
    }
    catch (error) {
        console.warn('Failed to read AppEnv config:', error);
    }
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const value = window.localStorage.getItem(key);
            return value === null ? fallback : value;
        }
    }
    catch (error) {
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
    }
    catch (error) {
        console.warn('Failed to write AppEnv config:', error);
    }
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
            return true;
        }
    }
    catch (error) {
        console.warn('Failed to write local config:', error);
    }
    return false;
}
function getConfig() {
    return {
        provider: readConfigValue('mailspring-ai-translator.provider', 'gemini'),
        apiKey: readConfigValue('mailspring-ai-translator.apiKey', ''),
        model: readConfigValue('mailspring-ai-translator.model', 'gemini-2.5-flash'),
        targetLanguage: readConfigValue('mailspring-ai-translator.targetLanguage', 'zh-CN'),
        ollamaHost: readConfigValue('mailspring-ai-translator.ollamaHost', 'http://127.0.0.1:11434'),
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
    const okProvider = writeConfigValue('mailspring-ai-translator.provider', normalized.provider);
    const okApi = writeConfigValue('mailspring-ai-translator.apiKey', normalized.apiKey);
    const okModel = writeConfigValue('mailspring-ai-translator.model', normalized.model);
    const okLang = writeConfigValue('mailspring-ai-translator.targetLanguage', normalized.targetLanguage);
    const okHost = writeConfigValue('mailspring-ai-translator.ollamaHost', normalized.ollamaHost);
    const okOllamaModel = writeConfigValue('mailspring-ai-translator.ollamaModel', normalized.ollamaModel);
    return okProvider && okApi && okModel && okLang && okHost && okOllamaModel;
}
function extractPlainText(htmlBody) {
    if (!htmlBody)
        return '';
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
        if (timeoutId)
            clearTimeout(timeoutId);
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
        .querySelectorAll('img, picture, video, audio, source, svg, canvas, iframe, object, embed')
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
    const blockSelector = 'p, li, blockquote, h1, h2, h3, h4, h5, h6, pre, div';
    const blockSet = new Set(blockSelector
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean));
    const elements = Array.from(container.querySelectorAll(blockSelector));
    const segments = [];
    let totalTextChars = 0;
    let truncated = false;
    const isLeafBlock = (element) => {
        if (!element || !element.querySelector)
            return false;
        const childBlocks = element.querySelectorAll(blockSelector);
        return childBlocks.length === 0;
    };
    elements.forEach((element) => {
        if (segments.length >= LIMITS.MAX_SEGMENTS) {
            truncated = true;
            return;
        }
        const tag = element.tagName ? element.tagName.toLowerCase() : '';
        if (!blockSet.has(tag))
            return;
        if (!isLeafBlock(element))
            return;
        const text = (element.textContent || '').replace(/\s+/g, ' ').trim();
        if (!text)
            return;
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
    if (!text)
        return null;
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let start = -1;
    let end = -1;
    if (firstBrace === -1 && firstBracket === -1)
        return null;
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        start = firstBrace;
        end = text.lastIndexOf('}');
    }
    else {
        start = firstBracket;
        end = text.lastIndexOf(']');
    }
    if (start === -1 || end === -1 || end <= start)
        return null;
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: config.model });
        const languageName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage;
        const prompt = `Translate the following text to ${languageName}. Only provide the translation without any additional explanation or commentary.\n\n${text}`;
        const result = await withTimeout(model.generateContent(prompt), LIMITS.TIMEOUT_MS);
        const response = await result.response;
        const translated = response.text();
        return {
            success: true,
            translatedText: translated.trim()
        };
    }
    catch (error) {
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
        const genAI = new generative_ai_1.GoogleGenerativeAI(config.apiKey);
        const model = genAI.getGenerativeModel({ model: config.model });
        const languageName = LANGUAGE_NAMES[config.targetLanguage] || config.targetLanguage;
        const prompt = `Translate each HTML snippet into ${languageName}. ` +
            'Keep all HTML tags and attributes unchanged. ' +
            'Only translate human-readable text nodes. ' +
            'Return only JSON (no markdown) as an array of objects: ' +
            '[{"id":"seg_1","html":"..."}].';
        const payload = JSON.stringify(segments);
        const result = await withTimeout(model.generateContent(`${prompt}\n\n${payload}`), LIMITS.TIMEOUT_MS);
        const response = await result.response;
        const raw = response.text();
        return applyHtmlTranslations(container, raw);
    }
    catch (error) {
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
    }
    catch (error) {
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
        const prompt = `Translate each HTML snippet into ${languageName}. ` +
            'Keep all HTML tags and attributes unchanged. ' +
            'Only translate human-readable text nodes. ' +
            'Return only JSON (no markdown) as an array of objects: ' +
            '[{"id":"seg_1","html":"..."}].';
        const payload = JSON.stringify(segments);
        const output = await ollamaGenerate(`${prompt}\n\n${payload}`, config);
        return applyHtmlTranslations(container, output);
    }
    catch (error) {
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
    const data = await fetchJsonWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model,
            prompt,
            stream: false
        })
    }, LIMITS.TIMEOUT_MS);
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
    }
    catch (parseError) {
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
        if (!item || typeof item.id !== 'string')
            return;
        const html = typeof item.html === 'string' ? item.html : '';
        translationMap.set(item.id, sanitizeHtmlFragment(html));
    });
    const elements = container.querySelectorAll('[data-translation-id]');
    elements.forEach((element) => {
        const id = element.getAttribute('data-translation-id');
        const translatedHtml = translationMap.get(id);
        if (!translatedHtml)
            return;
        element.innerHTML = translatedHtml;
        element.removeAttribute('data-translation-id');
    });
    return {
        success: true,
        translatedHtml: container.innerHTML
    };
}
exports.GeminiTranslationService = {
    getConfig,
    saveConfig,
    extractPlainText,
    translate,
    translateHtmlByParagraph
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VtaW5pLXNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZ2VtaW5pLXNlcnZpY2UuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEseURBQTJEO0FBRTNELE1BQU0saUJBQWlCLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLElBQUksRUFBRSxDQUFDO0FBQzlELE1BQU0sTUFBTSxHQUFHLGlCQUFpQixDQUFDLE1BQU0sQ0FBQztBQUV4QyxNQUFNLGdCQUFnQixHQUFHO0lBQ3ZCLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsc0JBQXNCLEVBQUUsSUFBSSxFQUFFLG9CQUFvQixFQUFFO0lBQzdFLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUsdUJBQXVCLEVBQUUsSUFBSSxFQUFFLHFCQUFxQixFQUFFO0lBQy9FLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7SUFDbEQsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRTtJQUNwRCxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0lBQ2hELEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFTLEVBQUU7SUFDbEQsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRTtJQUNoRCxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFO0lBQ2hELEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxTQUFT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