'use client'

import { useState, KeyboardEvent } from 'react'
import { useSemanticSearch } from '@/hooks/use-semantic-search'
import { Event } from '@/types/event'

interface SemanticSearchBarProps {
  onResultsChange?: (events: Event[]) => void
  placeholder?: string
  className?: string
}

export function SemanticSearchBar({
  onResultsChange,
  placeholder = '¿Qué evento buscas? Ej: "conciertos de rock este fin de semana"',
  className = '',
}: SemanticSearchBarProps) {
  const [inputValue, setInputValue] = useState('')
  const { search, results, loading, error, count } = useSemanticSearch()

  const handleSearch = async () => {
    if (!inputValue.trim()) return

    const result = await search(inputValue, {
      matchCount: 20,
      matchThreshold: 0.5,
      useHybrid: true,
    })

    if (result && onResultsChange) {
      onResultsChange(result.events)
    }
  }

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="relative">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !inputValue.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Buscando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </>
            )}
          </button>
        </div>

        {/* Mensaje de resultados */}
        {!loading && results && (
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Se encontraron <span className="font-semibold">{count}</span> eventos relacionados
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          </div>
        )}
      </div>

      {/* Sugerencias de búsqueda */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Prueba buscar:</span>
        {[
          'eventos gratis este fin de semana',
          'conciertos de rock en Lima',
          'teatro infantil',
          'exposiciones de arte',
          'eventos gastronómicos',
        ].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setInputValue(suggestion)
              search(suggestion, { matchCount: 20, useHybrid: true }).then((result) => {
                if (result && onResultsChange) {
                  onResultsChange(result.events)
                }
              })
            }}
            className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full transition-colors"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  )
}
