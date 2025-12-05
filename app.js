var express = require("express");
var bodyParser = require("body-parser");
var path = require("path");
const mongoose = require("mongoose");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("./Web"));

mongoose.connect("mongodb+srv://adeth115:Adpp115@app.jtzancl.mongodb.net/Usuarios");

const db = mongoose.connection;
db.once("open", () => {
  console.log("Conexion Exitosa");
});
db.on("error", (error) => {
  console.log("Error de conexion con la base de datos:", error);
});

const UsuariosSchema = new mongoose.Schema({
  Usuario: String,
  Correo: String,
  Telefono: Number,
  Contra: String,
  Rol: String,
});

const Usuarios = mongoose.models.Usuarios || mongoose.model("Usuarios", UsuariosSchema);

const ProductoSchema = new mongoose.Schema({
  prod: String,
  cant: Number,
  precio: Number,
  fecha: Date,
  dir: String,
});

const Productos = mongoose.models.Productos || mongoose.model("Productos", ProductoSchema);

const TareaSchema = new mongoose.Schema({
  titulo: String,
  descripcion: String,
  usuarioId: String,
  rolAsignado: String,
  fecha: { type: Date, required: true },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Tareas = mongoose.models.Tareas || mongoose.model("Tareas", TareaSchema);

app.post("/crear", async (req, res) => {
  try {
    const nuevo = new Usuarios({
      Usuario: req.body.Usuario,
      Correo: req.body.Correo,
      Telefono: req.body.Telefono,
      Contra: req.body.Contra,
      Rol: req.body.Rol,
    });

    await nuevo.save();
    res.status(201).json({ message: "Usuario Registrado" });
  } catch (error) {
    res.status(500).json({ message: "Error al registrar usuario: " + error.message });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { Correo, Contra } = req.body;

    if (!Correo || !Contra) {
      return res.status(400).json({ message: "Faltan datos de inicio de sesión." });
    }

    const encontrado = await Usuarios.findOne({ Correo });

    if (!encontrado) {
      return res.status(401).json({ message: "Usuario no encontrado." });
    }

    if (encontrado.Contra !== Contra) {
      return res.status(403).json({ message: "Contraseña incorrecta." });
    }

    const rol = encontrado.Rol?.toLowerCase();

    if (rol !== "tecnico" && rol !== "Usuario") {
      return res.status(400).json({ message: "El rol del usuario no es válido." });
    }

    res.status(200).json({
      message: "Inicio de sesión exitoso",
      user: {
        id: encontrado._id.toString(),
        correo: encontrado.Correo,
        rol: rol,
        esTecnico: rol === "tecnico",
        esMiembro: rol === "Usuario",
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error interno del servidor." });
  }
});

app.post("/leer", async (req, res) => {
  try {
    const { Correo } = req.body;

    if (!Correo) {
      return res.status(400).json({ message: "Correo requerido." });
    }

    const resultado = await Usuarios.find({ Correo });

    if (!resultado || resultado.length === 0) {
      return res.status(404).json({ message: "No hay datos." });
    }

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener datos." });
  }
});

app.put("/actualizar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const PA = await Productos.findByIdAndUpdate(
      id,
      {
        prod: req.body.prod,
        cant: req.body.cant,
        precio: req.body.precio,
        fecha: req.body.fecha,
        dir: req.body.dir,
      },
      { new: true }
    );
    if (!PA) {
      return res.status(404).json({ message: "Producto no encontrado" });
    } else {
      res.status(201).json({ message: "Producto Actualizado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error Leer: " + error });
  }
});

app.delete("/eliminar/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const PE = await Productos.findByIdAndDelete(id);
    if (!PE) {
      return res.status(404).json({ message: "Producto no encontrado" });
    } else {
      res.status(201).json({ message: "Producto eliminado" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error Leer: " + error });
  }
});

app.post("/tareas", async (req, res) => {
  try {
    const { titulo, descripcion, usuarioId, rolAsignado, fecha } = req.body;

    if (!usuarioId || !rolAsignado || !fecha) {
      return res.status(400).json({ message: "Faltan campos obligatorios." });
    }

    const nueva = new Tareas({
      titulo,
      descripcion,
      usuarioId,
      rolAsignado,
      fecha: new Date(fecha),
    });

    await nueva.save();

    res.status(201).json({ message: "Tarea creada", tarea: nueva });
  } catch (error) {
    res.status(500).json({ message: "Error interno" });
  }
});

app.get("/tareas/:usuarioId", async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { rol } = req.query;

    const query = { usuarioId };
    if (rol) query.rolAsignado = rol;

    const tareas = await Tareas.find(query).sort({ createdAt: -1 });

    res.status(200).json(tareas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tareas." });
  }
});

app.get("/tareas-tecnico", async (req, res) => {
  try {
    const tareas = await Tareas.find({}).sort({ createdAt: -1 });
    res.status(200).json(tareas);
  } catch (error) {
    res.status(500).json({ message: "Error al obtener tareas." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});
