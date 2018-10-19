FROM node:10.8.0

RUN apt-get update

# install lsb-release 
RUN apt-get install lsb-release

# install gcfuse
RUN export GCSFUSE_REPO=gcsfuse-`lsb_release -c -s` \
  && echo "deb http://packages.cloud.google.com/apt $GCSFUSE_REPO main" | tee /etc/apt/sources.list.d/gcsfuse.list \
  && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

RUN apt-get update && apt-get install -y gcsfuse

COPY . .

# mount gcfuse 
RUN gcsfuse nycv-test-bucket /gcsfuse
RUN npm i

RUN npm run start

EXPOSE 3050


