"use client";

import { useEffect, useRef, useState } from "react";
import L, { type Circle, type LeafletMouseEvent, type Map, type Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { Loader2, LocateFixed, Search } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [-6.2, 106.816];
const DEFAULT_ZOOM = 16;
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SEARCH_URL = "https://nominatim.openstreetmap.org/search";

type Place = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

export default function BranchGeofenceMap({
  latitude,
  longitude,
  radiusMeters,
  onChange,
}: {
  latitude: number | null;
  longitude: number | null;
  radiusMeters: number;
  onChange: (coords: { latitude: number; longitude: number }) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const circleRef = useRef<Circle | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [query, setQuery] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude ?? DEFAULT_CENTER[0], longitude ?? DEFAULT_CENTER[1]],
      zoom: DEFAULT_ZOOM,
      scrollWheelZoom: false,
      zoomControl: false,
    });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer(TILE_URL, {
      attribution: TILE_ATTRIBUTION,
      maxZoom: 19,
    }).addTo(map);
    map.on("click", (event: LeafletMouseEvent) => {
      onChangeRef.current({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, [latitude, longitude]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (latitude === null || longitude === null) {
      markerRef.current?.remove();
      circleRef.current?.remove();
      markerRef.current = null;
      circleRef.current = null;
      return;
    }

    const center: [number, number] = [latitude, longitude];
    if (markerRef.current) {
      markerRef.current.setLatLng(center);
    } else {
      markerRef.current = L.marker(center).addTo(map);
    }
    if (circleRef.current) {
      circleRef.current.setLatLng(center);
      circleRef.current.setRadius(radiusMeters);
    } else {
      circleRef.current = L.circle(center, {
        radius: radiusMeters,
        weight: 1,
        fillOpacity: 0.15,
      }).addTo(map);
    }
    map.setView(center, map.getZoom(), { animate: false });
  }, [latitude, longitude, radiusMeters]);

  // Cari nama tempat (Nominatim/OSM, sama seperti pencarian di Google Maps).
  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    const text = query.trim();
    if (text.length < 3) {
      setPlaces([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({
          q: text,
          format: "jsonv2",
          limit: "5",
          countrycodes: "id",
          "accept-language": "id",
        });
        const response = await fetch(`${SEARCH_URL}?${params}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error("Pencarian tempat gagal.");
        setPlaces((await response.json()) as Place[]);
        setHint(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setPlaces([]);
        setHint(
          error instanceof Error ? error.message : "Pencarian tempat gagal.",
        );
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const pickPlace = (place: Place) => {
    const coords = {
      latitude: Number(Number(place.lat).toFixed(6)),
      longitude: Number(Number(place.lon).toFixed(6)),
    };
    onChangeRef.current(coords);
    mapRef.current?.setView([coords.latitude, coords.longitude], 17);
    setPlaces([]);
    skipNextSearch.current = true;
    setQuery(place.display_name.split(",").slice(0, 2).join(",").trim());
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setHint("Browser ini tidak mendukung lokasi.");
      return;
    }
    setLocating(true);
    setHint(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        onChangeRef.current(coords);
        mapRef.current?.setView([coords.latitude, coords.longitude], 17);
        setLocating(false);
      },
      () => {
        setLocating(false);
        setHint(
          "Lokasi tidak terbaca. Izinkan akses lokasi lalu coba lagi.",
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  };

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="border-border h-64 w-full overflow-hidden rounded-xl border"
        role="application"
        aria-label="Peta area absensi cabang"
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[1000] flex flex-col gap-2 p-3">
        <div className="pointer-events-auto relative">
          <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-1.5 shadow-md ring-1 ring-[#E8EAEE]">
            <Search className="size-3.5 shrink-0 text-[#9AA2AE]" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari tempat atau alamat"
              aria-label="Cari tempat atau alamat"
              className="text-foreground placeholder:text-[#9AA2AE] min-w-0 flex-1 bg-transparent text-[11.5px] font-semibold outline-none"
            />
            {searching && (
              <Loader2
                className="size-3.5 shrink-0 animate-spin text-[#9AA2AE]"
                aria-hidden
              />
            )}
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="text-interactive flex shrink-0 items-center gap-1 rounded-md px-1 text-[10.5px] font-extrabold hover:underline disabled:opacity-50"
            >
              {locating ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <LocateFixed className="size-3.5" aria-hidden />
              )}
              Lokasi saya
            </button>
          </div>

          {places.length > 0 && (
            <ul className="mt-1 max-h-44 overflow-y-auto rounded-lg bg-white py-1 shadow-md ring-1 ring-[#E8EAEE]">
              {places.map((place) => (
                <li key={place.place_id}>
                  <button
                    type="button"
                    onClick={() => pickPlace(place)}
                    className="hover:bg-hr-panel block w-full px-2.5 py-1.5 text-left text-[11px] font-semibold"
                  >
                    {place.display_name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {hint && (
            <p className="mt-1 rounded-lg bg-white px-2.5 py-1.5 text-[10.5px] font-semibold text-[#B91C1C] shadow-md ring-1 ring-[#E8EAEE]">
              {hint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
