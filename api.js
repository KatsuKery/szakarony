import { spClient } from './config.js';

export async function pobierzDane(userId) {
    // 1. ZnajdŸ wioskê, która nale¿y do tego u¿ytkownika (owner_id)
    const { data: vData } = await spClient.from('villages').select('*').eq('owner_id', userId).single();

    // Jeœli gracz jeszcze nie ma wioski, zwróæ null
    if (!vData) return { wioska: null };

    // 2. U¿yj unikalnego ID tej wioski do pobrania reszty danych
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
    // Uwaga: Tutaj przekazujemy obiekt bezpoœrednio lub jako tablicê (Supabase akceptuje oba)
    return await spClient.from(tabela).insert([dane]);
}

export async function usunZkolejki(id) {
    return await spClient.from('construction_queue').delete().eq('id', id);
}

// Funkcja usuwaj¹ca jednostkê z kolejki po wyszkoleniu
export async function usunZkolejkiWojska(id) {
    return await spClient.from('unit_queue').delete().eq('id', id);
}

export async function fetchNearbyVillages(x, y, radius = 20) {
    const { data, error } = await spClient.from('villages')
        // Doda³em 'is_npc' i 'owner_id', aby UI mia³o pe³n¹ wiedzê
        .select('id, name, pos_x, pos_y, faction, is_npc, owner_id')
        .gte('pos_x', x - radius).lte('pos_x', x + radius)
        .gte('pos_y', y - radius).lte('pos_y', y + radius);

    if (error) {
        console.error("B³¹d pobierania mapy:", error);
        return [];
    }
    return data || [];
}