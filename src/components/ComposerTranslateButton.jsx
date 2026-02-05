import { React, Actions } from 'mailspring-exports';
import TranslationResult from './TranslationResult';
import {
  GeminiTranslationService,
  TARGET_LANGUAGES,
  MODEL_OPTIONS
} from '../gemini-service';

export default class ComposerTranslateButton extends React.Component {
  static displayName = 'ComposerTranslateButton';

  constructor(props) {
    super(props);
    const config = GeminiTranslationService.getConfig();
    this.state = {
      translation: null,
      loading: false,
      error: null,
      showOptions: false,
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
  }

  componentWillUnmount() {
    this._isMounted = false;
    this._activeRequestId += 1;
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      nextProps.session !== this.props.session ||
      nextState.translation !== this.state.translation ||
      nextState.loading !== this.state.loading ||
      nextState.error !== this.state.error ||
      nextState.showOptions !== this.state.showOptions ||
      nextState.showSettings !== this.state.showSettings ||
      nextState.settings.provider !== this.state.settings.provider ||
      nextState.settings.apiKey !== this.state.settings.apiKey ||
      nextState.settings.model !== this.state.settings.model ||
      nextState.settings.targetLanguage !== this.state.settings.targetLanguage ||
      nextState.settings.ollamaHost !== this.state.settings.ollamaHost ||
      nextState.settings.ollamaModel !== this.state.settings.ollamaModel
    );
  }

  _handleTranslate = async () => {
    const { draft } = this.props;
    const body = draft && draft.body ? draft.body : '';
    const plainText = GeminiTranslationService.extractPlainText(body);

    const requestId = ++this._activeRequestId;
    this.setState({ loading: true, error: null });

    try {
      const result = await GeminiTranslationService.translate(plainText);
      if (!this._isMounted || requestId !== this._activeRequestId) return;

      if (result.success && result.translatedText) {
        this.setState({
          translation: result.translatedText,
          loading: false,
          showOptions: true
        });
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
      showOptions: prevState.showSettings ? prevState.showOptions : false,
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
    const saved = GeminiTranslationService.saveConfig(settings);
    if (!saved) {
      this.setState({ error: 'Settings could not be saved in this environment.' });
      return;
    }

    this.setState({ showSettings: false, error: null });
  };

  _handleReplace = () => {
    const { translation } = this.state;
    const { draft, session } = this.props;
    if (!translation) return;

    if (session && session.changes && session.changes.add) {
      session.changes.add({ body: translation });
    } else if (Actions && Actions.setDraftBody) {
      Actions.setDraftBody(draft, translation);
    }

    this.setState({ translation: null, showOptions: false });
  };

  _handleClose = () => {
    this.setState({ translation: null, error: null, showOptions: false });
  };

  render() {
    const {
      translation,
      loading,
      error,
      showOptions,
      showSettings,
      settings
    } = this.state;
    const hasPresetModel = MODEL_OPTIONS.some(
      (model) => model.value === settings.model
    );
    const selectedModel = hasPresetModel ? settings.model : '__custom__';
    const isOllama = settings.provider === 'ollama';

    return (
      <div className="composer-translate-button">
        <div className="translator-actions">
          <button
            className="btn btn-toolbar"
            onClick={this._handleTranslate}
            disabled={loading}
            title="Translate email content"
          >
            {loading ? 'Translating...' : 'Translate'}
          </button>
          <button className="btn btn-toolbar" onClick={this._toggleSettings}>
            {showSettings ? 'Close Settings' : 'Settings'}
          </button>
        </div>

        {error && (
          <div className="translator-error">
            <span>{error}</span>
            <button className="btn btn-sm" onClick={this._handleClose}>
              Close
            </button>
          </div>
        )}

        {translation && showOptions && (
          <div className="translator-options">
            <TranslationResult content={translation} />
            <div className="translator-options-actions">
              <button className="btn btn-emphasis" onClick={this._handleReplace}>
                Replace
              </button>
              <button className="btn" onClick={this._handleClose}>
                Close
              </button>
            </div>
          </div>
        )}

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
      </div>
    );
  }
}
