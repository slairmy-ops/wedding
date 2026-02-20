@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在启动婚纱照展示...
echo 启动后请在浏览器打开: http://localhost:3000
echo 关闭此窗口将停止服务器。
echo.
"node\node.exe" server.js
pause
