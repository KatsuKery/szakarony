// military.js
import { spClient } from './config.js';
import { BALANS_JEDNOSTEK } from './units.js';

// 1. FUNKCJA WYSYŁAJĄCA ATAK
export async function przygotujIWyslijAtak(stanGracza, targetVillageId, wybraneJednostki) {
    const wojskoDoWyslania = {};
    let iloscWojskaLacznie = 0;

    for (const [kod, iloscWpisana] of Object.entries(wybraneJednostki)) {
        const ilosc = parseInt(iloscWpisana) || 0;
        if (ilosc > 0) {
            const posiadane = stanGracza.jednostki[kod] || 0;
            if (posiadane < ilosc) {
                alert(`Nie masz wystarczająco jednostek typu: ${kod}`);
                return false;
            }
            wojskoDoWyslania[kod] = ilosc;
            iloscWojskaLacznie += ilosc;
        }
    }

    if (iloscWojskaLacznie === 0) {
        alert("Wodzu, nie wybrałeś żadnego wojska do ataku!");
        return false;
    }

    try {
        const noweJednostki = { ...stanGracza.jednostki };
        for (const [kod, ilosc] of Object.entries(wojskoDoWyslania)) {
            noweJednostki[kod] -= ilosc;
            await spClient.from('village_units').upsert({
                village_id: stanGracza.id,
                unit_type: kod,
                quantity: noweJednostki[kod]
            });
        }

        const czasMarszuSekundy = 30; // 30 sekund na testy
        const czasDotarcia = new Date(Date.now() + czasMarszuSekundy * 1000).toISOString();

        const { error } = await spClient.from('troop_movements').insert([{
            village_from_id: stanGracza.id,
            village_to_id: targetVillageId,
            units: wojskoDoWyslania,
            mission_type: 'attack',
            finish_time: czasDotarcia
        }]);

        if (error) throw error;
        alert(`Wojsko wyruszyło na wyprawę! Dotrą na miejsce za ${czasMarszuSekundy} sekund.`);
        return true;

    } catch (error) {
        console.error("Błąd podczas wysyłania ataku:", error);
        return false;
    }
}

// 2. FUNKCJA OBLICZAJĄCA WALKĘ (Silnik Bitewny)
async function rozstrzygnijBitwe(ruch, stanGraczaId) {
    const { data: cel } = await spClient.from('villages').select('*').eq('id', ruch.village_to_id).single();

    // Obliczamy siłę ataku gracza
    let silaAtaku = 0;
    for (const [kod, ilosc] of Object.entries(ruch.units)) {
        silaAtaku += (BALANS_JEDNOSTEK[kod]?.att || 10) * ilosc;
    }

    // Jeśli cel nie istnieje (np. ktoś go zniszczył zanim doszliśmy)
    if (!cel) {
        console.log("Cel zniknął. Armia wraca pusta.");
        await spClient.from('troop_movements').update({
            mission_type: 'return',
            finish_time: new Date(Date.now() + 30 * 1000).toISOString()
        }).eq('id', ruch.id);
        return;
    }

    // Generujemy siłę obrony dla obozów NPC w zależności od poziomu (Tieru)
    let silaObrony = 0;
    let mnoznikLupu = 1;

    if (cel.is_npc) {
        if (cel.npc_tier === 1) { silaObrony = 50; mnoznikLupu = 1; }
        else if (cel.npc_tier === 2) { silaObrony = 250; mnoznikLupu = 4; }
        else { silaObrony = 1000; mnoznikLupu = 10; }
    } else {
        // Atak na innego gracza – dla uproszczenia na razie zakładamy bazowe 100
        silaObrony = 100;
    }

    // --- LOGIKA WALKI ---
    if (silaAtaku > silaObrony) {
        // WYGRANA: Obliczamy straty (im silniejsza obrona wroga, tym więcej naszych ginie)
        const procentStrat = Math.min(0.9, silaObrony / silaAtaku);
        const noweWojsko = {};
        for (const [kod, ilosc] of Object.entries(ruch.units)) {
            const przezylo = Math.floor(ilosc * (1 - procentStrat));
            if (przezylo > 0) noweWojsko[kod] = przezylo;
        }

        // Generujemy łupy w postaci podstawowych surowców
        const lup = {
            wood: Math.floor(Math.random() * 200 * mnoznikLupu) + (100 * mnoznikLupu),
            stone: Math.floor(Math.random() * 150 * mnoznikLupu) + (50 * mnoznikLupu),
            gold: Math.floor(Math.random() * 100 * mnoznikLupu) + (20 * mnoznikLupu),
        };

        // Niszczymy pokonany obóz NPC z bazy
        if (cel.is_npc) {
            await spClient.from('villages').delete().eq('id', cel.id);
        }

        // Zawracamy wojsko - trik: chowamy łupy w obiekcie units
        noweWojsko._lup = lup;
        const czasPowrotu = new Date(Date.now() + 30 * 1000).toISOString();

        await spClient.from('troop_movements').update({
            mission_type: 'return',
            finish_time: czasPowrotu,
            units: noweWojsko
        }).eq('id', ruch.id);

        console.log(`[WALKA] Wygrana z: ${cel.name}! Zebrano łupy. Wojsko wraca.`);

    } else {
        // PRZEGRANA: Armia zniszczona. Kasujemy ruch wojsk.
        await spClient.from('troop_movements').delete().eq('id', ruch.id);
        console.log(`[WALKA] Przegrana z: ${cel.name}. Cała armia poległa.`);
    }
}

