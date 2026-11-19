export type ProductTemplate = {
  id: string;
  name: string;
  spec: string;
  bom: { sku: string; qty: number }[];
};

export const PRODUCTS: ProductTemplate[] = [
  {
    id: "pintu-standar",
    name: "Pintu Timbal Radiologi Tipe RS-90",
    spec: "Setara 2 mm Pb. Daun pintu 900 × 2100 mm, rangka hollow 40×40, lead glass 400 × 600 mm, tiga engsel heavy duty, seal radiasi, lockset, dan cat epoxy.",
    bom: [
      { sku: "PB-02", qty: 18 },
      { sku: "HB-40", qty: 12 },
      { sku: "EG-HD", qty: 3 },
      { sku: "LG-46", qty: 1 },
      { sku: "LK-01", qty: 1 },
      { sku: "SL-R", qty: 6 },
      { sku: "EP-02", qty: 2 },
    ],
  },
  {
    id: "pintu-ct",
    name: "Pintu Timbal Ruang CT Tipe CT-120",
    spec: "Setara 3 mm Pb untuk ruang CT. Daun 1200 × 2100 mm, perisai lebih tebal, empat engsel, lead glass lebar, seal ganda, dan cat epoxy.",
    bom: [
      { sku: "PB-03", qty: 28 },
      { sku: "HB-40", qty: 16 },
      { sku: "EG-HD", qty: 4 },
      { sku: "LG-46", qty: 1 },
      { sku: "LK-01", qty: 1 },
      { sku: "SL-R", qty: 8 },
      { sku: "EP-02", qty: 3 },
    ],
  },
];

export function productById(id: string) {
  return PRODUCTS.find((item) => item.id === id) ?? null;
}
