import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsSrcDir = path.join(__dirname, '../src/content/docs/zh-cn');
const docsDestDir = path.join(__dirname, '../src/content/docs/zh-tw');
const dashSrcDir = path.join(__dirname, '../public/dashboards/zh-cn');
const dashDestDir = path.join(__dirname, '../public/dashboards/zh-tw');

const converter = OpenCC.Converter({ from: 'cn', to: 'tw' });

// Apply on simplified Chinese before OpenCC (OpenCC would turn 登录→登錄, 服务器→服務器, etc.)
const termFixes = [
	[/录制/g, '錄製'],
	[/录播/g, '錄播'],
	[/配置/g, '設定'],
	[/后端/g, '後端'],
	[/直播间/g, '直播間'],
	[/服务器/g, '伺服器'],
	[/网络/g, '網路'],
	[/软件/g, '軟體'],
	[/磁盘/g, '磁碟'],
	[/内存/g, '記憶體'],
	[/默认/g, '預設'],
	[/启动/g, '啟動'],
	[/登录/g, '登入'],
	[/程序/g, '程式'],
	[/账号/g, '帳號'],
	[/密码/g, '密碼'],
	[/文件/g, '檔案'],
	[/目录/g, '目錄'],
	[/视频/g, '影片'],
	[/画质/g, '畫質'],
	[/订阅/g, '訂閱'],
	[/通知/g, '通知'],
	[/转换/g, '轉換'],
	[/调优/g, '調優'],
	[/开发/g, '開發'],
	[/调试/g, '除錯'],
	[/构建/g, '建置'],
	[/编译/g, '編譯'],
	[/安装/g, '安裝'],
	[/界面/g, '介面'],
	[/远程/g, '遠端'],
	[/访问/g, '存取'],
	[/公开/g, '公開'],
	[/认证/g, '認證'],
	[/并发/g, '並發'],
	[/缓冲/g, '緩衝'],
	[/写入/g, '寫入'],
	[/磨损/g, '磨損'],
	[/树莓派/g, '樹莓派'],
	[/机械硬盘/g, '機械硬碟'],
	[/固态硬盘/g, '固態硬碟'],
	// Taiwan terminology (apply before OpenCC to avoid wrong variants like 設置/加載/嚐試)
	[/设置/g, '設定'],
	[/变量/g, '變數'],
	[/加载/g, '載入'],
	[/尝试/g, '嘗試'],
	[/后台/g, '後台'],
	[/存储/g, '儲存'],
	[/平台/g, '平台'],
	// Grafana / monitoring terminology (align with dashboard zh-tw)
	[/数据源/g, '資料源'],
	[/进程资源/g, '行程資源'],
	[/连线/g, '連線'],
];

// Dashboard UI terms — must run before OpenCC; order matters for multi-char phrases.
const dashboardTermFixes = [
	[/直播流写入/g, '串流寫入'],
	[/数据源/g, '資料源'],
	[/进程/g, '行程'],
	[/连接/g, '連線'],
	[/字节/g, '位元組'],
	[/消息/g, '訊息'],
	[/打开的/g, '開啟的'],
	[/回归/g, '迴歸'],
	[/丢弃/g, '丟棄'],
	[/丢掉/g, '丟掉'],
	[/切档/g, '切檔'],
	[/时长/g, '時長'],
	[/条数/g, '條數'],
	[/场次/g, '場次'],
	[/累计/g, '累計'],
	[/趋势/g, '趨勢'],
	[/总览/g, '總覽'],
	[/挂载点/g, '掛載點'],
	[/读取/g, '讀取'],
	[/房间/g, '房間'],
	[/弹幕文件/g, '彈幕檔'],
	[/开播/g, '開播'],
	[/断线/g, '斷線'],
	[/现状/g, '現況'],
	[/区间/g, '區間'],
	[/队列/g, '佇列'],
	[/缓存/g, '緩存'],
	[/堆叠/g, '堆疊'],
	[/泄漏/g, '洩漏'],
	[/句柄/g, '句柄'],
	[/使用者/g, '使用者'],
	[/网址/g, '網址'],
	[/日历日/g, '日曆日'],
	[/预测/g, '預測'],
	[/预估/g, '預估'],
	[/斜率/g, '斜率'],
];

