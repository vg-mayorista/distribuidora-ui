import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  ViewChild,
  input,
  output,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import Overlay from 'ol/Overlay';
import { fromLonLat, toLonLat } from 'ol/proj';
import { defaults as defaultControls } from 'ol/control';

export interface LocationResult {
  address: string;
  zone: string;
  latitude: number;
  longitude: number;
}

const FORMOSA_LON = -58.1739;
const FORMOSA_LAT = -26.1844;
const DEFAULT_ZOOM = 14;
const SEARCH_ZOOM = 16;
const MIN_ZOOM = 12;
const MAX_ZOOM = 18;

// Formosa bbox (lon, lat) → extent en Web Mercator para OpenLayers.
const FORMOSA_EXTENT = (() => {
  const sw = fromLonLat([-58.30, -26.30]);
  const ne = fromLonLat([-58.10, -26.10]);
  return [sw[0], sw[1], ne[0], ne[1]] as [number, number, number, number];
})();

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './location-picker.html',
  styleUrl: './location-picker.css',
})
export class LocationPickerComponent implements AfterViewInit, OnDestroy {
  initialLat = input<number | null>(null);
  initialLng = input<number | null>(null);
  initialAddress = input<string>('');

  selected = output<LocationResult>();
  cancel = output<void>();

  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('pinElement', { static: true }) pinElement!: ElementRef<HTMLDivElement>;

  private map: OlMap | null = null;
  private pinOverlay: Overlay | null = null;
  private resizeObserver?: ResizeObserver;
  private reverseDebounceTimer: number | null = null;

  searchQuery = signal('');
  currentAddress = signal('');
  currentZone = signal('');
  currentLat = signal(FORMOSA_LAT);
  currentLng = signal(FORMOSA_LON);
  resolving = signal(false);
  searching = signal(false);
  searchError = signal<string | null>(null);
  resolveError = signal<string | null>(null);
  mapReady = signal(false);

  constructor() {
    effect(() => {
      const lat = this.initialLat();
      const lng = this.initialLng();
      const addr = this.initialAddress();
      if (lat != null && lng != null && this.pinOverlay && this.map) {
        this.pinOverlay.setPosition(fromLonLat([lng, lat]));
        this.map.getView().setCenter(fromLonLat([lng, lat]));
      }
      if (addr) this.currentAddress.set(addr);
    });
  }

  ngAfterViewInit(): void {
    // CRÍTICO: NO inicializar acá. El modal hace slideUp 0.2s + fadeIn 0.15s y
    // el container tiene tamaño 0 durante esa animación. Si creamos el mapa
    // acá, OL mide el container chico y queda mal renderizado.
    this.waitForContainerAndInit(500);
  }

  private waitForContainerAndInit(afterMs: number): void {
    window.setTimeout(() => {
      const el = this.mapContainer.nativeElement;
      if (el.clientWidth > 0 && el.clientHeight > 0) {
        this.initMap();
      } else if (afterMs < 2000) {
        this.waitForContainerAndInit(afterMs + 200);
      } else {
        this.initMap();
      }
    }, afterMs);
  }

