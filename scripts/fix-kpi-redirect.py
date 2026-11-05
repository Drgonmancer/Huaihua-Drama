#!/usr/bin/env python3
from pathlib import Path

APP = Path('/www/wwwroot/kpi.longgonghuohuo.com/app.py')
text = APP.read_text(encoding='utf-8')
old = "or 'http://127.0.0.1:5679'"
new = "or '/huobao-drama/'"
if old not in text:
    if new in text:
        print('already patched')
    else:
        raise SystemExit('pattern not found')
else:
    APP.write_text(text.replace(old, new, 1), encoding='utf-8')
    print('patched app.py redirect default')
