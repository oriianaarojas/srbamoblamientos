// Array de productos (simulando Firebase)
let productos = [];
let carrito = [];
let filtroActual = 'todos';

// Cargar productos al iniciar la pagina
window.onload = function() {
    cargarProductos();
    cargarCarritoDelLocalStorage();
    actualizarContadorCarrito();
};

// Cargar productos desde Firebase
async function cargarProductos() {
    // Si no esta conectado Firebase, usar productos de prueba
    if (typeof db === 'undefined') {
        console.log('Firebase no conectado, usando productos de prueba');
        productos = [
            {
                id: 1,
                nombre: "Sofa Premium 3 Cuerpos",
                precio: 89999,
                imagen: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
                descripcion: "Sofa elegante de 3 cuerpos con tapizado premium",
                categoria: "living",
                detalles: "Dimensiones: 2.20m x 0.90m x 0.85m. Material: Cuero genuino italiano. Incluye garantia de 2 años."
            },
            {
                id: 2,
                nombre: "Mueble de Baño",
                precio: 65000,
                imagen: "https://images.unsplash.com/photo-1604709177225-055f99402ea3?w=400&h=300&fit=crop",
                descripcion: "Mueble hecho de madera y metal",
                categoria: "dormitorio",
                detalles: "Incluye espejo y mesada de granito. Cajones con cierre suave. Resistente a la humedad."
            },
            {
                id: 3,
                nombre: "Cama Matrimonial Luxury",
                precio: 75500,
                imagen: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400&h=300&fit=crop",
                descripcion: "Cama matrimonial con cabecero acolchado",
                categoria: "dormitorio",
                detalles: "Medidas: 1.60m x 2.00m. Incluye 4 cajones de almacenamiento. Cabecero acolchado premium."
            },
            {
                id: 4,
                nombre: "Sillon Relax Amarillo",
                precio: 50000,
                imagen: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop",
                descripcion: "Sillon individual de diseño moderno",
                categoria: "living",
                detalles: "Mecanismo reclinable. Tapizado en tela anti-manchas. Base giratoria 360 grados."
            },
            {
                id: 5,
                nombre: "Escritorio Ejecutivo",
                precio: 45000,
                imagen: "https://images.unsplash.com/photo-1541558869434-2840d308329a?w=400&h=300&fit=crop",
                descripcion: "Escritorio ejecutivo en L",
                categoria: "oficina",
                detalles: "Superficie de trabajo: 1.50m x 1.50m. 3 cajones con cerradura. Incluye pasacables."
            },
            {
                id: 6,
                nombre: "Juego de Sillas x4",
                precio: 28000,
                imagen: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop",
                descripcion: "Set de 4 sillas tapizadas en tela premium",
                categoria: "comedor",
                detalles: "Patas de roble macizo. Tapizado removible y lavable. Respaldo ergonomico."
            }
        ];
        mostrarProductos();
        return;
    }
    
    // Cargar desde Firebase
    try {
        console.log('Cargando productos desde Firebase...');
        const productosRef = db.collection('productos');
        const snapshot = await productosRef.get();
        
        productos = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            productos.push({
                id: data.id || parseInt(doc.id),
                nombre: data.nombre,
                precio: data.precio,
                imagen: data.imagen,
                descripcion: data.descripcion,
                categoria: data.categoria,
                detalles: data.detalles
            });
        });
        
        console.log('Productos cargados:', productos.length);
        mostrarProductos();
    } catch (error) {
        console.log('Error al cargar productos de Firebase:', error);
        // Si falla Firebase, usar productos de prueba
        productos = [
            {
                id: 1,
                nombre: "Sofa Premium 3 Cuerpos",
                precio: 89999,
                imagen: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop",
                descripcion: "Sofa elegante de 3 cuerpos con tapizado premium",
                categoria: "living",
                detalles: "Dimensiones: 2.20m x 0.90m x 0.85m."
            }
        ];
        mostrarProductos();
    }
}

// Mostrar productos en el grid
function mostrarProductos() {
    const grid = document.getElementById('productosGrid');
    grid.innerHTML = '';
    
    let productosFiltrados = filtroActual === 'todos' 
        ? productos 
        : productos.filter(p => p.categoria === filtroActual);
    
    productosFiltrados.forEach(producto => {
        const card = document.createElement('div');
        card.className = 'producto-card';
        card.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}" class="producto-imagen">
            <div class="producto-info">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion}</p>
                <div class="producto-precio">$${producto.precio.toLocaleString('es-AR')}</div>
                <div class="producto-botones">
                    <button class="btn-ver" onclick="verDetalle(${producto.id})">Ver detalle</button>
                    <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id})">Agregar</button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Filtrar productos
function filtrarProductos(categoria) {
    filtroActual = categoria;
    
    // Actualizar botones activos
    const botones = document.querySelectorAll('.filtro-btn');
    botones.forEach(btn => btn.classList.remove('activo'));
    event.target.classList.add('activo');
    
    mostrarProductos();
}

// Ver detalle del producto
function verDetalle(id) {
    const producto = productos.find(p => p.id === id);
    const modal = document.getElementById('modalProducto');
    const detalle = document.getElementById('detalleProducto');
    
    detalle.innerHTML = `
        <img src="${producto.imagen}" alt="${producto.nombre}" class="detalle-imagen">
        <h2>${producto.nombre}</h2>
        <p>${producto.descripcion}</p>
        <p style="margin-top: 15px;">${producto.detalles}</p>
        <div class="producto-precio" style="margin: 20px 0;"">$${producto.precio.toLocaleString('es-AR')}</div>
        <button class="btn-agregar" onclick="agregarAlCarrito(${producto.id}); cerrarModal();">Agregar al carrito</button>
    `;
    
    modal.style.display = 'block';
}

