/**
 * KEBUN PINTAR — Sistem Billboard Interaktif
 * File: js/billboard.js
 * Deskripsi: Papan nama HTML overlay yang mengikuti posisi 3D bangunan.
 * Muncul saat pemain dalam radius 8m, fade in/out halus, tidak menghalangi gameplay.
 */

class BillboardSystem {
    constructor() {
        this.layer = null;       // Container div
        this.boards = [];        // Daftar semua billboard
        this.camera = null;      // Three.js camera reference
        this.renderer = null;    // Three.js renderer reference
        this._frameId = null;
        this.SHOW_RADIUS = 8.0;  // Radius muncul (meter)
    }

    // =========================================================================
    // INISIALISASI
    // =========================================================================
    init(camera, renderer) {
        this.camera   = camera;
        this.renderer = renderer;

        // Buat layer container di atas canvas
        this.layer = document.getElementById('billboardLayer');
        if (!this.layer) {
            this.layer = document.createElement('div');
            this.layer.id = 'billboardLayer';
            document.body.appendChild(this.layer);
        }

        // Daftarkan semua bangunan & objek interaktif
        this._registerAll();
    }

    // =========================================================================
    // DAFTAR SEMUA BILLBOARD
    // =========================================================================
    _registerAll() {
        const defs = [
            // ── RUMAH PEMAIN ──────────────────────────────────────────────────
            {
                id: 'bb_house',
                icon: '🏠',
                title: 'RUMAH',
                hint: 'Tekan [E] untuk tidur & istirahat',
                world: { x: 22, y: 5.5, z: -51 }
            },

            // ── GUDANG ────────────────────────────────────────────────────────
            {
                id: 'bb_warehouse',
                icon: '📦',
                title: 'GUDANG',
                hint: 'Tekan [E] untuk membuka penyimpanan',
                world: { x: 40, y: 5.5, z: -51 }
            },

            // ── TOKO DESA ─────────────────────────────────────────────────────
            {
                id: 'bb_store',
                icon: '🏪',
                title: 'TOKO',
                hint: 'Tekan [E] untuk masuk & berbelanja',
                world: { x: -36, y: 6.5, z: -22 }
            },

            // ── PASAR RAKYAT ──────────────────────────────────────────────────
            {
                id: 'bb_market',
                icon: '🛒',
                title: 'PASAR RAKYAT',
                hint: 'Tekan [E] untuk jual & beli',
                world: { x: -36, y: 5.0, z: 31 }
            },

            // ── PAPAN QUEST ───────────────────────────────────────────────────
            {
                id: 'bb_quest',
                icon: '📜',
                title: 'BALAI QUEST',
                hint: 'Tekan [E] untuk lihat misi warga',
                world: { x: -28, y: 4.5, z: -8 }
            },

            // ── SUMUR KEBUN ───────────────────────────────────────────────────
            {
                id: 'bb_well',
                icon: '💧',
                title: 'SUMUR AIR',
                hint: 'Tekan [E] untuk mengambil air',
                world: { x: 40, y: 4.5, z: -24 }
            },

            // ── LUMBUNG / PETERNAKAN ──────────────────────────────────────────
            {
                id: 'bb_barn',
                icon: '🐄',
                title: 'PETERNAKAN',
                hint: 'Area hewan ternak: Sapi, Ayam, Kambing, Bebek',
                world: { x: 38, y: 12.0, z: 52 }
            },

            // ── PALUNG PAKAN ──────────────────────────────────────────────────
            {
                id: 'bb_trough',
                icon: '🌾',
                title: 'PALUNG PAKAN',
                hint: 'Tekan [E] untuk mengisi pakan ternak',
                world: { x: 30, y: 3.0, z: 21 }
            },

            // ── BAK AIR TERNAK ────────────────────────────────────────────────
            {
                id: 'bb_water_trough',
                icon: '🪣',
                title: 'BAK AIR TERNAK',
                hint: 'Tekan [E] untuk mengisi air minum ternak',
                world: { x: 44, y: 3.0, z: 21 }
            },

            // ── KEBUN / GARDEN ZONE ───────────────────────────────────────────
            {
                id: 'bb_garden',
                icon: '🌱',
                title: 'KEBUN',
                hint: 'Dekati petak tanah untuk menanam & merawat',
                world: { x: 16, y: 4.0, z: -24 }
            },

            // ── GUBUK ALAT / GREENHOUSE ───────────────────────────────────────
            {
                id: 'bb_shed',
                icon: '🌾',
                title: 'GREENHOUSE',
                hint: 'Area alat & kompos pertanian',
                world: { x: 40, y: 4.5, z: -35 }
            },

            // ── PANGGUNG FESTIVAL ─────────────────────────────────────────────
            {
                id: 'bb_festival',
                icon: '🎪',
                title: 'PANGGUNG FESTIVAL',
                hint: 'Tekan [E] untuk lihat info acara festival',
                world: { x: -52, y: 4.0, z: 52 }
            },

            // ── NPC: BU DEWI (PEDAGANG) ───────────────────────────────────────
            {
                id: 'bb_npc_dewi',
                icon: '👩‍🌾',
                title: 'BU DEWI',
                hint: 'Pedagang — Tekan [E] untuk buka toko & jual beli',
                world: { x: -36, y: 4.5, z: -10 },
                npc: true
            },

            // ── NPC: PAK BUDI (QUEST GIVER) ───────────────────────────────────
            {
                id: 'bb_npc_budi',
                icon: '👨‍🌾',
                title: 'PAK BUDI',
                hint: 'Tetua Desa — Tekan [E] untuk lihat misi',
                world: { x: -30, y: 4.5, z: 3 },
                npc: true
            },

            // ── NPC: MAS DANU (INFORMAN) ──────────────────────────────────────
            {
                id: 'bb_npc_danu',
                icon: '🧑‍🔬',
                title: 'MAS DANU',
                hint: 'Informan Ranch — Tekan [E] untuk tips',
                world: { x: 20, y: 4.5, z: 20 },
                npc: true
            },

            // ── NPC: DR. ARIS (AI LAB) ────────────────────────────────────────
            {
                id: 'bb_npc_aris',
                icon: '🤖',
                title: 'DR. ARIS',
                hint: 'Dokter Tanaman — Tekan [E] untuk konsultasi AI',
                world: { x: -14, y: 4.5, z: -18 },
                npc: true
            },

            // ── NPC: BU SITI (GURU) ───────────────────────────────────────────
            {
                id: 'bb_npc_siti',
                icon: '👩‍🏫',
                title: 'BU SITI',
                hint: 'Guru Tani — Tekan [E] untuk belajar tanaman',
                world: { x: -42, y: 4.5, z: 8 },
                npc: true
            },

            // ── NPC: PAK JOKO (WORKSHOP) ──────────────────────────────────────
            {
                id: 'bb_npc_joko',
                icon: '🪵',
                title: 'WORKSHOP PAK JOKO',
                hint: 'Pengrajin — Tekan [E] untuk crafting',
                world: { x: 34, y: 4.5, z: -46 },
                npc: true
            },

            // ── AIR MANCUR (LANDMARK) ─────────────────────────────────────────
            {
                id: 'bb_fountain',
                icon: '⛲',
                title: 'AIR MANCUR',
                hint: 'Pusat Alun-Alun Desa Kebun Pintar',
                world: { x: -36, y: 4.0, z: 0 }
            },
        ];

        defs.forEach(def => this._createBoard(def));
    }

