import fs from 'fs';
import path from 'path';

// Define logs directory relative to src folder
const logFilePath = path.join(__dirname, '../../logs/audit.log');

// Ensure log directory exists
const logDir = path.dirname(logFilePath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

export const auditLog = (
  userId: string | 'SYSTEM',
  action: string,
  resourceType: string,
  resourceId: string,
  details?: object
) => {
  const timestamp = new Date().toISOString();
  
  const logMessage = `[${timestamp}] User:${userId} | Action:${action} | Resource:${resourceType}(${resourceId}) | Details:${JSON.stringify(details || {})}\n`;

  // Output to console for visibility
  console.log(`[AUDIT] ${action} on ${resourceType} by User ${userId}`);

  // Append to log file
  fs.appendFile(logFilePath, logMessage, (err) => {
    if (err) {
      console.error('Failed to write to audit log', err);
    }
  });
};
