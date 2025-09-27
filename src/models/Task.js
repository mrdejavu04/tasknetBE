const mongoose = require("mongoose");

const removeAccents = (s = "") =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
const normalizeTitle = (title = "") =>
  removeAccents(title).trim().toLowerCase().replace(/\s+/g, " ");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, minlength: 1, maxlength: 120, trim: true },
    normalizedTitle: { type: String, required: true },
    note: { type: String, maxlength: 2000, default: "" },

    status: { type: String, enum: ["open", "done"], default: "open", index: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    tags: { type: [String], default: [] },

    dueAt: { type: Date },
    remindAt: { type: Date },
    repeat: { type: String, default: null }, // có thể để 'daily', 'weekly' hoặc RRULE string

    attachments: [{ name: String, url: String, size: Number }],

    completedAt: { type: Date },
    deletedAt: { type: Date, default: null } // soft delete
  },
  { timestamps: true }
);

// Tự chuẩn hóa tiêu đề và set completedAt theo status
TaskSchema.pre("validate", function (next) {
  if (this.title) this.normalizedTitle = normalizeTitle(this.title);
  if (this.status === "done" && !this.completedAt) this.completedAt = new Date();
  if (this.status === "open") this.completedAt = null;
  next();
});

/** Indexes:
 * - Lọc theo trạng thái & deadline
 * - Phân trang theo thời gian tạo
 * - Tìm theo tag
 * - Unique chống trùng theo (normalizedTitle + dueAt) với điều kiện chưa xoá
 */
TaskSchema.index({ status: 1, dueAt: 1 });
TaskSchema.index({ createdAt: -1, _id: -1 });
TaskSchema.index({ tags: 1 });
TaskSchema.index(
  { normalizedTitle: 1, dueAt: 1 },
  { unique: true, partialFilterExpression: { deletedAt: null } }
);

module.exports = mongoose.model("Task", TaskSchema);