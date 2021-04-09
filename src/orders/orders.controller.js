const path = require('path');
const orders = require(path.resolve('src/data/orders-data'));

// Use this function to assigh ID's when necessary
const nextId = require('../utils/nextId');

const validStatus = ['pending', 'preparing', 'out-for-delivery', 'delivered'];

function idMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id && orderId != id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function bodyHasDeliverTo(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (!deliverTo) {
    next({ status: 400, message: 'Order must include a deliverTo' });
  }
  return next();
}
function bodyHasMobileNumber(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (!mobileNumber) {
    next({ status: 400, message: 'Order must include a mobileNumber' });
  }
  return next();
}
function bodyHasStatus(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (!status) {
    next({
      status: 400,
      message:
        'Order must have a status of pending, preparing, out-for-delivery, delivered',
    });
  }
  if (!validStatus.includes(status)) {
    next({
      status: 400,
      message: `The 'status' property must be one of ${validStatus}. Received: ${status}`,
    });
  }
  if (status === 'delivered') {
    next({
      status: 400,
      message: 'A delivered order cannot be changed',
    });
  }
  return next();
}

function bodyHasDishes(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (!dishes) {
    next({ status: 400, message: 'Order must include a dish' });
  }
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({ status: 400, message: 'Order must include at least one dish' });
  }
  return next();
}

function dishesHasQuantity(req, res, next) {
  const { data: { dishes } = {} } = req.body;

  dishes.forEach((dish) => {
    if (
      !dish.quantity ||
      dish.quantity <= 0 ||
      typeof dish.quantity !== 'number'
    ) {
      next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity ${dish.quantity}that is an integer greater than 0.`,
      });
    }
  });
  return next();
}

function orderExists(req, res, next) {
  const orderId = req.params.orderId;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({ status: 404, message: `Order id not found: ${req.params.orderId}` });
}

function orderPending(req, res, next) {
  const order = res.locals.order;
  if (order.status !== 'pending') {
    next({
      status: 400,
      message: 'An order cannot be deleted unless it is pending',
    });
  }
  return next();
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };

  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const originalDeliverTo = order.deliverTo;
  const originalMobileNumber = order.mobileNumber;
  const originalStatus = order.status;
  const originalDishes = order.dishes;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  if (originalDeliverTo != deliverTo) {
    order.deliverTo = deliverTo;
  }
  if (originalMobileNumber != mobileNumber) {
    order.mobileNumber = mobileNumber;
  }
  if (originalStatus != status) {
    order.status = status;
  }
  if (originalDishes != dishes) {
    order.dishes = dishes;
  }
  res.json({ data: order });
}
function destroy(req, res, next) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => {
    order.id = orderId;
  });
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

function list(req, res) {
  res.json({ data: orders });
}
module.exports = {
  create: [
    bodyHasDeliverTo,
    bodyHasMobileNumber,
    bodyHasDishes,
    dishesHasQuantity,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHasDeliverTo,
    bodyHasMobileNumber,
    bodyHasStatus,
    bodyHasDishes,
    dishesHasQuantity,
    idMatch,
    update,
  ],
  delete: [orderExists, orderPending, destroy],
  list,
};
