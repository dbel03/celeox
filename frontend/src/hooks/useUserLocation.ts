import {
    useEffect,
    useState,
} from 'react'


interface UseUserLocationOptions {
    /*
     * Si es true, usa watchPosition() y mantiene la ubicación
     * actualizada en tiempo real (ej. MapView).
     *
     * Si es false, hace una única lectura con getCurrentPosition()
     * y no sigue escuchando cambios (ej. MapPreview).
     *
     * Por defecto: false
     */
    watch?: boolean

    enableHighAccuracy?: boolean
    timeout?: number
    maximumAge?: number
}


interface UseUserLocationResult {
    /*
     * [latitud, longitud] o null mientras no se ha obtenido
     * (o si el usuario ha denegado el permiso / hay error).
     */
    location: [number, number] | null

    /*
     * Mensaje de error legible, o null si no hay error.
     */
    error: string | null

    /*
     * true mientras se está esperando la primera posición.
     */
    loading: boolean
}


/*
 * Hook para obtener la ubicación del usuario.
 *
 * - watch: true  -> seguimiento continuo (watchPosition)
 * - watch: false -> lectura única (getCurrentPosition), por defecto
 */
function useUserLocation({
    watch = false,
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 5000,
}: UseUserLocationOptions = {}): UseUserLocationResult {

    const [location, setLocation] =
        useState<[number, number] | null>(null)

    const [error, setError] =
        useState<string | null>(null)

    const [loading, setLoading] =
        useState(true)


    useEffect(() => {

        if (!navigator.geolocation) {

            setError(
                'La geolocalización no está disponible en este navegador'
            )

            setLoading(false)

            return
        }


        const handleSuccess = (
            position: GeolocationPosition
        ) => {

            const {
                latitude,
                longitude,
            } = position.coords

            setLocation([
                latitude,
                longitude,
            ])

            setLoading(false)

        }


        const handleError = (
            error: GeolocationPositionError
        ) => {

            console.error(
                'Error obteniendo ubicación:',
                error
            )

            setError(
                'No se ha podido obtener tu ubicación'
            )

            setLoading(false)

        }


        const geoOptions: PositionOptions = {
            enableHighAccuracy,
            timeout,
            maximumAge,
        }


        /*
         * Modo seguimiento continuo (ej. MapView)
         */
        if (watch) {

            const watchId =
                navigator.geolocation.watchPosition(
                    handleSuccess,
                    handleError,
                    geoOptions
                )

            return () => {

                navigator.geolocation.clearWatch(
                    watchId
                )

            }

        }


        /*
         * Modo lectura única (ej. MapPreview)
         */
        navigator.geolocation.getCurrentPosition(
            handleSuccess,
            handleError,
            geoOptions
        )

        return undefined

    }, [
        watch,
        enableHighAccuracy,
        timeout,
        maximumAge,
    ])


    return {
        location,
        error,
        loading,
    }

}


export default useUserLocation