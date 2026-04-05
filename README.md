# 🏃 Runity — Move-to-Earn DApp

> **Transformez chaque kilomètre en récompense.** Runity est une DApp Move-to-Earn construite sur Ethereum qui récompense les coureurs en tokens **$RUN** pour leurs performances sportives, vérifiées de manière sécurisée via des signatures EIP-712.

[![Solidity](https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-3-FFF100?logo=hardhat)](https://hardhat.org/)
[![OpenZeppelin](https://img.shields.io/badge/OpenZeppelin-5.6-4E5EE4?logo=openzeppelin)](https://openzeppelin.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📋 Table des matières

- [Présentation](#-présentation)
- [Architecture](#-architecture)
- [Smart Contracts](#-smart-contracts)
- [Stack Technique](#-stack-technique)
- [Installation](#-installation)
- [Déploiement](#-déploiement)
- [Tests](#-tests)
- [Fonctionnalités](#-fonctionnalités)
- [Sécurité](#-sécurité)

---

## 🎯 Présentation

Runity est un écosystème décentralisé où l'effort physique se transforme en valeur digitale. Les utilisateurs courent, soumettent leurs données de course, et reçoivent des tokens **$RUN** — un **token soulbound** (non-transférable P2P) qu'ils peuvent utiliser pour des challenges, des paris ou des récompenses partenaires.

### Flux utilisateur

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│  L'user     │ ──▶ │   Backend    │ ──▶ │  Signature  │ ──▶ │  Smart       │
│  court      │     │   valide     │     │  EIP-712    │     │  Contract    │
│             │     │   les data   │     │             │     │  récompense  │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

---

## 🏗 Architecture

```
Runity/
├── backend/                    # Smart Contracts & Tests (Hardhat)
│   ├── contracts/
│   │   ├── RunCore.sol         # Logique principale (challenges, staking, promos)
│   │   └── RunToken.sol        # Token ERC-20 Soulbound ($RUN)
│   ├── ignition/modules/
│   │   └── RunCore.ts          # Module de déploiement Hardhat Ignition
│   ├── test/
│   │   └── Runity.test.ts      # Tests unitaires (EIP-712, security, escrow)
│   └── hardhat.config.ts       # Configuration Hardhat (local + Sepolia)
│
└── frontend/                   # Interface utilisateur (Next.js 16)
    └── src/
        ├── app/
        │   ├── page.tsx            # Dashboard (balance, activité, profil)
        │   ├── solo/               # Page challenges solo
        │   ├── multiplayer/        # Page challenges multijoueur
        │   └── marketplace/        # Marketplace (promos)
        ├── components/
        │   ├── landing/LandingPage.tsx   # Page de présentation
        │   ├── layout/Navbar.tsx         # Navigation
        │   └── ui/                       # Composants UI (BalanceGauge, etc.)
        ├── hooks/
        │   └── useRunCore.ts       # Hooks wagmi pour toutes les interactions
        ├── config/                 # Configuration Reown AppKit (WalletConnect)
        └── constants/
            └── contract.ts         # ABI & adresses des contrats
```

---

## 📜 Smart Contracts

### `RunToken.sol` — Token Soulbound ERC-20

| Caractéristique | Détail |
|---|---|
| **Standard** | ERC-20 (OpenZeppelin v5) |
| **Symbole** | `$RUN` |
| **Balance max** | 10 000 RUN par wallet |
| **Soulbound** | Non-transférable P2P — seul le contrat `RunCore` peut transférer via escrow |
| **Mint/Burn** | Contrôlé exclusivement par `RunCore` |

### `RunCore.sol` — Logique principale

| Fonctionnalité | Description |
|---|---|
| **Inscription** | `registerRunner()` — Tout wallet peut s'enregistrer comme coureur |
| **Solo Challenges** | L'admin crée des défis (distance, temps, récompense). Les coureurs soumettent leurs données signées EIP-712 |
| **Multiplayer Challenges** | Les coureurs créent/rejoignent des challenges avec **staking** de tokens $RUN. Le premier à atteindre l'objectif remporte la pool |
| **Escrow sécurisé** | Les tokens stakés sont détenus par le contrat. Remboursement automatique après deadline si aucun gagnant |
| **Marketplace** | Burn de tokens pour acheter des codes promo partenaires |
| **Anti-DoS** | Payout cappé à `MAX_BALANCE` pour éviter les reverts (overflow silencieux) |

---

## 🔧 Stack Technique

### Backend
- **Solidity** `0.8.28`
- **Hardhat** `3.2` avec **Ignition** pour le déploiement
- **OpenZeppelin Contracts** `5.6` (Ownable, ERC20, ECDSA, EIP712)
- **Mocha / Chai** pour les tests

### Frontend
- **Next.js** `16` (App Router)
- **React** `19`
- **wagmi** `3.6` + **viem** `2.47` — Interaction blockchain
- **Reown AppKit** (ex-WalletConnect) — Connexion wallet
- **TanStack Query** — Gestion du cache et des requêtes
- **Tailwind CSS** `4` — Styling
- **Lucide React** — Icônes

---

## 🚀 Installation

### Prérequis

- **Node.js** ≥ 18
- **npm** ou **yarn**

### 1. Cloner le projet

```bash
git clone https://github.com/Lory97/Runity.git
cd Runity
```

### 2. Installer les dépendances

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configurer l'environnement

Créer un fichier `frontend/.env.local` :

```env
NEXT_PUBLIC_PROJECT_ID=<votre_reown_project_id>
```

> 💡 Obtenez un Project ID sur [cloud.reown.com](https://cloud.reown.com)

### 4. Lancer en local

```bash
# Terminal 1 — Nœud Hardhat local
cd backend
npx hardhat node

# Terminal 2 — Déployer les contrats
cd backend
npx hardhat ignition deploy ignition/modules/RunCore.ts --network localhost

# Terminal 3 — Frontend
cd frontend
npm run dev
```

L'application sera accessible sur **http://localhost:3000**

---

## 📦 Déploiement

### Réseau local (Hardhat)

```bash
npx hardhat ignition deploy ignition/modules/RunCore.ts --network localhost
```

### Sepolia Testnet

Configurer les variables d'environnement Hardhat :

```bash
npx hardhat vars set SEPOLIA_RPC_URL
npx hardhat vars set SEPOLIA_PRIVATE_KEY
```

Puis déployer :

```bash
npx hardhat ignition deploy ignition/modules/RunCore.ts --network sepolia
```

---

## 🧪 Tests

Les tests couvrent les scénarios critiques de sécurité :

```bash
cd backend
npx hardhat test
```

### Scénarios testés

| Test | Description |
|---|---|
| ✅ **EIP-712 Signature** | Vérifie que seules les courses signées par le backend sont acceptées |
| ✅ **MAX_BALANCE Cap** | Les rewards sont cappées à 10 000 RUN sans revert (anti-DoS) |
| ✅ **Anti-Double Join** | Impossible de rejoindre deux fois un challenge multiplayer |
| ✅ **Escrow Payout** | Vérification des balances avant/après staking et victoire |

---

## ⚡ Fonctionnalités

### 🏃 Mode Solo
- Défis créés par l'administrateur avec objectifs de distance/temps
- Récompenses en $RUN mintées à la réussite
- Vérification cryptographique des données de course

### ⚔️ Mode Multijoueur
- Création de challenges avec staking de tokens $RUN  
- Jusqu'à **50 participants** par challenge
- Le premier à valider l'objectif remporte **toute la pool**
- Système de **remboursement automatique** après expiration du deadline

### 🛒 Marketplace
- Codes promo achetables en burnant des tokens $RUN
- L'admin peut ajouter/modifier les offres promotionnelles

### 📊 Dashboard
- **Balance Gauge** — Visualisation en temps réel du solde $RUN  
- **Profil Runner** — Stats (distance, victoires, challenges joués)  
- **Activité récente** — Feed dynamique basé sur les event logs on-chain

---

## 🔒 Sécurité

| Mesure | Implémentation |
|---|---|
| **Vérification EIP-712** | Toute soumission de course requiert une signature du backend oracle |
| **Anti-Frontrunning** | Le champ `user` dans la struct `RunData` empêche le vol de signatures dans le mempool |
| **Anti-Replay** | Chaque hash de course est marqué comme exécuté (`executedRuns`) |
| **Anti-DoS (Payout)** | Les fonctions `_payoutMint` et `_payoutEscrow` gèrent gracieusement les overflows sans revert |
| **Soulbound Token** | Transfers P2P bloqués — seul le contrat core peut déplacer des tokens |
| **Pull Refund Pattern** | Les remboursements multijoueur suivent le pattern Pull (anti double-refund) |

---

## 🛠 Développé avec

<p align="center">
  <img src="https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/Solidity-363636?style=for-the-badge&logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=000" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
</p>

---

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<p align="center">
  <strong>Runity</strong> — <em>Run to Earn. Move to Win.</em>
</p>
