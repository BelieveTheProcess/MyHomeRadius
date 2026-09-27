// PREVIEW DATA — Phase 1 placeholder only.
// In Phase 2, replace this array with a fetch() to the Repliers-backed
// endpoint on Railway. Keep the same field names (lat, lng, status,
// price, beds, baths, sqft, address, image) and everything downstream
// in script.js keeps working unchanged.

const LISTINGS = [
  { id: 1, lat: 37.3382, lng: -121.8863, status: "onmarket", price: 1145000, beds: 3, baths: 2, sqft: 1620, address: "San Jose · Willow Glen area" },
  { id: 2, lat: 37.3688, lng: -122.0363, status: "onmarket", price: 1890000, beds: 4, baths: 3, sqft: 2210, address: "Sunnyvale · near Washington Park" },
  { id: 3, lat: 37.3541, lng: -121.9552, status: "offmarket", price: null, beds: 3, baths: 2, sqft: null, address: "Santa Clara · exact address on request" },
  { id: 4, lat: 37.3230, lng: -121.9291, status: "onmarket", price: 1425000, beds: 3, baths: 2, sqft: 1780, address: "Campbell · near downtown" },
  { id: 5, lat: 37.2571, lng: -121.9552, status: "offmarket", price: null, beds: 4, baths: 3, sqft: null, address: "Los Gatos · exact address on request" },
  { id: 6, lat: 37.4419, lng: -122.1430, status: "onmarket", price: 2350000, beds: 4, baths: 3, sqft: 2450, address: "Palo Alto · Midtown" },
  { id: 7, lat: 37.5629, lng: -122.3255, status: "onmarket", price: 1275000, beds: 3, baths: 2, sqft: 1540, address: "San Mateo · Hayward Park" },
  { id: 8, lat: 37.5485, lng: -121.9886, status: "offmarket", price: null, beds: 3, baths: 2, sqft: null, address: "Fremont · exact address on request" },
  { id: 9, lat: 37.6017, lng: -122.0055, status: "onmarket", price: 985000, beds: 3, baths: 2, sqft: 1390, address: "Hayward · near Southland Mall" },
  { id: 10, lat: 37.9101, lng: -122.0653, status: "onmarket", price: 1050000, beds: 3, baths: 2, sqft: 1480, address: "Concord · Clayton Valley area" },
  { id: 11, lat: 37.9358, lng: -122.3477, status: "offmarket", price: null, beds: 3, baths: 1, sqft: null, address: "Richmond area · exact address on request" },
  { id: 12, lat: 37.7749, lng: -122.4194, status: "onmarket", price: 1680000, beds: 2, baths: 2, sqft: 1120, address: "San Francisco · Noe Valley" },
];

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = d => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
