/**
 * SILENTSUITE CORE LOGIC
 * v2.0.0 - Hash Routing & Enhanced UI
 */

// --- 1. CONFIGURATION & STATE ---
const STATE = {
    pdfMergeQueue: [],
    currentView: 'home'
};

// Konfigurasi Worker PDF.js (Wajib agar tidak error)
if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
}

// --- 2. ROUTING SYSTEM (HASH BASED) ---
// Solusi aman untuk GitHub Pages agar tidak 404 saat refresh
const routes = {
    '/': 'home',
    '/select-menu': 'select-menu',
    '/pdf-tools': 'pdf-tools',
    '/media-tools': 'media-tools',
    '/utilities': 'utilities',
    
    // Feature Routes
    '/pdf-merger': 'pdf-merger',
    '/pdf-splitter': 'pdf-splitter',
    '/image-to-pdf': 'image-to-pdf',
    '/pdf-to-image': 'pdf-to-image',
    '/video-to-mp3': 'video-to-mp3',
    '/video-compress': 'video-compress',
    '/image-compressor': 'image-compressor',
    '/image-converter': 'image-converter',
    '/meme-generator': 'meme-generator',
    '/qr-maker': 'qr-maker',
    '/password-generator': 'password-generator',
    '/unit-converter': 'unit-converter'
};

// Navigasi manual via Script
function navigateTo(url) {
    // Ubah hash, ini akan memicu event 'hashchange'
    window.location.hash = url;
}

// Handler utama routing
function handleRoute() {
    // Ambil hash, hilangkan tanda #. Default ke '/' jika kosong
    // Contoh: #/pdf-merger -> /pdf-merger
    let path = window.location.hash.slice(1) || '/';
    
    // Bersihkan query params jika ada (misal dari redirect)
    if (path.includes('?')) {
        path = path.split('?')[0];
    }

    const viewId = routes[path] || 'home';
    
    // Transisi UI: Sembunyikan semua view
    document.querySelectorAll('.app-view, .tab-content').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('animate-fade-in-up');
    });

    // Tampilkan view target
    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        window.scrollTo(0, 0); // Reset scroll ke atas
        
        // Trigger animasi masuk
        setTimeout(() => {
            targetView.classList.add('animate-fade-in-up');
        }, 10);
        
        STATE.currentView = viewId;
    } else {
        // Fallback ke home jika route tidak dikenal
        document.getElementById('home').classList.remove('hidden');
    }

    // Update Meta Title (UX)
    const title = viewId === 'home' ? 'Home' : viewId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    document.title = `SilentSuite | ${title}`;
    
    // Tutup Mobile Menu jika terbuka
    document.getElementById('mobile-menu').classList.add('hidden');
}

// --- 3. EVENT LISTENERS & INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Routing Listeners (Hash Change & Load)
    // Ini inti dari perbaikan Masalah 1
    window.addEventListener('hashchange', handleRoute);
    window.addEventListener('load', handleRoute);

    // B. Setup Global UI Helpers
    setupDragDrop();
    setupRangeSliders();
    setupFilePreviews(); // Fitur Baru: Auto Preview

    if(document.getElementById('unitCat')) {
        updateUnitOptions(); // Inisialisasi dropdown converter biar gak kosong
    }

    
    // C. Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(() => console.log('[System] Service Worker Active'))
            .catch(err => console.error('[System] SW Failed:', err));
    }
});

// Helper: Mobile Menu Toggle
window.toggleMobileMenu = function() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
};

// --- 4. NEW FEATURE: AUTOMATED FILE PREVIEW ---
// Solusi Masalah 3: File Upload Tidak Terlihat
function setupFilePreviews() {
    // Mapping ID Input -> ID Container Preview
    const previewMap = {
        'splitInput': 'preview-split',
        'imgToPdfInput': 'preview-img-to-pdf',
        'pdfToImgInput': 'preview-pdf-to-img',
        'videoInput': 'preview-video-mp3',
        'compressVideoInput': 'preview-video-compress',
        'imageInput': 'preview-img-compress',
        'imgConvertInput': 'preview-img-convert',
        'memeInput': 'preview-meme'
    };

    Object.keys(previewMap).forEach(inputId => {
        const input = document.getElementById(inputId);
        const container = document.getElementById(previewMap[inputId]);
        
        if (input && container) {
            input.addEventListener('change', function(e) {
                renderPreview(this.files, container);
            });
        }
    });
}

