#!/usr/bin/env python3
"""Patch KPI production files for 槐花短剧 integration."""
from __future__ import annotations

import re
import sys
from pathlib import Path

KPI_DIR = Path('/www/wwwroot/kpi.longgonghuohuo.com')
APP = KPI_DIR / 'app.py'
CONFIG = KPI_DIR / 'config.py'
HOME_JS = KPI_DIR / 'static/js/demo-new-home.js'
NGINX = Path('/www/server/panel/vhost/nginx/kpi.longgonghuohuo.com.conf')
ENV = KPI_DIR / '.env'

HUOBAO_APP_BLOCK = r'''
_HUOBAO_DRAMA_CHARGE_KEYS = {}
_HUOBAO_DRAMA_CHARGE_KEYS_MAX = 8000


def _huobao_credit_rmb():
    try:
        return float(os.getenv('HUOBAO_CREDIT_RMB_VALUE', '0.09'))
    except (TypeError, ValueError):
        return 0.09


def _huobao_credits_from_cost(cost_rmb, margin):
    credit_rmb = _huobao_credit_rmb()
    if credit_rmb <= 0:
        return 1
    return max(1, math.ceil(float(cost_rmb) * float(margin) / credit_rmb))


def _huobao_agent_credits():
    override = os.getenv('HUOBAO_AGENT_CREDITS')
    if override:
        return int(override)
    cost = float(os.getenv('HUOBAO_AGENT_API_COST_RMB', '0.054'))
    margin = float(os.getenv('HUOBAO_AGENT_MARGIN', '5'))
    return _huobao_credits_from_cost(cost, margin)


def _huobao_image_credits():
    override = os.getenv('HUOBAO_IMAGE_CREDITS')
    if override:
        return int(override)
    cost = float(os.getenv('HUOBAO_IMAGE_API_COST_RMB', '0.09'))
    margin = float(os.getenv('HUOBAO_IMAGE_MARGIN', '5'))
    return _huobao_credits_from_cost(cost, margin)


def _huobao_video_list_credits_per_second():
    return float(os.getenv('HUOBAO_VIDEO_LIST_CREDITS_PER_SECOND', '16'))


def _huobao_video_charge_credits_per_second():
    return float(os.getenv('HUOBAO_VIDEO_CHARGE_CREDITS_PER_SECOND', '12'))


def _huobao_video_discount_rate():
    raw = os.getenv('HUOBAO_VIDEO_DISCOUNT_RATE')
    if raw:
        try:
            return float(raw)
        except (TypeError, ValueError):
            pass
    list_m = float(os.getenv('HUOBAO_VIDEO_LIST_MARGIN', '4'))
    charge_m = float(os.getenv('HUOBAO_VIDEO_CHARGE_MARGIN', '3'))
    return charge_m / list_m if list_m > 0 else 0.75


def _huobao_video_quote(seconds, list_per_sec=None):
    max_dur = int(os.getenv('HUOBAO_VIDEO_MAX_DURATION', '15'))
    secs = max(1, min(max_dur, math.ceil(float(seconds))))
    list_rate = float(list_per_sec if list_per_sec is not None else _huobao_video_list_credits_per_second())
    charge_rate = _huobao_video_charge_credits_per_second()
    list_credits = max(1, int(secs * list_rate))
    charge_credits = max(1, int(secs * charge_rate))
    return {
        'durationSeconds': secs,
        'listCredits': list_credits,
        'chargeCredits': charge_credits,
        'listCreditsPerSecond': list_rate,
        'chargeCreditsPerSecond': charge_rate,
        'discountRate': _huobao_video_discount_rate(),
        'discountLabel': os.getenv('HUOBAO_VIDEO_DISCOUNT_LABEL', '75折'),
    }


def _huobao_video_credits(seconds, list_per_sec=None):
    return _huobao_video_quote(seconds, list_per_sec)['chargeCredits']


def _parse_huobao_video_tiers(raw_value, fallback):
    text = str(raw_value or '').strip()
    if not text:
        return fallback
    labels = ['短视频(≤5秒)', '标准镜(≤8秒)', '长镜头(≤12秒)', '超长镜(≤15秒)']
    parsed = []
    for chunk in text.split(','):
        if ':' not in chunk:
            continue
        sec_part, credit_part = chunk.split(':', 1)
        try:
            max_seconds = int(sec_part.strip())
            charge_credits = int(credit_part.strip())
        except (TypeError, ValueError):
            continue
        if max_seconds <= 0 or charge_credits <= 0:
            continue
        list_rate = _huobao_video_list_credits_per_second()
        list_credits = max(1, int(max_seconds * list_rate))
        parsed.append({
            'maxSeconds': max_seconds,
            'listCredits': list_credits,
            'chargeCredits': charge_credits,
            'credits': charge_credits,
            'label': labels[len(parsed)] if len(parsed) < len(labels) else f'{max_seconds}秒内',
            'discountRate': _huobao_video_discount_rate(),
            'listCreditsPerSecond': list_rate,
        })
    return parsed or fallback


HUOBAO_DRAMA_VIDEO_MINI_TIERS = _parse_huobao_video_tiers(
    os.getenv('HUOBAO_VIDEO_MINI_TIERS'),
    None,
)
if not HUOBAO_DRAMA_VIDEO_MINI_TIERS:
    _list_rate = _huobao_video_list_credits_per_second()
    _max_dur = int(os.getenv('HUOBAO_VIDEO_MAX_DURATION', '15'))
    _bp = [5, 8, 12, _max_dur]
    _labels = ['短视频(≤5秒)', '标准镜(≤8秒)', '长镜头(≤12秒)', f'超长镜(≤{_max_dur}秒)']
    HUOBAO_DRAMA_VIDEO_MINI_TIERS = [
        {
            'maxSeconds': sec,
            'listCredits': _huobao_video_quote(sec)['listCredits'],
            'chargeCredits': _huobao_video_quote(sec)['chargeCredits'],
            'credits': _huobao_video_quote(sec)['chargeCredits'],
            'label': _labels[i] if i < len(_labels) else f'≤{sec}秒',
            'discountRate': _huobao_video_discount_rate(),
            'listCreditsPerSecond': _list_rate,
        }
        for i, sec in enumerate(_bp)
    ]

HUOBAO_DRAMA_AGENT_CREDITS = _huobao_agent_credits()
HUOBAO_DRAMA_IMAGE_CREDITS = _huobao_image_credits()
_mini_quote_5 = _huobao_video_quote(5)
HUOBAO_DRAMA_VIDEO_DEFAULT_CREDITS = _mini_quote_5['chargeCredits']
HUOBAO_DRAMA_VIDEO_MINI_LIST_CREDITS = _mini_quote_5['listCredits']
HUOBAO_DRAMA_VIDEO_MINI_CREDITS_PER_SECOND = _huobao_video_charge_credits_per_second()
HUOBAO_DRAMA_VIDEO_LIST_CREDITS_PER_SECOND = _huobao_video_list_credits_per_second()


def _huobao_drama_require_login():
    user_id = session.get('user_id')
    if not user_id:
        return None, (jsonify({'error': '请先登录后再使用', 'need_login': True}), 401)
    return user_id, None


@app.route('/api/huobao-drama/credits', methods=['GET'])
def huobao_drama_credits():
    """槐花短剧 — 查询当前用户积分与定价。"""
    user_id, err = _huobao_drama_require_login()
    if err:
        return err

    profile = auth_service.get_profile(user_id)
    username = (
        (profile or {}).get('display_name')
        or session.get('username')
        or '用户'
    )
    current = auth_service.get_credits(user_id)
    if current == -1:
        return _build_credit_lookup_unavailable_response()

    return jsonify({
        'username': username,
        'credits': current,
        'creditsAvailable': True,
        'agentCost': HUOBAO_DRAMA_AGENT_CREDITS,
        'imageCost': HUOBAO_DRAMA_IMAGE_CREDITS,
        'videoChargeCreditsPerSecond': HUOBAO_DRAMA_VIDEO_MINI_CREDITS_PER_SECOND,
        'videoMiniPerSecond': HUOBAO_DRAMA_VIDEO_MINI_CREDITS_PER_SECOND,
        'videoDefaultCost': HUOBAO_DRAMA_VIDEO_DEFAULT_CREDITS,
        'videoMiniFromCredits': HUOBAO_DRAMA_VIDEO_DEFAULT_CREDITS,
        'videoMiniListCredits': HUOBAO_DRAMA_VIDEO_MINI_LIST_CREDITS,
        'videoPricingMode': 'list_charge_discount',
        'videoListCreditsPerSecond': HUOBAO_DRAMA_VIDEO_LIST_CREDITS_PER_SECOND,
        'videoListMargin': float(os.getenv('HUOBAO_VIDEO_LIST_MARGIN', '4')),
        'videoChargeMargin': float(os.getenv('HUOBAO_VIDEO_CHARGE_MARGIN', '3')),
        'videoDiscountRate': _huobao_video_discount_rate(),
        'videoDiscountLabel': os.getenv('HUOBAO_VIDEO_DISCOUNT_LABEL', '75折'),
        'videoMiniApiCostPerSec': float(os.getenv('HUOBAO_VIDEO_MINI_API_COST_RMB', '0.4')),
        'creditRmbValue': _huobao_credit_rmb(),
        'agentMargin': float(os.getenv('HUOBAO_AGENT_MARGIN', '5')),
        'videoMiniTiers': HUOBAO_DRAMA_VIDEO_MINI_TIERS,
        'user_id': user_id,
    })


@app.route('/api/huobao-drama/credits/deduct', methods=['POST'])
def huobao_drama_credits_deduct():
    """槐花短剧 — 任务成功后扣费（幂等）。"""
    user_id, err = _huobao_drama_require_login()
    if err:
        return err

    data = request.get_json(silent=True) or {}
    try:
        amount = int(data.get('amount', 0))
    except (TypeError, ValueError):
        amount = 0
    reason = str(data.get('reason') or '槐花短剧').strip()
    idempotency_key = str(data.get('idempotency_key') or '').strip()

    if amount <= 0:
        return jsonify({'error': '扣费金额无效'}), 400
    if not idempotency_key:
        return jsonify({'error': '缺少幂等键'}), 400

    cache_key = f'{user_id}:{idempotency_key}'
    cached = _HUOBAO_DRAMA_CHARGE_KEYS.get(cache_key)
    if cached is not None:
        return jsonify({'remaining_credits': cached, 'cached': True})

    current = auth_service.get_credits(user_id)
    if current == -1:
        return _build_credit_lookup_unavailable_response()
    if current < amount:
        return jsonify({
            'error': f'积分不足，当前: {current}，需要: {amount}',
            'remaining_credits': current,
            'credits_needed': amount,
            'credits_exhausted': True,
        }), 402

    success, msg, remaining = auth_service.use_credits(user_id, amount, reason)
    if not success:
        return jsonify({
            'error': msg,
            'remaining_credits': remaining,
            'credits_needed': amount,
        }), 402

    if len(_HUOBAO_DRAMA_CHARGE_KEYS) > _HUOBAO_DRAMA_CHARGE_KEYS_MAX:
        _HUOBAO_DRAMA_CHARGE_KEYS.clear()
    _HUOBAO_DRAMA_CHARGE_KEYS[cache_key] = remaining

    return jsonify({'remaining_credits': remaining})


'''

