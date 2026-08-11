import fieldWorkers from '@/assets/auth/tim-mossholder-xDwEa2kaeJA-unsplash.webp'
import harvestAerial from '@/assets/auth/no-one-cares-l_5MJnbrmrs-unsplash.webp'
import watering from '@/assets/auth/markus-spiske-sFydXGrt5OA-unsplash.webp'
import greenWheat from '@/assets/auth/markus-spiske-EK8QN9O0wRk-unsplash.webp'
import grainAfrica from '@/assets/auth/marek-studzinski-81XnhS_kMmM-unsplash.webp'

export interface AuthSlide {
  src: string
  alt: string
  title: string
  caption: string
}

export const AUTH_SLIDES: AuthSlide[] = [
  {
    src: fieldWorkers,
    alt: 'Producteurs récoltant dans un champ au petit matin',
    title: 'Les données de vos producteurs restent les leurs.',
    caption:
      'Chaque accès à une fiche est tracé, nominatif et consultable par le responsable de la coopérative.',
  },
  {
    src: harvestAerial,
    alt: 'Vue aérienne de machines agricoles pendant la récolte',
    title: 'Une vue d’ensemble, sans perdre le détail.',
    caption:
      'Volumes, transactions et parcelles regroupés dans un tableau de bord lisible en un coup d’œil.',
  },
  {
    src: greenWheat,
    alt: 'Épis de blé vert sous un ciel bleu',
    title: 'La sécurité expliquée en langage clair.',
    caption:
      'Pas de jargon : « activité inhabituelle sur votre compte », jamais « anomalie détectée par l’IDS ».',
  },
  {
    src: watering,
    alt: 'Arrosoir versant de l’eau sur de jeunes pousses',
    title: 'Vos fichiers analysés avant d’être partagés.',
    caption:
      'Les colonnes sensibles sont repérées automatiquement et masquées avant tout partage externe.',
  },
  {
    src: grainAfrica,
    alt: 'Grains de blé entourant une forme évoquant le continent africain',
    title: 'Pensé pour les coopératives togolaises.',
    caption:
      'Connexion par téléphone, faible consommation de données, utilisable sur un écran de smartphone.',
  },
]
