/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Menu, LogOut, Bell, Shield, Trash2, Megaphone, QrCode, Users, FileText, CheckCircle2, ChevronRight, X, ArrowLeft, RefreshCw, Smartphone, CreditCard, Send, User, Mail } from 'lucide-react';
import { Warga, Tagihan, Pembayaran, Pengumuman } from '../types';
import { getTagihanList, getPembayaranList, getPengumumanList, saveTagihanList, savePembayaranList } from '../data';
import RincianTagihanScreen from './RincianTagihanScreen';

interface WargaDashboardProps {
  user: Warga;
  onLogout: () => void;
}

type TabType = 'beranda' | 'tagihan' | 'riwayat';

export default function WargaDashboard({ user, onLogout }: WargaDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>('beranda');
  const [tagihan, setTagihan] = useState<Tagihan[]>([]);
  const [pembayaran, setPembayaran] = useState<Pembayaran[]>([]);
  const [announcements, setAnnouncements] = useState<Pengumuman[]>([]);
  
  // Side drawer & interactive modals state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  const [activeModal, setActiveModal] = useState<'lapor' | 'qr' | 'komunitas' | 'surat' | 'success_payment' | null>(null);
  const [viewDoc, setViewDoc] = useState<{ title: string; image: string } | null>(null);
  
  // Forms state
  const [laporPesan, setLaporPesan] = useState('');
  const [suratJenis, setSuratJenis] = useState('Surat Pengantar KTP');
  const [suratKeperluan, setSuratKeperluan] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allTagihan = getTagihanList();
    const allPembayaran = getPembayaranList();
    
    // Filter for current citizen only
    const userTagihan = allTagihan.filter(t => t.idWarga === user.id);
    setTagihan(userTagihan);
    setPembayaran(allPembayaran);
    setAnnouncements(getPengumumanList());
  };

  // Calculations for Dues
  const unpaidBills = tagihan.filter(t => t.status === 'belum_bayar' || t.status === 'menunggak');
  const totalUnpaidAmount = unpaidBills.reduce((acc, curr) => acc + curr.nominal, 0);

  const securityUnpaid = unpaidBills.filter(t => t.jenis === 'keamanan').reduce((acc, curr) => acc + curr.nominal, 0);
  const garbageUnpaid = unpaidBills.filter(t => t.jenis === 'sampah').reduce((acc, curr) => acc + curr.nominal, 0);

  const handleLaporSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laporPesan.trim()) return;
    alert(`Laporan berhasil dikirimkan ke Pengurus RT 01! Status: Menunggu tanggapan.\nPesan: "${laporPesan}"`);
    setLaporPesan('');
    setActiveModal(null);
  };

  const handleSuratSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suratKeperluan.trim()) return;
    alert(`Permohonan ${suratJenis} berhasil diajukan!\nPengurus RT akan segera menghubungi Anda untuk penyerahan dokumen fisik.`);
    setSuratKeperluan('');
    setActiveModal(null);
  };

  const handlePaySuccess = () => {
    loadData();
    setActiveTab('beranda');
    setActiveModal('success_payment');
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between font-sans pb-24 relative animate-fade-in" id="warga-dashboard">
      
      {/* 1. Header (Hamburger, Title, Avatar) */}
      <header className="bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 custom-shadow-sm" id="warga-header">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsDrawerOpen(true)}
            className="p-2 hover:bg-slate-50 rounded-lg text-secondary transition-all"
            id="btn-warga-drawer-open"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-lg font-bold font-display text-secondary">
            Kas Warga
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Notifications ring */}
          <button 
            onClick={() => alert('Kotak masuk notifikasi Anda dalam keadaan bersih.')}
            className="p-2 text-slate-400 hover:text-slate-600 relative rounded-lg"
            id="btn-warga-notification"
          >
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
            <Bell className="w-5 h-5" />
          </button>
          {/* Avatar */}
          <div 
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 cursor-pointer shadow-sm active:scale-95 transition-all"
            id="warga-avatar"
          >
            <img 
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
              alt="Avatar Warga" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </header>

      {/* 2. Side Menu Drawer Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-secondary/30 backdrop-blur-sm z-50 animate-fade-in flex" id="drawer-overlay">
          <div className="w-4/5 max-w-xs bg-white h-full p-6 flex flex-col justify-between animate-slide-up" id="drawer-content">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200">
                    <img 
                      src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=150" 
                      alt="Avatar Warga" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-secondary">{user.nama}</h4>
                    <p className="text-[11px] text-slate-400 font-medium">{user.noRumah}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400"
                  id="btn-close-drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 pt-4 border-t border-slate-100">
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('beranda'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'beranda' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Shield className="w-4 h-4 text-primary shrink-0" />
                  <span>Beranda Utama</span>
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('tagihan'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'tagihan' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>Rincian & Bayar Tagihan</span>
                </button>
                <button
                  onClick={() => { setIsDrawerOpen(false); setActiveTab('riwayat'); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center gap-3 transition-all ${activeTab === 'riwayat' ? 'bg-sky-50 text-primary-dark' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <span>Riwayat Pembayaran</span>
                </button>

                {/* Collapsible Profil Menu */}
                <div className="space-y-1">
                  <button
                    onClick={() => setIsProfileExpanded(!isProfileExpanded)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold flex items-center justify-between gap-3 text-slate-600 hover:bg-slate-50 transition-all ${isProfileExpanded ? 'bg-slate-50' : ''}`}
                    id="btn-warga-profil-menu"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span>Profil Warga</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isProfileExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {isProfileExpanded && (
                    <div className="mx-1 mt-1 p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl space-y-3 animate-fade-in" id="drawer-profil-section">
                      {/* Phone number & Email */}
                      <div className="space-y-2.5">
                        <div className="flex items-start gap-2">
                          <Smartphone className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Nomor HP</p>
                            <p className="text-xs font-bold text-slate-700">{user.noHp}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Email Akun</p>
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[170px]">{user.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Dokumen Terunggah (KTP & KK) */}
                      <div className="pt-2 border-t border-slate-200/50 space-y-1.5">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider font-extrabold">Syarat Dokumen</p>
                        <div className="flex flex-wrap gap-1.5">
                          {user.fotoKtp ? (
                            <button
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setViewDoc({ title: 'Foto KTP Anda', image: user.fotoKtp! });
                              }}
                              className="bg-sky-50 text-sky-700 hover:bg-sky-100 font-black text-[9px] px-2 py-1 rounded-md border border-sky-100/50 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>📄 KTP</span>
                            </button>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md font-medium">KTP: Belum ada</span>
                          )}

                          {user.fotoKk ? (
                            <button
                              onClick={() => {
                                setIsDrawerOpen(false);
                                setViewDoc({ title: 'Foto Kartu Keluarga (KK) Anda', image: user.fotoKk! });
                              }}
                              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-black text-[9px] px-2 py-1 rounded-md border border-emerald-100/50 transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>📄 KK</span>
                            </button>
                          ) : (
                            <span className="text-[9px] bg-slate-100 text-slate-400 px-2 py-1 rounded-md font-medium">KK: Belum ada</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </nav>
            </div>

            <button
              onClick={() => { setIsDrawerOpen(false); onLogout(); }}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border border-rose-100 transition-all"
              id="btn-warga-logout"
            >
              <LogOut className="w-4 h-4" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Views router */}
      <main className="flex-1 p-5 space-y-6">
        
        {/* VIEW A: BERANDA */}
        {activeTab === 'beranda' && (
          <div className="space-y-6 animate-fade-in" id="warga-view-beranda">
            {/* Greetings Panel */}
            <div id="warga-greeting">
              <h2 className="text-2xl font-black font-display text-secondary flex items-center gap-2 tracking-tight">
                Halo, {user.nama}! <span className="animate-bounce">👋</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Selamat pagi, semoga harimu menyenangkan di RT 01.
              </p>
            </div>

            {/* Total Tagihan Hero Card (Matches Screen 2 layout perfectly) */}
            <div className="bg-gradient-to-br from-primary-dark to-slate-800 rounded-[24px] p-6 text-white custom-shadow-lg relative overflow-hidden" id="hero-tagihan-card">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary opacity-10 rounded-full blur-2xl transform translate-x-12 -translate-y-12"></div>
              <p className="text-[11px] font-bold tracking-wider text-sky-100 uppercase">
                TOTAL TAGIHAN BELUM DIBAYAR
              </p>
              <h3 className="text-3xl font-black font-display tracking-tight mt-1.5 text-white">
                Rp {totalUnpaidAmount.toLocaleString('id-ID')}
              </h3>
              
              <div className="flex items-center gap-2 mt-3 text-[11px] text-sky-100/80 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>Jatuh tempo: 10 Oktober 2023</span>
              </div>

              {totalUnpaidAmount > 0 ? (
                <button
                  onClick={() => setActiveTab('tagihan')}
                  className="w-full bg-white text-primary-dark hover:bg-sky-50 font-bold text-sm py-3.5 px-4 rounded-xl mt-5 transition-all shadow-md active:scale-98 flex items-center justify-center gap-2"
                  id="btn-bayar-sekarang-hero"
                >
                  <CreditCard className="w-4 h-4 text-primary-dark" />
                  <span>Bayar Sekarang</span>
                </button>
              ) : (
                <div className="mt-5 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2.5 text-xs text-emerald-100 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Hebat! Anda tidak memiliki tunggakan bulan ini.</span>
                </div>
              )}
            </div>

            {/* Keamanan & Kebersihan outstanding cards (Matches Screen 2) */}
            <div className="grid grid-cols-2 gap-4" id="due-summary-grid">
              <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex flex-col justify-between custom-shadow-sm transition-all hover:scale-[1.01]" id="summary-keamanan">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="p-2 bg-sky-50 text-primary rounded-lg shadow-inner">
                    <Shield className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Keamanan
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">Total Tertunggak</p>
                  <p className="text-lg font-extrabold font-display text-secondary mt-0.5">
                    Rp {securityUnpaid.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-100/80 rounded-2xl p-4 flex flex-col justify-between custom-shadow-sm transition-all hover:scale-[1.01]" id="summary-kebersihan">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shadow-inner">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Kebersihan
                  </span>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">Total Tertunggak</p>
                  <p className="text-lg font-extrabold font-display text-secondary mt-0.5">
                    Rp {garbageUnpaid.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>

            {/* Layanan Cepat panel (Matches Screen 2) */}
            <div className="space-y-3.5" id="layanan-cepat-section">
              <h3 className="text-xs font-extrabold text-secondary uppercase tracking-wider px-1">
                Layanan Cepat
              </h3>
              <div className="grid grid-cols-2 gap-3" id="layanan-cepat-grid">
                
                {/* Lapor */}
                <button
                  onClick={() => setActiveModal('lapor')}
                  className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 custom-shadow-sm hover:-translate-y-0.5 text-left group cursor-pointer"
                  id="btn-layanan-lapor"
                >
                  <div className="w-10 h-10 bg-sky-50 text-primary rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <Megaphone className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-secondary block">Lapor Pengurus</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Aduan & laporan RT</span>
                  </div>
                </button>

                {/* Scan QR */}
                <button
                  onClick={() => setActiveModal('qr')}
                  className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 custom-shadow-sm hover:-translate-y-0.5 text-left group cursor-pointer"
                  id="btn-layanan-qr"
                >
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <QrCode className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-secondary block">Scan QR Warga</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">KTP digital RT</span>
                  </div>
                </button>

                {/* Komunitas */}
                <button
                  onClick={() => setActiveModal('komunitas')}
                  className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 custom-shadow-sm hover:-translate-y-0.5 text-left group cursor-pointer"
                  id="btn-layanan-komunitas"
                >
                  <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-secondary block">Info Komunitas</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Pengumuman & berita</span>
                  </div>
                </button>

                {/* Surat */}
                <button
                  onClick={() => setActiveModal('surat')}
                  className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center gap-3.5 transition-all duration-300 custom-shadow-sm hover:-translate-y-0.5 text-left group cursor-pointer"
                  id="btn-layanan-surat"
                >
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-secondary block">Surat Pengantar</span>
                    <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">Ajukan surat online</span>
                  </div>
                </button>

              </div>
            </div>

            {/* Riwayat Terakhir list (Matches Screen 2) */}
            <div className="space-y-3" id="riwayat-terakhir-section">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-secondary tracking-tight">
                  Riwayat Terakhir
                </h3>
                <button
                  onClick={() => setActiveTab('riwayat')}
                  className="text-xs font-bold text-primary-dark hover:underline"
                  id="btn-lihat-semua-riwayat"
                >
                  Lihat Semua
                </button>
              </div>

              <div className="space-y-3" id="riwayat-list-warga">
                {pembayaran.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
                    Belum ada catatan pembayaran.
                  </div>
                ) : (
                  pembayaran.slice(0, 3).map((pay) => (
                    <div 
                      key={pay.id} 
                      className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between transition-all hover:scale-[1.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shrink-0">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-secondary">
                            Iuran {pay.idTagihan ? 'Kas Warga' : 'Lainnya'}
                          </h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                            {pay.tanggalBayar} • {pay.metode === 'transfer' ? 'Bank Transfer' : pay.metode === 'qris' ? 'QRIS Digital' : 'Tunai via RT'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-secondary">
                          Rp {pay.jumlahBayar.toLocaleString('id-ID')}
                        </p>
                        <span className="inline-block mt-1 text-[9px] font-extrabold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                          LUNAS
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: DETAIL/BAYAR TAGIHAN */}
        {activeTab === 'tagihan' && (
          <RincianTagihanScreen 
            user={user} 
            unpaidBills={unpaidBills} 
            onBack={() => setActiveTab('beranda')}
            onPaySuccess={handlePaySuccess}
          />
        )}

        {/* VIEW C: RIWAYAT PEMBAYARAN LENGKAP */}
        {activeTab === 'riwayat' && (
          <div className="space-y-6 animate-fade-in" id="warga-view-riwayat">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveTab('beranda')} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
                id="btn-back-to-home"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold font-display text-secondary">Riwayat Pembayaran Anda</h2>
            </div>

            <div className="space-y-3" id="full-riwayat-list">
              {pembayaran.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada transaksi pembayaran.
                </div>
              ) : (
                pembayaran.map((pay) => (
                  <div key={pay.id} className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-secondary">Pembayaran Kas</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {pay.tanggalBayar} • {pay.metode.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-secondary">Rp {pay.jumlahBayar.toLocaleString('id-ID')}</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">DISETUJUI</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* 4. BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3.5 flex justify-around items-center z-40 custom-shadow-lg" id="warga-bottom-nav">
        
        {/* Beranda Tab */}
        <button
          onClick={() => setActiveTab('beranda')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${activeTab === 'beranda' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
          id="btn-tab-beranda"
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'beranda' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Beranda</span>
        </button>

        {/* Tagihan Tab */}
        <button
          onClick={() => setActiveTab('tagihan')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${activeTab === 'tagihan' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
          id="btn-tab-tagihan"
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'tagihan' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Tagihan</span>
        </button>

        {/* Riwayat Tab */}
        <button
          onClick={() => setActiveTab('riwayat')}
          className={`flex flex-col items-center gap-1 focus:outline-none transition-all ${activeTab === 'riwayat' ? 'text-primary-dark font-extrabold' : 'text-slate-400 font-semibold'}`}
          id="btn-tab-riwayat"
        >
          <div className={`p-1.5 rounded-full ${activeTab === 'riwayat' ? 'bg-sky-100' : 'bg-transparent'}`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-[10px]">Riwayat</span>
        </button>
      </nav>

      {/* 5. INTERACTIVE MODALS AND SHEET-OVERLAYS */}
      
      {/* Lapor Modal */}
      {activeModal === 'lapor' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="modal-lapor">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-primary-dark" />
                Lapor Pengurus RT
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLaporSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                Ajukan laporan atau keluhan lingkungan Anda (misal: jimpitan belum diambil, fasilitas rusak, keamanan terganggu). Pengurus akan menerima notifikasi ini segera.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Isi Laporan / Pesan</label>
                <textarea
                  rows={4}
                  placeholder="Ketik laporan Anda di sini secara detail..."
                  value={laporPesan}
                  onChange={(e) => setLaporPesan(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-slate-700"
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full bg-primary-dark hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                id="btn-submit-lapor"
              >
                <Send className="w-4 h-4" />
                <span>Kirim Laporan</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Scan QR Modal */}
      {activeModal === 'qr' && (
        <div className="fixed inset-0 bg-secondary/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="modal-qr">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg text-center space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-left">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <QrCode className="w-5 h-5 text-primary-dark" />
                Scan QR Warga
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="border-4 border-primary-dark/30 p-2 rounded-2xl inline-block bg-slate-50 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary-dark -mt-1 -ml-1"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary-dark -mt-1 -mr-1"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary-dark -mb-1 -ml-1"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary-dark -mb-1 -mr-1"></div>
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=ARSANTA-COMMUNITY-QR" 
                alt="Community QR Code"
                className="w-48 h-48 rounded-lg mx-auto"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Tunjukkan QR Code ini kepada petugas pengurus jimpitan atau satpam komplek untuk memverifikasi kependudukan Anda dengan cepat.
            </p>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all"
            >
              Tutup Scanner
            </button>
          </div>
        </div>
      )}

      {/* Komunitas Modal */}
      {activeModal === 'komunitas' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="modal-komunitas">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <Users className="w-5 h-5 text-primary-dark" />
                Komunitas & Pengumuman
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Berikut adalah berita penting dan pengumuman terbaru dari Ketua RT 01 Paguyuban Arsanta:
            </p>
            
            <div className="space-y-4" id="modal-announcements-list">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-primary-dark uppercase bg-sky-100 px-2 py-0.5 rounded-full">{ann.tanggal}</span>
                    <span className="text-[10px] text-slate-400">Dilihat {ann.dilihat} Warga</span>
                  </div>
                  <h4 className="text-xs font-extrabold text-secondary">{ann.judul}</h4>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{ann.konten}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition-all"
            >
              Selesai Membaca
            </button>
          </div>
        </div>
      )}

      {/* Surat Modal */}
      {activeModal === 'surat' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="modal-surat">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-secondary flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-dark" />
                Permohonan Surat Pengantar
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSuratSubmit} className="space-y-4">
              <p className="text-xs text-slate-500">
                Butuh surat pengantar dari RT/RW? Silakan isi jenis permohonan di bawah ini. Pengurus RT akan men-generate surat resmi ber-TTD lengkap.
              </p>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Surat Keterangan</label>
                <select
                  value={suratJenis}
                  onChange={(e) => setSuratJenis(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                >
                  <option value="Surat Pengantar KTP">Surat Pengantar Pembuatan KTP</option>
                  <option value="Surat Pengantar Kartu Keluarga">Surat Pengantar Pembuatan KK</option>
                  <option value="Surat Keterangan Domisili">Surat Keterangan Domisili Tinggal</option>
                  <option value="Surat Keterangan Tidak Mampu">Surat Keterangan Tidak Mampu (SKTM)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Keperluan Penggunaan</label>
                <input
                  type="text"
                  placeholder="Contoh: Mengurus perpindahan alamat di Disdukcapil"
                  value={suratKeperluan}
                  onChange={(e) => setSuratKeperluan(e.target.value)}
                  className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium text-slate-700"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-dark hover:opacity-90 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                id="btn-submit-surat"
              >
                <Send className="w-4 h-4" />
                <span>Ajukan Surat Pengantar</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Payment Modal */}
      {activeModal === 'success_payment' && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="modal-success-payment">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 custom-shadow-lg text-center space-y-4 animate-slide-up">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-extrabold font-display text-secondary">Pembayaran Berhasil!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Selamat, iuran kas warga Anda bulan ini telah sukses diverifikasi dan lunas! Terima kasih telah berkontribusi bagi kesejahteraan lingkungan Arsanta.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1 text-left font-medium">
              <div className="flex justify-between">
                <span className="text-slate-400">Metode</span>
                <span className="text-slate-700 font-bold">QRIS Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tanggal</span>
                <span className="text-slate-700 font-bold">{new Date().toLocaleDateString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status</span>
                <span className="text-emerald-600 font-bold">LUNAS</span>
              </div>
            </div>
            <button
              onClick={() => setActiveModal(null)}
              className="w-full bg-primary-dark hover:opacity-90 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-sm"
              id="btn-close-payment-success"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Modal: View Document */}
      {viewDoc && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-fade-in" id="warga-modal-view-doc">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 custom-shadow-lg space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-secondary">{viewDoc.title}</h3>
              <button onClick={() => setViewDoc(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-2 flex items-center justify-center max-h-[60vh] overflow-hidden">
              <img
                src={viewDoc.image}
                alt={viewDoc.title}
                className="max-w-full max-h-[50vh] object-contain rounded-xl shadow-sm"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setViewDoc(null)}
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
