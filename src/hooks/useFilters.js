import { useState, useMemo } from 'react'

export function useClientFilters(clients) {
  const [filters, setFilters] = useState({
    tipo: '',
    categoria: '',
    pais: '',
    estado: '',
  })

  const [sortConfig, setSortConfig] = useState({ key: null, dir: 'asc' })

  const filtered = useMemo(() => {
    let result = [...clients]
    if (filters.tipo) result = result.filter(c => c.tipo === filters.tipo)
    if (filters.categoria) result = result.filter(c => c.categoria === filters.categoria)
    if (filters.pais) result = result.filter(c => c.pais === filters.pais)
    if (filters.estado) result = result.filter(c => c.estado === filters.estado)

    if (sortConfig.key) {
      result.sort((a, b) => {
        const av = a[sortConfig.key]
        const bv = b[sortConfig.key]
        if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1
        if (av > bv) return sortConfig.dir === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [clients, filters, sortConfig])

  const requestSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    )
  }

  return { filtered, filters, setFilters, sortConfig, requestSort }
}

export function useTeamFilters(team) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'costoUSD_1300', dir: 'desc' })

  const filtered = useMemo(() => {
    let result = team.filter(p => !p.esOverhead)
    if (search) {
      result = result.filter(p => p.nombre.toLowerCase().includes(search.toLowerCase()))
    }
    if (sortConfig.key) {
      result.sort((a, b) => {
        const av = a[sortConfig.key]
        const bv = b[sortConfig.key]
        if (av < bv) return sortConfig.dir === 'asc' ? -1 : 1
        if (av > bv) return sortConfig.dir === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [team, search, sortConfig])

  const requestSort = (key) => {
    setSortConfig(prev =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' }
    )
  }

  return { filtered, search, setSearch, sortConfig, requestSort }
}
