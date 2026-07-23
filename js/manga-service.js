/**
 * js/manga-service.js
 * Capa de datos: Todas las interacciones con Supabase (DB y Storage).
 * No toca el DOM, solo devuelve datos o lanza errores.
 */

const MangaService = {
    // ============================================================
    // MANGAS
    // ============================================================

    /**
     * Obtiene la lista de todos los mangas con sus géneros.
     * @returns {Promise<Array>}
     */
    async getMangas() {
        const { data, error } = await supabaseClient
            .from('mangas')
            .select('*, manga_genres(genre_id)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    /**
     * Obtiene un manga por su ID, incluyendo sus géneros y tomos.
     * @param {string} id 
     * @returns {Promise<Object>}
     */
    async getMangaById(id) {
        const { data, error } = await supabaseClient
            .from('mangas')
            .select('*, manga_genres(genres(name, slug)), volumes(*)')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    /**
     * Crea un nuevo manga.
     * @param {Object} mangaData 
     * @param {Array<string>} genreIds 
     * @returns {Promise<Object>}
     */
    async createManga(mangaData, genreIds = []) {
        // Normalización requerida
        const payload = {
            ...mangaData,
            normalized_title: normalizeText(mangaData.title)
        };

        const { data, error } = await supabaseClient
            .from('mangas')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        // Insertar géneros si existen
        if (genreIds.length > 0) {
            const genresPayload = genreIds.map(genreId => ({
                manga_id: data.id,
                genre_id: genreId
            }));
            const { error: gError } = await supabaseClient
                .from('manga_genres')
                .insert(genresPayload);
            if (gError) throw gError;
        }

        return data;
    },

    /**
     * Actualiza un manga existente.
     * @param {string} id 
     * @param {Object} mangaData 
     * @param {Array<string>} genreIds 
     * @returns {Promise<Object>}
     */
    async updateManga(id, mangaData, genreIds = []) {
        const payload = { ...mangaData };
        if (mangaData.title) {
            payload.normalized_title = normalizeText(mangaData.title);
        }

        const { data, error } = await supabaseClient
            .from('mangas')
            .update(payload)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Actualizar géneros (borrar y re-insertar)
        if (genreIds.length > 0) {
            await supabaseClient.from('manga_genres').delete().eq('manga_id', id);
            const genresPayload = genreIds.map(genreId => ({
                manga_id: id,
                genre_id: genreId
            }));
            const { error: gError } = await supabaseClient
                .from('manga_genres')
                .insert(genresPayload);
            if (gError) throw gError;
        }

        return data;
    },

    /**
     * Elimina un manga.
     * @param {string} id 
     */
    async deleteManga(id) {
        const { error } = await supabaseClient
            .from('mangas')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    /**
     * Incrementa el contador de vistas de un manga mediante RPC.
     * @param {string} mangaId 
     */
    async incrementViewCount(mangaId) {
        const { error } = await supabaseClient
            .rpc('increment_manga_view', { manga_id_param: mangaId });
        if (error) console.error("Error incrementing view count:", error);
    },

    /**
     * Realiza una búsqueda avanzada (full-text search) mediante RPC.
     * @param {string} query 
     * @returns {Promise<Array>}
     */
    async searchMangas(query) {
        const { data, error } = await supabaseClient
            .rpc('search_mangas', { query });
        if (error) throw error;
        return data;
    },

    // ============================================================
    // VOLUMES (TOMOS)
    // ============================================================

    /**
     * Obtiene los tomos de un manga.
     * @param {string} mangaId 
     * @returns {Promise<Array>}
     */
    async getVolumes(mangaId) {
        const { data, error } = await supabaseClient
            .from('volumes')
            .select('*, chapter_marks(*)')
            .eq('manga_id', mangaId)
            .order('created_at', { ascending: true });
        if (error) throw error;
        return data;
    },

    /**
     * Crea un nuevo tomo.
     * @param {Object} volumeData 
     * @param {Array<Object>} chapterMarks 
     * @returns {Promise<Object>}
     */
    async createVolume(volumeData, chapterMarks = []) {
        const payload = {
            ...volumeData,
            normalized_title: normalizeText(volumeData.title),
            normalized_pdf_name: normalizeText(volumeData.pdf_name)
        };

        const { data, error } = await supabaseClient
            .from('volumes')
            .insert(payload)
            .select()
            .single();

        if (error) throw error;

        if (chapterMarks.length > 0) {
            const marksPayload = chapterMarks.map(mark => ({
                volume_id: data.id,
                chapter: mark.chapter,
                page: mark.page
            }));
            const { error: mError } = await supabaseClient
                .from('chapter_marks')
                .insert(marksPayload);
            if (mError) throw mError;
        }

        return data;
    },

    async updateVolume(id, volumeData, chapterMarks = []) {
        const payload = {
            title: volumeData.title,
            chapters_label: volumeData.chapters_label,
            normalized_title: normalizeText(volumeData.title)
        };
        if (volumeData.pdf_path) payload.pdf_path = volumeData.pdf_path;
        if (volumeData.pdf_name) {
            payload.pdf_name = volumeData.pdf_name;
            payload.normalized_pdf_name = normalizeText(volumeData.pdf_name);
        }

        const { error } = await supabaseClient
            .from('volumes')
            .update(payload)
            .eq('id', id);
        if (error) throw error;

        // Actualizar marcas de capítulos
        await supabaseClient.from('chapter_marks').delete().eq('volume_id', id);
        if (chapterMarks.length > 0) {
            const marksPayload = chapterMarks.map(mark => ({
                volume_id: id,
                chapter: mark.chapter,
                page: mark.page
            }));
            const { error: mError } = await supabaseClient
                .from('chapter_marks')
                .insert(marksPayload);
            if (mError) throw mError;
        }
    },

    // ============================================================
    // GÉNEROS
    // ============================================================

    async getGenres() {
        const { data, error } = await supabaseClient
            .from('genres')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return data;
    },

    async addGenre(name) {
        const slug = normalizeText(name).replace(/\s+/g, '-');
        const { data, error } = await supabaseClient
            .from('genres')
            .insert({ name, slug })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async deleteGenre(id) {
        const { error } = await supabaseClient
            .from('genres')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ============================================================
    // STORAGE
    // ============================================================

    /**
     * Sube un archivo al bucket correspondiente.
     * @param {string} bucket - 'covers' o 'pdfs'
     * @param {File} file 
     * @returns {Promise<string>} La ruta (path) del archivo subido.
     */
    async uploadFile(bucket, file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { data, error } = await supabaseClient.storage
            .from(bucket)
            .upload(filePath, file);

        if (error) throw error;
        return data.path;
    },

    /**
     * Obtiene la URL pública de un archivo.
     * @param {string} bucket 
     * @param {string} path 
     * @returns {string}
     */
    getFileUrl(bucket, path) {
        const { data } = supabaseClient.storage
            .from(bucket)
            .getPublicUrl(path);
        return data.publicUrl;
    },

    // ============================================================
    // ESTADÍSTICAS (Solo Admin)
    // ============================================================

    async getAdminStats() {
        const { data, error } = await supabaseClient
            .from('admin_stats')
            .select('*')
            .single();
        if (error) throw error;
        return data;
    },

    async getAdminTopMangas() {
        const { data, error } = await supabaseClient
            .from('admin_top_mangas')
            .select('*');
        if (error) throw error;
        return data;
    }
};

// Exponer globalmente
window.MangaService = MangaService;
