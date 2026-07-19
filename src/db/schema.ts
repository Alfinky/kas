import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Table for citizens and admin users
export const warga = pgTable('warga', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  nama: text('nama').notNull(),
  noRumah: text('no_rumah').notNull(),
  noHp: text('no_hp').notNull(),
  email: text('email').notNull(),
  jumlahKeluarga: integer('jumlah_keluarga').default(1).notNull(),
  status: text('status').default('aktif').notNull(), // 'aktif', 'pending', 'nonaktif'
  role: text('role').default('warga').notNull(), // 'warga', 'admin'
  fotoKtp: text('foto_ktp'),
  fotoKk: text('foto_kk'),
  waktuDaftar: timestamp('waktu_daftar').defaultNow().notNull(),
});

// Table for bills
export const tagihan = pgTable('tagihan', {
  id: serial('id').primaryKey(),
  idWarga: integer('id_warga').references(() => warga.id, { onDelete: 'cascade' }).notNull(),
  jenis: text('jenis').notNull(), // 'jimpitan', 'keamanan', 'sampah', etc.
  periode: text('periode').notNull(), // e.g., 'Oktober 2023'
  nominal: integer('nominal').notNull(),
  jatuhTempo: text('jatuh_tempo').notNull(),
  status: text('status').default('belum_bayar').notNull(), // 'belum_bayar', 'lunas', 'menunggak'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table for payments
export const pembayaran = pgTable('pembayaran', {
  id: serial('id').primaryKey(),
  idTagihan: integer('id_tagihan').references(() => tagihan.id, { onDelete: 'cascade' }).notNull(),
  tanggalBayar: text('tanggal_bayar').notNull(),
  jumlahBayar: integer('jumlah_bayar').notNull(),
  metode: text('metode').notNull(), // 'transfer', 'qris', 'tunai'
  dicatatOleh: text('dicatat_oleh').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table for announcements
export const pengumuman = pgTable('pengumuman', {
  id: serial('id').primaryKey(),
  judul: text('judul').notNull(),
  konten: text('konten').notNull(),
  tanggal: text('tanggal').notNull(),
  dilihat: integer('dilihat').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Table for notifications
export const notifikasi = pgTable('notifikasi', {
  id: serial('id').primaryKey(),
  idWarga: integer('id_warga').references(() => warga.id, { onDelete: 'cascade' }).notNull(),
  jenis: text('jenis').notNull(), // 'konfirmasi', 'pengingat'
  isiPesan: text('isi_pesan').notNull(),
  waktuKirim: text('waktu_kirim').notNull(),
  statusKirim: text('status_kirim').default('terkirim').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const wargaRelations = relations(warga, ({ many }) => ({
  tagihanList: many(tagihan),
  notifikasiList: many(notifikasi),
}));

export const tagihanRelations = relations(tagihan, ({ one, many }) => ({
  warga: one(warga, {
    fields: [tagihan.idWarga],
    references: [warga.id],
  }),
  pembayaranList: many(pembayaran),
}));

export const pembayaranRelations = relations(pembayaran, ({ one }) => ({
  tagihan: one(tagihan, {
    fields: [pembayaran.idTagihan],
    references: [tagihan.id],
  }),
}));

export const notifikasiRelations = relations(notifikasi, ({ one }) => ({
  warga: one(warga, {
    fields: [notifikasi.idWarga],
    references: [warga.id],
  }),
}));
