import { React } from 'mailspring-exports';
import TranslationResult from './TranslationResult';
import {
  GeminiTranslationService,
  TARGET_LANGUAGES,
  MODEL_OPTIONS
} from '../gemini-service';

const TRANSLATION_CACHE = new Map();
const MAX_CACHE_ENTRIES = 50;
const MAX_CACHE_CHARS = 120000;

function hashString(value) {
  if (!value) return '0';
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return `${hash}`;
}

function cacheGet(key) {
  if (!key) return null;
  return TRANSLATION_CACHE.get(key) || null;
}

function cachePut(key, entry) {
  if (!key) return;
  if (entry.translatedHtml && entry.translatedHtml.length > MAX_CACHE_CHARS) return;
  if (TRANSLATION_CACHE.has(key)) {
    TRANSLATION_CACHE.delete(key);
  }
  TRANSLATION_CACHE.set(key, entry);
  if (TRANSLATION_CACHE.size > MAX_CACHE_ENTRIES) {
    const oldestKey = TRANSLATION_CACHE.keys().next().value;
    TRANSLATION_CACHE.delete(oldestKey);
  }
}

export default class TranslateButton extends React.Component {
  static displayName = 'TranslateButton';

  constructor(props) {
    super(props);
    const config = GeminiTranslationService.getConfig();
    this.state = {
      translationHtml: null,
      loading: false,
      error: null,
      showSettings: false,
      settings: {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        targetLanguage: config.targetLanguage,
        ollamaHost: config.ollamaHost,
        ollamaModel: config.ollamaModel
      }
    };
    this._isMounted = false;
    this._activeRequestId = 0;
  }

  componentDidMount() {
    this._isMounted = true;
    this._loadCachedTranslation(this.props.message);
  }

  componentWillUnmount() {
    this._isMounted = false;
    this._activeRequestId += 1;
  }

  componentDidUpdate(prevProps) {
    const prevMessage = prevProps.message;
    const nextMessage = this.props.message;
    const prevId = prevMessage && prevMessage.id;
    const nextId = nextMessage && nextMessage.id;
    if (prevId !== nextId) {
      this._loadCachedTranslation(nextMessage);
    }
  }

  _handleTranslate = async () => {
    const { message } = this.props;
    const body = message && message.body ? message.body : '';
    const requestId = ++this._activeRequestId;
    this.setState({ loading: true, error: null });

    try {
      const result = await GeminiTranslationService.translateHtmlByParagraph(body);
      if (!this._isMounted || requestId !== this._activeRequestId) return;

      if (result.success && result.translatedHtml) {
        const cacheKey = message && message.id ? message.id : null;
        const config = GeminiTranslationService.getConfig();
    const signature = `${config.provider}|${config.model}|${config.targetLanguage}|${config.ollamaHost}|${config.ollamaModel}`;
        const bodyHash = hashString(body);
        cachePut(cacheKey, {
          translatedHtml: result.translatedHtml,
          signature,
          bodyHash,
          at: Date.now()
        });
        this.setState({ translationHtml: result.translatedHtml, loading: false });
      } else {
        this.setState({
          error: result.error || 'Translation failed',
          loading: false
        });
      }
    } catch (error) {
      if (!this._isMounted || requestId !== this._activeRequestId) return;
      this.setState({
        error: error.message || 'Translation failed',
        loading: false
      });
    }
  };

  _toggleSettings = () => {
    const config = GeminiTranslationService.getConfig();
    this.setState((prevState) => ({
      showSettings: !prevState.showSettings,
      settings: {
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model,
        targetLanguage: config.targetLanguage,
        ollamaHost: config.ollamaHost,
        ollamaModel: config.ollamaModel
      }
    }));
  };

  _handleSettingChange = (field, value) => {
    this.setState((prevState) => ({
      settings: {
        ...prevState.settings,
        [field]: value
      }
    }));
  };

  _handleSaveSettings = () => {
    const { settings } = this.state;
    const before = GeminiTranslationService.getConfig();
    const saved = GeminiTranslationService.saveConfig(settings);
    if (!saved) {
      this.setState({ error: 'Settings could not be saved in this environment.' });
      return;
    }
    const changed =
      before.provider !== settings.provider ||
      before.model !== settings.model ||
      before.targetLanguage !== settings.targetLanguage ||
      before.ollamaHost !== settings.ollamaHost ||
      before.ollamaModel !== settings.ollamaModel;

    this.setState({
      showSettings: false,
      error: null,
      translationHtml: changed ? null : this.state.translationHtml
    });
  };

