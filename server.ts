import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./src/db/index.ts";
import { warga, tagihan, pembayaran, pengumuman, notifikasi } from "./src/db/schema.ts";
import { eq } from "drizzle-orm";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// 1. Seed helper to populate the database with initial mock data on first boot if empty
async function seedDatabaseIfEmpty() {
  try {
    const existingWarga = await db.select().from(warga).limit(1);
    if (existingWarga.length > 0) {
      console.log("Database already seeded with warga.");
      return;
    }

    console.log("Database is empty. Seeding initial admin data...");

    // Seed initial warga (Only Admin)
    const initialWarga = [
      {
        uid: "admin-1-uid",
        id: 1, // Let's explicitly set id to 1 for consistency
        nama: "Hendy (Admin RT)",
        noRumah: "Blok A No. 1",
        noHp: "08111222333",
        email: "admin@arsanta.com",
        jumlahKeluarga: 3,
        status: "aktif",
        role: "admin",
        fotoKtp: "placeholder_ktp",
        fotoKk: "placeholder_kk",
      }
    ];

    for (const w of initialWarga) {
      await db.insert(warga).values(w).onConflictDoNothing();
    }

    console.log("Database seeded successfully with Admin RT account!");
  } catch (err) {
    console.error("Failed to seed database:", err);
  }
}

// 2. Fetch all database state in a single call to populate frontend cache
app.get("/api/sync/fetch", async (req, res) => {
  try {
    const listWarga = await db.select().from(warga);
    const listTagihan = await db.select().from(tagihan);
    const listPembayaran = await db.select().from(pembayaran);
    const listPengumuman = await db.select().from(pengumuman);
    const listNotifikasi = await db.select().from(notifikasi);

    // Map numeric IDs back to string formats if frontend expects strings
    const mappedWarga = listWarga.map((w) => ({
      id: String(w.id),
      nama: w.nama,
      noRumah: w.noRumah,
      noHp: w.noHp,
      email: w.email,
      jumlahKeluarga: w.jumlahKeluarga,
      status: w.status,
      role: w.role,
      fotoKtp: w.fotoKtp,
      fotoKk: w.fotoKk,
      waktuDaftar: w.waktuDaftar.toISOString(),
      password: "password123", // placeholder for local compatibility
    }));

    const mappedTagihan = listTagihan.map((t) => ({
      id: String(t.id),
      idWarga: String(t.idWarga),
      jenis: t.jenis,
      periode: t.periode,
      nominal: t.nominal,
      jatuhTempo: t.jatuhTempo,
      status: t.status,
    }));

    const mappedPembayaran = listPembayaran.map((p) => ({
      id: String(p.id),
      idTagihan: String(p.idTagihan),
      tanggalBayar: p.tanggalBayar,
      jumlahBayar: p.jumlahBayar,
      metode: p.metode,
      dicatatOleh: p.dicatatOleh,
    }));

    const mappedPengumuman = listPengumuman.map((p) => ({
      id: String(p.id),
      judul: p.judul,
      konten: p.konten,
      tanggal: p.tanggal,
      dilihat: p.dilihat,
    }));

    const mappedNotifikasi = listNotifikasi.map((n) => ({
      id: String(n.id),
      idWarga: String(n.idWarga),
      jenis: n.jenis,
      isiPesan: n.isiPesan,
      waktuKirim: n.waktuKirim,
      statusKirim: n.statusKirim,
    }));

    res.json({
      warga: mappedWarga,
      tagihan: mappedTagihan,
      pembayaran: mappedPembayaran,
      pengumuman: mappedPengumuman,
      notifikasi: mappedNotifikasi,
    });
  } catch (err: any) {
    console.error("Sync fetch error:", err);
    res.status(500).json({ error: err.message });
  }
});

