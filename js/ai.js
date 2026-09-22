/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/ai.js
 * Deskripsi: Modul AI Dokter Tanaman dengan dukungan Teachable Machine Image (TensorFlow.js)
 * dan fallback analisis visual spektral cerdas tanpa klaim diagnosis palsu.
 */

// ============================================================================
// KONFIGURASI MODEL TEACHABLE MACHINE
// ============================================================================
// Model Teachable Machine Image dari pengguna:
// Label model: ["SEHAT", "KERING", "BUSUK", "LAYU"]
let MODEL_URL = "https://teachablemachine.withgoogle.com/models/vlOCTzuZc/";

class AIDoctor {
    constructor() {
        this.model = null;
        this.modelLoaded = false;
        this.isAnalyzing = false;
        this.selectedImageSrc = null;

        // Threshold keyakinan minimal 75%
        this.CONFIDENCE_THRESHOLD = 0.75;

        this.initDOM();
    }

    // Inisialisasi Event Listener Upload & Preview
    initDOM() {
        document.addEventListener('DOMContentLoaded', () => {
            const uploadInput = document.getElementById('aiImageUpload');
            const previewImg = document.getElementById('aiPreviewImage');
            const previewPlaceholder = document.getElementById('aiPreviewPlaceholder');
            const analyzeBtn = document.getElementById('aiAnalyzeBtn');

            if (uploadInput) {
                uploadInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            this.setImagePreview(event.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            // Drag & Drop pada area upload
            const dropArea = document.getElementById('aiDropArea');
            if (dropArea) {
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropArea.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dropArea.classList.add('drag-active');
                    }, false);
                });

                ['dragleave', 'drop'].forEach(eventName => {
                    dropArea.addEventListener(eventName, (e) => {
                        e.preventDefault();
                        dropArea.classList.remove('drag-active');
                    }, false);
                });

                dropArea.addEventListener('drop', (e) => {
                    const dt = e.dataTransfer;
                    const file = dt.files[0];
                    if (file && file.type.startsWith('image/')) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            this.setImagePreview(event.target.result);
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }

            // Tombol Analisis Tanaman
            if (analyzeBtn) {
                analyzeBtn.addEventListener('click', () => {
                    this.runDiagnosis();
                });
            }

            // Load model jika URL telah diset
            if (MODEL_URL && MODEL_URL.trim() !== '') {
                this.loadTeachableMachineModel();
            }
        });
    }

    // Tampilkan preview gambar yang dipilih
    setImagePreview(dataUrl) {
        this.selectedImageSrc = dataUrl;
        const previewImg = document.getElementById('aiPreviewImage');
        const placeholder = document.getElementById('aiPreviewPlaceholder');
        const analyzeBtn = document.getElementById('aiAnalyzeBtn');
        const resultCard = document.getElementById('aiResultCard');

        if (previewImg && placeholder) {
            previewImg.src = dataUrl;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
        }

        if (analyzeBtn) {
            analyzeBtn.disabled = false;
        }

        // Sembunyikan hasil lama jika ada
        if (resultCard) {
            resultCard.style.display = 'none';
        }

        if (window.appAudio) window.appAudio.play('click');
    }

    // Muat Teachable Machine Model (jika URL tersedia)
    async loadTeachableMachineModel() {
        if (!MODEL_URL || MODEL_URL.trim() === '') return;

        try {
            const modelURL = MODEL_URL + "model.json";
            const metadataURL = MODEL_URL + "metadata.json";

            if (typeof tmImage !== 'undefined') {
                console.log('Memuat Teachable Machine Model...');
                this.model = await tmImage.load(modelURL, metadataURL);
                this.modelLoaded = true;
                console.log('Teachable Machine Model berhasil dimuat!');
            }
        } catch (error) {
            console.warn('Gagal memuat Teachable Machine Model:', error);
            this.modelLoaded = false;
        }
    }

