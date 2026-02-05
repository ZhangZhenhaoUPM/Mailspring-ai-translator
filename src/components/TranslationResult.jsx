import { React } from 'mailspring-exports';

export default class TranslationResult extends React.Component {
  static displayName = 'TranslationResult';

  _handleCopy = () => {
    const { content, html } = this.props;
    const value = html
      ? (() => {
          const container = document.createElement('div');
          container.innerHTML = html;
          return container.textContent || '';
        })()
      : content || '';

    if (!value) return;

    const textarea = document.createElement('textarea');
    textarea.value = value;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  render() {
    const { content, html, onClose, title } = this.props;
    const isHtml = Boolean(html);
    const contentClass = isHtml
      ? 'translator-result-content is-html'
      : 'translator-result-content';

    return (
      <div className="translator-result">
        <div className="translator-result-header">
          <span className="translator-result-title">{title || 'Translation'}</span>
          <div className="translator-result-actions">
            <button className="btn btn-sm" onClick={this._handleCopy}>
              Copy
            </button>
            {onClose && (
              <button className="btn btn-sm" onClick={onClose}>
                Close
              </button>
            )}
          </div>
        </div>
        {isHtml ? (
          <div
            className={contentClass}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <div className={contentClass}>{content}</div>
        )}
      </div>
    );
  }
}
