"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const TranslationResult_1 = __importDefault(require("./TranslationResult"));
const gemini_service_1 = require("../gemini-service");
const TRANSLATION_CACHE = new Map();
const MAX_CACHE_ENTRIES = 50;
const MAX_CACHE_CHARS = 120000;
function hashString(value) {
    if (!value)
        return '0';
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = (hash * 31 + value.charCodeAt(i)) | 0;
    }
    return `${hash}`;
}
function cacheGet(key) {
    if (!key)
        return null;
    return TRANSLATION_CACHE.get(key) || null;
}
function cachePut(key, entry) {
    if (!key)
        return;
    if (entry.translatedHtml && entry.translatedHtml.length > MAX_CACHE_CHARS)
        return;
    if (TRANSLATION_CACHE.has(key)) {
        TRANSLATION_CACHE.delete(key);
    }
    TRANSLATION_CACHE.set(key, entry);
    if (TRANSLATION_CACHE.size > MAX_CACHE_ENTRIES) {
        const oldestKey = TRANSLATION_CACHE.keys().next().value;
        TRANSLATION_CACHE.delete(oldestKey);
    }
}
class TranslateButton extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._handleTranslate = async () => {
            const { message } = this.props;
            const body = message && message.body ? message.body : '';
            const requestId = ++this._activeRequestId;
            this.setState({ loading: true, error: null });
            try {
                const result = await gemini_service_1.GeminiTranslationService.translateHtmlByParagraph(body);
                if (!this._isMounted || requestId !== this._activeRequestId)
                    return;
                if (result.success && result.translatedHtml) {
                    const cacheKey = message && message.id ? message.id : null;
                    const config = gemini_service_1.GeminiTranslationService.getConfig();
                    const signature = `${config.provider}|${config.model}|${config.targetLanguage}|${config.ollamaHost}|${config.ollamaModel}`;
                    const bodyHash = hashString(body);
                    cachePut(cacheKey, {
                        translatedHtml: result.translatedHtml,
                        signature,
                        bodyHash,
                        at: Date.now()
                    });
                    this.setState({ translationHtml: result.translatedHtml, loading: false });
                }
                else {
                    this.setState({
                        error: result.error || 'Translation failed',
                        loading: false
                    });
                }
            }
            catch (error) {
                if (!this._isMounted || requestId !== this._activeRequestId)
                    return;
                this.setState({
                    error: error.message || 'Translation failed',
                    loading: false
                });
            }
        };
        this._toggleSettings = () => {
            const config = gemini_service_1.GeminiTranslationService.getConfig();
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
        this._handleSettingChange = (field, value) => {
            this.setState((prevState) => ({
                settings: Object.assign(Object.assign({}, prevState.settings), { [field]: value })
            }));
        };
        this._handleSaveSettings = () => {
            const { settings } = this.state;
            const before = gemini_service_1.GeminiTranslationService.getConfig();
            const saved = gemini_service_1.GeminiTranslationService.saveConfig(settings);
            if (!saved) {
                this.setState({ error: 'Settings could not be saved in this environment.' });
                return;
            }
            const changed = before.provider !== settings.provider ||
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
        this._loadCachedTranslation = (message) => {
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
            const config = gemini_service_1.GeminiTranslationService.getConfig();
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
        this._handleClose = () => {
            this.setState({ translationHtml: null, error: null });
        };
        const config = gemini_service_1.GeminiTranslationService.getConfig();
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
    render() {
        const { translationHtml, loading, error, showSettings, settings } = this.state;
        const hasPresetModel = gemini_service_1.MODEL_OPTIONS.some((model) => model.value === settings.model);
        const selectedModel = hasPresetModel ? settings.model : '__custom__';
        const isOllama = settings.provider === 'ollama';
        return (mailspring_exports_1.React.createElement("div", { className: "translator-container" },
            mailspring_exports_1.React.createElement("div", { className: "translator-actions" },
                mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar", onClick: this._handleTranslate, disabled: loading }, loading ? 'Translating...' : 'Translate'),
                mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar", onClick: this._toggleSettings }, showSettings ? 'Close Settings' : 'Settings')),
            showSettings && (mailspring_exports_1.React.createElement("div", { className: "translator-settings" },
                mailspring_exports_1.React.createElement("div", { className: "settings-field" },
                    mailspring_exports_1.React.createElement("label", null, "Provider"),
                    mailspring_exports_1.React.createElement("select", { value: settings.provider, onChange: (event) => this._handleSettingChange('provider', event.target.value) },
                        mailspring_exports_1.React.createElement("option", { value: "gemini" }, "Gemini (cloud)"),
                        mailspring_exports_1.React.createElement("option", { value: "ollama" }, "Ollama (local)"))),
                isOllama ? (mailspring_exports_1.React.createElement(mailspring_exports_1.React.Fragment, null,
                    mailspring_exports_1.React.createElement("div", { className: "settings-field" },
                        mailspring_exports_1.React.createElement("label", null, "Ollama Host"),
                        mailspring_exports_1.React.createElement("input", { type: "text", value: settings.ollamaHost, onChange: (event) => this._handleSettingChange('ollamaHost', event.target.value), placeholder: "http://127.0.0.1:11434" })),
                    mailspring_exports_1.React.createElement("div", { className: "settings-field" },
                        mailspring_exports_1.React.createElement("label", null, "Ollama Model"),
                        mailspring_exports_1.React.createElement("input", { type: "text", value: settings.ollamaModel, onChange: (event) => this._handleSettingChange('ollamaModel', event.target.value), placeholder: "qwen3" })))) : (mailspring_exports_1.React.createElement(mailspring_exports_1.React.Fragment, null,
                    mailspring_exports_1.React.createElement("div", { className: "settings-field" },
                        mailspring_exports_1.React.createElement("label", null, "Gemini API Key"),
                        mailspring_exports_1.React.createElement("input", { type: "password", value: settings.apiKey, onChange: (event) => this._handleSettingChange('apiKey', event.target.value), placeholder: "Paste your Gemini API key" })),
                    mailspring_exports_1.React.createElement("div", { className: "settings-field" },
                        mailspring_exports_1.React.createElement("label", null, "Model"),
                        mailspring_exports_1.React.createElement("select", { value: selectedModel, onChange: (event) => {
                                const value = event.target.value;
                                if (value === '__custom__') {
                                    this._handleSettingChange('model', settings.model);
                                }
                                else {
                                    this._handleSettingChange('model', value);
                                }
                            } },
                            gemini_service_1.MODEL_OPTIONS.map((model) => (mailspring_exports_1.React.createElement("option", { key: model.value, value: model.value }, model.label))),
                            mailspring_exports_1.React.createElement("option", { value: "__custom__" }, "Custom")),
                        !hasPresetModel && (mailspring_exports_1.React.createElement("input", { type: "text", value: settings.model, onChange: (event) => this._handleSettingChange('model', event.target.value), placeholder: "Custom model name" }))))),
                mailspring_exports_1.React.createElement("div", { className: "settings-field" },
                    mailspring_exports_1.React.createElement("label", null, "Target Language"),
                    mailspring_exports_1.React.createElement("select", { value: settings.targetLanguage, onChange: (event) => this._handleSettingChange('targetLanguage', event.target.value) }, gemini_service_1.TARGET_LANGUAGES.map((language) => (mailspring_exports_1.React.createElement("option", { key: language.value, value: language.value }, language.label))))),
                mailspring_exports_1.React.createElement("div", { className: "translator-settings-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", onClick: this._handleSaveSettings }, "Save"),
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._toggleSettings }, "Cancel")))),
            error && (mailspring_exports_1.React.createElement("div", { className: "translator-error" },
                mailspring_exports_1.React.createElement("span", null, error),
                mailspring_exports_1.React.createElement("button", { className: "btn btn-sm", onClick: this._handleClose }, "Close"))),
            translationHtml && (mailspring_exports_1.React.createElement(TranslationResult_1.default, { html: translationHtml, title: "Inline Translation", onClose: this._handleClose }))));
    }
}
TranslateButton.displayName = 'TranslateButton';
exports.default = TranslateButton;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNsYXRlQnV0dG9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2NvbXBvbmVudHMvVHJhbnNsYXRlQnV0dG9uLmpzeCJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLDJEQUEyQztBQUMzQyw0RUFBb0Q7QUFDcEQsc0RBSTJCO0FBRTNCLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUNwQyxNQUFNLGlCQUFpQixHQUFHLEVBQUUsQ0FBQztBQUM3QixNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUM7QUFFL0IsU0FBUyxVQUFVLENBQUMsS0FBSztJQUN2QixJQUFJLENBQUMsS0FBSztRQUFFLE9BQU8sR0FBRyxDQUFDO0lBQ3ZCLElBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztJQUNiLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUN6QyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEdBQUcsRUFBRSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDL0MsQ0FBQztJQUNELE9BQU8sR0FBRyxJQUFJLEVBQUUsQ0FBQztBQUNuQixDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsR0FBRztJQUNuQixJQUFJLENBQUMsR0FBRztRQUFFLE9BQU8sSUFBSSxDQUFDO0lBQ3RCLE9BQU8saUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsR0FBRyxFQUFFLEtBQUs7SUFDMUIsSUFBSSxDQUFDLEdBQUc7UUFBRSxPQUFPO0lBQ2pCLElBQUksS0FBSyxDQUFDLGNBQWMsSUFBSSxLQUFLLENBQUMsY0FBYyxDQUFDLE1BQU0sR0FBRyxlQUFlO1FBQUUsT0FBTztJQUNsRixJ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