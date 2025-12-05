// === Variables ===
let productos = [];
let carrito = [];
let filtroActual = "todos";

// Ejecutar al cargar
window.onload = function () {
  cargarProductos();
// === Variables ===
let productos = [];
let carrito = [];
let filtroActual = "todos";
}
// Ejecutar al cargar
window.onload = function () {
  cargarProductos();
  cargarCarritoDelLocalStorage();
  actualizarContadorCarrito();
};

// === Cargar productos desde Firestore ===
async function cargarProductos() {
  try {
    console.log("📥 Cargando productos desde Firebase...");

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
        detalles: data.detalles || ""
      });
    });

    console.log("Productos cargados:", productos);
    mostrarProductos();

  } catch (error) {
    console.error("❌ ERROR al cargar productos:", error);
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
    const card = document.createElement("div");
    card.className = "producto-card";
    card.innerHTML = `
      <img src="${p.imagen}" class="producto-imagen">
      <div class="producto-info">
        <h3>${p.nombre}</h3>
        <p>${p.descripcion}</p>
        <div class="producto-precio">$${p.precio.toLocaleString("es-AR")}</div>
        <div class="producto-botones">
          <button class="btn-ver" onclick="verDetalle('${p.id}')">Ver detalle</button>
          <button class="btn-agregar" onclick="agregarAlCarrito('${p.id}')">Agregar</button>
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
  const modal = document.getElementById("modalProducto");
  const detalle = document.getElementById("detalleProducto");

  detalle.innerHTML = `
    <img src="${p.imagen}" class="detalle-imagen">
    <h2>${p.nombre}</h2>
    <p>${p.descripcion}</p>
    <p>${p.detalles}</p>
    <div class="producto-precio">$${p.precio.toLocaleString("es-AR")}</div>
    <button class="btn-agregar" onclick="agregarAlCarrito('${p.id}'); cerrarModal();">Agregar</button>
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

  if (item) item.cantidad++;
  else carrito.push({ ...p, cantidad: 1 });

  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
  mostrarNotificacion("Producto agregado");
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
  item.cantidad += c;
  if (item.cantidad <= 0) eliminarDelCarrito(id);
  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
}

function eliminarDelCarrito(id) {
  carrito = carrito.filter(i => i.id !== id);
  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
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

function finalizarCompra() {
  carrito = [];
  guardarCarritoEnLocalStorage();
  actualizarCarrito();
  actualizarContadorCarrito();
  document.getElementById("mensajeExito").style.display = "block";
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

function mostrarSeccion(sec) {
  document.querySelectorAll(".seccion").forEach(s => s.classList.remove("activa"));
  document.getElementById(sec).classList.add("activa");
}

