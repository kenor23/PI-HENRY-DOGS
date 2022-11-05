const { Router } = require('express');
// Importar todos los routers;
// Ejemplo: const authRouter = require('./auth.js');
const axios = require ('axios')
require("dotenv").config();
const { API_KEY } = process.env;
const { Dog, Temperament } = require("../db");
const express = require('express');
const router = Router();

// Configurar los routers
// Ejemplo: router.use('/auth', authRouter);

const getApiInfo = async () => {
    const apiUrl = await axios.get(`https://api.thedogapi.com/v1/breeds?api_key=${API_KEY}`);
    const apiInfo = await apiUrl.data.map(el => {
        return {
            name: el.name,
            image: el.image.url,
            temperaments: el.temperament,
            weight: el.weight.metric,
            id: el.id,
        }
    });
    return apiInfo;
};

const getDbInfo = async () => {
    return await Dog.findAll({
        include: {
            model: Temperament,
            attributes: ['name'],
            through: {
                attributes: []
            },
        }
    })
}

const getAllDogs = async () => {
    const apiInfo = await getApiInfo();
    const dbInfo = await getDbInfo();
    const infoTotal = apiInfo.concat(dbInfo);
    return infoTotal;
}

router.get('/dogs', async (req,res) => {
    const name = req.query.name
    let dogsTotal = await getAllDogs();
    if (name) {
        let dogsName = await dogsTotal.filter(el => el.name.toLowerCase().includes(name.toLowerCase()))
        dogsName.length ?
        res.status(200).send(dogsName) :
        res.status(404).send('No existe un perro de esa raza')
    } else {
        res.status(200).send(dogsTotal)
    }
})

router.get("/temperaments", async (req, res) => {
    const temperamentsApi = await axios.get(`https://api.thedogapi.com/v1/breeds?api_key=${API_KEY}`)
    const temperaments = temperamentsApi.data.map(t => t.temperament);
    const temps = temperaments.toString().split(",");
    temps.forEach(el => {
        let i = el.trim()
        Temperament.findOrCreate({
             where: { name: i }
        })
    })

    const allTemps = await Temperament.findAll();    
    res.send(allTemps);
});

router.post('/dogs', async (req, res) => {
    let {
        name,
        height,
        weight,
        life_span,
        temperaments,
        image,
        createdInDb,
       } = req.body

    let dogCreated = await Dog.create({
        name,
        height,
        weight,
        life_span,
        image,
        createdInDb,
    })

    let temperamentDb = await Temperament.findAll({
        where: {name: temperaments},
    })

    dogCreated.addTemperament(temperamentDb);
    res.status(200).send("Perro creado exitosamente")
})

router.use(express.json());
module.exports = router;
