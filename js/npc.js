/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/npc.js
 * Deskripsi: Sistem NPC 3D Hidup & Fungsional.
 * Setiap NPC memiliki wujud fisik 3D, animasi idle & berjalan (patroli),
 * collision fisik, deteksi hadap pemain, serta fungsi nyata terintegrasi
 * (Pedagang Beli/Jual, Pemberi Quest, Edukasi Tips, AI Lab, Mentor Belajar, Workshop Crafting).
 */

class NPC {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.role = config.role;
        this.roleType = config.roleType; // 'merchant' | 'quest_giver' | 'informant' | 'ai_lab' | 'teacher' | 'crafter'
        this.actionPrompt = config.actionPrompt || `Bicara dengan ${this.name}`;

        // Posisi & Area Patroli
        this.spawnPos = { x: config.x || 0, z: config.z || 0 };
        this.position = { x: config.x || 0, y: 0, z: config.z || 0 };
        this.targetPos = { x: config.x || 0, z: config.z || 0 };
        this.patrolRadius = config.patrolRadius !== undefined ? config.patrolRadius : 2.5;
        this.moveSpeed = config.moveSpeed || 1.1;

        // Visual & Pakaian
        this.shirtColor = config.shirtColor || 0x1976d2;
        this.pantsColor = config.pantsColor || 0x37474f;
        this.hatType = config.hatType || 'none'; // 'straw' | 'peci' | 'cowboy' | 'visor' | 'glasses' | 'bandana' | 'bun'
        this.propType = config.propType || 'none'; // 'basket' | 'clipboard' | 'pitchfork' | 'scanner' | 'book' | 'hammer'

        // State Machine AI
        this.state = 'idle'; // 'idle' | 'walking'
        this.stateTimer = Math.random() * 3 + 2;
        this.rotation = config.rotation || 0;
        this.targetRotation = this.rotation;
        this.walkCycle = Math.random() * 10;
        this.animOffset = Math.random() * Math.PI * 2;
        this.isFacingPlayer = false;

