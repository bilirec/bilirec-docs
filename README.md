# bilirec-docs

[Bilirec](https://github.com/bilirec/bilirec) 官方文檔站，基於 [Astro Starlight](https://starlight.astro.build/) 構建。

線上地址：[www.bilirec.org](https://www.bilirec.org)

## 開發

需安裝 [pnpm](https://pnpm.io/)。本地開發直接用終端指令即可，無需 VS Code `launch.json`：

```bash
pnpm install
pnpm dev        # http://localhost:4321
```

## 構建

```bash
pnpm build
pnpm preview
```

## 簡繁轉換

繁體中文內容由簡體自動轉換生成：

```bash
pnpm convert:zh-tw
```

## 部署

推送到 `main` 分支後，GitHub Actions 自動部署至 Cloudflare Pages。

需在倉庫 Secrets 中配置：

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

站內「問文檔」另外需要**建置時**的 `PUBLIC_AI_SEARCH_URL`（Cloudflare Pages / Workers 的建置環境變數，例如 `https://llm.bilirec.org/`）。這是給瀏覽器打的公開 URL，不必當密鑰。未設定時不渲染右下角氣泡；`/llms.txt`、`/llms-small.txt` 與 `/llms-full.txt` 仍會產出，可供 Cursor / ChatGPT 讀取。

## 相關項目

- [bilirec](https://github.com/bilirec/bilirec) — 錄播後端
- [bilirec-web](https://github.com/bilirec/bilirec-web) — Web 管理界面（PWA）
- [bilirec-mobile](https://github.com/bilirec/bilirec-mobile) — Android 客戶端
