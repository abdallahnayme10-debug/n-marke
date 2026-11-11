# 🌴 N-marke — Le marché en ligne des Comores

Plateforme commerciale en ligne complète pour les Comores : achète, vends et fais-toi
livrer par moto. Design chaleureux, optimisée mobile et connexion lente, en français.

## 🧰 Stack technique

| Domaine | Technologie |
|---|---|
| Frontend + Backend | **Next.js 14** (App Router, TypeScript) |
| Base de données | **Prisma** + SQLite (dev) / PostgreSQL (prod) |
| CSS | **Tailwind CSS** (design system chaleureux) |
| Typographie | **Nunito** + **Poppins** |
| Auth | JWT (`jose`) + bcrypt + cookies httpOnly |
| Images | `sharp` (compression + filigrane N-marke) |
| QR code | `qrcode` |
| SMS | Twilio / Africa's Talking (simulation en dev) |
| Recherche par image | Google Vision / Clarifai (simulation en dev) |

## 🚀 Démarrer en local

### 1. Installer Node.js
Télécharge et installe **Node.js 18+** depuis <https://nodejs.org> (version LTS recommandée).

### 2. Installer les dépendances
```bash
cd nmarke
npm install
```

### 3. Configurer l'environnement
Le fichier `.env` existe déjà pour le développement local. Vérifie qu'il contient :
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="..."
```

### 4. Créer la base de données
```bash
npm run db:push
npm run db:seed
```

### 5. Lancer le serveur de développement
```bash
npm run dev
```
Ouvre <http://localhost:3000> 🎉

## 👤 Comptes de démonstration (après `db:seed`)

| Rôle | Téléphone | Mot de passe |
|---|---|---|
| Admin | `+2690000000` | `admin1234` |
| Vendeur démo | `+2693200001` | `demo1234` |

> 💡 **En développement**, les codes de confirmation **EMAIL** sont **simulés** :
> ils s'affichent dans la console du serveur (log `[Email simulé]`). Pas besoin de SMTP pour tester.

## 🔐 Espace propriétaire (gestion secrète)

Pour gérer toute la plateforme sans passer par un compte utilisateur :
1. Ouvre **`/proprietaire`** (lien discret en bas de page)
2. Entre le **mot de passe secret** (`OWNER_PASSWORD` dans `.env`)

Depuis cet espace, tu peux : gérer la **période gratuite** (illimité ou daté),
configurer les **modes de paiement** (M-Vola, Pokéra, KartaPay), ajouter les
**clés API** (Google, SMS, Cloudinary, Vision) et **modifier les règles** et textes
légaux. Les secrets sont **chiffrés** en base (jamais en clair).

## 📦 Déploiement en ligne (mise en production)

Pour publier N-marke sur Internet, choisis **une** des 3 options ci-dessous.

> ⚠️ **PostgreSQL** : en production, remplace SQLite par PostgreSQL en changeant
> **une seule ligne** dans `prisma/schema.prisma` :
> `provider = "sqlite"` → `provider = "postgresql"`, puis `npm run db:push`.

### Option A — Vercel + Neon (recommandé, gratuit pour démarrer)

1. Mets le projet sur **GitHub** (compte gratuit).
2. Crée un compte **[Vercel](https://vercel.com)** → « Add New Project » → importe ton dépôt GitHub.
3. Crée une base **[Neon](https://neon.tech)** (PostgreSQL gratuit) → copie l'URL de connexion.
4. Dans Vercel → **Settings → Environment Variables**, ajoute :
   - `DATABASE_URL` = l'URL Neon (ex : `postgresql://user:pass@host/db`)
   - `JWT_SECRET` = une longue chaîne aléatoire
   - `NEXT_PUBLIC_BASE_URL` = `https://ton-projet.vercel.app`
   - `OWNER_PASSWORD`, `SMTP_*`, `GOOGLE_CLIENT_*`, `MVOLA_*`…
5. Déploie → l'app est en ligne en quelques minutes. 🚀

### Option B — Railway (tout-en-un)

