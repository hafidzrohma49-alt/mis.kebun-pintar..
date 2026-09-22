/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/animals.js
 * Deskripsi: Sistem Peternakan 3D Hidup (Ayam, Sapi, Kambing, Bebek).
 * Mencakup pembuatan model 3D Three.js prosedural, AI perilaku, status dinamis (❤️🍽️💧😊),
 * sistem pakan [E], air minum [E], elus [E], dan panen produk hewani (telur, susu, wol, bulu).
 */

class Animal {
    constructor(config) {
        this.id = config.id;
        this.type = config.type; // 'ayam' | 'sapi' | 'kambing' | 'bebek'
        this.speciesName = config.speciesName || config.type.toUpperCase(); // Nama jenis hewan (bukan nama individu)
        this.emoji = config.emoji || '🐾';
        
        // Status angka 0 - 100 yang dinamis & berfungsi nyata
        this.health = config.health !== undefined ? config.health : 95;
        this.hunger = config.hunger !== undefined ? config.hunger : 75;     // Kenyang (0 = kelaparan, 100 = kenyang penuh)
        this.thirst = config.thirst !== undefined ? config.thirst : 80;     // Air (0 = dehidrasi, 100 = segar)
        this.happiness = config.happiness !== undefined ? config.happiness : 85; // Kebahagiaan (0 = stres, 100 = ceria)

        // Status produksi produk hewani
        this.hasProduct = config.hasProduct || false;
        this.productTimer = config.productTimer || Math.random() * 20 + 15;
        this.productInterval = config.productInterval || 35; // detik siklus produksi

        // Posisi & Perilaku 3D
        this.position = { x: config.x || 0, y: 0, z: config.z || 0 };
        this.rotation = Math.random() * Math.PI * 2;
        this.targetRotation = this.rotation;
        this.speed = config.speed || 1.4;
        this.radius = config.radius || 0.8;

        // State Machine AI
        this.state = 'idle'; // 'idle' | 'walking' | 'eating' | 'drinking'
        this.stateTimer = Math.random() * 3 + 2;
        this.walkCycle = 0;

        // Referensi mesh & anggota tubuh
        this.mesh = null;
        this.limbs = {};
        this.bubbleIcon = null;

        // Batas padang rumput peternakan (pasture fence boundaries)
        this.bounds = config.bounds || { minX: 18, maxX: 48, minZ: 14, maxZ: 44 };
    }

    // Bangun Model 3D Prosedural Berdasarkan Jenis Hewan
    createMesh() {
        const group = new THREE.Group();
        group.name = `Animal_${this.id}`;
        group.position.set(this.position.x, 0, this.position.z);
        group.rotation.y = this.rotation;

        switch (this.type) {
            case 'sapi':
                this.buildCowMesh(group);
                break;
            case 'ayam':
                this.buildChickenMesh(group);
                break;
            case 'kambing':
                this.buildGoatMesh(group);
                break;
            case 'bebek':
                this.buildDuckMesh(group);
                break;
            default:
                this.buildCowMesh(group);
        }

        // Indikator Produk Siap Panen (Mengambang di atas kepala)
        const bubbleGroup = new THREE.Group();
        bubbleGroup.position.y = this.type === 'sapi' ? 2.4 : (this.type === 'kambing' ? 2.0 : 1.4);
        bubbleGroup.visible = this.hasProduct;

        // Lingkaran balon putih
        const bubbleGeo = new THREE.SphereGeometry(0.28, 12, 12);
        const bubbleMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubbleGroup.add(bubble);

        // Inti bersinar warna produk
        const innerGeo = new THREE.SphereGeometry(0.22, 12, 12);
        let innerColor = 0xffeb3b;
        if (this.type === 'sapi') innerColor = 0xe0f7fa;
        else if (this.type === 'kambing') innerColor = 0xf5f5f5;
        else if (this.type === 'bebek') innerColor = 0xffcc80;
        const innerMat = new THREE.MeshBasicMaterial({ color: innerColor });
        const innerSphere = new THREE.Mesh(innerGeo, innerMat);
        bubbleGroup.add(innerSphere);

        this.bubbleIcon = bubbleGroup;
        group.add(bubbleGroup);

        this.mesh = group;
        return group;
    }

