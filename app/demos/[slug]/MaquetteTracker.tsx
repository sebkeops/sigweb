'use client'

import { useEffect } from 'react'

interface MaquetteTrackerProps {
  slug: string
}

/**
 * Composant invisible qui enregistre la visite courante de `/demos/{slug}`
 * via `POST /api/maquettes/tracking` au mount, puis envoie la duree au
 * `pagehide` via Beacon API (avec fallback `fetch` keepalive).
 *
 * Pourquoi `useEffect` et pas un appel direct dans le Server Component ?
 *   - Le SC s'execute aussi pour les bots / health checks Vercel ; on
 *     ne veut pas tracker ces visites synthetiques.
 *   - Le `pagehide` ne peut etre branche que cote navigateur.
 *
 * Pas de cookie pose, pas de localStorage : conforme RGPD-friendly.
 */
export default function MaquetteTracker({ slug }: MaquetteTrackerProps) {
  useEffect(() => {
    // 1. Source : lecture de `?src=...` cote client (le SC tourne avec
    //    des URL parametres mais Next met en cache la page, donc on
    //    relit cote browser pour avoir la vraie URL du visiteur).
    //    Retrocompat : accepte `?source=email` pour les emails Resend
    //    deja partis avec l'ancien nom de parametre (avant le fix
    //    `?src=email` du fix-up Phase 3).
    const url = new URL(window.location.href)
    const src = url.searchParams.get('src') ?? url.searchParams.get('source')
    const referrer = document.referrer || null

    let visitId: string | null = null
    let cancelled = false
    const arrivalMs = Date.now()

    // 2. POST a l'arrivee
    fetch('/api/maquettes/tracking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, source: src, referrer }),
      // Pas de credentials : la route lit le cookie Supabase via
      // headers (SSR createClient), credentials 'same-origin' suffit
      credentials: 'same-origin',
    })
      .then((res) => res.json())
      .then((data: { visitId: string | null }) => {
        if (!cancelled) visitId = data.visitId
      })
      .catch(() => {
        // best-effort : si le POST echoue, on ne PATCH pas de duree
      })

    // 3. PATCH duree au pagehide / visibilitychange
    //    Strategies :
    //    a. Beacon API (le plus fiable au unload)
    //    b. fetch keepalive (fallback large compat)
    function sendDuration() {
      if (!visitId) return
      const durationSeconds = Math.round((Date.now() - arrivalMs) / 1000)
      const payload = JSON.stringify({ visitId, durationSeconds })

      // Note : Beacon API limite a POST/GET avec Blob, donc impossible
      // de l'utiliser pour notre PATCH. On utilise donc directement
      // `fetch` + `keepalive: true`, qui est le standard moderne pour
      // les envois au unload (largement supporte, gere le PATCH).

      // fetch keepalive : seul moyen propre de faire un PATCH au unload.
      // Le navigateur garde la requete en vie meme apres la fermeture
      // de l'onglet (jusqu'a ~64 Ko de payload, largement suffisant).
      try {
        void fetch('/api/maquettes/tracking', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
          credentials: 'same-origin',
        })
      } catch {
        // best-effort
      }
    }

    // pagehide est plus fiable que beforeunload (notamment sur Safari).
    // visibilitychange en complément pour le cas mobile (tab switch).
    function onPageHide() {
      sendDuration()
    }
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') sendDuration()
    }

    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      cancelled = true
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [slug])

  // Composant invisible — ne rend rien
  return null
}