1. Compte **[Railway](https://railway.app)** → « New Project » → « Deploy from GitHub ».
2. Ajoute un plugin **PostgreSQL** (bouton « + »).
3. Renseigne les mêmes variables d'environnement que l'option A.

### Option C — Ton propre serveur (VPS) avec Docker

```bash
# Sur un VPS (DigitalOcean, OVH…) avec Docker installé :
git clone <ton-repo> nmarke && cd nmarke
# Renseigne tes secrets dans un fichier .env puis :
docker compose up -d --build
```
Le fichier `docker-compose.yml` fourni utilise SQLite avec un volume persistant
(parfait pour commencer, sans configurer PostgreSQL).

---

**Stockage d'images** : en production, l'upload local (`public/uploads`) ne persiste
pas sur Vercel/Railway. Branche **Cloudinary** (gratuit) : ajoute les clés
`CLOUDINARY_*` dans l'espace propriétaire ou `.env`.

## 📁 Structure du projet

```
nmarke/
├─ prisma/
│  ├─ schema.prisma      # Modèle de données complet
│  └─ seed.ts            # Données de démarrage (catégories, démo…)
├─ public/
│  ├─ manifest.json      # PWA installable
│  └─ icon.svg
└─ src/
   ├─ app/
   │  ├─ page.tsx                # Page d'accueil
   │  ├─ annonce/[slug]/         # Fiche produit
   │  ├─ recherche/              # Recherche + filtres
   │  ├─ publier/                # Publication d'annonce
   │  ├─ connexion/ inscription/ mot-de-passe-oublie/
   │  ├─ mon-compte/ favoris/ messages/ commandes/ mes-annonces/
   │  ├─ livreurs/ inscription-livreur/ tableau-de-bord-livreur/
   │  ├─ paiement/ parrainage/ notifications/
   │  ├─ aide/ carte/ legal/[slug]/
   │  ├─ admin/                  # Tableau de bord administrateur
   │  └─ api/                    # Toutes les routes API
   ├─ components/               # Header, SearchBar, ProductCard, etc.
   └─ lib/                      # auth, search, image, sms, vision…
```

## ✅ Fonctionnalités incluses

**Compte unique** (acheter + vendre avec le même compte) · Inscription avec
**confirmation par email** · **Connexion Google** · Connexion téléphone · Récupération
mot de passe · Onboarding 4 étapes · 3 profils vendeurs + livreur ·
Catégories/marques/modèles/tags · Publication complète · Filigrane photos ·
Recherche auto-complétion + par photo · Favoris · Alertes dispo · Articles similaires ·
Partage WhatsApp/Facebook · QR code · URLs propres · Compteur de vues · Vue grille/liste ·
Mode sombre · Mode économie de données · Livraison moto complète · Expiration 30 jours ·
**Gratuit jusqu'à nouvel ordre** · Mise en avant · Premium · **Publicité sponsorisée payante** ·
Paiement M-Vola (en ligne + manuel) / Pokéra / KartaPay · Parrainage · Litiges ·
Notifications · Commandes · Fiche produit complète · Commentaires + avis · Messagerie privée ·
FAQ · Pages légales éditables · Bannières promo · Carte des vendeurs · Stats vendeur + publiques
+ admin complet · **Espace propriétaire secret** (réglages, API, paiements, règles).

## 🔒 Sécurité

- Secrets dans `.env` uniquement (jamais sur GitHub — voir `.gitignore`)
- Mots de passe chiffrés (bcrypt), secrets de l'espace propriétaire **chiffrés** (AES-256-GCM)
- Sessions JWT sécurisées (cookies httpOnly + SameSite)
- Max 5 tentatives de connexion → blocage 15 min + **limiteur de débit par IP**
- **En-têtes de sécurité** (CSP, X-Frame-Options, HSTS, nosniff…)
- Requêtes Prisma paramétrées (protection injection SQL)
- Photos de recherche visuelle supprimées après analyse
- Filigrane automatique sur les photos produits

## ⚙️ Simulé en dev vs. réel (clés API à ajouter)

En développement, certaines intégrations sont **simulées** pour que tout fonctionne
sans compte externe. En production, renseigne les clés dans `.env` :

| Fonctionnalité | Dev (sans clé) | Prod (avec clé) |
|---|---|---|
| SMS de vérification | Code affiché dans les logs serveur | `TWILIO_*` ou `AFRICASTALKING_*` |
| Recherche par photo | Détection couleur/catégorie locale | `GOOGLE_VISION_API_KEY` ou `CLARIFAI_API_KEY` |
| Paiement M-Vola / Pokéra | Validation manuelle par l'admin | Phase 2 : `MVOLA_CONSUMER_*`, `KARTAPAY_*` |
| Stockage d'images | Dossier local `public/uploads` | `CLOUDINARY_*` |

> 🎬 **Vidéo automatique du produit** : en Phase 1, la « vidéo » est une animation
> légère (zoom + transition Ken Burns) sur la photo principale — idéale pour les
> connexions lentes. La génération vidéo réelle (FFmpeg côté serveur) nécessite un
> worker dédié et est prévue pour la Phase 2.
