import React, { useState } from 'react';
import { H2 } from '../../typography';
import SignalDashboard from './SignalDashboard';
import SignalFlowMonitor from './SignalFlowMonitor';
import { 
  Box, 
  Tabs, 
  Tab,
  Paper
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Timeline as TimelineIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`signal-tabpanel-${index}`}
      aria-labelledby={`signal-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `signal-tab-${index}`,
    'aria-controls': `signal-tabpanel-${index}`,
  };
}

const SignalManagementPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ p: 3, pb: 0 }}>
        <H2>Signal & Notification Management</H2>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="signal management tabs">
          <Tab 
            icon={<DashboardIcon />} 
            label="Dashboard" 
            {...a11yProps(0)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<TimelineIcon />} 
            label="Signal Flow Monitor" 
            {...a11yProps(1)} 
            sx={{ textTransform: 'none' }}
          />
          <Tab 
            icon={<SettingsIcon />} 
            label="Hooks & Configuration" 
            {...a11yProps(2)} 
            sx={{ textTransform: 'none' }}
          />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <SignalDashboard />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box sx={{ px: 3 }}>
          <SignalFlowMonitor showLatest={true} />
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Box sx={{ px: 3 }}>
          <Paper sx={{ p: 3 }}>
            <H2>Hooks & Configuration</H2>
            <p>Signal notification hooks and configuration management will be implemented here.</p>
            <p>This will include:</p>
            <ul>
              <li>Creating and editing notification hooks</li>
              <li>Managing signal type mappings</li>
              <li>Configuring delivery channels</li>
              <li>Setting up recipient lists</li>
              <li>Template assignments</li>
            </ul>
          </Paper>
        </Box>
      </TabPanel>
    </Box>
  );
};

export default SignalManagementPage;