HUOBAO_TOOL_ROUTE = '''
@app.route('/tools/huobao-drama')
def huobao_drama_tool():
    """槐花短剧 — 登录后跳转到独立制作台"""
    user_id = session.get('user_id')
    if not user_id:
        return redirect('/?need_login=1&from=huobao-drama')
    app_url = (os.environ.get('HUOBAO_DRAMA_APP_URL') or '/huobao-drama/').strip()
    if not app_url.endswith('/'):
        app_url += '/'
    return redirect(app_url)


'''

HUOBAO_CONFIG = '''        'huobao_drama': {
            'name': '槐花短剧',
            'icon': '🎭',
            'color': '#9333ea',
            'description': '剧本改写、分镜拆解、角色场景生图与 Seedance 视频成片一站式制作',
            'subtitle': 'Agent 3 · 生图 5 · 视频 16→12 积分/秒 · 75折 · 合成免费',
            'category': 'design',
            'sort_order': 13.2,
            'link_type': 'external',
            'external_url': '/tools/huobao-drama',
            'fallback_always_visible': True,
        },
'''

HUOBAO_HOME_JS = '''        }, {
            name: "槐花短剧",
            href: "/tools/huobao-drama",
            icon: "🎭",
            external: false,
            moduleId: "huobao_drama",
            moduleName: "槐花短剧",
'''

