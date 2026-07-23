/**
 * js/ui.js
 * Lógica de renderizado de UI.
 * Recibe datos procesados y actualiza el DOM siguiendo el diseño definido.
 */

const UI = {
    /**
     * Renderiza la lista de mangas en el contenedor proporcionado.
     * @param {HTMLElement} container 
     * @param {Array} mangas 
     */
    renderMangaGrid(container, mangas) {
        if (!container) return;
        
        if (mangas.length === 0) {
            container.innerHTML = `<p class="text-on-surface col-span-3 text-center py-12">No se encontraron mangas.</p>`;
            return;
        }

        container.innerHTML = mangas.map(manga => this.createMangaCardHTML(manga)).join('');
    },

    /**
     * Crea el HTML de una tarjeta de manga según el sistema de diseño.
     * @param {Object} manga 
     * @returns {string}
     */
    createMangaCardHTML(manga) {
        // Obtenemos géneros
        const generos = manga.manga_genres && manga.manga_genres.length > 0 
            ? manga.manga_genres.map(g => g.genre_id).join(', ') // placeholder simple
            : "Manga";

        return `
            <div class="manga-card relative aspect-[3/4.5] overflow-hidden rounded-lg surface_glass cursor-pointer group transition-all duration-300 hover:z-10 hover:scale-[1.03] hover:ring-2 ring-primary kinetic-border" 
                 onclick="window.location.href='detalle.html?id=${manga.id}'">
                <span class="hanko-stamp">${generos.split(',')[0]}</span>
                <img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                     src="${MangaService.getFileUrl('covers', manga.cover_path)}" 
                     alt="${manga.title}">

                <!-- Obi Band -->
                <div class="absolute bottom-0 left-0 w-full bg-[#131313]/90 text-[#e9c400] p-3 pt-6 font-label-bold text-[11px] uppercase tracking-wider text-center" 
                     style="clip-path: polygon(0 25%, 100% 0, 100% 100%, 0% 100%);">
                    ${generos.split(',')[0]} • ${manga.volumes?.length || 0} TOMOS
                </div>

                <div class="overlay absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent flex flex-col justify-end p-6 pb-20 translate-y-12 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 class="text-headline-md text-white leading-none mb-1" style="font-family:'Yuji Syuku',serif;">${manga.title}</h3>
                    <p class="text-primary text-label-bold text-xs mb-4">${manga.author}</p>
                </div>
            </div>
        `;
    },

    /**
     * Renderiza los chips de género en el sidebar.
     * @param {HTMLElement} container 
     * @param {Array} genres 
     */
    renderGenreFilters(container, genres) {
        if (!container) return;

        let html = `
            <a class="hanko-chip cursor-pointer bg-[#C63D2F]/20 text-[#fff6f5] border-[#C63D2F]" onclick="filterByGenre(null)">
                <span class="material-symbols-outlined text-sm">filter_alt_off</span>
                TODO
            </a>
        `;
        html += genres.map(genre => `
            <a class="hanko-chip cursor-pointer" onclick="filterByGenre('${genre.id}')">
                <span class="material-symbols-outlined text-sm">bolt</span>
                ${genre.name}
            </a>
        `).join('');
        container.innerHTML = html;
    },

    /**
     * Muestra un estado de carga.
     * @param {HTMLElement} container 
     */
    showLoading(container) {
        container.innerHTML = `<div class="col-span-3 text-center py-12 text-primary">Cargando...</div>`;
    },

    /**
     * Muestra un mensaje de error.
     * @param {HTMLElement} container 
     * @param {string} message 
     */
    showError(container, message) {
        container.innerHTML = `<div class="col-span-3 text-center py-12 text-secondary-container">${message}</div>`;
    }
};

// Exponer globalmente
window.UI = UI;
