export type SortFilterItem = {
  reverse: boolean
  slug: null | string
  title: string
}

export const defaultSort: SortFilterItem = {
  slug: null,
  reverse: false,
  title: 'Alfabeties A-Z',
}

export const sorting: SortFilterItem[] = [
  defaultSort,
  { slug: '-createdAt', reverse: true, title: 'Nuutste toevoegings' },
  { slug: 'priceInZAR', reverse: false, title: 'Prys: Laag na Hoog' }, // asc
  { slug: '-priceInZAR', reverse: true, title: 'Prys: Hoog na Laag' },
]
