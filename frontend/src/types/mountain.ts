export interface MountainFeature {
    id: string
    type: string
    name: string | null
    latitude: number
    longitude: number
    tags: Record<string, string> | null
}