    // Model 3D SAPI (Holstein Friesian Hitam-Putih)
    buildCowMesh(group) {
        this.radius = 1.2;
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
        const blackMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
        const pinkMat = new THREE.MeshLambertMaterial({ color: 0xf8bbd0 });
        const hornMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });
        const hoofMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });

        // Badan Besar
        const bodyGeo = new THREE.BoxGeometry(1.4, 1.2, 2.2);
        const body = new THREE.Mesh(bodyGeo, whiteMat);
        body.position.y = 1.3;
        body.castShadow = true;
        group.add(body);

        // Belang Hitam Sapi
        const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.7, 0.9), blackMat);
        spot1.position.set(0.35, 1.4, 0.2);
        group.add(spot1);

        const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.6, 0.7), blackMat);
        spot2.position.set(-0.38, 1.25, -0.4);
        group.add(spot2);

        // Kepala Sapi
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.6, 1.2);
        this.limbs.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.8, 0.9), whiteMat);
        head.position.set(0, 0, 0);
        head.castShadow = true;
        headGroup.add(head);

        // Moncong / Muzzle Pink
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.4, 0.45), pinkMat);
        muzzle.position.set(0, -0.2, 0.55);
        headGroup.add(muzzle);

        // Lubang Hidung
        const nostrilMat = new THREE.MeshBasicMaterial({ color: 0x424242 });
        const nL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), nostrilMat);
        nL.position.set(-0.18, -0.15, 0.78);
        headGroup.add(nL);
        const nR = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.08, 0.05), nostrilMat);
        nR.position.set(0.18, -0.15, 0.78);
        headGroup.add(nR);

        // Tanduk
        const hornGeo = new THREE.ConeGeometry(0.08, 0.35, 6);
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(-0.35, 0.45, -0.1);
        hornL.rotation.z = 0.35;
        hornL.rotation.x = -0.2;
        headGroup.add(hornL);
        const hornR = new THREE.Mesh(hornGeo, hornMat);
        hornR.position.set(0.35, 0.45, -0.1);
        hornR.rotation.z = -0.35;
        hornR.rotation.x = -0.2;
        headGroup.add(hornR);

        // Telinga
        const earGeo = new THREE.BoxGeometry(0.35, 0.15, 0.15);
        const earL = new THREE.Mesh(earGeo, whiteMat);
        earL.position.set(-0.48, 0.15, -0.15);
        earL.rotation.z = -0.25;
        headGroup.add(earL);
        const earR = new THREE.Mesh(earGeo, blackMat);
        earR.position.set(0.48, 0.15, -0.15);
        earR.rotation.z = 0.25;
        headGroup.add(earR);

        // Mata Hitam
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        eyeL.position.set(-0.39, 0.15, 0.25);
        headGroup.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        eyeR.position.set(0.39, 0.15, 0.25);
        headGroup.add(eyeR);

        group.add(headGroup);

        // Ambing Susu (Udder Pink)
        const udder = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.35, 0.65), pinkMat);
        udder.position.set(0, 0.65, -0.3);
        group.add(udder);

        // 4 Kaki Sapi dengan Animasi Berjalan
        const legGeo = new THREE.BoxGeometry(0.32, 0.75, 0.32);
        this.limbs.legs = [];

        const legPos = [
            { x: -0.45, z: 0.75 },  // Depan Kiri
            { x: 0.45, z: 0.75 },   // Depan Kanan
            { x: -0.45, z: -0.75 }, // Belakang Kiri
            { x: 0.45, z: -0.75 }   // Belakang Kanan
        ];

        legPos.forEach((p, idx) => {
            const legGroup = new THREE.Group();
            legGroup.position.set(p.x, 0.75, p.z);

            const leg = new THREE.Mesh(legGeo, whiteMat);
            leg.position.y = -0.375;
            leg.castShadow = true;
            legGroup.add(leg);

            // Kuku Hitam
            const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.15, 0.34), hoofMat);
            hoof.position.y = -0.68;
            legGroup.add(hoof);

            group.add(legGroup);
            this.limbs.legs.push(legGroup);
        });

        // Ekor
        const tailGroup = new THREE.Group();
        tailGroup.position.set(0, 1.7, -1.1);
        const tailMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.8), whiteMat);
        tailMesh.position.y = -0.4;
        tailGroup.add(tailMesh);
        const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 6), blackMat);
        tuft.position.y = -0.8;
        tailGroup.add(tuft);
        group.add(tailGroup);
        this.limbs.tail = tailGroup;
    }

    // Model 3D AYAM (Ayam Kampung Putih Berjengger Merah)
    buildChickenMesh(group) {
        this.radius = 0.55;
        const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const redMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f });
        const yellowMat = new THREE.MeshLambertMaterial({ color: 0xfbc02d });
        const beakMat = new THREE.MeshLambertMaterial({ color: 0xff9800 });

        // Badan Oval
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.5, 0.7), whiteMat);
        body.position.y = 0.55;
        body.castShadow = true;
        group.add(body);

        // Kepala & Leher
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.8, 0.3);
        this.limbs.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.35, 0.35), whiteMat);
        head.position.set(0, 0, 0);
        headGroup.add(head);

        // Paruh Kuning Segitiga
        const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.22, 4), beakMat);
        beak.rotation.x = Math.PI / 2;
        beak.position.set(0, -0.05, 0.26);
        headGroup.add(beak);

        // Jengger Merah (Comb) di Atas Kepala
        const comb = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.2, 0.32), redMat);
        comb.position.set(0, 0.22, -0.02);
        headGroup.add(comb);

        // Pial Merah (Wattle) di Bawah Paruh
        const wattle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.12), redMat);
        wattle.position.set(0, -0.18, 0.14);
        headGroup.add(wattle);

        // Mata Kecil
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
        eyeL.position.set(-0.16, 0.05, 0.08);
        headGroup.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
        eyeR.position.set(0.16, 0.05, 0.08);
        headGroup.add(eyeR);

        group.add(headGroup);

        // Sayap Kiri & Kanan
        this.limbs.wings = [];
        const wingGeo = new THREE.BoxGeometry(0.08, 0.35, 0.5);
        const wingL = new THREE.Mesh(wingGeo, whiteMat);
        wingL.position.set(-0.31, 0.55, 0.02);
        group.add(wingL);
        this.limbs.wings.push(wingL);

        const wingR = new THREE.Mesh(wingGeo, whiteMat);
        wingR.position.set(0.31, 0.55, 0.02);
        group.add(wingR);
        this.limbs.wings.push(wingR);

        // Ekor Ayam Mencuat ke Atas
        const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.35, 0.12), whiteMat);
        tail.position.set(0, 0.75, -0.4);
        tail.rotation.x = -0.4;
        group.add(tail);

        // 2 Kaki Kuning
        this.limbs.legs = [];
        const legGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.35);
        const legL = new THREE.Mesh(legGeo, yellowMat);
        legL.position.set(-0.15, 0.18, 0.02);
        group.add(legL);
        this.limbs.legs.push(legL);

        const legR = new THREE.Mesh(legGeo, yellowMat);
        legR.position.set(0.15, 0.18, 0.02);
        group.add(legR);
        this.limbs.legs.push(legR);
    }

    // Model 3D KAMBING (Kambing Bertanduk Melengkung & Janggut)
    buildGoatMesh(group) {
        this.radius = 0.95;
        const creamMat = new THREE.MeshLambertMaterial({ color: 0xefebe9 });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
        const hornMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
        const hoofMat = new THREE.MeshLambertMaterial({ color: 0x2d1f1c });

        // Badan Kambing
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.85, 1.5), creamMat);
        body.position.y = 0.95;
        body.castShadow = true;
        group.add(body);

        // Kepala Kambing
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.25, 0.8);
        this.limbs.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.65), creamMat);
        headGroup.add(head);

        // Moncong Cokelat
        const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.3, 0.35), darkMat);
        muzzle.position.set(0, -0.15, 0.4);
        headGroup.add(muzzle);

        // Janggut Kambing (Beard)
        const beard = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.25, 4), creamMat);
        beard.position.set(0, -0.38, 0.4);
        beard.rotation.x = -0.2;
        headGroup.add(beard);

        // Tanduk Melengkung ke Belakang
        const hornGeo = new THREE.ConeGeometry(0.06, 0.4, 6);
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(-0.2, 0.35, -0.1);
        hornL.rotation.x = -0.55;
        hornL.rotation.z = 0.15;
        headGroup.add(hornL);

        const hornR = new THREE.Mesh(hornGeo, hornMat);
        hornR.position.set(0.2, 0.35, -0.1);
        hornR.rotation.x = -0.55;
        hornR.rotation.z = -0.15;
        headGroup.add(hornR);

        // Telinga Terkulai Miring
        const earGeo = new THREE.BoxGeometry(0.3, 0.12, 0.1);
        const earL = new THREE.Mesh(earGeo, creamMat);
        earL.position.set(-0.35, 0.1, -0.1);
        earL.rotation.z = -0.4;
        headGroup.add(earL);
        const earR = new THREE.Mesh(earGeo, creamMat);
        earR.position.set(0.35, 0.1, -0.1);
        earR.rotation.z = 0.4;
        headGroup.add(earR);

        group.add(headGroup);

        // 4 Kaki Ramping
        this.limbs.legs = [];
        const legGeo = new THREE.BoxGeometry(0.2, 0.55, 0.2);
        const legPos = [
            { x: -0.3, z: 0.5 },
            { x: 0.3, z: 0.5 },
            { x: -0.3, z: -0.5 },
            { x: 0.3, z: -0.5 }
        ];

        legPos.forEach(p => {
            const legGroup = new THREE.Group();
            legGroup.position.set(p.x, 0.55, p.z);
            const leg = new THREE.Mesh(legGeo, creamMat);
            leg.position.y = -0.275;
            legGroup.add(leg);

            const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.1, 0.22), hoofMat);
            hoof.position.y = -0.5;
            legGroup.add(hoof);

            group.add(legGroup);
            this.limbs.legs.push(legGroup);
        });

        // Ekor Kecil
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 4), creamMat);
        tail.position.set(0, 1.1, -0.8);
        tail.rotation.x = 0.6;
        group.add(tail);
        this.limbs.tail = tail;
    }

    // Model 3D BEBEK (Bebek Berparuh Oranye Lebar)
    buildDuckMesh(group) {
        this.radius = 0.6;
        const duckBodyMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const duckHeadMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 }); // Kepala hijau khas itik/mallard
        const orangeMat = new THREE.MeshLambertMaterial({ color: 0xff6f00 });

        // Badan Gemuk
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.8), duckBodyMat);
        body.position.y = 0.45;
        body.castShadow = true;
        group.add(body);

        // Kepala Bebek
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 0.72, 0.35);
        this.limbs.head = headGroup;

        const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), duckHeadMat);
        headGroup.add(head);

        // Paruh Bebek Lebar & Pipih (Oranye Khas)
        const bill = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.1, 0.3), orangeMat);
        bill.position.set(0, -0.08, 0.28);
        headGroup.add(bill);

        // Mata Bebek
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
        eyeL.position.set(-0.18, 0.08, 0.08);
        headGroup.add(eyeL);
        const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 6), eyeMat);
        eyeR.position.set(0.18, 0.08, 0.08);
        headGroup.add(eyeR);

        group.add(headGroup);

        // Ekor Meruncing ke Belakang
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.28, 4), duckBodyMat);
        tail.position.set(0, 0.58, -0.48);
        tail.rotation.x = -1.1;
        group.add(tail);

        // Kaki Bebek Berselaput
        this.limbs.legs = [];
        const legGeo = new THREE.BoxGeometry(0.15, 0.22, 0.22);
        const legL = new THREE.Mesh(legGeo, orangeMat);
        legL.position.set(-0.18, 0.12, 0.05);
        group.add(legL);
        this.limbs.legs.push(legL);

        const legR = new THREE.Mesh(legGeo, orangeMat);
        legR.position.set(0.18, 0.12, 0.05);
        group.add(legR);
        this.limbs.legs.push(legR);
    }

    // Aksi: Pemain Memberi Pakan [E]
    feed(feedItemKey = null) {
        const oldHunger = this.hunger;
        this.hunger = Math.min(100, this.hunger + 40);
        this.happiness = Math.min(100, this.happiness + 15);
        this.state = 'eating';
        this.stateTimer = 3.5;

        // Suara & Animasi makan
        if (this.limbs.head) {
            this.limbs.head.rotation.x = 0.45; // Menunduk makan
        }

        return {
            speciesName: this.speciesName,
            oldHunger,
            newHunger: this.hunger,
            happiness: this.happiness
        };
    }

    // Aksi: Pemain Memberi Air Minum [E]
    giveWater() {
        const oldThirst = this.thirst;
        this.thirst = Math.min(100, this.thirst + 45);
        this.happiness = Math.min(100, this.happiness + 10);
        this.state = 'drinking';
        this.stateTimer = 3.0;

        if (this.limbs.head) {
            this.limbs.head.rotation.x = 0.5; // Menunduk minum
        }

        return {
            speciesName: this.speciesName,
            oldThirst,
            newThirst: this.thirst,
            happiness: this.happiness
        };
    }

    // Aksi: Pemain Mengelus / Menyapa Hewan [E]
    pet() {
        this.happiness = Math.min(100, this.happiness + 12);
        this.stateTimer += 1.5;
        // Lonjak ceria kecil
        if (this.mesh) {
            this.mesh.position.y = 0.25;
            setTimeout(() => {
                if (this.mesh) this.mesh.position.y = 0;
            }, 250);
        }
    }

    // Aksi: Panen Produk Hewani (Telur, Susu, Wol, Bulu) [E]
    harvestProduct() {
        if (!this.hasProduct) return null;

        this.hasProduct = false;
        this.productTimer = this.productInterval;
        if (this.bubbleIcon) this.bubbleIcon.visible = false;

        let productId = 'telur_ayam';
        if (this.type === 'sapi') productId = 'susu_sapi';
        else if (this.type === 'kambing') productId = 'wol_kambing';
        else if (this.type === 'bebek') productId = 'telur_bebek';

        return productId;
    }

    // Update AI & Fisika Setiap Frame
    update(deltaTime) {
        if (!this.mesh) return;

        // 1. Peluruhan Status Seiring Berjalannya Waktu Permainan
        // Lapar & haus berkurang bertahap
        this.hunger = Math.max(0, this.hunger - (deltaTime * 0.45));
        this.thirst = Math.max(0, this.thirst - (deltaTime * 0.55));

        // Jika sangat lapar atau dehidrasi, kesehatan & kebahagiaan menurun
        if (this.hunger < 25 || this.thirst < 25) {
            this.health = Math.max(10, this.health - (deltaTime * 0.3));
            this.happiness = Math.max(10, this.happiness - (deltaTime * 0.5));
        } else if (this.hunger > 60 && this.thirst > 60) {
            // Pemulihan bertahap saat terpenuhi dengan baik
            this.health = Math.min(100, this.health + (deltaTime * 0.15));
        }

        // 2. Siklus Produksi Produk Hewani
        if (!this.hasProduct) {
            this.productTimer -= deltaTime;
            // Hewan hanya berproduksi jika kondisi kenyang & airnya mencukupi (> 35)
            if (this.productTimer <= 0 && this.hunger >= 35 && this.thirst >= 35) {
                this.hasProduct = true;
                if (this.bubbleIcon) this.bubbleIcon.visible = true;
            }
        } else if (this.bubbleIcon) {
            // Animasi balon produk melayang & berputar lembut
            this.bubbleIcon.rotation.y += deltaTime * 2.5;
            this.bubbleIcon.position.y = (this.type === 'sapi' ? 2.4 : 1.6) + Math.sin(Date.now() * 0.005) * 0.08;
        }

        // 3. AI State Machine (Wandering / Idle / Eating / Drinking)
        this.stateTimer -= deltaTime;
        if (this.stateTimer <= 0) {
            // Ganti perilaku acak
            const roll = Math.random();
            if (roll < 0.45) {
                // Berjalan santai
                this.state = 'walking';
                this.stateTimer = Math.random() * 4 + 2;
                this.targetRotation = Math.random() * Math.PI * 2;
            } else {
                // Berdiri santai / menoleh
                this.state = 'idle';
                this.stateTimer = Math.random() * 3.5 + 2;
            }

            if (this.limbs.head) {
                this.limbs.head.rotation.x = 0;
            }
        }

        // 4. Eksekusi Gerakan Sesuai State
        if (this.state === 'walking') {
            // Rotasi halus menuju arah sasaran
            let diff = this.targetRotation - this.rotation;
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            this.rotation += diff * deltaTime * 3.5;
            this.mesh.rotation.y = this.rotation;

            // Maju searah hadap
            const moveSpeed = this.speed * deltaTime;
            const newX = this.position.x + Math.sin(this.rotation) * moveSpeed;
            const newZ = this.position.z + Math.cos(this.rotation) * moveSpeed;

            // Batasi tetap di dalam padang rumput peternakan (Pasture)
            if (newX >= this.bounds.minX && newX <= this.bounds.maxX &&
                newZ >= this.bounds.minZ && newZ <= this.bounds.maxZ) {
                this.position.x = newX;
                this.position.z = newZ;
            } else {
                // Pantulkan arah jika menabrak pagar pasture
                this.targetRotation += Math.PI;
                this.stateTimer = 1.0;
            }

            this.mesh.position.x = this.position.x;
            this.mesh.position.z = this.position.z;

            // Animasi kaki melangkah
            this.walkCycle += deltaTime * (this.speed * 4.5);
            if (this.limbs.legs) {
                this.limbs.legs.forEach((leg, idx) => {
                    const phase = (idx % 2 === 0) ? 1 : -1;
                    leg.rotation.x = Math.sin(this.walkCycle) * 0.45 * phase;
                });
            }

            // Animasi goyang sayap untuk unggas
            if (this.limbs.wings) {
                this.limbs.wings.forEach((wing, idx) => {
                    const phase = (idx === 0) ? -1 : 1;
                    wing.rotation.z = Math.sin(this.walkCycle * 1.5) * 0.2 * phase;
                });
            }

            // Goyang ekor
            if (this.limbs.tail) {
                this.limbs.tail.rotation.y = Math.sin(this.walkCycle * 2) * 0.35;
            }
        } else if (this.state === 'idle') {
            // Reset kaki ke posisi tegak
            if (this.limbs.legs) {
                this.limbs.legs.forEach(leg => {
                    leg.rotation.x *= 0.85;
                });
            }
            // Sesekali gerakkan kepala menengok santai
            if (this.limbs.head) {
                this.limbs.head.rotation.y = Math.sin(Date.now() * 0.002) * 0.2;
            }
        }
    }
}

