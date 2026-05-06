import { describe, expect, it } from 'vitest'
import { createSerialSaveQueue } from './serial-save-queue'

/** Helper : crée une promesse contrôlable manuellement. */
function deferred<T = void>() {
  let resolve!: (v: T) => void
  let reject!: (e: unknown) => void
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('createSerialSaveQueue — sérialisation des drops successifs', () => {
  it('1 enqueue → 1 saveFn appelée avec le bon payload', async () => {
    const calls: string[] = []
    const q = createSerialSaveQueue<string>(async (p) => { calls.push(p) })
    q.enqueue('a')
    await q.waitIdle()
    expect(calls).toEqual(['a'])
  })

  it('3 enqueues SIMULTANÉS → max 2 appels (1er + dernier état coalescé)', async () => {
    const calls: string[] = []
    const d1 = deferred()
    let n = 0
    const q = createSerialSaveQueue<string>(async (p) => {
      calls.push(p)
      // Le 1er appel attend qu'on le débloque pour permettre aux enqueue suivants
      // de s'empiler dans le slot pending.
      if (n++ === 0) await d1.promise
    })

    q.enqueue('drop-1')
    // Avant d'attendre, on enqueue 2 autres rapidement
    q.enqueue('drop-2')
    q.enqueue('drop-3')

    // Le 1er appel (drop-1) est en cours, drop-2 a été écrasé par drop-3
    expect(calls).toEqual(['drop-1'])

    // Débloque le 1er save
    d1.resolve()
    await q.waitIdle()

    // Au final 2 appels : drop-1 puis drop-3 (drop-2 a été coalescé)
    expect(calls).toEqual(['drop-1', 'drop-3'])
  })

  it('7 enqueues séquentiels avec saveFn rapide → exactement 7 appels', async () => {
    const calls: string[] = []
    const q = createSerialSaveQueue<string>(async (p) => { calls.push(p) })

    // Enqueue + waitIdle entre chaque : pas de coalescing puisque chaque save
    // termine avant le suivant
    for (let i = 0; i < 7; i++) {
      q.enqueue(`drop-${i}`)
      await q.waitIdle()
    }
    expect(calls).toHaveLength(7)
    expect(calls[0]).toBe('drop-0')
    expect(calls[6]).toBe('drop-6')
  })

  it('saveFn qui throw ne casse pas la queue (peut continuer)', async () => {
    const calls: string[] = []
    const q = createSerialSaveQueue<string>(async (p) => {
      calls.push(p)
      if (p === 'fail') throw new Error('boom')
    })

    // On attend la fin de chaque save individuellement pour s'assurer que
    // les 3 sont effectivement traités (pas de coalescing à dessein ici).
    q.enqueue('a')
    await q.waitIdle()
    q.enqueue('fail')
    await q.waitIdle() // throw silenced en interne
    q.enqueue('b')
    await q.waitIdle()

    expect(calls).toEqual(['a', 'fail', 'b'])
  })

  it('enqueue après waitIdle relance la boucle proprement', async () => {
    const calls: string[] = []
    const q = createSerialSaveQueue<string>(async (p) => { calls.push(p) })
    q.enqueue('a')
    await q.waitIdle()
    expect(q.isBusy()).toBe(false)

    q.enqueue('b')
    await q.waitIdle()
    expect(calls).toEqual(['a', 'b'])
  })

  it('coalescing efficace : 100 drops rapides → 2 appels max', async () => {
    const calls: number[] = []
    const d = deferred()
    let n = 0
    const q = createSerialSaveQueue<number>(async (p) => {
      calls.push(p)
      if (n++ === 0) await d.promise
    })

    for (let i = 0; i < 100; i++) {
      q.enqueue(i)
    }
    expect(calls).toEqual([0]) // 1er appel en cours, les 99 autres coalescés en pending
    d.resolve()
    await q.waitIdle()
    // 2 appels au total : 0 puis 99 (le dernier état)
    expect(calls).toEqual([0, 99])
  })
})
