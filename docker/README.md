# build docker image

- docker build -t vite .

# start docker

- docker run -v `pwd`/screenshots:/home/screenshots -it vite

# commands to run inside docker

- export DISPLAY=":99"
- Xvfb :99 -ac -screen 0 1024x768x24 &
- cd home
- git clone https://github.com/khan/vite
- cd vite
- yarn install
- yarn start &
- chromium-browser --disable-gpu --no-sandbox --start-maximized http://localhost:3000/

# getting the screenshots

- CTRL-C to exit chromium after server.js finished logging messages
- cd screenshots
- cp *.png ../../screenshots
- open `pwd`/screenshots on the host
