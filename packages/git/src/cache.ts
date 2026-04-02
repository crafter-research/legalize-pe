import { LRUCache } from 'lru-cache'

const FIVE_MINUTES = 5 * 60 * 1000
const ONE_HOUR = 60 * 60 * 1000

export const historyCache = new LRUCache<string, unknown>({
  max: 100,
  ttl: FIVE_MINUTES,
})

export const contentCache = new LRUCache<string, unknown>({
  max: 50,
  ttl: ONE_HOUR,
})

export const diffCache = new LRUCache<string, unknown>({
  max: 50,
  ttl: ONE_HOUR,
})