// Pengelola Seluruh Kawanan Hewan Peternakan
class AnimalManager {
    constructor() {
        this.animals = [];
        this.scene = null;
        
        // Batas wilayah kandang & padang rumput peternakan (di map luas)
        this.ranchBounds = {
            minX: 20,
            maxX: 58,
            minZ: 14,
            maxZ: 50
        };

        // Palung pakan & palung air komunal
        this.troughs = {
            feedLevel: 75,  // % stok pakan di palung
            waterLevel: 85, // % stok air di palung
            feedPos: { x: 30, y: 0, z: 22 },
            waterPos: { x: 44, y: 0, z: 22 }
        };
    }

    // Inisialisasi kawanan awal peternakan
    init(scene) {
        this.scene = scene;
        this.animals = [];

        // 1. Sapi (2 Ekor)
        this.addAnimal('sapi', 28, 26);
        this.addAnimal('sapi', 38, 34);

        // 2. Ayam (3 Ekor)
        this.addAnimal('ayam', 24, 36);
        this.addAnimal('ayam', 28, 42);
        this.addAnimal('ayam', 25, 30);

        // 3. Kambing (2 Ekor)
        this.addAnimal('kambing', 46, 28);
        this.addAnimal('kambing', 50, 36);

        // 4. Bebek (2 Ekor)
        this.addAnimal('bebek', 36, 42);
        this.addAnimal('bebek', 42, 44);

        this.loadSavedData();
    }

