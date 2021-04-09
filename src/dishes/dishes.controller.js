const path = require('path');

const dishes = require(path.resolve('src/data/dishes-data'));

// Use this function to assign ID's when necessary
const nextId = require('../utils/nextId');

function idMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (id && dishId != id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function bodyHasProperties(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (!name) {
    next({ status: 400, message: "A 'name' property is required." });
  }
  if (!description) {
    next({ status: 400, message: "A 'description' property is required." });
  }
  if (!price) {
    next({ status: 400, message: "A 'price' property is required." });
  }
  if (price <= 0) {
    next({ status: 400, message: "A 'price' greater than 0 is required." });
  }
  if (typeof price !== 'number') {
    next({ status: 400, message: 'The price must be a number.' });
  }
  if (!image_url) {
    next({ status: 400, message: "A 'image_url' property is required." });
  }
  return next();
}

function dishExists(req, res, next) {
  const dishId = req.params.dishId;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({ status: 404, message: `Dish id not found: ${req.params.dishId}` });
}

function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}
function read(req, res, next) {
  res.json({ data: res.locals.dish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const originalName = dish.name;
  const originalDesc = dish.description;
  const originalPrice = dish.price;
  const originalImage = dish.image_url;
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (originalName != name) {
    dish.name = name;
  }
  if (originalDesc != description) {
    dish.description = description;
  }
  if (originalPrice != price) {
    dish.price = price;
  }
  if (originalImage != image_url) {
    dish.image_url = image_url;
  }
  res.json({ data: dish });
}

function list(req, res) {
  res.json({ data: dishes });
}

module.exports = {
  create: [bodyHasProperties, create],
  read: [dishExists, read],
  update: [dishExists, bodyHasProperties, idMatch, update],
  list,
};
