#!/usr/bin/env python3
"""Reflow Grafana dashboard panels for portrait-friendly layout.

Rules (KPI row style from bilirec-overview, but rows always fill w=24):
- KPI/stat/gauge: 4 per row (w=6); up to 5 per row when needed; exactly 6 → 3x2
- timeseries/graph: max 2 per row, w=12 (solo may use w=24)
- logs panels: always one per row, w=24
- state-timeline solo charts may use w=24
- row headers: h=1, w=24

bilirec-overview.json is never modified (reference layout).
"""

from __future__ import annotations

import json
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "public" / "dashboards" / "zh-cn"

KPI_TYPES = {"stat", "gauge"}
TREND_TYPES = {"timeseries", "graph"}
ROW_TYPE = "row"
FULL_WIDTH_SOLO = {"state-timeline", "logs"}


def panel_key(panel: dict) -> tuple:
    gp = panel.get("gridPos", {})
    return (gp.get("y", 0), gp.get("x", 0), panel.get("id", 0))


def is_kpi(panel: dict) -> bool:
    return panel.get("type") in KPI_TYPES


def is_trend(panel: dict) -> bool:
    return panel.get("type") in TREND_TYPES


def is_row(panel: dict) -> bool:
    return panel.get("type") == ROW_TYPE


def widths_for_row(count: int) -> list[int]:
    """Panel widths that sum to 24 with no gap."""
    if count <= 0:
        return []
    if count == 1:
        return [24]
    if count == 2:
        return [12, 12]
    if count == 3:
        return [8, 8, 8]
    if count == 4:
        return [6, 6, 6, 6]
    if count == 5:
        base, rem = divmod(24, 5)
        return [base + (1 if i < rem else 0) for i in range(5)]
    raise ValueError(f"unsupported KPI row count: {count} (max 5 per row)")


def split_kpi_rows(total: int) -> list[int]:
    """Split KPI count: 4/row default, up to 5/row when needed, exactly 6 → 3x2."""
    if total <= 0:
        return []
    if total <= 4:
        return [total]
    if total == 5:
        return [5]
    if total == 6:
        return [3, 3]
    full_fours = total // 4
    rem = total % 4
    if rem == 0:
        return [4] * full_fours
    if rem == 1:
        return [4] * (full_fours - 1) + [5]
    if rem == 2:
        return [4] * full_fours + [2]
    return [4] * full_fours + [3]


def pack_kpis(panels: list[dict], y: int) -> int:
    if not panels:
        return y
    h = panels[0].get("gridPos", {}).get("h", 4)
    idx = 0
    for count in split_kpi_rows(len(panels)):
        widths = widths_for_row(count)
        x = 0
        for w in widths:
            panels[idx]["gridPos"] = {"h": h, "w": w, "x": x, "y": y}
            x += w
            idx += 1
        y += h
    return y


