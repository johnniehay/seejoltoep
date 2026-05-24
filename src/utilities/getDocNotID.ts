
export function getDocNotID<T>(value: T|string): T {
  if (typeof value === 'string') throw `value is string ${value} expected object (likely insufficient depth)`
  return value
}
