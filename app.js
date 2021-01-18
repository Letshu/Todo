//jshint esversion:6

const express = require("express");
const _= require("lodash");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://admin-William:Test123@cluster0.v6t19.mongodb.net/todolistDB', {useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log("Connection to MongoDB was successful");
});

const day = date.getDate();
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const itemSchema = new mongoose.Schema({
  name:String
});

const Items = mongoose.model("Item",itemSchema);

const FinishWebDev = new Items({name:"Full Stack Web Development"});
const DataScience = new Items({name:"Complete Data Science Course"});
const TutoringOpportunity = new Items({name:"Respond to job offer via email"});
const defaultItems = [FinishWebDev,DataScience,TutoringOpportunity];
const listSchema = {
  name:String,
  items:[itemSchema]
}

const Lists = mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  Items.find({},function(err,elementsFound){
    if(elementsFound.length == 0){
      Items.insertMany(defaultItems,function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Successfully saved default items");
        }
      })
      res.redirect("/");
    }
    res.render("list", {listTitle: day, newListItems: elementsFound});
  })
});

app.post("/", function(req, res){
  const item = req.body.newItem;
  const submitTitle = req.body.list;
  const newItem = new Items({name:item});
  
  if(submitTitle == day){
    newItem.save();
    res.redirect("/");
  }else{
    Lists.findOne({name:submitTitle},function(err,temp){
      if(err){
        console.log(err);
      }else{
        temp.items.push(newItem);
        temp.save() //to update it with the new data
        res.redirect("/"+temp.name); //redirect to the route where the user came from
      }
    })
  }
});

app.post("/delete",function(req,res){
  const checkId= req.body.checkbox;
  const listItem = req.body.listName;

  if(listItem === day){
    Items.findByIdAndDelete(checkId,function(err){
      if(!err){
        console.log("Successfully deleted item");
      }else{
        console.log(err);
      }
      res.redirect("/");
    })
  }else{
    Lists.findOneAndUpdate({name:listItem},{$pull:{items:{_id:checkId}}},function(err,temp){
      if(!err){
        res.redirect("/"+temp.name);
      }
    })
  }
});

app.get("/:customTitle", function(req,res){
  const listCustomItem = _.capitalize(req.params.customTitle);
  Lists.findOne({name:listCustomItem},function(err,foundItem){
    if(!err){
      if(!foundItem){
        const customLists = new Lists({
          name:listCustomItem,
          items:defaultItems
        })
        customLists.save();
        res.redirect("/"+listCustomItem); //to redirecting to the new created route
      }else{
        res.render("list", {listTitle:listCustomItem, newListItems:foundItem.items});
      }
    }
  })
});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
