#!/usr/bin/env python3
"""Production smoke test for 槐花短剧 — all workflow stages."""
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass, field

BASE = "https://kpi.longgonghuohuo.com"
HUOBAO = f"{BASE}/huobao-drama"
LOCAL = "http://127.0.0.1:5679"


@dataclass
class Result:
    name: str
    ok: bool
    detail: str = ""


results: list[Result] = []
ctx: dict = {}


def req(method: str, url: str, body=None, expect_json=True, follow_redirects=True):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"} if data else {},
        method=method,
    )
    if not follow_redirects:
        class NoRedirect(urllib.request.HTTPRedirectHandler):
            def redirect_request(self, req, fp, code, msg, headers, newurl):
                return None
        opener = urllib.request.build_opener(NoRedirect)
    else:
        opener = urllib.request.build_opener()
    try:
        with opener.open(r, timeout=30) as resp:
            raw = resp.read().decode()
            ct = resp.headers.get("Content-Type", "")
            if expect_json and "json" not in ct and raw.lstrip().startswith("<!"):
                raise ValueError(f"HTML instead of JSON: {raw[:120]}")
            parsed = json.loads(raw) if expect_json and raw else raw
            return resp.status, parsed, dict(resp.headers)
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            parsed = json.loads(raw) if raw else {}
        except json.JSONDecodeError:
            parsed = raw[:200]
        return e.code, parsed, dict(e.headers)


def check(name: str, ok: bool, detail: str = ""):
    results.append(Result(name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f" — {detail}" if detail else ""))


def section(title: str):
    print(f"\n=== {title} ===")