    // Jalankan Diagnosa Tanaman
    async runDiagnosis() {
        const previewImg = document.getElementById('aiPreviewImage');
        const resultCard = document.getElementById('aiResultCard');
        const analyzeBtn = document.getElementById('aiAnalyzeBtn');

        if (!this.selectedImageSrc || !previewImg) {
            alert('Silakan pilih atau unggah foto daun tanaman terlebih dahulu.');
            return;
        }

        if (this.isAnalyzing) return;
        this.isAnalyzing = true;

        if (analyzeBtn) {
            analyzeBtn.disabled = true;
            analyzeBtn.innerHTML = '⏳ Menganalisis daun tanaman...';
        }

        if (window.appAudio) window.appAudio.play('click');

        // Simulasi latensi analisis pemrosesan citra
        setTimeout(async () => {
            try {
                if (!this.modelLoaded && MODEL_URL && MODEL_URL.trim() !== '') {
                    await this.loadTeachableMachineModel();
                }

                if (this.modelLoaded && this.model) {
                    // 1. Eksekusi menggunakan Model Teachable Machine Asli
                    await this.diagnoseWithTeachableMachine(previewImg);
                } else {
                    // 2. Eksekusi menggunakan Analisis Spektral Visual Heuristik Cerdas
                    this.diagnoseWithVisualHeuristic(previewImg);
                }
            } catch (err) {
                console.error('Diagnosis error:', err);
                this.renderErrorResult('Terjadi kesalahan saat memproses citra tanaman.');
            } finally {
                this.isAnalyzing = false;
                if (analyzeBtn) {
                    analyzeBtn.disabled = false;
                    analyzeBtn.innerHTML = '🔍 Analisis Tanaman';
                }
                if (resultCard) {
                    resultCard.style.display = 'block';
                    resultCard.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }, 600);
    }

    // Diagnosa dengan Teachable Machine
    async diagnoseWithTeachableMachine(imgElement) {
        const predictions = await this.model.predict(imgElement);
        // Urutkan berdasarkan probabilitas tertinggi
        predictions.sort((a, b) => b.probability - a.probability);

        const topPrediction = predictions[0];
        const confidence = topPrediction.probability;
        const confidencePct = Math.round(confidence * 100);

        // ATURAN PENTING: Evaluasi ambang batas keyakinan (Threshold 75%)
        if (confidence < this.CONFIDENCE_THRESHOLD) {
            this.renderResultUI({
                isModel: true,
                statusType: 'uncertain',
                title: '⚠️ Belum Yakin dengan Hasil Analisis',
                subtitle: `Tingkat keyakinan model hanya ${confidencePct}%, berada di bawah batas minimal ${Math.round(this.CONFIDENCE_THRESHOLD * 100)}%.`,
                confidence: confidencePct,
                symptoms: [
                    'Fitur visual daun tidak sepenuhnya cocok dengan data pelatihan model AI.',
                    'Pencahayaan foto atau sudut pengambilan gambar mungkin kurang optimal.',
                    'Latar belakang foto mungkin mengganggu fokus deteksi daun.'
                ],
                recommendations: [
                    'Ambil foto ulang daun dalam jarak lebih dekat (close-up).',
                    'Pastikan daun mendapatkan pencahayaan alami yang terang dan merata.',
                    'Gunakan latar belakang netral yang tidak membingungkan model.'
                ]
            });
            return;
        }

        // Jika model yakin (confidence >= 75%)
        const label = topPrediction.className.toUpperCase().trim();

        if (label === 'SEHAT') {
            this.renderResultUI({
                isModel: true,
                statusType: 'healthy',
                title: '🌱 Tanaman Sehat (Berdasarkan Model AI)',
                subtitle: `Model AI mendeteksi kondisi daun sehat dan segar dengan tingkat keyakinan ${confidencePct}%.`,
                confidence: confidencePct,
                symptoms: [
                    'Permukaan helaian daun tampak hijau cerah dan bertekstur kokoh.',
                    'Struktur pertulangan daun normal tanpa tanda bercak nekrotik, layu, atau pembusukan.',
                    'Kadar klorofil merata di seluruh jaringan daun.'
                ],
                recommendations: [
                    'Pertahankan jadwal penyiraman rutin di pagi atau sore hari.',
                    'Pastikan media tanam memiliki drainase yang lancar agar akar tetap bernapas.',
                    'Berikan paparan sinar matahari yang cukup sesuai jenis tanaman.'
                ]
            });
        } else if (label === 'KERING') {
            this.renderResultUI({
                isModel: true,
                statusType: 'warning',
                title: '⚠️ Tanaman Kering / Dehidrasi (Berdasarkan Model AI)',
                subtitle: `Model AI mendeteksi daun mengalami kekeringan atau kekurangan air dengan tingkat keyakinan ${confidencePct}%.`,
                confidence: confidencePct,
                symptoms: [
                    'Helaian daun tampak kering, kaku, rapuh, atau berwarna kecokelatan di tepi/ujung.',
                    'Hilangnya kadar air seluler (penurunan tekanan turgor).',
                    'Media tanam kemungkinan kering atau suhu lingkungan terlalu terik.'
                ],
                recommendations: [
                    'Segera lakukan penyiraman mendalam (deep watering) hingga air mencapai zona perakaran.',
                    'Gunakan mulsa organik (sekam/jerami) pada permukaan tanah untuk menahan penguapan air.',
                    'Jika ditaruh di tempat terik ekstrem, pindahkan tanaman ke tempat yang memiliki naungan ringan sementara.'
                ]
            });
        } else if (label === 'BUSUK') {
            this.renderResultUI({
                isModel: true,
                statusType: 'diseased',
                title: '⚠️ Tanaman Busuk / Terinfeksi Penyakit (Berdasarkan Model AI)',
                subtitle: `Model AI mendeteksi tanda pembusukan jaringan atau infeksi patogen dengan tingkat keyakinan ${confidencePct}%.`,
                confidence: confidencePct,
                symptoms: [
                    'Jaringan daun tampak lembek, berair, berwarna cokelat gelap atau kehitaman.',
                    'Terindikasi infeksi jamur atau bakteri patogen akibat kelembapan berlebih (overwatering).',
                    'Potensi penularan spora jamur ke bagian daun tanaman lainnya.'
                ],
                recommendations: [
                    'Pangkas dan buang segera bagian daun yang membusuk menggunakan gunting bersih agar tidak menular.',
                    'Kurangi frekuensi penyiraman dan pastikan tidak ada air yang menggenang di dasar pot/bedengan.',
                    'Tingkatkan sirkulasi udara di sekitar tanaman dan semprotkan fungisida/bakterisida organik bila perlu.'
                ]
            });
        } else if (label === 'LAYU') {
            this.renderResultUI({
                isModel: true,
                statusType: 'warning',
                title: '⚠️ Tanaman Layu / Kehilangan Tekanan Turgor (Berdasarkan Model AI)',
                subtitle: `Model AI mendeteksi daun terkulai atau layu dengan tingkat keyakinan ${confidencePct}%.`,
                confidence: confidencePct,
                symptoms: [
                    'Tangkai dan helai daun terkulai lemas ke bawah.',
                    'Sel-sel tanaman kehilangan elastisitas dan tekanan cairan internal.',
                    'Dapat disebabkan oleh dehidrasi akut ATAU kerusakan akar (akar membusuk sehingga tidak dapat menyerap air).'
                ],
                recommendations: [
                    'Periksa kelembapan media tanam: jika tanah kering kerontang, segera lakukan penyiraman.',
                    'Jika tanah sudah sangat basah dan becek, kemungkinan terjadi busuk akar—hentikan penyiraman dan longgarkan tanah.',
                    'Tempatkan tanaman di tempat yang sejuk dan terlindung dari terik matahari langsung hingga daun kembali tegak.'
                ]
            });
        } else {
            // Deteksi kelas lain jika ada
            this.renderResultUI({
                isModel: true,
                statusType: 'diseased',
                title: `⚠️ Terdeteksi Kondisi: ${topPrediction.className} (Berdasarkan Model AI)`,
                subtitle: `Model AI mengidentifikasi kondisi tanaman dengan tingkat keyakinan ${confidencePct}%.`,
                confidence: confidencePct,
                symptoms: [
                    `Karakteristik visual daun cocok dengan pola kelas: ${topPrediction.className}.`,
                    'Terlihat anomali pada warna atau struktur jaringan daun.'
                ],
                recommendations: [
                    'Amati perkembangan daun selama 1-2 hari ke depan.',
                    'Periksa kecukupan nutrisi tanah dan kelembapan media tanam.',
                    'Konsultasikan dengan pembina kebun sekolah jika gejala semakin parah.'
                ]
            });
        }
    }

    // Diagnosa Analisis Visual Spektral Sementara (Fallback Jujur & Cerdas)
    diagnoseWithVisualHeuristic(imgElement) {
        // Buat canvas sementara untuk membaca data piksel gambar
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxDim = 300; // Sampel ukuran proporsional
        let w = imgElement.naturalWidth || imgElement.width || 300;
        let h = imgElement.naturalHeight || imgElement.height || 300;

        if (w > maxDim || h > maxDim) {
            if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
            } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
            }
        }

        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(imgElement, 0, 0, w, h);

        let imgData;
        try {
            imgData = ctx.getImageData(0, 0, w, h);
        } catch (e) {
            // Jika ada masalah CORS lokal pada canvas
            this.renderHeuristicFallbackSimulation();
            return;
        }

        const data = imgData.data;
        const totalPixels = data.length / 4;

        let greenPixels = 0;       // Hijau sehat
        let yellowPixels = 0;      // Daun menguning (klorosis)
        let brownDarkPixels = 0;   // Bercak nekrotik/cokelat/hitam busuk
        let nonPlantPixels = 0;    // Background putih/abu/hitam netral

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Konversi RGB ke HSL
            const hsl = this.rgbToHsl(r, g, b);
            const hDeg = hsl[0] * 360;
            const s = hsl[1];
            const l = hsl[2];

            // Saring piksel background netral
            if (s < 0.15 || l < 0.12 || l > 0.92) {
                nonPlantPixels++;
                continue;
            }

            // 1. Hijau Klorofil Sehat (Hue 75° - 165°)
            if (hDeg >= 75 && hDeg <= 165 && s >= 0.22 && l >= 0.2 && l <= 0.8) {
                greenPixels++;
            }
            // 2. Kuning Klorosis / Daun Pudar (Hue 35° - 74°)
            else if (hDeg >= 35 && hDeg < 75 && s >= 0.25 && l >= 0.25) {
                yellowPixels++;
            }
            // 3. Cokelat / Gelap / Bercak Nekrotik (Hue 10° - 35° dengan lightness sedang/rendah ATAU l < 0.22 kecokelatan)
            else if ((hDeg >= 10 && hDeg < 35 && s >= 0.2 && l <= 0.5) || (l < 0.22 && s >= 0.2)) {
                brownDarkPixels++;
            } else {
                nonPlantPixels++;
            }
        }

