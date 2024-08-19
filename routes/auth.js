const express = require('express');
const usercontroll=require("../Controllers/data")
const router=express.Router(); 
router.post('/select',usercontroll.select);

module.exports=router;
