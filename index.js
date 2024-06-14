const express = require("express");
require("./db/config");
const User = require("./db/User");
const Product = require("./db/Product");
const cors = require("cors");
const Jwt=require('jsonwebtoken');
const jwtKey="secretKey";
const app = express();
app.use(express.json());
app.use(cors());

app.post("/register", async (req, res) => {
  const user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  Jwt.sign({result},jwtKey,{expiresIn:"2h"},(err,token)=>{
    if(err)
    res.send({result:"something wenr wrong"})
    else
    res.send({result,auth:token});
});
})

app.post("/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    const user = await User.findOne().select("-password");
    if(user){
        Jwt.sign({user},jwtKey,{expiresIn:"2h"},(err,token)=>{
                if(err)
                res.send({result:"something wenr wrong"})
                else
                res.send({user,auth:token});
        })
   
    }else{
        res.send({ result: "no user found" });
    }
  } else {
    res.send({ result: "plz provide all information" });
  }
});

app.post("/add-product", verifyToken,async (req, res) => {
  const user = new Product(req.body);
  let result = await user.save();
  res.send(result);
});

app.get("/products-list",verifyToken, async (req, res) => {
  const product = await Product.find();
  if (product.length > 0) {
    res.send(product);
  } else {
    res.send({ result: "no record found" });
  }
});

app.put("/update-product/:id",verifyToken, async (req, res) => {
  const product = await Product.updateOne(
    { _id: req.params.id },
    { $set: req.body }
  );
  res.send(product);
});

app.delete("/delete/:id", async (req, res) => {
  const result = await Product.deleteOne({ _id: req.params.id });
  res.send(result);
});

app.get("/search/:key",verifyToken, async (req, res) => {
  const result = await Product.find({
    "$or": [
      { name: { $regex: req.params.key } },
      { category: { $regex: req.params.key } },
    ],
  });
  res.send(result);
});

function verifyToken(req,res,next){
  let token=req.headers['authorization'];
  if(token){
    token=token.split(' ')[1];
    Jwt.verify(token,jwtKey,(err,valid)=>{
      if(err){
        res.staus(401).send({result:"token is not valid"})
      }else{
      next();
      }
    })
  }
  else{
    res.staus(403).send({result:"plz send a token with headers"})
  }
}


app.listen(5000);
