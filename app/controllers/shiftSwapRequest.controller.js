import db from "../models/index.js";

const ShiftSwapRequest = db.shiftSwapRequest;
const ShiftSwapRequestUser = db.shiftSwapRequestUser;
const { Op } = db.Sequelize;

// Create and Save a new Shift Swap Request
export const create = async (req, res) => {
  try {
    console.log("Creating shift swap request with data:", req.body);
    
    if (!req.body.originalShiftId) {
      return res.status(400).send({ message: "Original shift ID is required!" });
    }
    
    // Create shift swap request
    const swapRequest = await ShiftSwapRequest.create({
      originalShiftId: req.body.originalShiftId,
      status: 'pending',
      reason: req.body.reason || null,
      createdAt: Date.now(),
      approvedBy: null,
      approvedAt: null
    });
    
    // Create entry in junction table for requesting user
    if (req.user.id) {
      await ShiftSwapRequestUser.create({
        swapId: swapRequest.id,
        userId: req.user.id,
        requestingUserId: req.user.id,
        acceptingUserId: null,
        status: 'pending'
      });
    }
    
    console.log("Shift swap request created with ID:", swapRequest.id);
    res.status(201).send(swapRequest);
    
  } catch (err) {
    console.error("Error creating shift swap request:", err.message);
    res.status(500).send({
      message: err.message || "Error creating shift swap request.",
      error: err.message
    });
  }
};

// Retrieve all Shift Swap Requests with optional filters
export const findAll = async (req, res) => {
  try {
    const { status } = req.query;
    
    let condition = {};
    
    if (status) {
      condition.status = status;
    }
    
    const swapRequests = await ShiftSwapRequest.findAll({ where: condition });
    res.send(swapRequests);
  } catch (err) {
    console.error("Error retrieving shift swap requests:", err);
    res.status(500).send({ message: "Error retrieving shift swap requests." });
  }
};

// Find one Shift Swap Request by ID
export const findOne = async (req, res) => {
  try {
    const id = req.params.id;
    const swapRequest = await ShiftSwapRequest.findByPk(id);
    if (!swapRequest)
      return res.status(404).send({ message: `Shift swap request not found with id=${id}` });
    res.send(swapRequest);
  } catch (err) {
    console.error("Error retrieving shift swap request:", err);
    res.status(500).send({ message: "Error retrieving shift swap request." });
  }
};

// Update a Shift Swap Request
export const update = async (req, res) => {
  try {
    const id = req.params.id;
    
    const [updated] = await ShiftSwapRequest.update(req.body, { where: { id: id } });
    if (updated === 1)
      res.send({ message: "Shift swap request updated successfully." });
    else
      res.status(404).send({ message: `Shift swap request not found or no data changed.` });
  } catch (err) {
    console.error("Error updating shift swap request:", err);
    res.status(500).send({ message: "Error updating shift swap request." });
  }
};

// Delete a Shift Swap Request
export const remove = async (req, res) => {
  try {
    const id = req.params.id;
    
    console.log(`Deleting shift swap request ${id}...`);
    
    const swapRequest = await ShiftSwapRequest.findByPk(id);
    if (!swapRequest) {
      return res.status(404).send({ message: `Shift swap request not found.` });
    }
    
    const deleted = await ShiftSwapRequest.destroy({ where: { id: id } });
    
    if (deleted) {
      console.log('Shift swap request deleted successfully');
      return res.send({ message: "Shift swap request deleted successfully." });
    }
    
    return res.status(404).send({ message: `Shift swap request not found.` });
    
  } catch (err) {
    console.error('Error deleting shift swap request:', err);
    res.status(500).send({ 
      message: err.message || "Error deleting shift swap request." 
    });
  }
};

// Accept a Shift Swap Request (employee accepts)
export const accept = async (req, res) => {
  try {
    const id = req.params.id;
    const { acceptingUserId } = req.body;
    
    if (!acceptingUserId) {
      return res.status(400).send({ message: "Accepting user ID is required!" });
    }
    
    const swapRequest = await ShiftSwapRequest.findByPk(id);
    if (!swapRequest) {
      return res.status(404).send({ message: `Shift swap request not found.` });
    }
    
    if (swapRequest.status !== 'pending') {
      return res.status(400).send({ message: "Request has already been processed." });
    }
    
    // Update swap request status
    await swapRequest.update({
      status: 'accepted'
    });
    
    // Update junction table
    await ShiftSwapRequestUser.update(
      { 
        acceptingUserId: acceptingUserId,
        status: 'accepted'
      },
      { 
        where: { swapId: id } 
      }
    );
    
    res.send({ message: "Shift swap request accepted. Awaiting manager approval.", swapRequest });
    
  } catch (err) {
    console.error('Error accepting shift swap request:', err);
    res.status(500).send({ 
      message: err.message || "Error accepting shift swap request." 
    });
  }
};

// Approve a Shift Swap Request (manager/admin approves)
export const approve = async (req, res) => {
  try {
    const id = req.params.id;
    
    const swapRequest = await ShiftSwapRequest.findByPk(id);
    if (!swapRequest) {
      return res.status(404).send({ message: `Shift swap request not found.` });
    }
    
    if (swapRequest.status !== 'accepted') {
      return res.status(400).send({ message: "Request must be accepted by another employee first." });
    }
    
    await swapRequest.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: Date.now()
    });
    
    res.send({ message: "Shift swap request approved successfully.", swapRequest });
    
  } catch (err) {
    console.error('Error approving shift swap request:', err);
    res.status(500).send({ 
      message: err.message || "Error approving shift swap request." 
    });
  }
};

// Reject a Shift Swap Request
export const reject = async (req, res) => {
  try {
    const id = req.params.id;
    
    const swapRequest = await ShiftSwapRequest.findByPk(id);
    if (!swapRequest) {
      return res.status(404).send({ message: `Shift swap request not found.` });
    }
    
    await swapRequest.update({
      status: 'rejected',
      approvedBy: req.user.id,
      approvedAt: Date.now()
    });
    
    res.send({ message: "Shift swap request rejected.", swapRequest });
    
  } catch (err) {
    console.error('Error rejecting shift swap request:', err);
    res.status(500).send({ 
      message: err.message || "Error rejecting shift swap request." 
    });
  }
};

// Cancel a Shift Swap Request (original requester cancels)
export const cancel = async (req, res) => {
  try {
    const id = req.params.id;
    
    const swapRequest = await ShiftSwapRequest.findByPk(id);
    if (!swapRequest) {
      return res.status(404).send({ message: `Shift swap request not found.` });
    }
    
    if (swapRequest.status === 'approved') {
      return res.status(400).send({ message: "Cannot cancel an approved request." });
    }
    
    await swapRequest.update({
      status: 'cancelled'
    });
    
    res.send({ message: "Shift swap request cancelled.", swapRequest });
    
  } catch (err) {
    console.error('Error cancelling shift swap request:', err);
    res.status(500).send({ 
      message: err.message || "Error cancelling shift swap request." 
    });
  }
};

// Get all pending swap requests
export const findPending = async (req, res) => {
  try {
    const swapRequests = await ShiftSwapRequest.findAll({ 
      where: { status: 'pending' }
    });
    res.send(swapRequests);
  } catch (err) {
    console.error("Error retrieving pending shift swap requests:", err);
    res.status(500).send({ message: "Error retrieving pending shift swap requests." });
  }
};