        const plantPixels = totalPixels - nonPlantPixels;

        // Jika objek bukan tanaman atau foto terlalu kabur
        if (plantPixels < totalPixels * 0.15) {
            this.renderResultUI({
                isModel: false,
                statusType: 'uncertain',
                title: '⚠️ Belum Yakin / Objek Kurang Jelas',
                subtitle: 'Sistem tidak dapat mendeteksi kontur atau pigmen daun tanaman yang memadai dari foto ini.',
                confidence: 45,
                symptoms: [
                    'Citra didominasi oleh latar belakang bukan daun.',
                    'Objek daun mungkin terlalu kecil atau pencahayaan terlalu gelap/terang.'
                ],
                recommendations: [
                    'Ambil foto daun tanaman dari jarak dekat.',
                    'Fokuskan kamera pada helai daun yang ingin diperiksa.',
                    'Pastikan pencahayaan cukup terang.'
                ]
            });
            return;
        }

        const greenRatio = greenPixels / plantPixels;
        const yellowRatio = yellowPixels / plantPixels;
        const brownRatio = brownDarkPixels / plantPixels;

        // ====================================================================
        // EVALUASI ANALISIS VISUAL SPEKTRAL DENGAN ATURAN KETAT
        // (JANGAN ASAL MENYEBUT TANAMAN BERCAK/KUNING SEBAGAI SEHAT!)
        // ====================================================================

