# build docker image

- docker build -t vite .

# run docker

- docker run -v `pwd`:/home/under_test vite

NOTE: you'll have to kill the docker container manually
TODO: have server.js start chromium and exit it automatically when tests finish
