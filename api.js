import { spClient } from './config.js';

export async function pobierzDane(userId) {
    // 1. Znajdź wioskę, która należy do tego użytkownika (owner_id)
    const { data: vData } = await spClient.from('villages').select('*').eq('owner_id', userId).single();

    // Jeśli gracz jeszcze nie ma wioski, zwróć null
    if (!vData) return { wioska: null };

    // 2. Użyj unikalnego ID tej wioski do pobrania reszty danych
    const villageId = vData.id;

    const { data: rData } = await spClient.from('village_resources').select('*').eq('village_id', villageId).single();
    const { data: bData } = await spClient.from('village_buildings').select('*').eq('village_id', villageId).single();
    const { data: qData } = await spClient.from('construction_queue').select('*').eq('village_id', villageId).order('finish_time', { ascending: true });
    const { data: uData } = await spClient.from('village_units').select('unit_type, quantity').eq('village_id', villageId);

    // Pobieranie kolejki szkolenia wojska
    const { data: uqData } = await spClient.from('unit_queue').select('*').eq('village_id', villageId).order('finish_time', { ascending: true });

    const jednostki = {};
    if (uData) {
        uData.forEach(wiersz => {
            jednostki[wiersz.unit_type] = wiersz.quantity;
        });
    }

    return {
        wioska: vData,
        surowce: rData,
        budynki: bData,
        kolejka: qData || [],
        jednostki: jednostki,
        kolejkaWojsko: uqData || []
    };
}

export async function aktualizuj(tabela, dane, warunek, id) {
    return await spClient.from(tabela).update(dane).eq(warunek, id);
}

export async function insert(tabela, dane) {
    // Uwaga: Tutaj przekazujemy obiekt bezpośrednio lub jako tablicę (Supabase akceptuje oba)
    return await spClient.from(tabela).insert([dane]);
}

export async function usunZkolejki(id) {
    return await spClient.from('construction_queue').delete().eq('id', id);
}

// Funkcja usuwająca jednostkę z kolejki po wyszkoleniu
export async function usunZkolejkiWojska(id) {
    return await spClient.from('unit_queue').delete().eq('id', id);
}

// POBIERANIE WIOSEK TYLKO Z WIDOCZNEGO ZAKRESU (Bounding Box)
export async function fetchNearbyVillages(centerX, centerY, zasieg = 7) {
    const minX = centerX - zasieg;
    const maxX = centerX + zasieg;
    const minY = centerY - zasieg;
    const maxY = centerY + zasieg;

    const { data, error } = await spClient.from('villages')
        // DODANO 'npc_tier' na końcu poniższej listy!
        .select('id, name, pos_x, pos_y, faction, is_npc, owner_id, npc_tier')
        .gte('pos_x', minX).lte('pos_x', maxX) 
        .gte('pos_y', minY).lte('pos_y', maxY); 

    if (error) {
        console.error("Błąd pobierania mapy:", error);
        return [];
    }
    return data || [];
}