// 3. GŁÓWNA FUNKCJA SILNIKA (Do sprawdzania w pętli gry)
export async function sprawdzMaszerujaceWojska(stanGraczaId) {
    if (!stanGraczaId) return false;
    const teraz = new Date().toISOString();

    // Szukamy naszych wojsk, których czas misji dobiegł końca
    const { data: ruchy } = await spClient.from('troop_movements')
        .select('*')
        .eq('village_from_id', stanGraczaId)
        .lte('finish_time', teraz);

    if (!ruchy || ruchy.length === 0) return false;

    let zaktualizowanoCos = false;

    for (const ruch of ruchy) {
        if (ruch.mission_type === 'attack') {
            // Wojsko doszło do celu
            await rozstrzygnijBitwe(ruch, stanGraczaId);
            zaktualizowanoCos = true;
        }
        else if (ruch.mission_type === 'return') {
            // Wojsko wróciło z ataku - odbieramy ich i łupy
            const powracajaceWojsko = ruch.units;
            const lup = powracajaceWojsko._lup || {};
            delete powracajaceWojsko._lup; // Czyścimy ukryty klucz

            // Pobieramy obecny stan wojska z bazy
            const { data: jednostkiBazy } = await spClient.from('village_units').select('unit_type, quantity').eq('village_id', stanGraczaId);
            const mapaJednostek = {};
            if (jednostkiBazy) jednostkiBazy.forEach(j => mapaJednostek[j.unit_type] = j.quantity);

            // Zwracamy ocalałe wojsko do garnizonu
            for (const [kod, ilosc] of Object.entries(powracajaceWojsko)) {
                const nowaIlosc = (mapaJednostek[kod] || 0) + ilosc;
                await spClient.from('village_units').upsert({ village_id: stanGraczaId, unit_type: kod, quantity: nowaIlosc });
            }

            // Dodajemy zdobyte łupy do magazynu
            if (Object.keys(lup).length > 0) {
                const { data: currRes } = await spClient.from('village_resources').select('*').eq('village_id', stanGraczaId).single();
                if (currRes) {
                    for (const res in lup) {
                        currRes[res] = (currRes[res] || 0) + lup[res];
                    }
                    await spClient.from('village_resources').update(currRes).eq('village_id', stanGraczaId);
                }
            }

            // Misja zakończona, usuwamy wpis
            await spClient.from('troop_movements').delete().eq('id', ruch.id);
            console.log(`[POWRÓT] Wojsko wróciło z łupem: Drewno +${lup.wood || 0}, Kamień +${lup.stone || 0}, Złoto +${lup.gold || 0}.`);

            // Wystawiamy na próbę mały alert do powiadomienia gracza!
            alert(`Twoje wojska powróciły z wyprawy!\nZrabowano:\n🪵 Drewno: ${lup.wood || 0}\n🪨 Kamień: ${lup.stone || 0}\n💰 Złoto: ${lup.gold || 0}`);

            zaktualizowanoCos = true;
        }
    }
    return zaktualizowanoCos;
}