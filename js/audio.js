/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/audio.js
 * Deskripsi: Sistem audio lengkap berbasis Web Audio API murni.
 * Menyediakan Sound Effect (SFX) dan Background Music (BGM) santai bertema kebun yang looping,
 * tanpa membutuhkan file MP3 eksternal (100% bebas error 404).
 */

class SoundSystem {
    constructor() {
        this.ctx = null;
        this.muted = false;

        // Master Gain Nodes
        this.sfxGainNode = null;
        this.bgmGainNode = null;

        // Status Background Music (BGM)
        this.bgmPlaying = false;
        this.bgmTimer = null;
        this.nextNoteTime = 0;
        this.currentStep = 0;
        this.stepDuration = 0.28; // Durasi per nada (~107 BPM, santai & mengalir)
        this.bgmVolume = 0.12;    // Volume BGM lembut di latar belakang

        // Partitur Musik Kebun Santai (32 Langkah / 8 Bar Melodi Harmonis Stardew/Harvest Moon Style)
        // Frekuensi standar (Hz): C, D, E, G, A pentatonik dengan akord C - F - Am - G
        this.bgmScore = [
            // Bar 1: C Major (C4 - E4 - G4)
            { bass: 130.81, chord: 392.00, melody: 659.25 }, // C3, G4, E5
            { melody: 523.25 },                              // C5
            { melody: 587.33 },                              // D5
            { melody: 659.25 },                              // E5
            // Bar 2: F Major (F2 - C5 - A4)
            { bass: 87.31, chord: 349.23, melody: 587.33 },  // F2, F4, D5
            { melody: 440.00 },                              // A4
            { melody: 523.25 },                              // C5
            { melody: 587.33 },                              // D5
            // Bar 3: A Minor (A2 - E4 - E5)
            { bass: 110.00, chord: 329.63, melody: 659.25 }, // A2, E4, E5
            { melody: 783.99 },                              // G5
            { melody: 880.00 },                              // A5
            { melody: 783.99 },                              // G5
            // Bar 4: G Major (G2 - G4 - E5)
            { bass: 98.00, chord: 392.00, melody: 659.25 },  // G2, G4, E5
            { melody: 587.33 },                              // D5
            { melody: 523.25 },                              // C5
            { melody: 493.88 },                              // B4

            // Bar 5: Variasi C Major
            { bass: 130.81, chord: 392.00, melody: 783.99 }, // C3, G4, G5
            { melody: 659.25 },                              // E5
            { melody: 587.33 },                              // D5
            { melody: 523.25 },                              // C5
            // Bar 6: Variasi F Major
            { bass: 87.31, chord: 440.00, melody: 523.25 },  // F2, A4, C5
            { melody: 587.33 },                              // D5
            { melody: 659.25 },                              // E5
            { melody: 783.99 },                              // G5
            // Bar 7: Variasi A Minor
            { bass: 110.00, chord: 329.63, melody: 880.00 }, // A2, E4, A5
            { melody: 783.99 },                              // G5
            { melody: 659.25 },                              // E5
            { melody: 523.25 },                              // C5
            // Bar 8: Penutup Menuju Loop (G Major)
            { bass: 98.00, chord: 392.00, melody: 587.33 },  // G2, G4, D5
            { melody: 493.88 },                              // B4
            { melody: 440.00 },                              // A4
            { melody: 392.00 }                               // G4
        ];

        // Cek pengaturan suara tersimpan di localStorage
        const savedMute = localStorage.getItem('kebunPintar_muted');
        if (savedMute !== null) {
            this.muted = savedMute === 'true';
        }
    }

