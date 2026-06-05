import { spClient } from './config.js';

const ROZMIAR_MAPY = 50; // Kafelki od 1 do 50
const MAX_OBOZOW = 5;

// Funkcja generująca obozy w zadanym promieniu od gracza
export async function rozsypObozyNPC(ilosc, graczX, graczY) {
    const obozy = [];
    const nazwy = ["Obóz Bandytów", "Siedlisko Goblinów", "Krypta Nieumarłych", "Prastare Ruiny", "Jaskinia Trolla"];

    for (let i = 0; i < ilosc; i++) {
        const tier = Math.floor(Math.random() * 3) + 1; // Poziom 1-3
        const losowaNazwa = nazwy[Math.floor(Math.random() * nazwy.length)] + ` (Poziom ${tier})`;

        let posX, posY;

        // Losujemy dopóki nie wylosujemy poprawnego, pustego pola
        do {
            // Losujemy przesunięcie od -6 do +6
            const offsetX = Math.floor(Math.random() * 13) - 6; 
            const offsetY = Math.floor(Math.random() * 13) - 6; 

            posX = graczX + offsetX;
            posY = graczY + offsetY;

            // Pilnujemy, żeby nie wyrzuciło obozu poza granice mapy (1-50)
            if (posX < 1) posX = 1;
            if (posX > ROZMIAR_MAPY) posX = ROZMIAR_MAPY;
            if (posY < 1) posY = 1;
            if (posY > ROZMIAR_MAPY) posY = ROZMIAR_MAPY;

        // Powtarzaj losowanie, JEŚLI wylosowało dokładnie pole, na którym stoi gracz
        } while (posX === graczX && posY === graczY); 

        obozy.push({
            name: losowaNazwa,
            pos_x: posX,
            pos_y: posY,
            faction: 'npc',
            is_premium: false,
            is_npc: true,
            npc_tier: tier,
            last_update: new Date().toISOString(),
            owner_id: null // To jest NPC
        });
    }

    const { error } = await spClient.from('villages').insert(obozy);
    if (error) {
        console.error("Błąd zapisu NPC w bazie:", error);
    } else {
        console.log(`[NPC] Pomyślnie wygenerowano ${ilosc} nowych obozów wokół gracza.`);
    }
}

// Główna funkcja zarządzająca respawnem
export async function sprawdzIGenerujNPC(graczX, graczY) {
    // Zabezpieczenie: jeśli nie przekazaliśmy koordynatów, przerywamy
    if (!graczX || !graczY) return; 

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
        await rozsypObozyNPC(brakuje, graczX, graczY);
    } else {
        console.log(`[System Respawn] Mapa stabilna (obozów: ${obecnaIlosc}/${MAX_OBOZOW}).`);
    }
}