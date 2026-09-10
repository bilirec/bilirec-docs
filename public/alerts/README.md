# Grafana alert rules（依既有資料夾拆分）

Grafana 匯入 Prometheus YAML 時：

1. YAML 頂層 `namespace` = **資料夾標題**（已寫在各檔）
2. 若沒有 `namespace`，會用**完整檔名**（例如 `bilirec.yml`）當 namespace
3. 若再選 Target folder，會建成 **`Target / namespace`**（例如 `Bilirec/bilirec.yml`）

因此：**Target folder 留空**，靠檔內 `namespace` 進既有 `Bilirec` / `Network` / `Storage`。

| 檔案 | 檔內 `namespace` | Target folder |
|------|------------------|---------------|
| [`bilirec.yml`](./bilirec.yml) | `Bilirec` | **留空** |
| [`network.yml`](./network.yml) | `Network` | **留空** |
| [`storage.yml`](./storage.yml) | `Storage` | **留空** |

## 匯入步驟

1. 刪掉誤建的巢狀資料夾（例如 `Bilirec/bilirec.yml`）
2. 部署含 `bilirec_room_recording_recovering` 的 bilirec（再匯 bilirec.yml）
3. Alerting → Alert rules → **Import to Grafana-managed rules** → Prometheus YAML
4. 上傳檔案；**Target folder 不要選**（保持空）
5. Data source 選平常查指標的那個
6. 三個檔各匯一次（同 folder + group 時會依穩定 UID 更新／覆蓋）
7. 手動設 No data = **Alerting**（Error 維持 OK）：
   - BilirecDown
   - ExporterDown
   - UnifiControllerDown

## 房間類通知文案

房間告警會 join `bilirec_room_info`，摘要用主播名（`uname`）加房間號。`BilirecGaveUpRecording` 另外按 `reason` 聚合，並把封禁／加密／重試用盡／路數已滿寫成人話，避免看起來像程式自己放棄。

若 Discord 標題仍只顯示房間號，把 contact point 的 title 改成優先 `uname`：

```
{{ if eq .Status "firing" }}🔴{{ else }}🟢{{ end }} {{ .CommonLabels.alertname }}{{ with .CommonLabels.uname }} · {{ . }}{{ else }}{{ with .CommonLabels.room_id }} · {{ . }}{{ end }}{{ end }}
```

## 相對舊規則的修正

- BilirecRecordingWithoutStream / BilirecGaveUpRecording / BilirecVictoriaLogsQueueGrow / BilirecConvertBacklog（僅無錄製且 pending>1）
- ExporterDown（去掉 bilirec）、WanPortErrors、SAS PHY、Smart*、DiskTemperature、ZilCommitErrors
- ZpoolNotOnline / ZfsPoolSpaceLow 查證後維持原樣
