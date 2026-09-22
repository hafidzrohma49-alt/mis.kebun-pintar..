/**
 * KEBUN PINTAR 3D — Simulator Berkebun + AI Dokter Tanaman
 * File: js/schedule.js
 * Deskripsi: Modul Jadwal Perawatan Tanaman (tambah tugas, tanggal, waktu, tandai selesai, hapus, dan penyimpanan localStorage).
 */

class ScheduleManager {
    constructor() {
        this.STORAGE_KEY = 'kebunPintar_schedule';
        this.tasks = [];
        this.loadTasks();
        this.initDOM();
    }

    // Muat daftar tugas dari localStorage atau buat default
    loadTasks() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (saved) {
            try {
                this.tasks = JSON.parse(saved);
            } catch (e) {
                console.error('Gagal parse schedule:', e);
                this.tasks = this.getDefaultTasks();
            }
        } else {
            this.tasks = this.getDefaultTasks();
            this.saveTasks();
        }
    }

    // Tugas default untuk demonstrasi kebun sekolah
    getDefaultTasks() {
        return [
            {
                id: 'task_' + Date.now() + '_1',
                title: 'Menyiram Kebun Selada',
                date: '2026-09-17',
                time: '07:00',
                completed: false
            },
            {
                id: 'task_' + Date.now() + '_2',
                title: 'Memberi Pupuk Kompos di Bedengan Tomat',
                date: '2026-09-18',
                time: '16:30',
                completed: false
            },
            {
                id: 'task_' + Date.now() + '_3',
                title: 'Memeriksa Hama Kutu Daun pada Cabai',
                date: '2026-09-19',
                time: '08:00',
                completed: true
            }
        ];
    }

    // Simpan ke localStorage
    saveTasks() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tasks));
    }

    // Inisialisasi Event Listener Formulir Jadwal
    initDOM() {
        document.addEventListener('DOMContentLoaded', () => {
            const form = document.getElementById('scheduleForm');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit();
                });
            }

            // Set default date ke hari ini
            const dateInput = document.getElementById('taskDate');
            if (dateInput) {
                const today = new Date().toISOString().split('T')[0];
                dateInput.value = today;
            }

            this.renderTasks();
        });
    }

    // Tambah Tugas Baru
    handleFormSubmit() {
        const titleInput = document.getElementById('taskTitle');
        const dateInput = document.getElementById('taskDate');
        const timeInput = document.getElementById('taskTime');

        if (!titleInput || !dateInput || !timeInput) return;

        const title = titleInput.value.trim();
        const date = dateInput.value;
        const time = timeInput.value;

        if (!title) {
            alert('Silakan masukkan nama tugas perawatan.');
            return;
        }

        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
            title: title,
            date: date || 'Hari Ini',
            time: time || '07:00',
            completed: false
        };

        this.tasks.unshift(newTask);
        this.saveTasks();
        this.renderTasks();

        // Reset form
        titleInput.value = '';
        if (window.appAudio) window.appAudio.play('click');
        if (window.appState) window.appState.showToast('✅ Jadwal tugas berhasil ditambahkan!');
    }

    // Toggle Status Tugas (Selesai / Belum)
    toggleTask(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            if (window.appAudio) {
                window.appAudio.play(task.completed ? 'correct' : 'click');
            }
            if (task.completed && window.appState) {
                window.appState.addXp(15);
                window.appState.showToast('🌟 Tugas selesai! +15 XP');
            }
        }
    }

    // Hapus Tugas
    deleteTask(taskId) {
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.saveTasks();
        this.renderTasks();
        if (window.appAudio) window.appAudio.play('click');
        if (window.appState) window.appState.showToast('🗑️ Tugas dihapus.');
    }

    // Render Daftar Tugas ke HTML
    renderTasks() {
        const listContainer = document.getElementById('scheduleList');
        if (!listContainer) return;

        if (this.tasks.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-schedule-state">
                    <p>🌱 Belum ada jadwal perawatan kebun.</p>
                    <small>Tambahkan jadwal seperti menyiram, memberi pupuk, atau memeriksa tanaman.</small>
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';

        this.tasks.forEach(task => {
            const card = document.createElement('div');
            card.className = `schedule-item-card ${task.completed ? 'completed' : ''}`;

            // Format tanggal ramah baca
            const dateStr = task.date || 'Hari ini';
            const timeStr = task.time || '07:00';

            card.innerHTML = `
                <div class="schedule-info">
                    <div class="schedule-title-row">
                        <span class="schedule-status-icon">${task.completed ? '✅' : '⏳'}</span>
                        <h4 class="schedule-title ${task.completed ? 'text-strikethrough' : ''}">${task.title}</h4>
                    </div>
                    <div class="schedule-meta">
                        <span>📅 ${dateStr}</span>
                        <span>⏰ ${timeStr} WIB</span>
                        <span class="schedule-badge ${task.completed ? 'badge-done' : 'badge-pending'}">
                            ${task.completed ? 'Selesai' : 'Perlu Dikerjakan'}
                        </span>
                    </div>
                </div>
                <div class="schedule-actions">
                    <button class="btn-action-task btn-toggle-done" onclick="window.scheduleManager.toggleTask('${task.id}')">
                        ${task.completed ? 'Batalkan' : 'Selesai'}
                    </button>
                    <button class="btn-action-task btn-delete-task" onclick="window.scheduleManager.deleteTask('${task.id}')" title="Hapus Tugas">
                        🗑️
                    </button>
                </div>
            `;

            listContainer.appendChild(card);
        });
    }
}

// Inisialisasi Schedule Manager Global
window.scheduleManager = new ScheduleManager();