        // Referensi 3D & Anggota Tubuh
        this.mesh = null;
        this.limbs = {
            bodyGroup: null,
            head: null,
            leftArm: null,
            rightArm: null,
            leftLeg: null,
            rightLeg: null,
            prop: null
        };
        this.collisionRadius = 0.75;
    }

    // Bangun Model Karakter 3D Humanoid Lengkap
    createMesh(scene) {
        const npcGroup = new THREE.Group();
        npcGroup.name = `NPC_${this.id}`;
        npcGroup.position.set(this.position.x, this.position.y, this.position.z);
        npcGroup.rotation.y = this.rotation;

        const bodyGroup = new THREE.Group();
        this.limbs.bodyGroup = bodyGroup;

        // Material Warna
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
        const shirtMat = new THREE.MeshLambertMaterial({ color: this.shirtColor });
        const pantsMat = new THREE.MeshLambertMaterial({ color: this.pantsColor });
        const darkMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
        const shoeMat = new THREE.MeshLambertMaterial({ color: 0x2e1c0c });

        // 1. Torso / Badan
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.85, 0.44), shirtMat);
        torso.position.y = 1.15;
        torso.castShadow = true;
        torso.receiveShadow = true;
        bodyGroup.add(torso);

        // 2. Kepala
        const headGroup = new THREE.Group();
        headGroup.position.set(0, 1.8, 0);

        const headMesh = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.46), skinMat);
        headMesh.castShadow = true;
        headGroup.add(headMesh);

        // Mata
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        [-0.12, 0.12].forEach(ex => {
            const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.04), eyeMat);
            eye.position.set(ex, 0.03, 0.24);
            headGroup.add(eye);
        });

        // Senyum ramah
        const mouthMat = new THREE.MeshBasicMaterial({ color: 0xc62828 });
        const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.04), mouthMat);
        mouth.position.set(0, -0.12, 0.24);
        headGroup.add(mouth);

        // Rambut & Aksesoris Kepala Berdasarkan Jenis NPC
        this.buildHeadwear(headGroup, darkMat);
        bodyGroup.add(headGroup);
        this.limbs.head = headGroup;

        // 3. Lengan Kiri & Kanan (Arm Swing)
        const armGeo = new THREE.BoxGeometry(0.2, 0.72, 0.22);

        // Lengan Kiri
        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.47, 1.45, 0);
        const leftArm = new THREE.Mesh(armGeo, shirtMat);
        leftArm.position.y = -0.3;
        leftArm.castShadow = true;
        leftArmGroup.add(leftArm);
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), skinMat);
        leftHand.position.y = -0.66;
        leftArmGroup.add(leftHand);
        bodyGroup.add(leftArmGroup);
        this.limbs.leftArm = leftArmGroup;

        // Lengan Kanan
        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(0.47, 1.45, 0);
        const rightArm = new THREE.Mesh(armGeo, shirtMat);
        rightArm.position.y = -0.3;
        rightArm.castShadow = true;
        rightArmGroup.add(rightArm);
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18), skinMat);
        rightHand.position.y = -0.66;
        rightArmGroup.add(rightHand);
        bodyGroup.add(rightArmGroup);
        this.limbs.rightArm = rightArmGroup;

        // Tambahkan Aksesoris / Properti Tangan
        this.buildHandProp(leftArmGroup, rightArmGroup);

        npcGroup.add(bodyGroup);

        // 4. Kaki Kiri & Kanan (Leg Swing)
        const legGeo = new THREE.BoxGeometry(0.24, 0.65, 0.26);

        // Kaki Kiri
        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.18, 0.7, 0);
        const leftLeg = new THREE.Mesh(legGeo, pantsMat);
        leftLeg.position.y = -0.3;
        leftLeg.castShadow = true;
        leftLegGroup.add(leftLeg);
        const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), shoeMat);
        leftShoe.position.set(0, -0.62, 0.04);
        leftLegGroup.add(leftShoe);
        npcGroup.add(leftLegGroup);
        this.limbs.leftLeg = leftLegGroup;

        // Kaki Kanan
        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.18, 0.7, 0);
        const rightLeg = new THREE.Mesh(legGeo, pantsMat);
        rightLeg.position.y = -0.3;
        rightLeg.castShadow = true;
        rightLegGroup.add(rightLeg);
        const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.16, 0.34), shoeMat);
        rightShoe.position.set(0, -0.62, 0.04);
        rightLegGroup.add(rightShoe);
        npcGroup.add(rightLegGroup);
        this.limbs.rightLeg = rightLegGroup;

        // Label Nama NPC Mengambang di Atas Kepala (3D Pin Marker)
        const markerGroup = new THREE.Group();
        markerGroup.position.set(0, 2.45, 0);
        const markerBadge = new THREE.Mesh(
            new THREE.SphereGeometry(0.14, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffeb3b })
        );
        markerGroup.add(markerBadge);
        npcGroup.add(markerGroup);

        this.mesh = npcGroup;
        scene.add(npcGroup);
        return npcGroup;
    }

    // Pembuatan Topi / Aksesoris Kepala
    buildHeadwear(headGroup, darkMat) {
        if (this.hatType === 'peci') {
            // Peci Hitam Wibawa (Pak Budi)
            const peci = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.22, 0.48), darkMat);
            peci.position.y = 0.26;
            headGroup.add(peci);
        } else if (this.hatType === 'cowboy') {
            // Topi Peternak Cokelat (Mas Danu)
            const hatMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
            const brim = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.06, 0.85), hatMat);
            brim.position.y = 0.24;
            headGroup.add(brim);
            const crown = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.24, 0.48), hatMat);
            crown.position.y = 0.38;
            headGroup.add(crown);
        } else if (this.hatType === 'bun') {
            // Sanggul Rambut Rapi Pedagang (Bu Dewi)
            const hairMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 0.48), hairMat);
            hair.position.y = 0.24;
            headGroup.add(hair);
            const bun = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), hairMat);
            bun.position.set(0, 0.26, -0.24);
            headGroup.add(bun);
        } else if (this.hatType === 'visor') {
            // Kacamata / Visor Peneliti AI (Dr. Aris)
            const visorMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
            const visor = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.1, 0.08), visorMat);
            visor.position.set(0, 0.05, 0.24);
            headGroup.add(visor);
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.48), darkMat);
            hair.position.y = 0.24;
            headGroup.add(hair);
        } else if (this.hatType === 'glasses') {
            // Kacamata Guru Botani (Bu Siti)
            const glassesMat = new THREE.MeshBasicMaterial({ color: 0xd4af37 });
            const frame1 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.04), glassesMat);
            frame1.position.set(-0.12, 0.03, 0.24);
            headGroup.add(frame1);
            const frame2 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.04), glassesMat);
            frame2.position.set(0.12, 0.03, 0.24);
            headGroup.add(frame2);
            const hairMat = new THREE.MeshLambertMaterial({ color: 0x4e342e });
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.5), hairMat);
            hair.position.y = 0.24;
            headGroup.add(hair);
        } else if (this.hatType === 'bandana') {
            // Bandana Merah Pengrajin (Pak Joko)
            const bandMat = new THREE.MeshLambertMaterial({ color: 0xd32f2f });
            const band = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.12, 0.5), bandMat);
            band.position.y = 0.2;
            headGroup.add(band);
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.14, 0.48), darkMat);
            hair.position.y = 0.28;
            headGroup.add(hair);
        } else {
            // Rambut biasa
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.48), darkMat);
            hair.position.y = 0.24;
            headGroup.add(hair);
        }
    }

    // Pembuatan Properti Tangan Sesuai Profesi
    buildHandProp(leftArm, rightArm) {
        if (this.propType === 'basket') {
            // Keranjang Belanjaan Bu Dewi
            const basketMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
            const basket = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.25), basketMat);
            basket.position.set(0, -0.65, 0.15);
            leftArm.add(basket);
        } else if (this.propType === 'clipboard') {
            // Papan Catatan Misi Pak Budi
            const boardMat = new THREE.MeshLambertMaterial({ color: 0x5d4037 });
            const paperMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const board = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, 0.24), boardMat);
            board.position.set(-0.06, -0.65, 0.12);
            board.rotation.y = 0.2;
            const paper = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.28, 0.18), paperMat);
            paper.position.set(-0.04, -0.65, 0.12);
            leftArm.add(board);
            leftArm.add(paper);
        } else if (this.propType === 'pitchfork') {
            // Ember / Perkakas Mas Danu
            const bucketMat = new THREE.MeshLambertMaterial({ color: 0x78909c });
            const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.1, 0.25, 8), bucketMat);
            bucket.position.set(0, -0.75, 0.08);
            rightArm.add(bucket);
        } else if (this.propType === 'scanner') {
            // Tablet Scanner AI Dr. Aris
            const tabletMat = new THREE.MeshLambertMaterial({ color: 0x212121 });
            const screenMat = new THREE.MeshBasicMaterial({ color: 0x00e5ff });
            const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.03), tabletMat);
            tablet.position.set(0, -0.65, 0.15);
            tablet.rotation.x = 0.4;
            const screen = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.25, 0.02), screenMat);
            screen.position.set(0, -0.65, 0.16);
            screen.rotation.x = 0.4;
            rightArm.add(tablet);
            rightArm.add(screen);
        } else if (this.propType === 'book') {
            // Buku Botani Bu Siti
            const bookMat = new THREE.MeshLambertMaterial({ color: 0x2e7d32 });
            const book = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.08), bookMat);
            book.position.set(0, -0.65, 0.12);
            book.rotation.y = 0.3;
            leftArm.add(book);
        } else if (this.propType === 'hammer') {
            // Palu Besi Pengrajin Pak Joko
            const handleMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 });
            const headMat = new THREE.MeshLambertMaterial({ color: 0x607d8b });
            const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45), handleMat);
            handle.position.set(0, -0.75, 0.05);
            handle.rotation.z = Math.PI / 4;
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.08, 0.08), headMat);
            head.position.set(0.12, -0.62, 0.05);
            rightArm.add(handle);
            rightArm.add(head);
        }
    }

    // Perbarui Siklus Animasi & Perilaku Setiap Frame
    update(deltaTime, playerPos, world) {
        if (!this.mesh) return;

        const time = performance.now() * 0.001;

        // Cek Jarak dengan Pemain
        let distToPlayer = 999;
        if (playerPos) {
            distToPlayer = Math.hypot(playerPos.x - this.position.x, playerPos.z - this.position.z);
        }

        // Jika pemain dekat (< 3.8m), NPC fokus menatap pemain dan ramah menyapa
        if (distToPlayer < 3.8 && playerPos) {
            this.isFacingPlayer = true;
            this.targetRotation = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);

            // Transisi rotasi halus menghadap pemain
            let rotDiff = this.targetRotation - this.mesh.rotation.y;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
            this.mesh.rotation.y += rotDiff * 6 * deltaTime;

            // Animasi Idle Bernapas & Sedikit Ayunan Kepala
            if (this.limbs.bodyGroup) {
                this.limbs.bodyGroup.position.y = Math.sin(time * 2.5 + this.animOffset) * 0.03;
            }
            if (this.limbs.head) {
                this.limbs.head.rotation.y = Math.sin(time * 1.2 + this.animOffset) * 0.08;
            }

            // Kembalikan kaki dan tangan ke posisi berdiri tegak
            if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x *= 0.85;
            if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x *= 0.85;
            if (this.limbs.leftArm) this.limbs.leftArm.rotation.x *= 0.85;
            if (this.limbs.rightArm) this.limbs.rightArm.rotation.x *= 0.85;
            return;
        }

        this.isFacingPlayer = false;
        this.stateTimer -= deltaTime;

        // State Machine AI: Berganti antara 'idle' dan 'walking'
        if (this.stateTimer <= 0) {
            if (this.state === 'idle') {
                // Mulai berjalan ke titik baru di sekitar titik spawn
                this.state = 'walking';
                this.stateTimer = Math.random() * 4 + 3; // Berjalan 3-7 detik

                const angle = Math.random() * Math.PI * 2;
                const dist = Math.random() * this.patrolRadius;
                this.targetPos.x = this.spawnPos.x + Math.cos(angle) * dist;
                this.targetPos.z = this.spawnPos.z + Math.sin(angle) * dist;
            } else {
                // Berhenti santai
                this.state = 'idle';
                this.stateTimer = Math.random() * 4 + 3; // Diam 3-7 detik
            }
        }

        if (this.state === 'walking') {
            const dx = this.targetPos.x - this.position.x;
            const dz = this.targetPos.z - this.position.z;
            const dist = Math.hypot(dx, dz);

            if (dist > 0.3) {
                // Hitung arah gerak
                const moveAngle = Math.atan2(dx, dz);
                this.targetRotation = moveAngle;

                let rotDiff = this.targetRotation - this.mesh.rotation.y;
                while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
                while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
                this.mesh.rotation.y += rotDiff * 5 * deltaTime;

                const step = Math.min(dist, this.moveSpeed * deltaTime);
                const nextX = this.position.x + (dx / dist) * step;
                const nextZ = this.position.z + (dz / dist) * step;

                // Cek collision lingkungan jika world tersedia
                let canMove = true;
                if (world && world.checkCollision) {
                    if (world.checkCollision(nextX, nextZ, this.collisionRadius, `npc_${this.id}`)) {
                        canMove = false;
                        this.state = 'idle';
                        this.stateTimer = 2.0;
                    }
                }

                if (canMove) {
                    this.position.x = nextX;
                    this.position.z = nextZ;
                }

                // Animasi Berjalan (Ayunan Kaki & Tangan)
                this.walkCycle += deltaTime * 9;
                const swing = Math.sin(this.walkCycle) * 0.55;

                if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x = swing;
                if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = -swing;
                if (this.limbs.leftArm) this.limbs.leftArm.rotation.x = -swing * 0.65;
                if (this.limbs.rightArm) this.limbs.rightArm.rotation.x = swing * 0.65;

                if (this.limbs.bodyGroup) {
                    this.limbs.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle * 2)) * 0.06;
                }
            } else {
                // Sampai di tujuan
                this.state = 'idle';
                this.stateTimer = Math.random() * 3 + 2;
            }
        } else {
            // Animasi Idle Tenang
            if (this.limbs.bodyGroup) {
                this.limbs.bodyGroup.position.y = Math.sin(time * 2.0 + this.animOffset) * 0.025;
            }
            if (this.limbs.head) {
                this.limbs.head.rotation.y = Math.sin(time * 0.7 + this.animOffset) * 0.12;
            }

            if (this.limbs.leftLeg) this.limbs.leftLeg.rotation.x *= 0.88;
            if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x *= 0.88;
            if (this.limbs.leftArm) this.limbs.leftArm.rotation.x *= 0.88;
            if (this.limbs.rightArm) this.limbs.rightArm.rotation.x *= 0.88;
        }

        // Ketinggian tanah
        if (world && world.getGroundHeight) {
            this.position.y = world.getGroundHeight(this.position.x, this.position.z);
        }

        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
    }
}

