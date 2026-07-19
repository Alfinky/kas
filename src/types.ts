/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Warga {
  id: string;
  nama: string;
  noRumah: string;
  noHp: string;
  email: string;
  jumlahKeluarga: number;
  status: 'aktif' | 'nonaktif' | 'pindah' | 'menunggu_persetujuan' | 'ditolak';
  password: string;
  role: 'admin' | 'warga';
  fotoKtp?: string; // base64 or placeholder
  fotoKk?: string; // base64 or placeholder
  waktuDaftar: string;
}

export interface Tagihan {
  id: string;
  idWarga: string;
  jenis: 'jimpitan' | 'keamanan' | 'sampah';
  periode: string; // e.g., "Oktober 2023", "September 2023"
  nominal: number;
  jatuhTempo: string; // e.g., "10 Oktober 2023"
  status: 'belum_bayar' | 'lunas' | 'menunggak';
}

export interface Pembayaran {
  id: string;
  idTagihan: string;
  tanggalBayar: string;
  jumlahBayar: number;
  metode: 'tunai' | 'transfer' | 'qris';
  buktiBayar?: string; // base64 or placeholder
  dicatatOleh: string; // "Admin" or "Sistem (Online)"
}

export interface Notifikasi {
  id: string;
  idWarga: string;
  jenis: 'pengingat' | 'konfirmasi' | 'tunggakan' | 'broadcast';
  isiPesan: string;
  waktuKirim: string;
  statusKirim: 'terkirim' | 'gagal';
}

export interface Pengumuman {
  id: string;
  judul: string;
  konten: string;
  tanggal: string;
  dilihat: number;
}


