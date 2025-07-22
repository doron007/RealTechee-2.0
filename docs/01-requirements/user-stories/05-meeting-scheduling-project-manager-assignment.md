# User Story 05: Meeting Scheduling & Project Manager Assignment

## 📋 Story Overview

**As an** Account Executive (AE)  
**I want to** schedule in-person or virtual visits with project managers and send meeting confirmations  
**So that** properties can be properly assessed and clients receive professional consultation  

---

## 🎯 Acceptance Criteria

### Primary Flow
1. **AE reviews meeting request** from original customer submission
2. **AE validates and updates meeting details** including date, time, and meeting type
3. **AE assigns project manager** from available PM list filtered by role and availability
4. **AE confirms meeting schedule** and triggers meeting confirmation notifications
5. **System sends notifications** to customer (agent/homeowner) and assigned project manager
6. **Meeting status tracking** updates request status and creates task for project manager

### Meeting Management Requirements
- [ ] Meeting type selection (in-person, virtual, either)
- [ ] Date and time picker with business hours validation
- [ ] Time zone handling for different locations
- [ ] Meeting duration estimation based on property type and project scope
- [ ] Rescheduling capability with notification to all parties
- [ ] Meeting cancellation with reason tracking and notifications

### Project Manager Assignment Requirements
- [ ] PM selection from `BackOfficeAssignTo` table filtered by role
- [ ] PM availability checking (basic scheduling conflict detection)
- [ ] PM expertise matching based on project type and requirements
- [ ] Backup PM assignment for primary PM unavailability
- [ ] PM workload balancing and capacity management
- [ ] PM notification with meeting details and property information

### Meeting Confirmation System Requirements
- [ ] Automated meeting confirmation emails to all parties
- [ ] Meeting confirmation SMS for customers who prefer text
- [ ] Calendar integration (ICS file generation) for easy calendar addition
- [ ] Meeting reminder notifications (24 hours and 2 hours before)
- [ ] Meeting link generation for virtual meetings (Zoom, Teams, etc.)
- [ ] Meeting preparation checklist for project managers

### Status and Task Management Requirements
- [ ] Request status automatically updates to "Pending walk-thru"
- [ ] Task creation for assigned project manager with meeting details
- [ ] Task includes property information, customer details, and project scope
- [ ] Task deadline tracking and escalation for overdue meetings
- [ ] Meeting completion tracking and follow-up task creation
- [ ] Integration with project manager dashboard and task list

---

## 🧪 Test Suite Requirements

### Meeting Scheduling Tests
```typescript
// Test File: e2e/tests/admin/requests/meeting-scheduling.spec.js
describe('Meeting Scheduling & PM Assignment', () => {
  
  // Happy Path Tests
  test('AE schedules in-person meeting with PM assignment', async () => {
    // Login as AE and navigate to request detail
    // Review original meeting request from customer
    // Update meeting date and time using date picker
    // Select 'in-person' meeting type
    // Choose project manager from filtered dropdown
    // Confirm meeting schedule
    // Verify meeting confirmation notifications sent
    // Check request status updated to "Pending walk-thru"
  });
  
  test('AE schedules virtual meeting with calendar integration', async () => {
    // Set up virtual meeting
    // Select date and time
    // Assign available project manager
    // Generate virtual meeting link
    // Send calendar invitations to all parties
    // Verify ICS file generation and email attachments
  });
  
  test('PM assignment with expertise matching', async () => {
    // Select project requiring specific expertise
    // Open PM assignment dropdown
    // Verify PMs filtered by relevant expertise
    // Assign PM with matching skills
    // Check PM receives detailed project briefing
  });
  
  test('Meeting rescheduling workflow', async () => {
    // Schedule initial meeting
    // Reschedule due to availability conflict
    // Update all parties with new time
    // Verify original calendar entries are cancelled
    // Check new calendar invitations sent
  });
  
  test('Business hours and time zone validation', async () => {
    // Attempt to schedule meeting outside business hours
    // Verify validation error and suggested times
    // Test time zone handling for different locations
    // Validate weekend and holiday restrictions
  });
  
  // PM Assignment Tests
  test('PM availability checking and conflict detection', async () => {
    // View PM availability calendar
    // Attempt to assign PM with existing meeting conflict
    // Verify conflict warning displayed
    // Test backup PM assignment suggestion
    // Check workload balancing recommendations
  });
  
  test('PM notification with meeting details', async () => {
    // Assign PM to meeting
    // Verify PM receives comprehensive notification
    // Check notification includes property details
    // Verify customer contact information included
    // Test project scope and preparation checklist
  });
  
  test('PM dropdown filtering by role and status', async () => {
    // Open PM assignment dropdown
    // Verify only active PMs displayed
    // Check role filtering for project managers
    // Test PM expertise tags and specializations
    // Verify PM contact information accessibility
  });
  
  // Notification System Tests
  test('Meeting confirmation email generation', async () => {
    // Schedule meeting and trigger confirmations
    // Verify customer receives meeting confirmation email
    // Check email includes all meeting details
    // Test calendar attachment (ICS file) inclusion
    // Verify meeting preparation instructions
  });
  
  test('Meeting reminder notifications', async () => {
    // Schedule meeting for future date
    // Set up reminder notification testing
    // Verify 24-hour reminder sent to all parties
    // Check 2-hour reminder notifications
    // Test reminder customization based on meeting type
  });
  
  test('Virtual meeting link generation', async () => {
    // Schedule virtual meeting
    // Verify virtual meeting platform integration
    // Check meeting link generation and distribution
    // Test meeting access instructions
    // Verify backup dial-in numbers provided
  });
  
  // Edge Case Tests
  test('Meeting scheduling with no available PMs', async () => {
    // Attempt to schedule when all PMs unavailable
    // Verify appropriate warning message
    // Test escalation to admin for PM assignment
    // Check waitlist functionality if implemented
  });
  
  test('Last-minute meeting changes and cancellations', async () => {
    // Schedule meeting close to current time
    // Test emergency rescheduling procedures
    // Cancel meeting with short notice
    // Verify emergency notification protocols
    // Test customer communication for urgent changes
  });
  
  test('Meeting scheduling across time zones', async () => {
    // Customer in different time zone than PM
    // Schedule meeting with time zone considerations
    // Verify all parties receive correct local times
    // Test daylight saving time transitions
    // Check international meeting scheduling
  });
})
```

