# Salon SLH Brest — site vitrine

Site statique (HTML, CSS, JavaScript) du salon de coiffure **SLH**, 75 rue Auguste Kervern, 29200 Brest.
Aucun outil de build : on ouvre, on édite, on publie.

## Voir le site

```bash
python3 -m http.server 8000
```

Puis ouvrir <http://localhost:8000>. (Un double-clic sur `index.html` fonctionne aussi, mais un serveur local est préférable.)

## Publier (GitHub Pages)

Le site est publié par le workflow `.github/workflows/pages.yml` à chaque push sur `main`. Il ne publie que les fichiers du site (`index.html`, `css`, `js`, `assets`, `favicon.svg`, `robots.txt`, `sitemap.xml`).

Adresse : <https://loopifyagency.github.io/site-salon-slh-brest/>

Réglage à faire une seule fois : dans le dépôt, **Settings → Pages → Build and deployment → Source : GitHub Actions**.

Avec un nom de domaine personnalisé, remplacer l'adresse ci-dessus dans `index.html` (`canonical`, `og:url`, `og:image`, `twitter:image`, JSON-LD), `sitemap.xml` et `robots.txt`.

Le dossier peut aussi être déposé tel quel chez n'importe quel hébergeur statique (Netlify, Cloudflare Pages, OVH…).
Aucune dépendance externe n'est chargée au runtime : GSAP, ScrollTrigger, SplitText, Lenis et les polices sont **hébergés localement** (pas de CDN, pas d'appel à Google Fonts).
Seule la carte Google Maps est un contenu externe (iframe).

## Structure

```
index.html            contenu, SEO, données structurées (HairSalon)
css/styles.css        tokens (palette, polices), mise en page, états responsive
js/main.js            préchargeur, parallax, sections pinnées, carrousel, lightbox…
assets/img/           photos (WebP), texture mousse, grain, image de partage
assets/fonts/         Young Serif (titres) + Figtree (texte), sous-ensemble latin
assets/vendor/        gsap, ScrollTrigger, SplitText, lenis (versions épinglées)
favicon.svg, robots.txt
```

## Direction artistique

« Salon-jardin » : mur végétal, velours vert, marbre noir et panneaux beiges aux reliefs ondulés du salon.

| Rôle | Couleur |
| --- | --- |
| Fond principal | crème `#f6efdf` |
| Surfaces / bandeaux | beige `#e4d4b4` |
| Vert nature (accent clair) | mousse `#45622f` |
| Vert profond (grandes zones) | `#30492a` |
| Texte et sections sombres | sapin `#1b2c1f` |
| Accent sur fond sombre | laiton `#d8ab5b` |

Typographies : **Young Serif** (titres) + **Figtree** (texte). Fil rouge : l'onde (cheveux, murs, rideaux) et le cadre carré du monogramme SLH.

## Accessibilité et mouvement

- Respecte `prefers-reduced-motion` : pas de préchargeur, de défilement lissé, de pin ni de parallax ; les prestations deviennent un carrousel à balayer.
- Navigation clavier, lien d'évitement, focus visible, `alt` sur les photos, lightbox en `<dialog>`.
- Le site reste lisible sans JavaScript.
- Le statut « Ouvert / Fermé » est calculé côté navigateur à l'heure de Paris.

## À compléter / vérifier avec le salon

- **Photos** : les 5 photos fournies sont petites (≈ 200 à 250 px de large) et paraissent floues dès qu'elles sont agrandies. Remplacer les fichiers de `assets/img/slh-*.webp` par des originaux en haute définition (≥ 1600 px de large) améliorera beaucoup le rendu.
- **Prestations et textes** : rédigés à partir de la brief et des avis, sans tarifs (aucun prix fourni). À valider ou ajuster.
- **Chiffres clés** : uniquement des données vérifiables (jours et heures d'ouverture). Ajouter par exemple années d'expérience ou nombre de clients **si** le salon le souhaite.
- **Nom de domaine** : si le salon prend un domaine personnalisé, mettre à jour les URL absolues (voir « Publier »).
- **Réseaux sociaux** : aucun lien fourni, donc aucun affiché.
- **Mentions légales** : à ajouter selon les informations de l'entreprise (raison sociale, SIRET, hébergeur).
- **Avis** : reproduits mot pour mot, sans notes ni étoiles (la note n'était pas fournie).
