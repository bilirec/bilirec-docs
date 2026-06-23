import { rehypeFormatTables } from '../plugins/rehype-format-tables.mjs';

/** Append table formatting after Starlight's markdown pipeline. */
export function bilirecMarkdownTables() {
	return {
		name: 'bilirec-markdown-tables',
		hooks: {
			'astro:config:setup': ({ config, updateConfig }) => {
				updateConfig({
					markdown: {
						rehypePlugins: [
							...(config.markdown?.rehypePlugins ?? []),
							rehypeFormatTables,
						],
					},
				});
			},
		},
	};
}
