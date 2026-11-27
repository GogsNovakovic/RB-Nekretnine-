/*
 * RB Residences: everything on the homepage that is expected to change.
 * main.js renders the page from this object. Edit values here, not in main.js.
 *
 * Residence outlines (`shape`) are polygons in the coordinate space of the building
 * picture (assets/img/building-*.webp) scaled to 1920 x 1080: "x,y x,y ...".
 * They were traced on that picture; if the picture changes, trace them again.
 */
window.SITE_DATA = {
  brand: {
    name: "RB",
    descriptor: "Residences",
    fullName: "RB Residences",
    tagline: "A boutique collection of nine residences above the Mediterranean.",
    developer: "RB Nekretnine",
  },

  contact: {
    gallery: {
      title: "Sales gallery",
      lines: ["Seafront Promenade 1", "Mediterranean coast"],
      hours: "Monday to Saturday, 10:00–18:00, by appointment",
    },
    phone: "+382 00 123 456",
    email: "sales@rbresidences.example",
    social: [
      { label: "Instagram", url: "https://instagram.example/rbresidences" },
      { label: "Facebook", url: "https://facebook.example/rbresidences" },
      { label: "LinkedIn", url: "https://linkedin.example/company/rb-nekretnine" },
    ],
  },

  /* Enquiries are POSTed here as JSON. Leave empty to skip sending (a console warning is logged). */
  formEndpoint: "",

  /* Floor labels shown on the residence card. */
  levels: { 0: "Garden level", 1: "First floor", 2: "Top floor" },

  /* Shown in the picker when the page opens. */
  defaultResidence: "1.01",

  /* The six cards in the availability section, in this order. */
  featured: ["2.01", "2.03", "1.01", "1.03", "2.02", "G.03"],

  /* status: "available" | "reserved" | "sold"; areas in m²; price in euro excluding VAT. */
  residences: [
    { id: "2.01", floor: 2, type: "Penthouse with roof terrace", status: "available", interior: 88, terrace: 46, bedrooms: 3, bathrooms: 2, orientation: "South-west", view: "Open sea, 270°", price: 1390000,
      shape: "570,416 1050,440 1050,456 570,436" },
    { id: "2.02", floor: 2, type: "One-bedroom residence", status: "available", interior: 62, terrace: 9, bedrooms: 1, bathrooms: 1, orientation: "South", view: "Sea and hills", price: 640000,
      shape: "1101,428 1412,441 1416,556 1101,548" },
    { id: "2.03", floor: 2, type: "Two-bedroom residence", status: "available", interior: 68, terrace: 10, bedrooms: 2, bathrooms: 2, orientation: "South-east", view: "Open sea", price: 760000,
      shape: "1420,446 1668,461 1672,566 1420,560" },
    { id: "1.01", floor: 1, type: "Three-bedroom residence", status: "available", interior: 86, terrace: 14, bedrooms: 3, bathrooms: 2, orientation: "South-west", view: "Sea and garden", price: 920000,
      shape: "652,655 1008,659 1012,752 652,750" },
    { id: "1.02", floor: 1, type: "One-bedroom residence", status: "reserved", interior: 62, terrace: 9, bedrooms: 1, bathrooms: 1, orientation: "South", view: "Sea and hills", price: 590000,
      shape: "1101,659 1408,665 1414,770 1101,778" },
    { id: "1.03", floor: 1, type: "Two-bedroom residence", status: "available", interior: 68, terrace: 10, bedrooms: 2, bathrooms: 2, orientation: "South-east", view: "Open sea", price: 710000,
      shape: "1416,666 1678,669 1686,752 1680,764 1416,773" },
    { id: "G.01", floor: 0, type: "Three-bedroom garden residence", status: "reserved", interior: 86, terrace: 52, bedrooms: 3, bathrooms: 2, orientation: "South-west", view: "Private garden", price: 860000,
      shape: "722,806 880,806 882,1038 722,1040" },
    { id: "G.02", floor: 0, type: "One-bedroom garden residence", status: "sold", interior: 62, terrace: 34, bedrooms: 1, bathrooms: 1, orientation: "South", view: "Garden and sea", price: 560000,
      shape: "1136,801 1318,801 1318,1028 1136,1030" },
    { id: "G.03", floor: 0, type: "Two-bedroom garden residence", status: "available", interior: 68, terrace: 38, bedrooms: 2, bathrooms: 2, orientation: "South-east", view: "Garden and sea", price: 680000,
      shape: "1460,796 1572,796 1572,1004 1460,1005" },
  ],

  /* Size of the coordinate space the shapes are traced in. */
  picture: { width: 1920, height: 1080 },

  /* 3D building viewer (js/viewer.js, loaded after the first scroll). The view, fit and
     shift were measured against the building picture so the model sits under the photo. */
  viewer: {
    script: "js/viewer.js",
    view: { azimuth: 142, elevation: 3, fov: 30 },
    fitMargin: 1.0,
    viewShift: [-0.006, 0.012],
    /* First unlock: a slow turn, stepping back to clear room for the controls. */
    orbit: { degrees: -24, durationMs: 2200, distance: 1.45, distanceShortScreen: 1.7, distancePortrait: 1.12 },
  },
};