### Integration and Workflow Tests
```typescript
// Test File: e2e/tests/integration/meeting-workflow-integration.spec.js
describe('Meeting Workflow Integration', () => {
  
  test('End-to-end meeting scheduling workflow', async () => {
    // Customer submits request with meeting preference
    // AE receives notification and reviews request
    // AE validates meeting details and assigns PM
    // System sends confirmations to all parties
    // PM receives task with meeting preparation info
    // Meeting completion triggers follow-up workflow
  });
  
  test('Meeting impact on request status progression', async () => {
    // Start with "New" request status
    // Schedule meeting
    // Verify status changes to "Pending walk-thru"
    // Complete meeting (PM marks as done)
    // Check status progression to next workflow stage
  });
  
  test('PM task management integration', async () => {
    // Assign PM to meeting
    // Verify task appears in PM dashboard
    // Check task includes all necessary information
    // Test task completion and follow-up creation
    // Verify task escalation for overdue meetings
  });
  
  test('Calendar integration across platforms', async () => {
    // Schedule meeting with calendar integration
    // Test Outlook calendar compatibility
    // Verify Google Calendar integration
    // Check mobile calendar app compatibility
    // Test calendar update and cancellation handling
  });
})
```

### Performance and Load Tests
```typescript
// Test File: e2e/tests/performance/meeting-scheduling-performance.spec.js
describe('Meeting Scheduling Performance', () => {
  
  test('PM availability checking performance', async () => {
    // Load PM availability data
    // Measure calendar loading time
    // Test with large number of scheduled meetings
    // Verify conflict detection speed
    // Check scalability with multiple PMs
  });
  
  test('Notification delivery performance', async () => {
    // Schedule multiple meetings simultaneously
    // Measure notification generation time
    // Test email delivery speed
    // Verify SMS notification performance
    // Check calendar invitation processing time
  });
  
  test('Meeting scheduling under load', async () => {
    // Simulate multiple AEs scheduling simultaneously
    // Test PM assignment conflict resolution
    // Verify database locking and transaction handling
    // Check system stability under peak load
  });
})
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] **Meeting scheduling time**: <2 minutes average for complete scheduling
- [ ] **PM availability check**: <3 seconds for conflict detection
- [ ] **Notification delivery**: <30 seconds for meeting confirmations
- [ ] **Calendar integration**: <5 seconds for ICS file generation
- [ ] **System error rate**: <0.5% of scheduling operations fail

### Business Metrics
- [ ] **Meeting completion rate**: >90% of scheduled meetings completed
- [ ] **Customer satisfaction**: >4.5/5 rating for meeting scheduling experience
- [ ] **PM utilization**: 80% optimal capacity utilization across all PMs
- [ ] **Meeting punctuality**: >95% of meetings start within 15 minutes of scheduled time
- [ ] **Follow-up conversion**: 85% of completed meetings progress to quote stage

### User Experience Metrics
- [ ] **AE scheduling efficiency**: 50% reduction in time to schedule meetings
- [ ] **Customer convenience**: >4.0/5 rating for meeting confirmation process
- [ ] **PM satisfaction**: >4.5/5 rating for meeting preparation information quality
- [ ] **Rescheduling frequency**: <10% of meetings require rescheduling
- [ ] **No-show rate**: <5% of scheduled meetings result in customer no-shows

---

## 🔧 Implementation Details

### Meeting Data Structure
```typescript
interface MeetingSchedule {
  meetingId: string;
  requestId: string;               // Parent request
  
