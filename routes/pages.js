const express=require('express');
const router=express.Router();

router.get("/",(request,result) =>{
    result.render('index', { title: 'About Page', layout: 'index' });
});

router.get("/Terminate",(request,result) =>{
    result.render('Terminate', { title: 'About Page', layout: 'Terminate' });
});
router.get("/Quota",(request,result) =>{
    result.render('Quota', { title: 'About Page', layout: 'Quota'});
});

module.exports=router;
