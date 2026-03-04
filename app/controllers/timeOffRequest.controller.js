import db from "../models/index.js";

const TimeOffRequest = db.timeOffRequest;
const { Op } = db.Sequelize;

// Create and Save a new Time Off Request
export const create = async (req, res) => {
  try {
    console.log("Creating time off request with data:", req.body);
    
    if (!req.body.startDate || !req.body.endDate) {
      return res.status(400).send({ message: "Start date and end date are required!" });
    }
    
    // Validate that end date is after start date
    if (parseInt(req.body.endDate) < parseInt(req.body.startDate)) {
      return res.status(400).send({ message: "End date must be after start date!" });
    }
    
    // Create time off request
    const request = await TimeOffRequest.create({
      userId: req.user.id, // From authentication middleware
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      reason: req.body.reason || null,
      status: 'pending',
      createdAt: Date.now(),
      approvedBy: null,
      approvedAt: null
    });
    
    console.log("Time off request created with ID:", request.id);
    res.status(201).send(request);
    
  } catch (err) {
    console.error("Error creating time off request:", err.message);
    res.status(500).send({
      message: err.message || "Error creating time off request.",
      error: err.message
    });
  }
};

// Retrieve all Time Off Requests with optional filters
export const findAll = async (req, res) => {
  try {
    const { userId, status } = req.query;
    
    let condition = {};
    
    if (userId) {
      condition.userId = userId;
    }
    
    if (status) {
      condition.status = status;
    }
    
    const requests = await TimeOffRequest.findAll({
      where: condition,
      include: [
        {
          model: db.user,
          as: 'employee',
          attributes: ['id', 'fName', 'lName']
        }
      ]
    });

    const result = requests.map(r => {
      const plain = r.get({ plain: true });
      const emp = plain.employee;
      return {
        ...plain,
        employeeName: emp ? `${emp.fName} ${emp.lName}` : 'Unknown',
      };
    });

    res.send(result);
  } catch (err) {
    console.error("Error retrieving time off requests:", err);
    res.status(500).send({ message: "Error retrieving time off requests." });
  }
};

// Find one Time Off Request by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const request = await TimeOffRequest.findByPk(id);
    if (!request)
      return res.status(404).send({ message: `Time off request not found with id=${id}` });
    res.send(request);
  } catch (err) {
    console.error("Error retrieving time off request:", err);
    res.status(500).send({ message: "Error retrieving time off request." });
  }
};

// Update a Time Off Request
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    const [updated] = await TimeOffRequest.update(req.body, { where: { id: id } });
    if (updated === 1)
      res.send({ message: "Time off request updated successfully." });
    else
      res.status(404).send({ message: `Time off request not found or no data changed.` });
  } catch (err) {
    console.error("Error updating time off request:", err);
    res.status(500).send({ message: "Error updating time off request." });
  }
};

// Delete a Time Off Request
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting time off request ${id}...`);
    
    const request = await TimeOffRequest.findByPk(id);
    if (!request) {
      return res.status(404).send({ message: `Time off request not found.` });
    }
    
    const deleted = await TimeOffRequest.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('Time off request deleted successfully');
      return res.send({ message: "Time off request deleted successfully." });
    }
    
    return res.status(404).send({ message: `Time off request not found.` });
    
  } catch (err) {
    console.error('Error deleting time off request:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting time off request." 
    });
  }
};

// Approve a Time Off Request
export const approve = async (req, res) => {
  try {
    const id = req.params.id;
    
    const request = await TimeOffRequest.findByPk(id);
    if (!request) {
      return res.status(404).send({ message: `Time off request not found.` });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).send({ message: "Request has already been processed." });
    }
    
    await request.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: Date.now()
    });
    
    res.send({ message: "Time off request approved successfully.", request });
    
  } catch (err) {
    console.error('Error approving time off request:', err);
    res.status(500).send({ 
      message: err.message || "Error approving time off request." 
    });
  }
};

// Deny a Time Off Request
export const deny = async (req, res) => {
  try {
    const id = req.params.id;
    
    const request = await TimeOffRequest.findByPk(id);
    if (!request) {
      return res.status(404).send({ message: `Time off request not found.` });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).send({ message: "Request has already been processed." });
    }
    
    await request.update({
      status: 'denied',
      approvedBy: req.user.id,
      approvedAt: Date.now()
    });
    
    res.send({ message: "Time off request denied.", request });
    
  } catch (err) {
    console.error('Error denying time off request:', err);
    res.status(500).send({ 
      message: err.message || "Error denying time off request." 
    });
  }
};

// Get all pending time off requests
export const findPending = async (req, res) => {
  try {
    const requests = await TimeOffRequest.findAll({ 
      where: { status: 'pending' }
    });
    res.send(requests);
  } catch (err) {
    console.error("Error retrieving pending time off requests:", err);
    res.status(500).send({ message: "Error retrieving pending time off requests." });
  }
};