  // Meeting details
  meetingType: 'in-person' | 'virtual' | 'hybrid';
  scheduledDate: Date;
  scheduledTime: string;           // HH:MM format
  duration: number;                // Minutes
  timeZone: string;                // IANA timezone
  
  // Location details
  meetingAddress?: string;         // For in-person meetings
  virtualMeetingLink?: string;     // For virtual meetings
  virtualMeetingId?: string;       // Meeting ID/PIN
  virtualPlatform?: 'zoom' | 'teams' | 'meet' | 'other';
  
  // Assignment details
  assignedProjectManager: string;  // BackOfficeAssignTo ID
  assignedBy: string;              // AE who made assignment
  assignedAt: Date;
  
  // Customer information
  customerContacts: string[];      // Contact IDs for attendees
  customerPreferences: {
    preferredTimeSlots: string[];
    communicationMethod: 'email' | 'phone' | 'text';
    specialRequirements?: string;
  };
  
  // Meeting preparation
  propertyDetails: {
    propertyType: string;
    projectScope: string;
    estimatedDuration: number;
    specialConsiderations?: string;
  };
  
  // Status tracking
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'rescheduled';
  confirmationSent: Date;
  remindersSent: Date[];
  
  // Follow-up information
  meetingNotes?: string;
  completedAt?: Date;
  followUpTasks?: string[];
  nextSteps?: string;
  
  // System fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
}

interface ProjectManagerTask {
  taskId: string;
  meetingId: string;
  assignedTo: string;              // PM BackOfficeAssignTo ID
  
  // Task details
  title: string;                   // "Property Assessment Meeting - [Address]"
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'meeting' | 'assessment' | 'follow-up';
  
  // Deadline tracking
  dueDate: Date;
  estimatedDuration: number;       // Minutes
  
  // Meeting context
  customerInfo: {
    primaryContact: string;
    secondaryContacts?: string[];
    propertyAddress: string;
    projectType: string;
    budget?: string;
  };
  
  // Preparation checklist
  preparationItems: {
    item: string;
    completed: boolean;
    completedAt?: Date;
  }[];
  
  // Status and completion
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  startedAt?: Date;
  completedAt?: Date;
  completionNotes?: string;
  
  // Follow-up
  followUpRequired: boolean;
  followUpTasks?: string[];
  nextMeetingRequired?: boolean;
}
```

### PM Availability and Assignment Logic
```typescript
interface PMAvailabilityService {
  // Check PM availability for specific time slot
  checkAvailability(
    pmId: string,
    date: Date,
    duration: number,
    timeZone: string
  ): Promise<AvailabilityResult>;
  
  // Get available PMs for time slot
  getAvailablePMs(
    date: Date,
    duration: number,
    requiredExpertise?: string[],
    location?: string
  ): Promise<AvailablePM[]>;
  
