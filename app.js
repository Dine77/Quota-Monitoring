const express=require('express');
const mysql = require('mysql');
const doenv =require('dotenv');
const path =require('path');
const hbs=require('hbs'); 
const exphbs = require('express-handlebars');
const indexRouter = require('./routes/pages'); 

const app=express(); //Object is created  here

doenv.config({
    path:'./.env'
    });

const db=mysql.createConnection({
    host:process.env.DATABASE_HOST,
    user:process.env.DATABASE_USER,
    password:process.env.DATABASE_PASS,
    database:process.env.DATABASE,
})


db.connect((err)=>{
    if(err){
        console.log(err);
    }
    else{
        console.log("Mysql Dastbase connection Done");
        
    }
});

    app.use(express.urlencoded({extended:false}))
    app.use(express.json()); // To handle JSON payloads

const location=path.join(__dirname,"./public");
app.use(express.static(location));

// Set up Handlebars view engine
app.engine('hbs', exphbs.engine({ 
    extname: '.hbs',
    defaultLayout: 'index', // Default layout file
    layoutsDir: path.join(__dirname, 'views'), // Layouts directory
    partialsDir: path.join(__dirname, 'views/partials') // Partials directory
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

app.use('/',require("./routes/pages"));
app.use('/auth',require("./routes/auth"));

app.listen(5000,()=>{
    console.log("Server Started @ Port 5000");
});