#!/bin/bash
set -e
cp /tmp/dramas.ts /www/wwwroot/huobao-drama/backend/src/routes/dramas.ts
cp /tmp/ai.ts /www/wwwroot/huobao-drama/backend/src/services/ai.ts
sqlite3 /www/wwwroot/huobao-drama/data/huobao_drama.db \
  "UPDATE episodes SET image_config_id=2, video_config_id=3 WHERE image_config_id IS NULL;"
pm2 restart huobao-drama
sleep 2
python3 /tmp/smoke-test-production.py
