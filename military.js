import { spClient } from './config.js';
import { BALANS_JEDNOSTEK } from './units.js';

// 1. FUNKCJA WYSYŁAJĄCA ATAK
export async function przygotujIWyslijAtak(stanGracza, targetVillageId, wybraneJednostki) {
    const villageId = stanGracza.wioska.id;

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
        const updates = [];

        for (const [kod, ilosc] of Object.entries(wojskoDoWyslania)) {
            noweJednostki[kod] -= ilosc;
            updates.push({
                village_id: villageId,
                unit_type: kod,
                quantity: noweJednostki[kod]
            });
        }

        if (updates.length > 0) {
            const { error: upsertError } = await spClient.from('village_units').upsert(updates, { onConflict: 'village_id, unit_type' });
            if (upsertError) throw upsertError;
        }

        const czasMarszuSekundy = 30;
        const czasDotarcia = new Date(Date.now() + czasMarszuSekundy * 1000).toISOString();

        const { error: moveError } = await spClient.from('troop_movements').insert([{
            village_from_id: villageId,
            village_to_id: targetVillageId,
            units: wojskoDoWyslania,
            mission_type: 'attack',
            finish_time: czasDotarcia
        }]);

        if (moveError) throw moveError;

        alert(`Wojsko wyruszyło na wyprawę! Dotrą na miejsce za ${czasMarszuSekundy} sekund.`);
        return true;

    } catch (error) {
        console.error("Błąd podczas wysyłania ataku:", error);
        return false;
    }
}

// 2. FUNKCJA OBLICZAJĄCA WALKĘ (Silnik Bitewny)
async function rozstrzygnijBitwe(ruch, villageId) {
    const { data: cel } = await spClient.from('villages').select('*').eq('id', ruch.village_to_id).single();

    if (!cel) {
        console.log("Cel zniknął. Armia wraca pusta.");
        await spClient.from('troop_movements').update({
            mission_type: 'return',
            finish_time: new Date(Date.now() + 30 * 1000).toISOString()
        }).eq('id', ruch.id);
        return;
    }

    // --- KALKULACJA SIŁY ---
    let silaAtaku = 0;
    for (const [kod, ilosc] of Object.entries(ruch.units)) {
        silaAtaku += (BALANS_JEDNOSTEK[kod]?.att || 10) * ilosc;
    }

    let silaObrony = 0;
    let mnoznikLupu = 1;
    let opisObroncy = "Nieznany";

    if (cel.is_npc) {
        // TIER NPC DECYDUJE O SILE (Możesz to w przyszłości zamienić na konkretne jednostki)
        if (cel.npc_tier === 1) { silaObrony = 50; mnoznikLupu = 1; opisObroncy = "Słaba straż (S.O: 50)"; }
        else if (cel.npc_tier === 2) { silaObrony = 250; mnoznikLupu = 4; opisObroncy = "Horda potworów (S.O: 250)"; }
        else { silaObrony = 1000; mnoznikLupu = 10; opisObroncy = "Legion Ciemności (S.O: 1000)"; }
    } else {
        silaObrony = 100; // Obrona gracza (tymczasowa)
        opisObroncy = "Mury osady (S.O: 100)";
    }

    // --- RAPORT BITEWNY (Wyświetlany w konsoli) ---
    console.log(`\n⚔️ --- RAPORT Z BITWY --- ⚔️`);
    console.log(`Cel ataku: ${cel.name}`);
    console.log(`Przeciwnik: ${opisObroncy}`);
    console.log(`Twoja siła ataku: ${silaAtaku}`);

    if (silaAtaku > silaObrony) {
        const procentStrat = Math.min(0.9, silaObrony / silaAtaku);
        console.log(`Wynik: ZWYCIĘSTWO! 🎉`);
        console.log(`Straty w Twojej armii: ${Math.round(procentStrat * 100)}%`);

        const noweWojsko = {};
        let calkowityUdzwig = 0;

        for (const [kod, ilosc] of Object.entries(ruch.units)) {
            const przezylo = Math.floor(ilosc * (1 - procentStrat));
            if (przezylo > 0) {
                noweWojsko[kod] = przezylo;
                calkowityUdzwig += przezylo * (BALANS_JEDNOSTEK[kod]?.capacity || 0);
            }
        }

        let wood = Math.floor(Math.random() * 200 * mnoznikLupu) + (100 * mnoznikLupu);
        let stone = Math.floor(Math.random() * 150 * mnoznikLupu) + (50 * mnoznikLupu);
        let gold = Math.floor(Math.random() * 100 * mnoznikLupu) + (20 * mnoznikLupu);

        let sumaLupow = wood + stone + gold;
        if (sumaLupow > calkowityUdzwig && calkowityUdzwig > 0) {
            const wspolczynnik = calkowityUdzwig / sumaLupow;
            wood = Math.floor(wood * wspolczynnik);
            stone = Math.floor(stone * wspolczynnik);
            gold = Math.floor(gold * wspolczynnik);
        } else if (calkowityUdzwig === 0) {
            wood = 0; stone = 0; gold = 0;
        }

        const lup = { wood, stone, gold };
        console.log(`Złupiono: 🪵${wood}, 🪨${stone}, 💰${gold}`);

        if (cel.is_npc) {
            try {
                await spClient.from('villages').delete().eq('id', cel.id);
            } catch (err) {
                console.warn("Błąd usuwania wioski NPC:", err);
            }
        }

        noweWojsko._lup = lup;
        const czasPowrotu = new Date(Date.now() + 30 * 1000).toISOString();

        await spClient.from('troop_movements').update({
            mission_type: 'return',
            finish_time: czasPowrotu,
            units: noweWojsko
        }).eq('id', ruch.id);

    } else {
        console.log(`Wynik: PRZEGRANA! 💀`);
        console.log(`Cała Twoja armia została zniszczona.`);
        await spClient.from('troop_movements').delete().eq('id', ruch.id);
    }
    console.log(`---------------------------\n`);
}