    // =========================================================================
    // BUAT ELEMEN BILLBOARD
    // =========================================================================
    _createBoard(def) {
        const el = document.createElement('div');
        el.className = 'billboard' + (def.npc ? ' billboard-npc' : '');
        el.id = def.id;
        el.innerHTML = `
            <div class="bb-icon">${def.icon}</div>
            <div class="bb-body">
                <div class="bb-title">${def.title}</div>
                <div class="bb-hint">${def.hint}</div>
            </div>
        `;
        this.layer.appendChild(el);

        this.boards.push({
            el,
            world: new THREE.Vector3(def.world.x, def.world.y, def.world.z),
            opacity: 0,
            visible: false,
            npc: def.npc || false,
            npcId: def.id  // untuk update posisi NPC dinamis
        });
    }

    // =========================================================================
    // UPDATE SETIAP FRAME
    // =========================================================================
    update(playerPos, deltaTime) {
        if (!this.camera || !this.renderer || !this.layer) return;

        // Saat layar game tidak aktif, sembunyikan semua
        const gameActive = window.appState && window.appState.currentScreen === 'game';
        if (!gameActive) {
            this.boards.forEach(b => {
                b.el.style.display = 'none';
                b.opacity = 0;
            });
            return;
        }

        const canvas    = this.renderer.domElement;
        const width     = canvas.clientWidth  || canvas.width;
        const height    = canvas.clientHeight || canvas.height;
        const canvasRect = canvas.getBoundingClientRect();

        this.boards.forEach(b => {
            // Update posisi NPC secara dinamis dari npcManager
            if (b.npcId && window.npcManager) {
                this._syncNpcPosition(b);
            }

            // Hitung jarak player ke billboard
            const dx = playerPos.x - b.world.x;
            const dz = playerPos.z - b.world.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const shouldShow = dist < this.SHOW_RADIUS;

            // Fade speed
            const fadeSpeed = 3.5; // unit/s (0.28s untuk fade penuh)
            if (shouldShow) {
                b.opacity = Math.min(1, b.opacity + fadeSpeed * deltaTime);
            } else {
                b.opacity = Math.max(0, b.opacity - fadeSpeed * deltaTime);
            }

            if (b.opacity <= 0.01) {
                b.el.style.display = 'none';
                return;
            }
            b.el.style.display = 'flex';
            b.el.style.opacity = b.opacity.toFixed(3);

            // Proyeksikan posisi 3D world ke layar 2D
            const proj = b.world.clone().project(this.camera);

            // Jika di belakang kamera, sembunyikan
            if (proj.z > 1) {
                b.el.style.display = 'none';
                return;
            }

            const screenX = ((proj.x + 1) / 2) * width;
            const screenY = ((-proj.y + 1) / 2) * height;

            // Posisi relatif terhadap canvas di halaman
            const pageX = canvasRect.left + screenX;
            const pageY = canvasRect.top  + screenY;

            b.el.style.left      = pageX + 'px';
            b.el.style.top       = pageY + 'px';
            b.el.style.transform = 'translate(-50%, -100%)';

            // Scale berdasarkan jarak — makin jauh makin kecil
            const scaleFactor = Math.max(0.55, Math.min(1.0, 1 - (dist / this.SHOW_RADIUS) * 0.45));
            b.el.style.scale = scaleFactor.toFixed(3);
        });
    }

    // Sync posisi billboard NPC dengan posisi NPC aktual
    _syncNpcPosition(b) {
        const npcIdMap = {
            'bb_npc_dewi': 'npc_bu_dewi',
            'bb_npc_budi': 'npc_pak_budi',
            'bb_npc_danu': 'npc_mas_danu',
            'bb_npc_aris': 'npc_dr_aris',
            'bb_npc_siti': 'npc_bu_siti',
            'bb_npc_joko': 'npc_pak_joko'
        };
        const npcKey = npcIdMap[b.npcId];
        if (!npcKey) return;

        const npc = window.npcManager.getNPC(npcKey);
        if (npc && npc.mesh) {
            b.world.x = npc.mesh.position.x;
            b.world.z = npc.mesh.position.z;
            b.world.y = npc.mesh.position.y + 3.5;
        }
    }

    // Sembunyikan semua billboard (saat buka modal)
    hideAll() {
        this.boards.forEach(b => {
            b.opacity = 0;
            b.el.style.display = 'none';
        });
    }
}

// Inisialisasi global singleton
window.billboardSystem = new BillboardSystem();