// 3. Save modified lists to PostgreSQL
app.post("/api/sync/save", async (req, res) => {
  try {
    const { warga: postWarga, tagihan: postTagihan, pembayaran: postPembayaran, pengumuman: postPengumuman, notifikasi: postNotifikasi } = req.body;

    // Direct transaction-like upsert strategy
    if (postWarga && Array.isArray(postWarga)) {
      for (const w of postWarga) {
        const idNum = w.id.startsWith("warga-") ? null : parseInt(w.id, 10);
        const data = {
          uid: w.uid || `warga-uid-${w.id}`,
          nama: w.nama,
          noRumah: w.noRumah,
          noHp: w.noHp,
          email: w.email,
          jumlahKeluarga: w.jumlahKeluarga || 1,
          status: w.status,
          role: w.role,
          fotoKtp: w.fotoKtp,
          fotoKk: w.fotoKk,
        };

        if (idNum && !isNaN(idNum)) {
          await db.insert(warga).values({ id: idNum, ...data })
            .onConflictDoUpdate({
              target: warga.id,
              set: data
            });
        } else {
          // New record (e.g. registered from frontend)
          await db.insert(warga).values(data).onConflictDoNothing();
        }
      }
    }

    if (postTagihan && Array.isArray(postTagihan)) {
      for (const t of postTagihan) {
        const idNum = t.id.startsWith("tag-") ? null : parseInt(t.id, 10);
        const wargaIdNum = parseInt(t.idWarga, 10);
        if (isNaN(wargaIdNum)) continue;

        const data = {
          idWarga: wargaIdNum,
          jenis: t.jenis,
          periode: t.periode,
          nominal: t.nominal,
          jatuhTempo: t.jatuhTempo,
          status: t.status,
        };

        if (idNum && !isNaN(idNum)) {
          await db.insert(tagihan).values({ id: idNum, ...data })
            .onConflictDoUpdate({
              target: tagihan.id,
              set: data
            });
        } else {
          await db.insert(tagihan).values(data);
        }
      }
    }

    if (postPembayaran && Array.isArray(postPembayaran)) {
      for (const p of postPembayaran) {
        const idNum = p.id.startsWith("pay-") ? null : parseInt(p.id, 10);
        const tagihanIdNum = parseInt(p.idTagihan, 10);
        if (isNaN(tagihanIdNum)) continue;

        const data = {
          idTagihan: tagihanIdNum,
          tanggalBayar: p.tanggalBayar,
          jumlahBayar: p.jumlahBayar,
          metode: p.metode,
          dicatatOleh: p.dicatatOleh,
        };

        if (idNum && !isNaN(idNum)) {
          await db.insert(pembayaran).values({ id: idNum, ...data })
            .onConflictDoUpdate({
              target: pembayaran.id,
              set: data
            });
        } else {
          await db.insert(pembayaran).values(data);
        }
      }
    }

    if (postPengumuman && Array.isArray(postPengumuman)) {
      for (const p of postPengumuman) {
        const idNum = p.id.startsWith("ann-") ? null : parseInt(p.id, 10);
        const data = {
          judul: p.judul,
          konten: p.konten,
          tanggal: p.tanggal,
          dilihat: p.dilihat || 0,
        };

        if (idNum && !isNaN(idNum)) {
          await db.insert(pengumuman).values({ id: idNum, ...data })
            .onConflictDoUpdate({
              target: pengumuman.id,
              set: data
            });
        } else {
          await db.insert(pengumuman).values(data);
        }
      }
    }

    if (postNotifikasi && Array.isArray(postNotifikasi)) {
      for (const n of postNotifikasi) {
        const idNum = n.id.startsWith("not-") ? null : parseInt(n.id, 10);
        const wargaIdNum = parseInt(n.idWarga, 10);
        if (isNaN(wargaIdNum)) continue;

        const data = {
          idWarga: wargaIdNum,
          jenis: n.jenis,
          isiPesan: n.isiPesan,
          waktuKirim: n.waktuKirim,
          statusKirim: n.statusKirim,
        };

        if (idNum && !isNaN(idNum)) {
          await db.insert(notifikasi).values({ id: idNum, ...data })
            .onConflictDoUpdate({
              target: notifikasi.id,
              set: data
            });
        } else {
          await db.insert(notifikasi).values(data);
        }
      }
    }

    res.json({ success: true, message: "Database synchronized successfully" });
  } catch (err: any) {
    console.error("Sync save error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Serve static assets in production or mount Vite middleware in development
async function startServer() {
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
