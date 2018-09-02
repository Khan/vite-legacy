#!/usr/bin/env bash
Xvfb :99 -ac -screen 0 1024x768x24 &
vite &
chromium-browser --disable-gpu --no-sandbox --start-maximized http://localhost:3000/
