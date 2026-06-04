import { spClient } from './config.js';

export async function pobierzDane(id) {
    const { data: vData } = await spClient.from('villages').select('*').eq('id', id).single();
    const { data: rData } = await spClient.from('village_resources').select('*').eq('village_id', id).single();
    const { data: bData } = await spClient.from('village_buildings').select('*').eq('village_id', id).single();
    const { data: qData } = await spClient.from('construction_queue').select('*').eq('village_id', id).order('finish_time', { ascending: true });
    const { data: uData } = await spClient.from('village_units').select('unit_type, quantity').eq('village_id', id);

    // Pobieranie kolejki szkolenia wojska
    const { data: uqData } = await spClient.from('unit_queue').select('*').eq('village_id', id).order('finish_time', { ascending: true });

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

export async function fetchNearbyVillages(x, y, radius = 3) {
    const { data, error } = await spClient.from('villages')
        .select('id, name, pos_x, pos_y, faction')
        .gte('pos_x', x - radius).lte('pos_x', x + radius)
        .gte('pos_y', y - radius).lte('pos_y', y + radius);
    return error ? [] : data;
}