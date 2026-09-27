const API_BASE = "https://myhomeradius-api-production.up.railway.app";

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- MAP ---------- */
  const DEFAULT_CENTER = [37.4, -121.98]; // roughly Santa Clara County
  const map = L.map("map", { zoomControl: true, scrollWheelZoom: false }).setView(DEFAULT_CENTER, 9);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
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

  async function fetchListings(center, radiusMi) {
    if (!center) return LISTINGS; // initial unfiltered preview, no API call needed

    try {
      const url = `${API_BASE}/api/listings?lat=${center.lat}&lng=${center.lng}&radius=${radiusMi}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      return data.listings;
    } catch (err) {
      console.warn("Live listings unavailable, showing preview data instead:", err.message);
      // Graceful fallback so the map never looks broken to a visitor
      return LISTINGS.filter(l => distanceMiles(center.lat, center.lng, l.lat, l.lng) <= radiusMi);
    }
  }

  async function renderListingsWithin(center, radiusMi) {
    listingMarkers.forEach(m => map.removeLayer(m));
    listingMarkers = [];

    const within = await fetchListings(center, radiusMi);

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

  form.addEventListener("submit", async e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());

    const submitBtn = form.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Setting your radius…";

    try {
      const res = await fetch(`${API_BASE}/api/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);

      form.style.display = "none";
      formNote.textContent = "Got it — we're watching your radius now. We'll reach out as soon as something matches.";
      formNote.classList.add("form-note-success");
    } catch (err) {
      console.error("Lead submission failed:", err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = "Set my radius";
      formNote.textContent = "Something went wrong sending that — please try again, or call/text (415) 694-2374 directly.";
      formNote.classList.add("form-note-error");
    }
  });
});
