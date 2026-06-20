// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import starlight from '@astrojs/starlight';
import tailwindcss from '@tailwindcss/vite';

const sidebar = [
	{
		label: '开始使用',
		translations: { 'zh-tw': '開始使用' },
		items: [
			{ slug: 'index' },
			{ slug: 'guides/ecosystem' },
			{ slug: 'guides/installation' },
			{ slug: 'guides/quick-start' },
			{ slug: 'guides/faq' },
		],
	},
	{
		label: '使用指南',
		translations: { 'zh-tw': '使用指南' },
		items: [
			{ slug: 'guides/web-ui' },
			{ slug: 'guides/recording' },
			{ slug: 'guides/performance-benchmark' },
			{ slug: 'guides/file-management' },
			{ slug: 'guides/frp' },
			{ slug: 'guides/android' },
			{ slug: 'guides/android-library' },
			{ slug: 'guides/docker' },
		],
	},
	{
		label: '配置与调优',
		translations: { 'zh-tw': '配置與調優' },
		items: [
			{ slug: 'configuration/overview' },
			{ slug: 'configuration/env-reference' },
			{ slug: 'configuration/examples' },
			{ slug: 'configuration/server-network' },
			{ slug: 'configuration/frp' },
			{ slug: 'configuration/recording' },
			{ slug: 'configuration/conversion' },
			{ slug: 'configuration/auth-security' },
			{ slug: 'configuration/notifications' },
			{ slug: 'configuration/io-tuning' },
			{ slug: 'configuration/pi5-defaults' },
			{ slug: 'configuration/high-bitrate-tuning' },
			{ slug: 'configuration/memory-estimation' },
			{ slug: 'configuration/ssd-tuning' },
			{ slug: 'configuration/hdd-nas-tuning' },
			{ slug: 'configuration/android-defaults' },
		],
	},
	{
		label: 'REST API',
		items: [
			{ slug: 'api/overview' },
			{ slug: 'api/auth' },
			{ slug: 'api/bilibili-auth' },
			{ slug: 'api/record' },
			{ slug: 'api/room' },
			{ slug: 'api/files' },
			{ slug: 'api/convert' },
			{ slug: 'api/notify' },
		],
	},
	{
		label: '开发参考',
		translations: { 'zh-tw': '開發參考' },
		collapsed: true,
		items: [
			{ slug: 'development/architecture' },
			{ slug: 'development/debugging' },
			{ slug: 'development/build-from-source' },
		],
	},
];

// https://astro.build/config
export default defineConfig({
	site: 'https://www.bilirec.org',
	vite: {
		plugins: [tailwindcss()],
	},
	markdown: {
		// Top-level gfm/smartypants are required for @astrojs/mdx (Starlight .mdx files).
		// processor.unified() alone does not pass gfm into the MDX pipeline.
		gfm: true,
		smartypants: true,
		processor: unified({
			gfm: true,
			smartypants: true,
		}),
	},
	redirects: {
		'/': '/zh-cn'
	},
	integrations: [
		starlight({
			title: 'Bilirec',
			description: '专为低配设备优化的高性能 Bilibili 直播录制后端',
			defaultLocale: 'zh-cn',
			locales: {
				'zh-cn': {
					label: '简体中文',
					lang: 'zh-CN',
				},
				'zh-tw': {
					label: '繁體中文',
					lang: 'zh-TW',
				},
			},
			logo: {
				src: './src/assets/logo.svg',
			},
			favicon: '/favicon.svg',
			customCss: ['./src/styles/tailwind.css', './src/styles/custom.css'],
			social: [
				{
					icon: 'github',
					label: 'GitHub',
					href: 'https://github.com/bilirec/bilirec',
				},
			],
			editLink: {
				baseUrl: 'https://github.com/bilirec/bilirec-docs/edit/main/',
			},
			sidebar,
		}),
	],
});
