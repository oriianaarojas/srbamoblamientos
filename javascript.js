// === Variables ===
let productos = [];
let carrito = [];
let filtroActual = "todos";

// Ejecutar al cargar
window.onload = function () {
  cargarProductos();
  cargarCarritoDelLocalStorage();
  actualizarContadorCarrito();
};

// === Cargar productos desde Firestore ===
async function cargarProductos() {
  try {
    console.log("Cargando productos desde Firebase...");

    const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");

    const productosRef = collection(window.db, "productos");
    const snapshot = await getDocs(productosRef);

    productos = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      productos.push({
        id: doc.id,
        nombre: data.nombre || "(sin nombre)",
        precio: Number(data.precio) || 0,
        imagen: data.imagen || "",
        descripcion: data.descripcion || "",
        categoria: data.categoria || "otros",
        detalles: data.detalles || "",
        stock: Number(data.stock) || 0
      });
    });

    console.log("Productos cargados:", productos);
    sincronizarCarritoConStock();
    mostrarProductos();

  } catch (error) {
    console.error("ERROR al cargar productos:", error);
    alert("No se pudieron cargar los productos. Revisa la consola.");
  }
}

// === Mostrar productos ===
function mostrarProductos() {
  const grid = document.getElementById("productosGrid");
  grid.innerHTML = "";

  const lista = filtroActual === "todos"
    ? productos
    : productos.filter(p => p.categoria === filtroActual);

  if (lista.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;">No hay productos disponibles</p>`;
    return;
  }

  lista.forEach(p => {
    const cantidadEnCarrito = carrito.find(x => x.id === p.id)?.cantidad || 0;
    const stockDisponible = p.stock - cantidadEnCarrito;
    const sinStock = stockDisponible <= 0;
    
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <img src="${p.imagen}" class="producto-imagen">
      <div class="producto-info">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <div class="producto-precio">$${p.precio.toLocaleString("es-AR")}</div>
        <div class="stock-info" style="color: ${sinStock ? '#e74c3c' : '#27ae60'}; font-weight: 600; margin: 8px 0;">
          ${sinStock ? 'Sin stock' : `Stock: ${stockDisponible}`}
        </div>
        <div class="producto-botones">
          <button class="btn-ver" onclick="verDetalle('${p.id}')">Ver detalle</button>
          <button class="btn-agregar" onclick="agregarAlCarrito('${p.id}')" ${sinStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
            ${sinStock ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

// === Filtrar ===
function filtrarProductos(categoria) {
  filtroActual = categoria;
  document.querySelectorAll(".filtro-btn").forEach(btn => btn.classList.remove("activo"));
  event.target.classList.add("activo");
  mostrarProductos();
}

// === Ver detalle ===
function verDetalle(id) {
  const p = productos.find(x => x.id === id);
  const cantidadEnCarrito = carrito.find(x => x.id === id)?.cantidad || 0;
  const stockDisponible = p.stock - cantidadEnCarrito;
  const sinStock = stockDisponible <= 0;
  
  const modal = document.getElementById("modalProducto");
  const detalle = document.getElementById("detalleProducto");

  detalle.innerHTML = `
    <img src="${p.imagen}" class="detalle-imagen">
    <h2>${p.nombre}</h2>
    <p>${p.descripcion}</p>
    <p>${p.detalles}</p>
    <div class="producto-precio">$${p.precio.toLocaleString("es-AR")}</div>
    <div class="stock-info" style="color: ${sinStock ? '#e74c3c' : '#27ae60'}; font-weight: 600; margin: 12px 0; font-size: 16px;">
      ${sinStock ? 'Sin stock disponible' : `Stock disponible: ${stockDisponible} unidades`}
    </div>
    <button class="btn-agregar" onclick="agregarAlCarrito('${p.id}'); cerrarModal();" ${sinStock ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>
      ${sinStock ? 'Sin stock' : 'Agregar al carrito'}
    </button>
  `;

  modal.style.display = "block";
}

function cerrarModal() {
  document.getElementById("modalProducto").style.display = "none";
}

// === Carrito ===
function agregarAlCarrito(id) {
  const p = productos.find(x => x.id === id);
  const item = carrito.find(x => x.id === id);
  
  // Verificar stock disponible
  const cantidadActual = item ? item.cantidad : 0;
  const stockDisponible = p.stock - cantidadActual;
  
  if (stockDisponible <= 0) {
    alert(`No hay stock disponible de "${p.nombre}"`);
    return;
  }

  if (item) {
    item.cantidad++;
  } else {
    carrito.push({ ...p, cantidad: 1 });
  }

  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
  mostrarNotificacion(`Producto agregado (${stockDisponible - 1} disponibles)`);
  
  // Refrescar productos para actualizar el stock mostrado
  mostrarProductos();
}

function actualizarCarrito() {
  const div = document.getElementById("carritoItems");
  if (!carrito.length) {
    div.innerHTML = "<div class='carrito-vacio'>Tu carrito está vacío</div>";
    document.getElementById("subtotal").textContent = "$0";
    document.getElementById("total").textContent = "$0";
    return;
  }

  div.innerHTML = "";
  let subtotal = 0;

  carrito.forEach(item => {
    subtotal += item.precio * item.cantidad;
    const e = document.createElement("div");
    e.className = "carrito-item";
    e.innerHTML = `
      <div class="item-info">
        <img src="${item.imagen}" class="item-imagen">
        <div>
          <h4>${item.nombre}</h4>
          <div>$${item.precio.toLocaleString("es-AR")}</div>
        </div>
      </div>
      <div class="item-controles">
        <button onclick="cambiarCantidad('${item.id}',-1)">-</button>
        <span>${item.cantidad}</span>
        <button onclick="cambiarCantidad('${item.id}',1)">+</button>
        <button onclick="eliminarDelCarrito('${item.id}')">Eliminar</button>
      </div>
    `;
    div.appendChild(e);
  });

  document.getElementById("subtotal").textContent = "$" + subtotal.toLocaleString("es-AR");
  document.getElementById("total").textContent = "$" + subtotal.toLocaleString("es-AR");
}

function cambiarCantidad(id, c) {
  const item = carrito.find(i => i.id === id);
  const p = productos.find(x => x.id === id);
  
  // Si intenta aumentar, verificar stock
  if (c > 0) {
    const stockDisponible = p.stock - item.cantidad;
    if (stockDisponible <= 0) {
      alert(`No hay más stock disponible de "${p.nombre}"\nStock máximo: ${p.stock} unidades`);
      return;
    }
  }
  
  item.cantidad += c;
  if (item.cantidad <= 0) {
    eliminarDelCarrito(id);
    return;
  }
  
  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
  mostrarProductos(); // Actualizar stock mostrado
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(i => i.id !== id);
  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
  mostrarProductos(); // Actualizar stock mostrado
}

function actualizarContadorCarrito() {
  document.getElementById("contadorCarrito").textContent =
    carrito.reduce((a, b) => a + b.cantidad, 0);
}

function abrirCarrito() {
  document.getElementById("carritoSidebar").classList.add("abierto");
  document.getElementById("overlay").classList.add("activo");
}

function cerrarCarrito() {
  document.getElementById("carritoSidebar").classList.remove("abierto");
  document.getElementById("overlay").classList.remove("activo");
}

async function finalizarCompra() {
  if (carrito.length === 0) {
    alert("El carrito está vacío");
    return;
  }

  // Confirmar compra
  const totalProductos = carrito.reduce((a, b) => a + b.cantidad, 0);
  const totalPrecio = carrito.reduce((a, b) => a + (b.precio * b.cantidad), 0);
  const confirmar = confirm(`¿Confirmar compra?\n\nTotal productos: ${totalProductos}\nTotal a pagar: ${totalPrecio.toLocaleString("es-AR")}`);
  
  if (!confirmar) return;

  try {
    // Actualizar stock en Firebase
    const { doc, updateDoc, getDoc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
    
    for (const item of carrito) {
      const docRef = doc(window.db, "productos", item.id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const stockActual = docSnap.data().stock || 0;
        const nuevoStock = Math.max(0, stockActual - item.cantidad);
        
        await updateDoc(docRef, {
          stock: nuevoStock
        });
        
        console.log(`Stock actualizado: ${item.nombre} - Nuevo stock: ${nuevoStock}`);
      }
    }
    
    // Limpiar carrito
    carrito = [];
    guardarCarritoEnLocalStorage();
    actualizarCarrito();
    actualizarContadorCarrito();
    
    // Recargar productos para reflejar nuevo stock
    await cargarProductos();
    
    // Mostrar mensaje de éxito
    document.getElementById("mensajeExito").style.display = "block";
    cerrarCarrito();
    
    alert("Compra realizada con éxito. El stock ha sido actualizado.");
    
  } catch (error) {
    console.error("Error al finalizar compra:", error);
    alert("Error al procesar la compra. Por favor intenta nuevamente.");
  }
}

function cerrarMensajeExito() {
  document.getElementById("mensajeExito").style.display = "none";
}

function mostrarNotificacion(msg) {
  const n = document.getElementById("notificacion");
  n.textContent = msg;
  n.classList.add("mostrar");
  setTimeout(() => n.classList.remove("mostrar"), 3000);
}

function guardarCarritoEnLocalStorage() {
  localStorage.setItem("carritoSRB", JSON.stringify(carrito));
}

function cargarCarritoDelLocalStorage() {
  const g = localStorage.getItem("carritoSRB");
  if (g) carrito = JSON.parse(g);
}

// Sincronizar carrito con stock real de Firebase
function sincronizarCarritoConStock() {
  let carritoModificado = false;
  
  carrito = carrito.filter(item => {
    const producto = productos.find(p => p.id === item.id);
    
    if (!producto) {
      // El producto ya no existe en Firebase
      carritoModificado = true;
      return false;
    }
    
    // Actualizar el stock del producto en el carrito
    item.stock = producto.stock;
    
    // Si la cantidad en carrito excede el stock, ajustar
    if (item.cantidad > producto.stock) {
      item.cantidad = producto.stock;
      carritoModificado = true;
    }
    
    // Si no hay stock, eliminar del carrito
    if (producto.stock <= 0) {
      carritoModificado = true;
      return false;
    }
    
    return true;
  });
  
  if (carritoModificado) {
    guardarCarritoEnLocalStorage();
    actualizarCarrito();
    actualizarContadorCarrito();
  }
}

function mostrarSeccion(sec) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
  document.getElementById(sec).classList.add("activa");
}
