var express = require("express");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("./public"));
// app.use(express.static("/public"));
// app.use('/static', express.static(__dirname + '/public'));

// Handlebars require
var exphbs = require("express-handlebars");

// Set handlebars
app.engine("handlebars", exphbs({defaultLayout: "main"}));
app.set("view engine", "handlebars");

// Connect to the Mongo DB

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongooseScraper";
mongoose.connect(MONGODB_URI);
// This way the connection works also with the remote mongolab database when deployed to heroku

// mongoose.connect("mongodb://localhost/MongooseScraper", { useNewUrlParser: true });

// All the routes go here

app.get("/", function(req, res) {
  // db.Article.find({})
  db.Article.find({}).sort({'_id': -1})
  .then(function(dbNews) {
    var hbsObject = dbNews
    console.log(dbNews);
    // res.render("index", {data: dbNews});
    res.render("index", {dbNews});
  })
});

// .find().sort({date:-1}).


// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
  // Make a request via axios for the news section of `ycombinator`
  axios.get("https://www.nytimes.com/section/technology").then(function(response) {
    // Load the html body from axios into cheerio
    var $ = cheerio.load(response.data);

    // console.log($.html)

    // For each "h2 within a li" element
    $(".css-ye6x8s").each(function(i, element) {
      var result = {};

      // Save the title, summary and href of each link enclosed in the current element

      result.headline = $(this).children().children().children().children("h2").text();
      result.summary = $(this).children().children().children().children("p").text();
      result.url = $(this).children().children().children().attr("href");
      result.author = $(this).children().children().children().children("div").children("p").children("span").text();

      console.log("This is the result");
      console.log(result);

      // Create a new article using the result object built from scraping
      db.Article.create(result)
      .then(function(dbNews) {
        // View the added result in the console
        console.log("This are de dbNews");
        console.log(dbNews);
        // res.json(dbNews);
      })
      .catch(function(err) {
        // If an error ocurred, log it
        console.log(err)
        res.end();
      });
    });
  });

  // Send a "Scrape Complete" message to the browser
  res.redirect("/");
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // TODO: Finish the route so it grabs all of the articles
  db.Article.find({})
  .then(function(dbArticle) {
    // View the added result in the console
    console.log(dbArticle);
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, log it
    res.json(err);
    
  });
  
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // TODO
  // ====
  // Finish the route so it finds one article using the req.params.id,
  // and run the populate method with "note",
  // then responds with the article with the note included
  var artId = req.params.id

  db.Article.findOne({"_id": artId})
  .populate('note')
  .then(function(dbArticle) {
    // View the added result in the console
    console.log(dbArticle);
    res.json(dbArticle);
  })
  .catch(function(err) {
    // If an error occurred, log it
    res.json(err);
  });

});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // TODO
  // ====
  // save the new note that gets posted to the Notes collection
  // then find an article from the req.params.id
  // and update it's "note" property with the _id of the new note
  db.Note.create(req.body)
  .then(function(dbNote) {
    // View the added result in the console
    console.log(dbNote);
    db.Article.findOneAndUpdate({_id: mongoose.Types.ObjectId(req.params.id)},{note: dbNote.id})
    .then(fullArt => {
      res.json(fullArt);
    })
    .catch(function(err) {
      // If an error occurred, log it
      console.log(err);
    });
  })
});



// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });
