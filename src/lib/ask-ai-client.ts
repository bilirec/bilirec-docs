import '@cloudflare/ai-search-snippet/chat';
import { askAiLocale, chatTranslations, quotaMessage } from './ask-ai-i18n';

type AskAiSnippet = HTMLElement & {
	translations: ReturnType<typeof chatTranslations>;
};

declare global {
	interface Window {
		__bilirecAiSearchQuotaGuard?: boolean;
	}
}

const SNIPPET_SELECTOR = 'chat-bubble-snippet, chat-page-snippet';
const EXPAND_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
	<polyline points="15 3 21 3 21 9"></polyline>
	<polyline points="9 21 3 21 3 15"></polyline>
	<line x1="21" y1="3" x2="14" y2="10"></line>
	<line x1="3" y1="21" x2="10" y2="14"></line>
</svg>`;

function requestUrl(input: RequestInfo | URL): string {
	if (typeof input === 'string') {
		return input;
	}
	if (input instanceof URL) {
		return input.href;
	}
	if (input instanceof Request) {
		return input.url;
	}
	return String(input);
}

function snippetApiOrigin(): string | undefined {
	const apiUrl = document.querySelector(SNIPPET_SELECTOR)?.getAttribute('api-url');
	if (!apiUrl) {
		return undefined;
	}
	try {
		return new URL(apiUrl).origin;
	} catch {
		return undefined;
	}
}

function isAiSearchChat(url: string): boolean {
	try {
		const parsed = new URL(url);
		if (!parsed.pathname.includes('/chat/completions')) {
			return false;
		}
		if (parsed.hostname === 'search.ai.cloudflare.com' || parsed.hostname.endsWith('.search.ai.cloudflare.com')) {
			return true;
		}
		const origin = snippetApiOrigin();
		return Boolean(origin) && parsed.origin === origin;
	} catch {
		return false;
	}
}

function quotaSseResponse(message: string): Response {
	const payload = JSON.stringify({
		choices: [{ delta: { content: message } }],
	});
	const body = `data: ${payload}\n\n` + `data: [DONE]\n\n`;
	return new Response(body, {
		status: 200,
		headers: {
			'Content-Type': 'text/event-stream; charset=utf-8',
			'Cache-Control': 'no-store',
		},
	});
}

function installQuotaGuard(message: string) {
	if (window.__bilirecAiSearchQuotaGuard) {
		return;
	}
	window.__bilirecAiSearchQuotaGuard = true;

	const originalFetch = window.fetch.bind(window);
	window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
		const response = await originalFetch(input, init);
		if (response.status !== 429) {
			return response;
		}
		if (!isAiSearchChat(requestUrl(input))) {
			return response;
		}
		void response.body?.cancel();
		return quotaSseResponse(message);
	};
}

function syncSnippetTheme(element: HTMLElement) {
	const apply = () => {
		const theme = document.documentElement.dataset.theme;
		if (theme === 'dark' || theme === 'light') {
			element.setAttribute('theme', theme);
		}
	};
	apply();
	new MutationObserver(apply).observe(document.documentElement, {
		attributes: true,
		attributeFilter: ['data-theme'],
	});
}

function snippetElements(): AskAiSnippet[] {
	return [...document.querySelectorAll(SNIPPET_SELECTOR)] as AskAiSnippet[];
}

function prepareSnippet(element: AskAiSnippet, translations: ReturnType<typeof chatTranslations>) {
	if (element.dataset.bilirecAskAiReady === '1') {
		return;
	}
	element.dataset.bilirecAskAiReady = '1';
	element.translations = translations;
	syncSnippetTheme(element);
}

function minimizeBubble(bubble: HTMLElement) {
	const minimize = bubble.shadowRoot?.querySelector<HTMLButtonElement>('.minimize-button');
	minimize?.click();
}

function injectExpandButton(bubble: HTMLElement, dialog: HTMLDialogElement) {
	const root = bubble.shadowRoot;
	const actions = root?.querySelector('.chat-header-actions');
	if (!actions || actions.querySelector('.bilirec-expand-button')) {
		return;
	}

	const button = document.createElement('button');
	button.type = 'button';
	button.className = 'icon-button bilirec-expand-button';
	button.setAttribute('aria-label', bubble.dataset.expandLabel || '全屏打开');
	button.innerHTML = EXPAND_ICON;
	button.addEventListener('click', (event) => {
		event.preventDefault();
		event.stopPropagation();
		minimizeBubble(bubble);
		if (!dialog.open) {
			dialog.showModal();
		}
	});

	const minimize = actions.querySelector('.minimize-button');
	actions.insertBefore(button, minimize);
}

function watchExpandButton(bubble: HTMLElement, dialog: HTMLDialogElement) {
	injectExpandButton(bubble, dialog);
	if (bubble.dataset.bilirecExpandWatch === '1') {
		return;
	}
	bubble.dataset.bilirecExpandWatch = '1';

	const observeRoot = () => {
		injectExpandButton(bubble, dialog);
		const root = bubble.shadowRoot;
		if (!root) {
			return;
		}
		new MutationObserver(() => injectExpandButton(bubble, dialog)).observe(root, {
			childList: true,
			subtree: true,
		});
	};

	if (bubble.shadowRoot) {
		observeRoot();
		return;
	}

	new MutationObserver((_, observer) => {
		if (bubble.shadowRoot) {
			observer.disconnect();
			observeRoot();
		}
	}).observe(bubble, { childList: true, subtree: true });
}

function bindDialog(dialog: HTMLDialogElement) {
	if (dialog.dataset.bilirecAskAiReady === '1') {
		return;
	}
	dialog.dataset.bilirecAskAiReady = '1';

	dialog.querySelector('.bilirec-ask-ai-dialog__close')?.addEventListener('click', () => {
		dialog.close();
	});

	dialog.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			dialog.close();
		}
	});
}

function boot() {
	const elements = snippetElements();
	if (elements.length === 0) {
		return;
	}

	const locale = askAiLocale(document.documentElement.lang);
	const origin = window.location.origin;
	const translations = chatTranslations(locale, origin);
	installQuotaGuard(quotaMessage(locale, origin));
	for (const element of elements) {
		prepareSnippet(element, translations);
	}

	const dialog = document.querySelector<HTMLDialogElement>('.bilirec-ask-ai-dialog');
	const bubble = document.querySelector<HTMLElement>('chat-bubble-snippet.bilirec-ask-ai');
	if (dialog) {
		bindDialog(dialog);
	}
	if (dialog && bubble) {
		watchExpandButton(bubble, dialog);
	}
}

boot();
document.addEventListener('astro:page-load', boot);
