/**
 * useSimulationStore.js
 * Estado global de simulación para Equipo y Rentabilidad.
 * Persiste mientras la sesión está activa.
 */
import { create } from 'zustand'

const DEFAULT_TC = 1320

const useSimulationStore = create((set) => ({
  simMode: false,
  tc: DEFAULT_TC,
  teamOverrides: {},      // { [nombre]: netoARS }
  newPeople: [],          // [{ nombre, neto }]
  revenueAdjustments: {}, // { [clienteNombre]: pct (100 = base, 80 = -20%) }

  toggleSimMode: () => set(s => ({ simMode: !s.simMode })),
  setTC: (val) => set({ tc: Math.max(1, Number(val) || DEFAULT_TC) }),

  setTeamOverride: (nombre, neto) => set(s => ({
    teamOverrides: { ...s.teamOverrides, [nombre]: Number(neto) },
  })),
  removeTeamOverride: (nombre) => set(s => {
    const t = { ...s.teamOverrides }
    delete t[nombre]
    return { teamOverrides: t }
  }),

  addPerson: (person) => set(s => ({ newPeople: [...s.newPeople, person] })),
  removePerson: (idx) => set(s => ({ newPeople: s.newPeople.filter((_, i) => i !== idx) })),

  setRevenueAdjustment: (nombre, pct) => set(s => ({
    revenueAdjustments: { ...s.revenueAdjustments, [nombre]: Number(pct) },
  })),
  resetRevenueAdjustments: () => set({ revenueAdjustments: {} }),

  resetAll: () => set({
    simMode: false,
    tc: DEFAULT_TC,
    teamOverrides: {},
    newPeople: [],
    revenueAdjustments: {},
  }),
}))

export default useSimulationStore
