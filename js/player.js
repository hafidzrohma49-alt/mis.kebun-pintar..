/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/player.js
 * Deskripsi: Kontrol karakter petani 3D, kamera orbit mouse 360°, deteksi collision fisik,
 * gravitasi tanah solid, dan pemindaian objek interaksi terdekat tombol [E] / [Space].
 */

class PlayerController {
    constructor() {
        this.mesh = null;
        // Posisi awal di jalan setapak utama depan kebun
        this.position = { x: 22, y: 0, z: -8 };
        this.speed = 10.5; // Kecepatan gerak berjalan
        this.radius = 0.55; // Radius collision pemain

        this.rotation = 0;
        this.targetRotation = 0;

        // Kontrol Kamera 360 Derajat & Pointer Lock API (Kontrol Normal Non-Inverted)
        this.cameraDistance = 14;
        this.minDistance = 6;
        this.maxDistance = 26;
        this.orbitAngleH = 0; // Sudut horizontal yaw (rad) 360 derajat penuh
        this.orbitAngleV = -0.25; // Sudut vertikal pitch (rad), menghadap santai ke depan-bawah
        this.mouseSensitivity = 0.0022; // Sensitivitas kamera responsif & halus
        this.isPointerLocked = false;
        this.isMouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.currentLookAt = null;

        // Status Tombol Keyboard
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };

        // Status Virtual Joystick Mobile
        this.joystick = {
            active: false,
            touchId: null,
            startX: 0,
            startY: 0,
            deltaX: 0,
            deltaY: 0
        };

        // Animasi Berjalan
        this.walkCycle = 0;
        this.isMoving = false;

        // Sistem Lompat & Gravitasi
        this.verticalVelocity = 0;    // Kecepatan vertikal saat ini (m/s)
        this.isGrounded = true;        // Apakah pemain menyentuh tanah
        this.GRAVITY = -22;            // Gravitasi (unit/s²) — realistis & halus
        this.JUMP_FORCE = 8.5;         // Gaya lompatan awal (memberi tinggi ~1.65 m)
        this.jumpSquash = 0;           // Efek squash/stretch saat mendarat
        this.landingShake = 0;         // Goyangan kamera kecil saat mendarat
        this.wasGrounded = true;       // Status frame sebelumnya (untuk deteksi landing)

        // Organ tubuh karakter petani
        this.limbs = {
            leftArm: null,
            rightArm: null,
            leftLeg: null,
            rightLeg: null,
            bodyGroup: null
        };

