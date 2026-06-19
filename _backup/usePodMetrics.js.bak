/**
 * usePodMetrics.js
 * Calcula metricas por POD y globales a partir del store compartido.
 * Usado por PodDesigner, Dashboard, Pods y Rentabilidad.
 *
 * Overhead ahora se computa dinamicamente desde los datos del sheet
 * (personas marcadas como esOverhead), eliminando valores hardcodeados.
 */
import { useMemo } from 'react'
import usePodDesignStore from '../store/usePodDesignStore'
import useDataStore from '../store/useDataStore'

export function usePodMetrics() {
  const pods = usePodDesignStore(s => s.pods)
  const assignments = usePodDesignStore(s => s.assignments)
  const clientAssignments = usePodDesignStore(s => s.clientAssignments)
  const revenueOverrides = usePodDesignStore(s => s.revenueOverrides)
  const overheadManual = usePodDesignStore(s => s.overheadManual)

  // Overhead dinamico desde datos live
  const teamData = useDataStore(s => s.teamData)
  const rate = useDataStore(s => s.rate)

  const overheadFromSheet = useMemo(() => {
    if (!teamData || !rate) return 0
    return Math.round(
      teamData
        .filter(p => p.esOverhead)
        .reduce((sum, p) => sum + (p.costoMensualARS || p.neto || 0), 0) / rate
    )
  }, [teamData, rate])

  // Overhead efectivo: manual override > sheet > fallback
  const overheadUSD = overheadManual !== null ? overheadManual : overheadFromSheet

  const podMetrics = useMemo(() => {
    const effectiveOverhead = overheadUSD || 0

    const allRevenues = pods.map(pod => {
      if (revenueOverrides[pod.id] !== undefined) return revenueOverrides[pod.id]
      return (clientAssignments[pod.id] || []).reduce((s, c) => s + c.revenue, 0)
    })
    const totalRevenue = allRevenues.reduce((s, v) => s + v, 0)

    return pods.map((pod, i) => {
      const members = assignments[pod.id] || []
      const clients = clientAssignments[pod.id] || []
      const revenue = allRevenues[i]
      const clientRevenue = clients.reduce((s, c) => s + c.revenue, 0)
      const teamCost = members.reduce((s, m) => s + (m.costoUSD * m.allocation / 100), 0)
      const gop = revenue - teamCost
      const gopPct = revenue ? (gop / revenue) * 100 : 0
      const overheadShare = totalRevenue
        ? (revenue / totalRevenue) * effectiveOverhead
        : pods.length ? effectiveOverhead / pods.length : 0
      const margin = gop - overheadShare
      const marginPct = revenue ? (margin / revenue) * 100 : 0

      return {
        ...pod,
        revenue,
        clientRevenue,
        teamCost: Math.round(teamCost),
        gop: Math.round(gop),
        gopPct: Math.round(gopPct * 10) / 10,
        overhead: Math.round(overheadShare),
        margin: Math.round(margin),
        marginPct: Math.round(marginPct * 10) / 10,
        members,
        clients,
        hasOverride: revenueOverrides[pod.id] !== undefined,
        // Compatible con PodCard y Pods.jsx
        metricas: {
          totalClientes: clients.length,
          totalEquipo: members.length,
          revenue,
          grossProfit: Math.round(gop),
          overhead: Math.round(overheadShare),
          total: Math.round(teamCost + overheadShare),
          margenPct: Math.round(marginPct * 10) / 10,
        },
        clientes: clients.map(c => ({
          nombre: c.nombre,
          revenue: c.revenue,
          _orphaned: c._orphaned,
        })),
        equipo: members.map(m => ({
          nombre: m.nombre,
          porcentajeDedicacion: m.allocation,
          _orphaned: m._orphaned,
        })),
      }
    })
  }, [pods, assignments, clientAssignments, revenueOverrides, overheadUSD])

  const globalMetrics = useMemo(() => {
    const revenue  = podMetrics.reduce((s, p) => s + p.revenue, 0)
    const teamCost = podMetrics.reduce((s, p) => s + p.teamCost, 0)
    const gop      = podMetrics.reduce((s, p) => s + p.gop, 0)
    const margin   = gop - overheadUSD
    return {
      revenue,
      teamCost,
      gop,
      gopPct: revenue ? Math.round((gop / revenue) * 1000) / 10 : 0,
      overhead: overheadUSD,
      margin,
      marginPct: revenue ? Math.round((margin / revenue) * 1000) / 10 : 0,
    }
  }, [podMetrics, overheadUSD])

  /** True si el usuario ha hecho al menos una asignacion */
  const hasDesign = useMemo(() =>
    Object.values(assignments).some(a => a.length > 0) ||
    Object.values(clientAssignments).some(a => a.length > 0),
    [assignments, clientAssignments]
  )

  /** Genera datos compatibles con resumen_equipos.json para Dashboard/Rentabilidad */
  const resumenFromDesign = useMemo(() =>
    podMetrics.map(pod => ({
      periodo: 'Diseno',
      pod: `${pod.id} ${pod.nombre}`,
      id: pod.id,
      revenue: pod.revenue,
      costoEquipo: pod.teamCost,
      gop: pod.gop,
      gopPct: pod.gopPct,
      overhead: pod.overhead,
      margen: pod.margin,
      margenPct: pod.marginPct,
    })),
    [podMetrics]
  )

  return { podMetrics, globalMetrics, hasDesign, resumenFromDesign, overheadUSD, overheadFromSheet, overheadManual }
}