class NPCManager {
    constructor() {
        this.npcs = [];
        this.isInitialized = false;
    }

    // Inisialisasi Seluruh 6 NPC di Lokasi Tematik Dunia 3D
    init(scene, world) {
        if (this.isInitialized) return;

        const npcConfigs = [
            // 1. Bu Dewi: Pedagang Toko & Pasar (Depan Toko & Dekat Kios Pasar)
            {
                id: 'dewi',
                name: 'Bu Dewi',
                role: 'Pedagang Toko & Pasar',
                roleType: 'merchant',
                actionPrompt: 'Buka Toko & Jual Beli',
                x: -36,
                z: -10,
                patrolRadius: 2.2,
                moveSpeed: 0.9,
                shirtColor: 0xd81b60, // Magenta/pink pedagang
                pantsColor: 0x880e4f,
                hatType: 'bun',
                propType: 'basket'
            },
            // 2. Pak Budi: Kepala Desa & Pemberi Quest (Alun-Alun Dekat Air Mancur & Papan Quest)
            {
                id: 'budi',
                name: 'Pak Budi',
                role: 'Kepala Desa & Misi',
                roleType: 'quest_giver',
                actionPrompt: 'Lihat Misi & Papan Tugas',
                x: -30,
                z: 3,
                patrolRadius: 3.0,
                moveSpeed: 0.85,
                shirtColor: 0x1565c0, // Biru wibawa
                pantsColor: 0x37474f,
                hatType: 'peci',
                propType: 'clipboard'
            },
            // 3. Mas Danu: Peternak Ahli & Tips (Dekat Kandang Hewan & Padang Rumput)
            {
                id: 'danu',
                name: 'Mas Danu',
                role: 'Peternak Ahli & Tips',
                roleType: 'informant',
                actionPrompt: 'Tanya Tips Ternak & Tani',
                x: 20,
                z: 20,
                patrolRadius: 3.2,
                moveSpeed: 0.95,
                shirtColor: 0x2e7d32, // Hijau peternak
                pantsColor: 0x4e342e,
                hatType: 'cowboy',
                propType: 'pitchfork'
            },
            // 4. Dr. Aris: Peneliti Lab AI Tanaman (Area Gazebo Riset Pertanian)
            {
                id: 'aris',
                name: 'Dr. Aris',
                role: 'Peneliti Lab AI Tanaman',
                roleType: 'ai_lab',
                actionPrompt: 'Konsultasi AI Dokter',
                x: -14,
                z: -18,
                patrolRadius: 2.0,
                moveSpeed: 0.85,
                shirtColor: 0xf5f5f5, // Jas lab putih
                pantsColor: 0x263238,
                hatType: 'visor',
                propType: 'scanner'
            },
            // 5. Bu Siti: Guru Botani & Mentor (Gazebo Alun-Alun / Perpustakaan Desa)
            {
                id: 'siti',
                name: 'Bu Siti',
                role: 'Guru Botani & Sains',
                roleType: 'teacher',
                actionPrompt: 'Buka Modul Belajar & Kuis',
                x: -42,
                z: 8,
                patrolRadius: 2.5,
                moveSpeed: 0.9,
                shirtColor: 0x6a1b9a, // Ungu anggun
                pantsColor: 0x424242,
                hatType: 'glasses',
                propType: 'book'
            },
            // 6. Pak Joko: Pandai Besi & Pengrajin Workshop (Depan Gudang & Bengkel)
            {
                id: 'joko',
                name: 'Pak Joko',
                role: 'Pandai Besi & Workshop',
                roleType: 'crafter',
                actionPrompt: 'Buka Workshop & Crafting',
                x: 34,
                z: -46,
                patrolRadius: 2.2,
                moveSpeed: 0.9,
                shirtColor: 0x5d4037, // Cokelat pengrajin
                pantsColor: 0x212121,
                hatType: 'bandana',
                propType: 'hammer'
            }
        ];

        this.npcs = npcConfigs.map(cfg => new NPC(cfg));

        // Buat Mesh, Collider, dan Daftarkan ke Interactable World
        this.npcs.forEach(npc => {
            npc.createMesh(scene);

            // Daftarkan collider fisik agar pemain tidak bisa menembus NPC
            if (world && world.addCircleCollider) {
                world.addCircleCollider(npc.position.x, npc.position.z, npc.collisionRadius, `npc_${npc.id}`);
            }

            // Daftarkan sebagai interactable tombol [E]
            if (world && world.registerInteractable) {
                world.registerInteractable({
                    id: `npc_${npc.id}`,
                    type: 'npc',
                    npcRef: npc,
                    npcId: npc.id,
                    npcName: npc.name,
                    npcRole: npc.role,
                    npcRoleType: npc.roleType,
                    name: `💬 ${npc.name} (${npc.role})`,
                    actionText: `[E] ${npc.actionPrompt}`,
                    position: npc.position, // Referensi dinamis ke koordinat NPC
                    radius: 3.2
                });
            }
        });

        this.isInitialized = true;
        console.log(`[NPCManager] ${this.npcs.length} NPC 3D aktif dan terdaftar di dunia Kebun Pintar.`);
    }

    // Perbarui Seluruh NPC Setiap Frame
    update(deltaTime, playerPos, world) {
        if (!this.isInitialized) return;

        this.npcs.forEach(npc => {
            npc.update(deltaTime, playerPos, world);

            // Perbarui posisi collider lingkaran fisik di world
            if (world && world.circleColliders) {
                const col = world.circleColliders.find(c => c.name === `npc_${npc.id}`);
                if (col) {
                    col.x = npc.position.x;
                    col.z = npc.position.z;
                }
            }
        });
    }

    // Cari NPC Berdasarkan ID
    getNPC(id) {
        return this.npcs.find(n => n.id === id);
    }
}

// Inisialisasi Instance Global
window.npcManager = new NPCManager();
