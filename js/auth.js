/**
 * js/auth.js
 * Gestión de autenticación de administradores mediante Supabase Auth.
 * Implementa el requisito RF09 (Login/Logout/Registro con código).
 */

/**
 * Inicia sesión con email y contraseña.
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: any, error: any}>}
 */
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
}

/**
 * Registra un nuevo administrador validando el código de invitación.
 * Requisito RF09: La validación es del lado del cliente.
 * @param {string} email 
 * @param {string} password 
 * @param {string} inviteCode 
 * @returns {Promise<{data: any, error: any}>}
 */
async function signUp(email, password, inviteCode) {
    // Validación del código de invitación (Cliente)
    if (inviteCode !== SUPABASE_CONFIG.adminInviteCode) {
        return { 
            data: null, 
            error: { message: "Código de autorización inválido" } 
        };
    }

    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
        });
        return { data, error };
    } catch (err) {
        return { data: null, error: err };
    }
}

/**
 * Cierra la sesión activa.
 * @returns {Promise<{error: any}>}
 */
async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        return { error };
    } catch (err) {
        return { error: err };
    }
}

/**
 * Obtiene la sesión actual de forma asíncrona.
 * @returns {Promise<any>}
 */
async function getSession() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
}

/**
 * Verifica si hay un administrador autenticado basándose en la sesión
 * y la lista de correos permitidos en SUPABASE_CONFIG.
 * @returns {Promise<boolean>}
 */
async function isAdmin() {
    const session = await getSession();
    if (!session || !session.user) return false;
    
    const email = session.user.email.toLowerCase();
    return SUPABASE_CONFIG.adminEmails.map(e => e.toLowerCase()).includes(email);
}

/**
 * Suscribe un callback a los cambios de estado de autenticación.
 * @param {Function} callback 
 */
function onAuthStateChange(callback) {
    supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
}

// Exponer funciones globalmente
window.auth = {
    signIn,
    signUp,
    signOut,
    getSession,
    isAdmin,
    onAuthStateChange
};
