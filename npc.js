// npc.js
import { spClient } from './config.js';

const ROZMIAR_MAPY = 50; // Kafelki od 1 do 50
const MAX_OBOZOW = 5;

// Funkcja generująca tylko tyle obozów, ile każemy
export async function rozsypObozyNPC(ilosc) {
    const obozy = [];
    const nazwy = ["Obóz Bandytów", "Siedlisko Goblinów", "Krypta Nieumarłych", "Prastare Ruiny", "Jaskinia Trolla"];

    for (let i = 0; i < ilosc; i++) {
        const tier = Math.floor(Math.random() * 3) + 1; // Poziom 1-3
        const losowaNazwa = nazwy[Math.floor(Math.random() * nazwy.length)] + ` (Poziom ${tier})`;

        // Losujemy w obszarze naszej siatki 50x50
        const posX = Math.floor(Math.random() * ROZMIAR_MAPY) + 1;
        const posY = Math.floor(Math.random() * ROZMIAR_MAPY) + 1;

        obozy.push({
            name: losowaNazwa,
            pos_x: posX,
            pos_y: posY,
            faction: 'npc',
            is_premium: false,
            is_npc: true,
            npc_tier: tier,
            last_update: new Date().toISOString()
        });
    }

    const { error } = await spClient.from('villages').insert(obozy);
    if (error) {
        console.error("Błąd zapisu NPC w bazie:", error);
    } else {
        console.log(`[NPC] Pomyślnie wygenerowano ${ilosc} nowych obozów.`);
    }
}

// Główna funkcja zarządzająca respawnem
export async function sprawdzIGenerujNPC() {
    // Sprawdzamy ile obozów żyje w bazie
    const { count, error } = await spClient
        .from('villages')
        .select('*', { count: 'exact', head: true })
        .eq('is_npc', true);

    if (error) return console.error("Błąd sprawdzania NPC:", error.message);

    const obecnaIlosc = count || 0;

    // Jeżeli zniszczono jakieś obozy, generujemy brakujące
    if (obecnaIlosc < MAX_OBOZOW) {
        const brakuje = MAX_OBOZOW - obecnaIlosc;
        console.log(`[System Respawn] Obozów: ${obecnaIlosc}/${MAX_OBOZOW}. Odradzam ${brakuje}...`);
        await rozsypObozyNPC(brakuje);
    } else {
        // Zostawiam ten log, żebyś w konsoli widział, że skrypt działa poprawnie w tle
        console.log(`[System Respawn] Mapa stabilna (obozów: ${obecnaIlosc}/${MAX_OBOZOW}).`);
    }
}