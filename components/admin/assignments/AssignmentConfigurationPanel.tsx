'use client';

import React, { useState, useEffect } from 'react';
import CardWrapper from '../common/CardWrapper';
import Button from '../../common/buttons/Button';
import { H2, H3 } from '../../typography';
import P2 from '../../typography/P2';
import { 
  flexibleAssignmentService, 
  RoleDefinition, 
  AssigneeProfile, 
  SkillRequirement, 
  Territory,
  RolePermissions,
  RoleAssignmentRules
} from '../../../services/admin/flexibleAssignmentService';
import {
  Tabs,
  Tab,
  Box,
  TextField,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Analytics as AnalyticsIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

interface AssignmentConfigurationPanelProps {
  onConfigurationChange?: (config: any) => void;
}

export default function AssignmentConfigurationPanel({ 
  onConfigurationChange 
}: AssignmentConfigurationPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Configuration data
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [assignees, setAssignees] = useState<AssigneeProfile[]>([]);
  const [skills, setSkills] = useState<SkillRequirement[]>([]);
  const [territories, setTerritories] = useState<Territory[]>([]);
  
  // Editing states
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);

  useEffect(() => {
    loadConfigurationData();
  }, []);

  const loadConfigurationData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const config = await flexibleAssignmentService.getRoleConfiguration();
      setRoles(config.roles);
      setAssignees(config.assignees);
      setSkills(config.skills);
      setTerritories(config.territories);
      
    } catch (err) {
      setError('Failed to load assignment configuration data');
      console.error('Configuration load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfiguration = async () => {
    try {
      setSaveStatus('saving');
      
      // In a real implementation, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate save
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      if (onConfigurationChange) {
        onConfigurationChange({ roles, assignees, skills, territories });
      }
      
    } catch (err) {
      setSaveStatus('error');
      setError('Failed to save configuration');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateRolePermissions = (roleId: string, permissions: Partial<RolePermissions>) => {
    setRoles(prev => prev.map(role => 
      role.id === roleId 
        ? { ...role, permissions: { ...role.permissions, ...permissions } }
        : role
    ));
  };

  const updateRoleAssignmentRules = (roleId: string, rules: Partial<RoleAssignmentRules>) => {
    setRoles(prev => prev.map(role => 
      role.id === roleId 
        ? { ...role, assignmentRules: { ...role.assignmentRules, ...rules } }
        : role
    ));
  };

  const updateAssigneeSkills = (assigneeId: string, skillUpdates: any) => {
    setAssignees(prev => prev.map(assignee => 
      assignee.id === assigneeId
        ? { ...assignee, ...skillUpdates }
        : assignee
    ));
  };

  if (loading) {
    return (
      <CardWrapper className="p-6">
        <H2 className="mb-4">Assignment Configuration</H2>
        <LinearProgress />
        <P2 className="mt-2 text-center">Loading configuration data...</P2>
      </CardWrapper>
    );
  }

  if (error) {
    return (
      <CardWrapper className="p-6">
        <H2 className="mb-4">Assignment Configuration</H2>
        <Alert severity="error" className="mb-4">{error}</Alert>
        <Button onClick={loadConfigurationData}>Retry</Button>
      </CardWrapper>
    );
  }

  return (
    <div className="space-y-6">
      <CardWrapper className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <H2 className="flex items-center gap-2">
              <SettingsIcon />
              Flexible Assignment Configuration
            </H2>
            <P2 className="text-gray-600 mt-1">
              Configure role-based assignment rules, skills, and territories
            </P2>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outlined" 
              onClick={loadConfigurationData}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button 
              onClick={handleSaveConfiguration}
              disabled={saveStatus === 'saving'}
              className={
                saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700' :
                saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' :
                ''
              }
            >
              {saveStatus === 'saving' && <LinearProgress className="mr-2 w-4 h-1" />}
              <SaveIcon className="mr-1" />
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'saved' ? 'Saved!' : 
               saveStatus === 'error' ? 'Error' : 'Save Configuration'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<AssignmentIcon />} label="Roles & Rules" />
          <Tab icon={<PersonIcon />} label="Assignees & Skills" />
          <Tab icon={<AnalyticsIcon />} label="Analytics & Testing" />
        </Tabs>

        {/* Tab 1: Roles & Assignment Rules */}
        {activeTab === 0 && (
          <Box className="mt-6">
            <H3 className="mb-4">Role-Based Assignment Rules</H3>
            
            <div className="space-y-4">
              {roles.map((role) => (
                <Accordion key={role.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div className="flex items-center justify-between w-full mr-4">
                      <div>
                        <strong>{role.title}</strong>
                        <div className="text-sm text-gray-600">
                          Max Assignments: {role.permissions.maxConcurrentAssignments} | 
                          Priority: {role.permissions.priorityLevel}/10 |
                          Method: {role.assignmentRules.assignmentMethod}
                        </div>
                      </div>
                      <Chip 
                        label={role.assignmentRules.enabled ? 'Enabled' : 'Disabled'}
                        color={role.assignmentRules.enabled ? 'success' : 'error'}
                        size="small"
                      />
                    </div>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Permissions Section */}
                      <div>
                        <Paper className="p-4">
                          <H3 className="text-base mb-3">Permissions</H3>
                          
                          <div className="space-y-3">
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={role.permissions.canReceiveRequests}
                                  onChange={(e) => updateRolePermissions(role.id, { 
                                    canReceiveRequests: e.target.checked 
                                  })}
                                />
                              }
                              label="Can receive requests"
                            />
                            
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={role.permissions.canReceiveMeetings}
                                  onChange={(e) => updateRolePermissions(role.id, { 
                                    canReceiveMeetings: e.target.checked 
                                  })}
                                />
                              }
                              label="Can receive meetings"
                            />
                            
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={role.permissions.canCreateQuotes}
                                  onChange={(e) => updateRolePermissions(role.id, { 
                                    canCreateQuotes: e.target.checked 
                                  })}
                                />
                              }
                              label="Can create quotes"
                            />
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Max Concurrent Assignments: {role.permissions.maxConcurrentAssignments}
                              </label>
                              <Slider
                                value={role.permissions.maxConcurrentAssignments}
                                onChange={(_, value) => updateRolePermissions(role.id, { 
                                  maxConcurrentAssignments: value as number 
                                })}
                                min={1}
                                max={50}
                                marks={[
                                  { value: 5, label: '5' },
                                  { value: 15, label: '15' },
                                  { value: 30, label: '30' }
                                ]}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Priority Level: {role.permissions.priorityLevel}/10
                              </label>
                              <Slider
                                value={role.permissions.priorityLevel}
                                onChange={(_, value) => updateRolePermissions(role.id, { 
                                  priorityLevel: value as number 
                                })}
                                min={1}
                                max={10}
                                marks
                              />
                            </div>
                          </div>
                        </Paper>
                      </div>
                      
                      {/* Assignment Rules Section */}
                      <div>
                        <Paper className="p-4">
                          <H3 className="text-base mb-3">Assignment Rules</H3>
                          
                          <div className="space-y-3">
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={role.assignmentRules.enabled}
                                  onChange={(e) => updateRoleAssignmentRules(role.id, { 
                                    enabled: e.target.checked 
                                  })}
                                />
                              }
                              label="Enable assignment for this role"
                            />
                            
                            <FormControl fullWidth>
                              <InputLabel>Assignment Method</InputLabel>
                              <Select
                                value={role.assignmentRules.assignmentMethod}
                                onChange={(e) => updateRoleAssignmentRules(role.id, { 
                                  assignmentMethod: e.target.value as any 
                                })}
                              >
                                <MenuItem value="round_robin">Round Robin</MenuItem>
                                <MenuItem value="workload_balanced">Workload Balanced</MenuItem>
                                <MenuItem value="skill_based">Skill Based</MenuItem>
                                <MenuItem value="hybrid">Hybrid (All Factors)</MenuItem>
                              </Select>
                            </FormControl>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Skill Weight: {(role.assignmentRules.skillWeight * 100).toFixed(0)}%
                              </label>
                              <Slider
                                value={role.assignmentRules.skillWeight}
                                onChange={(_, value) => updateRoleAssignmentRules(role.id, { 
                                  skillWeight: value as number 
                                })}
                                min={0}
                                max={1}
                                step={0.1}
                                marks={[
                                  { value: 0, label: '0%' },
                                  { value: 0.5, label: '50%' },
                                  { value: 1, label: '100%' }
                                ]}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Workload Weight: {(role.assignmentRules.workloadWeight * 100).toFixed(0)}%
                              </label>
                              <Slider
                                value={role.assignmentRules.workloadWeight}
                                onChange={(_, value) => updateRoleAssignmentRules(role.id, { 
                                  workloadWeight: value as number 
                                })}
                                min={0}
                                max={1}
                                step={0.1}
                                marks={[
                                  { value: 0, label: '0%' },
                                  { value: 0.5, label: '50%' },
                                  { value: 1, label: '100%' }
                                ]}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-2">
                                Territory Weight: {(role.assignmentRules.territoryWeight * 100).toFixed(0)}%
                              </label>
                              <Slider
                                value={role.assignmentRules.territoryWeight}
                                onChange={(_, value) => updateRoleAssignmentRules(role.id, { 
                                  territoryWeight: value as number 
                                })}
                                min={0}
                                max={1}
                                step={0.1}
                                marks={[
                                  { value: 0, label: '0%' },
                                  { value: 0.5, label: '50%' },
                                  { value: 1, label: '100%' }
                                ]}
                              />
                            </div>
                            
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={role.assignmentRules.availabilityRequired}
                                  onChange={(e) => updateRoleAssignmentRules(role.id, { 
                                    availabilityRequired: e.target.checked 
                                  })}
                                />
                              }
                              label="Require availability check"
                            />
                            
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={role.assignmentRules.businessHoursOnly}
                                  onChange={(e) => updateRoleAssignmentRules(role.id, { 
                                    businessHoursOnly: e.target.checked 
                                  })}
                                />
                              }
                              label="Business hours only"
                            />
                          </div>
                        </Paper>
                      </div>
                    </div>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
          </Box>
        )}

        {/* Tab 2: Assignees & Skills */}
        {activeTab === 1 && (
          <Box className="mt-6">
            <H3 className="mb-4">Assignee Skills & Territories</H3>
            
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Current Workload</TableCell>
                    <TableCell>Skills</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignees.map((assignee) => (
                    <TableRow key={assignee.id}>
                      <TableCell>
                        <div>
                          <strong>{assignee.name}</strong>
                          <div className="text-sm text-gray-600">{assignee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={assignee.role.title} 
                          color="primary" 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">
                            {assignee.workload.currentAssignments}/{assignee.role.permissions.maxConcurrentAssignments}
                          </div>
                          <LinearProgress 
                            variant="determinate" 
                            value={assignee.workload.utilizationRate * 100}
                            className="mt-1"
                            color={
                              assignee.workload.utilizationRate > 0.8 ? 'error' :
                              assignee.workload.utilizationRate > 0.6 ? 'warning' : 'success'
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {assignee.skills.slice(0, 3).map((skill) => (
                            <Chip 
                              key={skill.skillId}
                              label={`${skill.skillName} (${skill.level}/5)`}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {assignee.skills.length > 3 && (
                            <Chip 
                              label={`+${assignee.skills.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={assignee.availability.currentStatus}
                          color={
                            assignee.availability.currentStatus === 'available' ? 'success' :
                            assignee.availability.currentStatus === 'busy' ? 'warning' : 'error'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="Edit assignee skills and preferences">
                          <IconButton 
                            size="small"
                            onClick={() => setEditingAssignee(
                              editingAssignee === assignee.id ? null : assignee.id
                            )}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Tab 3: Analytics & Testing */}
        {activeTab === 2 && (
          <Box className="mt-6">
            <H3 className="mb-4">Assignment Analytics & Testing</H3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <Paper className="p-4">
                  <H3 className="text-base mb-3">Assignment Distribution</H3>
                  <div className="space-y-3">
                    {assignees.map((assignee) => (
                      <div key={assignee.id} className="flex items-center justify-between">
                        <span className="text-sm">{assignee.name}</span>
                        <div className="flex items-center gap-2">
                          <LinearProgress 
                            variant="determinate" 
                            value={assignee.workload.utilizationRate * 100}
                            className="w-20"
                          />
                          <span className="text-sm text-gray-600">
                            {(assignee.workload.utilizationRate * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Paper>
              </div>
              
              <div>
                <Paper className="p-4">
                  <H3 className="text-base mb-3">Assignment Rule Testing</H3>
                  <P2 className="text-gray-600 mb-4">
                    Test assignment scenarios with different configurations
                  </P2>
                  
                  <div className="space-y-3">
                    <TextField
                      fullWidth
                      label="Test Request Type"
                      placeholder="e.g., Kitchen Renovation"
                      size="small"
                    />
                    <TextField
                      fullWidth
                      label="Test Location"
                      placeholder="e.g., San Francisco, CA"
                      size="small"
                    />
                    <FormControl fullWidth size="small">
                      <InputLabel>Priority Level</InputLabel>
                      <Select defaultValue="normal">
                        <MenuItem value="immediate">Immediate</MenuItem>
                        <MenuItem value="urgent">Urgent</MenuItem>
                        <MenuItem value="normal">Normal</MenuItem>
                        <MenuItem value="flexible">Flexible</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Button fullWidth variant="outlined">
                      Run Assignment Test
                    </Button>
                  </div>
                </Paper>
              </div>
            </div>
          </Box>
        )}
      </CardWrapper>
    </div>
  );
}