NGINX_BLOCK = '''    location = /huobao-drama {
        return 301 /huobao-drama/;
    }

    location /huobao-drama/ {
        proxy_pass http://127.0.0.1:5679/;
        proxy_read_timeout 480s;
        proxy_send_timeout 480s;
        client_max_body_size 150m;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Cookie $http_cookie;
    }

'''


def ensure_math_import() -> bool:
    text = APP.read_text(encoding='utf-8')
    if 'import math' in text:
        return False
    if 'import os' not in text:
        raise SystemExit('app.py import os not found')
    text = text.replace('import os\n', 'import os\nimport math\n', 1)
    APP.write_text(text, encoding='utf-8')
    print('app.py: added import math')
    return True


def patch_app() -> bool:
    ensure_math_import()
    text = APP.read_text(encoding='utf-8')
    if 'def huobao_drama_tool' in text:
        print('app.py: huobao already present')
        return False
    needle = "@app.route('/api/changjing-fuke/reference-url', methods=['POST'])"
    if needle not in text:
        raise SystemExit('app.py needle not found')
    text = text.replace(needle, HUOBAO_APP_BLOCK.lstrip('\n') + needle, 1)
    tool_needle = "@app.route('/tools/batch-image-studio')"
    if tool_needle not in text:
        raise SystemExit('app.py batch-image needle not found')
    text = text.replace(tool_needle, HUOBAO_TOOL_ROUTE.lstrip('\n') + tool_needle, 1)
    APP.write_text(text, encoding='utf-8')
    print('app.py: patched')
    return True