  _loadCachedTranslation = (message) => {
    const cacheKey = message && message.id ? message.id : null;
    if (!cacheKey) {
      if (this.state.translationHtml) {
        this.setState({ translationHtml: null });
      }
      return;
    }

    const cached = cacheGet(cacheKey);
    if (!cached) {
      if (this.state.translationHtml) {
        this.setState({ translationHtml: null });
      }
      return;
    }

    const body = message && message.body ? message.body : '';
    const config = GeminiTranslationService.getConfig();
    const signature = `${config.provider}|${config.model}|${config.targetLanguage}|${config.ollamaHost}|${config.ollamaModel}`;
    const bodyHash = hashString(body);
    if (cached.signature === signature && cached.bodyHash === bodyHash) {
      if (this.state.translationHtml !== cached.translatedHtml) {
        this.setState({ translationHtml: cached.translatedHtml, error: null });
      }
      return;
    }

    if (this.state.translationHtml) {
      this.setState({ translationHtml: null });
    }
  };

  _handleClose = () => {
    this.setState({ translationHtml: null, error: null });
  };

  render() {
    const { translationHtml, loading, error, showSettings, settings } = this.state;
    const hasPresetModel = MODEL_OPTIONS.some(
      (model) => model.value === settings.model
    );
    const selectedModel = hasPresetModel ? settings.model : '__custom__';
    const isOllama = settings.provider === 'ollama';

    return (
      <div className="translator-container">
        <div className="translator-actions">
          <button
            className="btn btn-toolbar"
            onClick={this._handleTranslate}
            disabled={loading}
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
          <button className="btn btn-toolbar" onClick={this._toggleSettings}>
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>
        </div>

        {showSettings && (
          <div className="translator-settings">
            <div className="settings-field">
              <label>Provider</label>
              <select
                value={settings.provider}
                onChange={(event) =>
                  this._handleSettingChange('provider', event.target.value)
                }
              >
                <option value="gemini">Gemini (cloud)</option>
                <option value="ollama">Ollama (local)</option>
              </select>
            </div>
            {isOllama ? (
              <>
                <div className="settings-field">
                  <label>Ollama Host</label>
                  <input
                    type="text"
                    value={settings.ollamaHost}
                    onChange={(event) =>
                      this._handleSettingChange('ollamaHost', event.target.value)
                    }
                    placeholder="http://127.0.0.1:11434"
                  />
                </div>
                <div className="settings-field">
                  <label>Ollama Model</label>
                  <input
                    type="text"
                    value={settings.ollamaModel}
                    onChange={(event) =>
                      this._handleSettingChange('ollamaModel', event.target.value)
                    }
                    placeholder="qwen3"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="settings-field">
                  <label>Gemini API Key</label>
                  <input
                    type="password"
                    value={settings.apiKey}
                    onChange={(event) =>
                      this._handleSettingChange('apiKey', event.target.value)
                    }
                    placeholder="Paste your Gemini API key"
                  />
                </div>
                <div className="settings-field">
                  <label>Model</label>
                  <select
                    value={selectedModel}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (value === '__custom__') {
                        this._handleSettingChange('model', settings.model);
                      } else {
                        this._handleSettingChange('model', value);
                      }
                    }}
                  >
                    {MODEL_OPTIONS.map((model) => (
                      <option key={model.value} value={model.value}>
                        {model.label}
                      </option>
                    ))}
                    <option value="__custom__">Custom</option>
                  </select>
                  {!hasPresetModel && (
                    <input
                      type="text"
                      value={settings.model}
                      onChange={(event) =>
                        this._handleSettingChange('model', event.target.value)
                      }
                      placeholder="Custom model name"
                    />
                  )}
                </div>
              </>
            )}
            <div className="settings-field">
              <label>Target Language</label>
              <select
                value={settings.targetLanguage}
                onChange={(event) =>
                  this._handleSettingChange('targetLanguage', event.target.value)
                }
              >
                {TARGET_LANGUAGES.map((language) => (
                  <option key={language.value} value={language.value}>
                    {language.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="translator-settings-actions">
              <button className="btn btn-emphasis" onClick={this._handleSaveSettings}>
                Save
              </button>
              <button className="btn" onClick={this._toggleSettings}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="translator-error">
            <span>{error}</span>
            <button className="btn btn-sm" onClick={this._handleClose}>
              Close
            </button>
          </div>
        )}

        {translationHtml && (
          <TranslationResult
            html={translationHtml}
            title="Inline Translation"
            onClose={this._handleClose}
          />
        )}
      </div>
    );
  }
}