        this.initListeners();
    }

    // Bangun Model 3D Karakter Petani Lengkap dengan Topi Caping & Celana Kodok
    createMesh() {
        const playerGroup = new THREE.Group();
        playerGroup.name = "FarmerPlayer";
        playerGroup.position.set(this.position.x, this.position.y, this.position.z);

        const bodyGroup = new THREE.Group();
        this.limbs.bodyGroup = bodyGroup;

        // Material Warna
        const skinMat = new THREE.MeshLambertMaterial({ color: 0xffcc99 });
        const shirtMat = new THREE.MeshLambertMaterial({ color: 0x43a047 });     // Kemeja hijau kebun
        const overallsMat = new THREE.MeshLambertMaterial({ color: 0x1976d2 });  // Celana kodok denim biru
        const hatStrawMat = new THREE.MeshLambertMaterial({ color: 0xd7ccc8 });  // Jerami topi caping
        const hatRibbonMat = new THREE.MeshLambertMaterial({ color: 0x8d6e63 }); // Pita cokelat topi
        const shoeMat = new THREE.MeshLambertMaterial({ color: 0x3e2723 });      // Sepatu boot kulit tua

        // 1. Badan / Torso (Kemeja & Celana Kodok)
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.85, 0.48), shirtMat);
        torso.position.y = 1.15;
        torso.castShadow = true;
        bodyGroup.add(torso);

        const overalls = new THREE.Mesh(new THREE.BoxGeometry(0.77, 0.55, 0.5), overallsMat);
        overalls.position.y = 1.0;
        overalls.castShadow = true;
        bodyGroup.add(overalls);

        // 2. Kepala Petani
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), skinMat);
        head.position.y = 1.8;
        head.castShadow = true;
        bodyGroup.add(head);

        // Wajah (Mata Hitam Ceria)
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x212121 });
        const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        leftEye.position.set(-0.13, 1.82, 0.25);
        bodyGroup.add(leftEye);

        const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), eyeMat);
        rightEye.position.set(0.13, 1.82, 0.25);
        bodyGroup.add(rightEye);

        // 3. Topi Caping Petani Tradisional
        const hatGroup = new THREE.Group();
        hatGroup.position.set(0, 2.05, 0);

        const hatCone = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.5, 16), hatStrawMat);
        hatCone.castShadow = true;
        hatGroup.add(hatCone);

        const hatRibbon = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.56, 0.1, 16), hatRibbonMat);
        hatRibbon.position.y = -0.12;
        hatGroup.add(hatRibbon);

        bodyGroup.add(hatGroup);

        // 4. Lengan Kiri & Kanan (Arm Swing Animation)
        const armGeo = new THREE.BoxGeometry(0.22, 0.75, 0.24);

        const leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-0.5, 1.45, 0);
        const leftArm = new THREE.Mesh(armGeo, shirtMat);
        leftArm.position.y = -0.32;
        leftArm.castShadow = true;
        leftArmGroup.add(leftArm);
        const leftHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), skinMat);
        leftHand.position.y = -0.7;
        leftArmGroup.add(leftHand);
        bodyGroup.add(leftArmGroup);
        this.limbs.leftArm = leftArmGroup;

        const rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(0.5, 1.45, 0);
        const rightArm = new THREE.Mesh(armGeo, shirtMat);
        rightArm.position.y = -0.32;
        rightArm.castShadow = true;
        rightArmGroup.add(rightArm);
        const rightHand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), skinMat);
        rightHand.position.y = -0.7;
        rightArmGroup.add(rightHand);
        bodyGroup.add(rightArmGroup);
        this.limbs.rightArm = rightArmGroup;

        // 5. Kaki Kiri & Kanan (Leg Walk Animation)
        const legGeo = new THREE.BoxGeometry(0.28, 0.75, 0.32);

        const leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.2, 0.75, 0);
        const leftLeg = new THREE.Mesh(legGeo, overallsMat);
        leftLeg.position.y = -0.35;
        leftLeg.castShadow = true;
        leftLegGroup.add(leftLeg);
        const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.42), shoeMat);
        leftShoe.position.set(0, -0.68, 0.05);
        leftShoe.castShadow = true;
        leftLegGroup.add(leftShoe);
        bodyGroup.add(leftLegGroup);
        this.limbs.leftLeg = leftLegGroup;

        const rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.2, 0.75, 0);
        const rightLeg = new THREE.Mesh(legGeo, overallsMat);
        rightLeg.position.y = -0.35;
        rightLeg.castShadow = true;
        rightLegGroup.add(rightLeg);
        const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.42), shoeMat);
        rightShoe.position.set(0, -0.68, 0.05);
        rightShoe.castShadow = true;
        rightLegGroup.add(rightShoe);
        bodyGroup.add(rightLegGroup);
        this.limbs.rightLeg = rightLegGroup;

        playerGroup.add(bodyGroup);
        this.mesh = playerGroup;

        return playerGroup;
    }

    // Request & Release Pointer Lock API
    requestPointerLock() {
        const canvas = document.querySelector('#canvasContainer canvas') || document.getElementById('canvasContainer');
        if (!canvas) return;
        const req = canvas.requestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
        if (req) {
            try {
                req.call(canvas);
            } catch (err) {
                console.log('Pointer lock request error:', err);
            }
        }
    }

    exitPointerLock() {
        const exit = document.exitPointerLock || document.mozExitPointerLock || document.webkitExitPointerLock;
        if (exit) {
            try {
                exit.call(document);
            } catch (err) {
                console.log('Pointer lock exit error:', err);
            }
        }
    }

    // Inisialisasi Input Listener (Keyboard, Mouse 360° Pointer Lock, Zoom, Touch)
    initListeners() {
        // Keyboard Down
        window.addEventListener('keydown', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = true;
            if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = true;
            if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = true;
            if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = true;

            // Tombol Interaksi: E saja
            if (code === 'KeyE') {
                e.preventDefault();
                if (window.appState && typeof window.appState.doInteraction === 'function') {
                    window.appState.doInteraction();
                }
            }

            // Tombol Lompat: Space
            if (code === 'Space') {
                e.preventDefault();
                if (this.isGrounded) {
                    this.verticalVelocity = this.JUMP_FORCE;
                    this.isGrounded = false;
                    if (window.appAudio) window.appAudio.play('click');
                }
            }

            // Tekan ESC untuk melepas pointer lock dan membuka kembali cursor
            if (code === 'Escape') {
                this.exitPointerLock();
            }
        });

        // Keyboard Up
        window.addEventListener('keyup', (e) => {
            const code = e.code;
            if (code === 'KeyW' || code === 'ArrowUp') this.keys.up = false;
            if (code === 'KeyS' || code === 'ArrowDown') this.keys.down = false;
            if (code === 'KeyA' || code === 'ArrowLeft') this.keys.left = false;
            if (code === 'KeyD' || code === 'ArrowRight') this.keys.right = false;
        });

        // Listener Status Pointer Lock
        const onLockChange = () => {
            const canvas = document.querySelector('#canvasContainer canvas') || document.getElementById('canvasContainer');
            this.isPointerLocked = (document.pointerLockElement === canvas || document.pointerLockElement !== null);
        };
        document.addEventListener('pointerlockchange', onLockChange);
        document.addEventListener('mozpointerlockchange', onLockChange);
        document.addEventListener('webkitpointerlockchange', onLockChange);

        // Klik pada area canvas permainan untuk mengaktifkan kembali pointer lock
        document.addEventListener('click', (e) => {
            if (window.appState && window.appState.currentScreen === 'game') {
                // Abaikan jika pemain mengklik modal dialog atau tombol HUD atas / minimap
                if (e.target.closest('.modal-overlay') || e.target.closest('.game-hud-top') || e.target.closest('.minimap-wrapper') || e.target.closest('#mobileControlsContainer')) {
                    return;
                }
                this.requestPointerLock();
            }
        });

        // Kontrol Mouse Orbit Kamera 360 Derajat dengan Pointer Lock API
        window.addEventListener('mousedown', (e) => {
            if (e.target && (e.target.tagName === 'CANVAS' || e.target.id === 'canvasContainer')) {
                this.isMouseDown = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                if (!this.isPointerLocked && window.appState && window.appState.currentScreen === 'game') {
                    this.requestPointerLock();
                }
            }
        });

        window.addEventListener('mousemove', (e) => {
            const movementX = e.movementX !== undefined ? e.movementX : (e.mozMovementX || e.webkitMovementX || 0);
            const movementY = e.movementY !== undefined ? e.movementY : (e.mozMovementY || e.webkitMovementY || 0);

            // Batas sudut vertikal -80° sampai +80° agar kamera tidak terbalik
            const limitV = 80 * (Math.PI / 180); // ~1.3963 radian

            if (this.isPointerLocked) {
                // Rotasi horizontal 360° normal: mouse kanan -> putar kanan, mouse kiri -> putar kiri
                this.orbitAngleH += movementX * this.mouseSensitivity;

                // Rotasi vertikal normal: mouse atas -> lihat atas, mouse bawah -> lihat bawah
                this.orbitAngleV -= movementY * this.mouseSensitivity;
                this.orbitAngleV = Math.max(-limitV, Math.min(limitV, this.orbitAngleV));
            } else if (this.isMouseDown) {
                // Fallback drag mouse manual jika pointer lock belum aktif
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;

                this.orbitAngleH += deltaX * 0.005;
                this.orbitAngleV -= deltaY * 0.005;
                this.orbitAngleV = Math.max(-limitV, Math.min(limitV, this.orbitAngleV));
            }
        });

        window.addEventListener('mouseup', () => {
            this.isMouseDown = false;
        });

        // Zoom In / Out dengan Scroll Mouse Wheel
        window.addEventListener('wheel', (e) => {
            if (window.appState && window.appState.currentScreen === 'game') {
                this.cameraDistance += e.deltaY * 0.015;
                this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance));
            }
        }, { passive: true });

        // Virtual Joystick untuk Mobile / Layar Sentuh
        this.setupMobileJoystick();
    }

    // Controller Joystick Sentuh Mobile
    setupMobileJoystick() {
        document.addEventListener('DOMContentLoaded', () => {
            const joystickZone = document.getElementById('joystickZone');
            const joystickKnob = document.getElementById('joystickKnob');
            const mobileActionBtn = document.getElementById('mobileActionBtn');

            if (!joystickZone || !joystickKnob) return;
            const maxDistance = 45;

            const handleTouchStart = (e) => {
                const touch = e.changedTouches[0];
                this.joystick.active = true;
                this.joystick.touchId = touch.identifier;

                const rect = joystickZone.getBoundingClientRect();
                this.joystick.startX = rect.left + rect.width / 2;
                this.joystick.startY = rect.top + rect.height / 2;

                updateJoystick(touch.clientX, touch.clientY);
            };

            const handleTouchMove = (e) => {
                if (!this.joystick.active) return;
                for (let i = 0; i < e.changedTouches.length; i++) {
                    const touch = e.changedTouches[i];
                    if (touch.identifier === this.joystick.touchId) {
                        updateJoystick(touch.clientX, touch.clientY);
                        break;
                    }
                }
            };

            const handleTouchEnd = (e) => {
                for (let i = 0; i < e.changedTouches.length; i++) {
                    if (e.changedTouches[i].identifier === this.joystick.touchId) {
                        this.joystick.active = false;
                        this.joystick.touchId = null;
                        this.joystick.deltaX = 0;
                        this.joystick.deltaY = 0;
                        joystickKnob.style.transform = 'translate(0px, 0px)';
                        break;
                    }
                }
            };

            const updateJoystick = (clientX, clientY) => {
                let dx = clientX - this.joystick.startX;
                let dy = clientY - this.joystick.startY;
                const distance = Math.hypot(dx, dy);

                if (distance > maxDistance) {
                    const angle = Math.atan2(dy, dx);
                    dx = Math.cos(angle) * maxDistance;
                    dy = Math.sin(angle) * maxDistance;
                }

                joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
                this.joystick.deltaX = dx / maxDistance;
                this.joystick.deltaY = dy / maxDistance;
            };

            joystickZone.addEventListener('touchstart', handleTouchStart, { passive: false });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', handleTouchEnd, { passive: false });
            window.addEventListener('touchcancel', handleTouchEnd, { passive: false });

            if (mobileActionBtn) {
                mobileActionBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (window.appState && typeof window.appState.doInteraction === 'function') {
                        window.appState.doInteraction();
                    }
                });
            }
        });
    }

    // Update Posisi, Collision, dan Kamera Setiap Frame
    update(deltaTime, world) {
        if (!this.mesh) return;

        // 1. Hitung Vektor Arah Gerak Horizontal Relatif terhadap Kamera
        let inputForward = 0;
        let inputRight = 0;

        if (this.keys.up)    inputForward += 1;
        if (this.keys.down)  inputForward -= 1;
        if (this.keys.left)  inputRight   -= 1;
        if (this.keys.right) inputRight   += 1;

        if (this.joystick.active) {
            inputRight   += this.joystick.deltaX;
            inputForward -= this.joystick.deltaY;
        }

        const inputLen = Math.hypot(inputForward, inputRight);

        // ── GERAKAN HORIZONTAL (WASD) ──────────────────────────────────────
        if (inputLen > 0.05) {
            this.isMoving = true;

            const camAngle = this.orbitAngleH;
            const forwardX = Math.sin(camAngle);
            const forwardZ = -Math.cos(camAngle);
            const rightX   = Math.cos(camAngle);
            const rightZ   = Math.sin(camAngle);

            const normF = inputForward / inputLen;
            const normR = inputRight   / inputLen;

            const moveX = (forwardX * normF + rightX * normR) * this.speed * deltaTime;
            const moveZ = (forwardZ * normF + rightZ * normR) * this.speed * deltaTime;

            const nextX = this.position.x + moveX;
            const nextZ = this.position.z + moveZ;

            // Collision Horizontal dengan Wall Sliding
            let finalX = this.position.x;
            let finalZ = this.position.z;

            if (!world.checkCollision(nextX, nextZ, this.radius)) {
                finalX = nextX;
                finalZ = nextZ;
            } else {
                if (!world.checkCollision(nextX, this.position.z, this.radius)) finalX = nextX;
                if (!world.checkCollision(this.position.x, nextZ, this.radius)) finalZ = nextZ;
            }

            this.position.x = finalX;
            this.position.z = finalZ;

            // Rotasi Karakter Menghadap Arah Langkah
            const moveAngle = Math.atan2(moveX, moveZ);
            this.targetRotation = moveAngle;
            let rotDiff = this.targetRotation - this.mesh.rotation.y;
            while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
            while (rotDiff >  Math.PI) rotDiff -= Math.PI * 2;
            this.mesh.rotation.y += rotDiff * 14 * deltaTime;

        } else {
            this.isMoving = false;
        }

        // ── GRAVITASI & LOMPATAN (SUMBU VERTIKAL Y) ────────────────────────
        const groundY = world.getGroundHeight(this.position.x, this.position.z);

        if (this.isGrounded) {
            // Di tanah: ikuti ketinggian terrain (jembatan dll)
            this.position.y = groundY;
            this.verticalVelocity = 0;
        } else {
            // Di udara: terapkan gravitasi
            this.verticalVelocity += this.GRAVITY * deltaTime;
            this.position.y += this.verticalVelocity * deltaTime;

            // Deteksi mendarat
            if (this.position.y <= groundY) {
                this.position.y = groundY;
                this.verticalVelocity = 0;
                this.isGrounded = true;

                // Efek landing: squash tubuh & goyangan kamera
                this.jumpSquash  = 1.0;
                this.landingShake = 0.18;
                if (window.appAudio) window.appAudio.play('plant');
            }

            // Deteksi atap / objek di atas kepala — hentikan lompatan
            if (this.verticalVelocity > 0) {
                const headY = this.position.y + 2.4; // tinggi kepala
                const aboveGround = world.getGroundHeight(this.position.x, this.position.z + 0.01);
                // Jika kepala menembus batas dunia atas, batalkan lompatan
                if (headY > 25) {
                    this.verticalVelocity = 0;
                }
            }
        }

        // Deteksi bahwa pemain baru saja meninggalkan tanah (untuk sinkronisasi)
        if (this.wasGrounded && !this.isGrounded) {
            // mulai terbang — tidak perlu aksi tambahan
        }
        this.wasGrounded = this.isGrounded;

        // Periksa kembali apakah pemain masih di atas tanah (bisa jatuh dari tepi)
        if (this.isGrounded && this.position.y > groundY + 0.15) {
            this.isGrounded = false;
            this.verticalVelocity = 0;
        }

        // ── ANIMASI TUBUH ──────────────────────────────────────────────────
        // Efek squash saat mendarat (tubuh sedikit gepeng lalu kembali)
        if (this.jumpSquash > 0) {
            this.jumpSquash = Math.max(0, this.jumpSquash - deltaTime * 6);
            const sq = this.jumpSquash;
            if (this.limbs.bodyGroup) {
                this.limbs.bodyGroup.scale.set(1 + sq * 0.15, 1 - sq * 0.25, 1 + sq * 0.15);
            }
        } else {
            if (this.limbs.bodyGroup) {
                this.limbs.bodyGroup.scale.lerp
                    ? this.limbs.bodyGroup.scale.lerp(new THREE.Vector3(1, 1, 1), 0.3)
                    : this.limbs.bodyGroup.scale.set(1, 1, 1);
            }
        }

        if (this.isGrounded && this.isMoving) {
            // Animasi berjalan normal
            this.walkCycle += deltaTime * 12;
            const swing = Math.sin(this.walkCycle) * 0.65;
            if (this.limbs.leftLeg)  this.limbs.leftLeg.rotation.x  =  swing;
            if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x = -swing;
            if (this.limbs.leftArm)  this.limbs.leftArm.rotation.x  = -swing * 0.8;
            if (this.limbs.rightArm) this.limbs.rightArm.rotation.x  = swing * 0.8;
            if (this.limbs.bodyGroup) {
                this.limbs.bodyGroup.position.y = Math.abs(Math.sin(this.walkCycle * 2)) * 0.08;
            }
        } else if (!this.isGrounded) {
            // Animasi terbang: kaki sedikit terangkat
            if (this.limbs.leftLeg)  this.limbs.leftLeg.rotation.x  *= 0.85;
            if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x  *= 0.85;
            if (this.limbs.leftArm)  this.limbs.leftArm.rotation.x   = -0.4;
            if (this.limbs.rightArm) this.limbs.rightArm.rotation.x  = -0.4;
            if (this.limbs.bodyGroup) this.limbs.bodyGroup.position.y = 0;
        } else {
            // Diam di tanah
            if (this.limbs.leftLeg)  this.limbs.leftLeg.rotation.x  *= 0.8;
            if (this.limbs.rightLeg) this.limbs.rightLeg.rotation.x  *= 0.8;
            if (this.limbs.leftArm)  this.limbs.leftArm.rotation.x   *= 0.8;
            if (this.limbs.rightArm) this.limbs.rightArm.rotation.x  *= 0.8;
            if (this.limbs.bodyGroup) this.limbs.bodyGroup.position.y *= 0.8;
        }

        // Sinkronisasi posisi mesh dengan position
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);

        // 6. Update Posisi Kamera Mengorbit Pemain Secara Halus
        this.updateCamera(deltaTime, world);

        // 7. Pemindaian Objek Interaksi Terdekat [E]
        this.scanNearbyInteractables(world);
    }


    // Kamera Mengorbit Karakter Secara Halus (360° Horizontal, -80° sampai +80° Vertikal)
    updateCamera(deltaTime, world) {
        if (!world.camera) return;

        const yaw = this.orbitAngleH;
        const pitch = this.orbitAngleV;

        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const sinYaw = Math.sin(yaw);
        const cosYaw = Math.cos(yaw);

        // Vektor arah pandang kamera (normal non-inverted)
        const dirX = sinYaw * cosPitch;
        const dirY = sinPitch;
        const dirZ = -cosYaw * cosPitch;

        // Titik fokus karakter (dada/kepala)
        const focusX = this.position.x;
        const focusY = this.position.y + 1.4;
        const focusZ = this.position.z;

        // Posisi target kamera di belakang karakter
        const targetCamX = focusX - dirX * this.cameraDistance;
        let targetCamY = focusY - dirY * this.cameraDistance;
        const targetCamZ = focusZ - dirZ * this.cameraDistance;

        // Titik target pandangan kamera ke depan
        const targetLookX = focusX + dirX * 6;
        const targetLookY = focusY + dirY * 6;
        const targetLookZ = focusZ + dirZ * 6;

        // Cegah kamera menembus tanah solid
        if (world && typeof world.getGroundHeight === 'function') {
            const groundH = world.getGroundHeight(targetCamX, targetCamZ);
            if (targetCamY < groundH + 0.6) {
                targetCamY = groundH + 0.6;
            }
        }

        // Smoothing (lerp) kamera agar sangat halus dan tidak patah-patah
        const lerpSpeed = Math.min(1, 12 * deltaTime);
        world.camera.position.x += (targetCamX - world.camera.position.x) * lerpSpeed;
        world.camera.position.y += (targetCamY - world.camera.position.y) * lerpSpeed;
        world.camera.position.z += (targetCamZ - world.camera.position.z) * lerpSpeed;

        if (!this.currentLookAt) {
            this.currentLookAt = new THREE.Vector3(targetLookX, targetLookY, targetLookZ);
        } else {
            this.currentLookAt.x += (targetLookX - this.currentLookAt.x) * lerpSpeed;
            this.currentLookAt.y += (targetLookY - this.currentLookAt.y) * lerpSpeed;
            this.currentLookAt.z += (targetLookZ - this.currentLookAt.z) * lerpSpeed;
        }

        // Efek goyangan kamera kecil saat mendarat (landing shake)
        let shakeOffset = 0;
        if (this.landingShake > 0) {
            this.landingShake = Math.max(0, this.landingShake - deltaTime * 4);
            shakeOffset = Math.sin(this.landingShake * 40) * this.landingShake * 0.3;
        }

        world.camera.lookAt(
            this.currentLookAt.x,
            this.currentLookAt.y + shakeOffset,
            this.currentLookAt.z
        );
    }

    // Pindai Objek Interaktif Terdekat dalam Radius 3.2 Unit
    scanNearbyInteractables(world) {
        if (!window.appState) return;

        let closest = null;
        let minDist = 3.2;

        // 1. Cek Objek Lingkungan Dunia (Petak Tanaman, Sumur, Toko, Gudang, NPC, Kasur, Palung)
        const envInteractable = world.getClosestInteractable(this.position, minDist);
        if (envInteractable) {
            const dist = Math.hypot(this.position.x - envInteractable.position.x, this.position.z - envInteractable.position.z);
            if (dist < minDist) {
                minDist = dist;
                closest = envInteractable;
            }
        }

        // 2. Cek Hewan Ternak Terdekat (Sapi, Ayam, Kambing, Bebek)
        if (window.animalManager) {
            const animal = window.animalManager.getClosestAnimal(this.position, minDist);
            if (animal) {
                const dist = Math.hypot(this.position.x - animal.position.x, this.position.z - animal.position.z);
                if (dist < minDist) {
                    closest = {
                        type: 'animal',
                        animalRef: animal,
                        name: `${animal.emoji} ${animal.speciesName}`,
                        actionText: animal.hasProduct ? `Panen Produk ${animal.speciesName}` : `Beri Pakan / Rawat ${animal.speciesName}`,
                        position: animal.position
                    };
                }
            }
        }

        // Beritahu AppState untuk memperbarui HUD prompt [E]
        window.appState.updateInteractionTarget(closest);
    }
}

// Inisialisasi Instance Global
window.playerController = new PlayerController();
