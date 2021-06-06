//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _ = require("lodash");
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT||5000;

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect(process.env.ATLAS_URI, {useNewUrlParser: true, useUnifiedTopology: true});

const itemSchema = new mongoose.Schema ({
  name: String
});

const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Welcom to your todolist!"
});

const item2 = new Item({
  name : "Hit the + button to add a new item."
})

const item3 = new Item({
  name: "<--- hti this to delete an item"
})

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
  Item.find({}, (err, item) => {
    if(item.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if(err){
          console.log(err);
        } else {
          console.log("Succesfully added items");
        }
      });
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: item});
    }
  })
});

app.get("/:customListName", (req, res) => {
   const customListName = _.capitalize(req.params.customListName);
   List.findOne({name: customListName},(err, foundList)=>{
      if(!err){
        if(!foundList){
            const list= new List({
              name: customListName,
              items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName)
        }else {
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        }
      }
   })
});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;
  const item = new Item({
    name: itemName
  });

  if(listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});

app.post("/delete", (req,res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
      Item.findByIdAndRemove(checkedItemId, (err) => {
        if(!err) {
          console.log("Checked item removed");
          res.redirect("/");
        }
      });
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) =>{
        if(!err){
          res.redirect("/" + listName);
        }
      });
    }
});




// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(PORT, function() {
  console.log("Server started on port:" + PORT);
});