def patch_config() -> bool:
    text = CONFIG.read_text(encoding='utf-8')
    if "'huobao_drama'" in text:
        print('config.py: huobao already present')
        return False
    needle = "        'batch_image_studio': {"
    if needle not in text:
        raise SystemExit('config.py needle not found')
    text = text.replace(needle, HUOBAO_CONFIG + needle, 1)
    CONFIG.write_text(text, encoding='utf-8')
    print('config.py: patched')
    return True


def patch_home_js() -> bool:
    text = HOME_JS.read_text(encoding='utf-8')
    if 'huobao_drama' in text:
        print('demo-new-home.js: huobao already present')
        return False
    needle = '''        }, {
            name: "批量图片智能体",
            href: "/tools/batch-image-studio",'''
    if needle not in text:
        raise SystemExit('demo-new-home.js needle not found')
    text = text.replace(needle, HUOBAO_HOME_JS + needle, 1)
    HOME_JS.write_text(text, encoding='utf-8')
    print('demo-new-home.js: patched')
    return True


def patch_nginx() -> bool:
    text = NGINX.read_text(encoding='utf-8')
    if 'location /huobao-drama/' in text:
        print('nginx: huobao location already present')
        return False
    needle = '    location /batch-image-studio/ {'
    if needle not in text:
        raise SystemExit('nginx needle not found')
    text = text.replace(needle, NGINX_BLOCK + needle, 1)
    NGINX.write_text(text, encoding='utf-8')
    print('nginx: patched')
    return True


def patch_env() -> bool:
    text = ENV.read_text(encoding='utf-8') if ENV.exists() else ''
    changed = False
    line = 'HUOBAO_DRAMA_APP_URL=https://kpi.longgonghuohuo.com/huobao-drama/'
    if 'HUOBAO_DRAMA_APP_URL=' not in text:
        text = text.rstrip() + '\n' + line + '\n'
        changed = True
    else:
        text2, n = re.subn(r'HUOBAO_DRAMA_APP_URL=.*', line, text)
        if n:
            text = text2
            changed = True
    if changed:
        ENV.write_text(text, encoding='utf-8')
        print('.env: HUOBAO_DRAMA_APP_URL set')
    else:
        print('.env: already configured')
    return changed


def main() -> int:
    patch_app()
    patch_config()
    patch_home_js()
    patch_nginx()
    patch_env()
    return 0


if __name__ == '__main__':
    sys.exit(main())
