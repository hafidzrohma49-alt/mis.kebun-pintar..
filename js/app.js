/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/app.js
 * Deskripsi: State Manager utama, penghubung antar modul, HUD, sistem level, koin, toko,
 * sistem interaksi tombol E/Space/Mobile, kuis interaktif, inventori, hewan ternak,
 * market, quest board, NPC dialogue, tidur di kasur, dan auto-save localStorage.
 */

class AppState {
    constructor() {
        this.STORAGE_KEY = 'kebunPintar_saveData_v2';

        // Progres Pemain
        this.coins = 200;
        this.level = 1;
        this.xp = 0;
        this.xpRequired = 100;

        // Inventaris lengkap: benih + pakan + produk + alat
        this.inventory = {
            // Benih
            selada: 5,
            wortel: 0,
            tomat: 0,
            cabai: 0,
            jagung: 0,
            stroberi: 0,
            // Pakan Ternak
            pakan_unggas: 3,
            pakan_ruminansia: 3,
            // Produk Hewani
            telur_ayam: 0,
            susu_sapi: 0,
            wol_kambing: 0,
            telur_bebek: 0,
            bulu_bebek: 0,
            // Alat & Kebutuhan
            penyiram_emas: 0,
            pupuk_kompos: 0,
            vitamin_ternak: 0
        };

        // State Interaksi NPC Pedagang, Crafting, dan Panduan
        this.merchantTab = 'buy';
        this.merchantCategory = 'all';
        this.guideTopic = 'ternak';
        this.guideReadBonus = false;

        // Benih aktif yang dipilih untuk ditanam
        this.selectedSeed = 'selada';

        // Cuaca aktif
        this.weather = 'cerah';

        // Layar saat ini: 'home' | 'game'
        this.currentScreen = 'home';

        // Interactable yang sedang didekati pemain
        this.currentInteractionTarget = null;

        // Status Kuis Edukatif
        this.quizState = {
            currentIndex: 0,
            score: 0,
            answered: false
        };

        // Quest harian
        this.quests = this._generateDailyQuests();

        // Muat data tersimpan jika ada
        this.loadGame();
    }

