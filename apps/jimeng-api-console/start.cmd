@echo off
setlocal
cd /d "%~dp0"
echo 正在启动即梦 API 视频生成台...
start "" "http://127.0.0.1:4178"
node server.js
endlocal

