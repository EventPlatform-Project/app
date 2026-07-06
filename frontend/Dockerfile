FROM node:18-alpine

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code
COPY . .

# On expose le port par défaut de Vite (5173)
EXPOSE 5173

# Commande pour lancer le mode dev (on ajoute --host pour que Docker accepte les connexions)
CMD ["npm", "run", "dev", "--", "--host"]