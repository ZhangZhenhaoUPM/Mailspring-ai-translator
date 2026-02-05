import { ComponentRegistry } from 'mailspring-exports';

import TranslateButton from './components/TranslateButton';
import ComposerTranslateButton from './components/ComposerTranslateButton';

export const config = {
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

export function activate() {
  ComponentRegistry.register(TranslateButton, {
    role: 'MessageFooterStatus'
  });

  ComponentRegistry.register(ComposerTranslateButton, {
    role: 'Composer:ActionButton'
  });
}

export function serialize() {}

export function deactivate() {
  ComponentRegistry.unregister(TranslateButton);
  ComponentRegistry.unregister(ComposerTranslateButton);
}
