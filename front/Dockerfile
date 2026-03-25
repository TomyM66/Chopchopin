FROM nginx:alpine

# Copie tous les fichiers front dans le répertoire nginx
COPY . /usr/share/nginx/html/front

# Config nginx personnalisée pour servir les fichiers statiques
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