    // Tambah hewan baru ke scene
    addAnimal(type, x, z) {
        const catalog = window.plantsData?.animalsCatalog[type] || {};
        const animal = new Animal({
            id: `${type}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            type: type,
            speciesName: catalog.speciesName || type.toUpperCase(),
            emoji: catalog.emoji || '🐾',
            x: x,
            z: z,
            bounds: this.ranchBounds,
            productInterval: catalog.productInterval || 35
        });

        if (this.scene) {
            const mesh = animal.createMesh();
            this.scene.add(mesh);
        }

        this.animals.push(animal);
        return animal;
    }

    // Cari hewan terdekat dari posisi pemain untuk sistem interaksi [E]
    getClosestAnimal(playerPos, maxDist = 3.2) {
        let closest = null;
        let minDist = maxDist;

        for (const a of this.animals) {
            const dist = Math.hypot(playerPos.x - a.position.x, playerPos.z - a.position.z);
            if (dist < minDist) {
                minDist = dist;
                closest = a;
            }
        }

        return closest;
    }

    // Dapatkan seluruh collider hewan untuk tabrakan fisik pemain
    getColliders() {
        return this.animals.map(a => ({
            type: 'circle',
            x: a.position.x,
            z: a.position.z,
            radius: a.radius,
            name: a.speciesName
        }));
    }

    // Update seluruh hewan setiap frame
    update(deltaTime) {
        this.animals.forEach(animal => animal.update(deltaTime));

        // Peluruhan air dan pakan pada palung komunal
        this.troughs.feedLevel = Math.max(0, this.troughs.feedLevel - deltaTime * 0.08);
        this.troughs.waterLevel = Math.max(0, this.troughs.waterLevel - deltaTime * 0.1);
    }

    // Simpan status peternakan ke localStorage
    saveData() {
        try {
            const data = this.animals.map(a => ({
                id: a.id,
                type: a.type,
                x: a.position.x,
                z: a.position.z,
                health: Math.round(a.health),
                hunger: Math.round(a.hunger),
                thirst: Math.round(a.thirst),
                happiness: Math.round(a.happiness),
                hasProduct: a.hasProduct
            }));
            localStorage.setItem('kebunPintar_animals_v2', JSON.stringify(data));
        } catch (e) {
            console.warn('Gagal simpan data hewan:', e);
        }
    }

    // Muat status peternakan dari localStorage
    loadSavedData() {
        try {
            const raw = localStorage.getItem('kebunPintar_animals_v2');
            if (!raw) return;
            const savedList = JSON.parse(raw);
            if (!Array.isArray(savedList)) return;

            // Sinkronkan status hewan yang cocok
            savedList.forEach((s, idx) => {
                if (this.animals[idx] && this.animals[idx].type === s.type) {
                    this.animals[idx].health = s.health;
                    this.animals[idx].hunger = s.hunger;
                    this.animals[idx].thirst = s.thirst;
                    this.animals[idx].happiness = s.happiness;
                    this.animals[idx].hasProduct = s.hasProduct;
                    if (this.animals[idx].bubbleIcon) {
                        this.animals[idx].bubbleIcon.visible = s.hasProduct;
                    }
                }
            });
        } catch (e) {
            console.warn('Gagal muat data hewan:', e);
        }
    }
}

// Inisialisasi Instance Global
window.animalManager = new AnimalManager();