    // Inisialisasi AudioContext tunggal (tidak dibuat berkali-kali)
    initContext() {
        if (!this.ctx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();

                // Master Gain untuk SFX
                this.sfxGainNode = this.ctx.createGain();
                this.sfxGainNode.gain.setValueAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime);
                this.sfxGainNode.connect(this.ctx.destination);

                // Master Gain untuk BGM
                this.bgmGainNode = this.ctx.createGain();
                this.bgmGainNode.gain.setValueAtTime(this.muted ? 0 : this.bgmVolume, this.ctx.currentTime);
                this.bgmGainNode.connect(this.ctx.destination);
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Toggle mute/unmute suara (Speaker 🔊 / 🔇)
    toggleSound() {
        this.muted = !this.muted;
        localStorage.setItem('kebunPintar_muted', this.muted);
        this.updateAudioIcons();

        if (this.ctx) {
            const now = this.ctx.currentTime;
            if (this.muted) {
                // Matikan suara BGM & SFX
                if (this.bgmGainNode) {
                    this.bgmGainNode.gain.setValueAtTime(0, now);
                }
                if (this.sfxGainNode) {
                    this.sfxGainNode.gain.setValueAtTime(0, now);
                }
            } else {
                // Aktifkan kembali suara
                if (this.sfxGainNode) {
                    this.sfxGainNode.gain.setValueAtTime(0.85, now);
                }
                if (this.bgmGainNode) {
                    this.bgmGainNode.gain.setValueAtTime(this.bgmVolume, now);
                }
                // Jika sedang berada di game dan BGM belum jalan, mulai BGM
                if (window.appState && window.appState.currentScreen === 'game' && !this.bgmPlaying) {
                    this.startBackgroundMusic();
                }
                this.playSfx('click');
            }
        }

        return this.muted;
    }

    // Perbarui ikon audio pada UI
    updateAudioIcons() {
        const audioBtns = document.querySelectorAll('.sound-toggle-btn');
        audioBtns.forEach(btn => {
            btn.innerHTML = this.muted ? '🔇' : '🔊';
            btn.setAttribute('title', this.muted ? 'Nyalakan Suara' : 'Matikan Suara');
        });
    }

    // ========================================================================
    // BACKGROUND MUSIC (BGM) SYSTEM
    // ========================================================================

    // Mulai Background Music ketika user masuk ke game 3D
    startBackgroundMusic() {
        if (this.bgmPlaying) return; // Mencegah multiple BGM berjalan bersamaan

        this.initContext();
        if (!this.ctx) return;

        this.bgmPlaying = true;
        this.currentStep = 0;
        this.nextNoteTime = this.ctx.currentTime + 0.1;

        // Set volume BGM
        if (this.bgmGainNode) {
            this.bgmGainNode.gain.setValueAtTime(this.muted ? 0 : this.bgmVolume, this.ctx.currentTime);
        }

        // Hentikan interval lama jika ada
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
        }

        // Jalankan penjadwal nada (Lookahead Scheduler)
        this.bgmTimer = setInterval(() => {
            this._scheduleBgm();
        }, 100);
    }

    // Hentikan/Pause Background Music saat user keluar dari game
    stopBackgroundMusic() {
        this.bgmPlaying = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }

