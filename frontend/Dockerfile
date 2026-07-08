FROM node:20

WORKDIR /app

# On copie le package.json
COPY package.json ./

# On installe les dépendances proprement sous Linux
RUN npm install

# On copie le reste du code
COPY . .

EXPOSE 5173

# On lance Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]