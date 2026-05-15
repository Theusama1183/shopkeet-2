/**
 * Client-side CSV parser — no dependencies needed.
 * Handles quoted fields, commas inside quotes, and newlines in fields.
 */
export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = splitCSVLines(text);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every((v) => v.trim() === "")) continue; // skip empty rows
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return { headers, rows };
}

function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      if (current.trim()) lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

/** Known column mapping presets */
export type Platform = "shopify" | "woocommerce" | "custom";

export interface ColumnMapping {
  name: string;
  description: string;
  price: string;
  sku: string;
  image: string;
  quantity: string;
  status: string;
}

export const PLATFORM_PRESETS: Record<Platform, { label: string; mappings: ColumnMapping }> = {
  shopify: {
    label: "Shopify",
    mappings: {
      name: "Title",
      description: "Body (HTML)",
      price: "Variant Price",
      sku: "Variant SKU",
      image: "Image Src",
      quantity: "Variant Inventory Qty",
      status: "Status",
    },
  },
  woocommerce: {
    label: "WooCommerce",
    mappings: {
      name: "Name",
      description: "Description",
      price: "Regular price",
      sku: "SKU",
      image: "Images",
      quantity: "Stock",
      status: "Published",
    },
  },
  custom: {
    label: "Custom",
    mappings: {
      name: "",
      description: "",
      price: "",
      sku: "",
      image: "",
      quantity: "",
      status: "",
    },
  },
};

/** ShopKeet product fields that CSV columns map to */
export const SHOPKEET_FIELDS: { key: keyof ColumnMapping; label: string; required: boolean }[] = [
  { key: "name", label: "Product Name", required: true },
  { key: "description", label: "Description", required: false },
  { key: "price", label: "Price", required: false },
  { key: "sku", label: "SKU", required: false },
  { key: "image", label: "Image URL", required: false },
  { key: "quantity", label: "Stock Quantity", required: false },
  { key: "status", label: "Status", required: false },
];
