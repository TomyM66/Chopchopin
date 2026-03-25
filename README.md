# 🎹 ChopChopin — Guide de démarrage

## Prérequis
- Docker Desktop installé et lancé

## Structure
```
PROJE-P/
├── back/               ← API Node.js + Express
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js       ← Routes API
│   └── db.js           ← Connexion MySQL
├── front/
│   ├── css/
│   ├── html/
│   └── js/
├── docker-compose.yml  ← Orchestre tout
├── init.sql            ← Crée les tables SQL
└── README.md
```

## Lancer le projet

```bash
# Dans le dossier PROJE-P/
docker-compose up --build
```

- API disponible sur : http://localhost:3000
- Base de données MySQL sur : localhost:3306

## Routes API

| Méthode | Route                        | Description             |
|---------|------------------------------|-------------------------|
| POST    | /api/inscription             | Créer un compte         |
| POST    | /api/connexion               | Se connecter            |
| POST    | /api/morceaux                | Sauvegarder un morceau  |
| GET     | /api/morceaux/:utilisateur_id| Récupérer ses morceaux  |

## Arrêter le projet

```bash
docker-compose down
```

## Réinitialiser la base de données

```bash
docker-compose down -v
docker-compose up --build
```
