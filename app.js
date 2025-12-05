var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./Web'));

mongoose.connect('mongodb+srv://adeth115:Adpp115@app.jtzancl.mongodb.net/Usuarios');

const db = mongoose.connection;
db.once('open', () => {
    console.log("Conexion Exitosa");
});
db.on('error', (error) => {
    console.log("Error de conexion con la base de datos:", error);
});

const UsuariosSchema = new mongoose.Schema({
    Usuario: String,
    Correo: String,
    Telefono: Number,
    Contra: String,
    Rol: String
});

const Usuarios = mongoose.model('Usuarios', UsuariosSchema);

app.post('/crear', async (req, res) => {
    try {
        const nuevo = new Usuarios({
            Usuario: req.body.Usuario,
            Correo: req.body.Correo,
            Telefono: req.body.Telefono,
            Contra: req.body.Contra,
            Rol: req.body.Rol
        });

        await nuevo.save();
        res.status(201).send("Usuario Registrado");

    } catch (error) {
        console.error(error);
        res.status(500).send("Error al registrar usuario: " + error.message);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { Correo, Contra } = req.body;

        if (!Correo || !Contra) {
            return res.status(400).send("Faltan datos de inicio de sesión.");
        }

        const encontrado = await Usuarios.findOne({ Correo });

        if (!encontrado) {
            return res.status(401).send("Usuario no encontrado.");
        }

        if (encontrado.Contra !== Contra) {
            return res.status(403).send("Contraseña incorrecta.");
        }

        res.status(200).json({
            message: "Inicio de sesión exitoso",
            user: {
                id: encontrado._id,
                Correo: encontrado.Correo,
                Rol: encontrado.Rol
            }
        });

    } catch (error) {
        console.error("Error durante el login:", error);
        res.status(500).send("Error interno del servidor.");
    }
});

app.post('/leer', async (req, res) => {
    try {
        const { Correo } = req.body;

        if (!Correo) {
            return res.status(400).send("Correo requerido.");
        }

        const resultado = await Usuarios.find({ Correo });

        if (!resultado || resultado.length === 0) {
            return res.status(404).send("No hay datos.");
        }

        res.status(200).json(resultado);

    } catch (error) {
        console.error("Error al leer datos:", error);
        res.status(500).send("Error al obtener datos.");
    }
});

app.put('/actualizar/:id',async(req,res)=>{
    try{
        const {id}=req.params
        const PA=await Productos.findByIdAndUpdate(
            id,{
                prod:req.body.prod,
                cant:req.body.cant,
                precio:req.body.precio,
                fecha:req.body.fecha,
                dir:req.body.dir
                },
            {new:true}    
        )
        if(!PA){
            return res.status(404).send("Producto no encontrado")
        }
        else{
            res.status(201).send("Producto Actualizado")
        }
    }
    catch(error){
        console.error(error)
        res.status(500).send("Error Leer: ", error)
    }
})

app.delete('/eliminar/:id',async(req,res)=>{
    try{
        const {id}=req.params
        const PE= await Productos.findByIdAndDelete(id);
        if(!PE){
            return res.status(404).send("Producto no encontrado")
        }
        else{
            res.status(201).send("Producto eliminado")
        }
    }
    catch(error){
        console.error(error)
        res.status(500).send("Error Leer: ", error)
    }
})

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor Express escuchando en el puerto ${PORT}`);
});

