/**
 * js/reader.js
 * Lógica para visualizar PDFs y gestionar el progreso de lectura localmente.
 * Utiliza PDF.js para renderizar y StPageFlip para el efecto 3D.
 */

const Reader = {
    // Proceso actual
    progressKey: (volumeId) => `mangaread:progress:${volumeId}`,
    pageFlip: null,

    /**
     * Guarda el progreso en localStorage.
     */
    saveProgress(volumeId, page) {
        const progress = {
            page,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem(this.progressKey(volumeId), JSON.stringify(progress));
    },

    /**
     * Lee el progreso desde localStorage.
     */
    getProgress(volumeId) {
        const saved = localStorage.getItem(this.progressKey(volumeId));
        return saved ? JSON.parse(saved) : { page: 0 }; // StPageFlip usa índice 0
    },

    /**
     * Inicializa el lector PDF con efecto 3D.
     * @param {string} pdfUrl 
     * @param {HTMLElement} container 
     * @param {string} volumeId 
     */
    async init(pdfUrl, container, volumeId) {
        if (typeof pdfjsLib === 'undefined' || typeof StPageFlip === 'undefined') {
            console.error("Librerías necesarias no cargadas");
            return;
        }

        // Configurar StPageFlip
        this.pageFlip = new StPageFlip(container, {
            width: 400,
            height: 600,
            showCover: true,
            mobileScrollSupport: true
        });

        // Cargar documento
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        const totalPages = pdf.numPages;

        // Crear páginas y añadirlas
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            const canvas = document.createElement('canvas');
            pageDiv.appendChild(canvas);
            pages.push({ pageDiv, canvas, pageNumber: i });
        }
        
        this.pageFlip.loadFromHTML(pages.map(p => p.pageDiv));

        // Renderizar páginas en background
        for (const p of pages) {
            await this.renderPageToCanvas(pdf, p.pageNumber, p.canvas);
        }

        // Ir a la página guardada
        const savedPage = this.getProgress(volumeId).page;
        this.pageFlip.flip(savedPage);

        // Evento para guardar progreso
        this.pageFlip.on('flip', (e) => {
            this.saveProgress(volumeId, e.data);
        });
    },

    async renderPageToCanvas(pdf, pageNumber, canvas) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.0 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport }).promise;
    }
};

// Exponer globalmente
window.Reader = Reader;
