FROM node:16
WORKDIR /app
COPY . .
COPY inter /usr/share/fonts/inter
RUN yarn
RUN yarn prisma db push
CMD node server.js
