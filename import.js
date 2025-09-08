import fs from "fs";

const path = "./produkte.xml";

if (!fs.existsSync(path)) {
    console.error("Datei nicht gefunden:", path);
    process.exit(1);
} else {
    console.log("Datei gefunden:", path);
}
const xmlData = fs.readFileSync(path, "utf-8");
console.log("XML Länge:", xmlData.length);
console.log("Erste 500 Zeichen der XML:\n", xmlData.slice(0, 500));


import { XMLParser } from "fast-xml-parser";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Supabase initialisieren
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Parser konfigurieren, damit alle <Product> als Array erkannt werden
const parser = new XMLParser({
    ignoreAttributes: false,
    removeNSPrefix: true,
    isArray: (tagName) => tagName === "Product",
});

const json = parser.parse(xmlData);

const products = json.dataroot?.Product || [];
console.log("Gefundene Artikel:", products.length);

if (products.length === 0) {
    console.error("Keine Artikel gefunden! Prüfe die XML-Datei.");
    process.exit(1);
}

// Funktion: RTF in einfachen Text umwandeln (ohne externes Paket)
function rtfToPlain(rtf) {
    if (!rtf) return "";
    return rtf
        .replace(/\\[a-z]+\d*/gi, "") // Steuerbefehle wie \fs15, \f2
        .replace(/[{}]/g, "")          // Klammern entfernen
        .replace(/\r?\n/g, " ")        // Zeilenumbrüche zu Leerzeichen
        .trim();
}

// Importfunktion
async function importProducts() {
    console.log(`Importiere ${products.length} Artikel...`);

    for (const product of products) {
        const { data, error } = await supabase.from("artikel").upsert({
            id: Number(product.ID),
            code_nr: product.CodeNr,
            barcode_nr: product.BarCodeNr || null,
            name: product.Name,
            description: rtfToPlain(product.Description),
            purchase_price: Number(product.PurchasePrice || 0),
            sales_price_min: Number(product.SalesPriceMin || 0),
            sales_price: Number(product.SalesPrice || 0),
            sales_price_max: Number(product.SalesPriceMax || 0),
            is_brutto: product.IsBrutto === "1",
            discount: Number(product.Discount || 0),
            category: product.Category,
            unit: product.Unit,
            vat: Number(product.VAT || 0),
            stock_tot: Number(product.StockTot || 0),
            stock_min: Number(product.StockMin || 0),
            stock_max: Number(product.StockMax || 0),
            storehouse_name: product.StorehouseName || null,
            use_stock: product.UseStock === "1",
            unavailability: product.Unavailability === "1",
            unavailability_date: product.UnavailabilityDate || null,
            undiscountable: product.Undiscountable === "1",
            timestamp: product.TimeStamp || null,
            register_date: product.RegisterDate || null,
            short_comment: product.ShortComment || null,
            buchhaltungskonto: product.Buchhaltungskonto || null,
            ist_favorit: product.IstFavorit === "1",
            position_favorit: Number(product.PositionFavorit || 0),
            ist_retourartikel: product.IstRetourartikel === "1",
        });

        if (error) {
            console.error(`Fehler bei Artikel ${product.ID}:`, error.message);
        }
    }

    console.log("✅ Import abgeschlossen!");
}

// Skript starten
importProducts();
