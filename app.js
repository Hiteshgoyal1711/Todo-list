const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

var list_items = [];
var work_item = [];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const itemsschema = {
  name: String,
};

const listSchema = {
  name: String,
  items: [itemsschema],
};

const Item = mongoose.model("Item", itemsschema);

const List = mongoose.model("List", listSchema);

const item1 = new Item({
  name: "Welcome to your todo list!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete item.",
});

const defaultItems = [item1, item2, item3];

app.set("view engine", "ejs");

var day;

app.get("/", function (req, res) {
  var today = new Date();

  var options = {
    weekday: "long",
    day: "numeric",
    month: "long",
  };
  day = today.toLocaleDateString("en-US", options);

  Item.find({}, function (err, founditems) {
    if (founditems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("successfully added to databases");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { kindofday: day, items: founditems });
    }
  });
});

app.get("/:ID", function (req, res) {
  const customListName = _.capitalize(req.params.ID);
  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log(err);
    } else {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render("list", {
          kindofday: foundList.name,
          items: foundList.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const ItemName = req.body.newItem;
  const ListName = req.body.button;

  const item = new Item({
    name: ItemName,
  });

  if (ListName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: ListName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + ListName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checked_item_id = req.body.checkbox;
  const ListName = req.body.ListName;

  if (ListName === day) {
    Item.findByIdAndRemove(checked_item_id, function (err) {
      if (err) {
        console.log(err);
      } else {
        console.log("successfully removed!!");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: ListName },
      { $pull: { items: { _id: checked_item_id } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + ListName);
        }
      }
    );
  }
});

app.listen(3000, function () {
  console.log("Server Started at 3000");
});
