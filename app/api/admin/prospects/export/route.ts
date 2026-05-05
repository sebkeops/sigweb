import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  Prospect,
  ProspectCanal,
  ProspectCategorie,
  ProspectSource,
  ProspectStatut,
} from '@/types'
import { buildExportFilename, buildProspectsCsv } from '@/lib/crm/csv-export'

const CANAL_VALUES: ProspectCanal[] = [
  'a_definir', 'terrain', 'email', 'reseaux', 'telephone', 'ecarte',
]
const STATUT_VALUES: ProspectStatut[] = [
  'a_qualifier', 'qualifie', 'contacte', 'relance_1', 'relance_2', 'relance_3',
  'repondu', 'rdv_pris', 'devis_envoye', 'signe', 'perdu', 'ecarte',
]
const CATEGORIE_VALUES: ProspectCategorie[] = [
  'boulangerie', 'boucherie', 'restaurant', 'pizzeria', 'primeur', 'fromager',
  'caviste', 'coiffeur', 'esthetique', 'kine', 'cabinet', 'menuisier',
  'plombier', 'electricien', 'peintre', 'paysagiste', 'photographe', 'autre',
]
const SOURCE_VALUES: ProspectSource[] = ['manuel', 'enrichissement', 'sourcing']

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  // Mêmes règles de filtre que la page liste — l'export respecte les
  // query params actifs (canal, statut, categorie, q).
  const sp = request.nextUrl.searchParams
  const canalRaw = sp.get('canal')
  const statutRaw = sp.get('statut')
  const categorieRaw = sp.get('categorie')
  const sourceRaw = sp.get('source')
  const q = sp.get('q')?.trim() || null

  const canal = CANAL_VALUES.includes(canalRaw as ProspectCanal) ? (canalRaw as ProspectCanal) : null
  const statut = STATUT_VALUES.includes(statutRaw as ProspectStatut) ? (statutRaw as ProspectStatut) : null
  const categorie = CATEGORIE_VALUES.includes(categorieRaw as ProspectCategorie)
    ? (categorieRaw as ProspectCategorie)
    : null
  const source = SOURCE_VALUES.includes(sourceRaw as ProspectSource)
    ? (sourceRaw as ProspectSource)
    : null

  const sortRaw = sp.get('sort')
  const sort: 'score_desc' | 'score_asc' | null =
    sortRaw === 'score_desc' || sortRaw === 'score_asc' ? sortRaw : null

  let query = supabase.from('prospects').select('*')

  if (sort === 'score_desc') {
    query = query
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  } else if (sort === 'score_asc') {
    query = query
      .order('score', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (canal) query = query.eq('canal', canal)
  if (statut) query = query.eq('statut', statut)
  if (categorie) query = query.eq('categorie', categorie)
  if (source) query = query.eq('source', source)
  if (q) {
    const safe = q.replace(/[%_,()]/g, ' ').trim()
    if (safe) {
      query = query.or(`nom_commerce.ilike.%${safe}%,ville.ilike.%${safe}%`)
    }
  }

  const { data, error } = await query
  if (error) {
    console.error('[prospects/export]', error)
    return new NextResponse('Erreur BDD', { status: 500 })
  }

  const csv = buildProspectsCsv((data ?? []) as Prospect[])
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${buildExportFilename()}"`,
      'Cache-Control': 'no-store',
    },
  })
}
