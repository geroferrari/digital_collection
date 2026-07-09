(function () {
  const galleryWrap = document.getElementById('gallery-wrap');
  const tabs = document.getElementById('tabs');
  const openFiltersBtn = document.getElementById('open-filters');
  const filtersBadge = document.getElementById('filters-badge');
  const sortSelect = document.getElementById('sort-select');
  const viewToggle = document.getElementById('view-toggle');
  const openAddBtn = document.getElementById('open-add');
  let items = [];
  let currentFilter = 'todos';
  let sortBy = 'reciente';
  let viewMode = 'gallery';
  let loaded = false;
  let leafletMap = null;
  let lastFilteredList = [];
  let detailKeyHandler = null;
  const activeFilters = { club: 'todos', jugador: 'todos', pais: 'todos', compradores: new Set() };

  function destroyLeafletMap() {
    if (leafletMap) { leafletMap.remove(); leafletMap = null; }
  }

  const svgHanger = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 3a2 2 0 0 1 2 2c0 .9-.6 1.6-1.5 1.9L12 7.5v1.8l8.4 5.2c.9.6 1.4 1.5 1.4 2.6 0 1.6-1.3 2.9-2.9 2.9H5.1C3.5 20 2.2 18.7 2.2 17.1c0-1 .5-2 1.4-2.6L12 9.3V7.5l-.5-.6C10.6 6.6 10 5.9 10 5a2 2 0 0 1 2-2z"/></svg>`;
  const svgJersey = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M7 3 3 6l2 3 2-1v11h10V8l2 1 2-3-4-3-2 2h-4L7 3z"/></svg>`;
  const svgScarf = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"><path d="M3 5c3 2 5-2 8 0s5-2 8 0M3 9c3 2 5-2 8 0s5-2 8 0" /><path d="M4 5v13a2 2 0 0 0 2 2M20 5v13a2 2 0 0 1-2 2"/></svg>`;

  const PHOTO_SLOTS = [
    { key: 'principal', label: 'Foto principal (puesta)' },
    { key: 'frente', label: 'Foto — frente' },
    { key: 'trasera', label: 'Foto — espalda' },
  ];

  const COUNTRIES = [
    ['Argentina', -34, -64, 'AR'], ['Brasil', -10, -55, 'BR'], ['Uruguay', -33, -56, 'UY'], ['Chile', -35, -71, 'CL'],
    ['Paraguay', -23, -58, 'PY'], ['Bolivia', -17, -65, 'BO'], ['Perú', -10, -76, 'PE'], ['Colombia', 4, -72, 'CO'],
    ['Venezuela', 8, -66, 'VE'], ['Ecuador', -2, -78, 'EC'], ['México', 23, -102, 'MX'], ['Estados Unidos', 39, -98, 'US'],
    ['Canadá', 56, -106, 'CA'], ['Costa Rica', 10, -84, 'CR'], ['Panamá', 9, -80, 'PA'],
    ['España', 40, -4, 'ES'], ['Portugal', 39.5, -8, 'PT'], ['Inglaterra', 52.3, -1.2, null], ['Escocia', 56.5, -4, null],
    ['Gales', 52.3, -3.8, null], ['Irlanda', 53.4, -8, 'IE'], ['Francia', 46.6, 2.2, 'FR'], ['Alemania', 51.2, 10.4, 'DE'],
    ['Italia', 42.8, 12.6, 'IT'], ['Países Bajos', 52.1, 5.3, 'NL'], ['Bélgica', 50.8, 4.4, 'BE'], ['Suiza', 46.8, 8.2, 'CH'],
    ['Austria', 47.5, 14.6, 'AT'], ['Croacia', 45.1, 15.2, 'HR'], ['Serbia', 44.0, 21.0, 'RS'], ['Polonia', 52.0, 19.1, 'PL'],
    ['República Checa', 49.8, 15.5, 'CZ'], ['Ucrania', 48.4, 31.2, 'UA'], ['Rusia', 61.5, 105.3, 'RU'], ['Suecia', 60.1, 18.6, 'SE'],
    ['Noruega', 60.5, 8.5, 'NO'], ['Dinamarca', 56.3, 9.5, 'DK'], ['Finlandia', 64.0, 26.0, 'FI'], ['Islandia', 64.9, -19.0, 'IS'],
    ['Turquía', 38.9, 35.2, 'TR'], ['Grecia', 39.1, 21.8, 'GR'], ['Marruecos', 31.8, -7.1, 'MA'], ['Argelia', 28.0, 1.7, 'DZ'],
    ['Túnez', 33.9, 9.5, 'TN'], ['Egipto', 26.8, 30.8, 'EG'], ['Senegal', 14.5, -14.5, 'SN'], ['Nigeria', 9.1, 8.7, 'NG'],
    ['Ghana', 7.9, -1.0, 'GH'], ['Camerún', 5.7, 12.7, 'CM'], ['Costa de Marfil', 7.5, -5.5, 'CI'], ['Sudáfrica', -30.6, 22.9, 'ZA'],
    ['Japón', 36.2, 138.3, 'JP'], ['Corea del Sur', 35.9, 127.8, 'KR'], ['China', 35.9, 104.2, 'CN'], ['Arabia Saudita', 23.9, 45.1, 'SA'],
    ['Qatar', 25.3, 51.2, 'QA'], ['Emiratos Árabes Unidos', 23.4, 53.8, 'AE'], ['Irán', 32.4, 53.7, 'IR'], ['India', 21.0, 78.0, 'IN'],
    ['Australia', -25.3, 133.8, 'AU'], ['Nueva Zelanda', -41.0, 174.9, 'NZ'],
  ];

  function normalizeStr(str) {
    return String(str || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim();
  }

  const SPECIAL_FLAG_CODEPOINTS = {
    inglaterra: [0x1F3F4, 0xE0067, 0xE0062, 0xE0065, 0xE006E, 0xE0067, 0xE007F],
    escocia: [0x1F3F4, 0xE0067, 0xE0062, 0xE0073, 0xE0063, 0xE0074, 0xE007F],
    gales: [0x1F3F4, 0xE0067, 0xE0062, 0xE0077, 0xE006C, 0xE0073, 0xE007F],
  };

  function countryFlag(paisLabel) {
    const key = normalizeStr(paisLabel);
    if (!key) return '';
    if (SPECIAL_FLAG_CODEPOINTS[key]) return String.fromCodePoint(...SPECIAL_FLAG_CODEPOINTS[key]);
    const coord = COUNTRY_COORDS[key];
    if (!coord || !coord.iso) return '';
    return coord.iso.toUpperCase().replace(/./g, c => String.fromCodePoint(127397 + c.charCodeAt(0)));
  }

  const COUNTRY_COORDS = {};
  COUNTRIES.forEach(([label, lat, lon, iso]) => {
    COUNTRY_COORDS[normalizeStr(label)] = { label, lat, lon, iso };
  });

  const CONTINENT_LABELS = [
    ['AMÉRICA DEL NORTE', 45, -100],
    ['AMÉRICA DEL SUR', -15, -60],
    ['EUROPA', 50, 15],
    ['ÁFRICA', 2, 20],
    ['ASIA', 40, 90],
    ['OCEANÍA', -25, 140],
  ];

  function latLonToPercent(lat, lon) {
    return { left: ((lon + 180) / 360) * 100, top: ((90 - lat) / 180) * 100 };
  }

  const CITIES = [
    ['Buenos Aires', -34.6, -58.4], ['La Plata', -34.9, -57.9], ['Rosario', -32.9, -60.6],
    ['Córdoba', -31.4, -64.2], ['Montevideo', -34.9, -56.2], ['São Paulo', -23.5, -46.6],
    ['Río de Janeiro', -22.9, -43.2], ['Santiago', -33.4, -70.6], ['Lima', -12.0, -77.0],
    ['Bogotá', 4.7, -74.1], ['Ciudad de México', 19.4, -99.1], ['Madrid', 40.4, -3.7],
    ['Barcelona', 41.4, 2.2], ['Sevilla', 37.4, -6.0], ['Valencia', 39.5, -0.4],
    ['Bilbao', 43.3, -2.9], ['Lisboa', 38.7, -9.1], ['Oporto', 41.2, -8.6],
    ['Londres', 51.5, -0.1], ['Liverpool', 53.4, -3.0], ['Manchester', 53.5, -2.2],
    ['Birmingham', 52.5, -1.9], ['Glasgow', 55.9, -4.3], ['Edimburgo', 55.95, -3.2],
    ['Dublín', 53.3, -6.3], ['París', 48.9, 2.3], ['Marsella', 43.3, 5.4],
    ['Lyon', 45.8, 4.8], ['Berlín', 52.5, 13.4], ['Múnich', 48.1, 11.6],
    ['Dortmund', 51.5, 7.5], ['Roma', 41.9, 12.5], ['Milán', 45.5, 9.2],
    ['Turín', 45.1, 7.7], ['Nápoles', 40.8, 14.3], ['Ámsterdam', 52.4, 4.9],
    ['Róterdam', 51.9, 4.5], ['Bruselas', 50.9, 4.4], ['Lisboa', 38.7, -9.1],
    ['Moscú', 55.75, 37.6], ['Kiev', 50.5, 30.5], ['Estambul', 41.0, 28.98],
    ['Atenas', 38.0, 23.7], ['Casablanca', 33.6, -7.6], ['El Cairo', 30.0, 31.2],
    ['Dakar', 14.7, -17.5], ['Lagos', 6.5, 3.4], ['Johannesburgo', -26.2, 28.0],
    ['Tokio', 35.7, 139.7], ['Seúl', 37.6, 127.0], ['Riad', 24.7, 46.7],
    ['Doha', 25.3, 51.5], ['Dubái', 25.2, 55.3], ['Sídney', -33.9, 151.2],
  ];
  const CITY_COORDS = {};
  CITIES.forEach(([label, lat, lon]) => {
    CITY_COORDS[normalizeStr(label)] = { label, lat, lon };
  });

  function photoUrl(filename) {
    return filename ? `/static/uploads/${filename}` : null;
  }

  function itemPhotos(item) {
    const fotos = item.fotos || {};
    return PHOTO_SLOTS
      .map(slot => ({ ...slot, url: photoUrl(fotos[slot.key]) }))
      .filter(p => p.url);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function extractYear(str) {
    if (!str) return null;
    const m = String(str).match(/\d{4}/);
    return m ? parseInt(m[0], 10) : null;
  }

  function itemYear(item) {
    return extractYear(item.adquirido) || extractYear(item.temporada);
  }

  async function loadItems() {
    galleryWrap.innerHTML = '<div class="loading-state">Abriendo las vitrinas…</div>';
    try {
      const res = await fetch('/api/items');
      if (!res.ok) throw new Error('No se pudo cargar');
      items = await res.json();
    } catch (e) {
      items = [];
      galleryWrap.innerHTML = '<div class="empty"><div class="display">NO SE PUDO CONECTAR</div><p>Revisá que el servidor esté corriendo y volvé a cargar la página.</p></div>';
      updateStats();
      return;
    }
    loaded = true;
    render();
  }

  function updateStats() {
    document.getElementById('stat-total').textContent = items.length;
    document.getElementById('stat-camisetas').textContent = items.filter(i => i.tipo === 'camiseta').length;
    document.getElementById('stat-bufandas').textContent = items.filter(i => i.tipo === 'bufanda').length;
  }

  function itemNumbers() {
    const map = new Map();
    items.forEach((item, i) => map.set(item.id, items.length - i));
    return map;
  }

  function getUniqueValues(field) {
    const set = new Set();
    items.forEach(i => { if (i[field]) set.add(i[field]); });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  function activeFilterCount() {
    let n = 0;
    if (activeFilters.club !== 'todos') n++;
    if (activeFilters.jugador !== 'todos') n++;
    if (activeFilters.pais !== 'todos') n++;
    n += activeFilters.compradores.size;
    return n;
  }

  function updateFiltersBadge() {
    const n = activeFilterCount();
    filtersBadge.hidden = n === 0;
    filtersBadge.textContent = n;
  }

  function openFiltersPanel() {
    closeOverlay();
    const clubs = getUniqueValues('club');
    const jugadores = getUniqueValues('jugador');
    const paises = getUniqueValues('pais');

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close" id="close-filters">✕</button>
        <div class="form-body">
          <div class="form-title">Filtros</div>

          <div class="field">
            <label>Club / equipo</label>
            <select id="ff-club">
              <option value="todos">Todos</option>
              ${clubs.map(c => `<option value="${escapeHtml(c)}" ${activeFilters.club === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label>Jugador / dorsal</label>
            <select id="ff-jugador">
              <option value="todos">Todos</option>
              ${jugadores.map(j => `<option value="${escapeHtml(j)}" ${activeFilters.jugador === j ? 'selected' : ''}>${escapeHtml(j)}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label>País / nacionalidad</label>
            <select id="ff-pais">
              <option value="todos">Todos</option>
              ${paises.map(p => `<option value="${escapeHtml(p)}" ${activeFilters.pais === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
            </select>
          </div>

          <div class="field">
            <label>Comprado por (podés elegir los dos)</label>
            <div class="checkbox-group">
              <label class="checkbox-option"><input type="checkbox" id="ff-comprador-guille" ${activeFilters.compradores.has('Guille') ? 'checked' : ''}> Guille</label>
              <label class="checkbox-option"><input type="checkbox" id="ff-comprador-gero" ${activeFilters.compradores.has('Gero') ? 'checked' : ''}> Gero</label>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-line" id="clear-filters">Limpiar filtros</button>
            <button class="btn-solid" id="apply-filters">Aplicar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
    document.getElementById('close-filters').onclick = closeOverlay;

    document.getElementById('clear-filters').onclick = () => {
      activeFilters.club = 'todos';
      activeFilters.jugador = 'todos';
      activeFilters.pais = 'todos';
      activeFilters.compradores.clear();
      updateFiltersBadge();
      closeOverlay();
      render();
    };

    document.getElementById('apply-filters').onclick = () => {
      activeFilters.club = document.getElementById('ff-club').value;
      activeFilters.jugador = document.getElementById('ff-jugador').value;
      activeFilters.pais = document.getElementById('ff-pais').value;
      activeFilters.compradores.clear();
      if (document.getElementById('ff-comprador-guille').checked) activeFilters.compradores.add('Guille');
      if (document.getElementById('ff-comprador-gero').checked) activeFilters.compradores.add('Gero');
      updateFiltersBadge();
      closeOverlay();
      render();
    };
  }

  function getFilteredSorted() {
    let list = items.slice();
    if (currentFilter !== 'todos') list = list.filter(i => i.tipo === currentFilter);
    if (activeFilters.club !== 'todos') list = list.filter(i => (i.club || '') === activeFilters.club);
    if (activeFilters.jugador !== 'todos') list = list.filter(i => (i.jugador || '') === activeFilters.jugador);
    if (activeFilters.pais !== 'todos') list = list.filter(i => (i.pais || '') === activeFilters.pais);
    if (activeFilters.compradores.size > 0) {
      list = list.filter(i => {
        const itemCompradores = String(i.comprador || '').split(',').map(s => s.trim()).filter(Boolean);
        return itemCompradores.some(c => activeFilters.compradores.has(c));
      });
    }
    const collator = (a, b) => (a || '').localeCompare(b || '');
    if (sortBy === 'alfabetico') {
      list.sort((a, b) => collator(a.club, b.club));
    } else if (sortBy === 'temporada') {
      list.sort((a, b) => (extractYear(a.temporada) || Infinity) - (extractYear(b.temporada) || Infinity));
    } else if (sortBy === 'adquirido') {
      list.sort((a, b) => (a.adquirido || '9999-99-99').localeCompare(b.adquirido || '9999-99-99'));
    } else {
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    }
    return list;
  }

  function render() {
    if (!loaded) return;
    destroyLeafletMap();
    updateStats();
    const filtered = getFilteredSorted();
    lastFilteredList = filtered;
    const numbers = itemNumbers();

    if (items.length === 0) {
      galleryWrap.innerHTML = `
        <div class="empty">
          <div class="display">LA SALA ESTÁ VACÍA</div>
          <p>Todavía no agregaste ninguna pieza a la colección. Sumá tu primera camiseta o bufanda con su foto e historia.</p>
          <button class="add-btn" id="empty-add">+ Añadir la primera pieza</button>
        </div>`;
      document.getElementById('empty-add').onclick = () => openForm();
      return;
    }

    if (filtered.length === 0) {
      galleryWrap.innerHTML = `
        <div class="empty">
          <div class="display">SIN PIEZAS AQUÍ</div>
          <p>No hay artículos que coincidan con los filtros o la búsqueda actual. Probá cambiarlos.</p>
        </div>`;
      return;
    }

    if (viewMode === 'timeline') {
      renderTimeline(filtered, numbers);
    } else if (viewMode === 'map') {
      renderMap(filtered);
    } else {
      renderGallery(filtered, numbers);
    }
  }

  function renderGallery(filtered, numbers) {
    const cards = filtered.map(item => {
      const num = String(numbers.get(item.id)).padStart(3, '0');
      const photos = itemPhotos(item);
      const flag = countryFlag(item.pais);
      const photoHtml = photos.length
        ? `<img src="${photos[0].url}" alt="${escapeHtml(item.club)}">`
        : (item.tipo === 'bufanda' ? svgScarf : svgJersey);
      const flipBtnHtml = photos.length > 1
        ? `<button type="button" class="card-flip-btn" title="Ver otra foto">⟲</button><span class="card-photo-label mono">${escapeHtml(photos[0].label)}</span>`
        : '';
      return `
        <div class="card" data-id="${item.id}">
          <div class="card-hook">${svgHanger}</div>
          <div class="card-photo">${photoHtml}${flipBtnHtml}</div>
          <div class="card-plaque">
            <div class="card-num mono">N.° ${num} <span class="card-type-tag">· ${item.tipo === 'bufanda' ? 'Bufanda' : 'Camiseta'}</span></div>
            <div class="card-club">${escapeHtml(item.club || 'Sin nombre')}${flag ? ' ' + flag : ''}</div>
            <div class="card-meta">${escapeHtml(item.temporada || '')}${item.jugador ? ' · ' + escapeHtml(item.jugador) : ''}</div>
          </div>
        </div>`;
    }).join('');

    galleryWrap.innerHTML = `<div class="gallery">${cards}</div>`;
    galleryWrap.querySelectorAll('.card').forEach(card => {
      const item = items.find(i => i.id === card.dataset.id);
      card.addEventListener('click', () => { if (item) openDetail(item); });

      const flipBtn = card.querySelector('.card-flip-btn');
      if (flipBtn && item) {
        const photos = itemPhotos(item);
        const imgEl = card.querySelector('.card-photo img');
        const labelEl = card.querySelector('.card-photo-label');
        let idx = 0;
        flipBtn.addEventListener('click', e => {
          e.stopPropagation();
          idx = (idx + 1) % photos.length;
          imgEl.src = photos[idx].url;
          labelEl.textContent = photos[idx].label;
        });
      }
    });
  }

  function renderTimeline(filtered, numbers) {
    const groups = {};
    filtered.forEach(item => {
      const y = itemYear(item) || 'Sin fecha';
      if (!groups[y]) groups[y] = [];
      groups[y].push(item);
    });
    const years = Object.keys(groups).sort((a, b) => {
      if (a === 'Sin fecha') return 1;
      if (b === 'Sin fecha') return -1;
      return Number(a) - Number(b);
    });

    const html = years.map(y => {
      const entries = groups[y].map(item => {
        const num = String(numbers.get(item.id)).padStart(3, '0');
        const photos = itemPhotos(item);
        const thumbHtml = photos.length
          ? `<img src="${photos[0].url}" alt="${escapeHtml(item.club)}">`
          : (item.tipo === 'bufanda' ? svgScarf : svgJersey);
        return `
          <div class="timeline-item" data-id="${item.id}">
            <div class="timeline-thumb">${thumbHtml}</div>
            <div class="timeline-info">
              <div class="timeline-num mono">N.° ${num}</div>
              <div class="timeline-club">${escapeHtml(item.club || 'Sin nombre')}${countryFlag(item.pais) ? ' ' + countryFlag(item.pais) : ''}</div>
              <div class="timeline-meta">${item.tipo === 'bufanda' ? 'Bufanda' : 'Camiseta'}${item.temporada ? ' · ' + escapeHtml(item.temporada) : ''}${item.comprador ? ' · ' + escapeHtml(item.comprador) : ''}</div>
            </div>
          </div>`;
      }).join('');
      return `
        <div class="timeline-year-group">
          <div class="timeline-year mono">${y}</div>
          <div class="timeline-entries">${entries}</div>
        </div>`;
    }).join('');

    galleryWrap.innerHTML = `<div class="timeline">${html}</div>`;
    galleryWrap.querySelectorAll('.timeline-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = items.find(i => i.id === el.dataset.id);
        if (item) openDetail(item);
      });
    });
  }

  function buildMapPins(filtered) {
    const groups = {};
    let noCountryCount = 0;
    filtered.forEach(item => {
      const key = normalizeStr(item.pais);
      if (!key) { noCountryCount++; return; }
      if (!groups[key]) groups[key] = { label: item.pais, items: [] };
      groups[key].items.push(item);
    });

    const pins = [];
    const unmapped = [];
    Object.keys(groups).forEach(key => {
      const coord = COUNTRY_COORDS[key];
      if (!coord) { unmapped.push(groups[key].label); return; }
      // Prefer a city-level coordinate when every item in this group shares a known city.
      const cityKeys = new Set(groups[key].items.map(i => normalizeStr(i.ciudad)).filter(Boolean));
      let lat = coord.lat;
      let lon = coord.lon;
      if (cityKeys.size === 1) {
        const cityCoord = CITY_COORDS[[...cityKeys][0]];
        if (cityCoord) { lat = cityCoord.lat; lon = cityCoord.lon; }
      }
      pins.push({ label: groups[key].label, items: groups[key].items, lat, lon });
    });

    const notes = [];
    if (unmapped.length) notes.push(`No pudimos ubicar en el mapa: ${unmapped.map(escapeHtml).join(', ')}.`);
    if (noCountryCount > 0) notes.push(`${noCountryCount} pieza(s) sin país cargado.`);
    return { pins, notes };
  }

  function renderMap(filtered) {
    const { pins, notes } = buildMapPins(filtered);

    galleryWrap.innerHTML = `
      <div class="map-wrap">
        <div class="world-map" id="world-map"></div>
        ${notes.length ? `<div class="map-notes">${notes.map(n => `<p>${n}</p>`).join('')}</div>` : ''}
      </div>`;

    if (window.L) {
      initLeafletMap(pins);
    } else {
      renderGridMap(pins);
    }
  }

  function initLeafletMap(pins) {
    const mapEl = document.getElementById('world-map');
    leafletMap = L.map(mapEl, { scrollWheelZoom: true }).setView([15, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(leafletMap);

    const brassIcon = L.divIcon({
      className: 'leaflet-brass-pin',
      html: '<span class="map-pin-dot"></span>',
      iconSize: [14, 14],
      iconAnchor: [7, 14],
      popupAnchor: [0, -16],
    });

    pins.forEach(p => {
      const marker = L.marker([p.lat, p.lon], { icon: brassIcon }).addTo(leafletMap);
      const popupEl = document.createElement('div');
      popupEl.innerHTML = `
        <div class="map-popover-title mono">${escapeHtml(p.label)}</div>
        ${p.items.map(item => `<button type="button" class="map-popover-item" data-id="${item.id}">${escapeHtml(item.club)}</button>`).join('')}`;
      popupEl.querySelectorAll('.map-popover-item').forEach(btn => {
        btn.onclick = () => {
          const item = items.find(i => i.id === btn.dataset.id);
          if (item) openDetail(item);
        };
      });
      marker.bindPopup(popupEl);
    });

    if (pins.length) {
      leafletMap.fitBounds(L.latLngBounds(pins.map(p => [p.lat, p.lon])).pad(0.3), { maxZoom: 6 });
    }
    setTimeout(() => leafletMap && leafletMap.invalidateSize(), 80);
  }

  function renderGridMap(pins) {
    const mapEl = document.getElementById('world-map');
    const pinsWithPos = pins.map(p => ({ ...p, ...latLonToPercent(p.lat, p.lon) }));

    const pinsHtml = pinsWithPos.map((p, i) => `
      <button type="button" class="map-pin" style="left:${p.left}%; top:${p.top}%" data-idx="${i}" title="${escapeHtml(p.label)} (${p.items.length})">
        <span class="map-pin-dot"></span>
        ${p.items.length > 1 ? `<span class="map-pin-count">${p.items.length}</span>` : ''}
      </button>`).join('');

    const labelsHtml = CONTINENT_LABELS.map(([label, lat, lon]) => {
      const pos = latLonToPercent(lat, lon);
      return `<div class="map-continent-label" style="left:${pos.left}%; top:${pos.top}%">${label}</div>`;
    }).join('');

    mapEl.innerHTML = `${labelsHtml}${pinsHtml}`;
    mapEl.querySelectorAll('.map-pin').forEach(pinEl => {
      pinEl.addEventListener('click', e => {
        e.stopPropagation();
        openMapPopover(pinEl, pinsWithPos[parseInt(pinEl.dataset.idx, 10)]);
      });
    });
  }

  function openMapPopover(pinEl, group) {
    document.querySelectorAll('.map-popover').forEach(el => el.remove());
    const pop = document.createElement('div');
    pop.className = 'map-popover';
    pop.style.left = pinEl.style.left;
    pop.style.top = pinEl.style.top;
    pop.innerHTML = `
      <div class="map-popover-title mono">${escapeHtml(group.label)}</div>
      ${group.items.map(item => `<button type="button" class="map-popover-item" data-id="${item.id}">${escapeHtml(item.club)}</button>`).join('')}`;
    pinEl.closest('.world-map').appendChild(pop);
    pop.querySelectorAll('.map-popover-item').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        const item = items.find(i => i.id === btn.dataset.id);
        if (item) openDetail(item);
      };
    });
    const closeHandler = e => {
      if (!pop.contains(e.target) && e.target !== pinEl) {
        pop.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => document.addEventListener('click', closeHandler), 0);
  }

  function closeOverlay() {
    const ov = document.querySelector('.overlay');
    if (ov) ov.remove();
    if (detailKeyHandler) {
      document.removeEventListener('keydown', detailKeyHandler);
      detailKeyHandler = null;
    }
  }

  function formatDate(d) {
    try {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return d; }
  }

  function openLightbox(photos, startIndex) {
    if (!photos.length) return;
    let idx = startIndex;
    const lb = document.createElement('div');
    lb.className = 'lightbox';

    function paint() {
      lb.innerHTML = `
        <button class="lightbox-close" id="lightbox-close">✕</button>
        ${photos.length > 1 ? '<button class="lightbox-nav lightbox-prev" id="lightbox-prev">‹</button>' : ''}
        <img src="${photos[idx].url}" alt="${escapeHtml(photos[idx].label)}">
        ${photos.length > 1 ? '<button class="lightbox-nav lightbox-next" id="lightbox-next">›</button>' : ''}
        <div class="lightbox-caption mono">${escapeHtml(photos[idx].label)}</div>`;
      document.getElementById('lightbox-close').onclick = () => lb.remove();
      if (photos.length > 1) {
        document.getElementById('lightbox-prev').onclick = () => { idx = (idx - 1 + photos.length) % photos.length; paint(); };
        document.getElementById('lightbox-next').onclick = () => { idx = (idx + 1) % photos.length; paint(); };
      }
    }
    paint();
    lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); });
    document.body.appendChild(lb);
  }

  function openDetail(item) {
    closeOverlay();
    const numbers = itemNumbers();
    const num = String(numbers.get(item.id)).padStart(3, '0');
    const photos = itemPhotos(item);
    let selectedIdx = 0;

    const navList = lastFilteredList.length ? lastFilteredList : items;
    const navIdx = navList.findIndex(i => i.id === item.id);
    const hasPrev = navIdx > 0;
    const hasNext = navIdx >= 0 && navIdx < navList.length - 1;
    const mainPhotoHtml = photos.length
      ? `<img src="${photos[0].url}" alt="${escapeHtml(item.club)}" id="vitrina-main-img">`
      : (item.tipo === 'bufanda' ? svgScarf : svgJersey);
    const thumbsHtml = photos.length > 1
      ? `<div class="vitrina-thumbs">${photos.map((p, i) => `
          <button type="button" class="vitrina-thumb ${i === 0 ? 'active' : ''}" data-url="${p.url}" title="${p.label}">
            <img src="${p.url}" alt="${p.label}">
          </button>`).join('')}</div>`
      : '';

    const fields = [];
    if (item.temporada) fields.push(['Temporada', item.temporada]);
    if (item.jugador) fields.push(['Jugador / dorsal', item.jugador]);
    if (item.tipo === 'camiseta' && item.talla) fields.push(['Talla', item.talla]);
    if (item.tipo === 'bufanda' && item.origen) fields.push(['Origen', item.origen]);
    if (item.categoria) fields.push(['Categoría', item.categoria === 'seleccion' ? 'Selección nacional' : 'Club']);
    if (item.categoria !== 'seleccion' && item.liga) fields.push(['Liga', item.liga]);
    if (item.categoria !== 'seleccion' && item.ciudad) fields.push(['Ciudad', item.ciudad]);
    if (item.pais) fields.push(['País', `${item.pais}${countryFlag(item.pais) ? ' ' + countryFlag(item.pais) : ''}`]);
    if (item.autenticidad) fields.push(['Autenticidad', item.autenticidad]);
    if (item.comprador) fields.push(['Comprado por', item.comprador]);
    if (item.adquirido) fields.push(['Adquirida', formatDate(item.adquirido)]);

    const fieldsHtml = fields.map(([k, v]) => `
      <div class="vitrina-field"><div class="k">${k}</div><div class="v">${escapeHtml(v)}</div></div>
    `).join('');

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close" id="close-detail">✕</button>
        ${hasPrev ? '<button type="button" class="modal-nav modal-prev" id="detail-prev" title="Pieza anterior">‹</button>' : ''}
        ${hasNext ? '<button type="button" class="modal-nav modal-next" id="detail-next" title="Pieza siguiente">›</button>' : ''}
        <div class="vitrina-photo ${photos.length ? 'clickable' : ''}">${mainPhotoHtml}</div>
        ${thumbsHtml}
        <div class="vitrina-body">
          <div class="vitrina-num mono">PIEZA N.° ${num}</div>
          <div class="vitrina-title">${escapeHtml(item.club || 'Sin nombre')}${countryFlag(item.pais) ? ' ' + countryFlag(item.pais) : ''}</div>
          <div class="vitrina-tags">
            <span class="vitrina-tag">${item.tipo === 'bufanda' ? 'Bufanda' : 'Camiseta'}</span>
            ${item.temporada ? `<span class="vitrina-tag">${escapeHtml(item.temporada)}</span>` : ''}
          </div>
          <div class="vitrina-row">${fieldsHtml}</div>
          ${item.historia ? `<div class="vitrina-story">${escapeHtml(item.historia)}</div>` : ''}
          <div class="vitrina-actions">
            <button class="btn-line" id="edit-item">Editar</button>
            <button class="btn-line danger" id="delete-item">Eliminar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
    document.getElementById('close-detail').onclick = closeOverlay;

    if (hasPrev) document.getElementById('detail-prev').onclick = () => openDetail(navList[navIdx - 1]);
    if (hasNext) document.getElementById('detail-next').onclick = () => openDetail(navList[navIdx + 1]);

    detailKeyHandler = e => {
      if (e.key === 'ArrowLeft' && hasPrev) openDetail(navList[navIdx - 1]);
      else if (e.key === 'ArrowRight' && hasNext) openDetail(navList[navIdx + 1]);
      else if (e.key === 'Escape') closeOverlay();
    };
    document.addEventListener('keydown', detailKeyHandler);

    const vitrinaPhotoEl = overlay.querySelector('.vitrina-photo');
    if (photos.length) {
      vitrinaPhotoEl.onclick = () => openLightbox(photos, selectedIdx);
    }
    overlay.querySelectorAll('.vitrina-thumb').forEach((thumb, i) => {
      thumb.onclick = () => {
        selectedIdx = i;
        const mainImg = document.getElementById('vitrina-main-img');
        if (mainImg) mainImg.src = thumb.dataset.url;
        overlay.querySelectorAll('.vitrina-thumb').forEach(t => t.classList.toggle('active', t === thumb));
      };
    });
    document.getElementById('edit-item').onclick = () => openForm(item);
    document.getElementById('delete-item').onclick = async () => {
      if (!confirm('¿Eliminar esta pieza del museo? Esta acción no se puede deshacer.')) return;
      try {
        const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
        items = items.filter(i => i.id !== item.id);
        closeOverlay();
        render();
      } catch (e) {
        alert('No se pudo eliminar la pieza.');
      }
    };
  }

  function openForm(existing) {
    closeOverlay();
    const isEdit = !!existing;
    const data = existing ? { ...existing } : { tipo: 'camiseta' };
    let currentTipo = data.tipo || 'camiseta';
    let currentCategoria = data.categoria || 'club';
    const existingCompradores = new Set(
      String(data.comprador || '').split(',').map(s => s.trim()).filter(Boolean)
    );
    const existingFotos = data.fotos || {};
    const pendingFiles = {};

    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.innerHTML = `
      <div class="modal">
        <button class="modal-close" id="close-form">✕</button>
        <div class="form-body">
          <div class="form-title">${isEdit ? 'Editar pieza' : 'Nueva pieza'}</div>

          <div class="field">
            <label>Tipo de artículo</label>
            <div class="type-toggle">
              <button type="button" class="type-btn ${currentTipo === 'camiseta' ? 'active' : ''}" data-tipo="camiseta">Camiseta</button>
              <button type="button" class="type-btn ${currentTipo === 'bufanda' ? 'active' : ''}" data-tipo="bufanda">Bufanda</button>
            </div>
          </div>

          <div class="field">
            <label>Fotos (hasta 3: puesta, frente y espalda)</label>
            <div class="photo-slots">
              ${PHOTO_SLOTS.map(slot => {
                const url = photoUrl(existingFotos[slot.key]);
                return `
                <div class="photo-slot" data-slot="${slot.key}">
                  <div class="photo-slot-label">${slot.label}</div>
                  <div class="photo-preview" id="photo-preview-${slot.key}">
                    ${url ? `<img src="${url}">` : `<div class="hint">Sin foto</div>`}
                  </div>
                  <div class="photo-actions">
                    <button type="button" class="photo-btn" data-action="camera" data-slot="${slot.key}">📷</button>
                    <button type="button" class="photo-btn" data-action="gallery" data-slot="${slot.key}">🖼</button>
                  </div>
                  <input type="file" class="camera-input" data-slot="${slot.key}" accept="image/*" capture="environment" style="display:none">
                  <input type="file" class="gallery-input" data-slot="${slot.key}" accept="image/*" style="display:none">
                </div>`;
              }).join('')}
            </div>
          </div>

          <div class="field">
            <label>Club / equipo</label>
            <input type="text" id="f-club" value="${escapeHtml(data.club || '')}" placeholder="Ej: River Plate">
          </div>

          <div class="row2">
            <div class="field">
              <label>Temporada / año</label>
              <input type="text" id="f-temporada" value="${escapeHtml(data.temporada || '')}" placeholder="Ej: 1996/97">
            </div>
            <div class="field">
              <label>Jugador / dorsal</label>
              <input type="text" id="f-jugador" value="${escapeHtml(data.jugador || '')}" placeholder="Ej: 9 - Crespo">
            </div>
          </div>

          <div class="row2">
            <div class="field">
              <label id="extra-label">${currentTipo === 'bufanda' ? 'Origen' : 'Talla'}</label>
              <input type="text" id="f-extra" value="${escapeHtml(currentTipo === 'bufanda' ? (data.origen || '') : (data.talla || ''))}" placeholder="${currentTipo === 'bufanda' ? 'Ej: comprada en la cancha' : 'Ej: M'}">
            </div>
            <div class="field">
              <label>Fecha de adquisición</label>
              <input type="date" id="f-adquirido" value="${data.adquirido || ''}">
            </div>
          </div>

          <div class="field">
            <label>Comprado por</label>
            <div class="checkbox-group">
              <label class="checkbox-option"><input type="checkbox" id="f-comprador-guille" ${existingCompradores.has('Guille') ? 'checked' : ''}> Guille</label>
              <label class="checkbox-option"><input type="checkbox" id="f-comprador-gero" ${existingCompradores.has('Gero') ? 'checked' : ''}> Gero</label>
            </div>
          </div>

          <div class="field">
            <label>¿Es de un equipo o de una selección?</label>
            <div class="type-toggle">
              <button type="button" class="cat-btn ${currentCategoria === 'club' ? 'active' : ''}" data-categoria="club">Equipo / club</button>
              <button type="button" class="cat-btn ${currentCategoria === 'seleccion' ? 'active' : ''}" data-categoria="seleccion">Selección nacional</button>
            </div>
          </div>

          <div class="row2" id="club-extra-fields" style="${currentCategoria === 'seleccion' ? 'display:none;' : ''}">
            <div class="field">
              <label>Liga</label>
              <input type="text" id="f-liga" value="${escapeHtml(data.liga || '')}" placeholder="Ej: Premier League">
            </div>
            <div class="field">
              <label>Ciudad</label>
              <input type="text" id="f-ciudad" value="${escapeHtml(data.ciudad || '')}" placeholder="Ej: Liverpool">
            </div>
          </div>

          <div class="row2">
            <div class="field">
              <label>País</label>
              <input type="text" id="f-pais" list="pais-list" value="${escapeHtml(data.pais || '')}" placeholder="Ej: Inglaterra">
              <datalist id="pais-list">${COUNTRIES.map(c => `<option value="${c[0]}"></option>`).join('')}</datalist>
            </div>
            <div class="field">
              <label>Autenticidad</label>
              <select id="f-autenticidad">
                <option value="Original" ${data.autenticidad === 'Original' ? 'selected' : ''}>Original</option>
                <option value="Réplica" ${data.autenticidad === 'Réplica' ? 'selected' : ''}>Réplica</option>
                <option value="No se sabe" ${!data.autenticidad || data.autenticidad === 'No se sabe' ? 'selected' : ''}>No se sabe</option>
              </select>
            </div>
          </div>

          <div class="field">
            <label>Historia / notas</label>
            <textarea id="f-historia" placeholder="¿De dónde salió esta pieza? ¿Qué significa para vos?">${escapeHtml(data.historia || '')}</textarea>
          </div>

          <div class="form-actions">
            <button class="btn-solid" id="save-item">${isEdit ? 'Guardar cambios' : 'Añadir al museo'}</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeOverlay(); });
    document.getElementById('close-form').onclick = closeOverlay;

    overlay.querySelectorAll('.type-btn').forEach(btn => {
      btn.onclick = () => {
        currentTipo = btn.dataset.tipo;
        overlay.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('extra-label').textContent = currentTipo === 'bufanda' ? 'Origen' : 'Talla';
        document.getElementById('f-extra').placeholder = currentTipo === 'bufanda' ? 'Ej: comprada en la cancha' : 'Ej: M';
      };
    });

    overlay.querySelectorAll('.cat-btn').forEach(btn => {
      btn.onclick = () => {
        currentCategoria = btn.dataset.categoria;
        overlay.querySelectorAll('.cat-btn').forEach(b => b.classList.toggle('active', b === btn));
        document.getElementById('club-extra-fields').style.display = currentCategoria === 'seleccion' ? 'none' : '';
      };
    });

    overlay.querySelectorAll('.photo-btn').forEach(btn => {
      btn.onclick = () => {
        const slot = btn.dataset.slot;
        const selector = btn.dataset.action === 'camera' ? '.camera-input' : '.gallery-input';
        overlay.querySelector(`${selector}[data-slot="${slot}"]`).click();
      };
    });

    function handleFile(slot, file) {
      if (!file) return;
      pendingFiles[slot] = file;
      const reader = new FileReader();
      reader.onload = e => {
        document.getElementById(`photo-preview-${slot}`).innerHTML = `<img src="${e.target.result}">`;
      };
      reader.readAsDataURL(file);
    }
    overlay.querySelectorAll('.camera-input, .gallery-input').forEach(input => {
      input.onchange = e => handleFile(input.dataset.slot, e.target.files[0]);
    });

    document.getElementById('save-item').onclick = async () => {
      const club = document.getElementById('f-club').value.trim();
      if (!club) { alert('Poné al menos el club o equipo de la pieza.'); return; }

      const formData = new FormData();
      formData.append('tipo', currentTipo);
      formData.append('club', club);
      formData.append('temporada', document.getElementById('f-temporada').value.trim());
      formData.append('jugador', document.getElementById('f-jugador').value.trim());
      formData.append('adquirido', document.getElementById('f-adquirido').value);
      const compradorSelected = [];
      if (document.getElementById('f-comprador-guille').checked) compradorSelected.push('Guille');
      if (document.getElementById('f-comprador-gero').checked) compradorSelected.push('Gero');
      formData.append('comprador', compradorSelected.join(', '));
      formData.append('categoria', currentCategoria);
      formData.append('liga', currentCategoria === 'club' ? document.getElementById('f-liga').value.trim() : '');
      formData.append('ciudad', currentCategoria === 'club' ? document.getElementById('f-ciudad').value.trim() : '');
      formData.append('pais', document.getElementById('f-pais').value.trim());
      formData.append('autenticidad', document.getElementById('f-autenticidad').value);
      formData.append('historia', document.getElementById('f-historia').value.trim());
      const extraVal = document.getElementById('f-extra').value.trim();
      formData.append('talla', currentTipo === 'camiseta' ? extraVal : '');
      formData.append('origen', currentTipo === 'bufanda' ? extraVal : '');
      PHOTO_SLOTS.forEach(slot => {
        if (pendingFiles[slot.key]) formData.append(`foto_${slot.key}`, pendingFiles[slot.key]);
      });

      const saveBtn = document.getElementById('save-item');
      saveBtn.textContent = 'Guardando…';
      saveBtn.disabled = true;

      try {
        const url = isEdit ? `/api/items/${data.id}` : '/api/items';
        const method = isEdit ? 'PUT' : 'POST';
        const res = await fetch(url, { method, body: formData });
        if (!res.ok) throw new Error('save failed');
        const saved = await res.json();

        if (isEdit) {
          const idx = items.findIndex(i => i.id === saved.id);
          if (idx >= 0) items[idx] = saved;
        } else {
          items.unshift(saved);
        }
        closeOverlay();
        render();
      } catch (e) {
        alert('No se pudo guardar la pieza. Probá de nuevo.');
        saveBtn.textContent = isEdit ? 'Guardar cambios' : 'Añadir al museo';
        saveBtn.disabled = false;
      }
    };
  }

  tabs.addEventListener('click', e => {
    const btn = e.target.closest('.tab');
    if (!btn) return;
    tabs.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === btn));
    currentFilter = btn.dataset.filter;
    render();
  });

  openFiltersBtn.addEventListener('click', () => openFiltersPanel());

  sortSelect.addEventListener('change', () => {
    sortBy = sortSelect.value;
    render();
  });

  viewToggle.addEventListener('click', e => {
    const btn = e.target.closest('.view-btn');
    if (!btn) return;
    viewToggle.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b === btn));
    viewMode = btn.dataset.view;
    render();
  });

  openAddBtn.addEventListener('click', () => openForm());

  loadItems();
})();
