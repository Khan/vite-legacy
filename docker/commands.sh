#!/usr/bin/env bash
echo "starting Xvfb"
Xvfb :99 -ac -screen 0 1024x768x24 &
echo "starting vite"
vite