        // Fade out halus
        if (this.bgmGainNode && this.ctx) {
            const now = this.ctx.currentTime;
            this.bgmGainNode.gain.cancelScheduledValues(now);
            this.bgmGainNode.gain.linearRampToValueAtTime(0.0001, now + 0.2);
        }
    }

    // Penjadwal BGM presisi waktu Web Audio API (tidak drift / tidak delay)
    _scheduleBgm() {
        if (!this.bgmPlaying || !this.ctx) return;

        // Jadwalkan semua nada dalam jendela 300ms ke depan
        while (this.nextNoteTime < this.ctx.currentTime + 0.3) {
            const stepData = this.bgmScore[this.currentStep];
            if (stepData) {
                this._playBgmStep(stepData, this.nextNoteTime);
            }
            this.nextNoteTime += this.stepDuration;
            this.currentStep = (this.currentStep + 1) % this.bgmScore.length;
        }
    }

    // Mainkan satu langkah nada BGM (Bass, Akord lembut, & Melodi Kalimba)
    _playBgmStep(stepData, time) {
        if (!this.ctx || !this.bgmGainNode) return;

        // 1. Melodi Utama (Instrumen Kalimba / Music Box: Sine murni hangat)
        if (stepData.melody) {
            this._synthesizeNote(stepData.melody, 'sine', 0.32, 0.28, time, this.bgmGainNode);
        }

        // 2. Akord Pengiring (Harmoni Lembut)
        if (stepData.chord) {
            this._synthesizeNote(stepData.chord, 'sine', 0.45, 0.14, time, this.bgmGainNode);
        }

        // 3. Nada Bass (Hangat & Lembut di Bawah)
        if (stepData.bass) {
            this._synthesizeBass(stepData.bass, time, this.bgmGainNode);
        }
    }

    // Sintesis nada melodi lembut dengan envelope ADSR
    _synthesizeNote(freq, type, duration, volume, time, targetNode) {
        try {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);

            // Envelope petikan lembut (attack cepat, decay santai)
            noteGain.gain.setValueAtTime(0.0001, time);
            noteGain.gain.linearRampToValueAtTime(volume, time + 0.012);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

            osc.connect(noteGain);
            noteGain.connect(targetNode);

            osc.start(time);
            osc.stop(time + duration + 0.05);
        } catch (e) {
            // Ignored
        }
    }

    // Sintesis nada bass lembut dengan lowpass filter
    _synthesizeBass(freq, time, targetNode) {
        try {
            const osc = this.ctx.createOscillator();
            const noteGain = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, time);

            // Filter frekuensi tinggi agar bass bulat dan tidak menusuk
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(240, time);

            noteGain.gain.setValueAtTime(0.0001, time);
            noteGain.gain.linearRampToValueAtTime(0.24, time + 0.03);
            noteGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);

            osc.connect(filter);
            filter.connect(noteGain);
            noteGain.connect(targetNode);

            osc.start(time);
            osc.stop(time + 0.6);
        } catch (e) {
            // Ignored
        }
    }

    // ========================================================================
    // SOUND EFFECTS (SFX) SYSTEM
    // ========================================================================

    // Mainkan SFX (bisa dipanggil dengan playSfx atau play)
    playSfx(soundType) {
        this.play(soundType);
    }

    play(soundType) {
        if (this.muted) return;
        this.initContext();
        if (!this.ctx || !this.sfxGainNode) return;

        const now = this.ctx.currentTime;

        switch (soundType) {
            case 'click':
                this._playTone(480, 'sine', 0.05, 0.15, now);
                break;

            case 'plant':
                // Suara gembur menanam benih (sliding pitch ke bawah)
                this._playSlideTone(220, 110, 'triangle', 0.15, 0.25, now);
                break;

            case 'water':
                // Suara percikan air (chord nada lembut)
                this._playTone(380, 'sine', 0.12, 0.2, now);
                this._playTone(520, 'triangle', 0.15, 0.15, now + 0.05);
                this._playTone(660, 'sine', 0.18, 0.1, now + 0.09);
                break;

            case 'harvest':
                // Arpeggio ceria saat memanen tanaman (C5 - E5 - G5 - C6)
                this._playTone(523.25, 'sine', 0.12, 0.22, now);
                this._playTone(659.25, 'sine', 0.12, 0.22, now + 0.08);
                this._playTone(783.99, 'sine', 0.12, 0.22, now + 0.16);
                this._playTone(1046.50, 'triangle', 0.25, 0.32, now + 0.24);
                break;

            case 'levelup':
                // Fanfare meriah saat naik level
                this._playTone(440, 'triangle', 0.18, 0.25, now);
                this._playTone(554.37, 'triangle', 0.18, 0.25, now + 0.12);
                this._playTone(659.25, 'triangle', 0.18, 0.25, now + 0.24);
                this._playTone(880, 'sine', 0.45, 0.35, now + 0.36);
                this._playTone(1108.73, 'triangle', 0.5, 0.3, now + 0.48);
                break;

            case 'coin':
                // Suara koin berdering
                this._playTone(987.77, 'sine', 0.08, 0.2, now);
                this._playTone(1318.51, 'sine', 0.2, 0.25, now + 0.06);
                break;

            case 'error':
                // Nada peringatan lembut jika benih habis atau koin kurang
                this._playTone(180, 'square', 0.15, 0.15, now);
                this._playTone(140, 'square', 0.2, 0.15, now + 0.12);
                break;

            case 'correct':
                // Nada jawaban kuis benar
                this._playTone(587.33, 'sine', 0.12, 0.2, now);
                this._playTone(880.00, 'triangle', 0.25, 0.25, now + 0.1);
                break;

            case 'wrong':
                // Nada jawaban kuis salah
                this._playTone(280, 'sawtooth', 0.2, 0.12, now);
                this._playTone(220, 'sawtooth', 0.3, 0.12, now + 0.12);
                break;

            default:
                this._playTone(440, 'sine', 0.08, 0.1, now);
        }
    }

    // Helper SFX: Nada tunggal
    _playTone(freq, type, duration, volume, startTime) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(freq, startTime);

            gain.gain.setValueAtTime(0.0001, startTime);
            gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.sfxGainNode || this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        } catch (e) {
            // Ignored
        }
    }

    // Helper SFX: Nada geser (pitch bend)
    _playSlideTone(startFreq, endFreq, type, duration, volume, startTime) {
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = type;
            osc.frequency.setValueAtTime(startFreq, startTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), startTime + duration);

            gain.gain.setValueAtTime(volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

            osc.connect(gain);
            gain.connect(this.sfxGainNode || this.ctx.destination);

            osc.start(startTime);
            osc.stop(startTime + duration + 0.05);
        } catch (e) {
            // Ignored
        }
    }
}

// Inisialisasi Audio Global
window.appAudio = new SoundSystem();

// Ekspos fungsi global yang diminta spesifikasi project
window.toggleSound = function() {
    return window.appAudio.toggleSound();
};

window.startBackgroundMusic = function() {
    window.appAudio.startBackgroundMusic();
};

window.stopBackgroundMusic = function() {
    window.appAudio.stopBackgroundMusic();
};

window.playSfx = function(soundType) {
    window.appAudio.playSfx(soundType);
};
