// units.js - WERSJA DEV (Szybka i tania rekrutacja do testów)

export const BALANS_JEDNOSTEK = {
    // ==========================================
    // 1. LUDZIE (Zakon i Imperium)
    // ==========================================
    ludzie_wlocznik: {
        name: "Włócznik", faction: "ludzie", role: "Obrona",
        wood: 5, stone: 3, food: 2, pop: 1, time: 1,
        att: 10, def: 25, speed: 18, capacity: 15
    },
    ludzie_zbrojny: {
        name: "Zbrojny", faction: "ludzie", role: "Atak",
        wood: 4, stone: 6, iron: 1, food: 3, pop: 1, time: 1,
        att: 40, def: 15, speed: 22, capacity: 25
    },
    ludzie_kawaleria: {
        name: "Lekki Kawalerzysta", faction: "ludzie", role: "Szybkość",
        wood: 10, stone: 8, iron: 2, food: 10, pop: 1, time: 2,
        att: 100, def: 30, speed: 10, capacity: 80
    },
    ludzie_paladyn: {
        name: "Paladyn", faction: "ludzie", role: "Elita",
        wood: 30, stone: 40, silver: 5, relics: 1, food: 20, pop: 2, time: 3,
        att: 250, def: 300, speed: 14, capacity: 50
    },

    // ==========================================
    // 2. ORKOWIE (Brutalna Horda)
    // ==========================================
    orkowie_troll: {
        name: "Trolli Wojownik", faction: "orkowie", role: "Obrona",
        wood: 8, stone: 1, food: 4, pop: 1, time: 1,
        att: 15, def: 40, speed: 20, capacity: 20
    },
    orkowie_siepacz: {
        name: "Siepacz", faction: "orkowie", role: "Atak",
        wood: 6, stone: 2, food: 2, pop: 1, time: 1,
        att: 45, def: 5, speed: 18, capacity: 30
    },
    orkowie_wilk: {
        name: "Wilczy Jeździec", faction: "orkowie", role: "Szybkość",
        wood: 10, stone: 5, hides: 2, food: 8, pop: 1, time: 2,
        att: 90, def: 20, speed: 9, capacity: 70
    },
    orkowie_behemot: {
        name: "Miażdżyciel z Behemotem", faction: "orkowie", role: "Elita",
        wood: 50, stone: 20, tusks: 3, food: 40, pop: 2, time: 3,
        att: 400, def: 100, speed: 30, capacity: 120
    },

    // ==========================================
    // 3. NIEUMARLI (Mrok i Nekromancja)
    // ==========================================
    nieumarli_szkielet: {
        name: "Szkielet", faction: "nieumarli", role: "Obrona",
        wood: 1, stone: 0, corpses: 1, food: 0, pop: 1, time: 1,
        att: 5, def: 20, speed: 20, capacity: 10
    },
    nieumarli_ghul: {
        name: "Ghul", faction: "nieumarli", role: "Atak",
        wood: 2, stone: 1, blood: 1, food: 5, pop: 1, time: 1,
        att: 35, def: 10, speed: 15, capacity: 25
    },
    nieumarli_upior: {
        name: "Upiór", faction: "nieumarli", role: "Szybkość",
        wood: 0, stone: 0, black_frost: 2, food: 2, pop: 1, time: 2,
        att: 80, def: 40, speed: 8, capacity: 60
    },
    nieumarli_rycerz: {
        name: "Rycerz Śmierci", faction: "nieumarli", role: "Elita",
        wood: 20, stone: 20, corpses: 5, blood: 4, black_frost: 1, food: 0, pop: 2, time: 3,
        att: 200, def: 200, speed: 12, capacity: 45
    },

    // ==========================================
    // 4. ELFY (Natura i Finezja)
    // ==========================================
    elfy_straznik: {
        name: "Strażnik Kniei", faction: "elfy", role: "Obrona",
        wood: 6, stone: 1, elderwood: 1, food: 2, pop: 1, time: 1,
        att: 15, def: 35, speed: 18, capacity: 15
    },
    elfy_tancerz: {
        name: "Tancerz Ostrzy", faction: "elfy", role: "Atak",
        wood: 4, stone: 3, crystals: 1, food: 3, pop: 1, time: 1,
        att: 50, def: 10, speed: 16, capacity: 20
    },
    elfy_jelen: {
        name: "Jeździec Jelenia", faction: "elfy", role: "Szybkość",
        wood: 8, stone: 4, food: 6, pop: 1, time: 2,
        att: 70, def: 40, speed: 9, capacity: 75
    },
    elfy_mag: {
        name: "Gwiezdny Mag", faction: "elfy", role: "Elita",
        wood: 20, stone: 10, elderwood: 3, stardust: 2, food: 10, pop: 2, time: 3,
        att: 300, def: 150, speed: 20, capacity: 40
    },

    // ==========================================
    // 5. KRASNOLUDY (Podziemia i Inżynieria)
    // ==========================================
    krasnoludy_tarczownik: {
        name: "Tarczownik", faction: "krasnoludy", role: "Obrona",
        wood: 2, stone: 8, food: 3, pop: 1, time: 1,
        att: 10, def: 50, speed: 24, capacity: 20
    },
    krasnoludy_topornik: {
        name: "Wojownik z Toporem", faction: "krasnoludy", role: "Atak",
        wood: 3, stone: 4, ale: 1, food: 4, pop: 1, time: 1,
        att: 45, def: 15, speed: 22, capacity: 25
    },
    krasnoludy_dzik: {
        name: "Żelazny Dzik", faction: "krasnoludy", role: "Szybkość",
        wood: 10, stone: 15, coal: 5, food: 5, pop: 1, time: 2,
        att: 80, def: 60, speed: 12, capacity: 90
    },
    krasnoludy_golem: {
        name: "Runiczny Golem", faction: "krasnoludy", role: "Elita",
        wood: 5, stone: 40, runestones: 2, mithril: 2, food: 0, pop: 2, time: 3,
        att: 250, def: 400, speed: 30, capacity: 100
    },

    // ==========================================
    // 6. DEMONY (Chaos i Zniszczenie)
    // ==========================================
    demony_imp: {
        name: "Imp", faction: "demony", role: "Zwiad / Szybkość",
        wood: 1, stone: 1, sulfur: 1, food: 1, pop: 1, time: 1,
        att: 5, def: 15, speed: 8, capacity: 30
    },
    demony_ogar: {
        name: "Ogar Piekielny", faction: "demony", role: "Atak",
        wood: 3, stone: 2, food: 8, pop: 1, time: 1,
        att: 60, def: 10, speed: 14, capacity: 40
    },
    demony_straznik: {
        name: "Obsydianowy Strażnik", faction: "demony", role: "Obrona",
        wood: 5, stone: 15, obsidian: 2, food: 5, pop: 1, time: 2,
        att: 40, def: 120, speed: 26, capacity: 15
    },
    demony_czart: {
        name: "Czart Chaosu", faction: "demony", role: "Elita",
        wood: 30, stone: 30, chaos_flame: 1, sulfur: 3, food: 20, pop: 2, time: 3,
        att: 350, def: 200, speed: 16, capacity: 80
    }
};