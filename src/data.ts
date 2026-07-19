/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Warga, Tagihan, Pembayaran, Notifikasi, Pengumuman } from './types';

// Initial Mock Citizens (Only Admin RT for production bootstrap)
const INITIAL_WARGA: Warga[] = [
  {
    id: '1',
    nama: 'Hendy (Admin RT)',
    noRumah: 'Blok A No. 1',
    noHp: '08111222333',
    email: 'admin@arsanta.com',
    jumlahKeluarga: 3,
    status: 'aktif',
    password: 'arsanta2026',
    role: 'admin',
    waktuDaftar: '2022-12-01T00:00:00Z'
  }
];

// Initial Mock Bills
const INITIAL_TAGIHAN: Tagihan[] = [];

// Initial Mock Payments
const INITIAL_PEMBAYARAN: Pembayaran[] = [];

// Initial Mock Announcements
const INITIAL_PENGUMUMAN: Pengumuman[] = [];

// Initial Mock Notifications
const INITIAL_NOTIFIKASI: Notifikasi[] = [];

// Helper to initialize local storage
export function initLocalStorage() {
  if (!localStorage.getItem('arsanta_warga')) {
    localStorage.setItem('arsanta_warga', JSON.stringify(INITIAL_WARGA));
  }
  if (!localStorage.getItem('arsanta_tagihan')) {
    localStorage.setItem('arsanta_tagihan', JSON.stringify(INITIAL_TAGIHAN));
  }
  if (!localStorage.getItem('arsanta_pembayaran')) {
    localStorage.setItem('arsanta_pembayaran', JSON.stringify(INITIAL_PEMBAYARAN));
  }
  if (!localStorage.getItem('arsanta_pengumuman')) {
    localStorage.setItem('arsanta_pengumuman', JSON.stringify(INITIAL_PENGUMUMAN));
  }
  if (!localStorage.getItem('arsanta_notifikasi')) {
    localStorage.setItem('arsanta_notifikasi', JSON.stringify(INITIAL_NOTIFIKASI));
  }
}

// Sync Operations with Cloud SQL/PostgreSQL database
export async function syncDatabaseFromServer(): Promise<boolean> {
  try {
    const response = await fetch('/api/sync/fetch');
    if (!response.ok) throw new Error('Gagal mengambil data dari server database');
    const data = await response.json();
    
    if (data.warga) localStorage.setItem('arsanta_warga', JSON.stringify(data.warga));
    if (data.tagihan) localStorage.setItem('arsanta_tagihan', JSON.stringify(data.tagihan));
    if (data.pembayaran) localStorage.setItem('arsanta_pembayaran', JSON.stringify(data.pembayaran));
    if (data.pengumuman) localStorage.setItem('arsanta_pengumuman', JSON.stringify(data.pengumuman));
    if (data.notifikasi) localStorage.setItem('arsanta_notifikasi', JSON.stringify(data.notifikasi));
    return true;
  } catch (err) {
    console.error('Database Sync Error:', err);
    return false;
  }
}

export async function syncDatabaseToPostgres(): Promise<boolean> {
  try {
    const payload = {
      warga: getWargaList(),
      tagihan: getTagihanList(),
      pembayaran: getPembayaranList(),
      pengumuman: getPengumumanList(),
      notifikasi: getNotifikasiList()
    };
    
    const response = await fetch('/api/sync/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (err) {
    console.error('Save sync to database failed:', err);
    return false;
  }
}

// Data Getters & Setters
export function getWargaList(): Warga[] {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('arsanta_warga') || '[]');
}

export function saveWargaList(list: Warga[]) {
  localStorage.setItem('arsanta_warga', JSON.stringify(list));
  syncDatabaseToPostgres();
}

export function getTagihanList(): Tagihan[] {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('arsanta_tagihan') || '[]');
}

export function saveTagihanList(list: Tagihan[]) {
  localStorage.setItem('arsanta_tagihan', JSON.stringify(list));
  syncDatabaseToPostgres();
}

export function getPembayaranList(): Pembayaran[] {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('arsanta_pembayaran') || '[]');
}

export function savePembayaranList(list: Pembayaran[]) {
  localStorage.setItem('arsanta_pembayaran', JSON.stringify(list));
  syncDatabaseToPostgres();
}

export function getPengumumanList(): Pengumuman[] {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('arsanta_pengumuman') || '[]');
}

export function savePengumumanList(list: Pengumuman[]) {
  localStorage.setItem('arsanta_pengumuman', JSON.stringify(list));
  syncDatabaseToPostgres();
}

export function getNotifikasiList(): Notifikasi[] {
  initLocalStorage();
  return JSON.parse(localStorage.getItem('arsanta_notifikasi') || '[]');
}

export function saveNotifikasiList(list: Notifikasi[]) {
  localStorage.setItem('arsanta_notifikasi', JSON.stringify(list));
  syncDatabaseToPostgres();
}


