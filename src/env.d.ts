/// <reference types="astro/client" />
/// <reference types="astro/astro-jsx" />

interface ImportMetaEnv {
	readonly PUBLIC_AI_SEARCH_URL?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare namespace astroHTML.JSX {
	interface IntrinsicElements {
		'chat-bubble-snippet': astroHTML.JSX.HTMLAttributes & {
			'api-url'?: string;
			placeholder?: string;
			theme?: string;
			translations?: string;
			'chat-query-rewrite'?: string;
			'hide-branding'?: string;
		};
		'chat-page-snippet': astroHTML.JSX.HTMLAttributes & {
			'api-url'?: string;
			placeholder?: string;
			theme?: string;
			translations?: string;
			'chat-query-rewrite'?: string;
			'hide-branding'?: string;
		};
	}
}
