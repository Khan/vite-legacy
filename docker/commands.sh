#!/usr/bin/env bash
echo "starting Xvfb"
Xvfb :99 -nolisten tcp -ac -screen 0 1024x768x24 &
Xvfb :98 -nolisten tcp -ac -screen 0 1024x768x24 &
echo "starting vite"
vite
