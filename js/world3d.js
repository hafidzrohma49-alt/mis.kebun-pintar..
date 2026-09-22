/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/world3d.js
 * Deskripsi: Dunia 3D Three.js Skala Luas dengan Daratan Solid, Sungai, Jembatan,
 * dan 11 Zona Terintegrasi (Kebun, Peternakan, Rumah, Toko, Gudang, Desa NPC,
 * Hutan, Sungai, Jembatan, Pasar, Festival & Kincir).
 * Dilengkapi sistem collision detection fisik, minimap 2D komprehensif, dan cuaca dinamis.
 */

class World3D {
    constructor() {
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        this.isRunning = false;
        this.isInitialized = false;
        this.animFrameId = null;

        // Komponen dunia
        this.plots = [];
        this.windmillBlades = null;
        this.rainParticles = null;
        this.currentWeather = 'cerah';

        // Pencahayaan
        this.ambientLight = null;
        this.dirLight = null;
        this.nightLamps = [];

        // Minimap
        this.minimapCanvas = null;
        this.minimapCtx = null;

        // Sistem Collision Fisik (Pemain tidak tembus objek)
        this.boxColliders = [];
        this.circleColliders = [];
        this.bounds = { minX: -74, maxX: 74, minZ: -74, maxZ: 74 };

        // Registry Objek Interaksi [E]
        this.interactables = [];
        this.npcList = [];
    }

    // Inisialisasi Three.js hanya saat masuk ke layar berkebun
    init() {
        this.container = document.getElementById('canvasContainer');
        if (!this.container) {
            console.error('Canvas container tidak ditemukan!');
            return;
        }

        const width = this.container.clientWidth || window.innerWidth;
        const height = this.container.clientHeight || window.innerHeight;

        // 1. Scene Three.js
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x81d4fa);
        this.scene.fog = new THREE.FogExp2(0x81d4fa, 0.008);

        // 2. Camera (Third-Person View)
        this.camera = new THREE.PerspectiveCamera(50, width / height, 0.5, 450);
        this.camera.position.set(0, 18, 22);
        this.camera.lookAt(0, 1.2, 0);

        // 3. WebGL Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.container.innerHTML = '';
        this.container.appendChild(this.renderer.domElement);

        // Reset data collider & interaksi
        this.boxColliders = [];
        this.circleColliders = [];
        this.interactables = [];
        this.nightLamps = [];
        this.npcList = [];

        // 4. Bangun Seluruh Dunia 3D Luas (11 Zona)
        this.setupLights();
        this.buildVastTerrain();
        this.buildRiverAndBridge();
        this.buildStonePathways();
        this.buildGardenZone();
        this.buildRanchZone();
        this.buildPlayerHouseZone();
        this.buildWarehouseZone();
        this.buildStoreZone();
        this.buildVillageNPCZone();
        this.buildMarketSquareZone();
        this.buildFestivalAndWindmillZone();
        this.buildForestZone();
        this.setupRainSystem();

        // 5. Tambahkan Karakter Petani Pemain
        if (window.playerController) {
            const playerMesh = window.playerController.createMesh();
            this.scene.add(playerMesh);
        }

        // 6. Inisialisasi Hewan Peternakan & NPC Dunia
        if (window.animalManager) {
            window.animalManager.init(this.scene);
        }
        if (window.npcManager) {
            window.npcManager.init(this.scene, this);
        }

        // 7. Inisialisasi Minimap 2D
        this.initMinimap();

        // 8. Event Resize
        window.addEventListener('resize', () => this.onWindowResize());

