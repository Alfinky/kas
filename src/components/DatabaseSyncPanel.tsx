/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Database, RefreshCw, CheckCircle2, AlertCircle, DatabaseZap, HardDriveUpload, HardDriveDownload } from 'lucide-react';
import { syncDatabaseFromServer, syncDatabaseToPostgres } from '../data';

interface DatabaseSyncPanelProps {
  onSyncComplete?: () => void;
}

interface DBLog {
  timestamp: string;
  type: 'fetch' | 'backup' | 'error' | 'info';
  message: string;
}

export default function DatabaseSyncPanel({ onSyncComplete }: DatabaseSyncPanelProps) {
  const [testing, setTesting] = useState(false);
  const [syncingUp, setSyncingUp] = useState(false);
  const [syncingDown, setSyncingDown] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [logs, setLogs] = useState<DBLog[]>([]);

  useEffect(() => {
    // Load local db logs or initialize
    const storedLogs = localStorage.getItem('arsanta_db_logs');
    if (storedLogs) {
      try {
        setLogs(JSON.parse(storedLogs));
      } catch (err) {
        setLogs([]);
      }
    } else {
      const initialLog: DBLog = {
        timestamp: new Date().toLocaleString('id-ID'),
        type: 'info',
        message: 'Koneksi ke database PostgreSQL siap digunakan.'
      };
      setLogs([initialLog]);
      localStorage.setItem('arsanta_db_logs', JSON.stringify([initialLog]));
    }
  }, []);

  const addLog = (type: DBLog['type'], message: string) => {
    const newLog: DBLog = {
      timestamp: new Date().toLocaleString('id-ID'),
      type,
      message
    };
    const updated = [newLog, ...logs].slice(0, 50);
    setLogs(updated);
    localStorage.setItem('arsanta_db_logs', JSON.stringify(updated));
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setTestResult('success');
        addLog('info', 'Uji koneksi ke PostgreSQL berhasil (Server API terhubung).');
      } else {
        setTestResult('failed');
        addLog('error', 'Uji koneksi gagal: Server API merespons dengan status error.');
      }
    } catch (err: any) {
      setTestResult('failed');
      addLog('error', `Uji koneksi gagal: ${err.message || err}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSyncUp = async () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengunggah (backup) semua data lokal saat ini ke Database PostgreSQL Cloud?'
    );
    if (!confirmed) return;

    setSyncingUp(true);
    addLog('backup', 'Memulai pengunggahan cadangan data ke PostgreSQL...');
    const success = await syncDatabaseToPostgres();
    setSyncingUp(false);
    if (success) {
      addLog('backup', 'Semua data lokal berhasil dicadangkan ke database PostgreSQL Cloud!');
      alert('Semua data berhasil diunggah ke Database PostgreSQL!');
      if (onSyncComplete) onSyncComplete();
    } else {
      addLog('error', 'Gagal mencadangkan data ke database PostgreSQL.');
      alert('Gagal mengunggah data. Silakan periksa koneksi atau log aktivitas.');
    }
  };

  const handleSyncDown = async () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menarik data terbaru dari Database PostgreSQL? Data lokal Anda saat ini akan diselaraskan.'
    );
    if (!confirmed) return;

    setSyncingDown(true);
    addLog('fetch', 'Mengambil data terbaru dari PostgreSQL...');
    const success = await syncDatabaseFromServer();
    setSyncingDown(false);
    if (success) {
      addLog('fetch', 'Data lokal berhasil disinkronkan dengan data terbaru dari database PostgreSQL Cloud!');
      alert('Berhasil mengunduh data terbaru dari Database PostgreSQL!');
      if (onSyncComplete) onSyncComplete();
    } else {
      addLog('error', 'Gagal mengunduh data terbaru dari database PostgreSQL.');
      alert('Gagal mengunduh data. Silakan periksa koneksi atau log aktivitas.');
    }
  };

  const handleClearLogs = () => {
    const initialLog: DBLog = {
      timestamp: new Date().toLocaleString('id-ID'),
      type: 'info',
      message: 'Log aktivitas dibersihkan.'
    };
    setLogs([initialLog]);
    localStorage.setItem('arsanta_db_logs', JSON.stringify([initialLog]));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6 animate-fade-in" id="database-sync-panel">
      {/* Title Panel */}
      <div className="bg-white rounded-2xl p-6 custom-shadow-sm border border-slate-100 flex items-start gap-4" id="sync-header">
        <div className="p-3 bg-sky-50 rounded-xl text-primary-dark">
          <DatabaseZap className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold font-display text-secondary">Integrasi Database PostgreSQL</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sistem Kas Warga Arsanta terhubung langsung dengan database relasional PostgreSQL Cloud yang aman, andal, dan tersinkronisasi.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full text-xs text-emerald-800 border border-emerald-100 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Status Database: Aktif & Terhubung
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="sync-content-grid">
        {/* Left Column: Actions */}
        <div className="bg-white rounded-2xl p-6 custom-shadow-sm border border-slate-100 space-y-5 flex flex-col justify-between" id="sync-actions-col">
          <div>
            <h3 className="text-base font-bold font-display text-secondary flex items-center gap-2 border-b border-slate-100 pb-3">
              <Database className="w-5 h-5 text-primary-dark" />
              Kontrol Sinkronisasi Manual
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Meskipun data tersimpan otomatis saat ada perubahan, Anda dapat melakukan sinkronisasi secara manual di bawah ini untuk memastikan sinkronisasi data antar-perangkat.
            </p>
          </div>

          <div className="space-y-4 my-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSyncUp}
                disabled={syncingUp || syncingDown}
                className="bg-primary-dark hover:opacity-90 text-white font-semibold text-xs py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                id="btn-sync-up"
              >
                <HardDriveUpload className="w-6 h-6" />
                <span>Unggah Cadangan</span>
              </button>

              <button
                onClick={handleSyncDown}
                disabled={syncingUp || syncingDown}
                className="bg-white hover:bg-slate-50 text-primary-dark border-2 border-primary-dark font-semibold text-xs py-4 px-4 rounded-xl flex flex-col items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50 cursor-pointer"
                id="btn-sync-down"
              >
                <HardDriveDownload className="w-6 h-6 text-primary-dark" />
                <span>Unduh Data Baru</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 text-center">
              * Aksi unduh akan menyelaraskan penyimpanan lokal Anda dengan database PostgreSQL utama di server Cloud.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              id="btn-test-sync-connection"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Uji Status Koneksi Database
            </button>

            {testResult && (
              <div
                className={`mt-3 p-3 rounded-xl flex items-center gap-2 text-xs font-medium animate-fade-in ${
                  testResult === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-100'
                    : 'bg-rose-50 text-rose-800 border border-rose-100'
                }`}
                id="test-connection-result"
              >
                {testResult === 'success' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Koneksi berhasil! Database PostgreSQL siap disinkronkan.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Gagal memverifikasi koneksi. Silakan periksa jaringan Anda.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Info & Architecture details */}
        <div className="bg-white rounded-2xl p-6 custom-shadow-sm border border-slate-100 space-y-4 flex flex-col justify-between" id="sync-guide-col">
          <div>
            <h3 className="text-base font-bold font-display text-secondary flex items-center gap-2 border-b border-slate-100 pb-3">
              <DatabaseZap className="w-5 h-5 text-primary-dark" />
              Arsitektur Penyimpanan Baru
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed mt-2">
              Aplikasi ini telah dimigrasi sepenuhnya dari Google Sheets ke database relasional <strong>PostgreSQL</strong> di cloud. 
            </p>
          </div>

          <div className="text-xs text-slate-600 space-y-3 pr-1">
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <p className="font-bold text-slate-800 text-[11px]">Mengapa Database Relasional?</p>
              <ul className="list-disc pl-4 mt-1 text-[11px] text-slate-600 space-y-1">
                <li><strong>Performa Tinggi:</strong> Pengambilan data instan dengan query database terindeks.</li>
                <li><strong>Keamanan Maksimal:</strong> Enskripsi data dan kredensial database tersimpan aman di server Cloud Run.</li>
                <li><strong>Integritas Data:</strong> Relasi antar tabel Warga, Tagihan, dan Pembayaran terjaga ketat tanpa risiko data rusak/terhapus tidak sengaja di spreadsheet.</li>
              </ul>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              <strong>Penyimpanan Offline-First:</strong> Aplikasi tetap menggunakan penyimpanan lokal (LocalStorage) agar akses super-cepat di perangkat Anda, lalu menyinkronkannya ke PostgreSQL di latar belakang.
            </span>
          </div>
        </div>
      </div>

      {/* Logs Section */}
      <div className="bg-white rounded-2xl p-6 custom-shadow-sm border border-slate-100" id="sync-logs-panel">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h3 className="text-base font-bold font-display text-secondary flex items-center gap-2">
            <Database className="w-5 h-5 text-primary-dark" />
            Log Sinkronisasi Database
          </h3>
          <button
            onClick={handleClearLogs}
            className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1 cursor-pointer"
            id="btn-refresh-logs"
          >
            Bersihkan Log
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs" id="empty-logs">
            Belum ada aktivitas sinkronisasi database yang tercatat.
          </div>
        ) : (
          <div className="bg-slate-900 rounded-xl p-3 font-mono text-xs text-slate-300 max-h-[150px] overflow-y-auto space-y-1.5" id="sync-logs-list">
            {logs.map((log, index) => (
              <div key={index} className="flex items-start gap-2 border-b border-slate-800/60 pb-1 last:border-0">
                <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                <span
                  className={`font-semibold shrink-0 ${
                    log.type === 'error'
                      ? 'text-rose-400'
                      : log.type === 'backup'
                      ? 'text-sky-400'
                      : log.type === 'fetch'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  [{log.type.toUpperCase()}]
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
