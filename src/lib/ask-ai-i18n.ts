export type AskAiLocale = 'zh-cn' | 'zh-tw';

const localeByLang = {
	'zh-cn': 'zh-cn',
	'zh-hans': 'zh-cn',
	'zh-tw': 'zh-tw',
	'zh-hant': 'zh-tw',
	'zh-hk': 'zh-tw',
} as const satisfies Record<string, AskAiLocale>;

const copy = {
	'zh-cn': {
		translations: {
			errorPrefix: '错误：',
			unknownError: '发生未知错误。',
			chatTitle: '问文档',
			chatPlaceholder: '用白话问配置或故障…',
			chatInputAriaLabel: '问文档输入框',
			sendButtonLabel: '发送',
			sendButtonAriaLabel: '发送问题',
			chatEmptyTitle: '问 Bilirec 文档',
			openChatAriaLabel: '打开文档问答',
			clearHistoryAriaLabel: '清除对话',
			minimizeAriaLabel: '缩小',
			closeAriaLabel: '关闭',
			historyTitle: '对话记录',
			newChatButton: '新对话',
			clearChatButton: '清空',
			toggleSidebarTitle: '展开或收起记录',
			deleteChatTitle: '删除对话',
			noChatsYet: '还没有对话',
			yesterday: '昨天',
			justNow: '刚刚',
			minuteAgo: '{n} 分钟前',
			minutesAgo: '{n} 分钟前',
			hourAgo: '{n} 小时前',
			hoursAgo: '{n} 小时前',
			poweredBy: '技术提供',
			poweredByLinkLabel: 'Cloudflare AI Search',
			loadingMessages: [
				'正在查找文档…',
				'对照配置说明…',
				'整理相关段落…',
				'差不多好了…',
			],
		},
		unavailableTitle: '问文档暂未开放',
		unavailableDescription: '这个预览环境还没有接上问答。正式站可以使用右下角的问文档。',
		expandAriaLabel: '全屏打开',
		closeFullscreenAriaLabel: '关闭全屏',
		chatEmptyDescription: (index: string) => `以文档为准。额度用完时请改读 ${index}`,
		quotaMessage: (index: string, full: string) =>
			[
				'今日站内问答额度已用完，或目前过于忙碌，暂时无法继续对话。',
				'',
				`请改读 [${index}](${index})（目录）或 [${full}](${full})（全文），把网址丢给 Cursor、ChatGPT 或 Claude 自行提问。这些文件是静态文档，不消耗站内额度。`,
			].join('\n'),
	},
	'zh-tw': {
		translations: {
			errorPrefix: '錯誤：',
			unknownError: '發生未知錯誤。',
			chatTitle: '問文檔',
			chatPlaceholder: '用白話問配置或故障…',
			chatInputAriaLabel: '問文檔輸入框',
			sendButtonLabel: '送出',
			sendButtonAriaLabel: '送出問題',
			chatEmptyTitle: '問 Bilirec 文檔',
			openChatAriaLabel: '打開文檔問答',
			clearHistoryAriaLabel: '清除對話',
			minimizeAriaLabel: '縮小',
			closeAriaLabel: '關閉',
			historyTitle: '對話紀錄',
			newChatButton: '新對話',
			clearChatButton: '清空',
			toggleSidebarTitle: '展開或收起紀錄',
			deleteChatTitle: '刪除對話',
			noChatsYet: '還沒有對話',
			yesterday: '昨天',
			justNow: '剛剛',
			minuteAgo: '{n} 分鐘前',
			minutesAgo: '{n} 分鐘前',
			hourAgo: '{n} 小時前',
			hoursAgo: '{n} 小時前',
			poweredBy: '技術提供',
			poweredByLinkLabel: 'Cloudflare AI Search',
			loadingMessages: [
				'正在查找文檔…',
				'對照配置說明…',
				'整理相關段落…',
				'幾乎好了…',
			],
		},
		unavailableTitle: '問文檔暫未開放',
		unavailableDescription: '這個預覽環境還沒有接上問答。正式站可以使用右下角的問文檔。',
		expandAriaLabel: '全螢幕打開',
		closeFullscreenAriaLabel: '關閉全螢幕',
		chatEmptyDescription: (index: string) => `以文檔為準。額度用完時請改讀 ${index}`,
		quotaMessage: (index: string, full: string) =>
			[
				'今日站內問答額度已用完，或目前過於忙碌，暫時無法繼續對話。',
				'',
				`請改讀 [${index}](${index})（目錄）或 [${full}](${full})（全文），把網址丟給 Cursor、ChatGPT 或 Claude 自行提問。這些檔案是靜態文檔，不消耗站內額度。`,
			].join('\n'),
	},
} as const;

export function aiSearchApiUrl(rawUrl: string): string {
	return rawUrl.endsWith('/') ? rawUrl : `${rawUrl}/`;
}

export function dialogCopy(locale: AskAiLocale) {
	const strings = copy[locale];
	return {
		title: strings.translations.chatTitle,
		expandAriaLabel: strings.expandAriaLabel,
		closeFullscreenAriaLabel: strings.closeFullscreenAriaLabel,
	};
}

export function askAiLocale(lang: string | undefined): AskAiLocale {
	const normalized = (lang ?? '').toLowerCase().replaceAll('_', '-');
	return localeByLang[normalized as keyof typeof localeByLang] ?? 'zh-cn';
}

export function llmsUrls(origin: string) {
	const base = origin.replace(/\/$/, '');
	return {
		index: `${base}/llms.txt`,
		full: `${base}/llms-full.txt`,
	};
}

export function quotaMessage(locale: AskAiLocale, origin: string): string {
	const { index, full } = llmsUrls(origin);
	return copy[locale].quotaMessage(index, full);
}

export function chatTranslations(locale: AskAiLocale, origin: string) {
	const { index } = llmsUrls(origin);
	const strings = copy[locale];
	return {
		...strings.translations,
		loadingMessages: [...strings.translations.loadingMessages],
		chatEmptyDescription: strings.chatEmptyDescription(index),
	};
}
