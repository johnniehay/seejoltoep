interface HasId {
  id: string;
}

export function getID<T extends HasId>(value: T|string): string {
  return (typeof value === 'string') ? value : value.id
}
