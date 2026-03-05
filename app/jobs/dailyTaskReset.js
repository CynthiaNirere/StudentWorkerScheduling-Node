// ============================================
// DAILY TASK RESET CRON JOB
// Location: app/jobs/dailyTaskReset.js
// ============================================

import db from "../models/index.js";

const TaskList = db.taskList;
const TaskListItem = db.taskListItem;
const TaskCompletionHistory = db.taskCompletionHistory;
const Shift = db.shift;
const { Op } = db.Sequelize;

/**
 * Daily Task Reset Job
 * 
 * Runs at midnight (00:00) every day
 * 
 * 1. Archives completed tasks to history
 * 2. Resets completed tasks to 'pending' status
 * 3. Finds tomorrow's shifts
 * 4. Auto-assigns recurring tasks to those shifts
 */
export const resetDailyTasks = async () => {
  try {
    console.log("🔄 [CRON] Starting daily task reset...");
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTimestamp = today.getTime();
    
    // ===================================
    // STEP 1: Archive completed tasks
    // ===================================
    console.log("📦 [CRON] Archiving completed tasks...");
    
    const completedItems = await TaskListItem.findAll({
      where: { 
        status: 'completed',
        completedBy: { [Op.ne]: null }
      }
    });
    
    console.log(`Found ${completedItems.length} completed tasks to archive`);
    
    for (const item of completedItems) {
      await TaskCompletionHistory.create({
        taskListId: item.tasklistId,
        itemId: item.id,
        completedBy: item.completedBy,
        completedAt: item.completedAt || item.updatedAt || Date.now(),
        shiftId: item.shiftId,
        date: todayTimestamp,
        notes: null,
        createdAt: Date.now()
      });
    }
    
    console.log(`✅ [CRON] Archived ${completedItems.length} completed tasks to history`);
    
    // ===================================
    // STEP 2: Reset completed tasks
    // ===================================
    console.log("🔄 [CRON] Resetting completed tasks to pending...");
    
    await TaskListItem.update(
      { 
        status: 'pending', 
        completedBy: null,
        completedAt: null,
        updatedAt: Date.now()
      },
      { where: { status: 'completed' } }
    );
    
    console.log("✅ [CRON] Completed tasks reset to pending");
    
    // ===================================
    // STEP 3: Get tomorrow's shifts
    // ===================================
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = tomorrow.getTime();
    const tomorrowEnd = tomorrowStart + 24 * 60 * 60 * 1000;
    
    console.log(`📅 [CRON] Looking for shifts on ${tomorrow.toDateString()}...`);
    
    const tomorrowShifts = await Shift.findAll({
      where: {
        shiftTime: {
          [Op.gte]: tomorrowStart,
          [Op.lt]: tomorrowEnd
        },
        userId: { [Op.ne]: null } // Only shifts with assigned users
      }
    });
    
    console.log(`Found ${tomorrowShifts.length} shifts for tomorrow`);
    
    // ===================================
    // STEP 4: Auto-assign tasks
    // ===================================
    let totalAssigned = 0;
    
    for (const shift of tomorrowShifts) {
      const shiftType = determineShiftType(shift.startTime || shift.start_time);
      const jobRoleId = shift.jobRoleId || shift.job_role_id;
      const userId = shift.userId || shift.user_id;
      const shiftId = shift.id || shift.shift_id;
      
      console.log(`  Processing shift ${shiftId}: ${shiftType}, role ${jobRoleId}, user ${userId}`);
      
      // Find matching task templates
      const templates = await TaskList.findAll({
        where: {
          isTemplate: true,
          recursDaily: true,
          [Op.or]: [
            { shiftType: shiftType },
            { shiftType: 'all_day' }
          ],
          [Op.or]: [
            { jobRoleId: jobRoleId },
            { jobRoleId: null }
          ]
        }
      });
      
      console.log(`    Found ${templates.length} matching templates`);
      
      for (const template of templates) {
        // Get template items
        const templateItems = await TaskListItem.findAll({
          where: { 
            tasklistId: template.id,
            assignedDate: null // Only get the template items
          }
        });
        
        if (templateItems.length === 0) continue;
        
        // Create assignments for this shift
        const assignments = templateItems.map(item => ({
          tasklistId: template.id,
          title: item.title,
          description: item.description,
          assignedTo: userId,
          status: 'pending',
          completedBy: null,
          orderPosition: item.orderPosition,
          shiftId: shiftId,
          assignedDate: tomorrowStart,
          completedAt: null,
          createdAt: Date.now(),
          updatedAt: null
        }));
        
        await TaskListItem.bulkCreate(assignments);
        
        totalAssigned += assignments.length;
        console.log(`    ✅ Assigned ${assignments.length} tasks from "${template.title}"`);
      }
    }
    
    console.log(`\n✅ [CRON] Daily task reset completed!`);
    console.log(`   - Archived: ${completedItems.length} tasks`);
    console.log(`   - Processed: ${tomorrowShifts.length} shifts`);
    console.log(`   - Assigned: ${totalAssigned} new tasks`);
    
    return {
      success: true,
      archived: completedItems.length,
      shiftsProcessed: tomorrowShifts.length,
      tasksAssigned: totalAssigned
    };
    
  } catch (err) {
    console.error("❌ [CRON] Error in daily task reset:", err);
    throw err;
  }
};

/**
 * Determine shift type based on start time
 * @param {number} startTime - Minutes since midnight (0-1439)
 * @returns {string} - Shift type
 */
function determineShiftType(startTime) {
  if (typeof startTime !== 'number') {
    console.warn(`Invalid startTime: ${startTime}, defaulting to all_day`);
    return 'all_day';
  }
  
  const hour = Math.floor(startTime / 60);
  
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'closing';
}

// Export default
export default resetDailyTasks;