// Safety net after OpenCC for terms that may still slip through
const postTermFixes = [
	[/登錄/g, '登入'],
	[/服務器/g, '伺服器'],
	[/程序/g, '程式'],
	// OpenCC mis-converts 只 → 隻 before 影/會 (e.g. 只影响 → 隻影響, 改大只会 → 改大隻會)
	[/隻/g, '只'],
	// OpenCC phrase bugs & terms missed by pre-fixes
	[/嚐試/g, '嘗試'],
	[/設置/g, '設定'],
	[/變量/g, '變數'],
	[/加載/g, '載入'],
	[/後臺/g, '後台'],
	[/存儲/g, '儲存'],
	[/平臺/g, '平台'],
	[/一臺/g, '一台'],
	[/瞭解/g, '了解'],
	[/數據源/g, '資料源'],
];

// Dashboard-only OpenCC leftovers (do not apply to docs)
const dashboardPostTermFixes = [
	[/數據源/g, '資料源'],
	[/進程/g, '行程'],
	[/連接/g, '連線'],
	[/字節/g, '位元組'],
	[/打開的/g, '開啟的'],
	[/回歸/g, '迴歸'],
	[/佔用/g, '占用'],
	[/牆鍾/g, '牆鐘'],
];

const pathFixes = [[/zh-cn/g, 'zh-tw']];

function convertText(text, { dashboards = false } = {}) {
	let result = text;
	// Dashboard phrases that contain characters also covered by termFixes
	// (写入、文件) must run first, otherwise 直播流写入 / 弹幕文件 break apart.
	if (dashboards) {
		for (const [pattern, replacement] of dashboardTermFixes) {
			result = result.replace(pattern, replacement);
		}
	}
	for (const [pattern, replacement] of termFixes) {
		result = result.replace(pattern, replacement);
	}
	result = converter(result);
	for (const [pattern, replacement] of postTermFixes) {
		result = result.replace(pattern, replacement);
	}
	if (dashboards) {
		for (const [pattern, replacement] of dashboardPostTermFixes) {
			result = result.replace(pattern, replacement);
		}
	}
	for (const [pattern, replacement] of pathFixes) {
		result = result.replace(pattern, replacement);
	}
	return result;
}

function walkDocs(dir) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const srcPath = path.join(dir, entry.name);
		const rel = path.relative(docsSrcDir, srcPath);
		const destPath = path.join(docsDestDir, rel);
		if (entry.isDirectory()) {
			fs.mkdirSync(destPath, { recursive: true });
			walkDocs(srcPath);
		} else if (entry.name.endsWith('.mdx') || entry.name.endsWith('.md')) {
			const content = fs.readFileSync(srcPath, 'utf8');
			fs.mkdirSync(path.dirname(destPath), { recursive: true });
			fs.writeFileSync(destPath, convertText(content), 'utf8');
			console.log(`Converted docs: ${rel}`);
		}
	}
}

/** Remove zh-tw pages with no matching zh-cn source (e.g. after moves/deletes). */
function pruneOrphans(dir, srcRoot, destRoot) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const destPath = path.join(dir, entry.name);
		const rel = path.relative(destRoot, destPath);
		const srcPath = path.join(srcRoot, rel);
		if (entry.isDirectory()) {
			pruneOrphans(destPath, srcRoot, destRoot);
			if (fs.readdirSync(destPath).length === 0) {
				fs.rmdirSync(destPath);
				console.log(`Removed empty dir: ${rel}`);
			}
		} else if (
			entry.name.endsWith('.mdx') ||
			entry.name.endsWith('.md') ||
			entry.name.endsWith('.json')
		) {
			if (!fs.existsSync(srcPath)) {
				fs.unlinkSync(destPath);
				console.log(`Removed orphan: ${rel}`);
			}
		}
	}
}

function convertDashboards() {
	if (!fs.existsSync(dashSrcDir)) {
		console.log('No public/dashboards/zh-cn — skip dashboard conversion.');
		return;
	}
	fs.mkdirSync(dashDestDir, { recursive: true });
	for (const entry of fs.readdirSync(dashSrcDir, { withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
		const srcPath = path.join(dashSrcDir, entry.name);
		const destPath = path.join(dashDestDir, entry.name);
		const content = fs.readFileSync(srcPath, 'utf8');
		const converted = convertText(content, { dashboards: true });
		// Validate JSON still parses
		JSON.parse(converted);
		fs.writeFileSync(destPath, converted, 'utf8');
		console.log(`Converted dashboard: ${entry.name}`);
	}
	pruneOrphans(dashDestDir, dashSrcDir, dashDestDir);
}

fs.mkdirSync(docsDestDir, { recursive: true });
walkDocs(docsSrcDir);
pruneOrphans(docsDestDir, docsSrcDir, docsDestDir);
convertDashboards();
console.log('Done.');
