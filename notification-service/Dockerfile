FROM node:18-alpine

WORKDIR /app

# Copie les fichiers de dépendances
COPY package*.json ./

# Installe les dépendances
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]