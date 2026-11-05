#!/bin/bash
set -e
CONF=/www/server/panel/vhost/nginx/kpi.longgonghuohuo.com.conf
if grep -q 'location = /huobao-drama' "$CONF"; then
  echo "redirect already exists"
else
  sed -i '/location \/huobao-drama\//i\    location = /huobao-drama {\n        return 301 /huobao-drama/;\n    }\n' "$CONF"
  nginx -t && nginx -s reload
  echo "nginx redirect added"
fi
grep -B2 -A3 'location = /huobao-drama' "$CONF" || true
