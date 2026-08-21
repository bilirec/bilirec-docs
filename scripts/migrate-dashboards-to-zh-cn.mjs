/**
 * One-time (or re-runnable) helper: Traditional dashboard JSON → Simplified Chinese source.
 * Reads public/dashboards/*.json (legacy flat) or --from=zh-tw, writes public/dashboards/zh-cn/.
 *
 * Usage: node scripts/migrate-dashboards-to-zh-cn.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as OpenCC from 'opencc-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const destDir = path.join(root, 'public/dashboards/zh-cn');

const fromTw = OpenCC.Converter({ from: 'tw', to: 'cn' });

// Apply BEFORE OpenCC tw→cn. Order matters (longer phrases first).
const reverseFixes = [
	[/串流寫入/g, '直播流写入'],
	[/資料源/g, '数据源'],
	[/行程/g, '进程'],
	[/連線/g, '连接'],
	[/位元組/g, '字节'],
	[/訊息/g, '消息'],
	[/開啟的/g, '打开的'],
	[/迴歸/g, '回归'],
	[/錄製/g, '录制'],
	[/彈幕檔/g, '弹幕文件'],
	[/丟棄/g, '丢弃'],
	[/丟掉/g, '丢掉'],
	[/切檔/g, '切档'],
	[/時長/g, '时长'],
	[/條數/g, '条数'],
	[/場次/g, '场次'],
	[/累計/g, '累计'],
	[/趨勢/g, '趋势'],
	[/總覽/g, '总览'],
	[/掛載點/g, '挂载点'],
	[/讀取/g, '读取'],
	[/房間/g, '房间'],
	[/檔案/g, '文件'],
	[/記憶體/g, '内存'],
	[/磁碟/g, '磁盘'],
	[/預設/g, '默认'],
	[/程式/g, '程序'],
	[/寫入/g, '写入'],
	[/開播/g, '开播'],
	[/斷線/g, '断线'],
	[/現況/g, '现状'],
	[/區間/g, '区间'],
	[/佇列/g, '队列'],
	[/並發/g, '并发'],
	[/緩衝/g, '缓冲'],
	[/緩存/g, '缓存'],
	[/堆疊/g, '堆叠'],
	[/洩漏/g, '泄漏'],
	[/網址/g, '网址'],
	[/日曆日/g, '日历日'],
	[/預測/g, '预测'],
	[/預估/g, '预估'],
	[/設定/g, '设置'],
	[/變數/g, '变量'],
	[/網路/g, '网络'],
	[/目錄/g, '目录'],
	[/畫質/g, '画质'],
	[/介面/g, '界面'],
	[/伺服器/g, '服务器'],
	[/軟體/g, '软件'],
	[/啟動/g, '启动'],
	[/登入/g, '登录'],
	[/帳號/g, '账号'],
	[/密碼/g, '密码'],
	[/訂閱/g, '订阅'],
	[/轉換/g, '转换'],
	[/調優/g, '调优'],
	[/開發/g, '开发'],
	[/除錯/g, '调试'],
	[/建置/g, '构建'],
	[/編譯/g, '编译'],
	[/安裝/g, '安装'],
	[/遠端/g, '远程'],
	[/存取/g, '访问'],
	[/公開/g, '公开'],
	[/認證/g, '认证'],
	[/儲存/g, '存储'],
	[/後端/g, '后端'],
	[/直播間/g, '直播间'],
	[/影片/g, '视频'],
	[/磨損/g, '磨损'],
	[/機械硬碟/g, '机械硬盘'],
	[/固態硬碟/g, '固态硬盘'],
	[/載入/g, '加载'],
	[/嘗試/g, '尝试'],
	[/後台/g, '后台'],
];

// After OpenCC: fix leftovers that OpenCC may still output as traditional-ish CN
const postFixes = [
	[/资讯/g, '信息'], // OpenCC may turn 資訊→资讯; dashboard labels that were 訊息 already became 消息
];

function twToCn(text) {
	let result = text;
	for (const [pattern, replacement] of reverseFixes) {
		result = result.replace(pattern, replacement);
	}
	result = fromTw(result);
	for (const [pattern, replacement] of postFixes) {
		result = result.replace(pattern, replacement);
	}
	return result;
}

function findSources() {
	const flat = path.join(root, 'public/dashboards');
	const twDir = path.join(root, 'public/dashboards/zh-tw');
	const files = [];
	if (fs.existsSync(twDir)) {
		for (const name of fs.readdirSync(twDir).filter((n) => n.endsWith('.json'))) {
			files.push(path.join(twDir, name));
		}
	}
	if (files.length === 0) {
		for (const name of fs.readdirSync(flat).filter((n) => n.endsWith('.json'))) {
			files.push(path.join(flat, name));
		}
	}
	return files;
}

fs.mkdirSync(destDir, { recursive: true });
const sources = findSources();
if (sources.length === 0) {
	console.error('No dashboard JSON found to migrate.');
	process.exit(1);
}

for (const src of sources) {
	const name = path.basename(src);
	const content = fs.readFileSync(src, 'utf8');
	const converted = twToCn(content);
	JSON.parse(converted); // validate
	const dest = path.join(destDir, name);
	fs.writeFileSync(dest, converted, 'utf8');
	console.log(`Migrated → zh-cn/${name}`);
}
console.log('Done. Review zh-cn JSON, then run: pnpm convert:zh-tw');
