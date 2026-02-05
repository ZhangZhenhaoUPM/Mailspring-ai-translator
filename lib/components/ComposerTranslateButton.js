"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
const TranslationResult_1 = __importDefault(require("./TranslationResult"));
const gemini_service_1 = require("../gemini-service");
class ComposerTranslateButton extends mailspring_exports_1.React.Component {
    constructor(props) {
        super(props);
        this._handleTranslate = async () => {
            const { draft } = this.props;
            const body = draft && draft.body ? draft.body : '';
            const plainText = gemini_service_1.GeminiTranslationService.extractPlainText(body);
            const requestId = ++this._activeRequestId;
            this.setState({ loading: true, error: null });
            try {
                const result = await gemini_service_1.GeminiTranslationService.translate(plainText);
                if (!this._isMounted || requestId !== this._activeRequestId)
                    return;
                if (result.success && result.translatedText) {
                    this.setState({
                        translation: result.translatedText,
                        loading: false,
                        showOptions: true
                    });
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
        this._handleSettingChange = (field, value) => {
            this.setState((prevState) => ({
                settings: Object.assign(Object.assign({}, prevState.settings), { [field]: value })
            }));
        };
        this._handleSaveSettings = () => {
            const { settings } = this.state;
            const saved = gemini_service_1.GeminiTranslationService.saveConfig(settings);
            if (!saved) {
                this.setState({ error: 'Settings could not be saved in this environment.' });
                return;
            }
            this.setState({ showSettings: false, error: null });
        };
        this._handleReplace = () => {
            const { translation } = this.state;
            const { draft, session } = this.props;
            if (!translation)
                return;
            if (session && session.changes && session.changes.add) {
                session.changes.add({ body: translation });
            }
            else if (mailspring_exports_1.Actions && mailspring_exports_1.Actions.setDraftBody) {
                mailspring_exports_1.Actions.setDraftBody(draft, translation);
            }
            this.setState({ translation: null, showOptions: false });
        };
        this._handleClose = () => {
            this.setState({ translation: null, error: null, showOptions: false });
        };
        const config = gemini_service_1.GeminiTranslationService.getConfig();
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
        return (nextProps.session !== this.props.session ||
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
            nextState.settings.ollamaModel !== this.state.settings.ollamaModel);
    }
    render() {
        const { translation, loading, error, showOptions, showSettings, settings } = this.state;
        const hasPresetModel = gemini_service_1.MODEL_OPTIONS.some((model) => model.value === settings.model);
        const selectedModel = hasPresetModel ? settings.model : '__custom__';
        const isOllama = settings.provider === 'ollama';
        return (mailspring_exports_1.React.createElement("div", { className: "composer-translate-button" },
            mailspring_exports_1.React.createElement("div", { className: "translator-actions" },
                mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar", onClick: this._handleTranslate, disabled: loading, title: "Translate email content" }, loading ? 'Translating...' : 'Translate'),
                mailspring_exports_1.React.createElement("button", { className: "btn btn-toolbar", onClick: this._toggleSettings }, showSettings ? 'Close Settings' : 'Settings')),
            error && (mailspring_exports_1.React.createElement("div", { className: "translator-error" },
                mailspring_exports_1.React.createElement("span", null, error),
                mailspring_exports_1.React.createElement("button", { className: "btn btn-sm", onClick: this._handleClose }, "Close"))),
            translation && showOptions && (mailspring_exports_1.React.createElement("div", { className: "translator-options" },
                mailspring_exports_1.React.createElement(TranslationResult_1.default, { content: translation }),
                mailspring_exports_1.React.createElement("div", { className: "translator-options-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn btn-emphasis", onClick: this._handleReplace }, "Replace"),
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._handleClose }, "Close")))),
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
                    mailspring_exports_1.React.createElement("button", { className: "btn", onClick: this._toggleSettings }, "Cancel"))))));
    }
}
ComposerTranslateButton.displayName = 'ComposerTranslateButton';
exports.default = ComposerTranslateButton;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ29tcG9zZXJUcmFuc2xhdGVCdXR0b24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tcG9uZW50cy9Db21wb3NlclRyYW5zbGF0ZUJ1dHRvbi5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBQSwyREFBb0Q7QUFDcEQsNEVBQW9EO0FBQ3BELHNEQUkyQjtBQUUzQixNQUFxQix1QkFBd0IsU0FBUSwwQkFBSyxDQUFDLFNBQVM7SUFHbEUsWUFBWSxLQUFLO1FBQ2YsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBK0NmLHFCQUFnQixHQUFHLEtBQUssSUFBSSxFQUFFO1lBQzVCLE1BQU0sRUFBRSxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO1lBQzdCLE1BQU0sSUFBSSxHQUFHLEtBQUssSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7WUFDbkQsTUFBTSxTQUFTLEdBQUcseUNBQXdCLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFFbEUsTUFBTSxTQUFTLEdBQUcsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLENBQUM7WUFDMUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFFOUMsSUFBSSxDQUFDO2dCQUNILE1BQU0sTUFBTSxHQUFHLE1BQU0seUNBQXdCLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNuRSxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxTQUFTLEtBQUssSUFBSSxDQUFDLGdCQUFnQjtvQkFBRSxPQUFPO2dCQUVwRSxJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLGNBQWMsRUFBRSxDQUFDO29CQUM1QyxJQUFJLENBQUMsUUFBUSxDQUFDO3dCQUNaLFdB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