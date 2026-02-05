"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mailspring_exports_1 = require("mailspring-exports");
class TranslationResult extends mailspring_exports_1.React.Component {
    constructor() {
        super(...arguments);
        this._handleCopy = () => {
            const { content, html } = this.props;
            const value = html
                ? (() => {
                    const container = document.createElement('div');
                    container.innerHTML = html;
                    return container.textContent || '';
                })()
                : content || '';
            if (!value)
                return;
            const textarea = document.createElement('textarea');
            textarea.value = value;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        };
    }
    render() {
        const { content, html, onClose, title } = this.props;
        const isHtml = Boolean(html);
        const contentClass = isHtml
            ? 'translator-result-content is-html'
            : 'translator-result-content';
        return (mailspring_exports_1.React.createElement("div", { className: "translator-result" },
            mailspring_exports_1.React.createElement("div", { className: "translator-result-header" },
                mailspring_exports_1.React.createElement("span", { className: "translator-result-title" }, title || 'Translation'),
                mailspring_exports_1.React.createElement("div", { className: "translator-result-actions" },
                    mailspring_exports_1.React.createElement("button", { className: "btn btn-sm", onClick: this._handleCopy }, "Copy"),
                    onClose && (mailspring_exports_1.React.createElement("button", { className: "btn btn-sm", onClick: onClose }, "Close")))),
            isHtml ? (mailspring_exports_1.React.createElement("div", { className: contentClass, dangerouslySetInnerHTML: { __html: html } })) : (mailspring_exports_1.React.createElement("div", { className: contentClass }, content))));
    }
}
TranslationResult.displayName = 'TranslationResult';
exports.default = TranslationResult;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHJhbnNsYXRpb25SZXN1bHQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvY29tcG9uZW50cy9UcmFuc2xhdGlvblJlc3VsdC5qc3giXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFBQSwyREFBMkM7QUFFM0MsTUFBcUIsaUJBQWtCLFNBQVEsMEJBQUssQ0FBQyxTQUFTO0lBQTlEOztRQUdFLGdCQUFXLEdBQUcsR0FBRyxFQUFFO1lBQ2pCLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUNyQyxNQUFNLEtBQUssR0FBRyxJQUFJO2dCQUNoQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUU7b0JBQ0osTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEQsU0FBUyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7b0JBQzNCLE9BQU8sU0FBUyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7Z0JBQ3JDLENBQUMsQ0FBQyxFQUFFO2dCQUNOLENBQUMsQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO1lBRWxCLElBQUksQ0FBQyxLQUFLO2dCQUFFLE9BQU87WUFFbkIsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUNwRCxRQUFRLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztZQUN2QixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDbEIsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUM3QixRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0QyxDQUFDLENBQUM7SUFtQ0osQ0FBQztJQWpDQyxNQUFNO1FBQ0osTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDckQsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzdCLE1BQU0sWUFBWSxHQUFHLE1BQU07WUFDekIsQ0FBQyxDQUFDLG1DQUFtQztZQUNyQyxDQUFDLENBQUMsMkJBQTJCLENBQUM7UUFFaEMsT0FBTyxDQUNMLGtEQUFLLFNBQVMsRUFBQyxtQkFBbUI7WUFDaEMsa0RBQUssU0FBUyxFQUFDLDBCQUEwQjtnQkFDdkMsbURBQU0sU0FBUyxFQUFDLHlCQUF5QixJQUFFLEtBQUssSUFBSSxhQUFhLENBQVE7Z0JBQ3pFLGtEQUFLLFNBQVMsRUFBQywyQkFBMkI7b0JBQ3hDLHFEQUFRLFNBQVMsRUFBQyxZQUFZLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxXQUFXLFdBRS9DO29CQUNSLE9BQU8sSUFBSSxDQUNWLHFEQUFRLFNBQVMsRUFBQyxZQUFZLEVBQUMsT0FBTyxFQUFFLE9BQU8sWUFFdEMsQ0FDVixDQUNHLENBQ0Y7WUFDTCxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQ1Isa0RBQ0UsU0FBUyxFQUFFLFlBQVksRUFDdkIsdUJBQXVCLEVBQUUsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQ3pDLENBQ0gsQ0FBQyxDQUFDLENBQUMsQ0FDRixrREFBSyxTQUFTLEVBQUUsWUFBWSxJQUFHLE9BQU8sQ0FBTyxDQUM5QyxDQUNHLENBQ1AsQ0FBQztJQUNKLENBQUM7O0FBdERNLDZCQUFXLEdBQUcsbUJBQW1CLEFBQXRCLENBQXVCO2tCQUR0QixpQkFBaUIifQ==