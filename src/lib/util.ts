export function asNotID<T>(value: T | string): T {
  if (typeof value === 'string') throw new Error(`${value} is a string`)
  return value
}
