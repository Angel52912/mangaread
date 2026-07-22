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
        };

        if (grid) {
            UI.showLoading(grid);
            try {
                currentMangas = await MangaService.getMangas();
                filterAndSort(currentMangas);
            } catch (error) {
                UI.showError(grid, "Error al cargar los mangas.");
            }
        }
        
        if (genreFilters) {
            try {
                const genres = await MangaService.getGenres();
                UI.renderGenreFilters(genreFilters, genres);
                
                window.filterByGenre = (genreId) => {
                    document.querySelectorAll('.hanko-chip').forEach(el => el.classList.remove('hanko-chip-active'));
                    event.currentTarget.classList.add('hanko-chip-active');
                    filterAndSort(currentMangas, genreId, sortSelect?.value);
                };
            } catch (error) {
                console.error("Error al cargar géneros:", error);
            }
        }

        if (searchButton && searchInput) {
            searchButton.addEventListener('click', async () => {
                const query = searchInput.value;
                if (!query) return filterAndSort(currentMangas, null, sortSelect?.value);
                
                UI.showLoading(grid);
                try {
                    const results = await MangaService.searchMangas(query);
                    currentMangas = results;
                    filterAndSort(currentMangas, null, sortSelect?.value);
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

                try {
                    const coverPath = await MangaService.uploadFile('covers', coverInput.files[0]);
                    mangaData.cover_path = coverPath;

                    await MangaService.createManga(mangaData);
                    alert("Manga creado exitosamente");
                    window.location.reload();
                } catch (error) {
                    console.error(error);
                    alert("Error al guardar el manga: " + error.message);
                }
            });
        }
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
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert("Error al guardar el tomo: " + error.message);
            }
        });
    },

    /**
     * Lógica para admin.html (Dashboard)
     */
    async initAdminDashboard() {
        const tableBody = document.getElementById('mangaTableBody');
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
                                <button class="p-2 hover:bg-primary-container text-primary transition-colors"><span class="material-symbols-outlined text-base">edit</span></button>
                                <button class="p-2 hover:bg-error-container text-error transition-colors delete-manga-btn" data-id="${manga.id}"><span class="material-symbols-outlined text-base">delete</span></button>
                            </div>
                        </td>
                    </tr>
                `).join('');

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
            document.getElementById('mangaDirection').innerText = `Sentido de lectura: ${manga.direction.toUpperCase()}`;
            document.getElementById('mangaCover').src = MangaService.getFileUrl('covers', manga.cover_path);
            
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
            const pdfUrl = MangaService.getFileUrl('pdfs', `volumes/${volumeId}.pdf`); 
            await Reader.init(pdfUrl, bookContainer, volumeId);
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
    } else if (path.includes('modal_agregar_tomo.html')) {
        App.initVolumeModal();
    } else if (path.includes('admin.html')) {
        App.initAdminDashboard();
    } else if (path.includes('detalle.html')) {
        App.initMangaDetail();
    } else if (path.includes('lector.html')) {
        App.initReader();
    }
});
