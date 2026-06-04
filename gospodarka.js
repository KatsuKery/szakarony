// Dane konfiguracyjne dla wszystkich budynków w grze
const BALANS_BUDYNKOW = {
    // --- BUDYNKI UNIWERSALNE (Dostępne dla każdego) ---
    town_hall: { name: "Ratusz", maxLvl: 20, wzrostKosztu: 1.26, woodBaza: 90, stoneBaza: 80, prodBaza: 0, resProd: null, timeBaza: 30 },
    lumberjack: { name: "Tartak", maxLvl: 30, wzrostKosztu: 1.25, woodBaza: 60, stoneBaza: 50, prodBaza: 0.5, resProd: "wood", timeBaza: 15 },
    quarry: { name: "Kamieniołom", maxLvl: 30, wzrostKosztu: 1.27, woodBaza: 75, stoneBaza: 40, prodBaza: 0.4, resProd: "stone", timeBaza: 20 },
    coal_mine: { name: "Smolarnia", maxLvl: 30, wzrostKosztu: 1.28, woodBaza: 120, stoneBaza: 90, prodBaza: 0.3, resProd: "coal", timeBaza: 35 },
    farm: { name: "Farma", maxLvl: 30, wzrostKosztu: 1.24, woodBaza: 50, stoneBaza: 30, prodBaza: 0.6, resProd: "food", timeBaza: 12 },
    mint: { name: "Mennica", maxLvl: 20, wzrostKosztu: 1.32, woodBaza: 200, stoneBaza: 180, prodBaza: 0.2, resProd: "gold", timeBaza: 45 },
    houses: { name: "Domostwa", maxLvl: 30, wzrostKosztu: 1.22, woodBaza: 40, stoneBaza: 25, prodBaza: 0, resProd: null, timeBaza: 10 },
    academy: { name: "Akademia", maxLvl: 20, wzrostKosztu: 1.35, woodBaza: 250, stoneBaza: 300, prodBaza: 0.05, resProd: "knowledge", timeBaza: 60 },
    essence_altar: { name: "Ołtarz Esencji", maxLvl: 20, wzrostKosztu: 1.34, woodBaza: 180, stoneBaza: 220, prodBaza: 0.1, resProd: "essence", timeBaza: 50 },

    // --- FRAKCJA: LUDZIE ---
    iron_mine: { name: "Kopalnia Żelaza", maxLvl: 25, wzrostKosztu: 1.29, woodBaza: 130, stoneBaza: 110, prodBaza: 0.25, resProd: "iron", timeBaza: 40 },
    silver_shaft: { name: "Srebrny Szyb", maxLvl: 20, wzrostKosztu: 1.33, woodBaza: 220, stoneBaza: 250, prodBaza: 0.15, resProd: "silver", timeBaza: 55 },
    cathedral: { name: "Katedra", maxLvl: 10, wzrostKosztu: 1.45, woodBaza: 500, stoneBaza: 600, prodBaza: 0.03, resProd: "relics", timeBaza: 120 },

    // --- FRAKCJA: KRASNOLUDY ---
    deep_shaft: { name: "Głęboki Szyb", maxLvl: 25, wzrostKosztu: 1.30, woodBaza: 140, stoneBaza: 120, prodBaza: 0.25, resProd: "mithril", timeBaza: 42 },
    rune_forge: { name: "Kuźnia Run", maxLvl: 20, wzrostKosztu: 1.34, woodBaza: 200, stoneBaza: 280, prodBaza: 0.15, resProd: "runestones", timeBaza: 58 },
    brewery: { name: "Browar Głębinowy", maxLvl: 15, wzrostKosztu: 1.38, woodBaza: 300, stoneBaza: 200, prodBaza: 0.08, resProd: "ale", timeBaza: 70 },

    // --- FRAKCJA: NIEUMARLI ---
    graveyard: { name: "Cmentarzysko", maxLvl: 25, wzrostKosztu: 1.26, woodBaza: 80, stoneBaza: 60, prodBaza: 0.35, resProd: "corpses", timeBaza: 25 },
    blood_fountain: { name: "Fontanna Krwi", maxLvl: 20, wzrostKosztu: 1.32, woodBaza: 190, stoneBaza: 190, prodBaza: 0.18, resProd: "blood", timeBaza: 48 },
    ice_spire: { name: "Lodowa Iglica", maxLvl: 10, wzrostKosztu: 1.48, woodBaza: 450, stoneBaza: 650, prodBaza: 0.03, resProd: "black_frost", timeBaza: 130 },

    // --- FRAKCJA: ELFY ---
    sacred_grove: { name: "Święty Gaj", maxLvl: 25, wzrostKosztu: 1.28, woodBaza: 110, stoneBaza: 90, prodBaza: 0.28, resProd: "elderwood", timeBaza: 32 },
    crystal_cave: { name: "Kryształowa Jaskinia", maxLvl: 20, wzrostKosztu: 1.35, woodBaza: 150, stoneBaza: 300, prodBaza: 0.14, resProd: "crystals", timeBaza: 65 },
    observatory: { name: "Obserwatorium", maxLvl: 15, wzrostKosztu: 1.40, woodBaza: 350, stoneBaza: 350, prodBaza: 0.05, resProd: "stardust", timeBaza: 85 },

    // --- FRAKCJA: ORKOWIE ---
    bone_pit: { name: "Dół na Kości", maxLvl: 25, wzrostKosztu: 1.25, woodBaza: 70, stoneBaza: 50, prodBaza: 0.4, resProd: "bones", timeBaza: 22 },
    tannery: { name: "Garbarnia", maxLvl: 20, wzrostKosztu: 1.30, woodBaza: 160, stoneBaza: 120, prodBaza: 0.2, resProd: "hides", timeBaza: 40 },
    beast_cages: { name: "Klatki Bestii", maxLvl: 15, wzrostKosztu: 1.42, woodBaza: 400, stoneBaza: 250, prodBaza: 0.06, resProd: "tusks", timeBaza: 90 },

    // --- FRAKCJA: DEMONY ---
    sulfur_fissure: { name: "Siarkowa Szczelina", maxLvl: 25, wzrostKosztu: 1.29, woodBaza: 120, stoneBaza: 130, prodBaza: 0.25, resProd: "sulfur", timeBaza: 38 },
    volcanic_crater: { name: "Wulkaniczny Krater", maxLvl: 20, wzrostKosztu: 1.36, woodBaza: 250, stoneBaza: 350, prodBaza: 0.12, resProd: "obsidian", timeBaza: 75 },
    chaos_altar: { name: "Ołtarz Zniszczenia", maxLvl: 10, wzrostKosztu: 1.50, woodBaza: 600, stoneBaza: 600, prodBaza: 0.02, resProd: "chaos_flame", timeBaza: 150 }
};

// Funkcja obliczająca koszt dla dowolnego budynku i poziomu
function obliczKoszt(kodBudynku, obecnyPoziom) {
    const b = BALANS_BUDYNKOW[kodBudynku];
    if (!b) return { wood: 0, stone: 0 };

    let kosztWood = Math.floor(b.woodBaza * Math.pow(b.wzrostKosztu, obecnyPoziom));
    let kosztStone = Math.floor(b.stoneBaza * Math.pow(b.wzrostKosztu, obecnyPoziom));

    return { wood: kosztWood, stone: kosztStone };
}

// Funkcja obliczająca czas budowy w sekundach z uwzględnieniem poziomu Ratusza
function obliczCzasBudowy(kodBudynku, obecnyPoziom, poziomRatusza) {
    const b = BALANS_BUDYNKOW[kodBudynku];
    if (!b) return 0;

    let czasPodstawowy = b.timeBaza * Math.pow(1.2, obecnyPoziom);
    let czynnikRatusza = poziomRatusza * 0.1 + 0.9;
    let ostatecznyCzas = Math.floor(czasPodstawowy / czynnikRatusza);

    return ostatecznyCzas < 1 ? 1 : ostatecznyCzas;
}