def pack_trends(panels: list[dict], y: int, h: int = 8) -> int:
    if len(panels) == 1:
        panels[0]["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
        return y + h
    for i, panel in enumerate(panels):
        panel["gridPos"] = {"h": h, "w": 12, "x": (i % 2) * 12, "y": y + (i // 2) * h}
    rows_used = (len(panels) + 1) // 2
    return y + rows_used * h


def pack_full_width_stack(panels: list[dict], y: int) -> int:
    """Stack panels vertically, each full width."""
    for panel in panels:
        h = panel.get("gridPos", {}).get("h", 8)
        panel["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
        y += h
    return y


def pack_pair(panels: list[dict], y: int, h: int) -> int:
    """Place up to 2 panels at w=12; leftover uses w=24 on next row."""
    if not panels:
        return y
    if len(panels) == 1:
        panels[0]["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
        return y + h
    panels[0]["gridPos"] = {"h": h, "w": 12, "x": 0, "y": y}
    panels[1]["gridPos"] = {"h": h, "w": 12, "x": 12, "y": y}
    y += h
    for panel in panels[2:]:
        panel["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
        y += h
    return y


def pack_mixed_twelve(panels: list[dict], y: int, h: int) -> int:
    return pack_pair(panels, y, h)


def reflow_sections(panels: list[dict]) -> list[dict]:
    panels = sorted(panels, key=panel_key)
    out: list[dict] = []
    i = 0
    y = 0

    while i < len(panels):
        panel = panels[i]
        if is_row(panel):
            panel["gridPos"] = {"h": 1, "w": 24, "x": 0, "y": y}
            out.append(panel)
            y += 1
            i += 1
            continue

        # Collect consecutive panels until next row
        chunk: list[dict] = []
        while i < len(panels) and not is_row(panels[i]):
            chunk.append(deepcopy(panels[i]))
            i += 1

        if not chunk:
            continue

        if all(is_kpi(p) for p in chunk):
            y = pack_kpis(chunk, y)
            out.extend(chunk)
            continue

        if all(is_trend(p) for p in chunk):
            h = max(p.get("gridPos", {}).get("h", 8) for p in chunk)
            y = pack_trends(chunk, y, h)
            out.extend(chunk)
            continue

        if all(p.get("type") == "logs" for p in chunk):
            y = pack_full_width_stack(chunk, y)
            out.extend(chunk)
            continue

        if len(chunk) == 1:
            p = chunk[0]
            ptype = p.get("type")
            gp = p.get("gridPos", {})
            h = gp.get("h", 8)
            if ptype in FULL_WIDTH_SOLO:
                p["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
            elif ptype == "table" and gp.get("w", 24) >= 16:
                p["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
            elif ptype == "bargauge" and gp.get("w", 24) == 24:
                p["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
            else:
                p["gridPos"] = {"h": h, "w": 24, "x": 0, "y": y}
            y += h
            out.extend(chunk)
            continue

        # Mixed chunk: group by type runs where possible
        idx = 0
        while idx < len(chunk):
            run = [chunk[idx]]
            idx += 1
            while idx < len(chunk) and chunk[idx].get("type") == run[0].get("type"):
                run.append(chunk[idx])
                idx += 1

            if all(is_kpi(p) for p in run):
                y = pack_kpis(run, y)
            elif all(is_trend(p) for p in run):
                h = max(p.get("gridPos", {}).get("h", 8) for p in run)
                y = pack_trends(run, y, h)
            elif all(p.get("type") == "bargauge" for p in run):
                h = max(p.get("gridPos", {}).get("h", 8) for p in run)
                y = pack_trends(run, y, h)
            elif all(p.get("type") == "stat" for p in run):
                y = pack_kpis(run, y)
            elif all(p.get("type") == "logs" for p in run):
                y = pack_full_width_stack(run, y)
            elif len(run) == 2 and {p.get("type") for p in run} <= {
                "timeseries",
                "graph",
                "table",
                "bargauge",
                "piechart",
            }:
                h = max(p.get("gridPos", {}).get("h", 8) for p in run)
                y = pack_pair(run, y, h)
            else:
                h = max(p.get("gridPos", {}).get("h", 8) for p in run)
                y = pack_mixed_twelve(run, y, h)
            out.extend(run)

    return out


def validate(panels: list[dict], name: str) -> list[str]:
    issues: list[str] = []
    by_y: dict[int, list[dict]] = {}
    for p in panels:
        if is_row(p):
            continue
        gp = p.get("gridPos", {})
        y = gp.get("y", 0)
        by_y.setdefault(y, []).append(p)

    for y, row in by_y.items():
        trends = [p for p in row if is_trend(p)]
        if len(trends) > 2:
            issues.append(f"{name} y={y}: {len(trends)} timeseries")
        for p in trends:
            w = p.get("gridPos", {}).get("w", 0)
            if w not in (12, 24):
                issues.append(f"{name} id={p.get('id')} trend w={w}")

        kpis = [p for p in row if is_kpi(p)]
        if len(kpis) > 5:
            issues.append(f"{name} y={y}: {len(kpis)} KPI panels (max 5 per row)")

        total_w = sum(p.get("gridPos", {}).get("w", 0) for p in row)
        if total_w > 24:
            issues.append(f"{name} y={y}: total width {total_w}")
        if kpis and len(row) == len(kpis) and total_w != 24:
            issues.append(f"{name} y={y}: KPI row width {total_w} != 24")

    return issues


def process_file(path: Path) -> None:
    data = json.loads(path.read_text(encoding="utf-8"))
    panels = data.get("panels", [])
    new_panels = reflow_sections(panels)
    data["panels"] = new_panels
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    issues = validate(new_panels, path.name)
    if issues:
        print(f"WARN {path.name}:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print(f"OK {path.name}")


def main() -> None:
    skip = {"bilirec-overview.json"}
    targets = sorted(p for p in ROOT.glob("bilirec-*.json") if p.name not in skip)
    for path in targets:
        process_file(path)


if __name__ == "__main__":
    main()
