import type { MountainFeature } from '../../services/api'
import { iconPaths } from './icons'


interface FeatureDetailPanelProps {
    feature: MountainFeature | null
    onClose: () => void
    onEdit?: (feature: MountainFeature) => void
    onDelete?: (feature: MountainFeature) => void
}


/*
 * Ficha de detalle de un elemento del mapa.
 *
 * - Móvil: bottom sheet, ocupa parte inferior de la pantalla
 *   (deja el mapa visible arriba), con esquinas redondeadas arriba.
 * - Escritorio (sm: en adelante): tarjeta flotante centrada
 *   verticalmente a la derecha, separada de los bordes,
 *   con altura máxima (no toca el navbar de arriba ni el borde
 *   inferior si el contenido es más pequeño que la pantalla).
 */
function FeatureDetailPanel({
    feature,
    onClose,
    onEdit,
    onDelete,
}: FeatureDetailPanelProps) {

    if (!feature) {
        return null
    }


    const imagePath =
        iconPaths[
            feature.type as keyof typeof iconPaths
        ]

    return (

        <div
            className="
                absolute inset-x-0 bottom-0 z-[1100]
                flex max-h-[65%] w-full flex-col
                rounded-t-3xl bg-white shadow-2xl
                sm:inset-x-auto sm:bottom-auto sm:right-4 sm:top-1/2
                sm:w-full sm:max-w-sm sm:-translate-y-1/2
                sm:max-h-[85vh] sm:rounded-2xl sm:overflow-hidden
            "
        >

            {/* ======================================
                TIRADOR (solo móvil)
            ====================================== */}

            <div className="flex shrink-0 justify-center pt-2 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-slate-300" />
            </div>


            {/* ======================================
                FOTO + BOTÓN CERRAR
            ====================================== */}

            <div className="relative h-40 w-full shrink-0 sm:h-56">

                <img
                    src={imagePath}
                    alt={feature.name ?? feature.type}
                    className="h-full w-full rounded-t-2xl object-cover sm:rounded-none"
                />

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/80 text-white transition hover:bg-slate-950"
                >
                    ✕
                </button>

            </div>


            {/* ======================================
                CONTENIDO
            ====================================== */}

            <div className="flex-1 overflow-y-auto p-6">

                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                    {feature.type}
                </span>

                <h2 className="mt-1 text-2xl font-bold text-slate-900">
                    {feature.name ?? 'Sin nombre'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                    {feature.latitude.toFixed(5)}
                    {', '}
                    {feature.longitude.toFixed(5)}
                </p>


                {/* ==================================
                    TAGS
                ================================== */}

                {feature.tags && (

                    <div className="mt-6">

                        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
                            Información OSM
                        </h3>

                        <div className="mt-3 space-y-2">

                            {Object.entries(
                                feature.tags
                            ).map(
                                ([key, value]) => (

                                    <div
                                        key={key}
                                        className="flex justify-between border-b border-slate-100 py-2 text-sm"
                                    >
                                        <span className="text-slate-500">
                                            {key}
                                        </span>

                                        <span className="font-medium text-slate-900">
                                            {value}
                                        </span>
                                    </div>

                                )
                            )}

                        </div>

                    </div>

                )}

            </div>


            {/* ======================================
                ACCIONES
            ====================================== */}

            <div className="flex shrink-0 gap-3 border-t border-slate-100 p-4">

                <button
                    type="button"
                    onClick={() => onEdit?.(feature)}
                    className="flex-1 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                    Editar
                </button>

                <button
                    type="button"
                    onClick={() => onDelete?.(feature)}
                    className="flex-1 rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                    Eliminar
                </button>

            </div>

        </div>

    )
}


export default FeatureDetailPanel