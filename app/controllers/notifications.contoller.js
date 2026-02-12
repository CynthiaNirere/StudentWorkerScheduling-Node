import Notification from "../models/notification.model.js";

// Create a new Notification
export const create = async (req, res) => {
  try {
    if (!req.body.userId || !req.body.type || !req.body.title) {
      return res.status(400).send({ message: "Required fields missing!" });
    }

    const notification = await Notification.create({
      userId: req.body.userId,
      type: req.body.type,
      title: req.body.title,
      description: req.body.description || null,
      isRead: 0,
      createdAt: Date.now(),
    });

    res.status(201).send(notification);
  } catch (err) {
    console.error("Error creating notification:", err.message);
    res.status(500).send({ message: err.message || "Error creating notification." });
  }
};

// Retrieve all Notifications
export const findAll = async (req, res) => {
  try {
    const notifications = await Notification.findAll();
    res.send(notifications);
  } catch (err) {
    console.error("Error retrieving notifications:", err);
    res.status(500).send({ message: "Error retrieving notifications." });
  }
};

// Find one Notification by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const notification = await Notification.findByPk(id);
    if (!notification)
      return res.status(404).send({ message: `Notification not found with id=${id}` });
    res.send(notification);
  } catch (err) {
    console.error("Error retrieving notification:", err);
    res.status(500).send({ message: "Error retrieving notification." });
  }
};

// Find by User
export const findByUser = async (req, res) => {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    res.send(notifications);
  } catch (err) {
    console.error("Error retrieving notifications by user:", err);
    res.status(500).send({ message: "Error retrieving notifications by user." });
  }
};

// Mark one as read
export const markAsRead = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Notification.update({ isRead: 1 }, { where: { id } });
    if (updated === 1)
      res.send({ message: "Notification marked as read." });
    else
      res.status(404).send({ message: "Notification not found." });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).send({ message: "Error marking notification as read." });
  }
};

// Mark all as read for a user
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.params.userId;
    await Notification.update({ isRead: 1 }, { where: { userId, isRead: 0 } });
    res.send({ message: "All notifications marked as read." });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).send({ message: "Error marking all notifications as read." });
  }
};

// Update a Notification
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    const [updated] = await Notification.update(req.body, { where: { id } });
    if (updated === 1)
      res.send({ message: "Notification updated successfully." });
    else
      res.status(404).send({ message: "Notification not found or no data changed." });
  } catch (err) {
    console.error("Error updating notification:", err);
    res.status(500).send({ message: "Error updating notification." });
  }
};

// Delete a Notification
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await Notification.destroy({ where: { id } });
    if (deleted)
      res.send({ message: "Notification deleted successfully." });
    else
      res.status(404).send({ message: "Notification not found." });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).send({ message: err.message || "Error deleting notification." });
  }
};