    // ========================================================================
    // PENYIMPANAN LOCALSTORAGE
    // ========================================================================
    saveGame() {
        try {
            let plotsData = [];
            if (window.world3d && window.world3d.plots && window.world3d.plots.length > 0) {
                plotsData = window.world3d.plots.map(p => ({
                    id: p.id,
                    crop: p.crop,
                    growth: p.growth,
                    isWatered: p.isWatered,
                    harvestReady: p.harvestReady
                }));
            } else if (this._cachedPlots) {
                plotsData = this._cachedPlots;
            }

            let animalsData = [];
            if (window.animalManager) {
                animalsData = window.animalManager.saveData();
            }

            const data = {
                coins: this.coins,
                level: this.level,
                xp: this.xp,
                inventory: this.inventory,
                selectedSeed: this.selectedSeed,
                weather: this.weather,
                plots: plotsData,
                animals: animalsData,
                quests: this.quests,
                savedAt: Date.now()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Gagal menyimpan progress:', e);
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (!raw) return;

            const data = JSON.parse(raw);
            if (typeof data.coins === 'number') this.coins = data.coins;
            if (typeof data.level === 'number') this.level = data.level;
            if (typeof data.xp === 'number') this.xp = data.xp;
            if (data.inventory) this.inventory = Object.assign(this.inventory, data.inventory);
            // Backward compat: old saves have 'seeds' key
            if (data.seeds) {
                Object.keys(data.seeds).forEach(k => {
                    if (this.inventory.hasOwnProperty(k)) this.inventory[k] = data.seeds[k];
                });
            }
            if (data.selectedSeed) this.selectedSeed = data.selectedSeed;
            if (data.weather) this.weather = data.weather;
            if (Array.isArray(data.plots)) this._cachedPlots = data.plots;
            if (Array.isArray(data.quests)) this.quests = data.quests;
        } catch (e) {
            console.warn('Gagal memuat progress tersimpan:', e);
        }
    }

    applyCachedPlotsToWorld() {
        if (!this._cachedPlots || !window.world3d || !window.world3d.plots) return;
        this._cachedPlots.forEach(savedPlot => {
            const plot = window.world3d.plots.find(p => p.id === savedPlot.id);
            if (plot) {
                plot.crop = savedPlot.crop;
                plot.growth = savedPlot.growth;
                plot.isWatered = savedPlot.isWatered;
                plot.harvestReady = savedPlot.harvestReady;
                window.world3d.updatePlotVisual(plot);
            }
        });
    }

    // ========================================================================
    // NAVIGASI LAYAR (HOME VS GAME 3D)
    // ========================================================================
    showGame() {
        this.currentScreen = 'game';
        document.getElementById('homeScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'block';

        this.closePanels();

        if (window.world3d) {
            window.world3d.start();
            window.world3d.setWeather(this.weather);
            this.applyCachedPlotsToWorld();
            setTimeout(() => { window.world3d.onWindowResize(); }, 50);
        }

        this.updateHUD();
        if (window.appAudio) window.appAudio.play('click');

        // Aktifkan Pointer Lock API untuk kontrol kamera 360°
        if (window.playerController && typeof window.playerController.requestPointerLock === 'function') {
            window.playerController.requestPointerLock();
            setTimeout(() => {
                if (window.playerController) window.playerController.requestPointerLock();
            }, 100);
        }

        if (typeof window.startBackgroundMusic === 'function') {
            window.startBackgroundMusic();
        } else if (window.appAudio) {
            window.appAudio.startBackgroundMusic();
        }
    }

    showHome() {
        this.currentScreen = 'home';
        document.getElementById('gameScreen').style.display = 'none';
        document.getElementById('homeScreen').style.display = 'flex';

        // Lepas Pointer Lock saat kembali ke beranda
        if (window.playerController && typeof window.playerController.exitPointerLock === 'function') {
            window.playerController.exitPointerLock();
        }

        if (window.world3d) window.world3d.stop();

        if (typeof window.stopBackgroundMusic === 'function') {
            window.stopBackgroundMusic();
        } else if (window.appAudio) {
            window.appAudio.stopBackgroundMusic();
        }

        this.closePanels();
        this.saveGame();
        if (window.appAudio) window.appAudio.play('click');
    }

    // Buka Modal/Panel spesifik
    openPanel(panelId) {
        // Buka cursor untuk navigasi modal
        if (window.playerController && typeof window.playerController.exitPointerLock === 'function') {
            window.playerController.exitPointerLock();
        }
        this.closePanels();
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.add('active');
            if (panelId === 'storeModal') {
                this.renderSeedShop();
            } else if (panelId === 'learnPanel') {
                const searchInput = document.getElementById('learnSearchInput');
                if (searchInput) searchInput.value = '';
                this.learnSearchQuery = '';
                this.renderLearningMaterials();
                this.initQuiz();
            } else if (panelId === 'inventoryModal') {
                this.renderInventoryModal();
            } else if (panelId === 'animalStatusModal') {
                this.renderAnimalStatusModal();
            } else if (panelId === 'marketModal') {
                this.renderMarketModal();
            } else if (panelId === 'questBoardModal') {
                this.renderQuestBoard();
            } else if (panelId === 'merchantModal') {
                this.renderMerchantModal();
            } else if (panelId === 'craftingModal') {
                this.renderCraftingModal();
            } else if (panelId === 'npcGuideModal') {
                this.renderGuideModal();
            }
            if (window.appAudio) window.appAudio.play('click');
        }
    }

    closePanels() {
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(m => m.classList.remove('active'));
    }

    // ========================================================================
    // INVENTORI HELPERS
    // ========================================================================
    addToInventory(itemId, qty = 1) {
        if (this.inventory.hasOwnProperty(itemId)) {
            this.inventory[itemId] = (this.inventory[itemId] || 0) + qty;
        } else {
            this.inventory[itemId] = qty;
        }
    }

    removeFromInventory(itemId, qty = 1) {
        const current = this.inventory[itemId] || 0;
        if (current < qty) return false;
        this.inventory[itemId] = current - qty;
        return true;
    }

    getInventoryCount(itemId) {
        return this.inventory[itemId] || 0;
    }

    // backward compat: seeds object (used by updateHUD etc)
    get seeds() { return this.inventory; }

    // ========================================================================
    // SISTEM INTERAKSI: TOMBOL [E] / [SPACE] / MOBILE
    // ========================================================================
    updateInteractionTarget(interactable) {
        this.currentInteractionTarget = interactable;
        const promptContainer = document.getElementById('interactionPrompt');
        const promptStatus = document.getElementById('promptStatus');
        const promptAction = document.getElementById('promptAction');

        if (!promptContainer || !promptStatus || !promptAction) return;

        if (!interactable) {
            promptContainer.classList.remove('visible');
            return;
        }

        promptContainer.classList.add('visible');

        const type = interactable.type;

        if (type === 'plot') {
            const plot = interactable.plotRef;
            if (!plot) return;
            const cropDef = plot.crop && window.plantsData ? window.plantsData.crops[plot.crop] : null;
            if (!plot.crop || plot.growth <= 0) {
                const selectedCropDef = window.plantsData ? window.plantsData.crops[this.selectedSeed] : null;
                const cropName = selectedCropDef ? selectedCropDef.name : 'Tanaman';
                const seedCount = this.getInventoryCount(this.selectedSeed);
                promptStatus.innerText = '🌱 Tanah kosong';
                promptAction.innerText = `[E] Tanam ${cropName} (${seedCount} benih)`;
                promptAction.className = seedCount > 0 ? 'prompt-action ready' : 'prompt-action warning';
            } else if (!plot.isWatered && !plot.harvestReady) {
                promptStatus.innerText = `💧 ${cropDef ? cropDef.name : 'Tanaman'} membutuhkan air`;
                promptAction.innerText = '[E] Siram Tanaman';
                promptAction.className = 'prompt-action ready';
            } else if (plot.harvestReady || plot.growth >= 100) {
                promptStatus.innerText = `🌾 ${cropDef ? cropDef.name : 'Tanaman'} siap dipanen!`;
                promptAction.innerText = `[E] Panen (+${cropDef ? cropDef.sellPrice : 0} 🪙)`;
                promptAction.className = 'prompt-action harvest';
            } else {
                promptStatus.innerText = `🌿 ${cropDef ? cropDef.name : 'Tanaman'} sedang tumbuh (${Math.floor(plot.growth)}%)`;
                promptAction.innerText = 'Tunggu sampai matang...';
                promptAction.className = 'prompt-action waiting';
            }
        } else if (type === 'animal') {
            const animal = interactable.animalRef;
            if (!animal) {
                promptStatus.innerText = interactable.name || '🐄 Hewan';
                promptAction.innerText = '[E] Interaksi';
                promptAction.className = 'prompt-action ready';
                return;
            }
            const emoji = { ayam: '🐔', sapi: '🐄', kambing: '🐐', bebek: '🦆' }[animal.species] || '🐾';
            if (animal.hasProduct) {
                promptStatus.innerText = `${emoji} ${animal.displayName} siap dipanen!`;
                promptAction.innerText = `[E] Ambil Produk`;
                promptAction.className = 'prompt-action harvest';
            } else if (animal.hunger < 60) {
                promptStatus.innerText = `${emoji} ${animal.displayName} lapar (${Math.round(animal.hunger)}%)`;
                promptAction.innerText = '[E] Beri Makan';
                promptAction.className = 'prompt-action ready';
            } else if (animal.thirst < 60) {
                promptStatus.innerText = `${emoji} ${animal.displayName} haus (${Math.round(animal.thirst)}%)`;
                promptAction.innerText = '[E] Beri Minum';
                promptAction.className = 'prompt-action ready';
            } else if (animal.health < 80 && this.getInventoryCount('vitamin_ternak') > 0) {
                promptStatus.innerText = `${emoji} ${animal.displayName} sakit ❤️${Math.round(animal.health)}%`;
                promptAction.innerText = '[E] Beri Vitamin 💊';
                promptAction.className = 'prompt-action harvest';
            } else {
                promptStatus.innerText = `${emoji} ${animal.displayName} ❤️${Math.round(animal.health)}%`;
                promptAction.innerText = '[E] Elus Hewan';
                promptAction.className = 'prompt-action ready';
            }
        } else if (type === 'shop') {
            promptStatus.innerText = '🏪 Toko Benih';
            promptAction.innerText = '[E] Buka Toko';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'market') {
            promptStatus.innerText = '🛒 Area Market';
            promptAction.innerText = '[E] Jual / Beli';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'warehouse') {
            promptStatus.innerText = '📦 Gudang';
            promptAction.innerText = '[E] Buka Gudang';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'bed') {
            promptStatus.innerText = '🛏️ Kasur Pemain';
            promptAction.innerText = '[E] Tidur (Skip Waktu)';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'quest_board') {
            promptStatus.innerText = '📋 Papan Quest';
            promptAction.innerText = '[E] Lihat Quest Harian';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'npc') {
            const npcRoleLabel = {
                merchant:    '[E] Buka Toko Bu Dewi (Beli/Jual)',
                quest_giver: '[E] Lihat Misi dari Pak Budi',
                informant:   '[E] Minta Tips dari Mas Danu',
                ai_lab:      '[E] Konsultasi Dokter Tanaman',
                teacher:     '[E] Buka Modul Belajar Bu Siti',
                crafter:     '[E] Buka Workshop Pak Joko'
            };
            promptStatus.innerText = `💬 ${interactable.npcName || 'NPC'} (${interactable.npcRole || 'Penduduk'})`;
            promptAction.innerText = npcRoleLabel[interactable.npcRoleType] || '[E] Ajak Bicara';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'well') {
            promptStatus.innerText = '🪣 Sumur Air';
            promptAction.innerText = '[E] Ambil Air';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'feed_trough') {
            promptStatus.innerText = '🌽 Tempat Pakan';
            promptAction.innerText = '[E] Isi Pakan';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'water_trough') {
            promptStatus.innerText = '💧 Tempat Minum';
            promptAction.innerText = '[E] Isi Air Minum';
            promptAction.className = 'prompt-action ready';
        } else if (type === 'festival') {
            promptStatus.innerText = '🎪 Area Festival';
            promptAction.innerText = '[E] Lihat Info Festival';
            promptAction.className = 'prompt-action ready';
        } else {
            promptStatus.innerText = interactable.name || '❓';
            promptAction.innerText = interactable.actionText || '[E] Interaksi';
            promptAction.className = 'prompt-action ready';
        }
    }

    // Legacy compat: dipakai oleh onPlotGrowthUpdated
    updateInteractionPrompt(plot) {
        if (!plot) {
            this.updateInteractionTarget(null);
            return;
        }
        if (this.currentInteractionTarget && this.currentInteractionTarget.type === 'plot' &&
            this.currentInteractionTarget.plotRef === plot) {
            this.updateInteractionTarget(this.currentInteractionTarget);
        }
    }

    onPlotGrowthUpdated() {
        if (this.currentInteractionTarget && this.currentInteractionTarget.type === 'plot') {
            this.updateInteractionTarget(this.currentInteractionTarget);
        }
    }

    doInteraction() {
        if (this.currentScreen !== 'game') return;

        const target = this.currentInteractionTarget;
        if (!target) return;

        const type = target.type;

        // ── PETAK TANAH ──────────────────────────────────────────────────────
        if (type === 'plot') {
            const plot = target.plotRef;
            if (!plot) return;
            const cropDef = plot.crop && window.plantsData ? window.plantsData.crops[plot.crop] : null;

            if (!plot.crop || plot.growth <= 0) {
                // Tanam
                const selectedCropDef = window.plantsData.crops[this.selectedSeed];
                const ownedSeeds = this.getInventoryCount(this.selectedSeed);
                if (ownedSeeds <= 0) {
                    this.showToast(`🌱 Benih ${selectedCropDef.name} habis! Beli di Toko Benih.`, 'warning');
                    if (window.appAudio) window.appAudio.play('error');
                    return;
                }
                this.removeFromInventory(this.selectedSeed, 1);
                plot.crop = this.selectedSeed;
                plot.growth = 1;
                plot.isWatered = false;
                plot.harvestReady = false;
                if (window.world3d) window.world3d.updatePlotVisual(plot);
                this.updateHUD();
                this.updateInteractionTarget(target);
                if (window.appAudio) window.appAudio.play('plant');
                this.showToast(`🌱 Menanam ${selectedCropDef.name}! Segera siram.`, 'success');
                this._checkQuestProgress('plant', this.selectedSeed);
                this.saveGame();
                return;
            }

            if (!plot.isWatered && !plot.harvestReady) {
                // Siram
                plot.isWatered = true;
                if (window.world3d) window.world3d.updatePlotVisual(plot);
                this.updateInteractionTarget(target);
                if (window.appAudio) window.appAudio.play('water');
                this.showToast(`💧 Tanaman disiram! Pertumbuhan meningkat 2×!`, 'success');
                this._checkQuestProgress('water', plot.crop);
                this.saveGame();
                return;
            }

            if (plot.harvestReady || plot.growth >= 100) {
                // Panen
                if (!cropDef) return;
                const harvestedCrop = plot.crop;
                const xpEarned = cropDef.xpReward;

                // Masukkan hasil panen ke dalam tas/inventori pemain
                this.addToInventory(harvestedCrop, 1);
                this.addXp(xpEarned);

                plot.crop = null;
                plot.growth = 0;
                plot.isWatered = false;
                plot.harvestReady = false;
                if (window.world3d) window.world3d.updatePlotVisual(plot);
                this.updateHUD();
                this.updateInteractionTarget(target);
                if (window.appAudio) window.appAudio.play('harvest');
                this.showToast(`🌾 Panen 1 ${cropDef.name}! Masuk ke dalam tas (+${xpEarned} XP). Bawa ke Bu Dewi untuk dijual!`, 'success');
                this._checkQuestProgress('harvest', null);
                this.saveGame();
                return;
            }

            if (plot.growth < 100) {
                this.showToast(`🌿 ${cropDef ? cropDef.name : 'Tanaman'} sedang tumbuh (${Math.floor(plot.growth)}%). Tunggu!`, 'info');
            }
            return;
        }

        // ── HEWAN TERNAK ─────────────────────────────────────────────────────
        if (type === 'animal') {
            const animal = target.animalRef;
            if (!animal) return;

            if (animal.hasProduct) {
                const result = animal.harvestProduct();
                if (result) {
                    this.addToInventory(result.productId, 1);
                    this.addXp(result.xpReward || 10);
                    this.updateHUD();
                    if (window.appAudio) window.appAudio.play('harvest');
                    this.showToast(`✨ Mendapat ${result.name}! +${result.xpReward} XP`, 'success');
                    this._checkQuestProgress('collect_product', result.productId);
                    this.saveGame();
                }
                return;
            }

            if (animal.hunger < 60) {
                const feedType = (animal.species === 'ayam' || animal.species === 'bebek') ? 'pakan_unggas' : 'pakan_ruminansia';
                const feedCount = this.getInventoryCount(feedType);
                if (feedCount <= 0) {
                    this.showToast(`🌾 Pakan habis! Beli di Toko Benih.`, 'warning');
                    return;
                }
                this.removeFromInventory(feedType, 1);
                animal.feed();
                this.updateHUD();
                if (window.appAudio) window.appAudio.play('plant');
                this.showToast(`🌽 ${animal.displayName} diberi makan! Lapar berkurang`, 'success');
                this.saveGame();
                return;
            }

            if (animal.thirst < 60) {
                animal.giveWater();
                if (window.appAudio) window.appAudio.play('water');
                this.showToast(`💧 ${animal.displayName} diberi minum! Haus berkurang.`, 'success');
                this.saveGame();
                return;
            }

            // Gunakan vitamin jika hewan tidak sehat dan pemain punya stok
            if (animal.health < 80 && this.getInventoryCount('vitamin_ternak') > 0) {
                this.removeFromInventory('vitamin_ternak', 1);
                animal.health = Math.min(100, animal.health + 40);
                animal.happiness = Math.min(100, animal.happiness + 20);
                this.updateHUD();
                if (window.appAudio) window.appAudio.play('harvest');
                this.showToast(`💊 Vitamin diberikan ke ${animal.displayName}! Kesehatan +40%`, 'success');
                this.addXp(5);
                this.saveGame();
                return;
            }

            animal.pet();
            if (window.appAudio) window.appAudio.play('click');
            this.showToast(`❤️ ${animal.displayName} senang dielus! Kesehatan +2%`, 'success');
            this.saveGame();
            return;
        }

        // ── INTERACTABLE LAINNYA ─────────────────────────────────────────────
        if (type === 'shop') {
            this.openPanel('storeModal');
            return;
        }

        if (type === 'market') {
            this.openPanel('marketModal');
            return;
        }

        if (type === 'warehouse') {
            this.openPanel('inventoryModal');
            return;
        }

        if (type === 'bed') {
            this._doSleep();
            return;
        }

        if (type === 'quest_board') {
            this.openPanel('questBoardModal');
            return;
        }

        if (type === 'npc') {
            const roleType = target.npcRoleType || '';
            const name = target.npcName || '';

            if (roleType === 'merchant' || name.includes('Dewi')) {
                this.openMerchantModal();
                return;
            }
            if (roleType === 'quest_giver' || name.includes('Budi')) {
                this.openQuestModal();
                return;
            }
            if (roleType === 'informant' || name.includes('Danu')) {
                this.openInformantModal(target);
                return;
            }
            if (roleType === 'ai_lab' || name.includes('Aris')) {
                this.openAiLab();
                return;
            }
            if (roleType === 'teacher' || name.includes('Siti') || name.includes('Guru')) {
                this.openTeacherModal();
                return;
            }
            if (roleType === 'crafter' || name.includes('Joko')) {
                this.openCraftingModal();
                return;
            }

            this._openNpcDialog(target);
            return;
        }

        if (type === 'well') {
            if (window.appAudio) window.appAudio.play('water');
            this.showToast('🪣 Air bersih diambil dari sumur!', 'success');
            return;
        }

        if (type === 'feed_trough') {
            this.showToast(`🌽 Tempat pakan. Pakan Unggas: ×${this.getInventoryCount('pakan_unggas')}, Ruminansia: ×${this.getInventoryCount('pakan_ruminansia')}`, 'info');
            return;
        }

        if (type === 'water_trough') {
            this.showToast('💧 Bak air untuk ternak. Dekati hewan dan tekan [E] untuk memberi minum!', 'info');
            return;
        }

        if (type === 'festival') {
            this.showToast('🎪 Festival Panen Kebun Pintar! Rayakan hasil panenmu!', 'info');
            return;
        }
    }

    // ── TIDUR ──────────────────────────────────────────────────────────────
    _doSleep() {
        if (window.world3d && window.world3d.plots) {
            window.world3d.plots.forEach(plot => {
                if (plot.crop && plot.growth > 0 && plot.growth < 100) {
                    if (plot.isWatered) {
                        plot.growth = Math.min(100, plot.growth + 30);
                    } else {
                        plot.growth = Math.min(100, plot.growth + 10);
                    }
                    if (plot.growth >= 100) plot.harvestReady = true;
                    window.world3d.updatePlotVisual(plot);
                }
            });
        }

        if (window.animalManager) {
            window.animalManager.animals.forEach(animal => {
                animal.health = Math.min(100, animal.health + 10);
                animal.happiness = Math.min(100, animal.happiness + 5);
            });
        }

        this.addXp(30);
        if (window.appAudio) window.appAudio.play('levelup');
        this.showToast('🛏️ Tidur nyenyak... Tanaman tumbuh lebih cepat! +30 XP', 'success');
        this.saveGame();
    }

    // ── NPC DIALOG ─────────────────────────────────────────────────────────
    _openNpcDialog(target) {
        const npcName = target.npcName || 'Warga';
        const npcRole = target.npcRole || 'Penduduk Desa';

        const dialogues = {
            'Pak Tani': [
                'Halo! Cuaca hari ini sangat cocok untuk berkebun!',
                'Jangan lupa siram tanamanmu setiap hari ya, Nak.',
                'Sudah tahu manfaat pupuk kompos? Bagus sekali untuk tanah!'
            ],
            'Bu Guru': [
                'Selamat datang di Kebun Pintar! Ayo belajar bersama.',
                'Fotosintesis adalah proses penting bagi tanaman. Sudah dipelajari?',
                'Rajin berlatih di kebun akan meningkatkan levelmu!'
            ],
            'default': [
                'Halo, petani muda! Selamat berkebun!',
                'Dunia kebun sangat menyenangkan, kan?',
                'Jangan lupa rawat hewan ternakmu juga!'
            ]
        };

        const lines = dialogues[npcName] || dialogues['default'];
        const line = lines[Math.floor(Math.random() * lines.length)];

        const nameEl = document.getElementById('npcDialogName');
        const roleEl = document.getElementById('npcDialogRole');
        const textEl = document.getElementById('npcDialogText');

        if (nameEl) nameEl.innerText = npcName;
        if (roleEl) roleEl.innerText = npcRole;
        if (textEl) textEl.innerText = line;

        this.openPanel('npcDialogModal');
        if (window.appAudio) window.appAudio.play('click');
    }

    // ========================================================================
    // SISTEM XP & LEVEL UP
    // ========================================================================
    addXp(amount) {
        this.xp += amount;
        let leveledUp = false;

        while (this.xp >= this.xpRequired) {
            this.xp -= this.xpRequired;
            this.level += 1;
            const bonusCoins = 50;
            this.coins += bonusCoins;
            leveledUp = true;
            this.triggerLevelUpModal(this.level, bonusCoins);
        }

        this.updateHUD();
        this.saveGame();
    }

    triggerLevelUpModal(newLevel, bonus) {
        const levelModal = document.getElementById('levelUpModal');
        const levelText = document.getElementById('levelUpText');
        const bonusText = document.getElementById('levelUpBonusText');

        if (levelText) levelText.innerText = `Selamat! Kamu mencapai Level ${newLevel}.`;
        if (bonusText) bonusText.innerText = `Bonus Koin: +${bonus} 🪙`;

        if (levelModal) levelModal.classList.add('active');
        if (window.appAudio) window.appAudio.play('levelup');
    }

    // ========================================================================
    // TOKO BENIH (SEED SHOP)
    // ========================================================================
    renderSeedShop() {
        const container = document.getElementById('seedShopGrid');
        const coinsDisplay = document.getElementById('shopCoinsDisplay');
        if (!container || !window.plantsData) return;

        if (coinsDisplay) coinsDisplay.innerText = this.coins;
        container.innerHTML = '';

        Object.values(window.plantsData.crops).forEach(crop => {
            const owned = this.getInventoryCount(crop.id);
            const isSelected = this.selectedSeed === crop.id;

            const card = document.createElement('div');
            card.className = `seed-card ${isSelected ? 'selected' : ''}`;
            card.innerHTML = `
                <div class="seed-card-header">
                    <span class="seed-emoji">${crop.emoji}</span>
                    <div>
                        <h4 class="seed-name">${crop.name}</h4>
                        <small class="seed-category">${crop.category}</small>
                    </div>
                </div>
                <p class="seed-desc">${crop.description}</p>
                <div class="seed-stats">
                    <span>🪙 Beli: <strong>${crop.seedPrice}</strong></span>
                    <span>💰 Jual: <strong>${crop.sellPrice}</strong></span>
                    <span>⏱️ Waktu: <strong>${crop.growTime}s</strong></span>
                    <span>🌱 Dimiliki: <strong class="seed-owned-qty">${owned}</strong></span>
                </div>
                <div class="seed-card-actions">
                    <button class="btn-shop-buy" onclick="window.appState.buySeed('${crop.id}')">
                        Beli (🪙 ${crop.seedPrice})
                    </button>
                    <button class="btn-shop-select ${isSelected ? 'active' : ''}" onclick="window.appState.selectSeed('${crop.id}')">
                        ${isSelected ? '✓ Dipilih' : 'Pilih'}
                    </button>
                </div>
            `;
            container.appendChild(card);
        });

        // Pakan Ternak di toko
        const feedSection = document.createElement('div');
        feedSection.className = 'shop-feed-section';
        feedSection.innerHTML = `<h4 style="color:var(--primary-dark);margin:16px 0 8px;grid-column:1/-1;">🌾 Pakan Ternak</h4>`;
        const feeds = [
            { id: 'pakan_unggas', name: 'Pakan Unggas', emoji: '🌽', price: 15, desc: 'Untuk Ayam & Bebek' },
            { id: 'pakan_ruminansia', name: 'Pakan Ruminansia', emoji: '🌿', price: 20, desc: 'Untuk Sapi & Kambing' }
        ];
        feeds.forEach(feed => {
            const owned = this.getInventoryCount(feed.id);
            const card = document.createElement('div');
            card.className = 'seed-card';
            card.innerHTML = `
                <div class="seed-card-header">
                    <span class="seed-emoji">${feed.emoji}</span>
                    <div>
                        <h4 class="seed-name">${feed.name}</h4>
                        <small class="seed-category">${feed.desc}</small>
                    </div>
                </div>
                <div class="seed-stats">
                    <span>🪙 Beli: <strong>${feed.price}</strong></span>
                    <span>📦 Dimiliki: <strong class="seed-owned-qty">${owned}</strong></span>
                </div>
                <div class="seed-card-actions">
                    <button class="btn-shop-buy" onclick="window.appState.buyFeed('${feed.id}', ${feed.price}, '${feed.name}')">
                        Beli (🪙 ${feed.price})
                    </button>
                </div>
            `;
            feedSection.appendChild(card);
        });
        container.appendChild(feedSection);
    }

    buySeed(cropId) {
        const crop = window.plantsData.crops[cropId];
        if (!crop) return;

        if (this.coins < crop.seedPrice) {
            this.showToast('🪙 Koin tidak cukup!', 'error');
            if (window.appAudio) window.appAudio.play('error');
            return;
        }

        this.coins -= crop.seedPrice;
        this.addToInventory(cropId, 1);

        if (window.appAudio) window.appAudio.play('coin');
        this.showToast(`🌱 Berhasil membeli 1 benih ${crop.name}!`, 'success');

        this.updateHUD();
        this.renderSeedShop();
        this.saveGame();
    }

    buyFeed(feedId, price, name) {
        if (this.coins < price) {
            this.showToast('🪙 Koin tidak cukup!', 'error');
            if (window.appAudio) window.appAudio.play('error');
            return;
        }
        this.coins -= price;
        this.addToInventory(feedId, 1);
        if (window.appAudio) window.appAudio.play('coin');
        this.showToast(`✅ Berhasil membeli ${name}!`, 'success');
        this.updateHUD();
        this.renderSeedShop();
        this.saveGame();
    }

    selectSeed(cropId) {
        if (!window.plantsData.crops[cropId]) return;
        this.selectedSeed = cropId;
        if (window.appAudio) window.appAudio.play('click');
        this.updateHUD();
        this.renderSeedShop();
        if (this.currentInteractionTarget && this.currentInteractionTarget.type === 'plot') {
            this.updateInteractionTarget(this.currentInteractionTarget);
        }
        this.saveGame();
    }

    // ========================================================================
    // INVENTORI MODAL
    // ========================================================================
    renderInventoryModal() {
        const container = document.getElementById('inventoryModalBody');
        if (!container) return;

        const sections = [
            {
                title: '🌱 Benih', items: [
                    { id: 'selada', name: 'Selada', emoji: '🥬' },
                    { id: 'wortel', name: 'Wortel', emoji: '🥕' },
                    { id: 'tomat', name: 'Tomat', emoji: '🍅' },
                    { id: 'cabai', name: 'Cabai', emoji: '🌶️' },
                    { id: 'jagung', name: 'Jagung', emoji: '🌽' },
                    { id: 'stroberi', name: 'Stroberi', emoji: '🍓' }
                ]
            },
            {
                title: '🌾 Pakan Ternak', items: [
                    { id: 'pakan_unggas', name: 'Pakan Unggas', emoji: '🌽' },
                    { id: 'pakan_ruminansia', name: 'Pakan Ruminansia', emoji: '🌿' }
                ]
            },
            {
                title: '🐄 Produk Hewani', items: [
                    { id: 'telur_ayam', name: 'Telur Ayam', emoji: '🥚' },
                    { id: 'susu_sapi', name: 'Susu Sapi', emoji: '🥛' },
                    { id: 'wol_kambing', name: 'Wol Kambing', emoji: '🧶' },
                    { id: 'telur_bebek', name: 'Telur Bebek', emoji: '🥚' },
                    { id: 'bulu_bebek', name: 'Bulu Bebek', emoji: '🪶' }
                ]
            },
            {
                title: '🔧 Alat & Suplemen', items: [
                    { id: 'penyiram_emas', name: 'Penyiram Emas', emoji: '💧' },
                    { id: 'pupuk_kompos', name: 'Pupuk Kompos', emoji: '♻️' },
                    { id: 'vitamin_ternak', name: 'Vitamin Ternak', emoji: '💊' }
                ]
            },
            {
                title: '🧺 Hasil Panen', items: [
                    { id: 'selada', name: 'Selada', emoji: '🥬' },
                    { id: 'wortel', name: 'Wortel', emoji: '🥕' },
                    { id: 'tomat', name: 'Tomat', emoji: '🍅' },
                    { id: 'cabai', name: 'Cabai', emoji: '🌶️' },
                    { id: 'jagung', name: 'Jagung', emoji: '🌽' },
                    { id: 'stroberi', name: 'Stroberi', emoji: '🍓' }
                ]
            }
        ];

        container.innerHTML = '';
        sections.forEach(sec => {
            const secDiv = document.createElement('div');
            secDiv.className = 'inv-section';
            secDiv.innerHTML = `<h4 class="inv-section-title">${sec.title}</h4>`;
            const grid = document.createElement('div');
            grid.className = 'inv-grid';
            sec.items.forEach(item => {
                const qty = this.getInventoryCount(item.id);
                const cell = document.createElement('div');
                cell.className = `inv-cell ${qty > 0 ? 'has-item' : 'empty-item'}`;
                cell.innerHTML = `
                    <span class="inv-emoji">${item.emoji}</span>
                    <span class="inv-name">${item.name}</span>
                    <span class="inv-qty">×${qty}</span>
                `;
                grid.appendChild(cell);
            });
            secDiv.appendChild(grid);
            container.appendChild(secDiv);
        });
    }

    // ========================================================================
    // STATUS HEWAN MODAL
    // ========================================================================
    renderAnimalStatusModal() {
        const container = document.getElementById('animalStatusBody');
        if (!container) return;

        if (!window.animalManager || !window.animalManager.animals || window.animalManager.animals.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:20px;">Belum ada hewan di peternakan.</p>';
            return;
        }

        container.innerHTML = '';
        const speciesEmoji = { ayam: '🐔', sapi: '🐄', kambing: '🐐', bebek: '🦆' };

        window.animalManager.animals.forEach(animal => {
            const card = document.createElement('div');
            card.className = 'animal-status-card';

            const emoji = speciesEmoji[animal.species] || '🐾';
            const healthPct = Math.round(animal.health);
            const hungerPct = Math.round(animal.hunger);
            const thirstPct = Math.round(animal.thirst);
            const happyPct = Math.round(animal.happiness);

            const healthColor = healthPct > 60 ? '#4caf50' : healthPct > 30 ? '#ff9800' : '#f44336';
            const hungerColor = hungerPct > 40 ? '#4caf50' : '#ff9800';
            const thirstColor = thirstPct > 40 ? '#2196f3' : '#ff9800';

            card.innerHTML = `
                <div class="animal-card-header">
                    <span class="animal-card-emoji">${emoji}</span>
                    <div>
                        <strong>${animal.displayName}</strong>
                        ${animal.hasProduct ? '<span class="animal-product-ready">📦 Produk Siap!</span>' : ''}
                    </div>
                </div>
                <div class="animal-gauges">
                    <div class="gauge-row">
                        <span>❤️ Kesehatan</span>
                        <div class="gauge-bg"><div class="gauge-fill" style="width:${healthPct}%;background:${healthColor};"></div></div>
                        <span class="gauge-val">${healthPct}%</span>
                    </div>
                    <div class="gauge-row">
                        <span>🍽️ Kenyang</span>
                        <div class="gauge-bg"><div class="gauge-fill" style="width:${hungerPct}%;background:${hungerColor};"></div></div>
                        <span class="gauge-val">${hungerPct}%</span>
                    </div>
                    <div class="gauge-row">
                        <span>💧 Minum</span>
                        <div class="gauge-bg"><div class="gauge-fill" style="width:${thirstPct}%;background:${thirstColor};"></div></div>
                        <span class="gauge-val">${thirstPct}%</span>
                    </div>
                    <div class="gauge-row">
                        <span>😊 Senang</span>
                        <div class="gauge-bg"><div class="gauge-fill" style="width:${happyPct}%;background:#9c27b0;"></div></div>
                        <span class="gauge-val">${happyPct}%</span>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    // ========================================================================
    // MARKET MODAL
    // ========================================================================
    renderMarketModal() {
        const container = document.getElementById('marketBody');
        if (!container) return;

        const sellables = [
            { id: 'selada', name: 'Selada', emoji: '🥬', price: 18 },
            { id: 'wortel', name: 'Wortel', emoji: '🥕', price: 22 },
            { id: 'tomat', name: 'Tomat', emoji: '🍅', price: 30 },
            { id: 'cabai', name: 'Cabai', emoji: '🌶️', price: 35 },
            { id: 'jagung', name: 'Jagung', emoji: '🌽', price: 28 },
            { id: 'stroberi', name: 'Stroberi', emoji: '🍓', price: 55 },
            { id: 'telur_ayam', name: 'Telur Ayam', emoji: '🥚', price: 20 },
            { id: 'susu_sapi', name: 'Susu Sapi', emoji: '🥛', price: 35 },
            { id: 'wol_kambing', name: 'Wol Kambing', emoji: '🧶', price: 40 },
            { id: 'telur_bebek', name: 'Telur Bebek', emoji: '🥚', price: 25 },
            { id: 'bulu_bebek', name: 'Bulu Bebek', emoji: '🪶', price: 30 }
        ];

        const coinsEl = document.getElementById('marketCoins');
        if (coinsEl) coinsEl.innerText = this.coins;

        container.innerHTML = '';
        sellables.forEach(item => {
            const qty = this.getInventoryCount(item.id);
            const row = document.createElement('div');
            row.className = `market-row ${qty === 0 ? 'market-row-empty' : ''}`;
            row.innerHTML = `
                <span class="market-emoji">${item.emoji}</span>
                <div class="market-item-info">
                    <strong>${item.name}</strong>
                    <small>🪙 ${item.price} / unit</small>
                </div>
                <span class="market-qty">×${qty}</span>
                <button class="btn-market-sell" onclick="window.appState.sellItem('${item.id}', ${item.price}, '${item.name}', '${item.emoji}')" ${qty === 0 ? 'disabled' : ''}>
                    Jual 1
                </button>
                <button class="btn-market-sell-all" onclick="window.appState.sellAllItem('${item.id}', ${item.price}, '${item.name}', '${item.emoji}')" ${qty === 0 ? 'disabled' : ''}>
                    Jual Semua
                </button>
            `;
            container.appendChild(row);
        });
    }

    sellItem(itemId, price, name, emoji) {
        if (this.getInventoryCount(itemId) <= 0) return;
        this.removeFromInventory(itemId, 1);
        this.coins += price;
        if (window.appAudio) window.appAudio.play('coin');
        this.showToast(`${emoji} Jual 1 ${name} = +${price} 🪙`, 'success');
        this.updateHUD();
        this.renderMarketModal();
        this.saveGame();
    }

    sellAllItem(itemId, price, name, emoji) {
        const qty = this.getInventoryCount(itemId);
        if (qty <= 0) return;
        const total = qty * price;
        this.inventory[itemId] = 0;
        this.coins += total;
        if (window.appAudio) window.appAudio.play('coin');
        this.showToast(`${emoji} Jual ${qty} ${name} = +${total} 🪙`, 'success');
        this.updateHUD();
        this.renderMarketModal();
        this.saveGame();
    }

    // ========================================================================
    // QUEST BOARD
    // ========================================================================
    _generateDailyQuests() {
        return [
            { id: 'q1', type: 'plant', crop: 'selada', target: 3, current: 0, done: false, reward: 50, title: 'Tanam 3 Selada', desc: 'Tanam 3 benih selada di kebun' },
            { id: 'q2', type: 'water', crop: null, target: 5, current: 0, done: false, reward: 40, title: 'Siram 5 Tanaman', desc: 'Siram tanaman sebanyak 5 kali' },
            { id: 'q3', type: 'harvest', crop: null, target: 2, current: 0, done: false, reward: 80, title: 'Panen 2 Kali', desc: 'Panen hasil kebun 2 kali' },
            { id: 'q4', type: 'collect_product', crop: 'telur_ayam', target: 1, current: 0, done: false, reward: 60, title: 'Kumpulkan Telur Ayam', desc: 'Ambil 1 telur dari Ayam' }
        ];
    }

    _checkQuestProgress(type, data) {
        this.quests.forEach(q => {
            if (q.done) return;
            let matches = false;
            if (q.type === type) {
                if (q.crop === null || q.crop === data) matches = true;
            }
            if (matches) {
                q.current = Math.min(q.target, q.current + 1);
                if (q.current >= q.target) {
                    q.done = true;
                    this.coins += q.reward;
                    this.addXp(q.reward);
                    if (window.appAudio) window.appAudio.play('levelup');
                    this.showToast(`🏆 Quest Selesai: "${q.title}"! +${q.reward} 🪙 +${q.reward} XP`, 'success');
                }
            }
        });
    }

    renderQuestBoard() {
        const container = document.getElementById('questBoardBody');
        if (!container) return;

        container.innerHTML = '';
        this.quests.forEach(q => {
            const pct = Math.round((q.current / q.target) * 100);
            const item = document.createElement('div');
            item.className = `quest-item ${q.done ? 'quest-done' : ''}`;
            item.innerHTML = `
                <div class="quest-header">
                    <strong>${q.done ? '✅' : '📌'} ${q.title}</strong>
                    <span class="quest-reward">🪙 ${q.reward}</span>
                </div>
                <p class="quest-desc">${q.desc}</p>
                <div class="quest-progress-bg">
                    <div class="quest-progress-fill" style="width:${pct}%"></div>
                </div>
                <small>${q.current} / ${q.target} ${q.done ? '— Selesai!' : ''}</small>
            `;
            container.appendChild(item);
        });
    }

    // ========================================================================
    // FITUR NPC PEDAGANG (BU DEWI) — BELI & JUAL LENGKAP
    // ========================================================================
    openMerchantModal() {
        this.merchantTab = 'buy';
        this.openPanel('merchantModal');
    }

    switchMerchantTab(tab) {
        this.merchantTab = tab;
        const btnBuy = document.getElementById('tabBtnMerchantBuy');
        const btnSell = document.getElementById('tabBtnMerchantSell');
        const paneBuy = document.getElementById('merchantTabBuy');
        const paneSell = document.getElementById('merchantTabSell');

        if (tab === 'buy') {
            if (btnBuy) btnBuy.classList.add('active');
            if (btnSell) btnSell.classList.remove('active');
            if (paneBuy) paneBuy.classList.add('active');
            if (paneSell) paneSell.classList.remove('active');
        } else {
            if (btnBuy) btnBuy.classList.remove('active');
            if (btnSell) btnSell.classList.add('active');
            if (paneBuy) paneBuy.classList.remove('active');
            if (paneSell) paneSell.classList.add('active');
        }
        this.renderMerchantModal();
        if (window.appAudio) window.appAudio.play('click');
    }

    filterMerchantBuy(cat) {
        this.merchantCategory = cat;
        const buttons = document.querySelectorAll('.merchant-filter-btn');
        buttons.forEach(btn => {
            if (btn.getAttribute('data-cat') === cat) btn.classList.add('active');
            else btn.classList.remove('active');
        });
        this.renderMerchantBuyGrid(cat);
        if (window.appAudio) window.appAudio.play('click');
    }

    renderMerchantModal() {
        const coinsEl = document.getElementById('merchantCoinsDisplay');
        if (coinsEl) coinsEl.innerText = this.coins;

        if (this.merchantTab === 'buy') {
            this.renderMerchantBuyGrid(this.merchantCategory || 'all');
        } else {
            this.renderMerchantSellList();
        }
    }

    renderMerchantBuyGrid(category = 'all') {
        const container = document.getElementById('merchantBuyGrid');
        if (!container) return;

        const allItems = [
            { id: 'selada', name: 'Bibit Selada', emoji: '🥬', price: 10, cat: 'seed', desc: 'Cepat panen dalam 12 detik. Sangat renyah.' },
            { id: 'wortel', name: 'Bibit Wortel', emoji: '🥕', price: 15, cat: 'seed', desc: 'Panen dalam 16 detik. Sayuran umbi kaya vitamin.' },
            { id: 'tomat', name: 'Bibit Tomat', emoji: '🍅', price: 25, cat: 'seed', desc: 'Panen dalam 22 detik. Buah segar kaya likopen.' },
            { id: 'cabai', name: 'Bibit Cabai', emoji: '🌶️', price: 30, cat: 'seed', desc: 'Panen dalam 28 detik. Pedas dan harga jual tinggi.' },
            { id: 'jagung', name: 'Bibit Jagung', emoji: '🌽', price: 40, cat: 'seed', desc: 'Panen dalam 35 detik. Tongkol manis keemasan.' },
            { id: 'stroberi', name: 'Bibit Stroberi', emoji: '🍓', price: 50, cat: 'seed', desc: 'Panen dalam 45 detik. Buah premium bernilai tinggi.' },
            { id: 'pakan_unggas', name: 'Pakan Unggas', emoji: '🌾', price: 8, cat: 'feed', desc: 'Biji-bijian & bekatul bergizi untuk Ayam & Bebek.' },
            { id: 'pakan_ruminansia', name: 'Pakan Ruminansia', emoji: '🌿', price: 15, cat: 'feed', desc: 'Rumput gajah & hay segar untuk Sapi & Kambing.' },
            { id: 'pupuk_kompos', name: 'Pupuk Kompos Organik', emoji: '🧪', price: 20, cat: 'supply', desc: 'Mempercepat pertumbuhan tanaman 2x lipat.' },
            { id: 'vitamin_ternak', name: 'Vitamin Ternak Alami', emoji: '💊', price: 25, cat: 'supply', desc: 'Memulihkan kesehatan ternak menjadi 100% prima.' },
            { id: 'penyiram_emas', name: 'Gembor Emas Multifungsi', emoji: '✨', price: 250, cat: 'supply', desc: 'Alat menyiram modern tahan lama (+Bonus XP).' }
        ];

        const filtered = category === 'all' ? allItems : allItems.filter(it => it.cat === category);

        container.innerHTML = '';
        filtered.forEach(item => {
            const owned = this.getInventoryCount(item.id);
            const canAfford1 = this.coins >= item.price;
            const canAfford5 = this.coins >= (item.price * 5);

            const card = document.createElement('div');
            card.className = 'merchant-card';
            card.innerHTML = `
                <div class="merchant-card-header">
                    <span class="merchant-card-emoji">${item.emoji}</span>
                    <div class="merchant-card-title-wrap">
                        <div class="merchant-card-name">${item.name}</div>
                        <div class="merchant-card-price">🪙 ${item.price} Koin</div>
                    </div>
                </div>
                <p class="merchant-card-desc">${item.desc}</p>
                <div class="merchant-card-stock">Dimiliki di Tas: <strong>×${owned}</strong></div>
                <div class="merchant-card-btns">
                    <button class="btn-merchant-buy ${canAfford1 ? '' : 'disabled'}" 
                            onclick="window.appState.merchantBuyItem('${item.id}', ${item.price}, 1, '${item.name}')"
                            ${canAfford1 ? '' : 'disabled'}>
                        Beli 1
                    </button>
                    <button class="btn-merchant-buy-more ${canAfford5 ? '' : 'disabled'}" 
                            onclick="window.appState.merchantBuyItem('${item.id}', ${item.price}, 5, '${item.name}')"
                            ${canAfford5 ? '' : 'disabled'}>
                        Beli 5 (🪙 ${item.price * 5})
                    </button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    merchantBuyItem(itemId, price, qty = 1, name = 'Barang') {
        const totalCost = price * qty;
        if (this.coins < totalCost) {
            this.showToast(`🪙 Koin tidak cukup! Butuh ${totalCost} koin.`, 'error');
            if (window.appAudio) window.appAudio.play('error');
            return;
        }

        this.coins -= totalCost;
        this.addToInventory(itemId, qty);

        if (window.appAudio) window.appAudio.play('coin');
        this.showToast(`🛍️ Berhasil membeli ${qty} ${name}! (-${totalCost} 🪙)`, 'success');

        this.updateHUD();
        this.renderMerchantModal();
        this.saveGame();
    }

    renderMerchantSellList() {
        const container = document.getElementById('merchantSellList');
        if (!container) return;

        const sellableCatalog = [
            { id: 'selada', name: 'Hasil Panen Selada', emoji: '🥬', price: 18, type: 'Panen' },
            { id: 'wortel', name: 'Hasil Panen Wortel', emoji: '🥕', price: 24, type: 'Panen' },
            { id: 'tomat', name: 'Hasil Panen Tomat', emoji: '🍅', price: 35, type: 'Panen' },
            { id: 'cabai', name: 'Hasil Panen Cabai', emoji: '🌶️', price: 42, type: 'Panen' },
            { id: 'jagung', name: 'Hasil Panen Jagung', emoji: '🌽', price: 48, type: 'Panen' },
            { id: 'stroberi', name: 'Hasil Panen Stroberi', emoji: '🍓', price: 65, type: 'Panen' },
            { id: 'telur_ayam', name: 'Telur Ayam Segar', emoji: '🥚', price: 20, type: 'Ternak' },
            { id: 'susu_sapi', name: 'Susu Sapi Murni', emoji: '🥛', price: 45, type: 'Ternak' },
            { id: 'wol_kambing', name: 'Wol Kambing Halus', emoji: '🧶', price: 50, type: 'Ternak' },
            { id: 'telur_bebek', name: 'Telur Bebek Segar', emoji: '🥚', price: 28, type: 'Ternak' },
            { id: 'bulu_bebek', name: 'Bulu Bebek Halus', emoji: '🪶', price: 35, type: 'Ternak' }
        ];

        container.innerHTML = '';
        let totalOwnedItems = 0;

        sellableCatalog.forEach(item => {
            const qty = this.getInventoryCount(item.id);
            if (qty > 0) totalOwnedItems += qty;

            const row = document.createElement('div');
            row.className = `merchant-sell-row ${qty === 0 ? 'empty' : 'available'}`;
            row.innerHTML = `
                <span class="sell-row-emoji">${item.emoji}</span>
                <div class="sell-row-info">
                    <strong>${item.name}</strong>
                    <span class="sell-row-sub">Harga Beli Bu Dewi: <strong style="color:var(--primary-dark)">🪙 ${item.price}</strong> / unit • Kategori: ${item.type}</span>
                </div>
                <div class="sell-row-stock">
                    <span class="badge-stock">Tersedia: <strong>${qty}</strong></span>
                </div>
                <div class="sell-row-actions">
                    <button class="btn-sell-unit" 
                            onclick="window.appState.merchantSellItem('${item.id}', ${item.price}, 1, '${item.name}', '${item.emoji}')"
                            ${qty === 0 ? 'disabled' : ''}>
                        Jual 1 (+${item.price} 🪙)
                    </button>
                    <button class="btn-sell-all" 
                            onclick="window.appState.merchantSellItem('${item.id}', ${item.price}, ${qty}, '${item.name}', '${item.emoji}')"
                            ${qty === 0 ? 'disabled' : ''}>
                        Jual Semua (+${qty * item.price} 🪙)
                    </button>
                </div>
            `;
            container.appendChild(row);
        });

        if (totalOwnedItems === 0) {
            const emptyNotice = document.createElement('div');
            emptyNotice.className = 'merchant-empty-sell-notice';
            emptyNotice.innerHTML = `
                <div style="font-size:2.5rem; margin-bottom:8px;">🧺</div>
                <p><strong>Tasmu belum memiliki hasil panen atau produk ternak untuk dijual!</strong></p>
                <small style="color:var(--text-muted)">Silakan panen tanaman di kebun atau ambil telur/susu dari peternakan terlebih dahulu.</small>
            `;
            container.prepend(emptyNotice);
        }
    }

    merchantSellItem(itemId, price, qty = 1, name = 'Barang', emoji = '📦') {
        const owned = this.getInventoryCount(itemId);
        if (owned <= 0 || qty <= 0) {
            this.showToast('Barang tidak mencukupi untuk dijual!', 'warning');
            return;
        }

        const actualQty = Math.min(qty, owned);
        const earnedCoins = price * actualQty;

        this.removeFromInventory(itemId, actualQty);
        this.coins += earnedCoins;

        if (window.appAudio) window.appAudio.play('coin');
        this.showToast(`${emoji} Berhasil menjual ${actualQty} ${name}! (+${earnedCoins} 🪙)`, 'success');

        this._checkQuestProgress('sell', itemId);
        this.updateHUD();
        this.renderMerchantModal();
        this.saveGame();
    }

    // ========================================================================
    // FITUR WORKSHOP & CRAFTING (PAK JOKO)
    // ========================================================================
    openCraftingModal() {
        this.openPanel('craftingModal');
    }

    renderCraftingModal() {
        const container = document.getElementById('craftingRecipesContainer');
        if (!container) return;

        const recipes = [
            {
                id: 'pupuk_kompos',
                title: 'Pupuk Kompos Super Organik',
                emoji: '🧪',
                desc: 'Mengolah sisa hasil panen menjadi pupuk hayati yang mempercepat laju tumbuh tanaman 2x lipat.',
                yieldText: '1 Pupuk Kompos Organik',
                yieldId: 'pupuk_kompos',
                yieldQty: 1,
                xpReward: 25,
                requirements: [
                    { type: 'any_crop', name: '2 Hasil Panen (Sayur/Buah apa saja)', countNeeded: 2 }
                ]
            },
            {
                id: 'pakan_konsentrat',
                title: 'Pakan Konsentrat Komplit',
                emoji: '🌾',
                desc: 'Campuran gilingan jagung dan wortel segar berkalsium tinggi untuk seluruh hewan ternak.',
                yieldText: '2 Pakan Unggas + 2 Pakan Ruminansia',
                yieldId: 'multi_feed',
                yieldQty: 2,
                xpReward: 35,
                requirements: [
                    { id: 'jagung', name: '1 Jagung Segar', countNeeded: 1 },
                    { id: 'wortel', name: '1 Wortel Segar', countNeeded: 1 }
                ]
            },
            {
                id: 'vitamin_ternak',
                title: 'Obat Herbal & Vitamin Ternak',
                emoji: '💊',
                desc: 'Ramuan herbal dari tomat dan selada untuk mengembalikan stamina dan kesehatan hewan ternak 100%.',
                yieldText: '1 Vitamin Ternak',
                yieldId: 'vitamin_ternak',
                yieldQty: 1,
                xpReward: 30,
                requirements: [
                    { id: 'tomat', name: '1 Tomat Segar', countNeeded: 1 },
                    { id: 'selada', name: '1 Selada Segar', countNeeded: 1 }
                ]
            },
            {
                id: 'gembor_emas',
                title: 'Upgrade: Gembor Emas Bertuah',
                emoji: '✨',
                desc: 'Upgrade alat penyiram menjadi Gembor Emas bertuah untuk kesuburan kebun maksimal.',
                yieldText: '1 Gembor Emas Multifungsi',
                yieldId: 'penyiram_emas',
                yieldQty: 1,
                xpReward: 100,
                requirements: [
                    { type: 'coins', name: '100 Koin', countNeeded: 100 },
                    { id: 'susu_sapi', name: '1 Susu Sapi Murni', countNeeded: 1 },
                    { id: 'telur_ayam', name: '1 Telur Ayam Segar', countNeeded: 1 }
                ]
            }
        ];

        container.innerHTML = '';
        recipes.forEach(rcp => {
            let canCraft = true;
            let reqListHtml = '';

            rcp.requirements.forEach(req => {
                let current = 0;
                let meetsReq = false;

                if (req.type === 'coins') {
                    current = this.coins;
                    meetsReq = current >= req.countNeeded;
                    reqListHtml += `<li class="${meetsReq ? 'req-met' : 'req-unmet'}">🪙 ${req.name} (${current} / ${req.countNeeded})</li>`;
                } else if (req.type === 'any_crop') {
                    const cropList = ['selada', 'wortel', 'tomat', 'cabai', 'jagung', 'stroberi'];
                    current = cropList.reduce((sum, c) => sum + this.getInventoryCount(c), 0);
                    meetsReq = current >= req.countNeeded;
                    reqListHtml += `<li class="${meetsReq ? 'req-met' : 'req-unmet'}">🌾 ${req.name} (${current} / ${req.countNeeded})</li>`;
                } else {
                    current = this.getInventoryCount(req.id);
                    meetsReq = current >= req.countNeeded;
                    reqListHtml += `<li class="${meetsReq ? 'req-met' : 'req-unmet'}">📦 ${req.name} (${current} / ${req.countNeeded})</li>`;
                }

                if (!meetsReq) canCraft = false;
            });

            const card = document.createElement('div');
            card.className = `crafting-card ${canCraft ? 'ready' : 'locked'}`;
            card.innerHTML = `
                <div class="crafting-card-header">
                    <span class="crafting-card-emoji">${rcp.emoji}</span>
                    <div>
                        <h4 class="crafting-card-title">${rcp.title}</h4>
                        <span class="crafting-card-yield">Hasil: <strong>${rcp.yieldText}</strong> (+${rcp.xpReward} XP)</span>
                    </div>
                </div>
                <p class="crafting-card-desc">${rcp.desc}</p>
                <div class="crafting-reqs">
                    <strong>Bahan yang Dibutuhkan:</strong>
                    <ul>${reqListHtml}</ul>
                </div>
                <button class="btn-craft ${canCraft ? 'btn-craft-ready' : 'btn-craft-disabled'}" 
                        onclick="window.appState.craftItem('${rcp.id}')"
                        ${canCraft ? '' : 'disabled'}>
                    ${canCraft ? '🔨 Buat Sekarang' : '🔒 Bahan Kurang'}
                </button>
            `;
            container.appendChild(card);
        });
    }

    craftItem(recipeId) {
        if (recipeId === 'pupuk_kompos') {
            const cropList = ['selada', 'wortel', 'tomat', 'cabai', 'jagung', 'stroberi'];
            let needed = 2;
            for (const c of cropList) {
                while (needed > 0 && this.getInventoryCount(c) > 0) {
                    this.removeFromInventory(c, 1);
                    needed--;
                }
            }
            if (needed > 0) {
                this.showToast('Bahan panen tidak cukup untuk membuat kompos!', 'error');
                return;
            }
            this.addToInventory('pupuk_kompos', 1);
            this.addXp(25);
            this.showToast('🧪 Berhasil meracik 1 Pupuk Kompos Organik! (+25 XP)', 'success');
        } else if (recipeId === 'pakan_konsentrat') {
            if (this.getInventoryCount('jagung') < 1 || this.getInventoryCount('wortel') < 1) {
                this.showToast('Bahan pakan konsentrat kurang (butuh 1 Jagung + 1 Wortel)!', 'error');
                return;
            }
            this.removeFromInventory('jagung', 1);
            this.removeFromInventory('wortel', 1);
            this.addToInventory('pakan_unggas', 2);
            this.addToInventory('pakan_ruminansia', 2);
            this.addXp(35);
            this.showToast('🌾 Berhasil meracik Pakan Konsentrat (+2 Pakan Unggas, +2 Pakan Ruminansia, +35 XP)!', 'success');
        } else if (recipeId === 'vitamin_ternak') {
            if (this.getInventoryCount('tomat') < 1 || this.getInventoryCount('selada') < 1) {
                this.showToast('Bahan vitamin kurang (butuh 1 Tomat + 1 Selada)!', 'error');
                return;
            }
            this.removeFromInventory('tomat', 1);
            this.removeFromInventory('selada', 1);
            this.addToInventory('vitamin_ternak', 1);
            this.addXp(30);
            this.showToast('💊 Berhasil membuat 1 Vitamin Ternak Alami! (+30 XP)', 'success');
        } else if (recipeId === 'gembor_emas') {
            if (this.coins < 100 || this.getInventoryCount('susu_sapi') < 1 || this.getInventoryCount('telur_ayam') < 1) {
                this.showToast('Bahan upgrade belum lengkap!', 'error');
                return;
            }
            this.coins -= 100;
            this.removeFromInventory('susu_sapi', 1);
            this.removeFromInventory('telur_ayam', 1);
            this.addToInventory('penyiram_emas', 1);
            this.addXp(100);
            this.showToast('✨ Selamat! Gembor Emas Multifungsi berhasil ditempa! (+100 XP)', 'success');
        }

        if (window.appAudio) window.appAudio.play('levelup');
        this.updateHUD();
        this.renderCraftingModal();
        this.saveGame();
    }

    // ========================================================================
    // FITUR PANDUAN & EDUKASI (MAS DANU)
    // ========================================================================
    openInformantModal(target) {
        this.guideTopic = 'ternak';
        this.openPanel('npcGuideModal');
        this.renderGuideModal();
    }

    renderGuideModal() {
        const nav = document.getElementById('npcGuideTopicNav');
        const content = document.getElementById('npcGuideContent');
        if (!nav || !content) return;

        const topics = [
            {
                id: 'ternak',
                emoji: '🐄',
                title: 'Perawatan Ternak',
                content: `
                    <h3>🐄 Panduan Menjaga Hewan Tetap Produktif</h3>
                    <p>Hewan di peternakan Kebun Pintar (Sapi, Ayam, Kambing, Bebek) memiliki 4 indikator vital: <strong>Kesehatan ❤️, Kenyang 🍽️, Air 💧, dan Kebahagiaan 😊</strong>.</p>
                    <ul>
                        <li><strong>Beri Pakan Teratur:</strong> Gunakan Pakan Unggas untuk ayam dan bebek, serta Pakan Ruminansia untuk sapi dan kambing saat rasa kenyang di bawah 60%.</li>
                        <li><strong>Air Minum Segar:</strong> Dekati hewan dan tekan [E] untuk memberi minum ketika indikator air berkurang.</li>
                        <li><strong>Elus Hewan [E]:</strong> Mengelus hewan meningkatkan kebahagiaan mereka dan mempercepat siklus panen telur, susu, dan wol.</li>
                        <li><strong>Produk Berkualitas:</strong> Hewan bahagia menghasilkan produk berkualitas tinggi yang bisa dijual dengan harga mahal ke Bu Dewi.</li>
                    </ul>
                `
            },
            {
                id: 'tani',
                emoji: '🌱',
                title: 'Efisiensi Berkebun',
                content: `
                    <h3>🌱 Rahasia Panen Melimpah & Cepat</h3>
                    <p>Berkebun secara efisien adalah kunci meraih kekayaan di Kebun Pintar:</p>
                    <ul>
                        <li><strong>Penyiraman Wajib:</strong> Petak tanah yang disiram (cokelat basah) tumbuh <strong>2.2× lebih cepat</strong> dibandingkan tanah kering!</li>
                        <li><strong>Perhatikan Siklus:</strong> Tanaman memiliki 6 tahap pertumbuhan visual mulai dari benih, tunas, hingga matang berbunga.</li>
                        <li><strong>Pupuk Kompos:</strong> Buat pupuk kompos di bengkel Pak Joko dari sisa panen untuk melipatgandakan hasil kebunmu.</li>
                        <li><strong>Tidur di Kasur [E]:</strong> Tidur di rumah mempercepat pertumbuhan tanaman yang sudah disiram!</li>
                    </ul>
                `
            },
            {
                id: 'alat',
                emoji: '🛠️',
                title: 'Penggunaan Alat & Workshop',
                content: `
                    <h3>🛠️ Optimalisasi Alat Pertanian & Kerajinan</h3>
                    <p>Manfaatkan fasilitas desa untuk mempermudah pekerjaan sehari-hari:</p>
                    <ul>
                        <li><strong>Bengkel Pak Joko:</strong> Kunjungi bengkel di dekat gudang untuk meracik pupuk kompos, pakan konsentrat, dan obat herbal gratis menggunakan hasil panen.</li>
                        <li><strong>Toko Bu Dewi:</strong> Beli bibit dalam jumlah banyak untuk menghemat waktu bolak-balik.</li>
                        <li><strong>Papan Misi Pak Budi:</strong> Selesaikan misi harian dari Kepala Desa untuk mengumpulkan bonus koin dan XP secara cepat.</li>
                    </ul>
                `
            },
            {
                id: 'ai',
                emoji: '🤖',
                title: 'Teknologi AI Dokter',
                content: `
                    <h3>🤖 Konsultasi dengan Dr. Aris di Lab AI</h3>
                    <p>Bila tanamanmu mengalami daun menguning, kering, bercak cokelat, atau layu:</p>
                    <ul>
                        <li>Dekati <strong>Dr. Aris</strong> di Gazebo Riset untuk membuka AI Dokter Tanaman berbasis Computer Vision.</li>
                        <li>Upload foto daun atau gunakan kamera untuk mendeteksi apakah tanamanmu Sehat, Kering, Busuk, atau Layu beserta rekomendasi pengobatannya.</li>
                    </ul>
                `
            }
        ];

        nav.innerHTML = '';
        topics.forEach(tp => {
            const btn = document.createElement('button');
            btn.className = `guide-topic-btn ${this.guideTopic === tp.id ? 'active' : ''}`;
            btn.innerHTML = `${tp.emoji} ${tp.title}`;
            btn.onclick = () => {
                this.guideTopic = tp.id;
                this.renderGuideModal();
                if (window.appAudio) window.appAudio.play('click');
            };
            nav.appendChild(btn);
        });

        const activeTopic = topics.find(t => t.id === this.guideTopic) || topics[0];
        content.innerHTML = activeTopic.content;
    }

    claimGuideBonusXp() {
        if (this.guideReadBonus) {
            this.showToast('Kamu sudah mengklaim bonus XP dari Mas Danu hari ini!', 'info');
            return;
        }
        this.guideReadBonus = true;
        this.addXp(10);
        if (window.appAudio) window.appAudio.play('levelup');
        this.showToast('🎓 Hebat! Pemahaman bertani bertambah: +10 XP!', 'success');
        const btn = document.getElementById('btnClaimGuideXp');
        if (btn) {
            btn.innerText = '✅ Pelajaran Terpahami (+10 XP)';
            btn.disabled = true;
        }
    }

    // ========================================================================
    // FITUR NPC LAINNYA (PAK BUDI, DR. ARIS, BU SITI)
    // ========================================================================
    openQuestModal() {
        this.openPanel('questBoardModal');
        this.showToast('📋 Pak Budi: Silakan cek daftar tugas dan pesanan warga desa!', 'info');
    }

    openAiLab() {
        this.showToast('🤖 Dr. Aris: Membuka AI Dokter Tanaman...', 'info');
        this.openPanel('aiPanel');
    }

    openTeacherModal() {
        this.showToast('📚 Bu Siti: Membuka Pusat Belajar Botani & Ensiklopedia Tanaman...', 'info');
        this.openPanel('learnPanel');
    }
    initLearningState() {
        if (!this.readMaterials) {
            try {
                const saved = localStorage.getItem('kebunPintar_readMaterials');
                this.readMaterials = new Set(saved ? JSON.parse(saved) : []);
            } catch (e) {
                this.readMaterials = new Set();
            }
        }
        if (!this.currentLearnCategory) this.currentLearnCategory = 'all';
        if (this.learnSearchQuery === undefined) this.learnSearchQuery = '';
    }

    setLearnCategory(cat) {
        this.initLearningState();
        this.currentLearnCategory = cat;
        if (window.appAudio) window.appAudio.play('click');

        const catBtns = document.querySelectorAll('.learn-cat-btn');
        catBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.cat === cat);
        });

        this.renderLearningMaterials();
    }

    searchLearnMaterials(query) {
        this.initLearningState();
        this.learnSearchQuery = (query || '').toLowerCase().trim();
        this.renderLearningMaterials();
    }

    markMaterialRead(modId) {
        this.initLearningState();
        if (this.readMaterials.has(modId)) return;

        this.readMaterials.add(modId);
        try {
            localStorage.setItem('kebunPintar_readMaterials', JSON.stringify(Array.from(this.readMaterials)));
        } catch (e) {}

        this.addXp(5);
        if (window.appAudio) window.appAudio.play('correct');
        this.showToast('🌟 Materi selesai dipelajari! +5 XP', 'success');
        this.renderLearningMaterials();
    }

    toggleModuleDetail(modId) {
        const contentEl = document.getElementById(`moduleContent_${modId}`);
        const btnEl = document.getElementById(`toggleBtn_${modId}`);
        if (!contentEl || !btnEl) return;

        const isCollapsed = contentEl.classList.contains('collapsed');
        if (isCollapsed) {
            contentEl.classList.remove('collapsed');
            contentEl.classList.add('expanded');
            btnEl.innerHTML = '🔼 Tutup Detail';
            btnEl.classList.add('active');
        } else {
            contentEl.classList.remove('expanded');
            contentEl.classList.add('collapsed');
            btnEl.innerHTML = '📖 Pelajari Lebih Lanjut ▾';
            btnEl.classList.remove('active');
        }
    }

    toggleAllModules(expand = true) {
        const allContents = document.querySelectorAll('.module-content');
        const allBtns = document.querySelectorAll('.btn-toggle-detail');
        allContents.forEach(el => {
            el.classList.toggle('collapsed', !expand);
            el.classList.toggle('expanded', expand);
        });
        allBtns.forEach(btn => {
            btn.innerHTML = expand ? '🔼 Tutup Detail' : '📖 Pelajari Lebih Lanjut ▾';
            btn.classList.toggle('active', expand);
        });
        if (window.appAudio) window.appAudio.play('click');
        this.showToast(expand ? '📂 Semua detail materi dibuka' : '📁 Materi berhasil diringkas', 'info');
    }

    goToGardenFromLearn(cropId) {
        this.closePanels();
        this.showGame();
        if (cropId && this.inventory.hasOwnProperty(cropId)) {
            this.selectedSeed = cropId;
            this.updateHUD();
            const cropName = window.plantsData?.crops[cropId]?.name || cropId;
            this.showToast(`🌱 Benih ${cropName} aktif! Tekan [E] di petak tanah untuk menanam.`, 'success');
        } else {
            this.showToast('🌾 Memasuki simulator kebun 3D!', 'info');
        }
    }

    goToAiDoctorFromLearn(sampleType) {
        this.closePanels();
        this.openPanel('aiPanel');
        if (sampleType && window.aiDoctor && typeof window.aiDoctor.loadSampleLeaf === 'function') {
            window.aiDoctor.loadSampleLeaf(sampleType);
            this.showToast(`🤖 Sampel daun ${sampleType.toUpperCase()} siap dianalisis!`, 'info');
        } else {
            this.showToast('🤖 Selamat datang di AI Dokter! Unggah foto atau uji sampel daun.', 'info');
        }
    }

    renderLearningMaterials() {
        this.initLearningState();
        const container = document.getElementById('learningModulesContainer');
        const progressText = document.getElementById('learnProgressText');
        const progressBar = document.getElementById('learnProgressBar');
        const filterCountEl = document.getElementById('learnFilterCount');
        if (!container || !window.plantsData || !window.plantsData.learningModules) return;

        const allModules = window.plantsData.learningModules;
        const totalCount = allModules.length;
        const readCount = Array.from(this.readMaterials).filter(id => allModules.some(m => m.id === id)).length;
        const progressPct = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0;

        if (progressText) progressText.innerText = `${readCount} / ${totalCount} Materi Selesai (${progressPct}%) • +${readCount * 5} XP`;
        if (progressBar) progressBar.style.width = `${progressPct}%`;

        let filtered = allModules.filter(mod => {
            if (this.currentLearnCategory !== 'all' && mod.category !== this.currentLearnCategory) return false;
            if (this.learnSearchQuery) {
                const q = this.learnSearchQuery;
                return mod.title.toLowerCase().includes(q) ||
                    mod.summary.toLowerCase().includes(q) ||
                    (mod.content || '').toLowerCase().includes(q) ||
                    (mod.categoryName || '').toLowerCase().includes(q);
            }
            return true;
        });

        if (filterCountEl) {
            const catNameMap = {
                all: 'Semua Kategori', dasar: 'Dasar Tanaman', perawatan: 'Perawatan Tanaman',
                hama: 'Hama & Penyakit', tanaman: '10 Jenis Tanaman', ai: 'AI & Pertanian'
            };
            filterCountEl.innerText = `Menampilkan ${filtered.length} dari ${totalCount} Materi (${catNameMap[this.currentLearnCategory] || 'Materi'})`;
        }

        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-schedule-state" style="padding:40px 20px;">
                    <span style="font-size:2.5rem;">🔍</span>
                    <p style="font-weight:700; margin-top:8px;">Materi tidak ditemukan</p>
                    <small>Coba gunakan kata kunci lain.</small>
                </div>
            `;
            return;
        }

        container.innerHTML = '';
        filtered.forEach(mod => {
            const isRead = this.readMaterials.has(mod.id);
            const card = document.createElement('div');
            card.className = `learning-module-card ${isRead ? 'is-read' : ''}`;

            let gardenCrop = null;
            ['selada', 'wortel', 'tomat', 'cabai', 'jagung', 'stroberi'].forEach(c => {
                if (mod.id.includes(c)) gardenCrop = c;
            });

            const isGardenRelated = mod.category === 'tanaman' || mod.category === 'perawatan';

            let aiSample = null;
            if (mod.id.includes('kering') || mod.id.includes('klorosis') || mod.id.includes('kuning')) aiSample = 'kering';
            else if (mod.id.includes('busuk') || mod.id.includes('jamur') || mod.id.includes('bercak')) aiSample = 'busuk';
            else if (mod.id.includes('layu') || mod.id.includes('dehidrasi')) aiSample = 'layu';
            else if (mod.id.includes('sehat')) aiSample = 'healthy';

            const isAiRelated = mod.category === 'hama' || mod.category === 'ai';

            card.innerHTML = `
                <div class="module-header">
                    <span class="module-icon">${mod.icon}</span>
                    <div style="flex:1;">
                        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px;">
                            <span class="module-cat-tag cat-${mod.category}">${mod.categoryName || 'Botani'}</span>
                            ${isRead ? '<span class="module-read-badge">✅ Selesai Dibaca</span>' : ''}
                        </div>
                        <h4 class="module-title" style="margin-top:4px;">${mod.title}</h4>
                    </div>
                </div>
                <div class="module-summary-quote">"${mod.summary}"</div>
                ${mod.flowDiagram ? `
                    <div class="flow-diagram-box">
                        <span class="flow-label">ALUR PROSES / SIKLUS:</span>
                        <div class="flow-text">${mod.flowDiagram}</div>
                    </div>
                ` : ''}
                <div id="moduleContent_${mod.id}" class="module-content collapsed">
                    ${mod.content}
                    ${mod.keyTakeaway ? `<div class="key-takeaway-box"><strong>💡 Poin Inti:</strong> ${mod.keyTakeaway}</div>` : ''}
                </div>
                <div class="module-card-footer">
                    <div class="footer-btn-left">
                        <button id="toggleBtn_${mod.id}" class="btn-card-action btn-toggle-detail" onclick="window.appState.toggleModuleDetail('${mod.id}')">
                            📖 Pelajari Lebih Lanjut ▾
                        </button>
                        ${isGardenRelated ? `
                            <button class="btn-card-action btn-garden" onclick="window.appState.goToGardenFromLearn('${gardenCrop || ''}')">
                                🎮 Praktik di Kebun 3D
                            </button>
                        ` : ''}
                        ${isAiRelated ? `
                            <button class="btn-card-action btn-ai" onclick="window.appState.goToAiDoctorFromLearn('${aiSample || ''}')">
                                🤖 Cek di AI Dokter
                            </button>
                        ` : ''}
                    </div>
                    <div class="footer-btn-right">
                        <button class="btn-card-action btn-quiz" onclick="switchLearnTab('kuis')">🎯 Uji di Kuis</button>
                        ${isRead ? `
                            <button class="btn-card-action btn-read done" disabled>✓ Sudah Dipelajari (+5 XP)</button>
                        ` : `
                            <button class="btn-card-action btn-read action" onclick="window.appState.markMaterialRead('${mod.id}')">
                                ✨ Tandai Selesai (+5 XP)
                            </button>
                        `}
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    initQuiz() {
        this.quizState.currentIndex = 0;
        this.quizState.score = 0;
        this.quizState.answered = false;
        this.renderCurrentQuizQuestion();
    }

    renderCurrentQuizQuestion() {
        const questionCard = document.getElementById('quizQuestionCard');
        const resultCard = document.getElementById('quizResultSummary');
        if (!questionCard || !window.plantsData) return;

        const questions = window.plantsData.quizQuestions;
        if (this.quizState.currentIndex >= questions.length) {
            questionCard.style.display = 'none';
            if (resultCard) {
                resultCard.style.display = 'block';
                document.getElementById('quizFinalScore').innerText = `${this.quizState.score} / ${questions.length}`;
                const earnedXP = this.quizState.score * 10;
                document.getElementById('quizEarnedXp').innerText = `+${earnedXP} XP Diperoleh!`;
                this.addXp(earnedXP);
            }
            return;
        }

        questionCard.style.display = 'block';
        if (resultCard) resultCard.style.display = 'none';

        const q = questions[this.quizState.currentIndex];
        this.quizState.answered = false;

        document.getElementById('quizCounter').innerText = `Pertanyaan ${this.quizState.currentIndex + 1} dari ${questions.length}`;
        document.getElementById('quizQuestionText').innerText = q.question;

        const feedbackBox = document.getElementById('quizFeedback');
        feedbackBox.style.display = 'none';
        feedbackBox.className = 'quiz-feedback';

        const optionsContainer = document.getElementById('quizOptionsList');
        optionsContainer.innerHTML = '';

        q.options.forEach((optText, idx) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option-btn';
            btn.innerHTML = `<span class="option-letter">${String.fromCharCode(65 + idx)}.</span> ${optText}`;
            btn.onclick = () => this.answerQuiz(idx);
            optionsContainer.appendChild(btn);
        });
    }

    answerQuiz(selectedIndex) {
        if (this.quizState.answered) return;
        this.quizState.answered = true;

        const q = window.plantsData.quizQuestions[this.quizState.currentIndex];
        const isCorrect = selectedIndex === q.correct;
        const optionsBtns = document.querySelectorAll('.quiz-option-btn');
        const feedbackBox = document.getElementById('quizFeedback');

        optionsBtns.forEach((btn, idx) => {
            btn.disabled = true;
            if (idx === q.correct) btn.classList.add('correct');
            else if (idx === selectedIndex) btn.classList.add('wrong');
        });

        if (isCorrect) {
            this.quizState.score++;
            feedbackBox.className = 'quiz-feedback correct';
            feedbackBox.innerHTML = `<strong>✅ Benar! +10 XP</strong><br>${q.explanation}`;
            if (window.appAudio) window.appAudio.play('correct');
        } else {
            feedbackBox.className = 'quiz-feedback wrong';
            feedbackBox.innerHTML = `<strong>❌ Kurang tepat.</strong><br>${q.explanation}`;
            if (window.appAudio) window.appAudio.play('wrong');
        }

        feedbackBox.style.display = 'block';

        const nextBtn = document.getElementById('quizNextBtn');
        if (nextBtn) {
            nextBtn.style.display = 'inline-block';
            nextBtn.onclick = () => {
                nextBtn.style.display = 'none';
                this.quizState.currentIndex++;
                this.renderCurrentQuizQuestion();
            };
        }
    }

    // ========================================================================
    // PERBARUI HUD GAME
    // ========================================================================
    updateHUD() {
        const coinsEl = document.getElementById('hudCoins');
        const levelEl = document.getElementById('hudLevel');
        const xpTextEl = document.getElementById('hudXpText');
        const xpBarEl = document.getElementById('hudXpBar');
        const seedNameEl = document.getElementById('hudSeedName');
        const seedCountEl = document.getElementById('hudSeedCount');
        const seedEmojiEl = document.getElementById('hudSeedEmoji');

        if (coinsEl) coinsEl.innerText = this.coins;
        if (levelEl) levelEl.innerText = this.level;
        if (xpTextEl) xpTextEl.innerText = `${this.xp} / ${this.xpRequired} XP`;
        if (xpBarEl) {
            const pct = Math.min(100, Math.round((this.xp / this.xpRequired) * 100));
            xpBarEl.style.width = pct + '%';
        }

        if (window.plantsData) {
            const crop = window.plantsData.crops[this.selectedSeed];
            if (crop) {
                if (seedNameEl) seedNameEl.innerText = crop.name;
                if (seedEmojiEl) seedEmojiEl.innerText = crop.emoji;
                if (seedCountEl) seedCountEl.innerText = this.getInventoryCount(this.selectedSeed);
            }
        }
    }

    // Floating Toast Notification
    showToast(message, type = 'info') {
        let toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toastContainer';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerText = message;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 2800);
    }
}

// Inisialisasi State Global
window.appState = new AppState();

// Ekspos Fungsi Global
window.openPanel = function(id) { window.appState.openPanel(id); };
window.closePanels = function() { window.appState.closePanels(); };
window.showGame = function() { window.appState.showGame(); };
window.showHome = function() { window.appState.showHome(); };
window.doInteraction = function() { window.appState.doInteraction(); };
window.buySeed = function(id) { window.appState.buySeed(id); };
window.selectSeed = function(id) { window.appState.selectSeed(id); };
window.answerQuiz = function(idx) { window.appState.answerQuiz(idx); };
window.setLearnCategory = function(cat) { window.appState.setLearnCategory(cat); };
window.searchLearnMaterials = function(q) { window.appState.searchLearnMaterials(q); };
window.markMaterialRead = function(id) { window.appState.markMaterialRead(id); };
window.toggleModuleDetail = function(id) { window.appState.toggleModuleDetail(id); };
window.toggleAllModules = function(expand) { window.appState.toggleAllModules(expand); };
window.goToGardenFromLearn = function(cropId) { window.appState.goToGardenFromLearn(cropId); };
window.goToAiDoctorFromLearn = function(sampleType) { window.appState.goToAiDoctorFromLearn(sampleType); };

// Fungsi Audio Global
window.toggleSound = function() {
    return window.appAudio ? window.appAudio.toggleSound() : false;
};
window.startBackgroundMusic = function() {
    if (window.appAudio) window.appAudio.startBackgroundMusic();
};
window.stopBackgroundMusic = function() {
    if (window.appAudio) window.appAudio.stopBackgroundMusic();
};
window.playSfx = function(type) {
    if (window.appAudio) window.appAudio.playSfx(type);
};

// Setup saat Dokumen HTML Selesai Dimuat
document.addEventListener('DOMContentLoaded', () => {
    window.appState.updateHUD();
    window.appState.renderLearningMaterials();
    if (window.appAudio) window.appAudio.updateAudioIcons();
});