// 3. GŁÓWNA FUNKCJA SILNIKA
export async function sprawdzMaszerujaceWojska(villageId) {
    if (!villageId) return false;
    const teraz = new Date().toISOString();

    const { data: ruchy } = await spClient.from('troop_movements')
        .select('*')
        .eq('village_from_id', villageId)
        .lte('finish_time', teraz);

    if (!ruchy || ruchy.length === 0) return false;

    let zaktualizowanoCos = false;

    for (const ruch of ruchy) {
        if (ruch.mission_type === 'attack') {
            await rozstrzygnijBitwe(ruch, villageId);
            zaktualizowanoCos = true;
        }
        else if (ruch.mission_type === 'return') {
            try {
                const powracajaceWojsko = { ...ruch.units };
                const lup = powracajaceWojsko._lup || {};
                delete powracajaceWojsko._lup;

                const { data: jednostkiBazy } = await spClient.from('village_units')
                    .select('unit_type, quantity')
                    .eq('village_id', villageId);

                const mapaJednostek = {};
                if (jednostkiBazy) jednostkiBazy.forEach(j => mapaJednostek[j.unit_type] = j.quantity);

                const updates = [];
                for (const [kod, ilosc] of Object.entries(powracajaceWojsko)) {
                    if (ilosc > 0) { // Zabezpieczenie przed błędem
                        const nowaIlosc = (mapaJednostek[kod] || 0) + ilosc;
                        updates.push({ village_id: villageId, unit_type: kod, quantity: nowaIlosc });
                    }
                }

                // Zabezpieczenie: Wysyłamy upsert tylko jeśli wojsko faktycznie przeżyło
                if (updates.length > 0) {
                    const { error: upsertErr } = await spClient.from('village_units').upsert(updates, { onConflict: 'village_id, unit_type' });
                    if (upsertErr) console.error("Błąd przywracania wojsk:", upsertErr);
                }

                // Dodawanie łupów
                if (Object.keys(lup).length > 0) {
                    const { data: currRes } = await spClient.from('village_resources')
                        .select('*')
                        .eq('village_id', villageId)
                        .single();

                    if (currRes) {
                        for (const res in lup) {
                            currRes[res] = (currRes[res] || 0) + lup[res];
                        }
                        await spClient.from('village_resources').update(currRes).eq('village_id', villageId);
                    }
                }

                // Usunięcie ruchu po udanym powrocie
                await spClient.from('troop_movements').delete().eq('id', ruch.id);
                console.log(`[POWRÓT] Wojska wróciły! Zrabowano: Drewno:${lup.wood || 0}, Kamień:${lup.stone || 0}, Złoto:${lup.gold || 0}`);
                zaktualizowanoCos = true;

            } catch (err) {
                console.error("Krytyczny błąd podczas powrotu wojsk:", err);
            }
        }
    }
    return zaktualizowanoCos;
}