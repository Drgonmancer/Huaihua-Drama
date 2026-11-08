@echo off
chcp 65001 >nul
title 槐花短剧 · Huaihua Drama
echo ============================================
echo   槐花短剧 · AI 短剧制作工作台
echo   前端 http://localhost:3013  后端 :5679
echo ============================================
echo.

cd /d "%~dp0"

:: 检查端口是否已被占用，占用则直接打开页面
netstat -ano | findstr ":3013" | findstr "LISTENING" >nul 2>&1
if %errorlevel%==0 (
    echo [提示] 前端已在运行，直接打开页面...
    start http://localhost:3013
    exit /b 0
)

:: 检查依赖
if not exist "backend\node_modules" (
    echo [安装] 后端依赖...
    cd backend && call npm install && cd ..
)
if not exist "frontend\node_modules" (
    echo [安装] 前端依赖...
    cd frontend && call npm install && cd ..
)

:: 启动后端（新窗口）
echo [启动] 后端服务 :5679 ...
start "槐花短剧-后端" cmd /k "cd /d %~dp0backend && npm run dev"

:: 等后端就绪
timeout /t 5 /nobreak >nul

:: 启动前端（新窗口）
echo [启动] 前端服务 :3013 ...
start "槐花短剧-前端" cmd /k "cd /d %~dp0frontend && npm run dev"

:: 等前端就绪后打开浏览器
timeout /t 8 /nobreak >nul
echo [完成] 正在打开浏览器...
start http://localhost:3013

echo.
echo 两个服务窗口已启动，关闭对应窗口即可停止服务。
pause