  // Get PM workload and capacity
  getPMWorkload(
    pmId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WorkloadSummary>;
  
  // Find optimal meeting time
  findOptimalMeetingTime(
    customerPreferences: TimePreference[],
    pmConstraints: PMConstraint[],
    duration: number
  ): Promise<OptimalTimeSlot[]>;
}

interface AvailabilityResult {
  available: boolean;
  conflicts?: MeetingConflict[];
  suggestedAlternatives?: TimeSlot[];
  workloadWarning?: boolean;
  capacity: number;              // 0-100% current capacity
}

interface AvailablePM {
  pmId: string;
  name: string;
  email: string;
  phone: string;
  expertise: string[];
  currentCapacity: number;
  rating: number;
  location?: string;
  travelRadius?: number;
  availability: TimeSlot[];
}

interface MeetingConflict {
  conflictType: 'meeting' | 'travel' | 'break' | 'vacation';
  startTime: Date;
  endTime: Date;
  description: string;
  severity: 'minor' | 'major' | 'blocking';
}
```

### API Endpoints
```typescript
// GET /api/admin/meetings/availability
{
  method: 'GET',
  authentication: 'admin|ae',
  query: {
    date: string,
    duration: number,
    timeZone?: string,
    expertise?: string[],
    location?: string
  },
  response: {
    availablePMs: AvailablePM[],
    suggestedTimes: TimeSlot[],
    conflictWarnings: ConflictWarning[]
  }
}

// POST /api/admin/meetings/schedule
{
  method: 'POST',
  authentication: 'admin|ae',
  body: {
    requestId: string,
    meetingDetails: Partial<MeetingSchedule>,
    pmId: string,
    sendConfirmations: boolean
  },
  response: {
    success: boolean,
    meetingId: string,
    confirmationsSent: string[],
    calendarLinks: CalendarLink[],
    taskCreated: boolean
  }
}

// PUT /api/admin/meetings/{id}/reschedule
{
  method: 'PUT',
  authentication: 'admin|ae|pm',
  body: {
    newDate: Date,
    newTime: string,
    reason: string,
    notifyParties: boolean
  },
  response: {
    success: boolean,
    updatedMeeting: MeetingSchedule,
    notificationsSent: string[]
  }
}

// POST /api/admin/meetings/{id}/confirm
{
  method: 'POST',
  authentication: 'admin|ae|pm',
  body: {
    confirmationType: 'attendance' | 'completion',
    notes?: string,
    followUpRequired?: boolean
  },
  response: {
    success: boolean,
    taskUpdated: boolean,
    followUpTasks: string[]
  }
}

// GET /api/admin/project-managers/tasks
{
  method: 'GET',
  authentication: 'pm|admin',
  query: {
    pmId?: string,
    status?: string,
    dueDateStart?: string,
    dueDateEnd?: string
  },
  response: {
    tasks: ProjectManagerTask[],
    summary: {
      pending: number,
      inProgress: number,
      overdue: number,
      completed: number
    }
  }
}
```

---

## 🚨 Risk Mitigation

### Potential Issues
- [ ] **Double-booking conflicts**: Real-time availability checking and conflict resolution
- [ ] **Time zone confusion**: Clear time zone display and automatic conversion
- [ ] **No-shows and cancellations**: Confirmation reminders and cancellation policies
- [ ] **PM capacity overload**: Workload monitoring and capacity management
- [ ] **Virtual meeting technical issues**: Backup communication methods and technical support

### Communication Risks
- [ ] **Notification failures**: Multiple communication channels and confirmation tracking
- [ ] **Miscommunication of details**: Standardized meeting confirmation templates
- [ ] **Language barriers**: Multi-language support and interpreter coordination
- [ ] **Accessibility requirements**: ADA compliance and accommodation arrangements
- [ ] **Emergency rescheduling**: Escalation procedures and emergency contact protocols

### Business Continuity
- [ ] **PM unavailability**: Backup PM assignment and emergency coverage
- [ ] **System downtime**: Offline scheduling procedures and manual backup
- [ ] **Peak demand periods**: Capacity planning and overflow management
- [ ] **Quality assurance**: Meeting outcome tracking and performance monitoring
- [ ] **Customer satisfaction**: Feedback collection and continuous improvement

---

## 🎯 Definition of Done

### Technical Requirements
- [ ] Meeting scheduling interface integrated into request detail page
- [ ] PM assignment dropdown with role filtering and availability checking
- [ ] Meeting confirmation notification system implemented
- [ ] Calendar integration (ICS file generation) working
- [ ] Virtual meeting link generation integrated
- [ ] PM task creation and management system functional
- [ ] Status update automation implemented

### Quality Requirements
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness tested for scheduling interface
- [ ] Time zone handling tested across multiple regions
- [ ] Load testing completed for peak scheduling periods
- [ ] Security testing completed for PM assignment and notifications
- [ ] User acceptance testing completed with AEs and PMs

### Documentation Requirements
- [ ] User guide updated with meeting scheduling procedures
- [ ] PM handbook updated with task management workflow
- [ ] API documentation completed for all meeting endpoints
- [ ] Integration guide for calendar systems
- [ ] Troubleshooting guide for common scheduling issues

---

## 📋 Dependencies & Integration Points

### System Dependencies
- [ ] **BackOfficeAssignTo table**: PM data and role filtering
- [ ] **Requests table**: Parent request and status updates
- [ ] **Notification system**: Meeting confirmations and reminders
- [ ] **Calendar integration**: ICS file generation and email attachments
- [ ] **Virtual meeting platforms**: Zoom/Teams API integration

### Integration Requirements
- [ ] **Request detail page**: Meeting scheduling interface integration
- [ ] **PM dashboard**: Task display and management interface
- [ ] **Admin dashboard**: Meeting overview and management tools
- [ ] **Customer portal**: Meeting confirmation and rescheduling (future)
- [ ] **Audit logging**: Meeting scheduling and status change tracking

---

**Priority**: 🔴 **CRITICAL**  
**Story Points**: **8**  
**Dependencies**: PM role filtering, Notification system, Calendar integration  
**Estimated Duration**: **1-2 weeks**  

---

*This user story enables the critical property assessment workflow and ensures proper coordination between AEs, PMs, and customers for successful project initiation.*