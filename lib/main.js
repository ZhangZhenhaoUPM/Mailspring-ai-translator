"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.activate = activate;
exports.serialize = serialize;
exports.deactivate = deactivate;
const mailspring_exports_1 = require("mailspring-exports");
const TranslateButton_1 = __importDefault(require("./components/TranslateButton"));
const ComposerTranslateButton_1 = __importDefault(require("./components/ComposerTranslateButton"));
exports.config = {
    apiKey: {
        type: 'string',
        default: '',
        title: 'Gemini API Key',
        description: 'Create an API key in Google AI Studio and paste it here'
    },
    model: {
        type: 'string',
        default: 'gemini-2.5-flash',
        title: 'Gemini Model',
        description: 'Model name used for translation (for example: gemini-2.5-flash)'
    },
    targetLanguage: {
        type: 'string',
        default: 'zh-CN',
        enum: ['zh-CN', 'zh-TW', 'en', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'it', 'ar'],
        enumLabels: [
            '简体中文',
            '繁體中文',
            'English',
            '日本語',
            '한국어',
            'Español',
            'Français',
            'Deutsch',
            'Русский',
            'Português',
            'Italiano',
            'العربية'
        ],
        title: 'Target Language',
        description: 'Language to translate emails into'
    }
};
function activate() {
    mailspring_exports_1.ComponentRegistry.register(TranslateButton_1.default, {
        role: 'MessageFooterStatus'
    });
    mailspring_exports_1.ComponentRegistry.register(ComposerTranslateButton_1.default, {
        role: 'Composer:ActionButton'
    });
}
function serialize() { }
function deactivate() {
    mailspring_exports_1.ComponentRegistry.unregister(TranslateButton_1.default);
    mailspring_exports_1.ComponentRegistry.unregister(ComposerTranslateButton_1.default);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQXlDQSw0QkFRQztBQUVELDhCQUE4QjtBQUU5QixnQ0FHQztBQXhERCwyREFBdUQ7QUFFdkQsbUZBQTJEO0FBQzNELG1HQUEyRTtBQUU5RCxRQUFBLE1BQU0sR0FBRztJQUNwQixNQUFNLEVBQUU7UUFDTixJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxFQUFFO1FBQ1gsS0FBSyxFQUFFLGdCQUFnQjtRQUN2QixXQUFXLEVBQUUseURBQXlEO0tBQ3ZFO0lBQ0QsS0FBSyxFQUFFO1FBQ0wsSUFBSSxFQUFFLFFBQVE7UUFDZCxPQUFPLEVBQUUsa0JBQWtCO1FBQzNCLEtBQUssRUFBRSxjQUFjO1FBQ3JCLFdBQVcsRUFBRSxpRUFBaUU7S0FDL0U7SUFDRCxjQUFjLEVBQUU7UUFDZCxJQUFJLEVBQUUsUUFBUTtRQUNkLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLElBQUksRUFBRSxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDO1FBQ3BGLFVBQVUsRUFBRTtZQUNWLE1BQU07WUFDTixNQUFNO1lBQ04sU0FBUztZQUNULEtBQUs7WUFDTCxLQUFLO1lBQ0wsU0FBUztZQUNULFVBQVU7WUFDVixTQUFTO1lBQ1QsU0FBUztZQUNULFdBQVc7WUFDWCxVQUFVO1lBQ1YsU0FBUztTQUNWO1FBQ0QsS0FBSyxFQUFFLGlCQUFpQjtRQUN4QixXQUFXLEVBQUUsbUNBQW1DO0tBQ2pEO0NBQ0YsQ0FBQztBQUVGLFNBQWdCLFFBQVE7SUFDdEIsc0NBQWlCLENBQUMsUUFBUSxDQUFDLHlCQUFlLEVBQUU7UUFDMUMsSUFBSSxFQUFFLHFCQUFxQjtLQUM1QixDQUFDLENBQUM7SUFFSCxzQ0FBaUIsQ0FBQyxRQUFRLENBQUMsaUNBQXVCLEVBQUU7UUFDbEQsSUFBSSxFQUFFLHVCQUF1QjtLQUM5QixDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBZ0IsU0FBUyxLQUFJLENBQUM7QUFFOUIsU0FBZ0IsVUFBVTtJQUN4QixzQ0FBaUIsQ0FBQyxVQUFVLENBQUMseUJBQWUsQ0FBQyxDQUFDO0lBQzlDLHNDQUFpQixDQUFDLFVBQVUsQ0FBQyxpQ0FBdUIsQ0FBQyxDQUFDO0FBQ3hELENBQUMifQ==