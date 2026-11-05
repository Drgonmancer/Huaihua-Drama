#!/bin/bash
set -e
cp /tmp/video-generation.ts /www/wwwroot/huobao-drama/backend/src/services/video-generation.ts
cp /tmp/volcengine-video.ts /www/wwwroot/huobao-drama/backend/src/services/adapters/volcengine-video.ts
sqlite3 /www/wwwroot/huobao-drama/data/huobao_drama.db \
  "UPDATE video_generations SET status='failed', error_msg='视频被平台拒绝：内容可能触发版权或敏感内容限制，请调整镜头描述或参考图后重试', updated_at=datetime('now') WHERE status='processing';"
pm2 restart huobao-drama
sleep 2
python3 /tmp/query-videos.py
