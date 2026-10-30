# Yuva – site vitrine immersif (France)

## Lancer le site
Ouvrez `index.html` via un petit serveur local (recommandé) :
- Windows : double-clic sur `lancer-serveur.bat`
- Mac / Linux : `sh lancer-serveur.sh`
- ou VS Code → extension « Live Server », ou `npx serve`
Puis http://localhost:8080. Internet est nécessaire (Tailwind, GSAP, Lenis et les polices Borel / Plus Jakarta Sans se chargent via CDN).

## Structure
- `index.html` : hero + « notre vision » (une scène), fil de progression courbe, le studio, réalisations, expérience Yuva, contact, footer, fiche projet plein écran
- `css/style.css` : design tokens (#F5F5F5, #7F59FF, #7F00FF, anthracite) et styles ; `css/legal.css` pour les pages légales
- `js/ui.js` : Lenis, GSAP/ScrollTrigger, animations de texte, scène hero, projets plein écran, formulaire
- `js/projects.js` : **les projets** (titre, lieu, textes, chiffres, photos). Contenu d'exemple à remplacer. Ajouter une entrée = un nouveau projet.
- `mentions-legales.html`, `cgv.html` : modèles à compléter et à faire valider avant la mise en ligne
- `assets/img` : images optimisées et recadrages ; `assets/logo` : logos, monogrammes transparents, favicons
- `ressources-originales/` : fichiers fournis, non modifiés

## À compléter
- Adresse email : variable `CONTACT_EMAIL` en haut de `js/ui.js` (le formulaire n'envoie rien tant qu'elle est vide), ou renseigner `data-endpoint` sur le formulaire (Formspree, Netlify Forms…).
- Liens Instagram / LinkedIn / Pinterest : remplacer les `href="#"` dans la section contact.
