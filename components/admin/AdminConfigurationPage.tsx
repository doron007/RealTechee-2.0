import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Alert, 
  AlertTitle,
  Chip,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { AuthorizationService } from '../../utils/authorizationHelpers';
import { UserService } from '../../utils/userService';

// Dynamic config shape (from API route)
interface EnvApiResponse {
  environment: string;
  backendSuffix?: string;
  graphqlUrl?: string;
  region?: string;
  cognito: { userPoolId?: string; clientId?: string };
  storage: { publicBaseUrl?: string };
  flags: { isProd: boolean; isStaging: boolean; isSandbox: boolean };
  drift: { status: string; message?: string; expectedSuffix?: string; actualSuffix?: string };
  build: { nodeEnv?: string; timestamp: string };
  health: string;
}

interface CurrentEnvironment {
  name: string;
  environment: 'development' | 'staging' | 'production';
  config: any;
}

interface ServiceStatus {
  service: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  details: string;
  value?: string;
}

const AdminConfigurationPage: React.FC = () => {
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentEnv, setCurrentEnv] = useState<EnvApiResponse | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

  const loadConfiguration = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/system/env');
      const json: EnvApiResponse = await res.json();
      setCurrentEnv(json);
      const statuses = checkServiceStatuses(json);
      setServiceStatuses(statuses);
      
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const checkAuthorization = useCallback(async () => {
    try {
      setLoading(true);
      const profile = await UserService.getUserProfile();
      setUserProfile(profile);
      
      const hasAccess = await AuthorizationService.hasMinimumRole('super_admin');
      setIsAuthorized(hasAccess);
      
      if (hasAccess) {
        await loadConfiguration();
      }
    } catch (error) {
      console.error('Authorization check failed:', error);
      setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [loadConfiguration]);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  const checkServiceStatuses = (env: EnvApiResponse): ServiceStatus[] => {
    const statuses: ServiceStatus[] = [];
    const envName = env.environment || 'unknown';
    let envStatus: ServiceStatus['status'] = env.health === 'ok' ? 'healthy' : 'warning';
    if (env.drift?.status === 'mismatch') envStatus = 'warning';
    const envDetails = `Detected environment: ${envName}` + (env.drift?.message ? ` | ${env.drift.message}` : '');

    statuses.push({
      service: 'Environment Detection',
      status: envStatus,
      details: envDetails,
      value: envName
    });

    // DynamoDB suffix
    let dynamoStatus: ServiceStatus['status'] = 'healthy';
    let dynamoDetails = `Table suffix: ${env.backendSuffix || 'unset'}`;
    if (!env.backendSuffix) { dynamoStatus = 'error'; dynamoDetails = 'Table suffix missing'; }

    statuses.push({
      service: 'DynamoDB Tables',
      status: dynamoStatus,
      details: dynamoDetails,
      value: env.backendSuffix
    });

    // Check AWS Cognito
    let cognitoStatus: ServiceStatus['status'] = 'healthy';
    let cognitoDetails = 'Cognito config present';
    if (!env.cognito?.userPoolId) { cognitoStatus = 'error'; cognitoDetails = 'Missing user pool id'; }

    statuses.push({
      service: 'AWS Cognito',
      status: cognitoStatus,
      details: cognitoDetails,
      value: env.cognito?.userPoolId
    });

    // Check AWS S3 Storage
    statuses.push({
      service: 'AWS S3 Storage',
      status: 'healthy',
      details: 'Public base URL',
      value: env.storage?.publicBaseUrl
    });

    // Check GraphQL API
    statuses.push({
      service: 'GraphQL API',
      status: 'healthy',
      details: 'GraphQL endpoint configuration',
      value: env.graphqlUrl
    });

    return statuses;
  };

  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon sx={{ color: 'success.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      default:
        return <InfoIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthorized) {
    return (
      <Box p={3}>
        <Alert severity="error">
          <AlertTitle>Access Denied</AlertTitle>
          <Typography variant="body2">
            This configuration page is restricted to Super Administrators only.
          </Typography>
          {userProfile && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Current role: <strong>{userProfile.role || 'Unknown'}</strong>
            </Typography>
          )}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          System Configuration
        </Typography>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={20} /> : <RefreshIcon />}
          onClick={loadConfiguration}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>

      {/* Environment Overview */}
  {currentEnv && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Current Environment
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  Environment
                </Typography>
                <Chip 
      label={currentEnv.environment}
      color={currentEnv.flags.isProd ? 'error' : currentEnv.flags.isStaging ? 'warning' : 'info'}
                  size="small"
                />
              </Box>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  App ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
      {/* App ID no longer provided directly; could be inferred from URL if needed */}
      n/a
                </Typography>
              </Box>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  App Name
                </Typography>
                <Typography variant="body1">
      RealTechee
                </Typography>
              </Box>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  Git Branch
                </Typography>
                <Typography variant="body1">
      {/* Could add branch data if exposed via env */}
      {process.env.NEXT_PUBLIC_GIT_BRANCH || 'unknown'}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Service Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Service Status
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Details</TableCell>
                  <TableCell>Configuration Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {serviceStatuses.map((status, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {getStatusIcon(status.status)}
                        {status.service}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={status.status}
                        color={getStatusColor(status.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {status.details}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }}>
                        {status.value}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Detailed Configuration */}
  {currentEnv && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Detailed Configuration</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box display="flex" flexDirection="column" gap={3}>
              <Box display="flex" flexWrap="wrap" gap={3}>
                {/* AWS Cognito */}
                <Box flex="1" minWidth="300px">
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        AWS Cognito
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        User Pool ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" gutterBottom>
                        {currentEnv.cognito.userPoolId}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        User Pool Client ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" gutterBottom>
                        {currentEnv.cognito.clientId}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Identity Pool ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {/* Identity pool not currently surfaced */}
                        n/a
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* AWS S3 Storage */}
                <Box flex="1" minWidth="300px">
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        AWS S3 Storage
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Bucket Name
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" gutterBottom>
                        {currentEnv.storage.publicBaseUrl || 'n/a'}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Region
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {currentEnv.region || 'n/a'}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              </Box>

              {/* GraphQL API */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    GraphQL API
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    GraphQL URL
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all' }} gutterBottom>
                    {currentEnv.graphqlUrl}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    API Key (masked)
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    (masked)
                  </Typography>
                </CardContent>
              </Card>

              {/* DynamoDB Tables */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    DynamoDB Tables
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Table Suffix
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace" gutterBottom>
                    {currentEnv.backendSuffix || 'unset'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Example table names:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    • Requests-{currentEnv.backendSuffix || '???'}-NONE<br/>
                    • Contacts-{currentEnv.backendSuffix || '???'}-NONE<br/>
                    • Projects-{currentEnv.backendSuffix || '???'}-NONE
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Configuration Source */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Configuration Source
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This configuration is dynamically resolved from runtime environment variables and Amplify outputs via the central
            <code> environmentConfig </code> utility and served through the <code>/api/system/env</code> route.
          </Typography>
        </CardContent>
      </Card>

      {/* Warnings */}
      {serviceStatuses.some(s => s.status === 'error' || s.status === 'warning') && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <AlertTitle>Configuration Issues Detected</AlertTitle>
          <Typography variant="body2">
            Please review the service status table above for configuration issues that may affect system functionality.
            {currentEnv?.environment === 'production' && (
              <strong> Production environment detected - ensure all configurations are correct.</strong>
            )}
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default AdminConfigurationPage;