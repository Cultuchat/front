import { useState, useCallback } from 'react'
import { Event } from '@/types/event'

interface SearchOptions {
  matchCount?: number
  matchThreshold?: number
  filterCategory?: string
  filterDistrict?: string
  filterDateFrom?: string
  filterDateTo?: string
  useHybrid?: boolean
}

interface SearchResult {
  success: boolean
  query: string
  count: number
  events: Event[]
}

interface UseSemanticSearchReturn {
  search: (query: string, options?: SearchOptions) => Promise<SearchResult | null>
  results: Event[] | null
  loading: boolean
  error: string | null
  query: string | null
  count: number
}

export function useSemanticSearch(): UseSemanticSearchReturn {
  const [results, setResults] = useState<Event[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState<string | null>(null)
  const [count, setCount] = useState(0)

  const search = useCallback(async (
    searchQuery: string,
    options: SearchOptions = {}
  ): Promise<SearchResult | null> => {
    if (!searchQuery || searchQuery.trim() === '') {
      setError('La consulta no puede estar vacía')
      return null
    }

    setLoading(true)
    setError(null)
    setQuery(searchQuery)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery,
          matchCount: options.matchCount || 10,
          matchThreshold: options.matchThreshold || 0.5,
          filterCategory: options.filterCategory,
          filterDistrict: options.filterDistrict,
          filterDateFrom: options.filterDateFrom,
          filterDateTo: options.filterDateTo,
          useHybrid: options.useHybrid !== undefined ? options.useHybrid : true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error en la búsqueda')
      }

      const data: SearchResult = await response.json()

      setResults(data.events)
      setCount(data.count)
      setLoading(false)

      return data

    } catch (err: any) {
      const errorMessage = err.message || 'Error desconocido en la búsqueda'
      setError(errorMessage)
      setResults(null)
      setCount(0)
      setLoading(false)

      console.error('Error en búsqueda semántica:', err)
      return null
    }
  }, [])

  return {
    search,
    results,
    loading,
    error,
    query,
    count,
  }
}

// Hook simplificado para búsquedas rápidas
export function useQuickSearch() {
  const { search, loading, error } = useSemanticSearch()

  const quickSearch = useCallback(async (query: string) => {
    return await search(query, {
      matchCount: 5,
      matchThreshold: 0.6,
      useHybrid: true,
    })
  }, [search])

  return { quickSearch, loading, error }
}