// Cerrar modal
function cerrarModal() {
    document.getElementById('modalProducto').style.display = 'none';
}

// Agregar producto al carrito
function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const itemEnCarrito = carrito.find(item => item.id === id);
    
    if (itemEnCarrito) {
        itemEnCarrito.cantidad++;
    } else {
        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1
        });
    }
    
    guardarCarritoEnLocalStorage();
    actualizarCarrito();
    actualizarContadorCarrito();
    mostrarNotificacion('Producto agregado al carrito');
}

// Actualizar vista del carrito
function actualizarCarrito() {
    const carritoItems = document.getElementById('carritoItems');
    
    if (carrito.length === 0) {
        carritoItems.innerHTML = '<div class="carrito-vacio">Tu carrito esta vacio</div>';
        document.getElementById('subtotal').textContent = '$0';
        document.getElementById('total').textContent = '$0';
        return;
    }
    
    carritoItems.innerHTML = '';
    let subtotal = 0;
    
    carrito.forEach(item => {
        subtotal += item.precio * item.cantidad;
        
        const itemDiv = document.createElement('div');
        itemDiv.className = 'carrito-item';
        itemDiv.innerHTML = `
            <div class="item-info">
                <img src="${item.imagen}" alt="${item.nombre}" class="item-imagen">
                <div class="item-detalles">
                    <h4>${item.nombre}</h4>
                    <div class="item-precio">$${item.precio.toLocaleString('es-AR')}</div>
                </div>
            </div>
            <div class="item-controles">
                <div class="cantidad-controles">
                    <button class="cantidad-btn" onclick="cambiarCantidad(${item.id}, -1)">-</button>
                    <span>${item.cantidad}</span>
                    <button class="cantidad-btn" onclick="cambiarCantidad(${item.id}, 1)">+</button>
                </div>
                <button class="btn-eliminar" onclick="eliminarDelCarrito(${item.id})">Eliminar</button>
            </div>
        `;
        carritoItems.appendChild(itemDiv);
    });
    
    document.getElementById('subtotal').textContent = '$' + subtotal.toLocaleString('es-AR');
    document.getElementById('total').textContent = '$' + subtotal.toLocaleString('es-AR');
}

// Cambiar cantidad de un producto
function cambiarCantidad(id, cambio) {
    const item = carrito.find(item => item.id === id);
    
    if (item) {
        item.cantidad += cambio;
        
        if (item.cantidad <= 0) {
            eliminarDelCarrito(id);
        } else {
            guardarCarritoEnLocalStorage();
            actualizarCarrito();
            actualizarContadorCarrito();
        }
    }
}

// Eliminar producto del carrito
function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarritoEnLocalStorage();
    actualizarCarrito();
    actualizarContadorCarrito();
    mostrarNotificacion('Producto eliminado del carrito');
}

// Actualizar contador del carrito
function actualizarContadorCarrito() {
    const contador = document.getElementById('contadorCarrito');
    const totalItems = carrito.reduce((sum, item) => sum + item.cantidad, 0);
    contador.textContent = totalItems;
}

// Abrir carrito
function abrirCarrito() {
    document.getElementById('carritoSidebar').classList.add('abierto');
    document.getElementById('overlay').classList.add('activo');
    actualizarCarrito();
}

// Cerrar carrito
function cerrarCarrito() {
    document.getElementById('carritoSidebar').classList.remove('abierto');
    document.getElementById('overlay').classList.remove('activo');
}

// Finalizar compra
function finalizarCompra() {
    if (carrito.length === 0) {
        alert('El carrito esta vacio');
        return;
    }
    
    document.getElementById('mensajeExito').style.display = 'block';
    carrito = [];
    guardarCarritoEnLocalStorage();
    actualizarCarrito();
    actualizarContadorCarrito();
    cerrarCarrito();
}

// Cerrar mensaje de exito
function cerrarMensajeExito() {
    document.getElementById('mensajeExito').style.display = 'none';
}

// Mostrar notificacion
function mostrarNotificacion(mensaje) {
    const notif = document.getElementById('notificacion');
    notif.textContent = mensaje;
    notif.classList.add('mostrar');
    
    setTimeout(() => {
        notif.classList.remove('mostrar');
    }, 3000);
}

// Guardar carrito en localStorage
function guardarCarritoEnLocalStorage() {
    localStorage.setItem('carritoSRB', JSON.stringify(carrito));
}

// Cargar carrito desde localStorage
function cargarCarritoDelLocalStorage() {
    const carritoGuardado = localStorage.getItem('carritoSRB');
    if (carritoGuardado) {
        carrito = JSON.parse(carritoGuardado);
    }
}

// Mostrar seccion
function mostrarSeccion(seccion) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(s => s.classList.remove('activa'));
    document.getElementById(seccion).classList.add('activa');
}

// Enviar mensaje de contacto
function enviarMensaje() {
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const mensaje = document.getElementById('mensaje').value;
    
    if (nombre && email && mensaje) {
        alert('Mensaje enviado correctamente. Te contactaremos pronto.');
        document.getElementById('nombre').value = '';
        document.getElementById('email').value = '';
        document.getElementById('mensaje').value = '';
    } else {
        alert('Por favor completa todos los campos');
    }
}

// Iniciar sesion
function iniciarSesion() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (email && password) {
        alert('Bienvenido! Has iniciado sesion correctamente con: ' + email);
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
    } else {
        alert('Por favor completa todos los campos');
    }
}