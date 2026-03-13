import type { Config } from '@netlify/functions'
import { runFullSync } from '../../src/lib/sync'

export default async function handler() {
  console.log('Starting nightly event sync...')
  try {
    const results = await runFullSync()
    const total = results.reduce((sum, r) => sum + r.eventsUpserted, 0)
    console.log(`Sync complete. Total events upserted: ${total}`)
    console.log(JSON.stringify(results, null, 2))
    return { statusCode: 200 }
  } catch (err) {
    console.error('Sync failed:', err)
    return { statusCode: 500 }
  }
}

export const config: Config = {
  schedule: '0 4 * * *',
}
