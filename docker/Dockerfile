FROM ubuntu:18.04

RUN apt-get update && apt-get install -y --no-install-recommends apt-utils
RUN apt-get update && apt-get install -y xvfb chromium-browser curl gnupg git imagemagick
RUN curl -sL https://deb.nodesource.com/setup_8.x | bash
RUN apt-get install -y nodejs
RUN npm i -g yarn
ENV DISPLAY ":99"
WORKDIR /home
RUN git clone https://github.com/khan/vite
WORKDIR /home/vite
RUN yarn install
RUN yarn link
WORKDIR /home/under_test
COPY commands.sh /home/commands.sh
CMD sh ../commands.sh
