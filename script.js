/**
 * SILENTSUITE CORE LOGIC
 * v1.0.0 Stable - Client Side Processing
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

// --- 2. ROUTING SYSTEM (SPA) ---
const routes = {
    '/': 'home',
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

function navigateTo(url) {
    window.history.pushState(null, null, url);
    handleRoute();
}

function handleRoute() {
    let path = window.location.pathname;
    
    // Normalisasi Path untuk GitHub Pages (jika di subdirectory)
    // Contoh: /silentsuite/pdf-merger -> /pdf-merger
    const pathSegments = path.split('/').filter(Boolean);
    if (pathSegments.length > 0 && !routes['/' + pathSegments[0]]) {
        // Asumsi segmen pertama adalah nama repo, ambil segmen kedua
        path = '/' + (pathSegments[1] || '');
    } else if (pathSegments.length === 0) {
        path = '/';
    } else {
        path = '/' + pathSegments.join('/');
    }
    
    // Match route atau fallback ke home
    const viewId = routes[path] || 'home';
    
    // Transisi UI
    document.querySelectorAll('.app-view, .tab-content').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('animate-fade-in-up');
    });

    const targetView = document.getElementById(viewId);
    if (targetView) {
        targetView.classList.remove('hidden');
        // Sedikit delay agar animasi reset
        setTimeout(() => targetView.classList.add('animate-fade-in-up'), 10);
        window.scrollTo(0, 0);
        STATE.currentView = viewId;
    } else {
        // Fallback total
        document.getElementById('home').classList.remove('hidden');
    }

    // Update Meta Title (Optional, bagus untuk UX)
    document.title = `SilentSuite | ${viewId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    
    // Tutup Mobile Menu
    document.getElementById('mobile-menu').classList.add('hidden');
}

// --- 3. EVENT LISTENERS & INIT ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Intercept Link Clicks
    document.body.addEventListener('click', e => {
        const link = e.target.closest('a.route-link');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            navigateTo(href);
        }
    });

    // B. Handle Browser Back/Forward
    window.addEventListener('popstate', handleRoute);

    // C. Setup Global UI Helpers
    setupDragDrop();
    setupRangeSliders();
    
    // D. Initial Route
    handleRoute();

    // E. Register Service Worker
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

// Helper: Drag & Drop Visuals
function setupDragDrop() {
    const zones = document.querySelectorAll('label[class*="border-dashed"]');
    zones.forEach(zone => {
        const input = zone.querySelector('input[type="file"]');
        
        // Prevent default browser behavior
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, preventDefaults, false);
        });

        // Highlight visual
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
                // Trigger change event manual
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

// --- PDF MERGER ---
const mergeInput = document.getElementById('mergeInput');
if (mergeInput) {
    mergeInput.addEventListener('change', (e) => {
        // Append files, jangan replace
        const newFiles = Array.from(e.target.files);
        STATE.pdfMergeQueue = [...STATE.pdfMergeQueue, ...newFiles];
        renderMergeQueue();
        // Reset input agar bisa pilih file yang sama lagi
        e.target.value = '';
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
        div.className = 'flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm animate-fade-in group hover:border-red-200 transition';
        div.innerHTML = `
            <div class="flex items-center gap-3 overflow-hidden">
                <div class="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500 shrink-0">
                    <i class="fa-solid fa-file-pdf"></i>
                </div>
                <div class="flex flex-col overflow-hidden">
                    <span class="text-sm font-bold text-slate-700 truncate">${file.name}</span>
                    <span class="text-xs text-slate-400">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
            </div>
            <button onclick="removeMergeItem(${index})" class="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition">
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
        
        // Reset
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

// Helper: Parse Range "1-3, 5, 8-10"
function parsePageRange(rangeStr, maxPages) {
    const pages = new Set();
    const parts = rangeStr.split(',');
    
    parts.forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
            let [start, end] = part.split('-').map(Number);
            if (start && end) {
                // Swap if reverse
                if (start > end) [start, end] = [end, start];
                for (let i = start; i <= end; i++) {
                    if (i >= 1 && i <= maxPages) pages.add(i - 1); // 0-based index
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
            
            // Cek tipe file
            if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
                image = await pdfDoc.embedJpg(buffer);
            } else if (file.type === 'image/png') {
                image = await pdfDoc.embedPng(buffer);
            } else {
                continue; // Skip file non-gambar
            }

            // Buat halaman sesuai ukuran gambar
            const page = pdfDoc.addPage([image.width, image.height]);
            page.drawImage(image, {
                x: 0,
                y: 0,
                width: image.width,
                height: image.height,
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

// --- PDF TO IMAGE (Improved) ---
window.processPdfToImg = async function() {
    const input = document.getElementById('pdfToImgInput');
    if (!input.files[0]) return alert("Pilih PDF terlebih dahulu!");

    const btn = document.querySelector("button[onclick='processPdfToImg()']");
    setLoading(btn, true, 'Mengekstrak (Mohon Tunggu)...');

    try {
        const file = input.files[0];
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

        // Loop Sequential agar browser tidak freeze
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1.5 }); // Scale 1.5x untuk kualitas HD
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            // Convert to Blob & Download
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.85));
            downloadBlob(blob, `Page-${i}-${file.name}.jpg`, "image/jpeg");
            
            // Jeda sedikit agar UI update (breathe)
            await new Promise(r => setTimeout(r, 200));
        }
        
        alert("Selesai! Pastikan Anda mengizinkan 'Multiple Downloads' di browser.");

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

// --- VIDEO TOOLS (MAINTENANCE) ---
window.processVideoToAudio = function() {
    alert("Fitur ini membutuhkan pemrosesan server yang berat. Karena SilentSuite berjalan 100% di browser Anda (tanpa server), fitur ini sedang dinonaktifkan untuk menjaga stabilitas perangkat Anda.");
};
window.processVideoCompress = function() {
    alert("Fitur ini sedang dalam tahap optimalisasi WebAssembly agar tidak memberatkan browser HP. Silakan gunakan fitur PDF dan Gambar yang sudah stabil.");
};

// --- IMAGE COMPRESSOR ---
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
        
        // Konversi ke MB
        let targetSizeMB = parseFloat(sizeVal);
        if (unit === 'KB') {
            targetSizeMB = targetSizeMB / 1024;
        }

        const options = {
            maxSizeMB: targetSizeMB,
            maxWidthOrHeight: 1920,
            useWebWorker: true
        };

        const compressedFile = await imageCompression(file, options);
        
        // Tampilkan Hasil
        resultBox.innerHTML = `
            <div class="text-center">
                <p class="text-sm text-slate-500 mb-2">Original: ${(file.size/1024).toFixed(1)}KB -> <b>${(compressedFile.size/1024).toFixed(1)}KB</b></p>
                <a id="dl-compressed" class="block w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer">
                    Download Hasil
                </a>
            </div>
        `;
        resultBox.classList.remove('hidden');

        // Setup Download Button
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
            
            // Fill white background for PNG -> JPG transparency issue
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

            // Text Style
            const fontSize = Math.floor(img.width / 10);
            ctx.font = `900 ${fontSize}px Impact, sans-serif`;
            ctx.fillStyle = 'white';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = Math.floor(fontSize / 8);
            ctx.textAlign = 'center';

            // Draw Top
            ctx.textBaseline = 'top';
            ctx.strokeText(topText, canvas.width / 2, 10);
            ctx.fillText(topText, canvas.width / 2, 10);

            // Draw Bottom
            ctx.textBaseline = 'bottom';
            ctx.strokeText(bottomText, canvas.width / 2, canvas.height - 10);
            ctx.fillText(bottomText, canvas.width / 2, canvas.height - 10);

            // Download
            canvas.toBlob(blob => {
                downloadBlob(blob, 'meme-silentsuite.png', 'image/png');
            });
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
};

// ==========================================
// FEATURE: UTILITIES
// ==========================================

// --- QR MAKER ---
window.generateQR = function() {
    const text = document.getElementById('qrInput').value;
    const container = document.getElementById('qrResult');
    const hint = document.getElementById('qrHint');
    
    if (!text) return alert("Masukkan teks atau link!");
    
    container.innerHTML = ""; // Clear old QR
    container.classList.remove('hidden');
    hint.classList.remove('hidden');
    
    new QRCode(container, {
        text: text,
        width: 200,
        height: 200,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
};

// --- PASSWORD GENERATOR ---
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
    
    // Feedback visual kecil
    const btn = document.querySelector('button[title="Copy"]');
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check text-green-500"></i>';
    setTimeout(() => btn.innerHTML = original, 1500);
};

// --- UNIT CONVERTER ---
window.updateUnitOptions = function() {
    const cat = document.getElementById('unitCat').value;
    const from = document.getElementById('unitFrom');
    const to = document.getElementById('unitTo');
    
    const options = {
        length: { m: 'Meter', km: 'Kilometer', cm: 'Centimeter', mm: 'Millimeter', ft: 'Feet', in: 'Inch', yd: 'Yard' },
        weight: { kg: 'Kilogram', g: 'Gram', mg: 'Milligram', lb: 'Pound', oz: 'Ounce' },
        temp:   { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }
    };
    
    from.innerHTML = ''; 
    to.innerHTML = '';
    
    Object.entries(options[cat]).forEach(([key, label]) => {
        from.add(new Option(label, key));
        to.add(new Option(label, key));
    });
    
    // Set default different values
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
        // Temperature Conversion Logic
        if (from === to) result = val;
        else if (from === 'c') result = to === 'f' ? (val * 9/5) + 32 : val + 273.15;
        else if (from === 'f') result = to === 'c' ? (val - 32) * 5/9 : (val - 32) * 5/9 + 273.15;
        else if (from === 'k') result = to === 'c' ? val - 273.15 : (val - 273.15) * 9/5 + 32;
    } else {
        // Length & Weight (Base Unit Conversion)
        // Base: Meter (Length), Kilogram (Weight)
        const factors = {
            length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, ft: 0.3048, in: 0.0254, yd: 0.9144 },
            weight: { kg: 1, g: 0.001, mg: 0.000001, lb: 0.453592, oz: 0.0283495 }
        };
        
        const baseValue = val * factors[cat][from];
        result = baseValue / factors[cat][to];
    }

    // Tampilkan hasil (maksimal 6 desimal jika perlu)
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
    
    // Cleanup memory
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 100);
}

function setLoading(btnElement, isLoading, text) {
    if (isLoading) {
        btnElement.dataset.originalText = text; // Simpan teks untuk jaga-jaga
        btnElement.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin-fast"></i> ${text}`;
        btnElement.disabled = true;
        btnElement.classList.add('opacity-75', 'cursor-not-allowed');
    } else {
        btnElement.innerHTML = text;
        btnElement.disabled = false;
        btnElement.classList.remove('opacity-75', 'cursor-not-allowed');
    }
}
