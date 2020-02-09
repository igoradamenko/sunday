FROM node

WORKDIR /app

COPY package.json package-lock.json /app/

RUN npm install

COPY index.js .

EXPOSE 3000

CMD ["node", "index.js"]