  private initMap(): void {
    if (this.map) return;
    const startLat = this.initialLat() ?? FORMOSA_LAT;
    const startLng = this.initialLng() ?? FORMOSA_LON;
    const startZoom = this.initialLat() != null ? SEARCH_ZOOM : DEFAULT_ZOOM;

    this.map = new OlMap({
      target: this.mapContainer.nativeElement,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([startLng, startLat]),
        zoom: startZoom,
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
        extent: FORMOSA_EXTENT,
      }),
      controls: defaultControls(),
    });

    this.pinOverlay = new Overlay({
      element: this.pinElement.nativeElement,
      positioning: 'bottom-center',
      stopEvent: false,
    });
    this.map.addOverlay(this.pinOverlay);
    this.pinOverlay.setPosition(fromLonLat([startLng, startLat]));

    this.map.on('click', (evt) => {
      const coord = evt.coordinate;
      this.pinOverlay!.setPosition(coord);
      this.updateCoordsFromPin(coord);
    });

    this.makePinDraggable();

    this.resizeObserver = new ResizeObserver(() => {
      this.map?.updateSize();
    });
    this.resizeObserver.observe(this.mapContainer.nativeElement);

    // Segundo pase defensivo por si la animación tardó más de lo esperado.
    window.setTimeout(() => {
      this.map?.updateSize();
      this.mapReady.set(true);
    }, 300);
  }

  private makePinDraggable(): void {
    const pinEl = this.pinElement.nativeElement;
    let dragging = false;

    pinEl.style.cursor = 'grab';
    pinEl.style.touchAction = 'none';

    pinEl.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      dragging = true;
      pinEl.style.cursor = 'grabbing';
      try {
        pinEl.setPointerCapture(e.pointerId);
      } catch {
        // Si el browser no soporta pointer capture, no es crítico.
      }
    });

    pinEl.addEventListener('pointermove', (e) => {
      if (!dragging || !this.map) return;
      const pixel = this.map.getEventPixel(e);
      const coord = this.map.getCoordinateFromPixel(pixel);
      this.pinOverlay?.setPosition(coord);
    });

    pinEl.addEventListener('pointerup', (e) => {
      if (!dragging || !this.map) return;
      dragging = false;
      pinEl.style.cursor = 'grab';
      try {
        pinEl.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      const coord = this.pinOverlay?.getPosition();
      if (coord) this.updateCoordsFromPin(coord);
    });

    pinEl.addEventListener('pointercancel', () => {
      dragging = false;
      pinEl.style.cursor = 'grab';
    });
  }

  private updateCoordsFromPin(coord: number[]): void {
    const lonLat = toLonLat(coord);
    this.currentLat.set(lonLat[1]);
    this.currentLng.set(lonLat[0]);
    this.scheduleReverse(lonLat[1], lonLat[0]);
  }

  private scheduleReverse(lat: number, lng: number): void {
    if (this.reverseDebounceTimer != null) clearTimeout(this.reverseDebounceTimer);
    this.resolving.set(true);
    this.resolveError.set(null);
    this.reverseDebounceTimer = window.setTimeout(() => this.reverseGeocode(lat, lng), 400);
  }

  private async reverseGeocode(lat: number, lng: number): Promise<void> {
    try {
      const url =
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}` +
        `&accept-language=es&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const addr = (data?.display_name as string) ?? '';
      const a = data?.address ?? {};
      const zone = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.town || a.city || a.county || '';
      this.currentAddress.set(addr || `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      this.currentZone.set(zone);
    } catch (err) {
      this.resolveError.set('No se pudo resolver la dirección. Reintentá.');
      this.currentAddress.set(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      this.currentZone.set('');
    } finally {
      this.resolving.set(false);
    }
  }

  async search(): Promise<void> {
    const q = this.searchQuery().trim();
    if (!q) return;
    this.searching.set(true);
    this.searchError.set(null);
    try {
      const url =
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}` +
        `&limit=1&countrycodes=ar&accept-language=es&addressdetails=1`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        this.searchError.set('No encontramos esa dirección. Probá con la calle y la ciudad.');
        return;
      }
      const hit = data[0];
      const lat = parseFloat(hit.lat);
      const lng = parseFloat(hit.lon);
      const addr = (hit.display_name as string) ?? q;
      const a = hit.address ?? {};
      const zone = a.neighbourhood || a.suburb || a.quarter || a.city_district || a.town || a.city || a.county || '';
      this.currentLat.set(lat);
      this.currentLng.set(lng);
      this.currentAddress.set(addr);
      this.currentZone.set(zone);
      const targetCoord = fromLonLat([lng, lat]);
      this.pinOverlay?.setPosition(targetCoord);
      this.map?.getView().animate({ center: targetCoord, zoom: SEARCH_ZOOM, duration: 350 });
    } catch (err) {
      this.searchError.set('Error buscando la dirección. Revisá tu conexión.');
    } finally {
      this.searching.set(false);
    }
  }

  onSearchKey(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.search();
    }
  }

  confirm(): void {
    if (!this.currentAddress().trim()) {
      this.resolveError.set('Tocá el mapa o usá el buscador para fijar una ubicación.');
      return;
    }
    this.selected.emit({
      address: this.currentAddress().trim(),
      zone: this.currentZone().trim(),
      latitude: this.currentLat(),
      longitude: this.currentLng(),
    });
  }

  onCancel(): void {
    this.cancel.emit();
  }

  ngOnDestroy(): void {
    if (this.reverseDebounceTimer != null) clearTimeout(this.reverseDebounceTimer);
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.pinOverlay = null;
    if (this.map) {
      this.map.setTarget(undefined);
      this.map = null;
    }
  }
}
