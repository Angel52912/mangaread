/**
 * js/app.js
 * Orquestador principal de la aplicación.
 * Conecta los eventos del DOM con los servicios y la UI.
 */

const App = {
    /**
     * Inicialización común para todas las páginas.
     */
    async init() {
        console.log("MangaReadV1 App Initializing...");
    },

    /**
     * Lógica para index.html (Biblioteca)
     */
    async initLibrary() {
        const grid = document.getElementById('mangaGrid');
        const genreFilters = document.getElementById('genreFilters');
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const sortSelect = document.getElementById('sortSelect'); 
        
        let currentMangas = [];
        let allGenres = [];

        const filterAndSort = (mangas, genreId = null, sortBy = 'recientes') => {
            let filtered = mangas;
            if (genreId) {
                filtered = mangas.filter(m => m.manga_genres.some(g => g.genre_id === genreId));
            }
            if (sortBy === 'alfabetico') {
                filtered.sort((a, b) => a.title.localeCompare(b.title));
            } else {
                filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            }
            UI.renderMangaGrid(grid, filtered);
            
            // UI update for active chip
            document.querySelectorAll('.hanko-chip').forEach(el => el.classList.remove('hanko-chip-active', 'bg-[#C63D2F]', 'text-[#fff6f5]'));
            if (genreId) {
                const activeChip = Array.from(document.querySelectorAll('.hanko-chip')).find(el => el.getAttribute('onclick')?.includes(genreId));
                activeChip?.classList.add('hanko-chip-active', 'bg-[#C63D2F]', 'text-[#fff6f5]');
            } else {
                document.querySelector('[onclick="filterByGenre(null)"]')?.classList.add('hanko-chip-active', 'bg-[#C63D2F]', 'text-[#fff6f5]');
            }
        };

        const urlParams = new URLSearchParams(window.location.search);
        const genreSlug = urlParams.get('genre');

        if (grid) UI.showLoading(grid);

        try {
            // Load all necessary data
            [currentMangas, allGenres] = await Promise.all([
                MangaService.getMangas(),
                MangaService.getGenres()
            ]);

            // Handle initial filter
            let initialGenreId = null;
            if (genreSlug) {
                const genre = allGenres.find(g => g.slug === genreSlug);
                if (genre) initialGenreId = genre.id;
            }

            // Render
            if (genreFilters) UI.renderGenreFilters(genreFilters, allGenres);
            filterAndSort(currentMangas, initialGenreId, sortSelect?.value);
            
            window.filterByGenre = (genreId) => {
                filterAndSort(currentMangas, genreId, sortSelect?.value);
            };

        } catch (error) {
            console.error(error);
            if (grid) UI.showError(grid, "Error al cargar la biblioteca.");
        }

        if (searchButton && searchInput) {
            searchButton.addEventListener('click', async () => {
                const query = searchInput.value;
                const activeGenreId = new URLSearchParams(window.location.search).get('genre') ? allGenres.find(g => g.slug === new URLSearchParams(window.location.search).get('genre'))?.id : null;
                
                UI.showLoading(grid);
                try {
                    const results = await MangaService.searchMangas(query);
                    currentMangas = results;
                    // Retain genre filter
                    filterAndSort(currentMangas, activeGenreId, sortSelect?.value);
                } catch (error) {
                    UI.showError(grid, "Error en la búsqueda.");
                }
            });
        }
    },

    /**
     * Lógica para admin_login_1.html
     */
    async initAdminLogin() {
        const form = document.getElementById('loginForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = e.target.email.value;
            const password = e.target.password.value;
            
            const { error } = await window.auth.signIn(email, password);
            if (error) {
                alert("Error: " + error.message);
            } else {
                window.location.href = 'admin.html';
            }
        });
    },

    /**
     * Lógica para admin_login_2.html (Registro Admin - RF09)
     */
    async initAdminRegister() {
        const form = document.getElementById('registerForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-pass').value;
            const confirmPassword = document.getElementById('reg-pass-confirm').value;
            const inviteCode = document.getElementById('reg-invite-code').value;

            if (password !== confirmPassword) {
                alert("Las contraseñas no coinciden");
                return;
            }

            // RF09: Validación de código en cliente antes de llamar a Supabase
            const { data, error } = await window.auth.signUp(email, password, inviteCode);
            
            if (error) {
                alert("Error: " + error.message);
            } else {
                alert("Registro exitoso. Se ha enviado un correo de confirmación.");
                window.location.href = 'admin_login_1.html';
            }
        });
    },

    /**
     * Lógica para modal_agregar_manga.html
     */
    async initAdminModal() {
        const form = document.getElementById('mangaForm');
        const saveBtn = document.getElementById('saveMangaBtn');
        const coverInput = document.getElementById('cover-upload');
        const coverName = document.getElementById('coverName');
        const genreContainer = document.getElementById('genreCheckboxes');

        // Cargar géneros
        try {
            const genres = await MangaService.getGenres();
            genreContainer.innerHTML = genres.map(g => `
                <label class="flex items-center gap-2 cursor-pointer text-xs font-label-bold uppercase">
                    <input type="checkbox" name="genres" value="${g.id}" class="accent-primary">
                    ${g.name}
                </label>
            `).join('');
        } catch(e) { console.error(e); }

        if (coverInput) {
            coverInput.addEventListener('change', (e) => {
                coverName.innerText = e.target.files[0]?.name || "Seleccionar archivo...";
            });
        }

        if (saveBtn && form) {
            saveBtn.addEventListener('click', async () => {
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }

                const mangaData = {
                    title: document.getElementById('mangaTitle').value,
                    author: document.getElementById('mangaAuthor').value,
                    synopsis: document.getElementById('mangaSynopsis').value,
                    direction: document.getElementById('mangaDirection').value
                };

                const selectedGenres = Array.from(document.querySelectorAll('input[name="genres"]:checked'))
                                           .map(cb => cb.value);

                try {
                    if (!coverInput.files || coverInput.files.length === 0) {
                        alert("Por favor selecciona una portada.");
                        return;
                    }

                    const coverPath = await MangaService.uploadFile('covers', coverInput.files[0]);
                    mangaData.cover_path = coverPath;

                    await MangaService.createManga(mangaData, selectedGenres);
                    alert("Manga creado exitosamente");
                    window.opener.location.reload();
                    window.close();
                } catch (error) {
                    console.error(error);
                    alert("Error al guardar el manga: " + error.message);
                }
            });
        }
    },

    /**
     * Lógica para modal_editar_manga.html
     */
    async initEditMangaModal() {
        const form = document.getElementById('editMangaForm');
        const saveBtn = document.getElementById('saveEditMangaBtn');
        const coverInput = document.getElementById('edit-cover-upload');
        const coverName = document.getElementById('editCoverName');
        const genreContainer = document.getElementById('editGenreCheckboxes');

        const urlParams = new URLSearchParams(window.location.search);
        const mangaId = urlParams.get('id');
        if (!mangaId) return window.close();

        // Cargar géneros y datos actuales
        const [manga, allGenres] = await Promise.all([
            MangaService.getMangaById(mangaId),
            MangaService.getGenres()
        ]);

        const currentGenreIds = manga.manga_genres.map(g => g.genre_id);

        genreContainer.innerHTML = allGenres.map(g => `
            <label class="flex items-center gap-2 cursor-pointer text-xs font-label-bold uppercase">
                <input type="checkbox" name="genres" value="${g.id}" class="accent-primary" ${currentGenreIds.includes(g.id) ? 'checked' : ''}>
                ${g.name}
            </label>
        `).join('');

        document.getElementById('mangaId').value = manga.id;
        document.getElementById('editTitle').value = manga.title;
        document.getElementById('editAuthor').value = manga.author;
        document.getElementById('editSynopsis').value = manga.synopsis;
        document.getElementById('editDirection').value = manga.direction;

        if (coverInput) {
            coverInput.addEventListener('change', (e) => {
                coverName.innerText = e.target.files[0]?.name || "Mantener actual...";
            });
        }

        saveBtn.addEventListener('click', async () => {
            if (!form.checkValidity()) return form.reportValidity();

            const mangaData = {
                title: document.getElementById('editTitle').value,
                author: document.getElementById('editAuthor').value,
                synopsis: document.getElementById('editSynopsis').value,
                direction: document.getElementById('editDirection').value
            };

            const selectedGenres = Array.from(document.querySelectorAll('input[name="genres"]:checked'))
                                           .map(cb => cb.value);

            try {
                if (coverInput.files[0]) {
                    mangaData.cover_path = await MangaService.uploadFile('covers', coverInput.files[0]);
                }

                await MangaService.updateManga(mangaId, mangaData, selectedGenres);
                alert("Cambios guardados");
                window.opener.location.reload();
                window.close();
            } catch (error) {
                alert("Error: " + error.message);
            }
        });
    },

    /**
     * Lógica para modal_agregar_tomo.html
     */
    async initVolumeModal() {
        const form = document.getElementById('volumeForm');
        const saveBtn = document.getElementById('saveVolumeBtn');
        const addMarkBtn = document.getElementById('addMarkBtn');
        const marksContainer = document.getElementById('chapterMarksContainer');
        const pdfInput = document.getElementById('pdf-upload');
        const pdfName = document.getElementById('pdfName');

        const urlParams = new URLSearchParams(window.location.search);
        const mangaIdFromUrl = urlParams.get('mangaId');
        if (mangaIdFromUrl && document.getElementById('mangaId')) {
            document.getElementById('mangaId').value = mangaIdFromUrl;
        }

        if (pdfInput) {
            pdfInput.addEventListener('change', (e) => {
                pdfName.innerText = e.target.files[0]?.name || "ARRASTRA TU ARCHIVO AQUÍ O HAZ CLIC";
            });
        }

        addMarkBtn.addEventListener('click', () => {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-4 bg-surface-container-low p-3 border border-white/5 mark-row';
            row.innerHTML = `
                <div class="flex-1 grid grid-cols-2 gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-primary font-label-bold">CAP</span>
                        <input class="mark-cap w-full bg-white/5 border-b border-primary/40 py-1 px-2 text-on-surface font-label-bold" type="number" min="1" required/>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-primary font-label-bold">PÁG</span>
                        <input class="mark-page w-full bg-white/5 border-b border-primary/40 py-1 px-2 text-on-surface font-label-bold" type="number" min="1" required/>
                    </div>
                </div>
                <button type="button" class="text-on-surface-variant hover:text-error transition-colors delete-mark-btn">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            row.querySelector('.delete-mark-btn').addEventListener('click', () => row.remove());
            marksContainer.appendChild(row);
        });

        saveBtn.addEventListener('click', async () => {
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const mangaId = document.getElementById('mangaId').value;
            const volumeData = {
                manga_id: mangaId,
                title: document.getElementById('volumeTitle').value,
                chapters_label: document.getElementById('volumeChaptersLabel').value,
                pdf_name: pdfInput.files[0].name
            };

            const chapterMarks = Array.from(document.querySelectorAll('.mark-row')).map(row => ({
                chapter: parseInt(row.querySelector('.mark-cap').value),
                page: parseInt(row.querySelector('.mark-page').value)
            }));

            try {
                const pdfPath = await MangaService.uploadFile('pdfs', pdfInput.files[0]);
                volumeData.pdf_path = pdfPath;

                await MangaService.createVolume(volumeData, chapterMarks);
                alert("Tomo creado exitosamente");
                window.opener.location.reload();
                window.close();
            } catch (error) {
                console.error(error);
                alert("Error al guardar el tomo: " + error.message);
            }
        });
    },

    /**
     * Lógica para modal_editar_tomo.html
     */
    async initEditVolumeModal() {
        const form = document.getElementById('editVolumeForm');
        const saveBtn = document.getElementById('saveEditVolumeBtn');
        const addMarkBtn = document.getElementById('addMarkBtn');
        const marksContainer = document.getElementById('chapterMarksContainer');
        const pdfInput = document.getElementById('edit-pdf-upload');
        const pdfName = document.getElementById('editPdfName');

        const urlParams = new URLSearchParams(window.location.search);
        const volumeId = urlParams.get('id');
        if (!volumeId) return window.close();

        // Cargar datos actuales
        const { data: volume, error } = await supabaseClient
            .from('volumes')
            .select('*, chapter_marks(*)')
            .eq('id', volumeId)
            .single();

        if (error) { alert("Error cargando tomo"); return window.close(); }

        document.getElementById('volumeId').value = volume.id;
        document.getElementById('editVolumeTitle').value = volume.title;
        document.getElementById('editVolumeChaptersLabel').value = volume.chapters_label;

        // Cargar marcas existentes
        function addMarkRow(chapter = '', page = '') {
            const row = document.createElement('div');
            row.className = 'flex items-center gap-4 bg-surface-container-low p-3 border border-white/5 mark-row';
            row.innerHTML = `
                <div class="flex-1 grid grid-cols-2 gap-4">
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-primary font-label-bold">CAP</span>
                        <input class="mark-cap w-full bg-white/5 border-b border-primary/40 py-1 px-2 text-on-surface font-label-bold" type="number" value="${chapter}" required/>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-xs text-primary font-label-bold">PÁG</span>
                        <input class="mark-page w-full bg-white/5 border-b border-primary/40 py-1 px-2 text-on-surface font-label-bold" type="number" value="${page}" required/>
                    </div>
                </div>
                <button type="button" class="text-on-surface-variant hover:text-error transition-colors delete-mark-btn">
                    <span class="material-symbols-outlined">delete</span>
                </button>
            `;
            row.querySelector('.delete-mark-btn').addEventListener('click', () => row.remove());
            marksContainer.appendChild(row);
        }

        volume.chapter_marks.forEach(mark => addMarkRow(mark.chapter, mark.page));
        addMarkBtn.addEventListener('click', () => addMarkRow());

        if (pdfInput) {
            pdfInput.addEventListener('change', (e) => {
                pdfName.innerText = e.target.files[0]?.name || "Mantener archivo actual...";
            });
        }

        saveBtn.addEventListener('click', async () => {
            if (!form.checkValidity()) return form.reportValidity();

            const volumeData = {
                title: document.getElementById('editVolumeTitle').value,
                chapters_label: document.getElementById('editVolumeChaptersLabel').value
            };

            const chapterMarks = Array.from(document.querySelectorAll('.mark-row')).map(row => ({
                chapter: parseInt(row.querySelector('.mark-cap').value),
                page: parseInt(row.querySelector('.mark-page').value)
            }));

            try {
                if (pdfInput.files[0]) {
                    volumeData.pdf_path = await MangaService.uploadFile('pdfs', pdfInput.files[0]);
                    volumeData.pdf_name = pdfInput.files[0].name;
                }

                await MangaService.updateVolume(volumeId, volumeData, chapterMarks);
                alert("Tomo actualizado exitosamente");
                window.opener.location.reload();
                window.close();
            } catch (error) {
                console.error(error);
                alert("Error al guardar: " + error.message);
            }
        });
    },

    /**
     * Lógica para admin_genres.html
     */
    async initGenreManagement() {
        const form = document.getElementById('genreForm');
        const list = document.getElementById('genresList');

        const loadGenres = async () => {
            const genres = await MangaService.getGenres();
            list.innerHTML = genres.map(g => `
                <div class="hanko-chip flex items-center justify-between gap-2">
                    ${g.name}
                    <button onclick="App.deleteGenre('${g.id}')" class="text-error hover:text-white">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `).join('');
        };

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('genreName').value;
            await MangaService.addGenre(name);
            document.getElementById('genreName').value = '';
            loadGenres();
        });

        App.deleteGenre = async (id) => {
            if(confirm('¿Seguro?')) {
                await MangaService.deleteGenre(id);
                loadGenres();
            }
        };

        loadGenres();
    },

    /**
     * Lógica para admin.html (Dashboard)
     */
    async initAdminDashboard() {
        const tableBody = document.getElementById('mangaTableBody');
        const logoutBtn = document.getElementById('logoutBtn');
        const addMangaBtn = document.getElementById('addMangaBtn');

        // Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await window.auth.signOut();
                window.location.href = 'admin_login_1.html';
            });
        }

        // Abrir Modal
        if (addMangaBtn) {
            addMangaBtn.addEventListener('click', () => {
                window.open('modal_agregar_manga.html', '_blank', 'width=800,height=600');
            });
        }

        if (!tableBody) return;

        const loadMangas = async () => {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Cargando...</td></tr>';
            try {
                const mangas = await MangaService.getMangas();
                tableBody.innerHTML = mangas.map(manga => `
                    <tr class="group border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td class="py-4 px-2">
                            <div class="w-12 h-16 bg-surface-container kinetic-border overflow-hidden">
                                <img class="w-full h-full object-cover" src="${MangaService.getFileUrl('covers', manga.cover_path)}" alt="${manga.title}">
                            </div>
                        </td>
                        <td class="py-4 px-2 font-bold group-hover:text-primary transition-colors">${manga.title}</td>
                        <td class="py-4 px-2 text-on-surface-variant">${manga.author}</td>
                        <td class="py-4 px-2 text-right">
                            <div class="flex justify-end gap-2">
                                <button class="p-2 hover:bg-primary-container text-primary transition-colors edit-manga-btn" data-id="${manga.id}" title="Editar"><span class="material-symbols-outlined text-base">edit</span></button>
                                <button class="p-2 hover:bg-primary-container text-primary transition-colors add-volume-btn" data-id="${manga.id}" title="Agregar Tomo"><span class="material-symbols-outlined text-base">library_add</span></button>
                                <button class="p-2 hover:bg-error-container text-error transition-colors delete-manga-btn" data-id="${manga.id}"><span class="material-symbols-outlined text-base">delete</span></button>
                            </div>
                        </td>
                    </tr>
                `).join('');

                // Conectar eventos
                document.querySelectorAll('.edit-manga-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        window.open(`modal_editar_manga.html?id=${btn.dataset.id}`, '_blank', 'width=800,height=600');
                    });
                });
                document.querySelectorAll('.add-volume-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        window.open(`modal_agregar_tomo.html?mangaId=${btn.dataset.id}`, '_blank', 'width=800,height=600');
                    });
                });
                document.querySelectorAll('.delete-manga-btn').forEach(btn => {
                    btn.addEventListener('click', async () => {
                        if (confirm('¿Estás seguro de eliminar este manga?')) {
                            await MangaService.deleteManga(btn.dataset.id);
                            loadMangas();
                        }
                    });
                });
            } catch (error) {
                tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-error">Error al cargar mangas.</td></tr>';
            }
        };

        loadMangas();
    },

    /**
     * Lógica para detalle.html (Ficha del Manga)
     */
    async initMangaDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const mangaId = urlParams.get('id');
        
        if (!mangaId) {
            window.location.href = 'index.html';
            return;
        }

        try {
            const manga = await MangaService.getMangaById(mangaId);
            
            document.getElementById('mangaTitle').innerText = manga.title;
            document.getElementById('mangaAuthor').innerText = manga.author;
            document.getElementById('mangaSynopsis').innerText = manga.synopsis;
            document.getElementById('mangaDirection').innerText = manga.direction.toUpperCase();
            document.getElementById('mangaCover').src = MangaService.getFileUrl('covers', manga.cover_path);
            
            // Render Genres
            const genresContainer = document.getElementById('mangaGenres');
            if (genresContainer && manga.manga_genres) {
                genresContainer.innerHTML = manga.manga_genres.map(g => `
                    <a href="index.html?genre=${g.genres.slug}" class="font-label-bold text-label-bold text-primary border border-primary px-3 py-1 uppercase text-[12px] hanko-chip no-underline">
                        ${g.genres.name}
                    </a>
                `).join('');
            }
            
            const volumesGrid = document.getElementById('volumesGrid');
            volumesGrid.innerHTML = manga.volumes.map(vol => `
                <div class="surface-container-low p-panel-gap border-l-4 border-primary group hover:bg-surface-container-high transition-colors">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <h3 class="font-label-bold text-label-bold text-primary uppercase">${vol.title}</h3>
                            <p class="text-on-surface-variant text-[12px]">${vol.chapters_label}</p>
                        </div>
                        <span class="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">auto_stories</span>
                    </div>
                    <a href="lector.html?volumeId=${vol.id}" class="block w-full bg-surface-variant text-center text-on-surface font-label-bold text-label-bold py-3 uppercase hover:bg-primary hover:text-background transition-all">
                        Leer Tomo
                    </a>
                </div>
            `).join('');

        } catch (error) {
            console.error(error);
            document.getElementById('mangaDetail').innerHTML = '<p class="text-error text-center py-12">Error al cargar el manga.</p>';
        }
    },

    /**
     * Lógica para lector.html
     */
    async initReader() {
        const urlParams = new URLSearchParams(window.location.search);
        const volumeId = urlParams.get('volumeId');
        const bookContainer = document.getElementById('book');
        
        if (!volumeId || !bookContainer) return;

        try {
            const { data: volume, error: vError } = await supabaseClient
                .from('volumes')
                .select('*, mangas(title), chapter_marks(*)')
                .eq('id', volumeId)
                .single();

            if (vError) throw vError;

            document.getElementById('readerMangaTitle').innerText = volume.mangas.title;
            document.getElementById('readerVolumeTitle').innerText = volume.title;

            const chaptersList = document.getElementById('chaptersList');
            if (chaptersList && volume.chapter_marks) {
                chaptersList.innerHTML = volume.chapter_marks.map(mark => `
                    <li class="p-2 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/30 pl-3 transition-all cursor-pointer border-l-2 border-transparent hover:border-primary" 
                        onclick="Reader.pageFlip.flip(${mark.page - 1})">
                        Capítulo ${mark.chapter} (Pág. ${mark.page})
                    </li>
                `).join('');
            }

            const pdfUrl = MangaService.getFileUrl('pdfs', volume.pdf_path); 
            await Reader.init(pdfUrl, bookContainer, volumeId);

            document.getElementById('prevBtn')?.addEventListener('click', () => Reader.pageFlip.flipPrev());
            document.getElementById('nextBtn')?.addEventListener('click', () => Reader.pageFlip.flipNext());

            Reader.pageFlip.on('flip', (e) => {
                document.getElementById('currentPage').innerText = e.data + 1;
            });
            document.getElementById('totalPages').innerText = Reader.pageFlip.getPageCount();

        } catch (error) {
            console.error("Error al cargar el lector:", error);
        }
    }
};

// Inicialización global al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
    App.init();

    const path = window.location.pathname;
    if (path.includes('index.html') || path === '/') {
        App.initLibrary();
    } else if (path.includes('admin_login_1.html')) {
        App.initAdminLogin();
    } else if (path.includes('admin_login_2.html')) {
        App.initAdminRegister();
    } else if (path.includes('modal_agregar_manga.html')) {
        App.initAdminModal();
    } else if (path.includes('modal_editar_manga.html')) {
        App.initEditMangaModal();
    } else if (path.includes('modal_agregar_tomo.html')) {
        App.initVolumeModal();
    } else if (path.includes('modal_editar_tomo.html')) {
        App.initEditVolumeModal();
    } else if (path.includes('admin_genres.html')) {
        App.initGenreManagement();
    } else if (path.includes('admin.html')) {
        App.initAdminDashboard();
    } else if (path.includes('detalle.html')) {
        App.initMangaDetail();
    } else if (path.includes('lector.html')) {
        App.initReader();
    }
});