        this.isInitialized = true;
    }

    // ========================================================================
    // PENCAHAYAAN & CUACA
    // ========================================================================
    setupLights() {
        this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfffaed, 0.95);
        this.dirLight.position.set(45, 75, 40);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.mapSize.width = 2048;
        this.dirLight.shadow.mapSize.height = 2048;
        this.dirLight.shadow.camera.near = 10;
        this.dirLight.shadow.camera.far = 250;
        const d = 60;
        this.dirLight.shadow.camera.left = -d;
        this.dirLight.shadow.camera.right = d;
        this.dirLight.shadow.camera.top = d;
        this.dirLight.shadow.camera.bottom = -d;
        this.dirLight.shadow.bias = -0.0005;
        this.scene.add(this.dirLight);
    }

    // ========================================================================
    // SISTEM COLLISION DETECTION FISIK (Pemain Tidak Tembus Objek)
    // ========================================================================
    addBoxCollider(minX, maxX, minZ, maxZ, name = 'obstacle') {
        this.boxColliders.push({ minX, maxX, minZ, maxZ, name });
    }

    addCircleCollider(x, z, radius, name = 'obstacle') {
        this.circleColliders.push({ x, z, radius, name });
    }

    // Cek tabrakan posisi masa depan pemain
    checkCollision(x, z, playerRadius = 0.55) {
        // 1. Batas luar map dunia
        if (x - playerRadius < this.bounds.minX || x + playerRadius > this.bounds.maxX ||
            z - playerRadius < this.bounds.minZ || z + playerRadius > this.bounds.maxZ) {
            return true;
        }

        // 2. Tabrakan Box (Bangunan, Pagar, Tepian Sungai)
        for (const b of this.boxColliders) {
            if (x + playerRadius > b.minX && x - playerRadius < b.maxX &&
                z + playerRadius > b.minZ && z - playerRadius < b.maxZ) {
                return true;
            }
        }

        // 3. Tabrakan Lingkaran (Pohon, Batu, Sumur, Kolam)
        for (const c of this.circleColliders) {
            const dist = Math.hypot(x - c.x, z - c.z);
            if (dist < playerRadius + c.radius) {
                return true;
            }
        }

        // 4. Tabrakan Hewan Ternak (Sapi, Kambing, Ayam, Bebek)
        if (window.animalManager) {
            const animalColliders = window.animalManager.getColliders();
            for (const a of animalColliders) {
                const dist = Math.hypot(x - a.x, z - a.z);
                if (dist < playerRadius + a.radius) {
                    return true;
                }
            }
        }

        return false;
    }

    // Deteksi Ketinggian Tanah (Misal saat menaiki Jembatan Kayu)
    getGroundHeight(x, z) {
        // Jembatan berada di x [-3, 5], z [-3, 3]
        if (x >= -3.5 && x <= 5.5 && z >= -3.2 && z <= 3.2) {
            // Lengkungan jembatan lembut naik hingga 0.55
            const t = 1 - Math.abs(x - 1.0) / 4.5;
            return Math.max(0, t * 0.55);
        }
        return 0; // Ketinggian dasar tanah datar
    }

    // ========================================================================
    // 1. ZONA DARATAN UTAMA (VAST SOLID TERRAIN)
    // ========================================================================
    buildVastTerrain() {
        // Dataran rumput hijau solid luas (160 x 160)
        const terrainGeo = new THREE.PlaneGeometry(160, 160, 32, 32);
        const terrainMat = new THREE.MeshLambertMaterial({ color: 0x558b2f });
        const terrain = new THREE.Mesh(terrainGeo, terrainMat);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        this.scene.add(terrain);

        // Pagar pembatas tepi map dunia
        const fenceMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
        const postGeo = new THREE.CylinderGeometry(0.18, 0.18, 1.8, 8);
        const railGeo = new THREE.BoxGeometry(6.0, 0.12, 0.1);

        const buildPerimeter = (startX, startZ, endX, endZ) => {
            const steps = 24;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = startX + (endX - startX) * t;
                const z = startZ + (endZ - startZ) * t;

                const post = new THREE.Mesh(postGeo, fenceMat);
                post.position.set(x, 0.9, z);
                post.castShadow = true;
                this.scene.add(post);

                if (i < steps) {
                    const midX = x + (endX - startX) / (steps * 2);
                    const midZ = z + (endZ - startZ) / (steps * 2);
                    const angle = Math.atan2(endX - startX, endZ - startZ);

                    [0.5, 1.1].forEach(h => {
                        const rail = new THREE.Mesh(railGeo, fenceMat);
                        rail.position.set(midX, h, midZ);
                        rail.rotation.y = angle - Math.PI / 2;
                        this.scene.add(rail);
                    });
                }
            }
        };

        buildPerimeter(-74, -74, 74, -74);
        buildPerimeter(74, -74, 74, 74);
        buildPerimeter(74, 74, -74, 74);
        buildPerimeter(-74, 74, -74, -74);
    }

    // ========================================================================
    // 2. ZONA SUNGAI & JEMBATAN KAYU (RIVER & BRIDGE)
    // ========================================================================
    buildRiverAndBridge() {
        const riverGroup = new THREE.Group();

        // Air Sungai Membelah Map (X: -2 s/d 4, Z: -75 s/d 75)
        const riverGeo = new THREE.PlaneGeometry(7.0, 150, 1, 32);
        const riverMat = new THREE.MeshStandardMaterial({
            color: 0x0288d1,
            roughness: 0.1,
            metalness: 0.35,
            transparent: true,
            opacity: 0.88
        });
        const river = new THREE.Mesh(riverGeo, riverMat);
        river.rotation.x = -Math.PI / 2;
        river.position.set(1.0, 0.04, 0);
        riverGroup.add(river);

        // Tepian Batu Sungai & Collider Sungai (Kecuali bagian jembatan Z = [-3.5, 3.5])
        const stoneMat = new THREE.MeshLambertMaterial({ color: 0x616161 });
        const bankLeftX = -2.6;
        const bankRightX = 4.6;

        for (let z = -72; z <= 72; z += 3.5) {
            // Lewati bukaan jembatan agar pemain dapat menyeberang
            if (z >= -3.5 && z <= 3.5) continue;

            // Batu sisi barat sungai
            const sL = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.2, 0), stoneMat);
            sL.position.set(bankLeftX, 0.25, z);
            sL.castShadow = true;
            riverGroup.add(sL);

            // Batu sisi timur sungai
            const sR = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55 + Math.random() * 0.2, 0), stoneMat);
            sR.position.set(bankRightX, 0.25, z);
            sR.castShadow = true;
            riverGroup.add(sR);
        }

        // Collider Fisik Sungai (Mencegah pemain tercebur kecuali lewat jembatan)
        // Sungai Bagian Utara
        this.addBoxCollider(-2.8, 4.8, -75, -3.2, 'sungai_utara');
        // Sungai Bagian Selatan
        this.addBoxCollider(-2.8, 4.8, 3.2, 75, 'sungai_selatan');

        // JEMBATAN KAYU MELINTASI SUNGAI (X: -3.5 s/d 5.5, Z: [-3, 3])
        const bridgeWoodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const bridgePlankMat = new THREE.MeshLambertMaterial({ color: 0x795548 });

        // Geladak Kayu Jembatan
        const bridgeGeo = new THREE.BoxGeometry(9.0, 0.35, 5.2);
        const bridge = new THREE.Mesh(bridgeGeo, bridgePlankMat);
        bridge.position.set(1.0, 0.45, 0);
        bridge.castShadow = true;
        bridge.receiveShadow = true;
        riverGroup.add(bridge);

        // Pagar Pembatas Kiri & Kanan Jembatan
        [-2.5, 2.5].forEach(zPos => {
            const railing = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.15, 0.12), bridgeWoodMat);
            railing.position.set(1.0, 1.15, zPos);
            riverGroup.add(railing);

            // Tiang pagar jembatan
            for (let x = -3.2; x <= 5.2; x += 1.8) {
                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), bridgeWoodMat);
                post.position.set(x, 0.85, zPos);
                riverGroup.add(post);
            }

            // Collider pagar jembatan
            this.addBoxCollider(-3.5, 5.5, zPos - 0.2, zPos + 0.2, 'pagar_jembatan');
        });

        // Lentera Hias di Ujung Jembatan
        this.createStreetLamp(-3.2, -2.6, riverGroup);
        this.createStreetLamp(5.2, -2.6, riverGroup);

        this.scene.add(riverGroup);
    }

    // ========================================================================
    // 3. JALAN SETAPAK BATU (STONE PATHWAYS)
    // ========================================================================
    buildStonePathways() {
        const pathMat = new THREE.MeshLambertMaterial({ color: 0xbdbdbd });
        const dirtMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });

        const createPathSegment = (x, z, w, d, isDirt = false) => {
            const geo = new THREE.PlaneGeometry(w, d);
            const mesh = new THREE.Mesh(geo, isDirt ? dirtMat : pathMat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.set(x, 0.02, z);
            mesh.receiveShadow = true;
            this.scene.add(mesh);
        };

        // Jalan Utama Menghubungkan Jembatan ke Desa (Barat)
        createPathSegment(-20, 0, 32, 4.5);
        // Jalan Utama Menghubungkan Jembatan ke Kebun & Peternakan (Timur)
        createPathSegment(20, 0, 32, 4.5);

        // Cabang Jalan ke Rumah Pemain (Utara-Timur)
        createPathSegment(22, -26, 4.0, 48, true);
        // Cabang Jalan ke Peternakan (Selatan-Timur)
        createPathSegment(26, 26, 4.0, 48, true);

        // Cabang Jalan ke Toko & Desa (Utara-Barat)
        createPathSegment(-35, -20, 4.0, 36);
        // Cabang Jalan ke Pasar & Festival (Selatan-Barat)
        createPathSegment(-35, 30, 4.0, 56);
    }

    // ========================================================================
    // 4. ZONA KEBUN & 12 PETAK BEDENGAN TANAH (GARDEN ZONE)
    // ========================================================================
    buildGardenZone() {
        const gardenGroup = new THREE.Group();

        // 12 Petak Bedengan Tanah: 3 Baris x 4 Kolom
        this.plots = [];
        const xOffsets = [16, 22, 28, 34];
        const zOffsets = [-16, -24, -32];

        let idCounter = 0;
        zOffsets.forEach(z => {
            xOffsets.forEach(x => {
                const plotData = this.createSinglePlot(idCounter, x, z);
                this.plots.push(plotData);
                idCounter++;
            });
        });

        // Sumur Air Kebun Tradisional (Water Well)
        const wellGroup = new THREE.Group();
        wellGroup.position.set(40, 0, -24);

        // Dinding batu sumur
        const wallGeo = new THREE.CylinderGeometry(1.6, 1.7, 1.2, 16, 1, true);
        const wallMat = new THREE.MeshLambertMaterial({ color: 0x757575 });
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.y = 0.6;
        wall.castShadow = true;
        wellGroup.add(wall);

        // Air di dasar sumur
        const wellWater = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), new THREE.MeshStandardMaterial({ color: 0x0277bd }));
        wellWater.rotation.x = -Math.PI / 2;
        wellWater.position.y = 0.4;
        wellGroup.add(wellWater);

        // Tiang kayu & Atap genteng sumur
        const postMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        [-1.2, 1.2].forEach(x => {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 2.6), postMat);
            p.position.set(x, 1.3, 0);
            p.castShadow = true;
            wellGroup.add(p);
        });

        const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), new THREE.MeshLambertMaterial({ color: 0xb71c1c }));
        wellRoof.position.y = 2.8;
        wellRoof.rotation.y = Math.PI / 4;
        wellGroup.add(wellRoof);

        this.scene.add(wellGroup);

        // Collider Sumur
        this.addCircleCollider(40, -24, 1.8, 'sumur_kebun');
        this.registerInteractable({
            id: 'well_garden',
            type: 'well',
            name: 'Sumur Air Bersih',
            actionText: 'Ambil Air Segar',
            position: { x: 40, z: -24 },
            radius: 2.8
        });

        // Gubuk Alat & Kompos
        const shed = new THREE.Mesh(new THREE.BoxGeometry(4.2, 3.2, 4.2), new THREE.MeshLambertMaterial({ color: 0x6d4c41 }));
        shed.position.set(40, 1.6, -35);
        shed.castShadow = true;
        this.scene.add(shed);
        this.addBoxCollider(37.5, 42.5, -37.5, -32.5, 'gubuk_alat');
    }

    // Buat satu petak bedengan tanah kayu
    createSinglePlot(id, x, z) {
        const plotGroup = new THREE.Group();
        plotGroup.position.set(x, 0, z);

        // Bingkai kayu
        const frameMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const frame = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 3.6), frameMat);
        frame.position.y = 0.17;
        frame.castShadow = true;
        plotGroup.add(frame);

        // Tanah di dalam
        const soilGeo = new THREE.BoxGeometry(3.2, 0.36, 3.2);
        const soilMat = new THREE.MeshLambertMaterial({ color: 0x795548 });
        const soilMesh = new THREE.Mesh(soilGeo, soilMat);
        soilMesh.position.y = 0.18;
        soilMesh.receiveShadow = true;
        plotGroup.add(soilMesh);

        // Wadah visual tanaman 3D
        const cropGroup = new THREE.Group();
        plotGroup.add(cropGroup);

        this.scene.add(plotGroup);

        // Daftarkan sebagai interactable
        const plotData = {
            id: id,
            position: { x, z },
            group: plotGroup,
            soilMesh: soilMesh,
            cropGroup: cropGroup,
            crop: null,
            growth: 0,
            isWatered: false,
            harvestReady: false
        };

        this.registerInteractable({
            id: `plot_${id}`,
            type: 'plot',
            plotRef: plotData,
            name: `Petak Bedengan #${id + 1}`,
            actionText: 'Periksa Petak',
            position: { x, z },
            radius: 2.2
        });

        return plotData;
    }

    // ========================================================================
    // 5. ZONA PETERNAKAN (RANCH ZONE: SAPI, AYAM, KAMBING, BEBEK)
    // ========================================================================
    buildRanchZone() {
        const ranchGroup = new THREE.Group();

        // Lumbung Merah Besar (Big Red Barn)
        const barnMat = new THREE.MeshLambertMaterial({ color: 0xb71c1c });
        const barnWhiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
        const barnRoofMat = new THREE.MeshLambertMaterial({ color: 0x37474f });

        const barnBody = new THREE.Mesh(new THREE.BoxGeometry(10.0, 7.5, 12.0), barnMat);
        barnBody.position.set(38, 3.75, 58);
        barnBody.castShadow = true;
        ranchGroup.add(barnBody);

        // Atap Lumbung Miring
        const roofGeo = new THREE.ConeGeometry(9.0, 4.0, 4);
        const barnRoof = new THREE.Mesh(roofGeo, barnRoofMat);
        barnRoof.position.set(38, 9.2, 58);
        barnRoof.rotation.y = Math.PI / 4;
        barnRoof.scale.set(1.0, 1.0, 1.4);
        ranchGroup.add(barnRoof);

        // Pintu Putih Lumbung
        const barnDoor = new THREE.Mesh(new THREE.BoxGeometry(4.2, 4.5, 0.2), barnWhiteMat);
        barnDoor.position.set(38, 2.25, 51.9);
        ranchGroup.add(barnDoor);

        this.addBoxCollider(32, 44, 51.5, 65, 'lumbung_merah');

        // Kandang Ayam (Chicken Coop)
        const coopMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
        const coop = new THREE.Mesh(new THREE.BoxGeometry(5.0, 3.5, 4.5), coopMat);
        coop.position.set(22, 1.75, 48);
        coop.castShadow = true;
        ranchGroup.add(coop);
        this.addBoxCollider(19, 25, 45.5, 50.5, 'kandang_ayam');

        // Pagar Kayu Padang Rumput Peternakan (Pasture Fence)
        const fenceWoodMat = new THREE.MeshLambertMaterial({ color: 0x6d4c41 });
        const fMinX = 18, fMaxX = 58, fMinZ = 14, fMaxZ = 48;

        const buildPastureFence = (x1, z1, x2, z2) => {
            const steps = 14;
            for (let i = 0; i <= steps; i++) {
                // Beri celah gerbang di sisi barat (Z = 20 s/d 24)
                const zVal = z1 + (z2 - z1) * (i / steps);
                const xVal = x1 + (x2 - x1) * (i / steps);
                if (x1 === fMinX && zVal >= 18 && zVal <= 24) continue;

                const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4), fenceWoodMat);
                post.position.set(xVal, 0.7, zVal);
                ranchGroup.add(post);
            }
        };

        buildPastureFence(fMinX, fMinZ, fMaxX, fMinZ); // Pagar Utara
        buildPastureFence(fMaxX, fMinZ, fMaxX, fMaxZ); // Pagar Timur
        buildPastureFence(fMaxX, fMaxZ, fMinX, fMaxZ); // Pagar Selatan
        buildPastureFence(fMinX, fMaxZ, fMinX, fMinZ); // Pagar Barat

        // Collider Pagar Pasture
        this.addBoxCollider(fMinX, fMaxX, fMinZ - 0.3, fMinZ + 0.3, 'pagar_ranch_utara');
        this.addBoxCollider(fMaxX - 0.3, fMaxX + 0.3, fMinZ, fMaxZ, 'pagar_ranch_timur');
        this.addBoxCollider(fMinX, fMaxX, fMaxZ - 0.3, fMaxZ + 0.3, 'pagar_ranch_selatan');
        this.addBoxCollider(fMinX - 0.3, fMinX + 0.3, 24, fMaxZ, 'pagar_ranch_barat_bawah');
        this.addBoxCollider(fMinX - 0.3, fMinX + 0.3, fMinZ, 18, 'pagar_ranch_barat_atas');

        // Palung Pakan Ternak (Feeding Trough)
        const troughMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
        const hayMat = new THREE.MeshLambertMaterial({ color: 0xfbc02d });

        const feedTrough = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.6, 1.2), troughMat);
        feedTrough.position.set(30, 0.3, 22);
        feedTrough.castShadow = true;
        ranchGroup.add(feedTrough);

        const hay = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.9), hayMat);
        hay.position.set(30, 0.45, 22);
        ranchGroup.add(hay);

        this.addBoxCollider(27.8, 32.2, 21.2, 22.8, 'palung_pakan');
        this.registerInteractable({
            id: 'trough_feed',
            type: 'feed_trough',
            name: 'Palung Pakan Komunal',
            actionText: 'Isi Pakan Ternak',
            position: { x: 30, z: 22 },
            radius: 2.8
        });

        // Bak Air Minum Ternak (Water Trough)
        const waterTrough = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.6, 1.2), troughMat);
        waterTrough.position.set(44, 0.3, 22);
        waterTrough.castShadow = true;
        ranchGroup.add(waterTrough);

        const troughWater = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.4, 0.9), new THREE.MeshStandardMaterial({ color: 0x0288d1 }));
        troughWater.position.set(44, 0.45, 22);
        ranchGroup.add(troughWater);

        this.addBoxCollider(41.8, 46.2, 21.2, 22.8, 'palung_air');
        this.registerInteractable({
            id: 'trough_water',
            type: 'water_trough',
            name: 'Bak Air Minum Ternak',
            actionText: 'Isi Air Minum Ternak',
            position: { x: 44, z: 22 },
            radius: 2.8
        });

        this.scene.add(ranchGroup);
    }

    // ========================================================================
    // 6. RUMAH PEMAIN (PLAYER COTTAGE)
    // ========================================================================
    buildPlayerHouseZone() {
        const houseGroup = new THREE.Group();
        houseGroup.position.set(22, 0, -54);

        // Badan Rumah Kayu
        const wallMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const doorMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });

        const house = new THREE.Mesh(new THREE.BoxGeometry(7.5, 4.5, 6.5), wallMat);
        house.position.y = 2.25;
        house.castShadow = true;
        houseGroup.add(house);

        // Atap Segitiga
        const roof = new THREE.Mesh(new THREE.ConeGeometry(6.5, 3.2, 4), roofMat);
        roof.position.y = 5.8;
        roof.rotation.y = Math.PI / 4;
        roof.scale.set(1.1, 1.0, 1.2);
        houseGroup.add(roof);

        // Cerobong Asap
        const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 3.5, 0.9), new THREE.MeshLambertMaterial({ color: 0xb71c1c }));
        chimney.position.set(2.4, 5.5, 1.2);
        houseGroup.add(chimney);

        // Beranda & Pintu Masuk
        const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.2), doorMat);
        door.position.set(0, 1.3, 3.3);
        houseGroup.add(door);

        // Kasur Tidur di Beranda / Dalam Rumah (Bisa digunakan untuk tidur mempercepat hari)
        const bedMat = new THREE.MeshLambertMaterial({ color: 0x1976d2 });
        const pillowMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.4), bedMat);
        bed.position.set(-2.2, 0.3, 4.2);
        houseGroup.add(bed);

        const pillow = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 0.6), pillowMat);
        pillow.position.set(-2.2, 0.6, 5.0);
        houseGroup.add(pillow);

        this.scene.add(houseGroup);

        this.addBoxCollider(17.8, 26.2, -58, -49.5, 'rumah_pemain');
        this.registerInteractable({
            id: 'house_bed',
            type: 'bed',
            name: 'Kamar & Tempat Tidur Pemain',
            actionText: 'Tidur / Istirahat',
            position: { x: 22, z: -50 },
            radius: 3.0
        });
    }

    // ========================================================================
    // 7. GUDANG & PETI PENYIMPANAN (WAREHOUSE ZONE)
    // ========================================================================
    buildWarehouseZone() {
        const warehouseGroup = new THREE.Group();
        warehouseGroup.position.set(40, 0, -54);

        const stoneMat = new THREE.MeshLambertMaterial({ color: 0x757575 });
        const woodMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });

        const building = new THREE.Mesh(new THREE.BoxGeometry(7.0, 4.2, 6.0), stoneMat);
        building.position.y = 2.1;
        building.castShadow = true;
        warehouseGroup.add(building);

        const roof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.5, 4), woodMat);
        roof.position.y = 5.2;
        roof.rotation.y = Math.PI / 4;
        warehouseGroup.add(roof);

        // Peti Penyimpanan Kayu di Depan Gudang (Storage Chest)
        const chestMat = new THREE.MeshLambertMaterial({ color: 0xa1887f });
        const chest = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 1.2), chestMat);
        chest.position.set(0, 0.6, 3.8);
        chest.castShadow = true;
        warehouseGroup.add(chest);

        this.scene.add(warehouseGroup);
        this.addBoxCollider(36, 44, -58, -49.5, 'gudang');

        this.registerInteractable({
            id: 'warehouse_chest',
            type: 'warehouse',
            name: 'Peti Penyimpanan Gudang',
            actionText: 'Buka Gudang Penyimpanan',
            position: { x: 40, z: -50 },
            radius: 3.0
        });
    }

    // ========================================================================
    // 8. TOKO DESA (GENERAL STORE)
    // ========================================================================
    buildStoreZone() {
        const storeGroup = new THREE.Group();
        storeGroup.position.set(-36, 0, -26);

        const wallMat = new THREE.MeshLambertMaterial({ color: 0xffecb3 });
        const roofMat = new THREE.MeshLambertMaterial({ color: 0x3949ab });
        const awningMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f });

        // Gedung Toko
        const building = new THREE.Mesh(new THREE.BoxGeometry(8.5, 4.8, 7.5), wallMat);
        building.position.y = 2.4;
        building.castShadow = true;
        storeGroup.add(building);

        // Atap Toko
        const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 3.2, 4), roofMat);
        roof.position.y = 6.0;
        roof.rotation.y = Math.PI / 4;
        storeGroup.add(roof);

        // Kanopi Tenda Depan Toko
        const awning = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.15, 2.0), awningMat);
        awning.position.set(0, 2.8, 4.6);
        awning.rotation.x = 0.25;
        storeGroup.add(awning);

        // Plang Papan Nama Toko
        const sign = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.8, 0.2), new THREE.MeshLambertMaterial({ color: 0xffffff }));
        sign.position.set(0, 3.8, 4.2);
        storeGroup.add(sign);

        this.scene.add(storeGroup);
        this.addBoxCollider(-41, -31, -31, -21, 'toko_desa');

        this.registerInteractable({
            id: 'village_store',
            type: 'shop',
            name: 'Toko Desa Sumber Makmur',
            actionText: 'Masuk & Buka Toko',
            position: { x: -36, z: -21 },
            radius: 3.2
        });
    }

    // ========================================================================
    // 9. ALUN-ALUN & AREA NPC DESA (VILLAGE SQUARE)
    // ========================================================================
    buildVillageNPCZone() {
        const villageGroup = new THREE.Group();
        villageGroup.position.set(-36, 0, 0);

        // Lantai Paving Alun-Alun
        const plazaGeo = new THREE.CircleGeometry(14, 24);
        const plazaMat = new THREE.MeshLambertMaterial({ color: 0x9e9e9e });
        const plaza = new THREE.Mesh(plazaGeo, plazaMat);
        plaza.rotation.x = -Math.PI / 2;
        plaza.position.y = 0.03;
        plaza.receiveShadow = true;
        villageGroup.add(plaza);

        // Air Mancur Alun-Alun (Fountain)
        const fountainWall = new THREE.Mesh(new THREE.CylinderGeometry(3.0, 3.2, 1.2, 16, 1, true), new THREE.MeshLambertMaterial({ color: 0x616161 }));
        fountainWall.position.y = 0.6;
        villageGroup.add(fountainWall);

        const fountainWater = new THREE.Mesh(new THREE.CircleGeometry(2.9, 16), new THREE.MeshStandardMaterial({ color: 0x0288d1 }));
        fountainWater.rotation.x = -Math.PI / 2;
        fountainWater.position.y = 0.8;
        villageGroup.add(fountainWater);

        const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 2.5), new THREE.MeshLambertMaterial({ color: 0x757575 }));
        pillar.position.y = 1.25;
        villageGroup.add(pillar);

        this.addCircleCollider(-36, 0, 3.4, 'air_mancur');

        // Papan Quest Desa (Quest Board)
        const boardGroup = new THREE.Group();
        boardGroup.position.set(-28, 0, -8);
        const boardPost = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.6, 0.2), new THREE.MeshLambertMaterial({ color: 0x4e342e }));
        boardPost.position.y = 1.3;
        boardGroup.add(boardPost);
        const boardFace = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 0.15), new THREE.MeshLambertMaterial({ color: 0xa1887f }));
        boardFace.position.y = 2.0;
        boardGroup.add(boardFace);
        this.scene.add(boardGroup);

        this.addBoxCollider(-29.5, -26.5, -9, -7, 'papan_quest');
        this.registerInteractable({
            id: 'quest_board',
            type: 'quest_board',
            name: 'Papan Pesanan Warga Desa',
            actionText: 'Buka Papan Tugas & Pesanan',
            position: { x: -28, z: -8 },
            radius: 2.8
        });

        // Catatan: Seluruh 6 NPC diatur dan dianimasikan secara dinamis oleh window.npcManager
        this.scene.add(villageGroup);
    }

    // Buat Model Karakter NPC 3D
    createNPCCharacter(name, role, shirtColor, x, z) {
        const npcGroup = new THREE.Group();
        npcGroup.position.set(x, 0, z);

        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
        const shirtMat = new THREE.MeshLambertMaterial({ color: shirtColor });
        const pantsMat = new THREE.MeshLambertMaterial({ color: 0x37474f });

        // Badan
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.85, 0.45), shirtMat);
        body.position.y = 1.15;
        body.castShadow = true;
        npcGroup.add(body);

        // Kepala
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
        head.position.y = 1.8;
        npcGroup.add(head);

        // Rambut / Topi
        const hair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), new THREE.MeshLambertMaterial({ color: 0x212121 }));
        hair.position.y = 2.05;
        npcGroup.add(hair);

        // Kaki
        [-0.18, 0.18].forEach(legX => {
            const leg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.7, 0.3), pantsMat);
            leg.position.set(legX, 0.35, 0);
            npcGroup.add(leg);
        });

        this.scene.add(npcGroup);
        this.addCircleCollider(x, z, 0.8, `npc_${name}`);

        this.registerInteractable({
            id: `npc_${name.toLowerCase().replace(' ', '_')}`,
            type: 'npc',
            npcName: name,
            npcRole: role,
            name: `${name} (${role})`,
            actionText: `Bicara dengan ${name}`,
            position: { x, z },
            radius: 2.6
        });
    }

    // ========================================================================
    // 10. PASAR DESA & KIOS TENDA (MARKET SQUARE)
    // ========================================================================
    buildMarketSquareZone() {
        const marketGroup = new THREE.Group();
        marketGroup.position.set(-36, 0, 36);

        // 3 Kios Pasar Berkanopi Belang Warna-Warni
        const stallConfigs = [
            { x: -6, z: 0, color: 0xd32f2f, name: 'Kios Sayur Mayur' },
            { x: 0, z: 0, color: 0x1976d2, name: 'Kios Telur & Susu' },
            { x: 6, z: 0, color: 0x388e3c, name: 'Kios Bibit & Pupuk' }
        ];

        stallConfigs.forEach(st => {
            const stall = new THREE.Group();
            stall.position.set(st.x, 0, st.z);

            // Meja Kayu
            const table = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 1.6), new THREE.MeshLambertMaterial({ color: 0x795548 }));
            table.position.y = 0.45;
            table.castShadow = true;
            stall.add(table);

            // 4 Tiang
            [-1.6, 1.6].forEach(px => {
                [-0.7, 0.7].forEach(pz => {
                    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.6), new THREE.MeshLambertMaterial({ color: 0x4e342e }));
                    post.position.set(px, 1.3, pz);
                    stall.add(post);
                });
            });

            // Atap Kanopi
            const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.2, 2.2), new THREE.MeshLambertMaterial({ color: st.color }));
            canopy.position.y = 2.6;
            canopy.rotation.x = 0.15;
            stall.add(canopy);

            marketGroup.add(stall);
            this.addBoxCollider(marketGroup.position.x + st.x - 2, marketGroup.position.x + st.x + 2, marketGroup.position.z - 1.2, marketGroup.position.z + 1.2, st.name);
        });

        this.scene.add(marketGroup);

        this.registerInteractable({
            id: 'market_stall',
            type: 'market',
            name: 'Pasar Rakyat Kebun Pintar',
            actionText: 'Jual & Beli di Pasar',
            position: { x: -36, z: 36 },
            radius: 3.5
        });
    }

    // ========================================================================
    // 11. AREA FESTIVAL & KINCIR ANGIN RAKSASA
    // ========================================================================
    buildFestivalAndWindmillZone() {
        const festivalGroup = new THREE.Group();
        festivalGroup.position.set(-52, 0, 56);

        // Panggung Festival Kayu
        const stage = new THREE.Mesh(new THREE.BoxGeometry(10.0, 0.6, 8.0), new THREE.MeshLambertMaterial({ color: 0x8d6e63 }));
        stage.position.y = 0.3;
        stage.castShadow = true;
        stage.receiveShadow = true;
        festivalGroup.add(stage);

        // Tiang Bendera Karnaval
        const flagColors = [0xe91e63, 0xffeb3b, 0x00e676, 0x00e5ff];
        for (let i = 0; i < 4; i++) {
            const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 5.5), new THREE.MeshLambertMaterial({ color: 0x424242 }));
            flagPole.position.set(-4.5 + i * 3.0, 2.75, 4.0);
            festivalGroup.add(flagPole);

            const pennant = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.2, 3), new THREE.MeshBasicMaterial({ color: flagColors[i] }));
            pennant.position.set(-4.5 + i * 3.0, 5.0, 4.0);
            pennant.rotation.z = Math.PI / 2;
            festivalGroup.add(pennant);
        }

        // Kincir Angin Belanda Raksasa (Windmill)
        const windmillTower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 4.0, 11.0, 12), new THREE.MeshLambertMaterial({ color: 0xeeeeee }));
        windmillTower.position.set(8.0, 5.5, -4.0);
        windmillTower.castShadow = true;
        festivalGroup.add(windmillTower);

        const cap = new THREE.Mesh(new THREE.ConeGeometry(3.0, 2.8, 12), new THREE.MeshLambertMaterial({ color: 0x3e2723 }));
        cap.position.set(8.0, 12.0, -4.0);
        festivalGroup.add(cap);

        // Baling-Baling Kincir Berputar
        this.windmillBlades = new THREE.Group();
        this.windmillBlades.position.set(8.0, 10.0, -1.2);

        const bladeWoodMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const sailMat = new THREE.MeshLambertMaterial({ color: 0xfff9c4 });

        for (let i = 0; i < 4; i++) {
            const arm = new THREE.Group();
            arm.rotation.z = (i * Math.PI) / 2;

            const spar = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.4, 0.15), bladeWoodMat);
            spar.position.y = 3.2;
            arm.add(spar);

            const sail = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 4.6), sailMat);
            sail.position.set(0.8, 3.8, 0.02);
            arm.add(sail);

            this.windmillBlades.add(arm);
        }

        festivalGroup.add(this.windmillBlades);
        this.scene.add(festivalGroup);

        this.addBoxCollider(-57, -47, 52, 60, 'panggung_festival');
        this.addCircleCollider(-44, 52, 3.8, 'kincir_angin');

        this.registerInteractable({
            id: 'festival_stage',
            type: 'festival',
            name: 'Panggung Festival Hasil Tani',
            actionText: 'Lihat Info Acara Festival',
            position: { x: -52, z: 56 },
            radius: 3.5
        });
    }

    // ========================================================================
    // 12. HUTAN LINDUNG (FOREST ZONE)
    // ========================================================================
    buildForestZone() {
        const forestTrees = [
            { x: -62, z: -55, pine: true },
            { x: -54, z: -62, pine: false },
            { x: -66, z: -42, pine: true },
            { x: -50, z: -50, pine: false },
            { x: -58, z: -66, pine: true },
            { x: -44, z: -60, pine: false },
            { x: -68, z: -60, pine: true }
        ];

        forestTrees.forEach(t => {
            this.createTree(t.x, t.z, t.pine);
            this.addCircleCollider(t.x, t.z, 1.1, 'pohon_hutan');
        });

        // Bebatuan Besar di Hutan
        const rockMat = new THREE.MeshLambertMaterial({ color: 0x616161 });
        [-58, -48].forEach((rx, idx) => {
            const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6 + idx * 0.4, 0), rockMat);
            rock.position.set(rx, 0.8, -46);
            rock.castShadow = true;
            this.scene.add(rock);
            this.addCircleCollider(rx, -46, 1.8, 'batu_hutan');
        });
    }

    // Helper Pembuatan Pohon 3D
    createTree(x, z, isPine = false) {
        const tree = new THREE.Group();
        tree.position.set(x, 0, z);

        const trunkMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 2.8, 8), trunkMat);
        trunk.position.y = 1.4;
        trunk.castShadow = true;
        tree.add(trunk);

        if (isPine) {
            const pineMat = new THREE.MeshLambertMaterial({ color: 0x1b5e20 });
            [
                { r: 2.2, h: 2.5, y: 3.2 },
                { r: 1.7, h: 2.2, y: 4.8 },
                { r: 1.1, h: 1.8, y: 6.2 }
            ].forEach(layer => {
                const cone = new THREE.Mesh(new THREE.ConeGeometry(layer.r, layer.h, 7), pineMat);
                cone.position.y = layer.y;
                cone.castShadow = true;
                tree.add(cone);
            });
        } else {
            const foliageMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
            const foliage = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4, 1), foliageMat);
            foliage.position.y = 3.6;
            foliage.castShadow = true;
            tree.add(foliage);
        }

        this.scene.add(tree);
    }

    // Helper Pembuatan Lentera Jalan
    createStreetLamp(x, z, parentGroup = null) {
        const lampGroup = new THREE.Group();
        lampGroup.position.set(x, 0, z);

        const postMat = new THREE.MeshLambertMaterial({ color: 0x37474f });
        const bulbMat = new THREE.MeshStandardMaterial({ color: 0xffecb3, emissive: 0xffb74d, emissiveIntensity: 0.0 });

        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.2, 6), postMat);
        post.position.y = 1.6;
        lampGroup.add(post);

        const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), bulbMat);
        bulb.position.y = 3.3;
        lampGroup.add(bulb);

        const light = new THREE.PointLight(0xffb74d, 0, 16);
        light.position.set(0, 3.3, 0);
        lampGroup.add(light);

        this.nightLamps.push({ bulb, light });

        if (parentGroup) {
            parentGroup.add(lampGroup);
        } else {
            this.scene.add(lampGroup);
        }
    }

    // Daftarkan objek yang dapat diinteraksikan pemain [E]
    registerInteractable(item) {
        this.interactables.push(item);
    }

    // Cari objek interaksi terdekat dari posisi pemain
    getClosestInteractable(playerPos, maxDist = 3.2) {
        let closest = null;
        let minDist = maxDist;

        for (const item of this.interactables) {
            const dist = Math.hypot(playerPos.x - item.position.x, playerPos.z - item.position.z);
            if (dist < minDist) {
                minDist = dist;
                closest = item;
            }
        }

        return closest;
    }

    // ========================================================================
    // TAHAP PERTUMBUHAN TANAMAN 6 FASE (SEED -> HARVEST)
    // ========================================================================
    updatePlotVisual(plot) {
        if (!plot || !plot.cropGroup) return;

        // Bersihkan tanaman lama di dalam grup
        while (plot.cropGroup.children.length > 0) {
            plot.cropGroup.remove(plot.cropGroup.children[0]);
        }

        // Perbarui warna tanah (kering cokelat biasa vs basah cokelat tua pekat)
        if (plot.isWatered) {
            plot.soilMesh.material.color.setHex(0x3e2723); // Gelap basah
        } else {
            plot.soilMesh.material.color.setHex(0x795548); // Kering
        }

        // Jika tanah kosong
        if (!plot.crop || plot.growth <= 0) return;

        const cropDef = window.plantsData ? window.plantsData.crops[plot.crop] : null;
        if (!cropDef) return;

        const g = plot.growth;
        const colors = cropDef.colors || { stem: 0x4caf50, leaf: 0x81c784, fruit: 0xe53935 };

        const stemMat = new THREE.MeshLambertMaterial({ color: colors.stem });
        const leafMat = new THREE.MeshLambertMaterial({ color: colors.leaf });
        const fruitMat = new THREE.MeshLambertMaterial({ color: colors.fruit });

        if (g <= 15) {
            // 1. SEED (Gundukan benih kecil)
            const seed = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), new THREE.MeshLambertMaterial({ color: 0xd7ccc8 }));
            seed.position.y = 0.38;
            plot.cropGroup.add(seed);

        } else if (g <= 35) {
            // 2. SPROUT (Tunas mungil 2 helai)
            const sprout = new THREE.Group();
            sprout.position.y = 0.36;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6), stemMat);
            stem.position.y = 0.15;
            sprout.add(stem);

            const lGeo = new THREE.SphereGeometry(0.1, 6, 6);
            lGeo.scale(1.5, 0.4, 0.8);
            const l1 = new THREE.Mesh(lGeo, leafMat);
            l1.position.set(-0.12, 0.3, 0);
            l1.rotation.z = 0.5;
            sprout.add(l1);
            const l2 = new THREE.Mesh(lGeo, leafMat);
            l2.position.set(0.12, 0.3, 0);
            l2.rotation.z = -0.5;
            sprout.add(l2);

            plot.cropGroup.add(sprout);

        } else if (g <= 55) {
            // 3. SMALL (Batang muda & daun menyebar)
            const smallPlant = new THREE.Group();
            smallPlant.position.y = 0.36;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.6, 6), stemMat);
            stem.position.y = 0.3;
            smallPlant.add(stem);

            for (let i = 0; i < 4; i++) {
                const angle = (i * Math.PI) / 2;
                const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), leafMat);
                leaf.position.set(Math.cos(angle) * 0.22, 0.45, Math.sin(angle) * 0.22);
                leaf.scale.set(1.4, 0.5, 0.8);
                smallPlant.add(leaf);
            }
            plot.cropGroup.add(smallPlant);

        } else if (g <= 75) {
            // 4. MEDIUM (Tajuk rimbun berkembang)
            const medPlant = new THREE.Group();
            medPlant.position.y = 0.36;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.9, 8), stemMat);
            stem.position.y = 0.45;
            medPlant.add(stem);

            const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 1), leafMat);
            bush.position.y = 0.8;
            medPlant.add(bush);

            plot.cropGroup.add(medPlant);

        } else if (g < 100) {
            // 5. MATURE (Bunga & Buah Muda)
            const maturePlant = new THREE.Group();
            maturePlant.position.y = 0.36;
            const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 1.1, 8), stemMat);
            stem.position.y = 0.55;
            maturePlant.add(stem);

            const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.65, 1), leafMat);
            bush.position.y = 0.95;
            maturePlant.add(bush);

            // Bunga kecil mekar
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xfff59d }));
                flower.position.set(Math.cos(angle) * 0.45, 1.1, Math.sin(angle) * 0.45);
                maturePlant.add(flower);
            }

            plot.cropGroup.add(maturePlant);

        } else {
            // 6. HARVEST (100% Matang Siap Panen!)
            const harvestPlant = new THREE.Group();
            harvestPlant.position.y = 0.36;

            // Model komoditas siap panen
            switch (plot.crop) {
                case 'selada': {
                    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), leafMat);
                    bush.position.y = 0.5;
                    harvestPlant.add(bush);
                    break;
                }
                case 'wortel': {
                    const carrotTop = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 1), leafMat);
                    carrotTop.position.y = 0.65;
                    harvestPlant.add(carrotTop);
                    const carrotRoot = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.9, 6), fruitMat);
                    carrotRoot.rotation.x = Math.PI;
                    carrotRoot.position.y = 0.3;
                    harvestPlant.add(carrotRoot);
                    break;
                }
                default: {
                    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 1.2, 8), stemMat);
                    stem.position.y = 0.6;
                    harvestPlant.add(stem);

                    const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.7, 1), leafMat);
                    bush.position.y = 1.0;
                    harvestPlant.add(bush);

                    // Buah matang ranum
                    for (let i = 0; i < 4; i++) {
                        const angle = (i * Math.PI) / 2;
                        const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 8), fruitMat);
                        fruit.position.set(Math.cos(angle) * 0.5, 0.9, Math.sin(angle) * 0.5);
                        harvestPlant.add(fruit);
                    }
                    break;
                }
            }

            // Marker berkilau (sparkle) di atas tanaman siap panen
            const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xffd54f });
            const sparkle = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), sparkleMat);
            sparkle.name = 'sparkleMarker';
            sparkle.position.y = 1.8;
            harvestPlant.add(sparkle);

            plot.cropGroup.add(harvestPlant);
        }
    }

    // ========================================================================
    // PARTIKEL HUJAN & KONTROL CUACA
    // ========================================================================
    setupRainSystem() {
        const particleCount = 1200;
        const rainGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 140;
            positions[i + 1] = Math.random() * 45;
            positions[i + 2] = (Math.random() - 0.5) * 140;
        }

        rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const rainMat = new THREE.PointsMaterial({
            color: 0x90caf9,
            size: 0.28,
            transparent: true,
            opacity: 0.0
        });

        this.rainParticles = new THREE.Points(rainGeo, rainMat);
        this.scene.add(this.rainParticles);
    }

    setWeather(type) {
        this.currentWeather = type;

        if (type === 'hujan') {
            this.scene.background = new THREE.Color(0x546e7a);
            this.scene.fog.color.setHex(0x546e7a);
            this.scene.fog.density = 0.012;
            this.ambientLight.intensity = 0.45;
            this.dirLight.intensity = 0.35;
            this.dirLight.color.setHex(0xb0bec5);
            if (this.rainParticles) this.rainParticles.material.opacity = 0.75;

            // Hujan otomatis menyiram seluruh petak kebun!
            this.plots.forEach(plot => {
                if (plot.crop && !plot.isWatered) {
                    plot.isWatered = true;
                    this.updatePlotVisual(plot);
                }
            });

            this.nightLamps.forEach(l => {
                l.bulb.material.emissiveIntensity = 0.0;
                l.light.intensity = 0;
            });

        } else if (type === 'malam') {
            this.scene.background = new THREE.Color(0x0a192f);
            this.scene.fog.color.setHex(0x0a192f);
            this.scene.fog.density = 0.009;
            this.ambientLight.intensity = 0.25;
            this.dirLight.intensity = 0.15;
            this.dirLight.color.setHex(0x3949ab);
            if (this.rainParticles) this.rainParticles.material.opacity = 0.0;

            // Lentera menyala terang
            this.nightLamps.forEach(l => {
                l.bulb.material.emissiveIntensity = 1.0;
                l.light.intensity = 1.2;
            });

        } else {
            // Cerah Siang
            this.scene.background = new THREE.Color(0x81d4fa);
            this.scene.fog.color.setHex(0x81d4fa);
            this.scene.fog.density = 0.007;
            this.ambientLight.intensity = 0.65;
            this.dirLight.intensity = 0.95;
            this.dirLight.color.setHex(0xfffaed);
            if (this.rainParticles) this.rainParticles.material.opacity = 0.0;

            this.nightLamps.forEach(l => {
                l.bulb.material.emissiveIntensity = 0.0;
                l.light.intensity = 0;
            });
        }
    }

    // ========================================================================
    // MINIMAP 2D REAL-TIME (Menampilkan 11 Zona & Posisi Pemain + Ternak)
    // ========================================================================
    initMinimap() {
        this.minimapCanvas = document.getElementById('minimapCanvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
        }
    }

    renderMinimap() {
        if (!this.minimapCtx || !this.minimapCanvas) return;
        const ctx = this.minimapCtx;
        const w = this.minimapCanvas.width;
        const h = this.minimapCanvas.height;

        // Transformasi koordinat dunia [-75, 75] ke canvas [0, w]
        const toMapX = (wx) => ((wx + 75) / 150) * w;
        const toMapY = (wz) => ((wz + 75) / 150) * h;

        // 1. Dasar Rumput Hijau
        ctx.fillStyle = '#4caf50';
        ctx.fillRect(0, 0, w, h);

        // 2. Garis Sungai Biru & Jembatan Cokelat
        ctx.fillStyle = '#0288d1';
        ctx.fillRect(toMapX(-2.5), 0, (7 / 150) * w, h);

        ctx.fillStyle = '#795548';
        ctx.fillRect(toMapX(-3.5), toMapY(-3), (9 / 150) * w, (6 / 150) * h);

        // 3. Area Kebun (Kuning Kecokelatan)
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(toMapX(14), toMapY(-34), (22 / 150) * w, (20 / 150) * h);

        // Petak Tanah Kebun
        this.plots.forEach(plot => {
            if (plot.harvestReady) {
                ctx.fillStyle = '#ffd54f'; // Siap panen berkilau kuning
            } else if (plot.crop) {
                ctx.fillStyle = '#2e7d32'; // Tanaman hijau
            } else {
                ctx.fillStyle = plot.isWatered ? '#3e2723' : '#a1887f';
            }
            ctx.fillRect(toMapX(plot.position.x - 1.2), toMapY(plot.position.z - 1.2), 4, 4);
        });

        // 4. Area Peternakan (Pasture Hijau Muda Berpagar)
        ctx.fillStyle = '#81c784';
        ctx.fillRect(toMapX(18), toMapY(14), (40 / 150) * w, (34 / 150) * h);
        ctx.strokeStyle = '#4e342e';
        ctx.strokeRect(toMapX(18), toMapY(14), (40 / 150) * w, (34 / 150) * h);

        // 5. Titik Hewan Ternak
        if (window.animalManager && window.animalManager.animals) {
            window.animalManager.animals.forEach(a => {
                ctx.fillStyle = a.type === 'sapi' ? '#ffffff' : (a.type === 'ayam' ? '#ff1744' : '#ffea00');
                ctx.beginPath();
                ctx.arc(toMapX(a.position.x), toMapY(a.position.z), 2.5, 0, Math.PI * 2);
                ctx.fill();
            });
        }

        // 6. Bangunan Utama (Ikon Kotak Berwarna)
        // Rumah Pemain (Biru Tua)
        ctx.fillStyle = '#1565c0';
        ctx.fillRect(toMapX(19), toMapY(-56), 6, 6);

        // Gudang (Cokelat Tua)
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(toMapX(37), toMapY(-56), 6, 6);

        // Toko Desa (Ungu)
        ctx.fillStyle = '#6a1b9a';
        ctx.fillRect(toMapX(-39), toMapY(-28), 6, 6);

        // Alun-Alun & Panggung Festival (Oranye)
        ctx.fillStyle = '#e65100';
        ctx.fillRect(toMapX(-55), toMapY(53), 7, 7);

        // 7. Posisi & Arah Hadap Pemain (Panah Merah Menyala)
        if (window.playerController) {
            const px = toMapX(window.playerController.position.x);
            const py = toMapY(window.playerController.position.z);
            const rot = window.playerController.mesh ? window.playerController.mesh.rotation.y : 0;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(-rot);

            ctx.fillStyle = '#ff1744';
            ctx.beginPath();
            ctx.moveTo(0, -6);
            ctx.lineTo(4, 4);
            ctx.lineTo(-4, 4);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
        }
    }

    // ========================================================================
    // GAME LOOP UTAMA (requestAnimationFrame)
    // ========================================================================
    start() {
        if (!this.isInitialized) {
            this.init();
        }
        if (!this.isRunning) {
            this.isRunning = true;
            this.clock.start();
            this.animate();
        }
    }

    stop() {
        this.isRunning = false;
        if (this.animFrameId) {
            cancelAnimationFrame(this.animFrameId);
            this.animFrameId = null;
        }
    }

    animate() {
        if (!this.isRunning) return;
        this.animFrameId = requestAnimationFrame(() => this.animate());

        const deltaTime = Math.min(this.clock.getDelta(), 0.1);

        // 1. Update Pemain & Kamera Orbit
        if (window.playerController) {
            window.playerController.update(deltaTime, this);
        }

        // 2. Update Hewan Peternakan & NPC Dunia
        if (window.animalManager) {
            window.animalManager.update(deltaTime);
        }
        if (window.npcManager) {
            const playerPos = window.playerController ? window.playerController.position : null;
            window.npcManager.update(deltaTime, playerPos, this);
        }

        // 3. Putar Baling-Baling Kincir Angin
        if (this.windmillBlades) {
            this.windmillBlades.rotation.z += 0.75 * deltaTime;
        }

        // 4. Partikel Hujan
        if (this.currentWeather === 'hujan' && this.rainParticles) {
            const positions = this.rainParticles.geometry.attributes.position.array;
            for (let i = 1; i < positions.length; i += 3) {
                positions[i] -= 38 * deltaTime;
                if (positions[i] < 0) {
                    positions[i] = 45;
                }
            }
            this.rainParticles.geometry.attributes.position.needsUpdate = true;
        }

        // 5. Update Laju Pertumbuhan Tanaman
        this.updateCropGrowths(deltaTime);

        // 6. Animasi Marker Siap Panen
        const time = this.clock.getElapsedTime();
        this.plots.forEach(plot => {
            if (plot.harvestReady && plot.cropGroup) {
                const sp = plot.cropGroup.getObjectByName('sparkleMarker');
                if (sp) {
                    sp.rotation.y = time * 3.5;
                    sp.position.y = 1.8 + Math.sin(time * 5) * 0.12;
                }
            }
        });

        // 7. Render Three.js & Minimap
        this.renderer.render(this.scene, this.camera);
        this.renderMinimap();
    }

    // Perhitungan Waktu Tumbuh Tanaman
    updateCropGrowths(deltaTime) {
        let stateChanged = false;

        this.plots.forEach(plot => {
            if (plot.crop && plot.growth < 100) {
                const cropDef = window.plantsData ? window.plantsData.crops[plot.crop] : null;
                if (!cropDef) return;

                // Tanaman yang disiram tumbuh 2.2x lebih cepat
                const speedMultiplier = plot.isWatered ? 1.0 : 0.4;
                const growthRate = (100 / cropDef.growTime) * speedMultiplier;
                const oldGrowth = plot.growth;

                plot.growth = Math.min(100, plot.growth + growthRate * deltaTime);

                // Cek peralihan tahap visual (6 tahap: 15%, 35%, 55%, 75%, 100%)
                const oldStage = Math.floor(oldGrowth / 20);
                const newStage = Math.floor(plot.growth / 20);

                if (oldStage !== newStage || (plot.growth >= 100 && !plot.harvestReady)) {
                    if (plot.growth >= 100) {
                        plot.harvestReady = true;
                    }
                    this.updatePlotVisual(plot);
                    stateChanged = true;
                }
            }
        });

        if (stateChanged && window.appState) {
            window.appState.onPlotGrowthUpdated();
        }
    }

    onWindowResize() {
        if (!this.container || !this.camera || !this.renderer) return;
        const w = this.container.clientWidth || window.innerWidth;
        const h = this.container.clientHeight || window.innerHeight;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }
}

// Inisialisasi Instance Global
window.world3d = new World3D();
window.toggleWeather = function(type) {
    if (window.world3d) {
        window.world3d.setWeather(type);
        if (window.appState) window.appState.weather = type;
        if (window.appAudio) window.appAudio.play('click');
    }
};
