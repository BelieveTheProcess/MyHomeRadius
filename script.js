document.addEventListener("DOMContentLoaded", () => {

  /* ---------- MAP ---------- */
  const DEFAULT_CENTER = [37.4, -121.98]; // roughly Santa Clara County
  const map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView(DEFAULT_CENTER, 9);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 18,
  }).addTo(map);

  const radiusInput = document.getElementById("radiusRange");
  const radiusValueLabel = document.getElementById("radiusValue");

  let centerPoint = null;
  let radiusCircle = null;
  let centerMarker = null;
  let listingMarkers = [];

  function milesToMeters(mi) {
    return mi * 1609.34;
  }

  function renderListingsWithin(center, radiusMi) {
    listingMarkers.forEach(m => map.removeLayer(m));
    listingMarkers = [];

    const within = center
      ? LISTINGS.filter(l => distanceMiles(center.lat, center.lng, l.lat, l.lng) <= radiusMi)
      : LISTINGS;

    within.forEach(listing => {
      const color = listing.status === "onmarket" ? "#235D72" : "#C68A3B";
      const marker = L.circleMarker([listing.lat, listing.lng], {
        radius: 7,
        color: "#EEF0E7",
        weight: 2,
        fillColor: color,
        fillOpacity: 1,
      }).addTo(map);
      marker.bindPopup(popupHtml(listing));
      listingMarkers.push(marker);
    });

    renderListingGrid(within);
  }

  function popupHtml(listing) {
    if (listing.status === "onmarket") {
      return `<strong>$${listing.price.toLocaleString()}</strong><br>
        ${listing.beds} bd · ${listing.baths} ba · ${listing.sqft.toLocaleString()} sqft<br>
        ${listing.address}`;
    }
    return `<strong>Off-market</strong><br>${listing.address}<br>
      <a href="#radius-form">Request details →</a>`;
  }

  function setCenter(latlng) {
    centerPoint = latlng;
    const radiusMi = Number(radiusInput.value);

    if (centerMarker) map.removeLayer(centerMarker);
    if (radiusCircle) map.removeLayer(radiusCircle);

    centerMarker = L.marker(latlng).addTo(map);
    radiusCircle = L.circle(latlng, {
      radius: milesToMeters(radiusMi),
      color: "#235D72",
      weight: 1.5,
      fillColor: "#235D72",
      fillOpacity: 0.07,
    }).addTo(map);

    map.fitBounds(radiusCircle.getBounds(), { padding: [24, 24] });
    renderListingsWithin(latlng, radiusMi);
  }

  map.on("click", e => setCenter(e.latlng));

  radiusInput.addEventListener("input", () => {
    const mi = Number(radiusInput.value);
    radiusValueLabel.textContent = `${mi} mi`;
    if (centerPoint) {
      if (radiusCircle) map.removeLayer(radiusCircle);
      radiusCircle = L.circle(centerPoint, {
        radius: milesToMeters(mi),
        color: "#235D72",
        weight: 1.5,
        fillColor: "#235D72",
        fillOpacity: 0.07,
      }).addTo(map);
      map.fitBounds(radiusCircle.getBounds(), { padding: [24, 24] });
      renderListingsWithin(centerPoint, mi);
    }
  });

  // Initial state: show everything, unfiltered, so the page isn't empty on load
  renderListingsWithin(null, null);

  /* ---------- LISTING CARDS ---------- */
  function renderListingGrid(listings) {
    const grid = document.getElementById("listingGrid");
    grid.innerHTML = "";

    if (listings.length === 0) {
      grid.innerHTML = `<p class="listing-empty">Nothing in that radius yet — widen it, or set your radius below and we'll keep watching for you.</p>`;
      return;
    }

    listings.slice(0, 6).forEach(listing => {
      const card = document.createElement("div");
      card.className = "listing-card";
      if (listing.status === "onmarket") {
        card.innerHTML = `
          <span class="listing-badge badge-on">For sale</span>
          <div class="listing-price">$${listing.price.toLocaleString()}</div>
          <div class="listing-meta">${listing.beds} bd · ${listing.baths} ba · ${listing.sqft.toLocaleString()} sqft</div>
          <div class="listing-address">${listing.address}</div>
        `;
      } else {
        card.innerHTML = `
          <span class="listing-badge badge-off">Off-market</span>
          <div class="listing-price listing-price-hidden">Price on request</div>
          <div class="listing-meta">${listing.beds} bd · ${listing.baths} ba</div>
          <div class="listing-address">${listing.address}</div>
          <a href="#radius-form" class="listing-cta">Request info →</a>
        `;
      }
      grid.appendChild(card);
    });
  }

  /* ---------- FORM ---------- */
  const form = document.getElementById("radiusForm");
  const formNote = document.getElementById("formNote");

  form.addEventListener("submit", e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    // Phase 1: no backend wired yet. Phase 2 replaces this block with a
    // POST to the Railway endpoint, which creates/updates the lead in
    // Follow Up Boss and tags it for the wholesale-match + DealMachine flow.
    console.log("Radius form submission (not yet sent anywhere):", data);

    form.style.display = "none";
    formNote.textContent = "Got it — we're watching your radius now. We'll reach out as soon as something matches.";
    formNote.classList.add("form-note-success");
  });
});
