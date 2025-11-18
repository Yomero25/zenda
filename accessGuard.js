(function(){
  async function ensureAuth(requiredRoles){
    try{
      if (!window.DataService || !window.DataService.hasSupabase || !window.DataService.hasSupabase()){
        // Sin supabase: permitir solo si no se requieren roles (modo local), sino redirigir a login
        if (Array.isArray(requiredRoles) && requiredRoles.length){
          window.location.href = './login.html';
          return false;
        }
        return true;
      }
      const user = await window.DataService.getCurrentUser();
      if (!user){
        window.location.href = './login.html';
        return false;
      }
      // Si no se piden roles específicos, basta con estar logueado
      if (!requiredRoles || requiredRoles.length === 0) return true;
      const rol = await window.DataService.getUserRole();
      if (!rol || !requiredRoles.includes(rol)){
        // Acceso denegado: redirigir según rol disponible o a login
        const rutas = {
          admin: './cotizaciones-completo.html',
          ventas: './cotizaciones-completo.html',
          despacho: './modulo-despacho.html',
          instalaciones: './instalaciones_modulo.html',
          almacen: './administrar-almacen.html',
          precios: './administrar-precios.html',
          soporte: './modulo-soporte.html',
        };
        window.location.href = rutas[rol] || './login.html';
        return false;
      }
      return true;
    }catch(e){
      console.warn('Guard error:', e);
      window.location.href = './login.html';
      return false;
    }
  }
  window.accessGuard = { ensureAuth };
})();