def main():
    section("1. 入口与静态资源")
    for path in ["/huobao-drama/", "/huobao-drama/index.html", "/huobao-drama/settings"]:
        code, body, _ = req("GET", f"{BASE}{path}", expect_json=False)
        ok = code == 200 and ("html" in str(body).lower() or "<!DOCTYPE" in str(body)[:50])
        check(f"GET {path}", ok, f"HTTP {code}")

    code, _, headers = req("GET", f"{BASE}/huobao-drama", expect_json=False, follow_redirects=False)
    loc = headers.get("Location") or headers.get("location") or ""
    check("无尾斜杠重定向", code in (301, 302) and "/huobao-drama/" in loc, f"HTTP {code} -> {loc}")

    code, body, _ = req("GET", f"{BASE}/tools/huobao-drama", expect_json=False)
    loc = _.get("Location") or _.get("location") or ""
    check("KPI 工具入口 /tools/huobao-drama", code in (301, 302, 200), f"HTTP {code} loc={loc[:80]}")

    section("2. API 基路径（防 HTML 误解析）")
    code, body, _ = req("GET", f"{HUOBAO}/api/v1/health")
    check("health via nginx", code == 200 and body.get("status") == "ok", json.dumps(body, ensure_ascii=False)[:80])

    code, body, _ = req("GET", f"{BASE}/api/v1/health")
    check("health 不应打到主站", code != 200 or body.get("status") != "ok", f"HTTP {code}")

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/dramas")
    check("GET /dramas 返回 JSON", code == 200 and "items" in body.get("data", body), f"HTTP {code}")

    section("3. 项目 CRUD")
    code, body, _ = req("POST", f"{HUOBAO}/api/v1/dramas", {"title": "smoke-test 全流程", "total_episodes": 1})
    drama = body.get("data") or {}
    drama_id = drama.get("id")
    check("创建项目", code in (200, 201) and drama_id, f"id={drama_id}")
    ctx["drama_id"] = drama_id

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/dramas/{drama_id}")
    check("获取项目详情", code == 200 and body.get("data", {}).get("id") == drama_id)

    code, body, _ = req("PUT", f"{HUOBAO}/api/v1/dramas/{drama_id}", {"description": "smoke test"})
    check("更新项目", code == 200)

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/dramas/stats")
    check("项目统计", code == 200)

    section("4. 集数与剧本流程")
    drama_detail = req("GET", f"{HUOBAO}/api/v1/dramas/{drama_id}")[1]
    episodes = drama_detail.get("data", {}).get("episodes") or []
    ep = episodes[0] if episodes else None
    if not ep:
        check("默认集数存在", False, "创建项目时未生成 episode")
        return report()
    ep_id = ep["id"]
    ep_num = ep["episode_number"]
    ctx["ep_id"] = ep_id
    ctx["ep_num"] = ep_num
    has_cfg = ep.get("image_config_id") and ep.get("video_config_id")
    check("默认第1集", True, f"ep_id={ep_id}")
    check("集数已绑定 AI 配置", bool(has_cfg), f"image={ep.get('image_config_id')} video={ep.get('video_config_id')}")

    sample_script = "场景：办公室，白天。\n小明：你好，这是冒烟测试剧本。"
    code, _, _ = req("PUT", f"{HUOBAO}/api/v1/episodes/{ep_id}", {"content": sample_script})
    check("保存原始剧本", code == 200)

    code, body, _ = req("PUT", f"{HUOBAO}/api/v1/episodes/{ep_id}", {"script_content": sample_script + "\n【改写后】"})
    check("保存改写剧本", code == 200)

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/episodes/{ep_id}/pipeline-status")
    steps = body.get("data", {}).get("steps", {})
    check(
        "流水线状态 script_rewrite",
        steps.get("script_rewrite", {}).get("status") == "done",
        steps.get("script_rewrite", {}).get("status", "?"),
    )

    section("5. 配置与 Agent 依赖")
    code, body, _ = req("GET", f"{HUOBAO}/api/v1/agent-configs")
    agents = body.get("data") or []
    check("Agent 配置列表", code == 200, f"count={len(agents)}")

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/skills")
    skills = body.get("data") or []
    check("Skills 列表", code == 200 and len(skills) > 0, f"count={len(skills)}")

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/ai-voices")
    check("音色列表", code == 200, f"HTTP {code}")

    code, body, _ = req("GET", f"{LOCAL}/api/v1/ai-configs")
    configs = body.get("data") or []
    has_image = any(c.get("service_type") == "image" for c in configs)
    has_video = any(c.get("service_type") == "video" for c in configs)
    has_text = any(c.get("service_type") == "text" for c in configs)
    check("AI 图片配置", has_image, "missing image config" if not has_image else "ok")
    check("AI 视频配置", has_video, "missing video config" if not has_video else "ok")
    check("AI 文本配置", has_text, "missing text config" if not has_text else "ok")

    section("6. 子资源 API 可达性")
    for path in [
        f"/api/v1/episodes/{ep_id}/characters",
        f"/api/v1/episodes/{ep_id}/scenes",
        f"/api/v1/episodes/{ep_id}/storyboards",
        f"/api/v1/credits/video-quote?seconds=5",
    ]:
        code, body, _ = req("GET", f"{HUOBAO}{path}")
        check(f"GET {path.split('?')[0]}", code == 200, f"HTTP {code}")

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/credits")
    check(
        "积分 API（需登录 cookie）",
        code in (200, 401),
        f"HTTP {code} — 未登录 401 属正常",
    )

    section("7. 制作流程数据层（角色/场景/分镜）")
    code, _, _ = req(
        "PUT",
        f"{HUOBAO}/api/v1/dramas/{drama_id}/characters",
        {"characters": [{"name": "小明", "role": "主角", "appearance": "黑发青年", "voice_style": "male_young"}]},
    )
    check("保存角色", code == 200)

    drama_detail2 = req("GET", f"{HUOBAO}/api/v1/dramas/{drama_id}")[1]
    chars = drama_detail2.get("data", {}).get("characters") or []
    char_id = chars[0]["id"] if chars else None
    check("角色已写入", bool(char_id), f"char_id={char_id}")

    code, body, _ = req(
        "POST",
        f"{HUOBAO}/api/v1/scenes",
        {"drama_id": drama_id, "episode_id": ep_id, "location": "办公室", "time": "白天", "prompt": "现代办公室"},
    )
    scene = body.get("data") or body
    scene_id = scene.get("id") if isinstance(scene, dict) else None
    check("创建场景", code in (200, 201) and scene_id, f"scene_id={scene_id}")

    code, body, _ = req(
        "POST",
        f"{HUOBAO}/api/v1/storyboards",
        {
            "episode_id": ep_id,
            "storyboard_number": 1,
            "title": "开场",
            "action": "小明走进办公室",
            "dialogue": "小明：你好",
            "duration": 10,
        },
    )
    sb = body.get("data") or body
    sb_id = sb.get("id") if isinstance(sb, dict) else None
    check("创建分镜", code in (200, 201) and sb_id, f"sb_id={sb_id}")

    code, body, _ = req("GET", f"{HUOBAO}/api/v1/episodes/{ep_id}/pipeline-status")
    steps = body.get("data", {}).get("steps", {})
    check("流水线-角色提取", steps.get("extract_characters", {}).get("count", 0) > 0)
    check("流水线-场景提取", steps.get("extract_scenes", {}).get("count", 0) > 0)
    check("流水线-分镜", steps.get("extract_storyboards", {}).get("count", 0) > 0)

    section("8. Agent / 生成 / 合成 / 导出 API 门禁")
    code, body, _ = req("POST", f"{HUOBAO}/api/v1/agent/script_rewriter/chat", {"message": "test"})
    check("Agent 路由（缺参数应 400）", code == 400, f"HTTP {code}")

    code, _, _ = req("POST", f"{HUOBAO}/api/v1/images", {})
    check("生图 API 参数校验", code == 400, "无 prompt 应拒绝")

    code, _, _ = req("POST", f"{HUOBAO}/api/v1/videos", {})
    check("生视频 API 参数校验", code == 400, "无 prompt 应拒绝")

    code, _, _ = req("GET", f"{HUOBAO}/api/v1/compose/episodes/{ep_id}/compose-status")
    check("合成状态查询", code == 200)

    code, body, _ = req("POST", f"{HUOBAO}/api/v1/merge/episodes/{ep_id}/merge")
    check("导出拼接（无视频应拒绝）", code == 400, str(body)[:80])

    section("9. 设置页不暴露 API 信息")
    _, html, _ = req("GET", f"{BASE}/huobao-drama/settings", expect_json=False)
    html_l = str(html).lower()
    check("设置页无 api_key", "api_key" not in html_l and "apikey" not in html_l)
    check("设置页无 base_url 配置项", "base_url" not in html_l or "platform" in html_l)

    section("10. 前端 bundle API 路径")
    import re
    import glob
    import os
    dist = "/www/wwwroot/huobao-drama/frontend/dist/_nuxt"
    bad = good = 0
    for f in glob.glob(f"{dist}/*.js"):
        txt = open(f, encoding="utf-8", errors="ignore").read()
        if "./api/v1" in txt and "huobao-drama/api/v1" not in txt:
            bad += 1
        if "huobao-drama/api/v1" in txt or "__NUXT__" in txt:
            good += 1
    check("前端 bundle 含正确 API 前缀", bad == 0 and good > 0, f"bad={bad} good={good}")

    section("11. 服务进程")
    code, body, _ = req("GET", f"{LOCAL}/api/v1/health")
    check("PM2 后端本地 health", code == 200 and body.get("status") == "ok")

    section("12. 清理测试数据")
    if drama_id:
        code, _, _ = req("DELETE", f"{HUOBAO}/api/v1/dramas/{drama_id}")
        check("删除测试项目", code == 200)

    return report()


def report():
    section("汇总")
    passed = sum(1 for r in results if r.ok)
    failed = [r for r in results if not r.ok]
    print(f"\n通过 {passed}/{len(results)}")
    if failed:
        print("\n失败项:")
        for r in failed:
            print(f"  - {r.name}: {r.detail}")
        return 1
    print("\n全部通过 ✓")
    return 0


if __name__ == "__main__":
    sys.exit(main())
