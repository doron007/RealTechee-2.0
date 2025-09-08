'use client';

import React, { useState, useEffect, useCallback } from 'react';
import CardWrapper from '../common/CardWrapper';
import Button from '../../common/buttons/Button';
import { H2, H3 } from '../../typography';
import P2 from '../../typography/P2';
import { 
  skillManagementService,
  Skill,
  SkillCategory,
  AssigneeSkillProfile,
  SkillMatchRequest,
  SkillMatchResult
} from '../../../services/admin/skillManagementService';
import {
  Tabs,
  Tab,
  Box,
  TextField,
  Card as MuiCard,
  CardContent,
  CardActions,
  Chip,
  Avatar,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Rating,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Autocomplete
} from '@mui/material';
import {
  Psychology as SkillsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Add as AddIcon,
  School as CertificationIcon,
  Business as SpecializationIcon,
  Assessment as AnalyticsIcon,
  ExpandMore as ExpandMoreIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';

interface SkillManagementPanelProps {
  onSkillUpdate?: (assigneeId: string, skills: any) => void;
}

export default function SkillManagementPanel({ onSkillUpdate }: SkillManagementPanelProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [assigneeProfiles, setAssigneeProfiles] = useState<AssigneeSkillProfile[]>([]);
  const [matchResults, setMatchResults] = useState<SkillMatchResult[]>([]);
  
  // UI states
  const [editingAssignee, setEditingAssignee] = useState<string | null>(null);
  const [skillTestRequest, setSkillTestRequest] = useState<Partial<SkillMatchRequest>>({
    complexity: 'medium',
    timeframe: 'normal'
  });
  const [skillTestOpen, setSkillTestOpen] = useState(false);

  const loadSampleAssigneeProfiles = useCallback(async (): Promise<AssigneeSkillProfile[]> => {
    // For demo purposes, create sample profiles
    // In real implementation, this would load from the skill management service
    return [
      {
        assigneeId: '1',
        assigneeName: 'Sarah Johnson',
        assigneeEmail: 'sarah@realtechee.com',
        skills: [
          { skillId: 'kitchen_renovation', skillName: 'Kitchen Renovation', category: categories[0], proficiencyLevel: 4, experienceYears: 5 },
          { skillId: 'project_management', skillName: 'Project Management', category: categories[1], proficiencyLevel: 5, experienceYears: 7 },
          { skillId: 'luxury_clients', skillName: 'Luxury Home Clients', category: categories[4], proficiencyLevel: 4, experienceYears: 4 }
        ],
        specializations: [],
        certifications: [],
        experienceLevel: 'senior',
        lastUpdated: new Date().toISOString()
      },
      {
        assigneeId: '2',
        assigneeName: 'Mike Chen',
        assigneeEmail: 'mike@realtechee.com',
        skills: [
          { skillId: 'bathroom_renovation', skillName: 'Bathroom Renovation', category: categories[0], proficiencyLevel: 5, experienceYears: 6 },
          { skillId: 'commercial_renovation', skillName: 'Commercial Renovation', category: categories[0], proficiencyLevel: 3, experienceYears: 2 },
          { skillId: 'cost_estimation', skillName: 'Cost Estimation', category: categories[1], proficiencyLevel: 4, experienceYears: 5 }
        ],
        specializations: [],
        certifications: [],
        experienceLevel: 'senior',
        lastUpdated: new Date().toISOString()
      }
    ];
  }, [categories]);

  const loadSkillData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [skillsData, categoriesData] = await Promise.all([
        skillManagementService.getAvailableSkills(),
        skillManagementService.getSkillCategories()
      ]);
      
      setSkills(skillsData);
      setCategories(categoriesData);
      
      // Load sample assignee profiles
      const sampleProfiles = await loadSampleAssigneeProfiles();
      setAssigneeProfiles(sampleProfiles);
      
    } catch (err) {
      setError('Failed to load skill management data');
      console.error('Skill data load error:', err);
    } finally {
      setLoading(false);
    }
  }, [loadSampleAssigneeProfiles]);

  useEffect(() => {
    loadSkillData();
  }, [loadSkillData]);


  const runSkillTest = async () => {
    try {
      if (!skillTestRequest.requestType) {
        setError('Please specify a request type for skill testing');
        return;
      }

      setLoading(true);
      
      const testRequest: SkillMatchRequest = {
        requestType: skillTestRequest.requestType!,
        product: skillTestRequest.product,
        complexity: skillTestRequest.complexity!,
        timeframe: skillTestRequest.timeframe!,
        budget: skillTestRequest.budget,
        location: skillTestRequest.location
      };

      const results = await skillManagementService.matchAssigneesToSkills(
        testRequest,
        assigneeProfiles.map(p => p.assigneeId)
      );

      setMatchResults(results);
      setSkillTestOpen(true);
      
    } catch (err) {
      setError('Failed to run skill test');
      console.error('Skill test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateAssigneeSkill = async (assigneeId: string, skillId: string, newLevel: number) => {
    try {
      const profileIndex = assigneeProfiles.findIndex(p => p.assigneeId === assigneeId);
      if (profileIndex === -1) return;

      const updatedProfiles = [...assigneeProfiles];
      const skillIndex = updatedProfiles[profileIndex].skills.findIndex(s => s.skillId === skillId);
      
      if (skillIndex !== -1) {
        updatedProfiles[profileIndex].skills[skillIndex].proficiencyLevel = newLevel;
        setAssigneeProfiles(updatedProfiles);
        
        if (onSkillUpdate) {
          onSkillUpdate(assigneeId, updatedProfiles[profileIndex].skills);
        }
      }
      
    } catch (err) {
      setError('Failed to update skill level');
      console.error('Skill update error:', err);
    }
  };

  if (loading) {
    return (
      <CardWrapper className="p-6">
        <H2 className="mb-4">Skill Management</H2>
        <LinearProgress />
        <P2 className="mt-2 text-center">Loading skill data...</P2>
      </CardWrapper>
    );
  }

  return (
    <div className="space-y-6">
      <CardWrapper className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <H2 className="flex items-center gap-2">
              <SkillsIcon />
              Skill & Specialization Management
            </H2>
            <P2 className="text-gray-600 mt-1">
              Manage assignee skills, specializations, and skill matching algorithms
            </P2>
          </div>
          
          <Button onClick={loadSkillData} disabled={loading}>
            Refresh Data
          </Button>
        </div>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab icon={<PersonIcon />} label="Assignee Skills" />
          <Tab icon={<SkillsIcon />} label="Available Skills" />
          <Tab icon={<SearchIcon />} label="Skill Testing" />
        </Tabs>

        {/* Tab 1: Assignee Skills */}
        {activeTab === 0 && (
          <Box className="mt-6">
            <H3 className="mb-4">Assignee Skill Profiles</H3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assigneeProfiles.map((profile) => (
                <div key={profile.assigneeId}>
                  <MuiCard>
                    <CardContent>
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar sx={{ width: 48, height: 48 }}>
                          {profile.assigneeName.charAt(0)}
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{profile.assigneeName}</h4>
                          <p className="text-sm text-gray-600">{profile.assigneeEmail}</p>
                          <Chip 
                            label={profile.experienceLevel}
                            color={
                              profile.experienceLevel === 'expert' ? 'success' :
                              profile.experienceLevel === 'senior' ? 'primary' :
                              profile.experienceLevel === 'mid' ? 'warning' : 'default'
                            }
                            size="small"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <h5 className="font-medium">Skills</h5>
                        {profile.skills.map((skill) => (
                          <div key={skill.skillId} className="flex items-center justify-between">
                            <div>
                              <span className="text-sm font-medium">{skill.skillName}</span>
                              <Chip 
                                label={skill.category.name}
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <Rating
                                value={skill.proficiencyLevel}
                                onChange={(_, newValue) => {
                                  if (newValue) {
                                    updateAssigneeSkill(profile.assigneeId, skill.skillId, newValue);
                                  }
                                }}
                                max={5}
                                size="small"
                              />
                              <span className="text-sm text-gray-600">
                                {skill.experienceYears}y
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                    
                    <CardActions>
                      <Button 
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => setEditingAssignee(
                          editingAssignee === profile.assigneeId ? null : profile.assigneeId
                        )}
                      >
                        Edit Skills
                      </Button>
                      <Button 
                        size="small"
                        startIcon={<AddIcon />}
                      >
                        Add Skill
                      </Button>
                    </CardActions>
                  </MuiCard>
                </div>
              ))}
            </div>
          </Box>
        )}

        {/* Tab 2: Available Skills */}
        {activeTab === 1 && (
          <Box className="mt-6">
            <H3 className="mb-4">Available Skills by Category</H3>
            
            <div className="space-y-4">
              {categories.map((category) => (
                <Accordion key={category.id}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: category.color }}
                      />
                      <strong>{category.name}</strong>
                      <Chip 
                        label={skills.filter(s => s.category.id === category.id).length}
                        size="small"
                      />
                    </div>
                  </AccordionSummary>
                  
                  <AccordionDetails>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {skills
                        .filter(skill => skill.category.id === category.id)
                        .map((skill) => (
                          <div key={skill.id}>
                            <Paper className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-sm">{skill.name}</strong>
                                <Chip 
                                  label={`Level ${skill.level}`}
                                  size="small"
                                  color="primary"
                                />
                              </div>
                              {skill.description && (
                                <p className="text-xs text-gray-600">{skill.description}</p>
                              )}
                              {skill.certifications && skill.certifications.length > 0 && (
                                <div className="mt-2">
                                  <Chip 
                                    icon={<CertificationIcon />}
                                    label={`${skill.certifications.length} certs`}
                                    size="small"
                                    variant="outlined"
                                  />
                                </div>
                              )}
                            </Paper>
                          </div>
                        ))}
                    </div>
                  </AccordionDetails>
                </Accordion>
              ))}
            </div>
            
            <div className="mt-6 flex gap-2">
              <Button startIcon={<AddIcon />}>
                Add New Skill
              </Button>
              <Button startIcon={<SpecializationIcon />} variant="outlined">
                Manage Specializations
              </Button>
            </div>
          </Box>
        )}

        {/* Tab 3: Skill Testing */}
        {activeTab === 2 && (
          <Box className="mt-6">
            <H3 className="mb-4">Skill Matching Test</H3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Paper className="p-4">
                  <h4 className="font-medium mb-3">Test Parameters</h4>
                  
                  <div className="space-y-3">
                    <TextField
                      fullWidth
                      label="Request Type"
                      value={skillTestRequest.requestType || ''}
                      onChange={(e) => setSkillTestRequest(prev => ({
                        ...prev,
                        requestType: e.target.value
                      }))}
                      placeholder="e.g., Kitchen Renovation Project"
                    />
                    
                    <FormControl fullWidth>
                      <InputLabel>Product Type</InputLabel>
                      <Select
                        value={skillTestRequest.product || ''}
                        onChange={(e) => setSkillTestRequest(prev => ({
                          ...prev,
                          product: e.target.value
                        }))}
                      >
                        <MenuItem value="Kitchen Renovation">Kitchen Renovation</MenuItem>
                        <MenuItem value="Bathroom Renovation">Bathroom Renovation</MenuItem>
                        <MenuItem value="Full Home Renovation">Full Home Renovation</MenuItem>
                        <MenuItem value="Commercial">Commercial</MenuItem>
                        <MenuItem value="Outdoor Living">Outdoor Living</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl fullWidth>
                      <InputLabel>Complexity</InputLabel>
                      <Select
                        value={skillTestRequest.complexity}
                        onChange={(e) => setSkillTestRequest(prev => ({
                          ...prev,
                          complexity: e.target.value as any
                        }))}
                      >
                        <MenuItem value="low">Low</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="expert">Expert</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <TextField
                      fullWidth
                      label="Budget"
                      type="number"
                      value={skillTestRequest.budget || ''}
                      onChange={(e) => setSkillTestRequest(prev => ({
                        ...prev,
                        budget: parseInt(e.target.value) || undefined
                      }))}
                      placeholder="75000"
                    />
                    
                    <Button 
                      fullWidth 
                      onClick={runSkillTest}
                      disabled={loading}
                      startIcon={<SearchIcon />}
                    >
                      Run Skill Match Test
                    </Button>
                  </div>
                </Paper>
              </div>
              
              <div>
                <Paper className="p-4">
                  <h4 className="font-medium mb-3">Quick Test Results</h4>
                  
                  {matchResults.length > 0 ? (
                    <div className="space-y-3">
                      {matchResults.slice(0, 3).map((result) => (
                        <div key={result.assigneeId} className="border rounded p-3">
                          <div className="flex items-center justify-between mb-2">
                            <strong className="text-sm">{result.assigneeName}</strong>
                            <div className="flex items-center gap-1">
                              <TrendingUpIcon className="text-green-600" fontSize="small" />
                              <span className="text-sm font-medium">
                                {(result.matchScore * 100).toFixed(0)}%
                              </span>
                            </div>
                          </div>
                          
                          <LinearProgress 
                            variant="determinate" 
                            value={result.matchScore * 100}
                            className="mb-2"
                            color={
                              result.matchScore > 0.8 ? 'success' :
                              result.matchScore > 0.6 ? 'warning' : 'error'
                            }
                          />
                          
                          <div className="text-xs text-gray-600">
                            Matching: {result.matchingSkills.length} skills | 
                            Missing: {result.missingSkills.length} skills
                          </div>
                        </div>
                      ))}
                      
                      <Button 
                        fullWidth 
                        variant="outlined"
                        onClick={() => setSkillTestOpen(true)}
                      >
                        View Detailed Results
                      </Button>
                    </div>
                  ) : (
                    <P2 className="text-gray-600 text-center py-8">
                      Run a skill test to see matching results
                    </P2>
                  )}
                </Paper>
              </div>
            </div>
          </Box>
        )}
      </CardWrapper>

      {/* Detailed Results Dialog */}
      <Dialog open={skillTestOpen} onClose={() => setSkillTestOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Detailed Skill Match Results</DialogTitle>
        <DialogContent>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Match Score</TableCell>
                  <TableCell>Matching Skills</TableCell>
                  <TableCell>Missing Skills</TableCell>
                  <TableCell>Recommendations</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matchResults.map((result) => (
                  <TableRow key={result.assigneeId}>
                    <TableCell>{result.assigneeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <LinearProgress 
                          variant="determinate" 
                          value={result.matchScore * 100}
                          className="w-16"
                        />
                        <span>{(result.matchScore * 100).toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {result.matchingSkills.slice(0, 3).map((skill) => (
                          <Chip 
                            key={skill.skillId}
                            label={`${skill.skillName} (${skill.actualLevel}/${skill.requiredLevel})`}
                            size="small"
                            color={skill.match ? 'success' : 'error'}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {result.missingSkills.slice(0, 2).map((skill) => (
                          <Chip 
                            key={skill.skillId}
                            label={skill.skillName}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {result.recommendations.length > 0 && (
                        <Tooltip title={result.recommendations.join('; ')}>
                          <Chip 
                            label={`${result.recommendations.length} tips`}
                            size="small"
                            color="info"
                          />
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSkillTestOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}