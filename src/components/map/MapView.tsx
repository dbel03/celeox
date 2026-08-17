import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
}

interface OverpassTags {
  name?: string;
  natural?: string;
  amenity?: string;
  tourism?: string;
  drinking_water?: string;
  ele?: string;
  capacity?: string;
}

interface OverpassElement {
  id: number;
  lat: number;
  lon: number;
  tags?: OverpassTags;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

const MIN_ZOOM_POIS = 14;
const MOVE_DEBOUNCE_MS = 400;

const escapeHtml = (str: string): string =>
  str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c] as string));

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const poisLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const searchMarkerRef = useRef<L.Marker | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const poisAbortRef = useRef<AbortController | null>(null);
  const searchAbortRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [loading, setLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(14);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const icons = useMemo(() => {
    const createCustomIcon = (emoji: string, colorClass: string) =>
      L.divIcon({
        html: `<div class="${colorClass} text-white p-1 rounded-full shadow-md border-2 border-white flex items-center justify-center text-xs w-7 h-7 transition-transform hover:scale-125">${emoji}</div>`,
        className: 'custom-poi-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

    return {
      spring: createCustomIcon('💧', 'bg-blue-500'),
      peak: createCustomIcon('⛰️', 'bg-amber-600'),
      cave: createCustomIcon('🦇', 'bg-purple-600'),
      shelter: createCustomIcon('🛖', 'bg-emerald-600'),
      viewpoint: createCustomIcon('👁️', 'bg-sky-500'),
      camp: createCustomIcon('🏕️', 'bg-orange-500'),
      default: createCustomIcon('📍', 'bg-slate-600')
    };
  }, []);

  const fetchMountainPOIs = async () => {
    if (!mapRef.current || !poisLayerRef.current) return;

    const map = mapRef.current;
    const zoom = map.getZoom();
    setCurrentZoom(zoom);

    if (zoom < MIN_ZOOM_POIS) {
      poisLayerRef.current.clearLayers();
      setLoadError(null);
      return;
    }

    poisAbortRef.current?.abort();
    const controller = new AbortController();
    poisAbortRef.current = controller;

    const bounds = map.getBounds();
    const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;

    const query = `
      [out:json][timeout:25];
      (
        node["natural"="spring"](${bbox});
        node["amenity"="drinking_water"](${bbox});
        node["natural"="peak"](${bbox});
        node["natural"="cave_entrance"](${bbox});
        node["tourism"="alpine_hut"](${bbox});
        node["amenity"="shelter"](${bbox});
        node["tourism"="viewpoint"](${bbox});
        node["tourism"="camp_site"](${bbox});
      );
      out body;
    `;

    setLoading(true);
    setLoadError(null);

    try {
      let response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query),
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal
      });

      // Servidor alternativo de respaldo si el principal falla o está limitado
      if (!response.ok) {
        response = await fetch('https://overpass.kumi.systems/api/interpreter', {
          method: 'POST',
          body: 'data=' + encodeURIComponent(query),
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          signal: controller.signal
        });
      }

      if (!response.ok) {
        throw new Error(`Servidor ocupado (estado ${response.status})`);
      }

      const data: OverpassResponse = await response.json();
      poisLayerRef.current.clearLayers();

      data.elements.forEach((element) => {
        const tags = element.tags || {};
        let icon = icons.default;
        let typeName = 'Punto de Interés';
        let extraInfo = '';

        if (tags.natural === 'spring' || tags.amenity === 'drinking_water') {
          icon = icons.spring;
          typeName = 'Fuente / Agua Potable';
          extraInfo = tags.drinking_water === 'yes' ? 'Agua potable' : 'Fuente natural';
        } else if (tags.natural === 'peak') {
          icon = icons.peak;
          typeName = 'Cumbre / Pico';
          if (tags.ele) extraInfo = `Altitud: ${tags.ele} m`;
        } else if (tags.natural === 'cave_entrance') {
          icon = icons.cave;
          typeName = 'Cueva / Cavidad';
        } else if (tags.tourism === 'alpine_hut' || tags.amenity === 'shelter') {
          icon = icons.shelter;
          typeName = 'Refugio de Montaña';
          if (tags.capacity) extraInfo = `Capacidad: ${tags.capacity} plazas`;
        } else if (tags.tourism === 'viewpoint') {
          icon = icons.viewpoint;
          typeName = 'Mirador Panorámico';
        } else if (tags.tourism === 'camp_site') {
          icon = icons.camp;
          typeName = 'Zona de Acampada';
        }

        const name = escapeHtml(tags.name || typeName);
        const safeTypeName = escapeHtml(typeName);
        const safeExtraInfo = escapeHtml(extraInfo);

        L.marker([element.lat, element.lon], { icon })
          .bindPopup(
            '<div class="p-1 font-sans">' +
              '<h4 class="font-bold text-slate-800 text-sm">' + name + '</h4>' +
              '<p class="text-xs text-slate-500 font-medium">' + safeTypeName + '</p>' +
              (extraInfo ? '<p class="text-xs text-emerald-600 font-semibold mt-1">' + safeExtraInfo + '</p>' : '') +
            '</div>'
          )
          .addTo(poisLayerRef.current!);
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error al cargar datos de montaña:', error);
        setLoadError('No se pudieron cargar los puntos de esta zona. Intenta de nuevo.');
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  };

  const scheduleFetchMountainPOIs = () => {
    clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(fetchMountainPOIs, MOVE_DEBOUNCE_MS);
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    searchAbortRef.current?.abort();
    const controller = new AbortController();
    searchAbortRef.current = controller;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`,
        { headers: { 'Accept-Language': 'es' }, signal: controller.signal }
      );
      if (!response.ok) throw new Error(`Error en búsqueda: ${response.status}`);
      const data: SearchResult[] = await response.json();
      setSearchResults(data);
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error en la búsqueda:', error);
      }
    } finally {
      if (!controller.signal.aborted) setIsSearching(false);
    }
  };

  const handleSelectLocation = (result: SearchResult) => {
    if (!mapRef.current) return;

    const lat = parseFloat(result.lat);
    const lon = parseFloat(result.lon);

    mapRef.current.flyTo([lat, lon], 15, { duration: 1.5 });

    if (searchMarkerRef.current) {
      searchMarkerRef.current.setLatLng([lat, lon]);
    } else {
      const searchIcon = L.divIcon({
        html: `<div class="bg-red-500 text-white p-1 rounded-full shadow-lg border-2 border-white flex items-center justify-center text-sm w-8 h-8 animate-bounce">🔍</div>`,
        className: 'custom-search-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
      });

      searchMarkerRef.current = L.marker([lat, lon], { icon: searchIcon }).addTo(mapRef.current);
    }

    const label = escapeHtml(result.display_name.split(',')[0]);
    searchMarkerRef.current.bindPopup(`<b>${label}</b>`).openPopup();
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleGetLocation = () => {
    if (!mapRef.current) return;
    setLocationError(null);

    if (!('geolocation' in navigator)) {
      setLocationError('Tu navegador no soporta geolocalización');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const map = mapRef.current;
        if (!map) return;

        map.flyTo([latitude, longitude], 15);

        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([latitude, longitude]);
        } else {
          const userIcon = L.divIcon({
            html: `<div class="w-5 h-5 bg-blue-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>`,
            className: 'custom-user-marker',
            iconSize: [20, 20]
          });

          userMarkerRef.current = L.marker([latitude, longitude], { icon: userIcon })
            .addTo(map)
            .bindPopup('<b>📍 Estás aquí</b>')
            .openPopup();
        }
      },
      (error) => setLocationError('No se pudo acceder a tu ubicación: ' + error.message),
      { enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const ignTopografico = L.tileLayer(
      'https://www.ign.es/wmts/mapa-raster?request=GetTile&service=WMTS&version=1.0.0&layer=MTN&style=default&format=image/jpeg&TileMatrixSet=GoogleMapsCompatible&TileMatrix={z}&TileRow={y}&TileCol={x}',
      { maxZoom: 19, minZoom: 5, attribution: '© IGN' }
    );

    const openTopoMap = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      { maxZoom: 17, attribution: '© OpenTopoMap' }
    );

    const map = L.map(mapContainerRef.current, {
      center: [43.18, -4.83],
      zoom: 14, // Zoom inicial elevado a 14 para coincidir con MIN_ZOOM_POIS
      layers: [ignTopografico]
    });

    mapRef.current = map;
    poisLayerRef.current = L.layerGroup().addTo(map);

    const baseLayers = {
      "🗺️ IGN Topográfico": ignTopografico,
      "⛰️ OpenTopoMap": openTopoMap
    };

    L.control.layers(baseLayers, undefined, { position: 'topright' }).addTo(map);

    map.on('baselayerchange', (e: L.LayersControlEvent) => {
      const layer = e.layer as L.TileLayer;
      const layerMaxZoom = (layer.options.maxZoom as number) ?? 19;
      map.setMaxZoom(layerMaxZoom);
      if (map.getZoom() > layerMaxZoom) map.setZoom(layerMaxZoom);
    });

    fetchMountainPOIs();
    map.on('moveend', scheduleFetchMountainPOIs);

    return () => {
      clearTimeout(debounceTimerRef.current);
      poisAbortRef.current?.abort();
      searchAbortRef.current?.abort();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* BUSCADOR */}
      <div ref={searchBoxRef} className="absolute top-4 left-4 z-10 w-72 md:w-80">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <label htmlFor="mountain-search" className="sr-only">
            Buscar pico, fuente, cueva
          </label>
          <input
            id="mountain-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar pico, fuente, cueva..."
            className="w-full bg-slate-900/90 text-white placeholder-slate-400 text-sm px-4 py-2.5 rounded-xl border border-slate-700 shadow-xl backdrop-blur-md focus:outline-none focus:border-emerald-500 transition-all pr-10"
          />
          <button
            type="submit"
            aria-label="Buscar"
            className="absolute right-2 text-slate-400 hover:text-white p-1 transition-colors"
          >
            {isSearching ? '⏳' : '🔍'}
          </button>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-2 bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl overflow-hidden backdrop-blur-md divide-y divide-slate-800">
            {searchResults.map((res) => (
              <button
                key={res.place_id}
                onClick={() => handleSelectLocation(res)}
                className="w-full text-left px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors flex flex-col gap-0.5"
              >
                <span className="font-semibold text-emerald-400 truncate">
                  {res.display_name.split(',')[0]}
                </span>
                <span className="text-slate-400 text-[10px] truncate">
                  {res.display_name.split(',').slice(1).join(',')}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* MENSAJE DE ZOOM / CARGANDO / ERROR */}
      {currentZoom < MIN_ZOOM_POIS ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-amber-950/80 text-amber-300 text-xs px-4 py-2 rounded-full shadow-lg border border-amber-700/50 flex items-center gap-2 backdrop-blur-md">
          <span>🔍</span> Acércate al mapa para ver fuentes, cuevas y picos
        </div>
      ) : loading ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-slate-900/90 text-white text-xs px-4 py-2 rounded-full shadow-lg border border-slate-700 flex items-center gap-2 backdrop-blur-md">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
          Cargando elementos de la zona...
        </div>
      ) : loadError ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-red-950/90 text-red-300 text-xs px-4 py-2 rounded-full shadow-lg border border-red-700/50 flex items-center gap-2 backdrop-blur-md">
          <span>⚠️</span> {loadError}
        </div>
      ) : null}

      {/* ERROR DE UBICACIÓN */}
      {locationError && (
        <div className="absolute bottom-24 right-6 z-10 bg-red-950/90 text-red-300 text-xs px-4 py-2 rounded-xl shadow-lg border border-red-700/50 max-w-xs backdrop-blur-md">
          {locationError}
        </div>
      )}

      {/* UBICACIÓN ACTUAL */}
      <button
        onClick={handleGetLocation}
        aria-label="Mi ubicación actual"
        className="absolute bottom-6 right-6 z-10 bg-slate-800 hover:bg-slate-700 text-white p-3.5 rounded-full shadow-xl border border-slate-600 transition-all hover:scale-110 active:scale-95 cursor-pointer text-lg flex items-center justify-center"
        title="Mi ubicación actual"
      >
        🎯
      </button>
    </div>
  );
}