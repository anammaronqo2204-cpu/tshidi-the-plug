export const site = {
  name: "Tshidi the Plug",
  logoTop: "TSHIDI",
  logoBottom: "THE PLUG",
  tagline: "Your plug for kicks, threads & home",
  shortBlurb: "Everybody has a plug. Yours is Tshidi.",
  blurb:
    "Branded sneakers, clothing, bags and homeware — sourced, checked and delivered across South Africa. If it's hot, Tshidi has it.",
  phone: "064 032 2069",
  whatsapp: "27640322069",
  email: "ntulitshidi2@gmail.com",
  instagram: "tshiditheplug",
  city: "Johannesburg, South Africa",
  hours: "Mon – Sat, 08:00 – 18:00",
  orderPrefix: "PLUG",
  courierName: "Courier Guy",
  localProvince: "Gauteng",
  processingDays: "2–3 working days",
  currency: "ZAR",
};

/**
 * Courier Guy parcel-size tiers. Replaces the old flat local/national rate —
 * customers pick a parcel size (like Pep Paxi's small/large bags), and the
 * price still depends on whether they're in Gauteng or elsewhere in SA.
 */
export const courierTiers = [
  {
    id: "small",
    title: "Courier Guy — Small parcel",
    copy: "Clothing, accessories & smaller items",
    localCents: 10000, // R100 Gauteng
    nationalCents: 20000, // R200 rest of SA
    recommended: false,
  },
  {
    id: "large",
    title: "Courier Guy — Large parcel",
    copy: "Sneaker boxes & bulkier items",
    localCents: 13000, // R130 Gauteng
    nationalCents: 23000, // R230 rest of SA
    recommended: true,
  },
] as const;

export type CourierTierId = (typeof courierTiers)[number]["id"];

/** "collect" is free and only available in Johannesburg; courier tiers vary by province. */
export function shippingCentsForTier(tier: string | null | undefined, province?: string | null) {
  if (tier === "collect") return 0;
  const found = courierTiers.find((t) => t.id === tier) ?? courierTiers[0];
  const value = (province ?? "").trim().toLowerCase();
  return value === site.localProvince.toLowerCase() ? found.localCents : found.nationalCents;
}

export function deliveryLabelForProvince(province?: string | null) {
  const value = (province ?? "").trim().toLowerCase();
  return value === site.localProvince.toLowerCase()
    ? `Local delivery (${site.localProvince})`
    : `National delivery via ${site.courierName}`;
}

/** EFT bank account customers pay into — shown on the checkout page. */
export const bankAccounts = [
  {
    bank: "Capitec Bank",
    accountName: "Ms TA Ntuli",
    accountNumber: "1668348312",
  },
] as const;

export const provinces = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Limpopo",
  "Mpumalanga",
  "North West",
  "Northern Cape",
];

export const trustBadges = [
  {
    icon: "🚚",
    title: "Courier Guy delivery",
    copy: "From R100 in Gauteng, R200 outside Gauteng. Free collection in Johannesburg.",
  },
  { icon: "✅", title: "100% authentic", copy: "Every branded item is checked before it ships." },
  {
    icon: "💳",
    title: "Pay upfront or lay-bye",
    copy: "EFT 100% upfront, or 3 monthly lay-bye payments — product released after the last one.",
  },
  { icon: "🔁", title: "7-day exchanges", copy: "Wrong size? Swap it, no drama, no questions." },
];
