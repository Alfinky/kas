/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Bell, Shield, Trash2, PiggyBank, Plus, Search, UserPlus, FileSpreadsheet, Share2, AlertTriangle, Send, Mail, Check, X, CheckCircle2, ChevronRight, Edit3, CheckCircle, Database, Smartphone, Users, CreditCard, Upload, FolderOpen } from 'lucide-react';
import { Warga, Tagihan, Pembayaran, Notifikasi } from '../types';
import { getWargaList, saveWargaList, getTagihanList, saveTagihanList, getPembayaranList, savePembayaranList, getNotifikasiList, saveNotifikasiList } from '../data';
import DatabaseSyncPanel from './DatabaseSyncPanel';

interface AdminDashboardProps {
  user: Warga;
  onLogout: () => void;
}

type TabType = 'beranda' | 'warga' | 'riwayat' | 'database' | 'tunggakan' | 'berkas';

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('beranda');
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);
  const [pembayaranList, setPembayaranList] = useState<Pembayaran[]>([]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'tambah_warga' | 'buat_tagihan' | 'ingatkan_warga' | 'catat_pembayaran_manual' | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Forms state: Tambah Warga
  const [newWargaNama, setNewWargaNama] = useState('');
  const [newWargaNoRumah, setNewWargaNoRumah] = useState('');
  const [newWargaNoHp, setNewWargaNoHp] = useState('');
  const [newWargaEmail, setNewWargaEmail] = useState('');
  const [newWargaJumlahKeluarga, setNewWargaJumlahKeluarga] = useState(3);
  const [newWargaPassword, setNewWargaPassword] = useState('password123');
  const [newWargaFotoKtp, setNewWargaFotoKtp] = useState<string | null>(null);
  const [newWargaFotoKk, setNewWargaFotoKk] = useState<string | null>(null);

  // Forms state: Buat Tagihan
  const [tagihanPeriode, setTagihanPeriode] = useState('Oktober 2023');
  const [tagihanJimpitanNominal, setTagihanJimpitanNominal] = useState(15000);
  const [tagihanKeamananNominal, setTagihanKeamananNominal] = useState(45000);
  const [tagihanSampahNominal, setTagihanSampahNominal] = useState(25000);

  // Forms state: Ingatkan Warga
  const [selectedDelinquent, setSelectedDelinquent] = useState<{ warga: Warga; monthsCount: number; amount: number } | null>(null);
  const [customReminderMsg, setCustomReminderMsg] = useState('');

  // Forms state: Catat Pembayaran Manual
  const [manualPayWargaId, setManualPayWargaId] = useState('');
  const [manualPayTagihanId, setManualPayTagihanId] = useState('');
  const [manualPayMetode, setManualPayMetode] = useState<'tunai' | 'transfer'>('tunai');

  // Search filter
  const [wargaSearch, setWargaSearch] = useState('');
  const [viewDocUser, setViewDocUser] = useState<{ name: string; title: string; image: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWargaList(getWargaList());
    setTagihanList(getTagihanList());
    setPembayaranList(getPembayaranList());
  };

  // Calculations for Admin Counters (Matches Screen 3)
  // Let's compute Jimpitan, Keamanan, Sampah collected totals
  const getCollectedTotal = (jenis: 'jimpitan' | 'keamanan' | 'sampah') => {
    const matchingTagihanIds = tagihanList.filter(t => t.jenis === jenis && t.status === 'lunas').map(t => t.id);
    return pembayaranList.filter(p => matchingTagihanIds.includes(p.idTagihan)).reduce((acc, curr) => acc + curr.jumlahBayar, 0);
  };

  const totalJimpitan = getCollectedTotal('jimpitan');
  const totalKeamanan = getCollectedTotal('keamanan');
  const totalSampah = getCollectedTotal('sampah');

  // Delinquent citizens processing (AW, SR, BP matching Screen 3)
  const getDelinquents = () => {
    const activeWarga = wargaList.filter(w => w.role === 'warga' && w.status === 'aktif');
    const delinquentsData: { warga: Warga; monthsCount: number; amount: number }[] = [];

    activeWarga.forEach(w => {
      const userUnpaid = tagihanList.filter(t => t.idWarga === w.id && (t.status === 'belum_bayar' || t.status === 'menunggak'));
      if (userUnpaid.length > 0) {
        // Group by period to find number of months
        const periods = Array.from(new Set(userUnpaid.map(t => t.periode)));
        const amount = userUnpaid.reduce((sum, curr) => sum + curr.nominal, 0);
        delinquentsData.push({
          warga: w,
          monthsCount: periods.length,
          amount
        });
      }
    });

    // Sort by monthsCount descending
    return delinquentsData.sort((a, b) => b.monthsCount - a.monthsCount);
  };

  const delinquents = getDelinquents();

  // Pending registrations processing
  const pendingRegistrations = wargaList.filter(w => w.role === 'warga' && w.status === 'menunggu_persetujuan');

  // Create Warga logic
  const handleAddWarga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWargaNama || !newWargaNoRumah || !newWargaNoHp) {
      alert('Harap isi semua kolom wajib!');
      return;
    }

    const newWarga: Warga = {
      id: `warga-${Date.now()}`,
      nama: newWargaNama,
      noRumah: newWargaNoRumah,
      noHp: newWargaNoHp,
      email: newWargaEmail || `${newWargaNama.toLowerCase().replace(/\s+/g, '')}@email.com`,
      jumlahKeluarga: Number(newWargaJumlahKeluarga),
      status: 'aktif',
      password: newWargaPassword,
      role: 'warga',
      fotoKtp: newWargaFotoKtp || undefined,
      fotoKk: newWargaFotoKk || undefined,
      waktuDaftar: new Date().toISOString()
    };

    const updated = [newWarga, ...wargaList];
    saveWargaList(updated);

    alert(`Warga baru "${newWargaNama}" berhasil didaftarkan!`);
    
    // Reset Form
    setNewWargaNama('');
    setNewWargaNoRumah('');
    setNewWargaNoHp('');
    setNewWargaEmail('');
    setNewWargaJumlahKeluarga(3);
    setNewWargaFotoKtp(null);
    setNewWargaFotoKk(null);
    
    setActiveModal(null);
    loadData();
  };

  // Generate Bulk Bills logic
  const handleGenerateBills = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeCitizens = wargaList.filter(w => w.role === 'warga' && w.status === 'aktif');
    
    if (activeCitizens.length === 0) {
      alert('Tidak ada warga aktif untuk ditagih!');
      return;
    }

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menerbitkan tagihan baru periode "${tagihanPeriode}" untuk ${activeCitizens.length} warga aktif?`
    );
    if (!confirmed) return;

    let generatedCount = 0;
    const newTags: Tagihan[] = [...tagihanList];

    activeCitizens.forEach(w => {
      // Check if already has bill for this period
      const hasBill = tagihanList.some(t => t.idWarga === w.id && t.periode === tagihanPeriode);
      if (!hasBill) {
        // Create 3 bills (Jimpitan, Keamanan, Sampah)
        const idBase = Date.now() + Math.random().toString(36).substr(2, 5);
        newTags.push({ id: `tag-${idBase}-1`, idWarga: w.id, jenis: 'jimpitan', periode: tagihanPeriode, nominal: Number(tagihanJimpitanNominal), jatuhTempo: `10 ${tagihanPeriode.split(' ')[0].substring(0, 3)} 2026`, status: 'belum_bayar' });
        newTags.push({ id: `tag-${idBase}-2`, idWarga: w.id, jenis: 'keamanan', periode: tagihanPeriode, nominal: Number(tagihanKeamananNominal), jatuhTempo: `10 ${tagihanPeriode.split(' ')[0].substring(0, 3)} 2026`, status: 'belum_bayar' });
        newTags.push({ id: `tag-${idBase}-3`, idWarga: w.id, jenis: 'sampah', periode: tagihanPeriode, nominal: Number(tagihanSampahNominal), jatuhTempo: `10 ${tagihanPeriode.split(' ')[0].substring(0, 3)} 2026`, status: 'belum_bayar' });
        generatedCount++;
      }
    });

    if (generatedCount === 0) {
      alert('Semua warga sudah memiliki tagihan untuk periode ini!');
      setActiveModal(null);
      return;
    }

    saveTagihanList(newTags);

    alert(`Tagihan massal periode "${tagihanPeriode}" berhasil diterbitkan untuk ${generatedCount} warga!`);
    setActiveModal(null);
    loadData();
  };

  // Reminder trigger
  const handleOpenReminder = (del: typeof delinquents[0]) => {
    setSelectedDelinquent(del);
    setCustomReminderMsg(
      `Halo *${del.warga.nama}* (Rumah: ${del.warga.noRumah}),\n\nKami dari Pengurus RT 01 Paguyuban Arsanta ingin mengingatkan terkait kewajiban iuran kas warga (Keamanan & Sampah) Anda yang menunggak selama *${del.monthsCount} bulan* dengan total kewajiban *Rp ${del.amount.toLocaleString('id-ID')}*.\n\nMohon lakukan pembayaran segera melalui aplikasi Kas Warga Arsanta atau temui Bendahara RT. Terima kasih atas pengertian dan kerjasamanya.`
    );
    setActiveModal('ingatkan_warga');
  };

  const handleSendReminder = () => {
    if (!selectedDelinquent) return;
    
    // Log Notification inside local DB
    const allNotif = getNotifikasiList();
    const newNotif: Notifikasi = {
      id: `not-${Date.now()}`,
      idWarga: selectedDelinquent.warga.id,
      jenis: 'tunggakan',
      isiPesan: customReminderMsg,
      waktuKirim: new Date().toLocaleString('id-ID'),
      statusKirim: 'terkirim'
    };

    saveNotifikasiList([newNotif, ...allNotif]);
    alert(`Pengingat WhatsApp berhasil dikirim (simulasi) ke nomor warga: ${selectedDelinquent.warga.noHp}!\nPesan terkirim.`);
    setActiveModal(null);
    setSelectedDelinquent(null);
    loadData();
  };

  // Record Manual Payment
  const handleRecordManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualPayWargaId || !manualPayTagihanId) {
      alert('Harap pilih warga dan tagihan!');
      return;
    }

    const selectedBill = tagihanList.find(t => t.id === manualPayTagihanId);
    if (!selectedBill) return;

    const allPembayaran = getPembayaranList();
    const todayString = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });

    // 1. Update tagihan status
    const updatedTags = tagihanList.map(t => {
      if (t.id === manualPayTagihanId) {
        return { ...t, status: 'lunas' as const };
      }
      return t;
    });

    // 2. Create payment entry
    const newPay: Pembayaran = {
      id: `pay-${Date.now()}`,
      idTagihan: manualPayTagihanId,
      tanggalBayar: todayString,
      jumlahBayar: selectedBill.nominal,
      metode: manualPayMetode,
      dicatatOleh: 'Admin'
    };

    saveTagihanList(updatedTags);
    savePembayaranList([newPay, ...allPembayaran]);

    alert('Pembayaran tunai berhasil dicatat secara resmi!');
    setManualPayWargaId('');
    setManualPayTagihanId('');
    setActiveModal(null);
    loadData();
  };

  // Toggle Citizen Status
  const handleToggleCitizenStatus = async (citizenId: string, newStatus: Warga['status']) => {
    const updated = wargaList.map(w => {
      if (w.id === citizenId) {
        return { ...w, status: newStatus };
      }
      return w;
    });
    saveWargaList(updated);

    loadData();
  };

  const handleApproveRegistration = async (citizenId: string) => {
    const updated = wargaList.map(w => {
      if (w.id === citizenId) {
        return { ...w, status: 'aktif' as const };
      }
      return w;
    });
    saveWargaList(updated);
    
    // Add automatic system notification for this citizen
    const notifList = getNotifikasiList();
    const newNotif = {
      id: `not-${Date.now()}`,
      idWarga: citizenId,
      jenis: 'konfirmasi' as const,
      isiPesan: 'Pendaftaran akun Anda telah disetujui oleh Admin RT. Selamat bergabung!',
      waktuKirim: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      statusKirim: 'terkirim' as const
    };
    saveNotifikasiList([newNotif, ...notifList]);

    alert('Pendaftaran warga berhasil disetujui! Berkas KTP dan KK disimpan di menu Berkas Warga.');
    loadData();
  };

  const handleRejectRegistration = async (citizenId: string) => {
    if (!confirm('Apakah Anda yakin ingin menolak pengajuan pendaftaran warga ini?')) {
      return;
    }
    const updated = wargaList.map(w => {
      if (w.id === citizenId) {
        return { ...w, status: 'ditolak' as const };
      }
      return w;
    });
    saveWargaList(updated);

    alert('Pendaftaran warga telah ditolak.');
    loadData();
  };

  // Filtered Citizen list
  const filteredWarga = wargaList.filter(
    (w) =>
      w.role === 'warga' &&
      w.status !== 'menunggu_persetujuan' &&
      w.status !== 'ditolak' &&
      (w.nama.toLowerCase().includes(wargaSearch.toLowerCase()) ||
        w.noRumah.toLowerCase().includes(wargaSearch.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between font-sans pb-24 relative animate-fade-in" id="admin-dashboard">
      
      {/* 1. Admin Header */}
      <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 custom-shadow-sm" id="admin-header">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 hover:bg-slate-50 rounded-lg text-secondary transition-all"
            id="btn-admin-drawer-open"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold font-display text-secondary">
            Kas Warga <span className="text-xs bg-primary-dark/15 text-primary-dark font-extrabold px-2 py-0.5 rounded-full ml-1.5 uppercase">Admin</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Database Shortcut */}
          <button 
            onClick={() => setActiveTab('database')}
            className={`p-2 rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${activeTab === 'database' ? 'bg-sky-50 text-primary-dark' : 'text-slate-500 hover:text-slate-800'}`}
            id="btn-shortcut-db"
          >
            <Database className="w-4 h-4" />
            <span className="hidden sm:inline">Database SQL</span>
          </button>
          {/* Avatar */}
          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer shadow-sm active:scale-95 transition-all"
            id="admin-avatar"
          >
            <img 
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
              alt="Avatar Admin" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* 2. Admin Side Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-secondary/30 backdrop-blur-sm z-50 animate-fade-in flex" id="admin-drawer-overlay">
          <div className="w-4/5 max-w-xs bg-white h-full p-6 flex flex-col justify-between animate-slide-up" id="admin-drawer-content">
            <div className="space-y-6 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                    <img 
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150" 
                      alt="Avatar Admin" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-secondary">Hendy RT</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Ketua RT 01</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('beranda'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'beranda' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('warga'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-3 transition-all ${activeTab === 'warga' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span>Data Warga</span>
                  </div>
                  {pendingRegistrations.length > 0 && (
                    <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full leading-none animate-pulse">
                      {pendingRegistrations.length} baru
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('berkas'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'berkas' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <FolderOpen className="w-4 h-4 text-primary shrink-0" />
                  <span>Berkas</span>
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('tunggakan'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-3 transition-all ${activeTab === 'tunggakan' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Tunggakan</span>
                  </div>
                  {delinquents.length > 0 && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full leading-none">
                      {delinquents.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('riwayat'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'riwayat' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>Riwayat</span>
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('database'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'database' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Database className="w-4 h-4 text-primary shrink-0" />
                  <span>Database SQL</span>
                </button>
              </nav>
            </div>

            <button
              onClick={() => { setIsDrawerOpen(false); onLogout(); }}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border border-rose-100 transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Views router */}
      <main className="flex-1 p-5 space-y-6">
        
        {/* TAB A: MAIN DASHBOARD */}
        {activeTab === 'beranda' && (
          <div className="space-y-6 animate-fade-in" id="admin-view-beranda">
            
            {/* Greeting */}
            <div id="admin-greeting">
              <h2 className="text-xl font-black font-display text-secondary tracking-tight">
                Berikut ringkasan kas warga hari ini.
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                RT 01 Paguyuban Arsanta • Transparansi Keuangan Terpusat
              </p>
            </div>

            {pendingRegistrations.length > 0 && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-fade-in" id="admin-banner-pending-registrations">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-800">Pendaftaran Warga Baru</h4>
                    <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                      Ada {pendingRegistrations.length} pengajuan pendaftaran baru yang memerlukan persetujuan Anda.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('warga')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 rounded-lg transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  Periksa
                </button>
              </div>
            )}

            {/* Recaps Vertical Stack (Matches Screen 3 layout exactly) */}
            <div className="space-y-3" id="admin-recap-stack">
              
              {/* Jimpitan */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between transition-all hover:scale-[1.01]" id="admin-recap-jimpitan">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center text-primary-dark border border-sky-100/50">
                    <PiggyBank className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">Jimpitan</h4>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                      +2.4% bln ini
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black font-display text-secondary">
                    Rp {totalJimpitan.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Kas Sosial Terkumpul</p>
                </div>
              </div>

              {/* Keamanan */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between transition-all hover:scale-[1.01]" id="admin-recap-keamanan">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center text-primary-dark border border-sky-100/50">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">Keamanan</h4>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                      Aktif • RT 01
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black font-display text-secondary">
                    Rp {totalKeamanan.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Pos Satpam & Portal</p>
                </div>
              </div>

              {/* Sampah */}
              <div className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between transition-all hover:scale-[1.01]" id="admin-recap-sampah">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 bg-sky-50 rounded-xl flex items-center justify-center text-primary-dark border border-sky-100/50">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-400">Sampah</h4>
                    <p className="text-[10px] text-emerald-500 font-semibold mt-0.5 bg-emerald-50 px-2 py-0.5 rounded-full inline-block border border-emerald-100">
                      Rutin Mingguan
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black font-display text-secondary">
                    Rp {totalSampah.toLocaleString('id-ID')}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">Pengangkutan Kebersihan</p>
                </div>
              </div>

            </div>

            {/* Aksi Cepat Section (Matches Screen 3) */}
            <div className="space-y-3" id="admin-aksi-cepat-section">
              <h3 className="text-xs font-extrabold text-secondary uppercase tracking-wider px-1">
                Aksi Cepat
              </h3>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Tambah Warga */}
                <button
                  onClick={() => setActiveModal('tambah_warga')}
                  className="bg-primary hover:bg-primary-dark text-white p-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98] font-extrabold text-xs cursor-pointer"
                  id="btn-admin-add-warga"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Tambah Warga</span>
                </button>

                {/* Buat Tagihan */}
                <button
                  onClick={() => setActiveModal('buat_tagihan')}
                  className="bg-white hover:bg-slate-50 text-primary border-2 border-primary p-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] font-extrabold text-xs cursor-pointer"
                  id="btn-admin-create-bill"
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Buat Tagihan</span>
                </button>

              </div>
            </div>



          </div>
        )}

        {/* TAB B: MANAGE CITIZENS */}
        {activeTab === 'warga' && (
          <div className="space-y-6 animate-fade-in" id="admin-view-warga">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold font-display text-secondary">Daftar Warga RT 01</h2>
                <p className="text-xs text-slate-400">Total terdaftar: {filteredWarga.length} Kepala Keluarga</p>
              </div>
              <button
                onClick={() => setActiveModal('tambah_warga')}
                className="bg-primary hover:opacity-90 text-white font-bold text-xs p-2.5 rounded-xl flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </button>
            </div>

            {/* Pendaftaran Warga Baru (Menunggu Persetujuan) */}
            {pendingRegistrations.length > 0 && (
              <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 space-y-3.5" id="admin-pending-registrations-container">
                <div className="flex items-center justify-between border-b border-amber-200/50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">
                      Pengajuan Pendaftaran Baru ({pendingRegistrations.length})
                    </h3>
                  </div>
                  <span className="text-[9px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                    Perlu Persetujuan
                  </span>
                </div>

                <div className="space-y-3">
                  {pendingRegistrations.map((w) => (
                    <div key={w.id} className="bg-white rounded-2xl p-4 border border-slate-150/80 custom-shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-bold text-xs border border-amber-100">
                            {w.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-secondary">{w.nama}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              Rumah No. {w.noRumah} • Telp: {w.noHp}
                            </p>
                            <p className="text-[9px] text-slate-500 font-medium">
                              Email: {w.email} • Anggota Keluarga: {w.jumlahKeluarga} orang
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] text-slate-400 font-semibold bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                          {new Date(w.waktuDaftar).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Documents Uploaded */}
                      <div className="bg-slate-50/75 border border-slate-100 rounded-xl p-3 space-y-2">
                        <p className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Berkas Lampiran Syarat</p>
                        <div className="flex gap-2">
                          {w.fotoKtp ? (
                            <button
                              type="button"
                              onClick={() => setViewDocUser({ name: w.nama, title: 'Foto KTP ' + w.nama, image: w.fotoKtp! })}
                              className="bg-sky-50 hover:bg-sky-100 text-primary-dark font-extrabold px-3 py-2 rounded-xl border border-sky-150 transition-all text-[10px] flex items-center gap-1.5 cursor-pointer"
                            >
                              📄 Lihat Foto KTP
                            </button>
                          ) : (
                            <span className="text-slate-400 bg-slate-100 px-3 py-2 rounded-xl font-medium border border-slate-200 text-[10px]">KTP: Kosong</span>
                          )}

                          {w.fotoKk ? (
                            <button
                              type="button"
                              onClick={() => setViewDocUser({ name: w.nama, title: 'Foto KK ' + w.nama, image: w.fotoKk! })}
                              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-3 py-2 rounded-xl border border-emerald-150 transition-all text-[10px] flex items-center gap-1.5 cursor-pointer"
                            >
                              📄 Lihat Foto KK
                            </button>
                          ) : (
                            <span className="text-slate-400 bg-slate-100 px-3 py-2 rounded-xl font-medium border border-slate-200 text-[10px]">KK: Kosong</span>
                          )}
                        </div>
                      </div>

                      {/* Approval Buttons */}
                      <div className="flex gap-2 justify-end pt-1.5 border-t border-slate-100">
                        <button
                          onClick={() => handleRejectRegistration(w.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all border border-rose-100 cursor-pointer"
                        >
                          Tolak Pendaftaran
                        </button>
                        <button
                          onClick={() => handleApproveRegistration(w.id)}
                          className="bg-primary hover:bg-primary-dark text-white font-extrabold text-[11px] px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
                        >
                          Setujui & Aktifkan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari warga berdasarkan nama atau blok..."
                value={wargaSearch}
                onChange={(e) => setWargaSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
              />
            </div>

            {/* Citizens List */}
            <div className="space-y-3" id="admin-citizens-table">
              {filteredWarga.map((w) => {
                const unpaid = tagihanList.filter(t => t.idWarga === w.id && (t.status === 'belum_bayar' || t.status === 'menunggak'));
                const unpaidTotal = unpaid.reduce((sum, curr) => sum + curr.nominal, 0);

                return (
                  <div key={w.id} className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold text-xs">
                          {w.nama.charAt(0)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-secondary">{w.nama}</h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{w.noRumah} • {w.noHp}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        w.status === 'aktif' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}>
                        {w.status}
                      </span>
                    </div>

                    {/* Dokumen Persyaratan (KTP & KK) */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold">
                      <span className="text-slate-500 font-bold">Syarat Dokumen:</span>
                      <div className="flex gap-1.5">
                        {w.fotoKtp ? (
                          <button
                            type="button"
                            onClick={() => setViewDocUser({ name: w.nama, title: 'Foto KTP', image: w.fotoKtp! })}
                            className="bg-sky-50 hover:bg-sky-100 text-primary-dark font-extrabold px-2 py-1 rounded-lg border border-sky-150 transition-all text-[10px]"
                          >
                            📄 KTP Terlampir
                          </button>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-lg font-medium border border-slate-200 text-[10px]">KTP: Kosong</span>
                        )}

                        {w.fotoKk ? (
                          <button
                            type="button"
                            onClick={() => setViewDocUser({ name: w.nama, title: 'Foto KK (Kartu Keluarga)', image: w.fotoKk! })}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-extrabold px-2 py-1 rounded-lg border border-emerald-150 transition-all text-[10px]"
                          >
                            📄 KK Terlampir
                          </button>
                        ) : (
                          <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-lg font-medium border border-slate-200 text-[10px]">KK: Kosong</span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-xs font-semibold">
                      <div className="text-left">
                        <p className="text-[10px] text-slate-400">Total Tunggakan</p>
                        <p className={`text-xs font-black ${unpaidTotal > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                          Rp {unpaidTotal.toLocaleString('id-ID')}
                        </p>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            const newStatus = w.status === 'aktif' ? 'nonaktif' : 'aktif';
                            handleToggleCitizenStatus(w.id, newStatus);
                          }}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-150 rounded-lg"
                        >
                          Tandai {w.status === 'aktif' ? 'Nonaktif' : 'Aktif'}
                        </button>
                        <button
                          onClick={() => {
                            setManualPayWargaId(w.id);
                            setActiveModal('catat_pembayaran_manual');
                          }}
                          disabled={unpaidTotal === 0}
                          className="px-2.5 py-1.5 text-[10px] font-bold bg-sky-50 text-primary-dark hover:bg-sky-100 border border-sky-100 rounded-lg disabled:opacity-50"
                        >
                          Bayar Manual
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB F: BERKAS WARGA (KTP & KK CATALOG) */}
        {activeTab === 'berkas' && (
          <div className="space-y-6 animate-fade-in" id="admin-view-berkas">
            <div id="admin-berkas-header">
              <h2 className="text-lg font-bold font-display text-secondary">Berkas Warga RT 01</h2>
              <p className="text-xs text-slate-400">Pusat penyimpanan & validasi berkas identitas resmi warga</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-3 gap-3" id="admin-berkas-stats">
              <div className="bg-white border border-slate-100 rounded-2xl p-3 text-center custom-shadow-sm">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Kepala Keluarga</p>
                <p className="text-sm font-black text-secondary mt-1">
                  {wargaList.filter(w => w.role === 'warga' && w.status === 'aktif').length}
                </p>
              </div>
              <div className="bg-sky-50/50 border border-sky-100/50 rounded-2xl p-3 text-center custom-shadow-sm">
                <p className="text-[10px] text-sky-600 font-bold uppercase">Arsip KTP</p>
                <p className="text-sm font-black text-primary-dark mt-1">
                  {wargaList.filter(w => w.role === 'warga' && w.status === 'aktif' && w.fotoKtp).length}
                </p>
              </div>
              <div className="bg-emerald-50/50 border border-emerald-100/50 rounded-2xl p-3 text-center custom-shadow-sm">
                <p className="text-[10px] text-emerald-600 font-bold uppercase">Arsip KK</p>
                <p className="text-sm font-black text-emerald-700 mt-1">
                  {wargaList.filter(w => w.role === 'warga' && w.status === 'aktif' && w.fotoKk).length}
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berkas berdasarkan nama warga..."
                value={wargaSearch}
                onChange={(e) => setWargaSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
              />
            </div>

            {/* Citizens with Documents Grid */}
            <div className="space-y-4" id="admin-berkas-grid">
              {wargaList
                .filter(w => w.role === 'warga' && w.status === 'aktif' && w.nama.toLowerCase().includes(wargaSearch.toLowerCase()))
                .length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                    Tidak ada berkas warga yang cocok dengan pencarian Anda.
                  </div>
                ) : (
                  wargaList
                    .filter(w => w.role === 'warga' && w.status === 'aktif' && w.nama.toLowerCase().includes(wargaSearch.toLowerCase()))
                    .map(w => (
                      <div key={w.id} className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center font-bold text-xs border border-slate-100">
                              {w.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-secondary">{w.nama}</h4>
                              <p className="text-[10px] text-slate-400 font-semibold mt-0.5 font-sans">Rumah: {w.noRumah} • Telp: {w.noHp}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                            Aktif
                          </span>
                        </div>

                        {/* Document previews */}
                        <div className="grid grid-cols-2 gap-3">
                          {/* KTP */}
                          <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50 flex flex-col justify-between space-y-2 min-h-[120px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-500">Kartu Tanda Penduduk</span>
                              {w.fotoKtp && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </div>
                            
                            {w.fotoKtp ? (
                              <div className="relative group cursor-pointer" onClick={() => setViewDocUser({ name: w.nama, title: 'Foto KTP ' + w.nama, image: w.fotoKtp! })}>
                                <img src={w.fotoKtp} alt="KTP" className="h-14 w-full object-cover rounded-lg border border-slate-200 transition-transform hover:scale-102 animate-fade-in" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center rounded-lg">
                                  <span className="text-[8px] bg-white/95 text-secondary font-black px-1.5 py-0.5 rounded shadow-xs">LIHAT</span>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2 text-center text-[10px] text-slate-400 font-medium">KTP Belum Tersedia</div>
                            )}

                            {/* Direct Admin Upload/Update option */}
                            <label className="block text-center bg-white hover:bg-slate-50 text-[10px] font-extrabold text-primary-dark border border-slate-200 py-1.5 rounded-lg cursor-pointer transition-all">
                              {w.fotoKtp ? 'Perbarui KTP' : 'Unggah KTP'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const updated = wargaList.map(currW => {
                                        if (currW.id === w.id) {
                                          return { ...currW, fotoKtp: event.target?.result as string };
                                        }
                                        return currW;
                                      });
                                      saveWargaList(updated);
                                      loadData();
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>

                          {/* KK */}
                          <div className="border border-slate-100 rounded-2xl p-3 bg-slate-50 flex flex-col justify-between space-y-2 min-h-[120px]">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black text-slate-500">Kartu Keluarga</span>
                              {w.fotoKk && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </div>

                            {w.fotoKk ? (
                              <div className="relative group cursor-pointer" onClick={() => setViewDocUser({ name: w.nama, title: 'Foto KK ' + w.nama, image: w.fotoKk! })}>
                                <img src={w.fotoKk} alt="KK" className="h-14 w-full object-cover rounded-lg border border-slate-200 transition-transform hover:scale-102 animate-fade-in" referrerPolicy="no-referrer" />
                                <div className="absolute inset-0 bg-secondary/10 hover:bg-secondary/20 flex items-center justify-center rounded-lg">
                                  <span className="text-[8px] bg-white/95 text-secondary font-black px-1.5 py-0.5 rounded shadow-xs">LIHAT</span>
                                </div>
                              </div>
                            ) : (
                              <div className="py-2 text-center text-[10px] text-slate-400 font-medium">KK Belum Tersedia</div>
                            )}

                            {/* Direct Admin Upload/Update option */}
                            <label className="block text-center bg-white hover:bg-slate-50 text-[10px] font-extrabold text-primary-dark border border-slate-200 py-1.5 rounded-lg cursor-pointer transition-all">
                              {w.fotoKk ? 'Perbarui KK' : 'Unggah KK'}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onload = async (event) => {
                                      const updated = wargaList.map(currW => {
                                        if (currW.id === w.id) {
                                          return { ...currW, fotoKk: event.target?.result as string };
                                        }
                                        return currW;
                                      });
                                      saveWargaList(updated);
                                      loadData();
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    ))
                )}
            </div>
          </div>
        )}

        {/* TAB C: COMMUNITY PAYMENT HISTORY LOGS */}
        {activeTab === 'riwayat' && (
          <div className="space-y-6 animate-fade-in" id="admin-view-riwayat">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold font-display text-secondary">Riwayat Kas Masuk RT</h2>
                <p className="text-xs text-slate-400">Audit log seluruh transaksi pembayaran kas</p>
              </div>
              <button
                onClick={() => {
                  if (wargaList.filter(w => w.role === 'warga').length === 0) {
                    alert('Belum ada warga terdaftar!');
                    return;
                  }
                  setActiveModal('catat_pembayaran_manual');
                }}
                className="bg-primary-dark text-white font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Catat Tunai
              </button>
            </div>

            <div className="space-y-3" id="admin-full-audit-pembayaran">
              {pembayaranList.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                  Belum ada pembayaran terdaftar.
                </div>
              ) : (
                pembayaranList.map((pay) => {
                  const bill = tagihanList.find(t => t.id === pay.idTagihan);
                  const payer = bill ? wargaList.find(w => w.id === bill.idWarga) : null;

                  return (
                    <div key={pay.id} className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                          <Check className="w-5 h-5 font-black" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-secondary">
                            {payer ? payer.nama : 'Warga Umum'}
                          </h4>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Iuran {bill ? bill.jenis.toUpperCase() : 'KAS'} • {pay.tanggalBayar}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-secondary">
                          Rp {pay.jumlahBayar.toLocaleString('id-ID')}
                        </p>
                        <span className="inline-block mt-0.5 text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                          {pay.metode === 'tunai' ? 'Tunai via RT' : 'Online Sync'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB TUNGGAKAN: DELINQUENT RESIDENTS LIST */}
        {activeTab === 'tunggakan' && (
          <div className="space-y-6 animate-fade-in pb-16" id="admin-view-tunggakan">
            <div>
              <h2 className="text-lg font-bold font-display text-secondary">Daftar Tunggakan Warga</h2>
              <p className="text-xs text-slate-400">Kelola dan ingatkan warga yang memiliki tunggakan iuran kas</p>
            </div>

            {/* Delinquents Stats Summary */}
            <div className="grid grid-cols-2 gap-3" id="delinquent-stats-summary">
              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Total Menunggak</p>
                <p className="text-lg font-black text-rose-600 mt-1">{delinquents.length} Warga</p>
              </div>
              <div className="bg-amber-50/70 border border-amber-100 rounded-2xl p-4">
                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Total Nilai Tunggakan</p>
                <p className="text-lg font-black text-amber-700 mt-1">
                  Rp {delinquents.reduce((sum, d) => sum + d.amount, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="space-y-3.5" id="admin-view-delinquent-list-detail">
              {delinquents.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-100">
                  Luar biasa! Tidak ada warga yang memiliki tunggakan kas.
                </div>
              ) : (
                delinquents.map((del) => {
                  const unpaidBills = tagihanList.filter(
                    (t) => t.idWarga === del.warga.id && (t.status === 'belum_bayar' || t.status === 'menunggak')
                  );

                  return (
                    <div 
                      key={del.warga.id} 
                      className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center font-bold text-xs border border-rose-100/50">
                            {del.warga.nama.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-secondary">{del.warga.nama}</h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                              Rumah No. {del.warga.noRumah} • Telp: {del.warga.noHp}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="inline-block text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-500 border border-rose-100 px-2 py-0.5 rounded-full mb-1">
                            Tunggakan {del.monthsCount} Bulan
                          </span>
                          <p className="text-sm font-black text-rose-500">
                            Rp {del.amount.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      {/* Detail of unpaid bills */}
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-[11px] space-y-2">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold mb-1">Rincian Belum Terbayar</p>
                        <div className="grid grid-cols-2 gap-2 text-slate-600">
                          {unpaidBills.map((bill) => (
                            <div key={bill.id} className="flex justify-between items-center bg-white px-2.5 py-1.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-500 capitalize">{bill.jenis} ({bill.periode.split(' ')[0]})</span>
                              <span className="font-extrabold text-slate-700">Rp {bill.nominal.toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1.5 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            setManualPayWargaId(del.warga.id);
                            setActiveModal('catat_pembayaran_manual');
                          }}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2 px-3 rounded-xl text-[11px] transition-all border border-slate-200 cursor-pointer"
                        >
                          Bayar Manual
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReminder(del)}
                          className="flex-1 bg-sky-50 hover:bg-sky-100 text-primary-dark font-black py-2 px-3 rounded-xl text-[11px] transition-all border border-sky-100 flex items-center justify-center gap-1.5 cursor-pointer"
                          id={`btn-remind-tab-${del.warga.id}`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Kirim Pengingat WA</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB D: GOOGLE SHEETS DATABASE CONFIG */}
        {activeTab === 'database' && (
          <DatabaseSyncPanel onSyncComplete={loadData} />
        )}

      </main>

      {/* 4. ADMIN BOTTOM NAV BAR (Matches Screen 3) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3.5 flex justify-around items-center z-40 custom-shadow-lg" id="admin-bottom-nav">
        
        {/* Beranda */}
        <button
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${activeTab === 'beranda' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'beranda' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* Warga Tab */}
        <button
          onClick={() => setActiveTab('warga')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${activeTab === 'warga' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'warga' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <Users className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Warga</span>
        </button>

        {/* Tunggakan Tab */}
        <button
          onClick={() => setActiveTab('tunggakan')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all relative ${activeTab === 'tunggakan' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'tunggakan' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <AlertTriangle className={`w-5 h-5 ${delinquents.length > 0 && activeTab !== 'tunggakan' ? 'text-rose-500' : ''}`} />
          </div>
          <span className="text-[10px]">Tunggakan</span>
          {delinquents.length > 0 && (
            <span className="absolute -top-1 right-2 bg-rose-500 text-white text-[8px] font-black h-4 w-4 rounded-full flex items-center justify-center border border-white animate-pulse">
              {delinquents.length}
            </span>
          )}
        </button>

        {/* Riwayat */}
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${activeTab === 'riwayat' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'riwayat' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <CheckCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Riwayat</span>
        </button>
      </nav>

      {/* 5. INTERACTIVE ADMIN MODALS */}
      
      {/* Modal: Tambah Warga */}
      {activeModal === 'tambah_warga' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="admin-modal-tambah">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-primary-dark" />
                Daftarkan Warga Baru
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddWarga} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: Pak Aris"
                  value={newWargaNama}
                  onChange={(e) => setNewWargaNama(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Blok & No Rumah <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    placeholder="Contoh: Blok A No. 12"
                    value={newWargaNoRumah}
                    onChange={(e) => setNewWargaNoRumah(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Anggota Kel.</label>
                  <input
                    type="number"
                    value={newWargaJumlahKeluarga}
                    onChange={(e) => setNewWargaJumlahKeluarga(Number(e.target.value))}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">No. WhatsApp / HP <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newWargaNoHp}
                  onChange={(e) => setNewWargaNoHp(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email (Opsional)</label>
                <input
                  type="email"
                  placeholder="contoh@email.com"
                  value={newWargaEmail}
                  onChange={(e) => setNewWargaEmail(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Kata Sandi Akun <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={newWargaPassword}
                  onChange={(e) => setNewWargaPassword(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-slate-700"
                  required
                />
              </div>

              {/* Upload KTP & KK (Optional for Admin) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Foto KTP (Opsional)</label>
                  <div className="border border-dashed border-slate-200 rounded-xl p-2 text-center bg-slate-50 relative min-h-[60px] flex flex-col justify-center items-center">
                    {newWargaFotoKtp ? (
                      <div className="flex flex-col items-center gap-1">
                        <img src={newWargaFotoKtp} alt="KTP" className="h-10 object-cover rounded shadow-xs" referrerPolicy="no-referrer" />
                        <button type="button" onClick={() => setNewWargaFotoKtp(null)} className="text-[9px] font-bold text-rose-500 hover:underline">Hapus</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block text-slate-400 w-full py-2">
                        <Upload className="w-4 h-4 mx-auto mb-0.5 text-slate-400" />
                        <span className="text-[9px] font-semibold text-slate-500 block">Unggah KTP</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setNewWargaFotoKtp(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Foto KK (Opsional)</label>
                  <div className="border border-dashed border-slate-200 rounded-xl p-2 text-center bg-slate-50 relative min-h-[60px] flex flex-col justify-center items-center">
                    {newWargaFotoKk ? (
                      <div className="flex flex-col items-center gap-1">
                        <img src={newWargaFotoKk} alt="KK" className="h-10 object-cover rounded shadow-xs" referrerPolicy="no-referrer" />
                        <button type="button" onClick={() => setNewWargaFotoKk(null)} className="text-[9px] font-bold text-rose-500 hover:underline">Hapus</button>
                      </div>
                    ) : (
                      <label className="cursor-pointer block text-slate-400 w-full py-2">
                        <Upload className="w-4 h-4 mx-auto mb-0.5 text-slate-400" />
                        <span className="text-[9px] font-semibold text-slate-500 block">Unggah KK</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => setNewWargaFotoKk(event.target?.result as string);
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary-dark hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                  id="btn-save-new-citizen"
                >
                  <Check className="w-4 h-4" />
                  <span>Daftarkan Warga</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: Buat Tagihan Massal */}
      {activeModal === 'buat_tagihan' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="admin-modal-tagihan">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary-dark" />
                Terbitkan Tagihan Massal
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleGenerateBills} className="space-y-4">
              <p className="text-xs text-slate-500">
                Aksi ini akan men-generate tagihan baru untuk seluruh Kepala Keluarga aktif secara bersamaan sesuai nominal default di bawah.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Periode Tagihan</label>
                <input
                  type="text"
                  placeholder="Contoh: Oktober 2023"
                  value={tagihanPeriode}
                  onChange={(e) => setTagihanPeriode(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-bold text-slate-700"
                  required
                />
              </div>

              <div className="space-y-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Iuran Jimpitan (Rp)</label>
                  <input
                    type="number"
                    value={tagihanJimpitanNominal}
                    onChange={(e) => setTagihanJimpitanNominal(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Iuran Keamanan (Rp)</label>
                  <input
                    type="number"
                    value={tagihanKeamananNominal}
                    onChange={(e) => setTagihanKeamananNominal(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Iuran Sampah (Rp)</label>
                  <input
                    type="number"
                    value={tagihanSampahNominal}
                    onChange={(e) => setTagihanSampahNominal(Number(e.target.value))}
                    className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary-dark hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Terbitkan Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ingatkan Warga (WhatsApp) */}
      {activeModal === 'ingatkan_warga' && selectedDelinquent && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="admin-modal-ingatkan">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" />
                Kirim Pengingat WhatsApp
              </h3>
              <button onClick={() => { setActiveModal(null); setSelectedDelinquent(null); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-medium">
                Peringatan: <strong>{selectedDelinquent.warga.nama}</strong> menunggak <strong>{selectedDelinquent.monthsCount} bulan</strong> sebesar <strong>Rp {selectedDelinquent.amount.toLocaleString('id-ID')}</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Draft Pesan WhatsApp</label>
                <textarea
                  rows={6}
                  value={customReminderMsg}
                  onChange={(e) => setCustomReminderMsg(e.target.value)}
                  className="w-full text-[11px] p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary font-mono text-slate-700"
                ></textarea>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleSendReminder}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
                  id="btn-submit-remind-wa"
                >
                  <Send className="w-4 h-4 text-white" />
                  <span>Kirim via WhatsApp (Simulasi)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Catat Pembayaran Manual (Tunai) */}
      {activeModal === 'catat_pembayaran_manual' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="admin-modal-manual-pay">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary-dark" />
                Catat Pembayaran Tunai RT
              </h3>
              <button onClick={() => { setActiveModal(null); setManualPayWargaId(''); setManualPayTagihanId(''); }} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordManualPayment} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Warga Kepala Keluarga</label>
                <select
                  value={manualPayWargaId}
                  onChange={(e) => {
                    setManualPayWargaId(e.target.value);
                    setManualPayTagihanId('');
                  }}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none font-bold"
                  required
                >
                  <option value="">-- Pilih Warga --</option>
                  {wargaList.filter(w => w.role === 'warga').map(w => (
                    <option key={w.id} value={w.id}>{w.nama} ({w.noRumah})</option>
                  ))}
                </select>
              </div>

              {manualPayWargaId && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Tagihan Tunggakan</label>
                  <select
                    value={manualPayTagihanId}
                    onChange={(e) => setManualPayTagihanId(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none font-bold text-slate-700"
                    required
                  >
                    <option value="">-- Pilih Iuran --</option>
                    {tagihanList
                      .filter(t => t.idWarga === manualPayWargaId && (t.status === 'belum_bayar' || t.status === 'menunggak'))
                      .map(t => (
                        <option key={t.id} value={t.id}>
                          {t.periode} - Iuran {t.jenis.toUpperCase()} (Rp {t.nominal.toLocaleString('id-ID')})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Metode Penerimaan</label>
                <select
                  value={manualPayMetode}
                  onChange={(e) => setManualPayMetode(e.target.value as any)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl bg-white focus:outline-none font-medium"
                >
                  <option value="tunai">Tunai / Cash langsung ke RT</option>
                  <option value="transfer">Konfirmasi Bukti Transfer Bank</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!manualPayWargaId || !manualPayTagihanId}
                  className="w-full bg-primary-dark hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  id="btn-save-manual-pay"
                >
                  <Check className="w-4 h-4" />
                  <span>Verifikasi & Catat Lunas</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Modal: View Document */}
      {viewDocUser && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="modal-view-doc">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-secondary">{viewDocUser.title}</h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Warga: {viewDocUser.name}</p>
              </div>
              <button onClick={() => setViewDocUser(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-2 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={viewDocUser.image}
                alt={viewDocUser.title}
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewDocUser(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
              >
                Tutup Dokumen
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