function renderPreview(files, container) {
    container.innerHTML = ''; // Reset preview lama
    container.classList.remove('hidden');
    
    if (files.length === 0) {
        container.classList.add('hidden');
        return;
    }

    Array.from(files).forEach(file => {
        const isImage = file.type.startsWith('image/');
        const sizeFormatted = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        
        const item = document.createElement('div');
        item.className = 'file-preview-item animate-fade-scale';
        
        let iconHtml = '';
        if (isImage) {
            const url = URL.createObjectURL(file);
            // Gunakan onload untuk revoke URL agar tidak memory leak
            iconHtml = `<img src="${url}" class="file-thumb" onload="URL.revokeObjectURL(this.src)">`;
        } else if (file.type.includes('pdf')) {
            iconHtml = `<div class="file-icon-placeholder text-red-500 bg-red-50 border-red-100"><i class="fa-solid fa-file-pdf"></i></div>`;
        } else if (file.type.includes('video')) {
            iconHtml = `<div class="file-icon-placeholder text-purple-500 bg-purple-50 border-purple-100"><i class="fa-solid fa-film"></i></div>`;
        } else {
            iconHtml = `<div class="file-icon-placeholder"><i class="fa-solid fa-file"></i></div>`;
        }

        item.innerHTML = `
            <div class="file-preview-info">
                ${iconHtml}
                <div class="file-meta">
                    <span class="file-name" title="${file.name}">${file.name}</span>
                    <span class="file-size">${sizeFormatted}</span>
                </div>
            </div>
            <div class="text-brand-600 text-lg">
                <i class="fa-solid fa-check-circle"></i>
            </div>
        `;
        
        container.appendChild(item);
    });
}

// Helper: Drag & Drop Visuals (Updated)
function setupDragDrop() {
    const zones = document.querySelectorAll('label[class*="border-dashed"]');
    zones.forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, preventDefaults, false);
        });

        // Efek visual saat drag
        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.add('border-brand-500', 'bg-brand-50');
                zone.classList.remove('border-slate-300');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => {
                zone.classList.remove('border-brand-500', 'bg-brand-50');
                zone.classList.add('border-slate-300');
            }, false);
        });

        // Handle File Drop
        zone.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (input) {
                input.files = files;
                // Trigger change event manual agar preview muncul
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        });
    });
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function setupRangeSliders() {
    const passRange = document.getElementById('passLength');
    if(passRange) {
        passRange.addEventListener('input', (e) => {
            const lenVal = document.getElementById('lenVal');
            if(lenVal) lenVal.innerText = e.target.value;
        });
    }
}

// ==========================================
// FEATURE: PDF TOOLS
// ==========================================

// --- PDF MERGER (Custom Queue Logic) ---
// Merger punya logika preview sendiri (bisa hapus per item)
const mergeInput = document.getElementById('mergeInput');
if (mergeInput) {
    mergeInput.addEventListener('change', (e) => {
        const newFiles = Array.from(e.target.files);
        STATE.pdfMergeQueue = [...STATE.pdfMergeQueue, ...newFiles];
        renderMergeQueue();
        e.target.value = ''; // Reset agar bisa pilih file yang sama lagi
    });
}

