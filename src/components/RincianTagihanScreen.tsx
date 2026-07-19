/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowLeft, Shield, Trash2, PiggyBank, Info, CreditCard, ChevronRight, QrCode, Smartphone, Check, HelpCircle, Upload, AlertCircle } from 'lucide-react';
import { Warga, Tagihan, Pembayaran } from '../types';
import { getTagihanList, saveTagihanList, getPembayaranList, savePembayaranList } from '../data';

interface RincianTagihanScreenProps {
  user: Warga;
  unpaidBills: Tagihan[];
  onBack: () => void;
  onPaySuccess: () => void;
}

export default function RincianTagihanScreen({ user, unpaidBills, onBack, onPaySuccess }: RincianTagihanScreenProps) {
  const [showPaymentGateways, setShowPaymentGateways] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<'qris' | 'va' | 'tunai' | null>(null);
  const [uploadReceipt, setUploadReceipt] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const totalAmount = unpaidBills.reduce((acc, curr) => acc + curr.nominal, 0);

  const handleSimulatePayment = async () => {
    if (unpaidBills.length === 0) return;
    setProcessing(true);

    // Simulate short loader
    setTimeout(async () => {
      const allTagihan = getTagihanList();
      const allPembayaran = getPembayaranList();

      const unpaidIds = unpaidBills.map(b => b.id);
      const todayString = new Date().toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // 1. Mark unpaid bills as paid
      const updatedTagihan = allTagihan.map(tag => {
        if (unpaidIds.includes(tag.id)) {
          return { ...tag, status: 'lunas' as const };
        }
        return tag;
      });

      // 2. Create payment entry
      const newPayment: Pembayaran = {
        id: `pay-${Date.now()}`,
        idTagihan: unpaidIds[0], // link to primary tagihan
        tanggalBayar: todayString,
        jumlahBayar: totalAmount,
        metode: selectedGateway === 'qris' ? 'qris' : selectedGateway === 'va' ? 'transfer' : 'tunai',
        dicatatOleh: selectedGateway === 'tunai' ? 'Admin' : 'Sistem (Online)',
        buktiBayar: uploadReceipt || 'qris_receipt_placeholder'
      };

      saveTagihanList(updatedTagihan);
      savePembayaranList([newPayment, ...allPembayaran]);

      setProcessing(false);
      setShowPaymentGateways(false);
      setSelectedGateway(null);
      onPaySuccess();
    }, 1500);
  };

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadReceipt(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-2xl mx-auto" id="rincian-tagihan-screen">
      
      {/* 1. Navigation Header */}
      <div className="flex items-center justify-between" id="tagihan-header">
        <button 
          onClick={onBack} 
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-all flex items-center gap-1 text-xs font-bold"
          id="btn-back-from-details"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Kembali</span>
        </button>
        <span className="text-xs font-bold bg-sky-50 text-primary-dark px-3 py-1 rounded-full border border-sky-100">
          RT 01 / {user.noRumah}
        </span>
      </div>

      {/* 2. Bill Period Header */}
      <div id="period-info">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          PERIODE TAGIHAN
        </p>
        <h2 className="text-2xl font-black font-display text-secondary mt-1 tracking-tight">
          Oktober 2023
        </h2>
      </div>

      {/* 3. Total Due Floating Hero Panel */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white custom-shadow-md relative overflow-hidden" id="details-hero-card">
        <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <p className="text-xs text-sky-100 font-semibold uppercase tracking-wider">
          Total yang harus dibayar
        </p>
        <h3 className="text-3xl font-black font-display tracking-tight mt-1.5 text-white">
          Rp {totalAmount.toLocaleString('id-ID')}
        </h3>
        
        <div className="flex items-center gap-2 mt-4 text-[11px] text-sky-100/90 font-medium bg-white/10 px-3 py-1.5 rounded-xl inline-flex border border-white/10">
          <Info className="w-3.5 h-3.5" />
          <span>Jatuh tempo: 10 Okt 2023</span>
        </div>
      </div>

      {/* 4. List of Bill Breakdown Items (Matches Screen 4 details) */}
      <div className="space-y-3" id="breakdown-items-section">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-extrabold text-secondary uppercase tracking-wider">Detail Iuran</h3>
          <span className="text-xs font-bold text-slate-400">3 Item</span>
        </div>

        <div className="space-y-3" id="details-stack-items">
          
          {/* Jimpitan Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between" id="item-jimpitan">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-primary-dark shrink-0 shadow-sm border border-sky-100/50">
                <PiggyBank className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-secondary">Jimpitan</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Dana sosial warga</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-secondary">Rp 15.000</p>
              <span className="inline-block mt-1 text-[9px] font-extrabold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full border border-rose-100">
                BELUM LUNAS
              </span>
            </div>
          </div>

          {/* Keamanan Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between" id="item-keamanan">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-primary-dark shrink-0 shadow-sm border border-sky-100/50">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-secondary">Keamanan</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Penjagaan portal & ronda</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-secondary">Rp 45.000</p>
              <span className="inline-block mt-1 text-[9px] font-extrabold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full border border-rose-100">
                BELUM LUNAS
              </span>
            </div>
          </div>

          {/* Sampah Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-100 custom-shadow-sm flex items-center justify-between" id="item-sampah">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center text-primary-dark shrink-0 shadow-sm border border-sky-100/50">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-secondary">Sampah</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Pengangkutan rutin</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-secondary">Rp 25.000</p>
              <span className="inline-block mt-1 text-[9px] font-extrabold bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full border border-rose-100">
                BELUM LUNAS
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 5. Informational Alert text box */}
      <div className="bg-sky-50/50 border border-sky-100/50 p-4 rounded-2xl flex gap-3 text-xs text-slate-600 leading-relaxed" id="details-warning-box">
        <Info className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" />
        <p className="font-medium">
          Pembayaran dapat dilakukan melalui transfer bank atau tunai kepada pengurus RT. Harap lampirkan bukti bayar jika membayar via transfer.
        </p>
      </div>

      {/* 6. Main payment action triggers */}
      {totalAmount > 0 ? (
        <button
          onClick={() => setShowPaymentGateways(true)}
          className="w-full bg-primary-dark hover:opacity-90 text-white font-extrabold py-4 px-6 rounded-xl transition-all shadow-md active:scale-98 flex items-center justify-center gap-2 text-sm"
          id="btn-trigger-pay-flow"
        >
          <CreditCard className="w-4 h-4" />
          <span>Bayar Sekarang</span>
        </button>
      ) : (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 font-bold text-center text-xs">
          Semua tagihan untuk periode ini sudah lunas!
        </div>
      )}

      {/* 7. INTERACTIVE PAYMENT GATEWAY DRAWER */}
      {showPaymentGateways && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm z-50 flex items-end justify-center p-0 md:p-6 animate-fade-in" id="payment-drawer">
          <div className="bg-white rounded-t-[32px] md:rounded-[28px] w-full max-w-md p-6 custom-shadow-lg space-y-5 animate-slide-up pb-10" id="drawer-payment-options">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-secondary">Metode Pembayaran</h3>
                <p className="text-[11px] text-slate-400 font-medium">Pilih salah satu metode pembayaran di bawah</p>
              </div>
              <button 
                onClick={() => { setShowPaymentGateways(false); setSelectedGateway(null); }}
                className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400"
                id="btn-close-payment-drawer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Selector Grid */}
            {!selectedGateway ? (
              <div className="space-y-2.5" id="gateways-list">
                
                {/* QRIS */}
                <button
                  onClick={() => setSelectedGateway('qris')}
                  className="w-full bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 p-4 rounded-2xl flex items-center justify-between transition-all"
                  id="btn-gateway-qris"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-primary/10 text-primary-dark rounded-xl flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-secondary">QRIS (Instan & Otomatis)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Scan via e-wallet Gopay, OVO, ShopeePay</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Virtual Account Bank Transfer */}
                <button
                  onClick={() => setSelectedGateway('va')}
                  className="w-full bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 p-4 rounded-2xl flex items-center justify-between transition-all"
                  id="btn-gateway-va"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-primary/10 text-primary-dark rounded-xl flex items-center justify-center">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-secondary">Virtual Account Bank Transfer</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Transfer via BCA, Mandiri, BRI, BNI</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Tunai */}
                <button
                  onClick={() => setSelectedGateway('tunai')}
                  className="w-full bg-slate-50 hover:bg-sky-50 border border-slate-100 hover:border-sky-200 p-4 rounded-2xl flex items-center justify-between transition-all"
                  id="btn-gateway-tunai"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 bg-primary/10 text-primary-dark rounded-xl flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-secondary">Tunai langsung ke Pak RT</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Serahkan cash langsung ke rumah Pak RT</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

              </div>
            ) : (
              // Specific gateway view selected
              <div className="space-y-4 animate-fade-in" id="active-gateway-view">
                
                {/* Active selection info */}
                <div className="flex items-center justify-between p-3 bg-sky-50 border border-sky-100 rounded-xl">
                  <span className="text-xs font-bold text-primary-dark">
                    Metode: {selectedGateway === 'qris' ? 'QRIS Digital' : selectedGateway === 'va' ? 'Virtual Account' : 'Tunai Ke RT'}
                  </span>
                  <button 
                    onClick={() => { setSelectedGateway(null); setUploadReceipt(null); }}
                    className="text-xs font-bold text-secondary underline"
                  >
                    Ubah Metode
                  </button>
                </div>

                {/* Gateway Detail Content */}
                {selectedGateway === 'qris' && (
                  <div className="space-y-3 text-center" id="qris-payment-content">
                    <p className="text-xs text-slate-500">
                      Silakan scan QRIS di bawah ini dengan aplikasi e-wallet Anda. Pastikan nominal transfer pas sebesar <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>.
                    </p>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl inline-block">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=ARSANTA-PAYMENT-${totalAmount}`}
                        alt="QRIS Merchant"
                        className="w-36 h-36 mx-auto rounded-lg"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">PAGUYUBAN ARSANTA RT 01</p>
                    </div>
                    
                    {/* Receipt Upload */}
                    <div className="space-y-1.5 text-left">
                      <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">Unggah Bukti Bayar / Screenshot</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:bg-slate-50 transition-all relative">
                        {uploadReceipt ? (
                          <div className="flex items-center justify-center gap-2 text-emerald-600 text-xs font-bold">
                            <Check className="w-4 h-4" />
                            <span>Bukti bayar terlampir!</span>
                          </div>
                        ) : (
                          <label className="cursor-pointer space-y-1 block">
                            <Upload className="w-5 h-5 text-slate-400 mx-auto" />
                            <p className="text-xs font-semibold text-slate-600">Klik untuk upload bukti bayar</p>
                            <p className="text-[10px] text-slate-400">Format PNG/JPG</p>
                            <input type="file" accept="image/*" onChange={handleReceiptUpload} className="hidden" />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {selectedGateway === 'va' && (
                  <div className="space-y-3" id="va-payment-content">
                    <p className="text-xs text-slate-500">
                      Transfer tepat sebesar <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong> ke rekening bank resmi RT 01 berikut:
                    </p>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
                      <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                        <span className="text-xs text-slate-400 font-medium">Bank Mandiri (VA)</span>
                        <span className="text-xs font-bold text-slate-800">8890 0812 3456 7890</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 font-medium">Bank BCA (Transfer)</span>
                        <span className="text-xs font-bold text-slate-800">1270 334 521 (a.n Hendy RT)</span>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      * Setelah transfer sukses, harap upload screenshot atau beritahu pengurus RT untuk konfirmasi instan.
                    </p>
                  </div>
                )}

                {selectedGateway === 'tunai' && (
                  <div className="space-y-3" id="tunai-payment-content">
                    <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl flex gap-2.5 text-xs text-amber-800 leading-relaxed">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Prosedur Pembayaran Tunai:</p>
                        <p className="mt-1">
                          Harap hubungi atau kunjungi langsung kediaman Bendahara / Ketua RT 01 <strong>(Pak Hendy - Blok A No. 1)</strong> untuk menyerahkan dana sebesar <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Verify / Complete Button */}
                <button
                  onClick={handleSimulatePayment}
                  disabled={processing}
                  className="w-full bg-primary-dark hover:opacity-95 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  id="btn-complete-payment"
                >
                  {processing ? (
                    <>
                      <HelpCircle className="w-4 h-4 animate-spin" />
                      <span>Memproses Verifikasi...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Saya Sudah Membayar</span>
                    </>
                  )}
                </button>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
