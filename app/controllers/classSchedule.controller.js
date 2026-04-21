import axios from 'axios';
import db from "../models/index.js";

const User = db.user;

/**
 * Fetch student class schedule from OC API
 * Route: GET /api/class-schedule/:userId/:termCode
 */
export const getClassSchedule = async (req, res) => {
  try {
    const { userId, termCode } = req.params;
    
    console.log(`📚 Fetching class schedule for user ${userId}, term ${termCode}`);
    
    // Get the user from database to find their student ID or email
    const user = await User.findOne({ where: { id: userId } });
    
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }
    
    // Use studentId if available, otherwise use email
    const ocUserId = user.studentId || user.email;
    
    if (!ocUserId) {
      return res.status(400).send({ 
        message: "User does not have a student ID or email in the system" 
      });
    }
    
    console.log(`🔍 Querying OC API with userId: ${ocUserId}, term: ${termCode}`);
    
    // Call OC API
    const ocApiUrl = `https://stingray.oc.edu/api/accommodationuserschedule/${ocUserId}/${termCode}`;
    
    try {
      const response = await axios.get(ocApiUrl, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
        }
      });
      
      console.log(`✅ Successfully fetched schedule for ${ocUserId}`);
      
      // Check if the API returned success
      if (response.data && response.data.Success === "True") {
        
        // Transform OC API data to frontend format
        const courses = response.data.Courses || [];
        
        const schedule = courses.map(course => ({
          title: course.CourseName,
          courseNumber: course.CourseID,
          instructors: course.Instructors.map(i => ({
            name: i.Name,
            email: i.Email
          })),
          startDate: course.start_date,
          endDate: course.end_date,
          meetingTimes: course.meeting_times.map(mt => ({
            days: mt.days.join(''),  // Convert ["M","W","F"] to "MWF"
            startTime: mt.start_time,
            endTime: mt.end_time
          }))
        }));
        
        return res.send({
          success: true,
          schedule: schedule,  // Frontend expects "schedule" key
          queriedWith: ocUserId,
          termCode: termCode
        });
      } else {
        console.log(`⚠️ OC API returned unsuccessful response for ${ocUserId}`);
        return res.status(404).send({
          success: false,
          message: "No schedule found for this student in the specified term",
          queriedWith: ocUserId,
          termCode: termCode
        });
      }
      
    } catch (apiError) {
      console.error(`❌ Error calling OC API:`, apiError.message);
      
      if (apiError.code === 'ECONNABORTED') {
        return res.status(504).send({
          success: false,
          message: "Request to OC API timed out"
        });
      }
      
      if (apiError.response) {
        // OC API returned an error response
        return res.status(apiError.response.status).send({
          success: false,
          message: "OC API returned an error",
          error: apiError.response.data
        });
      }
      
      // Network or other error
      return res.status(500).send({
        success: false,
        message: "Failed to fetch schedule from OC API",
        error: apiError.message
      });
    }
    
  } catch (err) {
    console.error("❌ Error in getClassSchedule:", err);
    res.status(500).send({
      success: false,
      message: "Error fetching class schedule",
      error: err.message
    });
  }
};

/**
 * Get available term codes
 * Returns current and recent terms
 */
export const getAvailableTerms = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    
    const terms = [
      { code: `${currentYear}SP`, label: `Spring ${currentYear}` },
      { code: `${currentYear}SU`, label: `Summer ${currentYear}` },
      { code: `${currentYear}FA`, label: `Fall ${currentYear}` },
      { code: `${currentYear - 1}FA`, label: `Fall ${currentYear - 1}` },
      { code: `${currentYear - 1}SU`, label: `Summer ${currentYear - 1}` },
      { code: `${currentYear - 1}SP`, label: `Spring ${currentYear - 1}` },
    ];
    
    res.send({
      success: true,
      terms: terms
    });
    
  } catch (err) {
    console.error("❌ Error in getAvailableTerms:", err);
    res.status(500).send({
      success: false,
      message: "Error fetching available terms"
    });
  }
};