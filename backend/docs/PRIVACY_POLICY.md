# Politique de Confidentialité

**Dernière mise à jour :** 17 janvier 2025  
**Version :** 1.0

## 1. Introduction

La présente politique de confidentialité décrit comment **Task Manager API** (ci-après "nous", "notre", "le service") collecte, utilise et protège vos données personnelles lorsque vous utilisez notre service de gestion de tâches.

En utilisant notre service, vous acceptez les pratiques décrites dans cette politique.

## 2. Responsable du Traitement

**Responsable du traitement :**  
ADJAKIDJE Axel  
Email : adjakidjememiaghe@gmail.com

## 3. Données Collectées

### 3.1 Données que vous nous fournissez

Lors de votre inscription et utilisation du service, nous collectons :

- **Nom** : Pour personnaliser votre expérience
- **Adresse email** : Pour l'authentification et la communication
- **Mot de passe** : Stocké de manière sécurisée (hashé avec bcrypt)
- **Photo de profil (avatar)** : Optionnelle, stockée sur Cloudinary
- **Tâches** : Les tâches que vous créez et gérez

### 3.2 Données collectées automatiquement

- **Adresse IP** : Collectée via les logs serveur pour la sécurité
- **Données de connexion** : Timestamps de connexion/déconnexion
- **Données d'utilisation** : Pour améliorer le service

## 4. Finalités du Traitement

Nous utilisons vos données personnelles pour :

1. **Fournir le service** : Gestion de vos tâches
2. **Authentification** : Vérification de votre identité
3. **Communication** : Envoi d'emails (réinitialisation de mot de passe, confirmations)
4. **Amélioration du service** : Analyse de l'utilisation pour améliorer l'expérience
5. **Sécurité** : Protection contre les fraudes et abus

## 5. Base Légale

Le traitement de vos données personnelles est basé sur :

- **Exécution du contrat** : Nécessaire pour fournir le service
- **Consentement** : Pour certaines fonctionnalités (emails marketing si applicable)
- **Intérêt légitime** : Pour la sécurité et l'amélioration du service

## 6. Destinataires des Données

Vos données peuvent être partagées avec :

### 6.1 Sous-traitants

- **Firebase (Google Cloud)** : Hébergement de la base de données Firestore
  - Localisation : États-Unis (avec Standard Contractual Clauses pour conformité RGPD)
  - Politique de confidentialité : https://policies.google.com/privacy

- **Cloudinary** : Stockage des images (avatars)
  - Localisation : Vérifier la région configurée
  - Politique de confidentialité : https://cloudinary.com/privacy

### 6.2 Autres destinataires

- **Autorités compétentes** : Si requis par la loi

## 7. Transferts Hors UE

Vos données peuvent être transférées et stockées en dehors de l'Union Européenne :

- **Firebase (Google Cloud)** : États-Unis
  - Protection : Standard Contractual Clauses (SCC) conformes au RGPD

Nous nous assurons que tous les transferts sont effectués conformément au RGPD.

## 8. Durée de Conservation

- **Données actives** : Conservées pendant la durée de votre compte
- **Données après suppression** : Supprimées définitivement dans les 30 jours suivant la suppression du compte
- **Logs** : Conservés pendant 1 an maximum
- **Codes OTP** : Supprimés automatiquement après expiration (15 minutes) ou utilisation

## 9. Vos Droits (RGPD)

Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :

### 9.1 Droit d'accès
Vous pouvez demander une copie de toutes vos données personnelles.

**Comment exercer :** `GET /api/users/me/export`

### 9.2 Droit de rectification
Vous pouvez modifier vos données personnelles à tout moment.

**Comment exercer :** `PUT /api/users/me` (à implémenter si nécessaire)

### 9.3 Droit à l'effacement
Vous pouvez demander la suppression de votre compte et de toutes vos données.

**Comment exercer :** `DELETE /api/users/me/delete`

### 9.4 Droit à la portabilité
Vous pouvez exporter vos données dans un format portable.

**Comment exercer :** `GET /api/users/me/export/portable`

### 9.5 Droit d'opposition
Vous pouvez vous opposer au traitement de vos données pour certaines finalités.

**Comment exercer :** Contactez-nous à adjakidjememiaghe@gmail.com

### 9.6 Droit de limitation
Vous pouvez demander la limitation du traitement de vos données.

**Comment exercer :** Contactez-nous à adjakidjememiaghe@gmail.com

## 10. Sécurité des Données

Nous mettons en œuvre des mesures de sécurité appropriées :

- **Chiffrement** : Mots de passe hashés avec bcrypt (salt rounds: 10)
- **Authentification** : JWT sécurisés avec expiration
- **HTTPS** : Communication chiffrée
- **Rate limiting** : Protection contre les attaques
- **Logs sécurisés** : Pas de données sensibles dans les logs

## 11. Cookies et Technologies Similaires

Notre service utilise :

- **JWT Tokens** : Stockés côté client (localStorage) pour l'authentification
- **WebSocket** : Connexions en temps réel (pas de cookies)

Nous n'utilisons pas de cookies de tracking publicitaire.

## 12. Modifications de la Politique

Nous pouvons modifier cette politique de confidentialité. En cas de modification importante :

- Nous vous informerons par email
- La nouvelle version sera disponible sur cette page
- Votre consentement sera demandé si nécessaire

## 13. Contact

Pour toute question concernant cette politique ou vos données personnelles :

**Email :** adjakidjememiaghe@gmail.com

**Délai de réponse :** 30 jours maximum (conformément au RGPD)

## 14. Réclamation

Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation auprès de :

**CNIL (Commission Nationale de l'Informatique et des Libertés)**  
3 Place de Fontenoy - TSA 80715  
75334 PARIS CEDEX 07  
Téléphone : 01 53 73 22 22  
Site web : https://www.cnil.fr

---

**Version :** 1.0  
**Date d'entrée en vigueur :** 17 janvier 2025
