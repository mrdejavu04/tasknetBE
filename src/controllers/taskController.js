const Task = require("../models/Task");

exports.createTask = async (req, res) => {
  try {
    const body = req.body || {};

        // ✅ Nếu có dueAt thì không được nhỏ hơn hôm nay
    if (body.dueAt) {
      const dueDate = new Date(body.dueAt);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDate < today) {
        return res.status(400).json({ error: "Ngày hạn (due date) không được ở quá khứ" });
      }
    }

    const task = await Task.create(body);
    res.status(201).json(task);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Trùng (title + dueAt) đối với bản chưa xoá" });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.listTasks = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const filter = {
      deletedAt: null,
      ...(req.query.status ? { status: req.query.status } : {}),
      ...(req.query.tag ? { tags: req.query.tag } : {}),
      ...(req.query.from || req.query.to
        ? {
            createdAt: {
              ...(req.query.from ? { $gte: new Date(req.query.from) } : {}),
              ...(req.query.to ? { $lte: new Date(req.query.to) } : {})
            }
          }
        : {})
    };

    const [items, total] = await Promise.all([
      Task.find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Task.countDocuments(filter)
    ]);

    res.json({
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      items
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const item = await Task.findById(req.params.id);
    if (!item || item.deletedAt !== null) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch {
    res.status(404).json({ error: "Not found" });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const body = { ...req.body };

    // đồng bộ completedAt theo status
    if (body.status === "done") body.completedAt = new Date();
    if (body.status === "open") body.completedAt = null;

    // nếu đổi title thì cập nhật normalizedTitle
    if (typeof body.title === "string") {
      const removeAccents = (s = "") => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const normalizeTitle = (t = "") => removeAccents(t).trim().toLowerCase().replace(/\s+/g, " ");
      body.normalizedTitle = normalizeTitle(body.title);
    }

    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: body },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Trùng (title + dueAt) đối với bản chưa xoá" });
    }
    res.status(400).json({ error: err.message });
  }
};

exports.softDeleteTask = async (req, res) => {
  try {
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Thống kê open/done theo tháng (12 tháng gần nhất)
exports.statsMonthly = async (_req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setMonth(start.getMonth() - 11);
    start.setDate(1); start.setHours(0,0,0,0);

    const stats = await Task.aggregate([
      { $match: { deletedAt: null, createdAt: { $gte: start } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, status: "$status" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: { y: "$_id.y", m: "$_id.m" },
          open: { $sum: { $cond: [{ $eq: ["$_id.status", "open"] }, "$count", 0] } },
          done: { $sum: { $cond: [{ $eq: ["$_id.status", "done"] }, "$count", 0] } }
        }
      },
      { $sort: { "_id.y": 1, "_id.m": 1 } }
    ]);

    res.json(stats);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
