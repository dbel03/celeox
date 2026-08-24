import { useCallback, useState } from 'react'
import type { SyntheticEvent } from 'react'
import { MapContainer, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

import RouteDrawing from '../components/map/RouteDrawing'

import {
    createRoute,
    getFeaturesAlongTrack,
} from '../services/api'

import type {
    MountainFeature,
} from '../services/api'

import type {
    RoutePoint,
    CreateMountainRoute,
    RouteCriticalSection,
} from '../types/route'

import {
    ROUTE_CRITICAL_SECTIONS,
} from '../types/route'

const catalunyaCenter: [number, number] = [41.7, 1.75]

interface RouteFormState {
    name: string
    distanceKm: string
    elevationGain: string
    totalTimeMinutes: string
    movingTimeMinutes: string
    criticalSection: RouteCriticalSection
    personalRecommendations: string
}

const initialForm: RouteFormState = {
    name: '',
    distanceKm: '',
    elevationGain: '',
    totalTimeMinutes: '',
    movingTimeMinutes: '',
    criticalSection: ROUTE_CRITICAL_SECTIONS[0],
    personalRecommendations: '',
}

function CreateRoutePage() {
    const [drawing, setDrawing] = useState(true)
    const [points, setPoints] = useState<RoutePoint[]>([])

    const [nearbyFeatures, setNearbyFeatures] = useState<MountainFeature[] | null>(null)
    const [loadingNearby, setLoadingNearby] = useState(false)
    const [nearbyError, setNearbyError] = useState<string | null>(null)

    const [form, setForm] = useState<RouteFormState>(initialForm)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [savedRouteName, setSavedRouteName] = useState<string | null>(null)

    const handleUndo = useCallback(() => {
        setPoints((previous) => previous.slice(0, -1))
    }, [])

    const handleClear = useCallback(() => {
        setPoints([])
        setNearbyFeatures(null)
        setNearbyError(null)
    }, [])

    const handleCalculateNearby = useCallback(() => {
        if (points.length < 2) return

        setLoadingNearby(true)
        setNearbyError(null)

        getFeaturesAlongTrack(points)
            .then((data) => setNearbyFeatures(data))
            .catch((error) => {
                console.error('Error calculando elementos cercanos:', error)
                setNearbyError('No se han podido calcular los elementos cercanos.')
            })
            .finally(() => setLoadingNearby(false))
    }, [points])

    const handleFieldChange = <K extends keyof RouteFormState>(
        field: K,
        value: RouteFormState[K]
    ) => {
        setForm((previous) => ({ ...previous, [field]: value }))
    }

    const submitRoute = () => {
        if (points.length < 2) {
            setSaveError('Dibuja la ruta en el mapa antes de guardarla (al menos 2 puntos).')
            return
        }

        const payload: CreateMountainRoute = {
            name: form.name.trim(),
            distanceKm: Number(form.distanceKm),
            elevationGain: Number(form.elevationGain),
            totalTimeMinutes: Number(form.totalTimeMinutes),
            movingTimeMinutes: Number(form.movingTimeMinutes),
            criticalSection: form.criticalSection,
            personalRecommendations: form.personalRecommendations.trim() || null,
            track: points,
        }

        setSaving(true)
        setSaveError(null)

        createRoute(payload)
            .then((created) => {
                setSavedRouteName(created.name)
                setForm(initialForm)
                setPoints([])
                setNearbyFeatures(null)
                setDrawing(true)
            })
            .catch((error) => {
                console.error('Error creando la ruta:', error)
                setSaveError(error instanceof Error ? error.message : 'Error creando la ruta.')
            })
            .finally(() => setSaving(false))
    }

    // Nota: se tipa como SyntheticEvent (no deprecado) en vez de FormEvent,
    // ya que desde React 19.2.10 FormEvent/FormEventHandler para onSubmit
    // están marcados como deprecados en favor de SubmitEvent.
    const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
        event.preventDefault()
        submitRoute()
    }

    return (
        <div className="flex h-full w-full flex-col sm:flex-row">
            <div className="relative h-64 w-full sm:h-full sm:flex-1">
                <MapContainer center={catalunyaCenter} zoom={13} className="h-full w-full">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RouteDrawing active={drawing} points={points} onChange={setPoints} />
                </MapContainer>

                <div className="absolute left-4 top-4 z-[1000] flex gap-2">
                    <button
                        type="button"
                        onClick={() => setDrawing((active) => !active)}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow"
                    >
                        {drawing ? 'Terminar dibujo' : 'Dibujar ruta'}
                    </button>

                    <button
                        type="button"
                        onClick={handleUndo}
                        disabled={points.length === 0}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow disabled:opacity-50"
                    >
                        Deshacer
                    </button>

                    <button
                        type="button"
                        onClick={handleClear}
                        disabled={points.length === 0}
                        className="rounded-lg bg-white px-3 py-2 text-sm font-semibold shadow disabled:opacity-50"
                    >
                        Borrar
                    </button>
                </div>
            </div>

            <div className="w-full overflow-y-auto border-t border-gray-200 bg-white p-4 sm:h-full sm:w-96 sm:border-l sm:border-t-0">
                <h2 className="text-lg font-bold text-gray-800">Nueva ruta</h2>
                <p className="mt-1 text-sm text-gray-500">
                    {points.length} punto{points.length === 1 ? '' : 's'} dibujados
                </p>

                <button
                    type="button"
                    onClick={handleCalculateNearby}
                    disabled={points.length < 2 || loadingNearby}
                    className="mt-3 w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                >
                    {loadingNearby ? 'Calculando...' : 'Calcular elementos cercanos'}
                </button>

                {nearbyError && <p className="mt-2 text-sm text-red-600">{nearbyError}</p>}

                {nearbyFeatures !== null && !nearbyError && (
                    <div className="mt-2">
                        <p className="text-sm text-gray-700">
                            Elementos cercanos a la ruta: <strong>{nearbyFeatures.length}</strong>
                        </p>

                        {nearbyFeatures.length > 0 && (
                            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                                {nearbyFeatures.map((feature) => (
                                    <li
                                        key={feature.id}
                                        className="flex items-center justify-between text-sm text-gray-700"
                                    >
                                        <span>{feature.name ?? 'Sin nombre'}</span>
                                        <span className="ml-2 shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                                            {feature.type}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3">
                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Nombre
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => handleFieldChange('name', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Distancia (km)
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            required
                            value={form.distanceKm}
                            onChange={(e) => handleFieldChange('distanceKm', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Desnivel positivo (m)
                        <input
                            type="number"
                            step="1"
                            min="0"
                            required
                            value={form.elevationGain}
                            onChange={(e) => handleFieldChange('elevationGain', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Tiempo total (min)
                        <input
                            type="number"
                            step="1"
                            min="0"
                            required
                            value={form.totalTimeMinutes}
                            onChange={(e) => handleFieldChange('totalTimeMinutes', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Tiempo en movimiento (min)
                        <input
                            type="number"
                            step="1"
                            min="0"
                            required
                            value={form.movingTimeMinutes}
                            onChange={(e) => handleFieldChange('movingTimeMinutes', e.target.value)}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Sección crítica
                        <select
                            value={form.criticalSection}
                            onChange={(e) =>
                                handleFieldChange('criticalSection', e.target.value as RouteCriticalSection)
                            }
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        >
                            {ROUTE_CRITICAL_SECTIONS.map((section) => (
                                <option key={section} value={section}>
                                    {section}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="flex flex-col gap-1 text-sm text-gray-700">
                        Recomendaciones personales
                        <textarea
                            value={form.personalRecommendations}
                            onChange={(e) => handleFieldChange('personalRecommendations', e.target.value)}
                            rows={3}
                            className="rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </label>

                    {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                    {savedRouteName && (
                        <p className="text-sm text-emerald-700">
                            Ruta "{savedRouteName}" guardada correctamente.
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar ruta'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default CreateRoutePage