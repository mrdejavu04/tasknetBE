const express = require("express");
const ctrl = require("../controllers/taskController");

const router = express.Router();

// CRUD + filter + pagination
router.post("/", ctrl.createTask);
router.get("/", ctrl.listTasks);
router.get("/stats/monthly", ctrl.statsMonthly);
router.get("/:id", ctrl.getTask);
router.patch("/:id", ctrl.updateTask);
router.delete("/:id", ctrl.softDeleteTask);

module.exports = router;
