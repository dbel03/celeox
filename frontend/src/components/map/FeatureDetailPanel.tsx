import { useEffect, useRef, useState } from 'react'

import type { MountainFeature } from '../../services/api'
import {
    getImages,
    uploadImage,
    deleteImage,
    type MountainImage,
} from '../../services/api'

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
 * - Móvil: bottom sheet, ocupa parte inferior de la pantalla.
 * - Escritorio: tarjeta flotante centrada verticalmente a la derecha.
 *
 * El panel utiliza z-[2100] para quedar por encima del navbar
 * cuando se muestra en móvil.
 */
function FeatureDetailPanel({
    feature,
    onClose,
    onEdit,
    onDelete,
}: FeatureDetailPanelProps) {

    const fileInputRef =
        useRef<HTMLInputElement | null>(null)


    /*
     * Imágenes de la feature.
     */
    const [images, setImages] =
        useState<MountainImage[]>([])


    /*
     * Índice de la imagen actualmente visible.
     */
    const [currentImageIndex, setCurrentImageIndex] =
        useState(0)


    /*
     * Estados de carga.
     */
    const [isLoadingImage, setIsLoadingImage] =
        useState(false)

    const [isUploading, setIsUploading] =
        useState(false)

    const [isDeleting, setIsDeleting] =
        useState(false)


    /*
     * Mensaje de error.
     */
    const [error, setError] =
        useState<string | null>(null)


    /*
     * Icono que utilizamos como imagen por defecto.
     */
    const imagePath =
        feature
            ? iconPaths[
            feature.type as keyof typeof iconPaths
            ]
            : null


    /*
     * Imagen actualmente seleccionada.
     */
    const currentImage =
        images[currentImageIndex] ?? null


    /*
     * Cuando cambia la feature seleccionada,
     * cargamos sus imágenes.
     */
    useEffect(() => {

        if (!feature) {
            setImages([])
            setCurrentImageIndex(0)
            return
        }

        const featureId = feature.id

        let cancelled = false

        async function loadImages() {

            setIsLoadingImage(true)
            setError(null)

            const start = Date.now()
            const minDelay = 300

            try {

                const result =
                    await getImages(featureId)

                if (!cancelled) {
                    setImages(result)
                    setCurrentImageIndex(0)
                }

            } catch (err) {

                console.error(
                    'Error cargando imágenes:',
                    err
                )

                if (!cancelled) {
                    setImages([])
                    setCurrentImageIndex(0)
                }

            } finally {

                const elapsed =
                    Date.now() - start

                if (elapsed < minDelay) {

                    await new Promise(
                        resolve =>
                            setTimeout(
                                resolve,
                                minDelay - elapsed
                            )
                    )

                }

                if (!cancelled) {
                    setIsLoadingImage(false)
                }

            }
        }

        loadImages()

        return () => {
            cancelled = true
        }

    }, [feature?.id])


    /*
     * Abre el selector de archivos.
     */
    function handleImageEdit() {

        setError(null)

        fileInputRef.current?.click()

    }


    /*
     * Imagen anterior.
     */
    function handlePreviousImage() {

        if (images.length <= 1) {
            return
        }

        setCurrentImageIndex((current) => {

            if (current === 0) {
                return images.length - 1
            }

            return current - 1

        })

    }


    /*
     * Imagen siguiente.
     */
    function handleNextImage() {

        if (images.length <= 1) {
            return
        }

        setCurrentImageIndex((current) => {

            if (current === images.length - 1) {
                return 0
            }

            return current + 1

        })

    }


    async function handleFileChange(
        event: React.ChangeEvent<HTMLInputElement>
    ) {

        const file =
            event.target.files?.[0]


        if (!file || !feature) {
            return
        }


        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp',
            'image/heic',
            'image/heif',
        ]


        if (!allowedTypes.includes(file.type)) {

            setError(
                'Formato no permitido. Usa JPG, PNG, WEBP o HEIC.'
            )

            event.target.value = ''

            return

        }


        const maxSize =
            30 * 1024 * 1024


        if (file.size > maxSize) {

            setError(
                'La imagen no puede superar los 30 MB.'
            )

            event.target.value = ''

            return

        }


        setIsUploading(true)
        setError(null)


        try {

            /*
             * Corregimos la orientación EXIF de la imagen
             * antes de enviarla al servidor.
             *
             * Esto es especialmente importante con fotos
             * hechas desde móviles.
             */
            let uploadFile = file


            try {

                if (
                    'createImageBitmap' in window
                ) {

                    const bitmap =
                        await createImageBitmap(
                            file,
                            {
                                imageOrientation:
                                    'from-image',
                            }
                        )


                    const canvas =
                        document.createElement(
                            'canvas'
                        )


                    canvas.width =
                        bitmap.width

                    canvas.height =
                        bitmap.height


                    const context =
                        canvas.getContext('2d')


                    if (context) {

                        context.drawImage(
                            bitmap,
                            0,
                            0
                        )


                        const correctedBlob =
                            await new Promise<Blob | null>(
                                (resolve) => {

                                    canvas.toBlob(
                                        resolve,
                                        file.type ===
                                            'image/png'
                                            ? 'image/png'
                                            : 'image/jpeg',
                                        0.92
                                    )

                                }
                            )


                        if (correctedBlob) {

                            uploadFile =
                                new File(
                                    [
                                        correctedBlob,
                                    ],
                                    file.name,
                                    {
                                        type:
                                            correctedBlob.type,
                                        lastModified:
                                            Date.now(),
                                    }
                                )

                        }

                    }


                    bitmap.close()

                }

            } catch (orientationError) {

                /*
                 * Si el navegador no puede procesar
                 * la orientación, usamos la imagen
                 * original para no bloquear la subida.
                 */

                console.warn(
                    'No se pudo corregir la orientación EXIF:',
                    orientationError
                )

            }


            const result =
                await uploadImage(
                    feature.id,
                    uploadFile
                )


            setImages((current) => {

                const updatedImages = [
                    ...current,
                    result,
                ]


                setCurrentImageIndex(
                    updatedImages.length - 1
                )


                return updatedImages

            })

        } catch (err) {

            console.error(
                'Error subiendo la imagen:',
                err
            )

            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo subir la imagen.'
            )

        } finally {

            setIsUploading(false)

            event.target.value = ''

        }

    }


    /*
     * Elimina la imagen actualmente seleccionada.
     */
    async function handleDeleteImage() {

        if (
            !feature ||
            !currentImage ||
            isDeleting
        ) {
            return
        }


        const confirmed =
            window.confirm(
                '¿Seguro que quieres eliminar esta imagen?'
            )


        if (!confirmed) {
            return
        }


        setIsDeleting(true)
        setError(null)


        try {

            await deleteImage(
                feature.id,
                currentImage.id
            )


            setImages((current) => {

                const deletedIndex =
                    current.findIndex(
                        image =>
                            image.id === currentImage.id
                    )


                const updatedImages =
                    current.filter(
                        image =>
                            image.id !== currentImage.id
                    )


                if (
                    updatedImages.length > 0 &&
                    deletedIndex >= updatedImages.length
                ) {

                    setCurrentImageIndex(
                        updatedImages.length - 1
                    )

                } else if (
                    updatedImages.length > 0
                ) {

                    setCurrentImageIndex(
                        Math.min(
                            deletedIndex,
                            updatedImages.length - 1
                        )
                    )

                } else {

                    setCurrentImageIndex(0)

                }


                return updatedImages

            })

        } catch (err) {

            console.error(
                'Error eliminando la imagen:',
                err
            )

            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudo eliminar la imagen.'
            )

        } finally {

            setIsDeleting(false)

        }

    }


    /*
     * Si no hay feature seleccionada,
     * no mostramos nada.
     */
    if (!feature) {
        return null
    }


    return (

        <div
            className="
                absolute
                inset-x-0
                bottom-0
                z-[2100]
                flex
                max-h-[65%]
                w-full
                flex-col
                rounded-t-3xl
                bg-white
                shadow-2xl

                sm:inset-x-auto
                sm:bottom-auto
                sm:right-24
                sm:top-1/2
                sm:w-full
                sm:max-w-sm
                sm:-translate-y-1/2
                sm:max-h-[85vh]
                sm:rounded-2xl
                sm:overflow-hidden
            "
        >

            {/* ======================================
                FOTO + BOTONES
            ====================================== */}

            <div
                className="
                    relative
                    h-40
                    w-full
                    shrink-0
                    sm:h-56
                "
            >

                {!isLoadingImage && (

                    <img
                        src={
                            images.length > 0
                                ? images[currentImageIndex].url
                                : imagePath ?? ''
                        }
                        alt={
                            images.length > 0
                                ? images[currentImageIndex].fileName
                                : feature.name ?? feature.type
                        }
                        className="
                            h-full
                            w-full
                            rounded-t-2xl
                            object-cover
                            sm:rounded-none
                        "
                    />

                )}


                {/* LOADING */}

                {isLoadingImage && (

                    <div
                        className="
                            absolute
                            inset-0
                            flex
                            items-center
                            justify-center
                            bg-slate-100
                        "
                    >

                        <div
                            className="
                                h-9
                                w-9
                                animate-spin
                                rounded-full
                                border-4
                                border-slate-300
                                border-t-emerald-600
                            "
                        />

                    </div>

                )}


                {/* SUBIENDO */}

                {isUploading && (

                    <div
                        className="
                            absolute
                            inset-0
                            z-20
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-2
                            bg-slate-950/50
                        "
                    >

                        <div
                            className="
                                h-8
                                w-8
                                animate-spin
                                rounded-full
                                border-4
                                border-white/40
                                border-t-white
                            "
                        />

                        <span
                            className="
                                text-sm
                                font-medium
                                text-white
                            "
                        >
                            Subiendo...
                        </span>

                    </div>

                )}


                {/* ELIMINANDO */}

                {isDeleting && (

                    <div
                        className="
                            absolute
                            inset-0
                            z-20
                            flex
                            flex-col
                            items-center
                            justify-center
                            gap-2
                            bg-slate-950/50
                        "
                    >

                        <div
                            className="
                                h-8
                                w-8
                                animate-spin
                                rounded-full
                                border-4
                                border-white/40
                                border-t-white
                            "
                        />

                        <span
                            className="
                                text-sm
                                font-medium
                                text-white
                            "
                        >
                            Eliminando...
                        </span>

                    </div>

                )}


                {/* AÑADIR IMAGEN */}

                <button
                    type="button"
                    onClick={handleImageEdit}
                    disabled={
                        isUploading ||
                        isDeleting
                    }
                    aria-label="Añadir foto"
                    title="Añadir foto"
                    className="
        absolute left-3 top-3
        flex h-9 w-9
        items-center justify-center
        rounded-full
        bg-slate-950/80
        text-white
        transition
        hover:bg-slate-950
        disabled:cursor-not-allowed
        disabled:opacity-50
    "
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-5 w-5"
                    >
                        <rect
                            x="3"
                            y="4"
                            width="18"
                            height="16"
                            rx="2"
                        />

                        <circle
                            cx="8.5"
                            cy="9"
                            r="1.5"
                        />

                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3 16l5-5 4 4 2-2 7 7"
                        />
                    </svg>
                </button>


                {/* ELIMINAR IMAGEN */}

                {currentImage && (

                    <button
                        type="button"
                        onClick={handleDeleteImage}
                        disabled={
                            isUploading ||
                            isDeleting
                        }
                        aria-label="Eliminar foto"
                        title="Eliminar foto"
                        className="
                            absolute
                            left-14
                            top-3
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-full
                            bg-red-600/90
                            text-white
                            transition
                            hover:bg-red-700
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >

                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            className="h-5 w-5"
                        >

                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 7h12M9 7V5h6v2m-7 0 .8 12h6.4L16 7M10 11v5m4-5v5"
                            />

                        </svg>

                    </button>

                )}


                {/* CERRAR */}

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Cerrar"
                    className="
                        absolute
                        right-3
                        top-3
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        bg-slate-950/80
                        text-white
                        transition
                        hover:bg-slate-950
                    "
                >
                    ✕
                </button>


                {/* ANTERIOR */}

                {images.length > 1 && (

                    <button
                        type="button"
                        onClick={handlePreviousImage}
                        disabled={
                            isUploading ||
                            isDeleting
                        }
                        aria-label="Imagen anterior"
                        className="
                            absolute
                            left-3
                            top-1/2
                            flex
                            h-10
                            w-10
                            -translate-y-1/2
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-950/70
                            text-2xl
                            text-white
                            transition
                            hover:bg-slate-950
                            disabled:opacity-50
                        "
                    >
                        ‹
                    </button>

                )}


                {/* SIGUIENTE */}

                {images.length > 1 && (

                    <button
                        type="button"
                        onClick={handleNextImage}
                        disabled={
                            isUploading ||
                            isDeleting
                        }
                        aria-label="Imagen siguiente"
                        className="
                            absolute
                            right-3
                            top-1/2
                            flex
                            h-10
                            w-10
                            -translate-y-1/2
                            items-center
                            justify-center
                            rounded-full
                            bg-slate-950/70
                            text-2xl
                            text-white
                            transition
                            hover:bg-slate-950
                            disabled:opacity-50
                        "
                    >
                        ›
                    </button>

                )}


                {/* CONTADOR */}

                {images.length > 0 && (

                    <div
                        className="
                            absolute
                            bottom-3
                            left-1/2
                            -translate-x-1/2
                            rounded-full
                            bg-slate-950/75
                            px-3
                            py-1
                            text-xs
                            font-medium
                            text-white
                        "
                    >
                        {currentImageIndex + 1}
                        {' / '}
                        {images.length}
                    </div>

                )}


                {/* INPUT */}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="
                        image/jpeg,
                        image/png,
                        image/webp,
                        image/heic,
                        image/heif
                    "
                    className="hidden"
                    onChange={handleFileChange}
                />

            </div>


            {/* ======================================
                CONTENIDO
            ====================================== */}

            <div
                className="
                    flex-1
                    overflow-y-auto
                    p-6
                "
            >

                {error && (

                    <div
                        className="
                            mb-4
                            rounded-xl
                            border
                            border-red-200
                            bg-red-50
                            px-4
                            py-3
                            text-sm
                            text-red-700
                        "
                    >
                        {error}
                    </div>

                )}


                {/* TIPO */}

                <span
                    className="
                        text-xs
                        font-semibold
                        uppercase
                        tracking-wider
                        text-emerald-600
                    "
                >
                    {feature.type}
                </span>


                {/* NOMBRE */}

                <h2
                    className="
                        mt-1
                        text-2xl
                        font-bold
                        text-slate-900
                    "
                >
                    {feature.name ?? 'Sin nombre'}
                </h2>


                {/* COORDENADAS */}

                <p
                    className="
                        mt-1
                        text-sm
                        text-slate-500
                    "
                >
                    {feature.latitude.toFixed(5)}
                    {', '}
                    {feature.longitude.toFixed(5)}
                </p>


                {/* NOMBRE DE ARCHIVO */}

                {currentImage?.fileName && (

                    <p
                        className="
                            mt-2
                            truncate
                            text-xs
                            text-slate-400
                        "
                        title={currentImage.fileName}
                    >
                        {currentImage.fileName}
                    </p>

                )}


                {/* TAGS */}

                {feature.tags && (

                    <div className="mt-6">

                        <h3
                            className="
                                text-sm
                                font-semibold
                                uppercase
                                tracking-wider
                                text-slate-700
                            "
                        >
                            Información OSM
                        </h3>


                        <div
                            className="
                                mt-3
                                space-y-2
                            "
                        >

                            {Object.entries(
                                feature.tags
                            ).map(
                                ([key, value]) => (

                                    <div
                                        key={key}
                                        className="
                                            flex
                                            justify-between
                                            border-b
                                            border-slate-100
                                            py-2
                                            text-sm
                                        "
                                    >

                                        <span
                                            className="
                                                text-slate-500
                                            "
                                        >
                                            {key}
                                        </span>


                                        <span
                                            className="
                                                font-medium
                                                text-slate-900
                                            "
                                        >
                                            {value}
                                        </span>

                                    </div>

                                )
                            )}

                        </div>

                    </div>

                )}

            </div>

        </div>

    )
}


export default FeatureDetailPanel