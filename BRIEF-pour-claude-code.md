# Implémenter la section "images qui descendent depuis la hero au scroll"

## Ce que c'est
Une section (à placer juste sous la `<Hero />`) contenant une grille 2x2 d'images.
Au chargement, les 4 images sont visuellement "hors cadre" — décalées loin en haut/à
droite/à gauche, comme si elles faisaient encore partie de la hero au-dessus. Quand
l'utilisateur scrolle et fait entrer la section dans le viewport, les 4 images
"tombent"/glissent depuis ces positions décalées jusqu'à leur emplacement final dans
la grille, avec une légère rotation qui se redresse et un scale qui passe de 0.75 à 1.
Le texte (titre/sous-titre sous chaque image) suit le même mouvement avec un léger
délai type "spring".

C'est un effet **scroll-linked** (piloté par la position de scroll, pas une simple
animation au montage) fait avec `useScroll` + `useTransform` de la librairie `motion`
(Framer Motion / `motion/react`).

## Fichiers fournis
- `scroll-gallery-section.tsx` → composant principal, à mettre dans
  `src/components/ui/scroll-gallery-section.tsx` (ou `src/components/blocks/...`)
- `motion-preset.tsx` → petit composant utilitaire pour les animations d'entrée
  (fade/slide/blur au scroll-into-view), à mettre dans `src/components/ui/motion-preset.tsx`

## Dépendances npm à installer
```
npm install motion clsx tailwind-merge lucide-react
```
(`motion` = la librairie `motion/react`, successeur de `framer-motion`, même API.)

## Prérequis shadcn/ui
Le composant utilise 3 primitives shadcn/ui standard. Si le projet cible utilise déjà
shadcn/ui, installer avec la CLI :
```
npx shadcn@latest add badge button separator
```
Sinon, ce sont des composants shadcn/ui basiques (Badge, Button, Separator) — les
générer normalement via `npx shadcn@latest init` puis la commande ci-dessus.

## Utilitaire `cn`
Le composant importe `cn` depuis `@/lib/utils` :
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
Si `src/lib/utils.ts` existe déjà (cas standard shadcn/ui), vérifier juste que la
fonction `cn` a cette signature.

## Tailwind
Le projet source est en **Tailwind v4** (`@import 'tailwindcss'`, pas de
`tailwind.config.js`). Les classes utilisées comme `perspective-distant`,
`transform-3d`, `will-change-scroll`, `lg:h-93.5` sont des utilitaires natifs
Tailwind v4 — donc si le site cible est en Tailwind v4, ça marche tel quel. **Si le
site cible est en Tailwind v3**, il faudra soit migrer, soit remplacer ces 2 classes
par du CSS custom :
- `perspective-distant` → `perspective: 1500px` (ou proche)
- `transform-3d` → `transform-style: preserve-3d`
- `will-change-scroll` → `will-change: scroll-position`

## Intégration dans la page
Dans la page qui contient la hero (ex. `app/page.tsx`) :
```tsx
import Hero from '@/components/hero'
import ScrollGallerySection from '@/components/ui/scroll-gallery-section'

export default function Page() {
  return (
    <>
      <Hero />
      <ScrollGallerySection
        id='gallery'
        badge='Portfolio'
        titleLines={['Titre ligne 1', 'Titre ligne 2 ⚡']}
        description="Texte de description sous le titre."
        items={[
          { image: '/images/gallery/1.webp', alt: '...', title: 'Titre 1', subtitle: 'Sous-titre 1', href: '/projet-1' },
          { image: '/images/gallery/2.webp', alt: '...', title: 'Titre 2', subtitle: 'Sous-titre 2', href: '/projet-2' },
          { image: '/images/gallery/3.webp', alt: '...', title: 'Titre 3', subtitle: 'Sous-titre 3', href: '/projet-3' },
          { image: '/images/gallery/4.webp', alt: '...', title: 'Titre 4', subtitle: 'Sous-titre 4', href: '/projet-4' }
        ]}
      />
    </>
  )
}
```

## Points importants à respecter (ne pas "simplifier")
1. **Le composant doit rester `'use client'`** — il utilise des hooks React
   (`useState`, `useEffect`, `useRef`) et les hooks `motion/react`.
2. **`containerRef` doit être posé sur la `<div>` qui contient la grille**, pas sur
   la `<section>` entière — c'est cette div qui sert de référence à `useScroll` pour
   calculer la progression de scroll qui pilote toute l'animation.
3. Le nombre d'items est pensé pour **exactement 4 images** (grille 2 colonnes x 2
   lignes). Si le site cible veut plus/moins d'images, il faut soit dupliquer le motif
   de valeurs de translation (`div1…div4`) pour de nouvelles cartes, soit garder 4 et
   itérer côté contenu (ex. carrousel/pagination) — ne pas juste ajouter des items au
   tableau sans étendre `cardMotion`.
4. Sur mobile (< 768px), l'animation est **désactivée exprès** (`getAnimationValues`
   renvoie des offsets à 0px) — les images restent statiques dans la grille. C'est
   voulu, pas un bug à "corriger".
5. Les valeurs `-880px`, `520px`, etc. dans `getAnimationValues` sont calibrées pour
   une hero d'une hauteur/largeur particulière (desktop large, ~xl breakpoint). Sur un
   autre site avec une hero plus courte ou plus haute, **ces valeurs devront être
   réajustées à l'œil** (elles définissent le point de départ "hors écran" des
   images) — ce n'est pas une formule universelle, juste des offsets calibrés
   visuellement. Recommandation : commencer par copier tel quel, tester au scroll, et
   ajuster ces px si les images partent trop haut/bas ou pas assez.
6. Les images peuvent avoir une variante dark-mode optionnelle via `imageDark` (ex.
   logo/illustration différente en dark mode) — sinon, laisser `imageDark` vide.

## Résultat attendu
Une section avec un badge, un titre sur 2 lignes, une description, puis une grille
2x2 d'images qui apparaissent en place (statique) au premier rendu si on est déjà
scrollé dedans, mais qui — si on scrolle depuis la hero — donnent l'impression que
les images "s'envolent" depuis la hero et atterrissent dans leur case de la grille en
douceur, avec un léger effet de perspective 3D (rotation + scale) au passage.