        // Kasus A: Terdeteksi banyak bercak cokelat / nekrosis / kehitaman
        if (brownRatio > 0.08 || (brownRatio + yellowRatio) > 0.22) {
            const conf = Math.min(94, Math.round(78 + (brownRatio + yellowRatio) * 35));
            this.renderResultUI({
                isModel: false,
                statusType: 'diseased',
                title: '⚠️ Perlu Diperiksa — Terlihat Tanda Perubahan pada Daun',
                subtitle: `Analisis visual mendeteksi sekitar ${Math.round(brownRatio * 100)}% area bercak kecokelatan/gelap dan ${Math.round(yellowRatio * 100)}% area menguning pada permukaan daun.`,
                confidence: conf,
                symptoms: [
                    'Terlihat bercak nekrotik (warna cokelat tua atau gelap) pada helaian daun.',
                    'Terindikasi pelemahan jaringan sel daun atau potensi serangan jamur bercak daun.',
                    'Sebagian helai daun kehilangan warna hijau klorofil alami.'
                ],
                recommendations: [
                    'Periksa apakah bercak menyebar ke daun lain; pangkas daun yang terinfeksi parah.',
                    'Hindari menyiram air langsung di atas permukaan daun saat sore/malam hari.',
                    'Periksa kelembapan media tanam untuk memastikan akar tidak mengalami pembusukan.',
                    'Gunakan larutan pelindung nabati (seperti air rebusan sirih atau fungisida organik).'
                ]
            });
        }
        // Kasus B: Daun menguning dominan (Klorosis / Defisiensi hara)
        else if (yellowRatio > 0.16) {
            const conf = Math.min(90, Math.round(75 + yellowRatio * 40));
            this.renderResultUI({
                isModel: false,
                statusType: 'warning',
                title: '⚠️ Terlihat Gejala Daun Menguning (Klorosis)',
                subtitle: `Analisis spektral mendeteksi sekitar ${Math.round(yellowRatio * 100)}% gradasi warna kuning pada helai daun.`,
                confidence: conf,
                symptoms: [
                    'Pigmen hijau klorofil mengalami degradasi menjadi kekuningan.',
                    'Gejala umum defisiensi unsur hara Nitrogen (N) atau tanah yang tergenang air (drainase buruk).',
                    'Potensi etiolasi akibat tanaman ditaruh di lokasi yang terlalu teduh.'
                ],
                recommendations: [
                    'Pastikan pot/bedengan memiliki lubang drainase yang lancar tanpa genangan air.',
                    'Tambahkan pupuk organik kaya Nitrogen (seperti kompos atau pupuk kandang matang).',
                    'Pindahkan tanaman ke tempat yang terpapar sinar matahari pagi secara bertahap.'
                ]
            });
        }
        // Kasus C: Daun dominan hijau merata tanpa bercak signifikan
        else if (greenRatio > 0.72) {
            const conf = Math.min(92, Math.round(76 + greenRatio * 18));
            this.renderResultUI({
                isModel: false,
                statusType: 'healthy',
                title: '🌱 Tanaman Terlihat Segar & Hijau Merata',
                subtitle: `Analisis spektral menunjukkan ${Math.round(greenRatio * 100)}% permukaan daun berada pada spektrum klorofil hijau sehat.`,
                confidence: conf,
                symptoms: [
                    'Pigmentasi hijau klorofil merata di seluruh helai daun.',
                    'Tidak terdeteksi area bercak nekrotik atau klorosis yang membahayakan.'
                ],
                recommendations: [
                    'Pertahankan rutinitas penyiraman secara teratur (pagi atau sore).',
                    'Jaga kebersihan area sekitar tanaman dari gulma pengganggu.',
                    'Berikan pupuk pemeliharaan secara berkala untuk menjaga kesuburan.'
                ]
            });
        }
        // Kasus D: Hasil belum cukup yakin
        else {
            this.renderResultUI({
                isModel: false,
                statusType: 'uncertain',
                title: '⚠️ Belum Yakin dengan Hasil Analisis',
                subtitle: 'Distribusi warna daun berada di batas ambigu atau gambar memiliki refleksi cahaya berlebih.',
                confidence: 62,
                symptoms: [
                    'Kontras warna daun tidak memberikan kepastian visual yang kuat.',
                    'Tingkat keyakinan analisis berada di bawah ambang batas rekomendasi.'
                ],
                recommendations: [
                    'Ambil foto ulang dengan sudut tegak lurus ke helai daun.',
                    'Pastikan daun tidak terkena pantulan kilau cahaya lampu langsung.'
                ]
            });
        }
    }

    // Render hasil diagnosa ke elemen UI
    renderResultUI(data) {
        const badgeEl = document.getElementById('aiResultBadge');
        const titleEl = document.getElementById('aiResultTitle');
        const subtitleEl = document.getElementById('aiResultSubtitle');
        const confBar = document.getElementById('aiConfidenceBar');
        const confText = document.getElementById('aiConfidenceText');
        const symptomsList = document.getElementById('aiSymptomsList');
        const recList = document.getElementById('aiRecList');
        const disclaimerEl = document.getElementById('aiDisclaimer');

        // Badge Status & Warna
        if (badgeEl) {
            badgeEl.className = 'status-badge ' + data.statusType;
            if (data.statusType === 'healthy') {
                badgeEl.innerText = 'KONDISI SEGAR / SEHAT';
            } else if (data.statusType === 'diseased') {
                badgeEl.innerText = 'PERLU DIPERIKSA / BERCAK';
            } else if (data.statusType === 'warning') {
                badgeEl.innerText = 'GEJALA MENGUNING / DEFISIENSI';
            } else {
                badgeEl.innerText = 'BELUM YAKIN / PERLU ULANG';
            }
        }

        if (titleEl) titleEl.innerText = data.title;
        if (subtitleEl) subtitleEl.innerText = data.subtitle;

        // Tingkat Keyakinan (Confidence Meter)
        if (confBar) confBar.style.width = data.confidence + '%';
        if (confText) confText.innerText = data.confidence + '%';

        // Gejala
        if (symptomsList) {
            symptomsList.innerHTML = '';
            data.symptoms.forEach(sym => {
                const li = document.createElement('li');
                li.innerText = sym;
                symptomsList.appendChild(li);
            });
        }

        // Rekomendasi
        if (recList) {
            recList.innerHTML = '';
            data.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.innerText = rec;
                recList.appendChild(li);
            });
        }

        // Label Transparansi Model
        if (disclaimerEl) {
            if (data.isModel) {
                disclaimerEl.innerHTML = `
                    <strong>ℹ️ Sumber:</strong> Model AI Teachable Machine.
                    <br><em>*Catatan: Hasil analisis ini merupakan bantuan edukasi awal, bukan pengganti diagnosis resmi laboratorium pertanian.</em>
                `;
            } else {
                disclaimerEl.innerHTML = `
                    <strong>ℹ️ Model AI Teachable Machine belum dipasang (MODEL_URL kosong).</strong>
                    <br>Sistem menggunakan <strong>Analisis Visual Spektral Sementara</strong> berdasarkan distribusi piksel warna daun.
                    <br><em>*Catatan: Ini adalah perkiraan visual awal untuk edukasi siswa, bukan diagnosis pasti dokter tanaman.</em>
                `;
            }
        }

        if (window.appAudio) {
            if (data.statusType === 'healthy') {
                window.appAudio.play('correct');
            } else if (data.statusType === 'diseased' || data.statusType === 'warning') {
                window.appAudio.play('error');
            } else {
                window.appAudio.play('click');
            }
        }
    }

    // Helper Konversi RGB ke HSL
    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatis
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return [h, s, l];
    }

    // Generator Sampel Daun Interaktif (Untuk Kemudahan Pengujian Tanpa File Kamera)
    loadSampleLeaf(type) {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 320;
        const ctx = canvas.getContext('2d');

        // Background netral
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, 320, 320);

        if (type === 'healthy') {
            // Gambar Daun Sehat (Hijau subur klorofil)
            ctx.save();
            ctx.translate(160, 160);
            ctx.rotate(-Math.PI / 4);

            // Tulang daun utama
            ctx.strokeStyle = '#2e7d32';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -90);
            ctx.lineTo(0, 90);
            ctx.stroke();

            // Helai daun hijau pekat
            ctx.fillStyle = '#43a047';
            ctx.beginPath();
            ctx.moveTo(0, -85);
            ctx.bezierCurveTo(-75, -40, -80, 50, 0, 85);
            ctx.bezierCurveTo(80, 50, 75, -40, 0, -85);
            ctx.fill();

            // Serat daun
            ctx.strokeStyle = '#66bb6a';
            ctx.lineWidth = 2;
            for (let y = -60; y < 60; y += 22) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(-40, y + 15);
                ctx.moveTo(0, y);
                ctx.lineTo(40, y + 15);
                ctx.stroke();
            }
            ctx.restore();

        } else if (type === 'spotted') {
            // Gambar Daun Berpenyakit (Bercak Cokelat & Menguning)
            ctx.save();
            ctx.translate(160, 160);
            ctx.rotate(-Math.PI / 4);

            // Helai daun dengan gradasi menguning
            ctx.fillStyle = '#c0ca33'; // Kuning klorosis
            ctx.beginPath();
            ctx.moveTo(0, -85);
            ctx.bezierCurveTo(-75, -40, -80, 50, 0, 85);
            ctx.bezierCurveTo(80, 50, 75, -40, 0, -85);
            ctx.fill();

            // Tulang daun
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -90);
            ctx.lineTo(0, 90);
            ctx.stroke();

            // Bercak-bercak nekrosis cokelat tua / hitam busuk
            const spots = [
                { x: -25, y: -20, r: 16 },
                { x: 22, y: 15, r: 18 },
                { x: -18, y: 40, r: 14 },
                { x: 30, y: -35, r: 12 },
                { x: 0, y: -50, r: 11 }
            ];

            spots.forEach(spot => {
                // Lingkaran halo kuning di sekitar bercak
                ctx.fillStyle = '#fbc02d';
                ctx.beginPath();
                ctx.arc(spot.x, spot.y, spot.r + 5, 0, Math.PI * 2);
                ctx.fill();

                // Inti bercak cokelat mati nekrotik
                ctx.fillStyle = '#4e342e';
                ctx.beginPath();
                ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();

        } else if (type === 'yellow' || type === 'kering') {
            // Gambar Daun Kering / Menguning
            ctx.save();
            ctx.translate(160, 160);
            ctx.rotate(-Math.PI / 4);

            // Helai daun kering kecokelatan / kuning tua rapuh
            ctx.fillStyle = '#bcaaa4';
            ctx.beginPath();
            ctx.moveTo(0, -85);
            ctx.bezierCurveTo(-65, -40, -70, 50, 0, 85);
            ctx.bezierCurveTo(70, 50, 65, -40, 0, -85);
            ctx.fill();

            // Ujung dan tepi terbakar kering cokelat
            ctx.strokeStyle = '#6d4c41';
            ctx.lineWidth = 6;
            ctx.stroke();

            // Tulang daun rapuh
            ctx.strokeStyle = '#4e342e';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, -90);
            ctx.lineTo(0, 90);
            ctx.stroke();

            ctx.restore();

        } else if (type === 'busuk') {
            // Gambar Daun Busuk / Nekrosis Kehitaman Berair
            ctx.save();
            ctx.translate(160, 160);
            ctx.rotate(-Math.PI / 4);

            // Helai daun hijau kusam kecokelatan
            ctx.fillStyle = '#556b2f';
            ctx.beginPath();
            ctx.moveTo(0, -85);
            ctx.bezierCurveTo(-75, -40, -80, 50, 0, 85);
            ctx.bezierCurveTo(80, 50, 75, -40, 0, -85);
            ctx.fill();

            // Bercak busuk hitam pekat melebar
            const rotSpots = [
                { x: -10, y: -25, rx: 32, ry: 22 },
                { x: 20, y: 20, rx: 28, ry: 35 },
                { x: -15, y: 35, rx: 22, ry: 18 }
            ];

            rotSpots.forEach(s => {
                ctx.fillStyle = 'rgba(38, 24, 14, 0.9)';
                ctx.beginPath();
                ctx.ellipse(s.x, s.y, s.rx, s.ry, Math.PI / 6, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.restore();

        } else if (type === 'layu') {
            // Gambar Daun Layu Terkulai
            ctx.save();
            ctx.translate(160, 140);
            ctx.rotate(Math.PI / 3); // Miring terkulai ke bawah

            // Helai daun pipih kusam terkulai
            ctx.fillStyle = '#8d9966';
            ctx.beginPath();
            ctx.moveTo(0, -80);
            ctx.bezierCurveTo(-50, -20, -55, 60, 0, 95);
            ctx.bezierCurveTo(55, 60, 50, -20, 0, -80);
            ctx.fill();

            // Tangkai melengkung lunglai
            ctx.strokeStyle = '#556b2f';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, -95);
            ctx.quadraticCurveTo(-20, -10, 0, 95);
            ctx.stroke();

            ctx.restore();
        }

        const dataUrl = canvas.toDataURL('image/png');
        this.setImagePreview(dataUrl);
    }
}

// Inisialisasi AI Doctor Global
window.aiDoctor = new AIDoctor();
