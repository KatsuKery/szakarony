// units.js

export const BALANS_JEDNOSTEK = {
    // ==========================================
    // 1. LUDZIE (Zakon i Imperium)
    // ==========================================
    ludzie_wlocznik: {
        name: "Włócznik", faction: "ludzie", role: "Obrona",
        wood: 50, stone: 30, food: 20, pop: 1, time: 60,
        att: 10, def: 25, speed: 18
    },
    ludzie_zbrojny: {
        name: "Zbrojny", faction: "ludzie", role: "Atak",
        wood: 40, stone: 60, iron: 10, food: 30, pop: 1, time: 90,
        att: 40, def: 15, speed: 22
    },
    ludzie_kawaleria: {
        name: "Lekki Kawalerzysta", faction: "ludzie", role: "Szybkość",
        wood: 100, stone: 80, iron: 20, food: 100, pop: 4, time: 240,
        att: 100, def: 30, speed: 10
    },
    ludzie_paladyn: {
        name: "Paladyn", faction: "ludzie", role: "Elita",
        wood: 300, stone: 400, silver: 50, relics: 10, food: 200, pop: 8, time: 600,
        att: 250, def: 300, speed: 14
    },

    // ==========================================
    // 2. ORKOWIE (Brutalna Horda)
    // ==========================================
    orkowie_troll: {
        name: "Trolli Wojownik", faction: "orkowie", role: "Obrona",
        wood: 80, stone: 10, food: 40, pop: 2, time: 80,
        att: 15, def: 40, speed: 20
    },
    orkowie_siepacz: {
        name: "Siepacz", faction: "orkowie", role: "Atak",
        wood: 60, stone: 20, food: 20, pop: 1, time: 50,
        att: 45, def: 5, speed: 18
    },
    orkowie_wilk: {
        name: "Wilczy Jeździec", faction: "orkowie", role: "Szybkość",
        wood: 100, stone: 50, hides: 20, food: 80, pop: 3, time: 200,
        att: 90, def: 20, speed: 9
    },
    orkowie_behemot: {
        name: "Miażdżyciel z Behemotem", faction: "orkowie", role: "Elita",
        wood: 500, stone: 200, tusks: 30, food: 400, pop: 12, time: 800,
        att: 400, def: 100, speed: 30
    },

    // ==========================================
    // 3. NIEUMARLI (Mrok i Nekromancja)
    // ==========================================
    nieumarli_szkielet: {
        name: "Szkielet", faction: "nieumarli", role: "Obrona",
        wood: 10, stone: 0, corpses: 5, food: 0, pop: 1, time: 30,
        att: 5, def: 20, speed: 20
    },
    nieumarli_ghul: {
        name: "Ghul", faction: "nieumarli", role: "Atak",
        wood: 20, stone: 10, blood: 15, food: 50, pop: 1, time: 70,
        att: 35, def: 10, speed: 15
    },
    nieumarli_upior: {
        name: "Upiór", faction: "nieumarli", role: "Szybkość",
        wood: 0, stone: 0, black_frost: 20, food: 20, pop: 2, time: 150,
        att: 80, def: 40, speed: 8
    },
    nieumarli_rycerz: {
        name: "Rycerz Śmierci", faction: "nieumarli", role: "Elita",
        wood: 200, stone: 200, corpses: 50, blood: 40, black_frost: 10, food: 0, pop: 6, time: 500,
        att: 200, def: 200, speed: 12
    },

    // ==========================================
    // 4. ELFY (Natura i Finezja)
    // ==========================================
    elfy_straznik: {
        name: "Strażnik Kniei", faction: "elfy", role: "Obrona",
        wood: 60, stone: 10, elderwood: 5, food: 20, pop: 1, time: 70,
        att: 15, def: 35, speed: 18
    },
    elfy_tancerz: {
        name: "Tancerz Ostrzy", faction: "elfy", role: "Atak",
        wood: 40, stone: 30, crystals: 10, food: 30, pop: 1, time: 80,
        att: 50, def: 10, speed: 16
    },
    elfy_jelen: {
        name: "Jeździec Jelenia", faction: "elfy", role: "Szybkość",
        wood: 80, stone: 40, food: 60, pop: 3, time: 220,
        att: 70, def: 40, speed: 9
    },
    elfy_mag: {
        name: "Gwiezdny Mag", faction: "elfy", role: "Elita",
        wood: 200, stone: 100, elderwood: 30, stardust: 20, food: 100, pop: 5, time: 550,
        att: 300, def: 150, speed: 20
    },

    // ==========================================
    // 5. KRASNOLUDY (Podziemia i Inżynieria)
    // ==========================================
    krasnoludy_tarczownik: {
        name: "Tarczownik", faction: "krasnoludy", role: "Obrona",
        wood: 20, stone: 80, food: 30, pop: 1, time: 90,
        att: 10, def: 50, speed: 24
    },
    krasnoludy_topornik: {
        name: "Wojownik z Toporem", faction: "krasnoludy", role: "Atak",
        wood: 30, stone: 40, ale: 10, food: 40, pop: 1, time: 80,
        att: 45, def: 15, speed: 22
    },
    krasnoludy_dzik: {
        name: "Żelazny Dzik", faction: "krasnoludy", role: "Szybkość",
        wood: 100, stone: 150, coal: 50, food: 50, pop: 3, time: 250,
        att: 80, def: 60, speed: 12
    },
    krasnoludy_golem: {
        name: "Runiczny Golem", faction: "krasnoludy", role: "Elita",
        wood: 50, stone: 400, runestones: 25, mithril: 20, food: 0, pop: 8, time: 700,
        att: 250, def: 400, speed: 30
    },

    // ==========================================
    // 6. DEMONY (Chaos i Zniszczenie)
    // ==========================================
    demony_imp: {
        name: "Imp", faction: "demony", role: "Zwiad / Szybkość",
        wood: 10, stone: 10, sulfur: 5, food: 10, pop: 1, time: 40,
        att: 5, def: 15, speed: 8
    },
    demony_ogar: {
        name: "Ogar Piekielny", faction: "demony", role: "Atak",
        wood: 30, stone: 20, food: 80, pop: 2, time: 100,
        att: 60, def: 10, speed: 14
    },
    demony_straznik: {
        name: "Obsydianowy Strażnik", faction: "demony", role: "Obrona",
        wood: 50, stone: 150, obsidian: 20, food: 50, pop: 3, time: 200,
        att: 40, def: 120, speed: 26
    },
    demony_czart: {
        name: "Czart Chaosu", faction: "demony", role: "Elita",
        wood: 300, stone: 300, chaos_flame: 15, sulfur: 30, food: 200, pop: 10, time: 650,
        att: 350, def: 200, speed: 16
    }
};