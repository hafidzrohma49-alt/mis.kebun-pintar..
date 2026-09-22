/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/plants.js
 * Deskripsi: Database komprehensif: 6 tanaman 3D game, materi edukasi botani lengkap (5 Kategori:
 * Dasar Tanaman, Perawatan, Hama & Penyakit, Ensiklopedia 10 Tanaman, dan AI Pertanian), serta bank kuis.
 */

const plantsData = {
    // ========================================================================
    // 1. DATABASE 6 TANAMAN GAME 3D (Digunakan oleh Simulator & Toko Benih)
    // ========================================================================
    crops: {
        selada: {
            id: 'selada',
            name: 'Selada',
            emoji: '🥬',
            seedPrice: 10,
            sellPrice: 25,
            growTime: 12, // detik di simulator
            xpReward: 15,
            category: 'Sayuran Daun',
            description: 'Sayuran berdaun hijau segar yang renyah. Sangat cepat tumbuh dan cocok untuk petani pemula.',
            colors: { stem: 0x4caf50, leaf: 0x81c784, fruit: 0x43a047 },
            tips: 'Membutuhkan tanah lembap dan penyiraman teratur agar daun tetap renyah.'
        },
        wortel: {
            id: 'wortel',
            name: 'Wortel',
            emoji: '🥕',
            seedPrice: 15,
            sellPrice: 35,
            growTime: 16,
            xpReward: 20,
            category: 'Sayuran Umbi',
            description: 'Tanaman umbi kaya beta-karoten dan Vitamin A. Tumbuh subur di tanah yang gembur dan tidak berbatu.',
            colors: { stem: 0x2e7d32, leaf: 0x4caf50, fruit: 0xff7043 },
            tips: 'Pastikan media tanam gembur agar umbi wortel tumbuh lurus dan montok.'
        },
        tomat: {
            id: 'tomat',
            name: 'Tomat',
            emoji: '🍅',
            seedPrice: 25,
            sellPrice: 55,
            growTime: 22,
            xpReward: 30,
            category: 'Sayuran Buah',
            description: 'Buah berair dengan rasa segar manis-asam, kaya antioksidan likopen untuk menjaga kesehatan.',
            colors: { stem: 0x388e3c, leaf: 0x66bb6a, fruit: 0xe53935 },
            tips: 'Sangat menyukai sinar matahari penuh dan ajir penopang saat mulai berbuah.'
        },
        cabai: {
            id: 'cabai',
            name: 'Cabai',
            emoji: '🌶️',
            seedPrice: 30,
            sellPrice: 70,
            growTime: 28,
            xpReward: 40,
            category: 'Rempah / Hortikultura',
            description: 'Tanaman perdu pembawa rasa pedas capsaicin. Komoditas bernilai ekonomi tinggi di pasar.',
            colors: { stem: 0x2e7d32, leaf: 0x43a047, fruit: 0xd32f2f },
            tips: 'Hindari genangan air berlebih di akar agar terhindar dari penyakit busuk batang.'
        },
        jagung: {
            id: 'jagung',
            name: 'Jagung',
            emoji: '🌽',
            seedPrice: 40,
            sellPrice: 90,
            growTime: 35,
            xpReward: 50,
            category: 'Tanaman Pangan',
            description: 'Tanaman pangan penghasil karbohidrat dengan tongkol biji kuning keemasan yang manis dan bergizi.',
            colors: { stem: 0x558b2f, leaf: 0x8bc34a, fruit: 0xfbc02d },
            tips: 'Membutuhkan unsur nitrogen tinggi dan paparan cahaya matahari langsung sepanjang hari.'
        },
        stroberi: {
            id: 'stroberi',
            name: 'Stroberi',
            emoji: '🍓',
            seedPrice: 50,
            sellPrice: 120,
            growTime: 45,
            xpReward: 65,
            category: 'Buah Premium',
            description: 'Tanaman buah mungil eksotis dengan aroma harum manis dan warna merah mencolok bernilai jual tinggi.',
            colors: { stem: 0x33691e, leaf: 0x558b2f, fruit: 0xc2185b },
            tips: 'Gunakan mulsa jerami atau sekam agar buah tidak langsung menyentuh tanah basah.'
        }
    },

    // ========================================================================
    // TAHAP PERTUMBUHAN TANAMAN (6 TAHAP)
    // ========================================================================
    growthStages: [
        { id: 'SEED', name: 'Benih Tertanam', minPct: 0, maxPct: 15, emoji: '🌰' },
        { id: 'SPROUT', name: 'Tunas Merekah', minPct: 16, maxPct: 35, emoji: '🌱' },
        { id: 'SMALL', name: 'Batang & Daun Muda', minPct: 36, maxPct: 55, emoji: '🌿' },
        { id: 'MEDIUM', name: 'Tajuk Rimbun', minPct: 56, maxPct: 75, emoji: '🪴' },
        { id: 'MATURE', name: 'Bunga & Buah Muda', minPct: 76, maxPct: 99, emoji: '🌸' },
        { id: 'HARVEST', name: 'Panen Matang', minPct: 100, maxPct: 100, emoji: '✨' }
    ],

    // ========================================================================
    // KATALOG PAKAN HEWAN
    // ========================================================================
    animalFeeds: {
        pakan_unggas: {
            id: 'pakan_unggas',
            name: 'Pakan Unggas',
            emoji: '🌾',
            price: 8,
            targetAnimals: ['ayam', 'bebek'],
            hungerRestore: 40,
            happyBonus: 12,
            description: 'Campuran biji jagung pipil, dedak bekatul, dan kalsium khusus ayam dan bebek.'
        },
        pakan_ruminansia: {
            id: 'pakan_ruminansia',
            name: 'Pakan Ruminansia (Rumput & Hay)',
            emoji: '🌿',
            price: 15,
            targetAnimals: ['sapi', 'kambing'],
            hungerRestore: 45,
            happyBonus: 15,
            description: 'Jerami rumput gajah segar dan konsentrat hijau berkualitas tinggi untuk sapi dan kambing.'
        }
    },

    // ========================================================================
    // KATALOG PRODUK PETERNAKAN
    // ========================================================================
    animalProducts: {
        telur_ayam: {
            id: 'telur_ayam',
            name: 'Telur Ayam Segar',
            emoji: '🥚',
            sellPrice: 20,
            xpReward: 10,
            sourceAnimal: 'ayam',
            description: 'Telur ayam kampung organik kaya protein dari ayam yang sehat dan bahagia.'
        },
        susu_sapi: {
            id: 'susu_sapi',
            name: 'Susu Sapi Murni',
            emoji: '🥛',
            sellPrice: 45,
            xpReward: 25,
            sourceAnimal: 'sapi',
            description: 'Susu segar langsung dari sapi perah yang kenyang dan terawat baik.'
        },
        wol_kambing: {
            id: 'wol_kambing',
            name: 'Wol Kambing Halus',
            emoji: '🧶',
            sellPrice: 50,
            xpReward: 25,
            sourceAnimal: 'kambing',
            description: 'Serat wol halus berkualitas tinggi untuk kerajinan rajut musim dingin.'
        },
        telur_bebek: {
            id: 'telur_bebek',
            name: 'Telur Bebek Segar',
            emoji: '🥚',
            sellPrice: 28,
            xpReward: 15,
            sourceAnimal: 'bebek',
            description: 'Telur bebek berukuran besar dengan kuning telur oranye pekat bernilai gizi tinggi.'
        },
        bulu_bebek: {
            id: 'bulu_bebek',
            name: 'Bulu Bebek Halus',
            emoji: '🪶',
            sellPrice: 35,
            xpReward: 18,
            sourceAnimal: 'bebek',
            description: 'Bulu halus lembut yang sangat dicari untuk isian jaket dan bantal premium.'
        }
    },

    // ========================================================================
    // KATALOG HEWAN TERNAK (4 SPESIES: AYAM, SAPI, KAMBING, BEBEK)
    // ========================================================================
    animalsCatalog: {
        ayam: {
            type: 'ayam',
            speciesName: 'Ayam',
            emoji: '🐔',
            buyPrice: 120,
            feedType: 'pakan_unggas',
            product: 'telur_ayam',
            productInterval: 28, // detik waktu produksi
            size: { width: 0.7, height: 0.8, depth: 0.7 },
            description: 'Unggas lincah penghasil telur segar setiap hari. Senang berkeliaran dan mematuk biji-bijian.'
        },
        sapi: {
            type: 'sapi',
            speciesName: 'Sapi',
            emoji: '🐄',
            buyPrice: 350,
            feedType: 'pakan_ruminansia',
            product: 'susu_sapi',
            productInterval: 45,
            size: { width: 1.6, height: 1.8, depth: 2.6 },
            description: 'Sapi perah ras Friesian Holstein bertubuh besar dengan produksi susu murni yang melimpah.'
        },
        kambing: {
            type: 'kambing',
            speciesName: 'Kambing',
            emoji: '🐐',
            buyPrice: 260,
            feedType: 'pakan_ruminansia',
            product: 'wol_kambing',
            productInterval: 40,
            size: { width: 1.1, height: 1.4, depth: 1.8 },
            description: 'Kambing tangguh bertanduk melengkung yang menghasilkan serat wol berkualitas dan susu kaya nutrisi.'
        },
        bebek: {
            type: 'bebek',
            speciesName: 'Bebek',
            emoji: '🦆',
            buyPrice: 150,
            feedType: 'pakan_unggas',
            product: 'telur_bebek',
            productInterval: 32,
            size: { width: 0.8, height: 0.85, depth: 0.9 },
            description: 'Unggas air periang berparuh oranye lebar yang sangat menyukai area genangan air atau kolam peternakan.'
        }
    },

    // ========================================================================
    // KATALOG ALAT & UPGRADE KEBUN
    // ========================================================================
    tools: {
        penyiram_emas: {
            id: 'penyiram_emas',
            name: 'Gembor Emas Multifungsi',
            emoji: '✨',
            price: 250,
            description: 'Gembor bertuah yang menyiram petak tanah lebih tahan lama dan menambah kesuburan tanaman.'
        },
        pupuk_kompos: {
            id: 'pupuk_kompos',
            name: 'Pupuk Kompos Organik',
            emoji: '🧪',
            price: 20,
            description: 'Pupuk hayati yang mempercepat laju pertumbuhan tanaman sebesar 2x lipat selama 60 detik.'
        }
    },

    // ========================================================================
    // 2. MATERI EDUKASI "BELAJAR TANAMAN" LENGKAP (5 KATEGORI)
    // ========================================================================
    learningModules: [
        // --------------------------------------------------------------------
        // KATEGORI 1: 🌱 DASAR TANAMAN
        // --------------------------------------------------------------------
        {
            id: 'dasar_apa_itu_tanaman',
            category: 'dasar',
            categoryName: 'Dasar Tanaman',
            icon: '🌱',
            title: 'Apa Itu Tanaman?',
            summary: 'Mengenal organisme autotrof produsen oksigen dan penyokong utama kehidupan di bumi.',
            flowDiagram: '🌍 Bumi → 🌱 Tumbuhan Hijau (Autotrof) → 💨 Oksigen (O₂) + 🍎 Makanan',
            content: `
                <p><strong>Tanaman (Tumbuhan)</strong> adalah organisme eukariotik multiseluler yang termasuk dalam kingdom <em>Plantae</em>. Ciri paling khas dari tanaman adalah sifatnya yang <strong>autotrof</strong>, artinya mampu memproduksi makanannya sendiri melalui fotosintesis menggunakan pigmen klorofil.</p>
                <ul>
                    <li><strong>Produsen Primer:</strong> Tanaman menduduki tingkat trofik pertama dalam rantai makanan, menyediakan energi bagi herbivora dan karnivora.</li>
                    <li><strong>Paru-Paru Dunia:</strong> Menyerap gas karbon dioksida (CO₂) penyebab efek rumah kaca dan melepaskan gas oksigen (O₂) untuk pernapasan manusia dan hewan.</li>
                    <li><strong>Dinding Sel Selulosa:</strong> Berbeda dari sel hewan, sel tumbuhan dilindungi oleh dinding sel yang kaku berbahan selulosa yang memberikan struktur tegak pada tumbuhan.</li>
                </ul>
            `,
            keyTakeaway: 'Tanaman adalah fondasi rantai makanan bumi yang mengubah energi foton matahari menjadi energi kimia yang dapat dimanfaatkan seluruh makhluk hidup.'
        },
        {
            id: 'dasar_bagian_tanaman',
            category: 'dasar',
            categoryName: 'Dasar Tanaman',
            icon: '🌿',
            title: 'Bagian-Bagian Tanaman & Fungsinya',
            summary: 'Struktur anatomi organ vegetatif dan generatif: akar, batang, daun, bunga, buah, dan biji.',
            flowDiagram: '🪵 Akar (Serap) → 🌿 Batang (Angkut) → 🍃 Daun (Masak) → 🌸 Bunga (Kawin) → 🍎 Buah & Biji',
            content: `
                <p>Tumbuhan tingkat tinggi memiliki 6 organ fungsional yang bekerja secara terpadu:</p>
                <ul>
                    <li><strong>1. Akar:</strong> Menancapkan tanaman kokoh ke dalam tanah, menyerap air serta unsur hara terlarut melalui bulu-bulu akar, dan sebagai tempat penyimpanan cadangan makanan (seperti pada wortel dan singkong).</li>
                    <li><strong>2. Batang:</strong> Penopang tajuk tanaman agar daun mendapatkan cahaya matahari optimal. Di dalamnya terdapat jaringan pembuluh: <em>Xilem</em> (mengangkut air & hara dari akar ke daun) dan <em>Floem</em> (mengedarkan glukosa fotosintesis dari daun ke seluruh tubuh).</li>
                    <li><strong>3. Daun:</strong> Tempat utama berlangsungnya fotosintesis dan transpirasi (penguapan air). Permukaan daun dilengkapi lubang pori mikroskopis bernama <em>stomata</em> untuk pertukaran gas.</li>
                    <li><strong>4. Bunga:</strong> Organ reproduksi seksual tanaman yang memiliki benang sari (alat kelamin jantan) dan putik (alat kelamin betina).</li>
                    <li><strong>5. Buah:</strong> Organ yang berkembang dari bakal buah (ovarium) setelah penyerbukan, berfungsi membungkus dan melindungi biji dari ancaman luar.</li>
                    <li><strong>6. Biji:</strong> Embrio calon tumbuhan baru yang dilengkapi cadangan makanan (kotiledon/endosperma) dan kulit biji pelindung (testa).</li>
                </ul>
            `,
            keyTakeaway: 'Setiap bagian tanaman memiliki spesialisasi tugas: akar menyerap, batang mendistribusikan, daun memasak energi, dan bunga/buah/biji meneruskan keturunan.'
        },
        {
            id: 'dasar_fotosintesis',
            category: 'dasar',
            categoryName: 'Dasar Tanaman',
            icon: '🌿',
            title: 'Fotosintesis',
            summary: 'Fotosintesis adalah proses yang digunakan tanaman untuk membuat makanan dengan memanfaatkan cahaya.',
            flowDiagram: '☀️ Cahaya ➔ 💧 Air ➔ 🌿 Daun ➔ 🍃 Makanan',
            content: `
                <p><strong>Fotosintesis</strong> adalah proses reaksi biokimia terpenting di bumi. Tanaman menangkap foton energi cahaya matahari untuk mensintesis gula sederhana dari molekul anorganik.</p>
                <div class="formula-box">6 CO₂ + 6 H₂O + Energi Cahaya ➔ C₆H₁₂O₆ (Glukosa) + 6 O₂</div>
                <ul>
                    <li><strong>Klorofil:</strong> Pigmen penyerap cahaya yang berada di dalam organel <em>kloroplas</em>, paling aktif menyerap spektrum cahaya biru dan merah serta memantulkan warna hijau.</li>
                    <li><strong>Reaksi Terang:</strong> Berlangsung di membran tilakoid, menguraikan molekul air (fotolisis) menjadi ion hidrogen dan melepaskan gas O₂.</li>
                    <li><strong>Reaksi Gelap (Siklus Calvin):</strong> Berlangsung di stroma, mengikat CO₂ untuk dirangkai menjadi glukosa (karbohidrat).</li>
                </ul>
            `,
            keyTakeaway: 'Fotosintesis membutuhkan tiga bahan baku utama: sinar matahari, air dari akar, dan karbon dioksida dari udara melalui stomata.'
        },
        {
            id: 'dasar_kebutuhan_tanaman',
            category: 'dasar',
            categoryName: 'Dasar Tanaman',
            icon: '🌤️',
            title: 'Kebutuhan Dasar Tumbuh Tanaman',
            summary: 'Faktor-faktor esensial abiotik yang menentukan kelangsungan hidup dan produktivitas tanaman.',
            flowDiagram: '💧 Air + ☀️ Sinar + 💨 Udara + 🪴 Nutrisi Tanah + 🌡️ Suhu = 🌾 Tanaman Subur',
            content: `
                <p>Untuk dapat tumbuh sehat dan berproduksi maksimal, tanaman memerlukan 6 faktor lingkungan dasar:</p>
                <ul>
                    <li><strong>1. Air (H₂O):</strong> Sebagai pelarut hara tanah, menjaga tekanan turgor agar daun tidak layu, dan reaktan fotosintesis.</li>
                    <li><strong>2. Cahaya:</strong> Menentukan laju fotosintesis, memicu perkecambahan, dan mengatur ritme pembungaan (fotoperiodisme).</li>
                    <li><strong>3. Udara:</strong> Karbon dioksida (CO₂) untuk fotosintesis daun, serta Oksigen (O₂) di pori-pori tanah untuk respirasi sel akar.</li>
                    <li><strong>4. Nutrisi & Unsur Hara:</strong> Unsur makro (N, P, K, Ca, Mg, S) dan unsur mikro (Fe, Mn, Zn, Cu, B, Mo) dari media tanam.</li>
                    <li><strong>5. Suhu Lingkungan:</strong> Rentang suhu ideal (20°C - 30°C untuk iklim tropis) agar enzim fisiologis bekerja optimal.</li>
                    <li><strong>6. Ruang Tumbuh:</strong> Jarak tanam yang cukup agar tajuk daun tidak saling menutupi dan akar bebas mencari nutrisi.</li>
                </ul>
            `,
            keyTakeaway: 'Hukum Minimum Liebig menyatakan bahwa pertumbuhan tanaman dibatasi oleh faktor esensial yang ketersediaannya paling sedikit.'
        },

        // --------------------------------------------------------------------
        // KATEGORI 2: 💧 PERAWATAN TANAMAN
        // --------------------------------------------------------------------
        {
            id: 'rawat_cara_menyiram',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '💧',
            title: 'Teknik Menyiram yang Benar',
            summary: 'Cara penyiraman efektif yang menyasar perakaran tanpa memicu infeksi penyakit pada daun.',
            flowDiagram: '🚰 Air Bersih → 🪴 Siram ke Zona Perakaran (Bukan Daun) → ⏳ Meresap Hingga Bawah',
            content: `
                <p>Banyak pemula salah mengira bahwa menyiram tanaman berarti membasahi seluruh dedaunan. Padahal, teknik penyiraman yang benar memiliki aturan khusus:</p>
                <ul>
                    <li><strong>Siram ke Media Tanam:</strong> Arahkan air langsung ke permukaan tanah di sekitar pangkal batang, bukan menyemprot dedaunan secara berlebihan.</li>
                    <li><strong>Hindari Daun Basah di Sore Hari:</strong> Daun yang basah lembap semalaman adalah media perkembangbiakan sempurna bagi spora jamur bercak daun dan bakteri.</li>
                    <li><strong>Gunakan Aliran Lembut:</strong> Gunakan gembor dengan kepala pancuran halus agar struktur tanah tidak tergerus dan akar bibit tidak tersingkap keluar.</li>
                    <li><strong>Penyiraman Mendalam (Deep Watering):</strong> Lebih baik menyiram hingga air meresap dalam ke zona akar 1-2 kali sehari daripada menyiram sering tetapi hanya membasahi permukaan 1 cm.</li>
                </ul>
            `,
            keyTakeaway: 'Akar adalah bagian yang menyerap air, bukan daun. Selalu basahi tanah hingga ke zona akar dan jaga daun tetap kering.'
        },
        {
            id: 'rawat_waktu_penyiraman',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '⏰',
            title: 'Manajemen Waktu Penyiraman',
            summary: 'Memilih waktu ideal antara pagi, sore, dan alasan mutlak menghindari siang terik.',
            flowDiagram: '🌅 Pagi Hari (Paling Ideal) ➔ 🌇 Sore Hari (Alternatif) ➔ ❌ Siang Terik (Berbahaya)',
            content: `
                <p>Waktu pemberian air sangat mempengaruhi efisiensi penyerapan dan kesehatan jaringan tanaman:</p>
                <ul>
                    <li><strong>Pagi Hari (06.00 - 08.00) — SANGAT DIREKOMENDASIKAN:</strong> Waktu terbaik karena tanaman bersiap menghadapi terik matahari. Air yang tidak terserap di permukaan akan cepat menguap oleh angin pagi sehingga daun tidak lembap berjamur.</li>
                    <li><strong>Sore Hari (16.00 - 17.30) — CUKUP BAIK:</strong> Pilihan kedua jika pagi hari berhalangan. Pastikan menyiram hanya pada tanah agar daun tidak basah saat malam tiba.</li>
                    <li><strong>Siang Terik (11.00 - 14.00) — JANGAN DILAKUKAN:</strong> Penguapan sangat tinggi sehingga air menguap sebelum diserap akar. Tetesan air di atas daun dapat bertindak sebagai <em>lensa cembung</em> yang memfokuskan sinar matahari dan membakar jaringan daun (*scorch*). Tanah juga mengalami kejutan suhu (*thermal shock*).</li>
                </ul>
            `,
            keyTakeaway: 'Pagi hari adalah waktu emas penyiraman tanaman di kebun sekolah.'
        },
        {
            id: 'rawat_kelebihan_kekurangan_air',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '⚖️',
            title: 'Kelebihan vs Kekurangan Air',
            summary: 'Mengenali perbedaan bahaya overwatering (busuk akar) dan underwatering (dehidrasi).',
            flowDiagram: '🌊 Overwatering (Tanah Becek, Daun Kuning Lembek) ⚡ Underwatering (Tanah Kering, Daun Keriting Kering)',
            content: `
                <p>Ketidakseimbangan air adalah penyebab kematian tanaman nomor satu pada kebun pemula:</p>
                <ul>
                    <li><strong>Kelebihan Air (Overwatering):</strong>
                        <br>• Gejala: Daun menguning pucat mulai dari bagian bawah, helai daun terasa lembek/berair, tanah selalu basah berlumpur, dan timbul bau busuk asam dari pot.
                        <br>• Penyebab: Ruang pori tanah terendam air sehingga akar tidak mendapat oksigen (asfiksia/anoksia). Jamur anaerob berkembang biak dan membusukkan akar.
                    </li>
                    <li><strong>Kekurangan Air (Underwatering):</strong>
                        <br>• Gejala: Daun terkulai lemas, tepi atau ujung daun mengering berwarna kecokelatan renyah, pertumbuhan terhenti kerdil, tanah retak-retak dan menyusut dari pinggir pot.
                        <br>• Penyebab: Tekanan turgor sel lenyap, stomata tertutup rapat, dan transportasi nutrisi terhenti total.
                    </li>
                    <li><strong>Metode Uji Jari (Finger Test):</strong> Benamkan jari telunjuk sedalam 2-3 cm ke dalam tanah. Jika terasa dingin lembap, jangan siram. Jika terasa kering dan remah, segera siram!</li>
                </ul>
            `,
            keyTakeaway: 'Overwatering jauh lebih mematikan dan sulit disembuhkan daripada kekeringan ringan. Jangan menyiram jika tanah masih basah.'
        },
        {
            id: 'rawat_kebutuhan_cahaya',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '☀️',
            title: 'Kebutuhan Cahaya & Bahaya Etiolasi',
            summary: 'Pengelompokan fotoperiode tanaman dan bahaya bibit yang tumbuh di tempat gelap.',
            flowDiagram: '🌑 Gelap (Etiolasi: Batang Kurus Panjang Lemah) ➔ ☀️ Cukup Sinar (Batang Kokoh, Daun Hijau Lebat)',
            content: `
                <p>Cahaya adalah bahan bakar utama fotosintesis, namun intensitas yang dibutuhkan berbeda-beda:</p>
                <ul>
                    <li><strong>Full Sun (Sinar Penuh 6-8 jam/hari):</strong> Tomat, cabai, jagung, terong, dan mentimun. Tanpa sinar penuh, tanaman ini sulit berbunga dan buahnya akan rontok.</li>
                    <li><strong>Partial Shade (Naungan Sebagian 3-5 jam/hari):</strong> Selada, bayam, seledri, dan daun mint. Terlalu banyak terik dapat membuat daun selada terasa pahit dan terbakar.</li>
                    <li><strong>Fenomena Etiolasi:</strong> Jika bibit disemai di tempat gelap atau kurang cahaya, hormon <em>auksin</em> akan memicu pemanjangan sel batang yang tidak terkontrol ke arah sumber cahaya. Akibatnya, tanaman tumbuh sangat tinggi, kurus, pucat, dan mudah rebah patah saat tertiup angin.</li>
                </ul>
            `,
            keyTakeaway: 'Segera kenalkan bibit muda ke sinar matahari pagi secara bertahap sejak daun pertama muncul untuk mencegah etiolasi.'
        },
        {
            id: 'rawat_pemupukan_nutrisi',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '🌾',
            title: 'Pemupukan & Unsur Hara N-P-K',
            summary: 'Memahami trio nutrisi makro primer dan perbedaan pupuk organik vs anorganik.',
            flowDiagram: '🧪 N (Daun Hijau) + P (Akar Kuat & Bunga) + K (Kekuatan Batang & Buah Manis) = 🌾 Hasil Panen Prima',
            content: `
                <p>Tanaman memerlukan asupan nutrisi berkala yang dikenal sebagai unsur hara makro primer <strong>N-P-K</strong>:</p>
                <ul>
                    <li><strong>N (Nitrogen):</strong> Berperan utama membentuk protein, enzim, dan klorofil daun. Merangsang pertumbuhan daun lebat dan batang hijau. Kekurangan N membuat daun tua menguning klorosis.</li>
                    <li><strong>P (Fosfor):</strong> Merangsang pembentukan akar awal yang kokoh dan mempercepat inisiasi keluarnya kuncup bunga serta pembentukan biji.</li>
                    <li><strong>K (Kalium):</strong> Memperkuat dinding sel batang agar tidak mudah roboh, mengatur buka-tutup stomata, meningkatkan resistensi terhadap penyakit, dan memperbesar serta memaniskan buah.</li>
                    <li><strong>Pupuk Kompos Organik:</strong> Memperbaiki struktur fisik dan biologi tanah secara berkelanjutan tanpa merusak ekosistem mikroba cacing tanah.</li>
                </ul>
            `,
            keyTakeaway: 'Gunakan formula tinggi N untuk fase vegetatif (sayuran daun) dan formula tinggi P & K saat tanaman mulai berbunga dan berbuah.'
        },
        {
            id: 'rawat_media_drainase',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '🪴',
            title: 'Media Tanam, Porositas & Drainase',
            summary: 'Formulasi racikan media tanam gembur dan pentingnya lubang resapan air.',
            flowDiagram: '🪨 Topsoil Subur + 🌾 Sekam Bakar (Aerasi) + 🍂 Kompos (Nutrisi) = 🪴 Media Tanam Sempurna',
            content: `
                <p>Media tanam yang baik harus memiliki keseimbangan antara kemampuan mengikat air (*water retention*) dan sirkulasi udara (*aeration*):</p>
                <ul>
                    <li><strong>Racikan Emas 1:1:1:</strong> Campurkan 1 bagian Tanah Topsoil Subur + 1 bagian Kompos Matang / Pupuk Kandang Halus + 1 bagian Sekam Bakar / Arang Sekam.</li>
                    <li><strong>Peran Sekam Bakar:</strong> Memiliki pori-pori mikro yang membuat tanah tetap remah gembur dan tidak memadat keras saat disiram berulang kali, serta mengikat unsur hara di zona akar.</li>
                    <li><strong>Drainase Sangat Vital:</strong> Wadah pot atau bedengan kebun WAJIB memiliki lubang pembuangan di bagian dasar. Jika air tertahan dan tidak bisa mengalir keluar, akar tanaman akan tercekik dan membusuk dalam waktu 48 jam.</li>
                </ul>
            `,
            keyTakeaway: 'Tanah yang terlalu liat padat akan mencekik akar. Pastikan media tanam selalu gembur dan memiliki lubang drainase lancar.'
        },
        {
            id: 'rawat_sirkulasi_kebersihan',
            category: 'perawatan',
            categoryName: 'Perawatan Tanaman',
            icon: '✂️',
            title: 'Sirkulasi Udara & Sanitasi Kebun',
            summary: 'Teknik pemangkasan (pruning), penyiangan gulma liar, dan menjaga kebersihan kebun.',
            flowDiagram: '✂️ Pruning Daun Tua ➔ 🧹 Cabut Gulma ➔ 🌬️ Sirkulasi Udara Lancar ➔ 🛡️ Bebas Hama & Jamur',
            content: `
                <p>Kebun yang bersih dan rapi adalah benteng pertahanan terkuat terhadap serangan hama dan wabah jamur:</p>
                <ul>
                    <li><strong>Pemangkasan (Pruning):</strong> Potong daun-daun terbawah yang telah tua, menguning, atau menjuntai menyentuh tanah basah. Daun yang menyentuh tanah adalah jembatan masuknya spora jamur patogen tanah.</li>
                    <li><strong>Penyiangan Gulma (Weeding):</strong> Cabut rumput liar dan gulma di sekitar bedengan. Gulma merebut jatah air, sinar matahari, dan pupuk tanaman utama, serta menjadi sarang persembunyian serangga hama.</li>
                    <li><strong>Sirkulasi Udara:</strong> Jangan menanam tanaman terlalu rapat. Udara yang bergerak sepoi-sepoi akan mengeringkan kelembapan mikro berlebih di sela-sela dedaunan dan memperkuat jaringan batang tanaman.</li>
                </ul>
            `,
            keyTakeaway: 'Sanitasi kebun dengan mencabut gulma dan membuang daun layu secara rutin mencegah 80% penyakit kebun menular.'
        },

        // --------------------------------------------------------------------
        // KATEGORI 3: 🐛 HAMA & PENYAKIT
        // --------------------------------------------------------------------
        {
            id: 'hama_pengertian',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🔬',
            title: 'Pengertian Hama vs Penyakit',
            summary: 'Membedakan perusak makroskopis (serangga/hewan) dan mikroorganisme penyebab penyakit.',
            flowDiagram: '🐛 Hama (Serangga/Hewan Kasat Mata) ⚡ 🦠 Penyakit (Jamur, Bakteri, Virus Mikroskopis)',
            content: `
                <p>Siswa sering menyamakan hama dan penyakit, padahal keduanya memiliki karakteristik dan cara pengendalian yang sangat berbeda:</p>
                <ul>
                    <li><strong>Hama Tanaman:</strong> Organisme hewan (umumnya serangga, ulat, tungau, siput, tikus) yang merusak fisik tanaman secara mekanis dengan cara menggigit, memakan, menghisap cairan sel, atau melubangi jaringan tanaman. Contoh: ulat grayak memakan helai daun.</li>
                    <li><strong>Penyakit Tanaman:</strong> Gangguan fisiologis pada sel atau jaringan tanaman yang disebabkan oleh mikroorganisme patogen (seperti jamur, bakteri, atau virus) atau gangguan nutrisi/lingkungan (abiotik). Contoh: bercak daun jamur atau busuk basah bakteri.</li>
                    <li><strong>Vektor Penyakit:</strong> Beberapa serangga hama (seperti kutu kebul dan kutu daun) juga bertindak sebagai pembawa (vektor) yang menularkan virus berbahaya antar tanaman saat menghisap cairan daun.</li>
                </ul>
            `,
            keyTakeaway: 'Hama diatasi dengan insektisida nabati/pengendalian mekanis, sedangkan penyakit jamur diatasi dengan fungisida dan sanitasi lingkungan.'
        },
        {
            id: 'hama_kutu_daun',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🪲',
            title: 'Kutu Daun (Aphids) & Kutu Putih',
            summary: 'Serangga penghisap cairan sel daun muda dan produsen embun madu pemicu jamur jelaga.',
            flowDiagram: '🪲 Kutu Daun Hisap Cairan Pucuk ➔ 🍃 Daun Mengkerut Keriting ➔ 🍯 Embun Madu ➔ 🖤 Jamur Jelaga Hitam',
            content: `
                <p><strong>Kutu Daun (Aphids)</strong> adalah hama berukuran mungil (1-2 mm) berwarna hijau, kuning, atau hitam yang hidup berkoloni:</p>
                <ul>
                    <li><strong>Gejala Serangan:</strong> Berkerumun di bawah helai daun atau pucuk muda. Daun menjadi berkerut, mengkerut kerdil, melengkung ke bawah, dan pertumbuhan tanaman terhenti.</li>
                    <li><strong>Embun Madu & Semut:</strong> Kutu daun mengeluarkan cairan manis lengket (embun madu) yang mengundang koloni semut dan memicu tumbuhnya jamur jelaga hitam (*sooty mold*) yang menutupi permukaan fotosintesis daun.</li>
                    <li><strong>Pestisida Nabati Ramah Lingkungan:</strong> Campurkan 1 liter air + 1 sendok teh sabun cuci piring lembut/sabun cair kastil + 1 sendok makan minyak sayur/minyak nimba (*neem oil*). Semprotkan merata ke bagian bawah daun di sore hari. Sabun akan melarutkan lapisan lilin pelindung kutu hingga mereka dehidrasi dan mati.</li>
                </ul>
            `,
            keyTakeaway: 'Periksa selalu bagian bawah daun muda; basmi koloni kutu daun segera sebelum mereka menularkan virus mosaik.'
        },
        {
            id: 'hama_ulat',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🐛',
            title: 'Ulat Grayak & Ulat Pemakan Daun',
            summary: 'Larva ngengat yang rakus memakan helai daun hingga menyisakan tulang daun saja.',
            flowDiagram: '🦋 Ngengat Bertelur di Daun ➔ 🐛 Ulat Menetas & Memakan Daun Rakus ➔ 🕳️ Lubang-Lubang Besar di Daun',
            content: `
                <p>Ulat daun adalah fase larva dari ngengat atau kupu-kupu yang sangat aktif memakan dedaunan terutama di malam atau pagi hari:</p>
                <ul>
                    <li><strong>Ciri Serangan:</strong> Terdapat lubang-lubang besar tidak beraturan pada helaian daun. Pada serangan parah, daun habis hanya tersisa tulang-tulang daunnya saja (*skeletonized*).</li>
                    <li><strong>Tanda Jejak:</strong> Terdapat butiran-butiran kotoran kecil berwarna hitam pekat di atas permukaan daun atau di pangkal batang.</li>
                    <li><strong>Pengendalian di Kebun Sekolah:</strong>
                        <br>1. <em>Mekanis (Manual):</em> Ambil dan pungut ulat secara manual di pagi hari (saat mereka aktif di permukaan daun) lalu pindahkan/musnahkan.
                        <br>2. <em>Biologis:</em> Gunakan bio-insektisida berbahan bakteri alami <em>Bacillus thuringiensis</em> (Bt) yang aman bagi manusia dan serangga penyerbuk.
                    </li>
                </ul>
            `,
            keyTakeaway: 'Pemeriksaan rutin di pagi hari adalah cara paling efektif dan ramah lingkungan mengatasi hama ulat di kebun sekolah.'
        },
        {
            id: 'hama_serangga_lain',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🐜',
            title: 'Thrips & Tungau Merah (Spider Mites)',
            summary: 'Hama renik mikroskopis perusak daun cabai dan tomat yang menyebabkan daun keriting keperakan.',
            flowDiagram: '🕷️ Tungau / Thrips Hisap Sel ➔ 🕸️ Jaring Halus Bawah Daun ➔ 🥈 Permukaan Mengkilap Keperakan',
            content: `
                <p>Hama ini berukuran sangat kecil sehingga sulit dilihat mata telanjang tanpa kaca pembesar:</p>
                <ul>
                    <li><strong>Thrips:</strong> Menyebabkan tepi daun menggulung melengkung ke atas seperti perahu, permukaan bawah daun tampak bercak keperakan mengkilap yang kemudian berubah menjadi kecokelatan kotor. Sering menyerang tanaman cabai.</li>
                    <li><strong>Tungau Merah (Spider Mites):</strong> Menyebabkan bintik-bintik kuning pucat mikroskopis pada daun. Jika diamati dekat, terdapat anyaman jaring laba-laba sangat halus di sela-sela pucuk dan bawah daun. Tungau berkembang biak sangat cepat dalam cuaca panas kering.</li>
                    <li><strong>Solusi:</strong> Semprotkan ekstrak air rebusan bawang putih atau larutan sulfur organik, dan tingkatkan kelembapan di sekitar daun karena tungau membenci lingkungan lembap.</li>
                </ul>
            `,
            keyTakeaway: 'Daun cabai yang keriting menggulung ke atas umumnya disebabkan oleh serangan hama thrips di musim kemarau.'
        },
        {
            id: 'hama_penyakit_jamur',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🍄',
            title: 'Penyakit Jamur: Bercak Daun & Embun Tepung',
            summary: 'Infeksi mikosis patogen yang muncul akibat kelembapan tinggi dan sirkulasi udara yang buruk.',
            flowDiagram: '🌧️ Kelembapan Tinggi + Sirkulasi Buruk ➔ 🍄 Spora Jamur Tumbuh ➔ 🔘 Bercak Cokelat Konsentris',
            content: `
                <p>Jamur patogen adalah penyebab penyakit paling dominan pada tanaman hortikultura:</p>
                <ul>
                    <li><strong>Bercak Daun Cercospora / Alternaria:</strong> Muncul bercak-bercak bulat berwarna cokelat dengan lingkaran-lingkaran konsentris menyerupai sasaran tembak (*target spot*) dan tepi lingkaran berwarna kuning halo. Lama-kelamaan daun mengering dan gugur.</li>
                    <li><strong>Embun Tepung (Powdery Mildew):</strong> Permukaan daun tampak tertutup lapisan serbuk putih seperti ditaburi tepung terigu. Daun menjadi kerdil, kering, dan rapuh.</li>
                    <li><strong>Pencegahan & Pengendalian:</strong>
                        <br>• Segera gunting dan bakar daun yang telah terinfeksi agar spora tidak terbawa angin.
                        <br>• Hindari membasahi daun saat menyiram sore hari.
                        <br>• Semprotkan fungisida alami: 1 sendok teh baking soda (natrium bikarbonat) + 1/2 sendok teh sabun cair dalam 1 liter air.
                    </li>
                </ul>
            `,
            keyTakeaway: 'Jangan biarkan daun lembap semalaman dan segera buang daun yang memiliki bercak konsentris agar spora tidak menular.'
        },
        {
            id: 'hama_busuk_akar',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🥀',
            title: 'Busuk Akar (Root Rot): Penyebab & Solusi',
            summary: 'Kematian perakaran akibat tanah tergenang becek dan invasi jamur anaerobik Pythium.',
            flowDiagram: '🌊 Tanah Tergenang Tanpa Oksigen ➔ 🦠 Jamur Pythium Serang Akar ➔ 🥀 Tanaman Layu Permanen',
            content: `
                <p><strong>Busuk Akar</strong> adalah penyakit mematikan yang terjadi di bawah permukaan tanah:</p>
                <ul>
                    <li><strong>Gejala Terlihat:</strong> Tanaman layu lemas secara tiba-tiba di siang hari meskipun media tanam sangat basah. Daun menguning kusam dan rontok. Pertumbuhan terhenti total.</li>
                    <li><strong>Kondisi Akar:</strong> Jika tanaman dicabut, akar yang sehat berwarna putih bersih dan kenyal kuat, sedangkan akar yang terkena busuk akar berwarna cokelat tua kehitaman, lembek berlendir, berbau busuk, dan mudah hancur putus saat ditarik.</li>
                    <li><strong>Penyebab:</strong> Media tanam memadat keras tanpa lubang drainase, overwatering parah, dan invasi jamur tanah seperti <em>Pythium</em> atau <em>Phytophthora</em>.</li>
                    <li><strong>Pertolongan Pertama:</strong> Cabut tanaman, potong seluruh bagian akar yang membusuk hingga tersisa akar sehat, rendam sebentar dalam larutan fungisida ringan/antiseptik, dan tanam kembali di media tanam baru yang steril dan sangat berpori.</li>
                </ul>
            `,
            keyTakeaway: 'Akar yang sehat berwarna putih bersih dan segar; akar yang busuk berwarna hitam lembek dan berbau tidak sedap.'
        },
        {
            id: 'hama_daun_menguning',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🍂',
            title: 'Analisis Daun Menguning (Klorosis)',
            summary: 'Mendiagnosis penyebab daun kuning: penuaan alami, kekurangan Nitrogen, atau kelebihan air.',
            flowDiagram: '🍂 Daun Menguning ➔ Cek Posisi (Bawah vs Atas) ➔ Cek Kelembapan Tanah (Becek vs Kering)',
            content: `
                <p>Daun menguning (*klorosis*) adalah sinyal stres tanaman yang paling sering dijumpai, namun memiliki penyebab yang berbeda-beda:</p>
                <ul>
                    <li><strong>1. Penuaan Alami (Senesens):</strong> Jika hanya 1-2 daun terbawah yang menguning dan mengering perlahan sementara seluruh daun atas hijau bugar, itu adalah proses alami daun tua melepaskan energi. Cukup pangkas daun tersebut.</li>
                    <li><strong>2. Defisiensi Nitrogen (N):</strong> Daun bagian bawah menguning merata secara bertahap merambat ke atas, sementara urat/tulang daun juga pucat. Solusi: berikan pupuk kompos atau pupuk NPK seimbang.</li>
                    <li><strong>3. Overwatering (Tanah Terlalu Basah):</strong> Daun menguning tetapi terasa lembek basah, seringkali disertai daun pucuk yang layu. Solusi: hentikan penyiraman dan periksa lubang drainase pot.</li>
                    <li><strong>4. Kurang Cahaya:</strong> Daun menguning pucat karena klorofil tidak terbentuk sempurna. Pindahkan ke tempat yang terkena sinar matahari.</li>
                </ul>
            `,
            keyTakeaway: 'Jangan langsung memberi pupuk saat melihat daun kuning! Periksa kelembapan tanah terlebih dahulu untuk memastikan bukan karena overwatering.'
        },
        {
            id: 'hama_daun_layu',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🥀',
            title: 'Analisis Daun Layu: Dehidrasi vs Penyakit Patogen',
            summary: 'Membedakan layu sementara akibat haus air dan layu permanen akibat bakteri/jamur pembuluh.',
            flowDiagram: '🥀 Tanaman Layu ➔ Siram Air ➔ 2 Jam Segar? (Dehidrasi Air) ⚡ Tetap Layu? (Infeksi Bakteri/Fusarium)',
            content: `
                <p>Tanaman yang layu lemas tidak selalu berarti haus air. Sangat penting membedakan dua kondisi ini:</p>
                <ul>
                    <li><strong>A. Layu Akibat Dehidrasi (Kekurangan Air):</strong>
                        <br>• Tanah kering kerontang dan ringan saat pot diangkat.
                        <br>• Begitu disiram air secukupnya, dalam waktu 1-2 jam tanaman akan kembali segar bugar tegak berdiri (tekanan turgor pulih).
                    </li>
                    <li><strong>B. Layu Patogen (Layu Bakteri / Layu Fusarium Jamur):</strong>
                        <br>• Tanah dalam kondisi lembap atau basah, tetapi tanaman tetap terkulai layu lemas bahkan di pagi hari yang sejuk.
                        <br>• Patogen menginfeksi dan menyumbat pembuluh xilem di dalam batang, sehingga air dari akar tidak dapat dialirkan ke daun.
                        <br>• Uji Batang: Jika batang dipotong melintang dan dicelupkan ke segelas air bening, akan keluar untaian lendir putih keruh (*bacterial ooze*).
                        <br>• Tindakan: Tanaman yang terkena layu bakteri harus segera dicabut dan dimusnahkan agar tidak menularkan ke tanaman lain di kebun.
                    </li>
                </ul>
            `,
            keyTakeaway: 'Jika tanaman layu padahal tanahnya basah, JANGAN DISIRAM LAGI! Itu adalah tanda infeksi pembuluh atau busuk akar.'
        },
        {
            id: 'hama_inspeksi_fisik',
            category: 'hama',
            categoryName: 'Hama & Penyakit',
            icon: '🔍',
            title: 'Panduan Pemeriksaan Awal Tanaman (4 Langkah)',
            summary: 'Prosedur standar inspeksi mandiri di kebun sekolah untuk mendeteksi masalah sedini mungkin.',
            flowDiagram: '👀 1. Pandang Tajuk Daun ➔ 🔍 2. Balik Helai Daun ➔ 🪵 3. Cek Pangkal Batang ➔ 🪴 4. Raba Tanah 2 cm',
            content: `
                <p>Lakukan pemeriksaan rutin 4 langkah ini minimal 2 kali seminggu pada kebun sekolah Anda:</p>
                <ul>
                    <li><strong>Langkah 1 — Amati Tajuk & Warna Daun:</strong> Lihat tanaman secara menyeluruh dari jarak 1 meter. Apakah daun berdiri tegak atau lunglai? Apakah warnanya hijau segar merata atau ada pola belang-belang, bercak, atau daun terbakar?</li>
                    <li><strong>Langkah 2 — Balik Helai Daun (Cek Bawah Daun):</strong> Sebagian besar serangga hama (kutu daun, thrips, tungau) bersembunyi di bagian bawah daun untuk menghindari sinar terik dan tetesan hujan. Periksa apakah ada koloni serangga, telur, atau jaring laba-laba halus.</li>
                    <li><strong>Langkah 3 — Periksa Batang & Pangkal Tanah:</strong> Amati bagian batang yang berbatasan dengan tanah. Apakah ada luka membusuk kecokelatan, lubang gerek batang, atau lendir basah?</li>
                    <li><strong>Langkah 4 — Tes Fisik Kelembapan Tanah:</strong> Benamkan ujung jari 2-3 cm ke tanah. Rasakan apakah tanah dingin lembap, basah berlumpur, atau kering remah. Angkat pot untuk merasakan bobotnya (pot basah terasa berat, pot kering terasa sangat ringan).</li>
                </ul>
            `,
            keyTakeaway: 'Deteksi dini di awal serangan hama adalah kunci keberhasilan kebun organik tanpa pestisida kimia berbahaya.'
        },

        // --------------------------------------------------------------------
        // KATEGORI 4: 🌾 ENSIKLOPEDIA 10 JENIS TANAMAN
        // --------------------------------------------------------------------
        {
            id: 'tanaman_tomat',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🍅',
            title: 'Tomat (Solanum lycopersicum)',
            summary: 'Sayuran buah populer kaya antioksidan likopen yang menyukai sinar matahari penuh dan ajir penopang.',
            flowDiagram: '🌱 Semai (5-7 hari) ➔ 🌿 Vegetatif (30 hari) ➔ 🌸 Berbunga (45 hari) ➔ 🍅 Panen Merah (70-80 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Buah</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sedang - Tinggi (teratur konsisten)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (6-8 jam/hari)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah gembur + kompos + sekam (pH 6.0 - 6.8)</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 65 - 80 hari hingga panen</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Ulat buah, kutu kebul, busuk ujung buah (*blossom end rot*)</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Pasang ajir atau tiang bambu setinggi 1.5 meter sejak tanaman setinggi 20 cm untuk menopang cabang buah yang berat.</li>
                    <li>Pangkas tunas air (*suckers*) yang tumbuh di ketiak daun agar nutrisi terfokus membesarkan buah utama.</li>
                    <li><em>Tips Kunci:</em> Jangan menyiram tanah secara fluktuatif (kadang sangat kering kadang banjir becek), karena dapat memicu buah tomat pecah kulit (*cracking*) dan busuk pantat buah akibat kekurangan kalsium.</li>
                </ul>
            `,
            keyTakeaway: 'Tomat membutuhkan sinar matahari penuh, ajir penopang kokoh, dan penyiraman yang stabil konsisten.'
        },
        {
            id: 'tanaman_cabai',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🌶️',
            title: 'Cabai (Capsicum annuum)',
            summary: 'Komoditas hortikultura bernilai ekonomi tinggi penghasil rasa pedas capsaicin yang tahan panas.',
            flowDiagram: '🌱 Semai (7-10 hari) ➔ 🌿 Perdu Rimbun ➔ 🌸 Bunga Putih ➔ 🌶️ Panen Merah (75-90 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Buah / Rempah</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sedang (tahan kering ringan, benci becek)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (7-8 jam/hari)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah lempung berpasir kaya bahan organik</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 75 - 90 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Thrips (daun keriting), lalat buah, antraknosa (patek buah)</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Lakukan perempelan tunas samping bawah sebelum cabang utama bercabang Y untuk memperkuat batang utama.</li>
                    <li>Saat mulai berbunga, tambahkan pupuk tinggi Kalium (K) dan Kalsium (Ca) agar bunga tidak mudah rontok dan kulit buah tebal mengkilap.</li>
                    <li><em>Tips Kunci:</em> Petik buah cabai bersama tangkainya di pagi hari saat cuaca cerah agar luka petikan cepat kering dan tidak terinfeksi jamur patek.</li>
                </ul>
            `,
            keyTakeaway: 'Cabai menyukai cuaca hangat terik dan drainase lancar tanpa genangan air di perakaran.'
        },
        {
            id: 'tanaman_selada',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🥬',
            title: 'Selada (Lactuca sativa)',
            summary: 'Sayuran daun renyah berumur pendek yang sangat menyukai lingkungan sejuk lembap.',
            flowDiagram: '🌱 Biji Kecil (3 hari) ➔ 🌿 Daun Muda (14 hari) ➔ 🥬 Krop Renyah (30-40 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Daun</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Tinggi (tanah harus selalu lembap sejuk)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Partial Shade (3-5 jam matahari pagi)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Sangat gembur (tanah + cocopeat + kompos)</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 30 - 45 hari (cepat panen!)</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Siput, kutu daun, busuk basah daun bawah</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Selada memiliki perakaran dangkal, sehingga permukaan tanah tidak boleh dibiarkan mengering tandus.</li>
                    <li>Jika terkena terik matahari siang yang terlalu panas, selada akan mengalami <em>bolting</em> (tumbuh bunga dini) yang membuat daunnya terasa pahit dan kaku.</li>
                    <li><em>Tips Kunci:</em> Panen dapat dilakukan bertahap dengan memetik daun terluar satu per satu (*cut-and-come-again*) sehingga tanaman terus tumbuh memproduksi daun baru selama beberapa minggu.</li>
                </ul>
            `,
            keyTakeaway: 'Selada ideal ditanam di tempat ternaungi dengan tanah lembap sejuk dan dapat dipanen dalam waktu sebulan.'
        },
        {
            id: 'tanaman_wortel',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🥕',
            title: 'Wortel (Daucus carota)',
            summary: 'Tanaman sayuran umbi kaya vitamin A yang membutuhkan media tanam dalam bebas batu kerikil.',
            flowDiagram: '🌱 Tunas Halus (7 hari) ➔ 🌿 Daun Berbulu ➔ 🥕 Pembesaran Umbi (60 hari) ➔ Panen (75-90 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Umbi Akar</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sedang (konsisten agar umbi tidak retak)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (6 jam/hari)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Pasir gembur dalam, bebas batu/kerikil padat</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 70 - 90 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Lalat wortel, nematoda bengkak akar, bercak daun</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Lakukan penjarangan bibit (*thinning*) saat tanaman setinggi 5 cm, sisakan jarak antar tanaman sekitar 5-7 cm agar umbi memiliki ruang untuk membesar.</li>
                    <li>Jangan memberikan pupuk kandang mentah atau pupuk berkadar Nitrogen terlalu tinggi karena akan membuat daun sangat lebat tetapi umbi wortel bercabang dan kurus.</li>
                    <li><em>Tips Kunci:</em> Pastikan media tanam diayak halus tanpa kerikil; jika akar wortel membentur batu, umbi akan membelah menjadi dua cabang atau bengkok.</li>
                </ul>
            `,
            keyTakeaway: 'Tanah gembur tanpa batu dan penjarangan bibit adalah rahasia menghasilkan umbi wortel lurus dan montok.'
        },
        {
            id: 'tanaman_kentang',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🥔',
            title: 'Kentang (Solanum tuberosum)',
            summary: 'Tanaman pangan penghasil umbi batang berkarbohidrat tinggi yang membutuhkan pembubunan tanah rutin.',
            flowDiagram: '🥔 Tunas Umbi Biji ➔ 🌿 Rumpun Rimbun ➔ 🌸 Bunga Ungu/Putih ➔ 🥔 Umbi Matang (90-110 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Umbi Batang / Pangan</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sedang (stabil, kurangi menjelang panen)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (suhu sejuk 16-22°C paling ideal)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah remah gembur berpasir kaya bahan organik</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 90 - 120 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Kumbang kentang, busuk daun Phytophthora, layu bakteri</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li><strong>Pembubunan Tanah (Hilling):</strong> Timbun tanah di sekeliling pangkal batang secara bertahap seiring bertambahnya tinggi tanaman untuk menciptakan ruang tumbuh umbi-umbi baru di dalam tanah.</li>
                    <li><em>Peringatan Bahaya Solanin:</em> Jangan biarkan umbi kentang menyembul keluar terkena sinar matahari! Paparan cahaya akan memicu fotosintesis di kulit umbi sehingga berubah menjadi hijau dan memproduksi racun alkaloid <em>solanin</em> yang berbahaya bila dimakan.</li>
                </ul>
            `,
            keyTakeaway: 'Selalu timbun pangkal batang kentang dengan tanah agar umbi terbentuk banyak dan tidak berubah hijau beracun.'
        },
        {
            id: 'tanaman_bayam',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🥗',
            title: 'Bayam (Amaranthus sp.)',
            summary: 'Sayuran daun hijau kaya zat besi dan serat dengan waktu panen tercepat di antara sayuran lainnya.',
            flowDiagram: '🌱 Tabur Biji Halus ➔ 🌿 Kecambah (3 hari) ➔ 🥗 Panen Cabut / Petik (20-25 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Daun Super Cepat</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Tinggi (siram rutin 1-2 kali sehari)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun hingga Partial Shade</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah subur kaya unsur hara Nitrogen dan kompos</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 20 - 25 hari (hanya 3 minggu!)</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Ulat penggulung daun, karat putih daun (*Albugo*)</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Biji bayam sangat halus, campurkan dengan sedikit pasir kering saat menabur agar sebaran biji merata di atas bedengan.</li>
                    <li>Berikan pupuk organik cair kaya Nitrogen pada hari ke-10 untuk memperlebat daun hijau segar.</li>
                    <li><em>Tips Kunci:</em> Segera panen bayam sebelum tanaman mengeluarkan tangkai bunga (*infloresens*). Jika sudah berbunga, helai daun akan mengecil, mengeras, dan nilai gizinya menurun.</li>
                </ul>
            `,
            keyTakeaway: 'Bayam adalah tanaman tercepat dipanen di kebun sekolah, siap dipetik hanya dalam waktu 3 minggu.'
        },
        {
            id: 'tanaman_kangkung',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🌿',
            title: 'Kangkung (Ipomoea aquatica)',
            summary: 'Sayuran batang berongga yang sangat adaptif, tahan air melimpah, dan dapat dipanen berulang kali.',
            flowDiagram: '🌱 Benih Biji Keras ➔ 🌿 Tunas Berbatang Rongga ➔ ✂️ Panen Potong (25 hari) ➔ 🔄 Tumbuh Ulang',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Daun & Batang Basah</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sangat Tinggi (sangat menyukai tanah basah becek)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (sepanjang hari)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah liat berhumus atau tanah gembur kaya air</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 21 - 30 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Belalang, ulat grayak, karat putih daun</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Sebelum disemai, rendam benih kangkung dalam air hangat selama 6-12 jam untuk melunakkan kulit biji yang keras agar cepat berkecambah.</li>
                    <li>Kangkung membutuhkan air melimpah; pastikan tanah tidak pernah kering kerontang.</li>
                    <li><em>Tips Panen Berulang:</em> Panen kangkung dengan cara memotong batangnya menggunakan gunting tajam sekitar 3 cm di atas permukaan tanah. Dari buku batang yang tersisa akan tumbuh tunas-tunas baru yang siap dipanen kembali 2 minggu kemudian!</li>
                </ul>
            `,
            keyTakeaway: 'Panen kangkung dengan metode potong batang untuk memanennya berkali-kali dari satu kali penanaman.'
        },
        {
            id: 'tanaman_mentimun',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🥒',
            title: 'Mentimun (Cucumis sativus)',
            summary: 'Tanaman buah merambat berair tinggi yang membutuhkan lanjaran dan penyerbukan lebah.',
            flowDiagram: '🌱 Semai Biji ➔ 🌿 Sulur Merambat Para-Para ➔ 🌼 Bunga Kuning ➔ 🥒 Panen Buah Segar (40-50 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Buah Merambat</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Tinggi (buah timun mengandung 95% air)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (cahaya terik penuh)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah gembur dengan banyak kompos pupuk kandang</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 40 - 55 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Kumbang mentimun (*Aulacophora*), embun tepung, virus mosaik</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Sediakan lanjaran atau jaring rambatan (*trellis*) setinggi 1.5 - 2 meter agar buah mentimun menggantung lurus, bersih dari tanah, dan tidak busuk terkena cipratan air kotor.</li>
                    <li>Mentimun memiliki bunga jantan dan bunga betina terpisah pada satu pohon; jaga kelestarian serangga lebah di sekitar kebun untuk membantu penyerbukan.</li>
                    <li><em>Tips Kunci:</em> Petik buah mentimun saat masih muda dan bijinya belum mengeras agar teksturnya renyah dan tidak terasa pahit.</li>
                </ul>
            `,
            keyTakeaway: 'Lanjaran rambatan bambu membuat buah mentimun tumbuh lurus panjang, bersih, dan bebas pembusukan tanah.'
        },
        {
            id: 'tanaman_terong',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🍆',
            title: 'Terong (Solanum melongena)',
            summary: 'Tanaman perdu berbuah ungu mengkilap yang tahan cuaca panas dan produktif berbuah lama.',
            flowDiagram: '🌱 Semai (10 hari) ➔ 🌿 Perdu Kokoh ➔ 🌸 Bunga Ungu Cantik ➔ 🍆 Buah Ungu Mengkilap (60-75 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Buah Solanaceae</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sedang - Tinggi (teratur tidak becek)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (sangat menyukai iklim panas)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Lempung berpasir subur berdrainase baik</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 60 - 80 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Kutu kebul putih, kumbang daun (*Epilachna*), layu bakteri</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Terong memiliki masa hidup dan produktivitas yang cukup panjang (dapat dipanen berbulan-bulan). Berikan pupuk susulan setiap 2 minggu sekali.</li>
                    <li>Pasang ajir pengikat batang karena saat buah terong mulai banyak, tanaman dapat miring atau patah oleh bobot buah.</li>
                    <li><em>Tips Kunci:</em> Panen buah terong saat kulitnya masih kencang dan berkilau (*glossy*). Jika kulit buah sudah kusam kecokelatan, biji di dalamnya sudah tua dan daging buah terasa pahit/liat.</li>
                </ul>
            `,
            keyTakeaway: 'Petik terong saat kulit masih mengkilap; jangan tunggu sampai kusam karena rasa akan menjadi pahit.'
        },
        {
            id: 'tanaman_bawang',
            category: 'tanaman',
            categoryName: '10 Jenis Tanaman',
            icon: '🧅',
            title: 'Bawang Merah & Daun Bawang (Allium sp.)',
            summary: 'Tanaman umbi lapis beraroma khas yang menyukai tanah berpasir lepas dan sinar matahari penuh.',
            flowDiagram: '🧅 Tanam Siung Bawang ➔ 🌿 Daun Silindris Berongga ➔ 🧅 Pembentukan Umbi Lapis (60-70 hari)',
            content: `
                <div class="crop-info-grid">
                    <div class="crop-stat-item"><strong>Kategori:</strong> Sayuran Umbi Lapis & Daun Rempah</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Air:</strong> Sedang (sangat sensitif terhadap genangan air)</div>
                    <div class="crop-stat-item"><strong>Kebutuhan Cahaya:</strong> Full Sun (10-12 jam penyinaran penuh)</div>
                    <div class="crop-stat-item"><strong>Media Tanam:</strong> Tanah lempung berpasir gembur berpori tinggi</div>
                    <div class="crop-stat-item"><strong>Waktu Tumbuh:</strong> 60 - 75 hari</div>
                    <div class="crop-stat-item"><strong>Hama/Penyakit:</strong> Ulat grayak bawang (*Spodoptera exigua*), penyakit moler (Fusarium)</div>
                </div>
                <h5 style="margin-top:10px; color:var(--primary-dark);">Cara Perawatan & Tips:</h5>
                <ul>
                    <li>Saat menanam bibit siung bawang, potong 1/3 ujung atas siung untuk merangsang tumbuhnya tunas daun baru secara serempak.</li>
                    <li>Tanam siung dengan ujung menghadap ke atas dan benamkan 2/3 bagian siung ke dalam tanah gembur.</li>
                    <li><em>Tips Panen:</em> Hentikan penyiraman total 7-10 hari sebelum panen ketika daun mulai rebah menguning alami. Hal ini penting agar umbi bawang mengering padat dan tahan disimpan berbulan-bulan tanpa membusuk.</li>
                </ul>
            `,
            keyTakeaway: 'Hentikan penyiraman seminggu sebelum panen agar umbi bawang kering padat dan awet disimpan lama.'
        },

        // --------------------------------------------------------------------
        // KATEGORI 5: 🤖 AI & TANAMAN
        // --------------------------------------------------------------------
        {
            id: 'ai_apa_itu',
            category: 'ai',
            categoryName: 'AI & Pertanian',
            icon: '🤖',
            title: 'Apa Itu Artificial Intelligence (AI)?',
            summary: 'Mengenal teknologi komputasi cerdas yang meniru kemampuan berpikir dan belajar manusia.',
            flowDiagram: '💾 Kumpulan Data Foto Daun ➔ 🧠 Machine Learning (Training) ➔ 🎯 Model AI Siap Memprediksi',
            content: `
                <p><strong>Artificial Intelligence (Kecerdasan Buatan / AI)</strong> adalah cabang ilmu komputer yang bertujuan menciptakan sistem perangkat lunak yang mampu melakukan tugas-tugas yang biasanya membutuhkan kecerdasan manusia.</p>
                <ul>
                    <li><strong>Machine Learning (Pembelajaran Mesin):</strong> Bagian dari AI di mana komputer tidak diprogram aturan kaku baris demi baris, melainkan "belajar" mengenali pola dari ribuan contoh data pelatihan (*dataset*).</li>
                    <li><strong>Deep Learning & Neural Network:</strong> Arsitektur komputasi yang terinspirasi oleh jaringan saraf otak manusia, sangat andal dalam memproses data visual citra (*computer vision*) dan suara.</li>
                    <li><strong>Penerapan Nyata:</strong> Dalam project Kebun Pintar 3D ini, pustaka <em>TensorFlow.js</em> dan <em>Teachable Machine</em> digunakan untuk memproses citra daun secara real-time langsung di browser siswa!</li>
                </ul>
            `,
            keyTakeaway: 'AI belajar dari ribuan contoh gambar daun untuk mengenali pola warna, tekstur, dan bentuk kerusakan tanaman.'
        },
        {
            id: 'ai_pertanian_modern',
            category: 'ai',
            categoryName: 'AI & Pertanian',
            icon: '🚜',
            title: 'Bagaimana AI Membantu Pertanian Modern?',
            summary: 'Revolusi pertanian presisi (Smart Farming) berbasis sensor IoT, drone, dan algoritma cerdas.',
            flowDiagram: '🛰️ Sensor/Drone Kebun ➔ 🤖 AI Analisis Data Realtime ➔ 💧 Irigasi Presisi & Panen Optimal',
            content: `
                <p>Pertanian modern kini telah memasuki era <strong>Pertanian Presisi (Precision Agriculture / Smart Farming)</strong>:</p>
                <ul>
                    <li><strong>Irigasi Otomatis Berbasis Sensor:</strong> Sensor kelembapan tanah dihubungkan dengan algoritma AI cuaca untuk menyalakan kran penyiraman hanya saat tanaman benar-benar membutuhkan air, menghemat konsumsi air hingga 40%.</li>
                    <li><strong>Drone Pemantau Hektaran Kebun:</strong> Kamera multispektral pada drone ber-AI memindai ribuan hektar lahan dalam hitungan menit untuk memetakan indeks kehijauan (*NDVI*) tanaman yang kekurangan pupuk.</li>
                    <li><strong>Robot Pemanen Otomatis:</strong> Lengan robotik dengan visi komputer cerdas dapat mendeteksi tingkat kematangan buah stroberi atau tomat berdasarkan warna dan memetiknya tanpa merusak buah.</li>
                </ul>
            `,
            keyTakeaway: 'AI mengubah pertanian konvensional menjadi pertanian presisi tinggi yang lebih efisien, hemat air, dan ramah lingkungan.'
        },
        {
            id: 'ai_pengenalan_gambar',
            category: 'ai',
            categoryName: 'AI & Pertanian',
            icon: '📷',
            title: 'Pengenalan Kondisi Tanaman via Gambar',
            summary: 'Cara kerja algoritma Computer Vision dalam membedah piksel daun menjadi prediksi ilmiah.',
            flowDiagram: '📸 Foto Daun Masuk ➔ 🧩 Ekstraksi Fitur (Piksel, Warna, Lesi) ➔ 📊 Skor Probabilitas Kelas',
            content: `
                <p>Bagaimana komputer dapat "melihat" dan mendiagnosis selembar daun hanya dari foto kamera?</p>
                <ul>
                    <li><strong>1. Konversi Piksel:</strong> Gambar daun dipecah menjadi matriks angka piksel merah (Red), hijau (Green), dan biru (Blue) berukuran 224 x 224 piksel.</li>
                    <li><strong>2. Convolutional Layers (CNN):</strong> Lapisan-lapisan filter digital menyaring fitur visual: lapisan awal mendeteksi garis tepi helai daun, lapisan tengah mendeteksi pola tulang daun, dan lapisan akhir mengenali corak bercak lesi penyakit.</li>
                    <li><strong>3. Klasifikasi Probabilitas:</strong> Output akhir berupa persentase keyakinan (*confidence score*), misalnya: 92% Daun Sehat, 5% Daun Kering, dan 3% Daun Busuk.</li>
                </ul>
            `,
            keyTakeaway: 'Computer Vision menganalisis perbedaan tekstur, kontur tepi, dan spektrum warna piksel pada helai daun.'
        },
        {
            id: 'ai_analisis_kesehatan',
            category: 'ai',
            categoryName: 'AI & Pertanian',
            icon: '🩺',
            title: 'Analisis Kesehatan Daun & Deteksi Dini',
            summary: 'Mendeteksi gejala klorosis dan lesi bercak nekrosis sebelum mewabah di seluruh lahan kebun.',
            flowDiagram: '🔍 Deteksi Lesi Dini (1 Daun) ➔ ⚠️ Peringatan AI ➔ ✂️ Pangkas Daun Sakit ➔ 🛡️ Kebun Terselamatkan',
            content: `
                <p>Keunggulan terbesar pemanfaatan AI dalam kesehatan tanaman adalah <strong>kecepatan deteksi dini (*early detection*)</strong>:</p>
                <ul>
                    <li><strong>Deteksi Gejala Mikro:</strong> AI mampu mengenali bercak jamur mikroskopis atau pudar klorofil halus beberapa hari sebelum mata manusia menyadarinya.</li>
                    <li><strong>Pencegahan Outbreak:</strong> Dengan mendeteksi 1 daun sakit di awal minggu, petani dapat segera memangkasnya sebelum spora jamur meledak menginfeksi ratusan tanaman lainnya.</li>
                    <li><strong>Pengurangan Bahan Kimia:</strong> Petani hanya perlu menyemprot tanaman yang terindikasi sakit (*spot spraying*), sehingga tidak perlu membuang racun pestisida ke seluruh kebun.</li>
                </ul>
            `,
            keyTakeaway: 'Deteksi dini oleh AI memungkinkan penanganan terlokalisir sehingga mencegah gagal panen massal.'
        },
        {
            id: 'ai_kasus_kebun_pintar',
            category: 'ai',
            categoryName: 'AI & Pertanian',
            icon: '🔬',
            title: 'Studi Kasus: AI Dokter Tanaman Kebun Pintar',
            summary: 'Implementasi nyata model Teachable Machine 4 kelas: SEHAT, KERING, BUSUK, dan LAYU.',
            flowDiagram: '📷 Foto Daun ➔ 🤖 Model AI Teachable Machine ➔ 🌿 Prediksi (SEHAT / KERING / BUSUK / LAYU)',
            content: `
                <p>Dalam aplikasi web <strong>Kebun Pintar 3D</strong> ini, fitur <strong>AI Dokter Tanaman</strong> telah dihubungkan langsung dengan model Teachable Machine hasil pelatihan dataset daun:</p>
                <ul>
                    <li><strong>Kelas SEHAT:</strong> Mendeteksi warna hijau klorofil merata dan turgor daun yang segar tanpa lesi penyakit.</li>
                    <li><strong>Kelas KERING:</strong> Mendeteksi warna kecokelatan rapuh dan dehidrasi jaringan tepi daun akibat kekurangan air.</li>
                    <li><strong>Kelas BUSUK:</strong> Mendeteksi jaringan daun yang lembek berair kehitaman akibat overwatering atau pembusukan jamur/bakteri.</li>
                    <li><strong>Kelas LAYU:</strong> Mendeteksi postur helai dan tangkai daun yang terkulai lemas kehilangan tekanan seluler.</li>
                    <li><strong>Threshold Keamanan 75%:</strong> Jika keyakinan model di bawah 75%, sistem secara transparan menampilkan status <em>"Belum Yakin"</em> dan menolak membuat kesimpulan keliru!</li>
                </ul>
            `,
            keyTakeaway: 'AI Dokter Tanaman di game ini membuktikan bagaimana kecerdasan buatan dapat diterapkan secara nyata dan transparan untuk edukasi sekolah.'
        },
        {
            id: 'ai_verifikasi_keterbatasan',
            category: 'ai',
            categoryName: 'AI & Pertanian',
            icon: '⚠️',
            title: 'Mengapa Hasil AI Wajib Diverifikasi Manusia?',
            summary: 'Memahami batasan teknologi AI dan pentingnya nalar kritis serta inspeksi fisik oleh manusia.',
            flowDiagram: '🤖 Rekomendasi AI (Alat Bantu) + 👨‍🌾 Verifikasi Petani/Siswa (Nalar Nyata) = 🎯 Keputusan Tepat',
            content: `
                <p>Sebagai siswa yang cerdas berteknologi, kita tidak boleh menelan mentah-mentah hasil keputusan AI tanpa nalar kritis (*critical thinking*):</p>
                <ul>
                    <li><strong>1. AI Tidak Bisa Merasakan Fisik Tanah:</strong> Kamera AI hanya melihat helai daun berwarna kuning. AI tidak bisa merasakan apakah tanah di bawahnya kering remah atau becek berlumpur. Hanya tangan manusia yang bisa memastikannya!</li>
                    <li><strong>2. Masalah Kualitas Foto:</strong> Foto yang buram, sudut miring (*glare* pantulan cahaya), bayangan gelap, atau latar belakang berantakan dapat menipu model AI hingga menghasilkan prediksi keliru (*false positive*).</li>
                    <li><strong>3. Kemiripan Gejala (*Symptom Overlap*):</strong> Daun menguning bisa disebabkan oleh kelebihan air, kekurangan air, atau defisiensi Nitrogen. AI kamera hanya melihat warna, sehingga butuh pertimbangan nalar manusia untuk mencari akar penyebabnya.</li>
                    <li><strong>4. AI Sebagai Pendukung, Bukan Pengganti:</strong> AI adalah asisten pintar untuk mempercepat diagnosa awal, namun keputusan akhir dan tindakan perawatan tetap berada di tangan akal budi manusia.</li>
                </ul>
            `,
            keyTakeaway: 'AI adalah alat bantu cerdas, bukan penentu mutlak. Selalu lakukan verifikasi fisik kondisi tanah dan lingkungan tanaman Anda.'
        }
    ],

    // ========================================================================
    // 3. BANK SOAL KUIS INTERAKTIF (Lengkap dengan Pembahasan Ilmiah)
    // ========================================================================
    quizQuestions: [
        {
            id: 1,
            question: 'Apa tujuan utama dari penyiraman air pada tanaman di kebun?',
            options: [
                'Memberikan air untuk pelarut nutrisi tanah dan bahan baku fotosintesis',
                'Membuat tanah tergenang banjir terus-menerus',
                'Mengeraskan permukaan helai daun tanaman',
                'Membunuh seluruh cacing dan mikroorganisme di dalam tanah'
            ],
            correct: 0,
            explanation: 'Air berfungsi sebagai pelarut nutrisi tanah agar dapat diserap akar serta reaktan utama dalam proses fotosintesis.'
        },
        {
            id: 2,
            question: 'Reaksi fotosintesis pada daun tanaman berklorofil menghasilkan produk utama berupa:',
            options: [
                'Glukosa (karbohidrat) dan Gas Oksigen (O₂)',
                'Gas Karbon Dioksida dan Gas Nitrogen',
                'Asam Sulfat dan Logam Kalsium',
                'Metana dan Minyak Atsiri'
            ],
            correct: 0,
            explanation: 'Persamaan fotosintesis: 6 CO₂ + 6 H₂O + Sinar Matahari menghasilkan Glukosa (C₆H₁₂O₆) dan Oksigen (6 O₂).'
        },
        {
            id: 3,
            question: 'Bibit tanaman yang ditaruh di tempat gelap akan tumbuh kurus, tinggi pucat, dan rapuh. Fenomena ini disebut:',
            options: [
                'Etiolasi',
                'Gutasi',
                'Transpirasi',
                'Dormansi Biji'
            ],
            correct: 0,
            explanation: 'Etiolasi adalah pertumbuhan abnormal tanaman di tempat minim cahaya, di mana hormon auksin memicu pemanjangan batang berlebih.'
        },
        {
            id: 4,
            question: 'Unsur hara makro utama (N-P-K) yang paling berperan membentuk kehijauan daun dan merangsang pertumbuhan vegetatif adalah:',
            options: [
                'Nitrogen (N)',
                'Fosfor (P)',
                'Kalium (K)',
                'Kalsium (Ca)'
            ],
            correct: 0,
            explanation: 'Nitrogen (N) adalah bahan pembangun asam amino dan klorofil daun. Kekurangan Nitrogen menyebabkan daun menguning (klorosis).'
        },
        {
            id: 5,
            question: 'Bagaimana cara aman dan ramah lingkungan mengatasi kutu daun (aphids) di kebun sekolah?',
            options: [
                'Menyemprotkan larutan sabun nabati / ekstrak bawang putih',
                'Menyiramkan bahan bakar minyak ke seluruh tanaman',
                'Menebang semua pohon pelindung kebun',
                'Memberikan pupuk kimia dosis 10 kali lipat'
            ],
            correct: 0,
            explanation: 'Pestisida nabati organik seperti larutan sabun ringan atau ekstrak bawang putih efektif mengusir kutu daun tanpa mencemari lingkungan.'
        },
        {
            id: 6,
            question: 'Kapan waktu yang paling disarankan untuk menyiram tanaman kebun?',
            options: [
                'Pagi hari (sebelum terik) atau sore hari menjelang sejuk',
                'Tepat tengah hari jam 12 saat matahari sedang terik-teriknya',
                'Hanya tengah malam jam 01.00 subuh',
                'Cukup sebulan sekali saat ada hujan badai'
            ],
            correct: 0,
            explanation: 'Pagi dan sore hari adalah waktu terbaik karena penguapan rendah dan daun tidak mengalami luka bakar akibat efek lensa air di siang bolong.'
        },
        {
            id: 7,
            question: 'Mengapa umbi kentang yang menyembul keluar tanah dan terkena sinar matahari tidak boleh dimakan?',
            options: [
                'Karena berubah hijau dan memproduksi racun alkaloid solanin',
                'Karena rasanya menjadi terlalu manis',
                'Karena berubah tekstur menjadi batu keras',
                'Karena umbi kentang akan meledak'
            ],
            correct: 0,
            explanation: 'Paparan cahaya memicu terbentuknya klorofil dan zat racun glikoalkaloid solanin pada umbi kentang yang dapat menyebabkan keracunan.'
        },
        {
            id: 8,
            question: 'Mengapa hasil analisis kesehatan tanaman oleh kamera AI tetap harus diverifikasi manusia?',
            options: [
                'AI hanya menganalisis visual foto dan tidak dapat merasakan kelembapan/bau tanah secara fisik',
                'Karena AI tidak pernah membutuhkan listrik',
                'Karena kamera ponsel dapat merusak sel-sel tanaman',
                'Karena tanaman akan marah jika difoto oleh AI'
            ],
            correct: 0,
            explanation: 'AI kamera hanya menganalisis permukaan foto. Faktor krusial seperti kebasahan tanah fisik dan infeksi akar hanya bisa dipastikan oleh tangan manusia.'
        }
    ]
};

// Ekspos ke window secara global
window.plantsData = plantsData;
