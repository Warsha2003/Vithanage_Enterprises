//V2ft5D1dbTssVJzR

const express = require('express');
const mongoose = require('mongoose');

const app = express();

//Middleware
app.use("/",(req, res, next) => {
    res.send("It is Working");
})

mongoose.connect("mongodb+srv://admin:V2ft5D1dbTssVJzR@cluster0.fq7u6hk.mongodb.net/")
.then(()=> console.log("Connected to MongoDB"))
.then(()=>{
    app.listen(5000);
})
.catch((err)=> console.log(err));

