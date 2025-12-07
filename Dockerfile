FROM node:latest AS builder

WORKDIR /workspace

COPY package.json .
COPY package-lock.json .

RUN npm install

COPY . .

RUN npm run build

FROM nginx:1.29.3

COPY --from=builder /workspace/dist /usr/share/nginx/html

COPY robots.txt /usr/share/nginx/html/robots.txt

COPY default.conf /etc/nginx/conf.d/default.conf