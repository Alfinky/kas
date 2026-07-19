/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Wallet, UserCheck, User, Phone, Home, Users, Check, ArrowLeft, Upload, Image, Trash2 } from 'lucide-react';
import { Warga } from '../types';
import { getWargaList, saveWargaList, getTagihanList, saveTagihanList } from '../data';
// @ts-ignore
import arsantaLogo from '../assets/images/arsanta_logo_1784458703007.jpg';

interface LoginScreenProps {
  onLoginSuccess: (user: Warga) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Register states
  const [regNama, setRegNama] = useState('');
  const [regNoHp, setRegNoHp] = useState('');
  const [regNoRumah, setRegNoRumah] = useState('');
  const [regJumlahKeluarga, setRegJumlahKeluarga] = useState(3);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regFotoKtp, setRegFotoKtp] = useState<string | null>(null);
  const [regFotoKk, setRegFotoKk] = useState<string | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  const handleKtpUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRegFotoKtp(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleKkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setRegFotoKk(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier || !password) {
      setErrorMsg('Harap isi semua kolom!');
      return;
    }

    const wargaList = getWargaList();
    let foundUser = wargaList.find(
      (w) =>
        (w.email.toLowerCase() === identifier.trim().toLowerCase() ||
          w.noHp === identifier.trim() ||
          w.nama.toLowerCase() === identifier.trim().toLowerCase()) &&
        w.password === password
    );

    // Support default admin login with user "admin" and password "arsanta2026"
    if (!foundUser && identifier.trim().toLowerCase() === 'admin' && password === 'arsanta2026') {
      foundUser = wargaList.find((w) => w.role === 'admin');
      if (!foundUser) {
        foundUser = {
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
        };
      }
    }

    if (foundUser) {
      if (foundUser.status === 'menunggu_persetujuan') {
        setErrorMsg('Pendaftaran Anda masih menunggu persetujuan dari Admin RT.');
        return;
      }
      if (foundUser.status === 'ditolak') {
        setErrorMsg('Pendaftaran Anda telah ditolak oleh Admin RT. Silakan hubungi pengurus RT.');
        return;
      }
      onLoginSuccess(foundUser);
    } else {
      setErrorMsg('Nomor HP/Email atau kata sandi Anda salah.');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!regNama || !regNoHp || !regNoRumah || !regPassword || !regConfirmPassword) {
      setErrorMsg('Harap isi semua kolom wajib!');
      return;
    }

    if (!regFotoKtp || !regFotoKk) {
      setErrorMsg('Anda wajib menyertakan foto KTP dan KK sebagai syarat mendaftar!');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok!');
      return;
    }

    if (regNoHp.length < 10) {
      setErrorMsg('Nomor HP/WhatsApp minimal 10 digit!');
      return;
    }

    const wargaList = getWargaList();
    // Check for duplicates
    const duplicate = wargaList.find(
      (w) =>
        w.noHp === regNoHp.trim() ||
        (regEmail && w.email.toLowerCase() === regEmail.trim().toLowerCase())
    );

    if (duplicate) {
      setErrorMsg('Nomor HP atau Email sudah terdaftar!');
      return;
    }

    const newWarga: Warga = {
      id: `warga-${Date.now()}`,
      nama: regNama.trim(),
      noRumah: regNoRumah.trim(),
      noHp: regNoHp.trim(),
      email: regEmail.trim() || `${regNama.toLowerCase().replace(/\s+/g, '')}@email.com`,
      jumlahKeluarga: Number(regJumlahKeluarga),
      status: 'menunggu_persetujuan',
      password: regPassword,
      role: 'warga',
      fotoKtp: regFotoKtp,
      fotoKk: regFotoKk,
      waktuDaftar: new Date().toISOString()
    };

    // Auto-generate default unpaid bills for them for October 2023 so they can see and pay them immediately upon approval
    const tagihanList = getTagihanList();
    const defaultBills = [
      { id: `tag-${Date.now()}-1`, idWarga: newWarga.id, jenis: 'jimpitan' as const, periode: 'Oktober 2023', nominal: 15000, jatuhTempo: '10 Okt 2023', status: 'belum_bayar' as const },
      { id: `tag-${Date.now()}-2`, idWarga: newWarga.id, jenis: 'keamanan' as const, periode: 'Oktober 2023', nominal: 45000, jatuhTempo: '10 Okt 2023', status: 'belum_bayar' as const },
      { id: `tag-${Date.now()}-3`, idWarga: newWarga.id, jenis: 'sampah' as const, periode: 'Oktober 2023', nominal: 25000, jatuhTempo: '10 Okt 2023', status: 'belum_bayar' as const }
    ];

    // Save
    saveWargaList([newWarga, ...wargaList]);
    saveTagihanList([...defaultBills, ...tagihanList]);

    alert(`Pendaftaran Berhasil! Halo ${newWarga.nama}, pengajuan akun warga Anda telah berhasil dikirimkan dan saat ini sedang menunggu persetujuan dari Admin RT. Berkas KTP dan KK Anda telah kami simpan dengan aman.`);
    
    // Clear registration fields and head back to login
    setRegNama('');
    setRegNoHp('');
    setRegNoRumah('');
    setRegEmail('');
    setRegJumlahKeluarga(3);
    setRegPassword('');
    setRegConfirmPassword('');
    setRegFotoKtp(null);
    setRegFotoKk(null);
    setIsRegister(false);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-between py-12 px-6 font-sans animate-fade-in" id="login-screen">
      {/* Upper Logo Section */}
      <div className="flex flex-col items-center text-center mt-6" id="login-brand">
        <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center custom-shadow-md mb-5 overflow-hidden border border-slate-100 transition-transform hover:scale-105 duration-300">
          <img src={arsantaLogo} alt="Arsanta Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-2xl font-extrabold font-display text-secondary tracking-tight">
          Kas Warga Arsanta
        </h1>
        <p className="text-xs text-slate-400 mt-1.5 font-medium max-w-xs">
          Kelola transparansi & pembayaran iuran warga secara modern
        </p>
      </div>

      {/* Form Container Card */}
      <div className="w-full max-w-md mx-auto my-6 animate-fade-in" id="login-card-container">
        <div className="bg-white rounded-3xl p-6 md:p-8 custom-shadow-lg border border-slate-100">
          
          {!isRegister ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLogin} className="space-y-5" id="login-form">
              <div className="flex items-center justify-between pb-1">
                <h2 className="text-base font-bold text-secondary font-display">Masuk Akun</h2>
                <span className="text-[9px] font-black bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Warga / Pengurus
                </span>
              </div>

              {/* Email / HP Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Nomor HP atau Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="contoh@email.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-slate-800"
                    id="login-identifier"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Fitur reset kata sandi: Silakan hubungi pengurus RT Anda untuk mengubah kata sandi.')}
                    className="text-[10px] font-bold text-primary-dark hover:underline"
                    id="btn-forgot-password"
                  >
                    Lupa Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="........"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50/50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-transparent transition-all placeholder:text-slate-400 font-mono text-slate-800"
                    id="login-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    id="btn-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-xl text-center animate-fade-in" id="login-error">
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-extrabold py-3 px-6 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs mt-2 cursor-pointer"
                id="btn-login-submit"
              >
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            /* --- SELF-REGISTRATION FORM --- */
            <form onSubmit={handleRegister} className="space-y-4" id="register-form">
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                  className="p-1 hover:bg-slate-50 rounded-lg text-slate-500 mr-1"
                  id="btn-reg-back"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-secondary">Pendaftaran Warga</h2>
                  <p className="text-[11px] text-slate-400 font-medium">Buat akun mandiri Anda langsung</p>
                </div>
              </div>

              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Contoh: Pak Budi"
                    value={regNama}
                    onChange={(e) => setRegNama(e.target.value)}
                    className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-slate-800"
                    id="reg-nama"
                    required
                  />
                </div>
              </div>

              {/* No WhatsApp & No Rumah */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    No. WhatsApp / HP <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={regNoHp}
                      onChange={(e) => setRegNoHp(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 font-mono text-slate-800"
                      id="reg-no-hp"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Blok & No Rumah <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Home className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Contoh: Blok B No. 10"
                      value={regNoRumah}
                      onChange={(e) => setRegNoRumah(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-slate-800"
                      id="reg-no-rumah"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Jumlah Anggota Keluarga & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Anggota Keluarga
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Users className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={regJumlahKeluarga}
                      onChange={(e) => setRegJumlahKeluarga(Number(e.target.value))}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-slate-800 font-semibold"
                      id="reg-anggota-keluarga"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Email (Opsional)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="email"
                      placeholder="budi@email.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 font-medium text-slate-800"
                      id="reg-email"
                    />
                  </div>
                </div>
              </div>

              {/* Kata Sandi & Konfirmasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Kata Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Min 6 karakter"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 font-mono text-slate-800"
                      id="reg-password"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                    Konfirmasi Sandi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="Ketik ulang"
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      className="w-full text-xs pl-10 pr-4 py-2.5 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all placeholder:text-slate-400 font-mono text-slate-800"
                      id="reg-confirm-password"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Show password checkbox */}
              <div className="flex items-center gap-2 pl-0.5">
                <input
                  type="checkbox"
                  id="toggle-show-reg-pass"
                  checked={showRegPassword}
                  onChange={() => setShowRegPassword(!showRegPassword)}
                  className="rounded border-slate-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                />
                <label htmlFor="toggle-show-reg-pass" className="text-[11px] font-semibold text-slate-500 cursor-pointer select-none">
                  Tampilkan Kata Sandi
                </label>
              </div>

              {/* Upload KTP & KK */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Persyaratan Dokumen <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Upload KTP */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Foto KTP</span>
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-3 text-center transition-all bg-slate-50 hover:bg-slate-100/50">
                      {regFotoKtp ? (
                        <div className="space-y-2">
                          <img src={regFotoKtp} alt="KTP" className="h-20 mx-auto rounded-lg object-cover shadow-sm border border-slate-200" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setRegFotoKtp(null)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 justify-center mx-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-2">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <span className="text-[10px] font-semibold text-slate-600 block">Pilih / Seret Foto KTP</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Format: JPG, PNG</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleKtpUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Upload KK */}
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 block">Foto Kartu Keluarga (KK)</span>
                    <div className="relative border-2 border-dashed border-slate-200 hover:border-primary rounded-xl p-3 text-center transition-all bg-slate-50 hover:bg-slate-100/50">
                      {regFotoKk ? (
                        <div className="space-y-2">
                          <img src={regFotoKk} alt="KK" className="h-20 mx-auto rounded-lg object-cover shadow-sm border border-slate-200" referrerPolicy="no-referrer" />
                          <button
                            type="button"
                            onClick={() => setRegFotoKk(null)}
                            className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 justify-center mx-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Hapus
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block py-2">
                          <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                          <span className="text-[10px] font-semibold text-slate-600 block">Pilih / Seret Foto KK</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Format: JPG, PNG</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleKkUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-center animate-fade-in" id="register-error">
                  {errorMsg}
                </div>
              )}

              {/* Submit Registration */}
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 text-xs mt-3"
                id="btn-register-submit"
              >
                <Check className="w-4 h-4" />
                <span>Daftar Sekarang</span>
              </button>
            </form>
          )}

          {/* Bottom toggle link */}
          <div className="mt-6 text-center text-xs" id="login-footer">
            {!isRegister ? (
              <>
                <span className="text-slate-500">Belum punya akun? </span>
                <button
                  onClick={() => { setIsRegister(true); setErrorMsg(''); }}
                  className="font-bold text-primary-dark hover:underline"
                  id="btn-go-to-register"
                >
                  Daftar Warga Baru
                </button>
              </>
            ) : (
              <>
                <span className="text-slate-500">Sudah memiliki akun? </span>
                <button
                  onClick={() => { setIsRegister(false); setErrorMsg(''); }}
                  className="font-bold text-primary-dark hover:underline"
                  id="btn-go-to-login"
                >
                  Masuk Sesi
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer Ecosystem */}
      <div className="flex items-center justify-center gap-3 text-center mt-6" id="login-ecosystem-footer">
        <span className="h-px w-10 bg-slate-200"></span>
        <span className="text-[10px] font-bold font-display text-slate-400 uppercase tracking-widest">
          ARSANTA ECOSYSTEM
        </span>
        <span className="h-px w-10 bg-slate-200"></span>
      </div>
    </div>
  );
}