function renderMergeQueue() {
    const container = document.getElementById('mergeFileList');
    if (!container) return;

    container.innerHTML = '';
    
    if (STATE.pdfMergeQueue.length === 0) {
        container.innerHTML = `<div class="text-center text-slate-400 text-sm py-4 italic">Belum ada file dalam antrean.</div>`;
        return;
    }

    STATE.pdfMergeQueue.forEach((file, index) => {
        const div = document.createElement('div');
        // Gunakan style class baru agar konsisten
        div.className = 'file-preview-item animate-fade-in group';
        div.innerHTML = `
            <div class="file-preview-info">
                <div class="file-icon-placeholder text-red-500 bg-red-50 border-red-100">
                    <i class="fa-solid fa-file-pdf"></i>
                </div>
                <div class="file-meta">
                    <span class="file-name">${file.name}</span>
                    <span class="file-size">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            </div>
            <button onclick="removeMergeItem(${index})" class="btn-remove-file" title="Hapus">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;
        container.appendChild(div);
    });
}

window.removeMergeItem = function(index) {
    STATE.pdfMergeQueue.splice(index, 1);
    renderMergeQueue();
};

window.processMergePDF = async function() {
    if (STATE.pdfMergeQueue.length < 2) return alert("Mohon pilih minimal 2 file PDF untuk digabungkan.");
    
    const btn = document.querySelector("button[onclick='processMergePDF()']");
    setLoading(btn, true, 'Menggabungkan...');

    try {
        const { PDFDocument } = PDFLib;
        const mergedPdf = await PDFDocument.create();

        for (const file of STATE.pdfMergeQueue) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await PDFDocument.load(arrayBuffer);
            const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
            copiedPages.forEach((page) => mergedPdf.addPage(page));
        }

        const pdfBytes = await mergedPdf.save();
        downloadBlob(pdfBytes, "SilentSuite-Merged.pdf", "application/pdf");
        
        STATE.pdfMergeQueue = [];
        renderMergeQueue();
        alert("Berhasil! File PDF telah digabungkan.");

    } catch (error) {
        console.error(error);
        alert("Gagal menggabungkan PDF. Pastikan file tidak terproteksi password.");
    } finally {
        setLoading(btn, false, '<i class="fa-solid fa-bolt"></i> Gabungkan Sekarang');
    }
};

// --- PDF SPLITTER ---
window.processSplitPDF = async function() {
    const fileInput = document.getElementById('splitInput');
    const rangeInput = document.getElementById('splitRange');
    
    if (!fileInput.files[0]) return alert("Silakan upload file PDF terlebih dahulu.");
    if (!rangeInput.value) return alert("Masukkan rentang halaman (Contoh: 1-5).");

    const btn = document.querySelector("button[onclick='processSplitPDF()']");
    setLoading(btn, true, 'Memproses...');

    try {
        const file = fileInput.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const newPdf = await PDFDocument.create();
        
        const totalPages = pdfDoc.getPageCount();
        const indices = parsePageRange(rangeInput.value, totalPages);
        
        if (indices.length === 0) throw new Error("Format halaman tidak valid atau di luar rentang.");

        const copiedPages = await newPdf.copyPages(pdfDoc, indices);
        copiedPages.forEach(page => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        downloadBlob(pdfBytes, `Split-${file.name}`, "application/pdf");

    } catch (error) {
        alert("Error: " + error.message);
    } finally {
        setLoading(btn, false, 'Pisahkan PDF');
    }
};

function parsePageRange(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(',');
    
    parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            let [start, end] = part.split('-').map(Number);
            if (start && end) {
                if (start > end) [start, end] = [end, start];
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= maxPages) pages.add(i - 1);
                }
            }
        } else {
            const num = Number(part);
            if (num >= 1 && num <= maxPages) pages.add(num - 1);
        }
    });
    return Array.from(pages).sort((a, b) => a - b);
}

// --- IMAGE TO PDF ---
window.processImgToPdf = async function() {
    const input = document.getElementById('imgToPdfInput');
    if (input.files.length === 0) return alert("Pilih gambar terlebih dahulu!");

    const btn = document.querySelector("button[onclick='processImgToPdf()']");
    setLoading(btn, true, 'Mengkonversi...');

    try {
        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.create();

        for (const file of input.files) {
            const buffer = await file.arrayBuffer();
            let image;
            
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(buffer);
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(buffer);
            } else {
                continue; 
            }

            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0, y: 0, width: image.width, height: image.height,
            });
        }

        const pdfBytes = await pdfDoc.save();
        downloadBlob(pdfBytes, "Images-to-PDF.pdf", "application/pdf");

    } catch (err) {
        alert("Gagal: " + err.message);
    } finally {
        setLoading(btn, false, 'Convert to PDF');
    }
};

// --- PDF TO IMAGE ---
window.processPdfToImg = async function() {
    const input = document.getElementById('pdfToImgInput');
    if (!input.files[0]) return alert("Pilih PDF terlebih dahulu!");

    const btn = document.querySelector("button[onclick='processPdfToImg()']");
    setLoading(btn, true, 'Mengekstrak (Mohon Tunggu)...');

    try {
        const file = input.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            downloadBlob(blob, `Page-${i}-${file.name}.jpg`, "image/jpeg");
            
            await new Promise(r => setTimeout(r, 200));
        }
        
        alert("Selesai! Pastikan izin 'Multiple Downloads' aktif.");

    } catch (err) {
        console.error(err);
        alert("Gagal mengekstrak: " + err.message);
    } finally {
        setLoading(btn, false, 'Ekstrak Gambar');
    }
};

// ==========================================
// FEATURE: MEDIA TOOLS
// ==========================================

window.processVideoToAudio = function() {
    alert("Fitur ini dinonaktifkan sementara untuk stabilitas browser mobile (Memory Safety). Gunakan fitur PDF dan Gambar yang sudah stabil.");
};
window.processVideoCompress = function() {
    alert("Sedang dalam pengembangan untuk performa WebAssembly yang lebih ringan.");
};

window.compressImage = async function() {
    const input = document.getElementById('imageInput');
    const sizeVal = document.getElementById('compressSizeVal').value;
    const unit = document.getElementById('compressUnit').value;
    const resultBox = document.getElementById('compressionResult');

    if (!input.files[0]) return alert("Pilih gambar!");
    if (!sizeVal) return alert("Tentukan target ukuran!");

    const btn = document.querySelector("button[onclick='compressImage()']");
    setLoading(btn, true, 'Compressing...');
    resultBox.classList.add('hidden');

    try {
        const file = input.files[0];
        let targetSizeMB = parseFloat(sizeVal);
        if (unit === 'KB') targetSizeMB = targetSizeMB / 1024;

        const targetBytes = targetSizeMB * 1024 * 1024;
        const tolerance = targetBytes * 0.08;

        let minQ = 0.1;
        let maxQ = 1.0;
        let bestFile = null;

        for (let i = 0; i < 8; i++) {
            const midQ = (minQ + maxQ) / 2;

            const compressed = await imageCompression(file, {
                maxSizeMB: undefined,
                useWebWorker: true,
                initialQuality: midQ
            });

            if (!bestFile || Math.abs(compressed.size - targetBytes) < Math.abs(bestFile.size - targetBytes)) {
                bestFile = compressed;
            }

            if (Math.abs(compressed.size - targetBytes) <= tolerance) {
                bestFile = compressed;
                break;
            }

            if (compressed.size > targetBytes) {
                maxQ = midQ;
            } else {
                minQ = midQ;
            }
        }

        const compressedFile = bestFile;

        resultBox.innerHTML = `
            <div class="text-center">
                <p class="text-sm text-slate-500 mb-2">Original: ${(file.size/1024).toFixed(1)}KB -> <b>${(compressedFile.size/1024).toFixed(1)}KB</b></p>
                <a id="dl-compressed" class="block w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer">
                    Download Hasil
                </a>
            </div>
        `;
        resultBox.classList.remove('hidden');

        const dlBtn = document.getElementById('dl-compressed');
        dlBtn.onclick = () => downloadBlob(compressedFile, `compressed-${file.name}`, file.type);

    } catch (error) {
        alert("Gagal kompresi: " + error.message);
    } finally {
        setLoading(btn, false, 'Compress Now');
    }
};

// --- IMAGE CONVERTER ---
window.processImageConvert = function() {
    const input = document.getElementById('imgConvertInput');
    const format = document.getElementById('targetFormat').value;
    
    if (!input.files[0]) return alert("Pilih gambar!");

    const btn = document.querySelector("button[onclick='processImageConvert()']");
    setLoading(btn, true, 'Converting...');

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            if (format === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                const ext = format === 'image/jpeg' ? 'jpg' : 'png';
                downloadBlob(blob, `converted.${ext}`, format);
                setLoading(btn, false, 'Convert Image');
            }, format, 0.9);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// --- MEME GENERATOR ---
window.generateMeme = function() {
    const input = document.getElementById('memeInput');
    const topText = document.getElementById('memeTop').value.toUpperCase();
    const bottomText = document.getElementById('memeBottom').value.toUpperCase();
    
    if (!input.files[0]) return alert("Pilih gambar dasar!");

    const canvas = document.getElementById('memeCanvas');
    const ctx = canvas.getContext('2d');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const fontSize = Math.floor(img.width / 10);
            ctx.font = `900 ${fontSize}px Impact, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.floor(fontSize / 8);
            ctx.textAlign = 'center';

            ctx.textBaseline = 'top';
            ctx.strokeText(topText, canvas.width / 2, 10);
            ctx.fillText(topText, canvas.width / 2, 10);

            ctx.textBaseline = 'bottom';
            ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 10);
            ctx.fillText(bottomText, canvas.width / 2, canvas.height - 10);

            canvas.toBlob(blob => {
                downloadBlob(blob, 'meme-silentsuite.png', 'image/png');
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
};

// ==========================================
// FEATURE: UTILITIES (QR, Pass, Unit)
// ==========================================

window.generateQR = function() {
    // 1. Setup Variable
    const text = document.getElementById('qrInput').value;
    const container = document.getElementById('qrResult');
    const downloadBtn = document.getElementById('qrDownloadBtn');
    
    // 2. Cek Input Kosong
    if (!text) return alert("Masukkan teks atau link!");
    
    // 3. (OPTIMASI) Sembunyikan tombol download dulu!
    // Biar user gak download pas lagi proses generate
    downloadBtn.classList.add('hidden'); 
    
    // 4. Bersihin container lama
    container.innerHTML = "";
    container.classList.remove('hidden');
    
    // 5. Generate QR Baru
    new QRCode(container, {
        text: text, 
        width: 200, 
        height: 200,
        colorDark : "#000000", 
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    // 6. Munculin Tombol Download (Baru sekarang dimunculin!)
    // Kasih sedikit delay (opsional) biar mulus, atau langsung juga oke
    setTimeout(() => {
        downloadBtn.classList.remove('hidden');
        downloadBtn.classList.add('inline-flex');
    }, 100); // Delay 0.1 detik biar pas render
};

// NEW FUNCTION: Download Logic
window.downloadQR = function() {
    const container = document.getElementById('qrResult');
    const img = container.querySelector('img');

    if (img && img.src) {
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = img.src;
        link.download = 'qrcode-silentsuite.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        alert("QR Code belum siap untuk didownload. Silakan coba lagi.");
    }
};

window.generatePass = function() {
    const length = document.getElementById('passLength').value;
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    document.getElementById('passResult').value = retVal;
};

window.copyPass = function() {
    const el = document.getElementById("passResult");
    if(!el.value) return;
    el.select();
    navigator.clipboard.writeText(el.value);
    
    const btn = document.querySelector('button[title="Copy"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
    setTimeout(() => btn.innerHTML = original, 1500);
};

window.updateUnitOptions = function() {
    const cat = document.getElementById('unitCat').value;
    const from = document.getElementById('unitFrom');
    const to = document.getElementById('unitTo');
    
    const options = {
        length: { m: 'Meter', km: 'Kilometer', cm: 'Centimeter', mm: 'Millimeter', ft: 'Feet', in: 'Inch', yd: 'Yard' },
        weight: { kg: 'Kilogram', g: 'Gram', mg: 'Milligram', lb: 'Pound', oz: 'Ounce' },
        temp:   { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }
    };
    
    from.innerHTML = ''; to.innerHTML = '';
    Object.entries(options[cat]).forEach(([key, label]) => {
        from.add(new Option(label, key));
        to.add(new Option(label, key));
    });
    
    if(cat === 'length') { to.value = 'km'; }
    if(cat === 'weight') { to.value = 'g'; }
    if(cat === 'temp') { to.value = 'f'; }
};

window.convertUnit = function() {
    const val = parseFloat(document.getElementById('unitVal').value);
    const cat = document.getElementById('unitCat').value;
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;
    
    if (isNaN(val)) return;

    let result;
    if (cat === 'temp') {
        if (from === to) result = val;
        else if (from === 'c') result = to === 'f' ? (val * 9/5) + 32 : val + 273.15;
        else if (from === 'f') result = to === 'c' ? (val - 32) * 5/9 : (val - 32) * 5/9 + 273.15;
        else if (from === 'k') result = to === 'c' ? val - 273.15 : (val - 273.15) * 9/5 + 32;
    } else {
        const factors = {
            length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, yd: 0.9144 },
            weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 }
        };
        const baseValue = val * factors[cat][from];
        result = baseValue / factors[cat][to];
    }

    const displayResult = Number.isInteger(result) ? result : parseFloat(result.toFixed(6));
    document.getElementById('unitResult').innerText = displayResult;
    document.getElementById('unitResultLabel').innerText = to;
};

// ==========================================
// GLOBAL HELPERS
// ==========================================

function downloadBlob(data, filename, mimeType) {
    const blob = (data instanceof Blob) ? data : new Blob([data], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function setLoading(btnElement, isLoading, text) {
    if (isLoading) {
        btnElement.dataset.originalText = text;
        btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin-fast"></i> ${text}`;
        btnElement.disabled = true;
        btnElement.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnElement.innerHTML = text;
        btnElement.disabled = false;
        btnElement.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}
