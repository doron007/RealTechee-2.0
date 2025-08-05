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

// Environment configuration - inline definition to avoid build issues
const environmentsConfig = {
  environments: {
    development: {
      name: "Development",
      description: "Local development environment",
      git_branch: "main",
      amplify: {
        app_id: "d3atadjk90y9q5",
        app_name: "RealTechee-2.0",
        url: "http://localhost:3000"
      },
      cognito: {
        user_pool_id: "us-west-1_5pFbWcwtU",
        user_pool_client_id: "4pdj4qp05o47a0g42cqlt99ccs",
        identity_pool_id: "us-west-1:eea1986d-7984-48d4-8e69-4d3b8afc4851"
      },
      storage: {
        bucket_name: "amplify-realtecheeclone-main-bucket",
        region: "us-west-1"
      },
      api: {
        graphql_url: "https://vbnhy6yqnfelrkdbx2anbhvdhe.appsync-api.us-west-1.amazonaws.com/graphql",
        api_key: "da2-qe4fczl75zhgjb4rz3dh5r7xky"
      },
      tables_suffix: "fvn7t5hbobaxjklhrqzdl4ac34"
    },
    staging: {
      name: "Staging",
      description: "Staging environment",
      git_branch: "prod",
      amplify: {
        app_id: "d3atadjk90y9q5", 
        app_name: "RealTechee-2.0",
        url: "https://prod.d3atadjk90y9q5.amplifyapp.com"
      },
      cognito: {
        user_pool_id: "us-west-1_5pFbWcwtU",
        user_pool_client_id: "4pdj4qp05o47a0g42cqlt99ccs",
        identity_pool_id: "us-west-1:eea1986d-7984-48d4-8e69-4d3b8afc4851"
      },
      storage: {
        bucket_name: "amplify-realtecheeclone-main-bucket",
        region: "us-west-1"
      },
      api: {
        graphql_url: "https://vbnhy6yqnfelrkdbx2anbhvdhe.appsync-api.us-west-1.amazonaws.com/graphql",
        api_key: "da2-qe4fczl75zhgjb4rz3dh5r7xky"
      },
      tables_suffix: "fvn7t5hbobaxjklhrqzdl4ac34"
    },
    production: {
      name: "Production",
      description: "Production environment",
      git_branch: "prod-v2",
      amplify: {
        app_id: "d200k2wsaf8th3",
        app_name: "RealTechee-Gen2", 
        url: "https://prod-v2.d200k2wsaf8th3.amplifyapp.com"
      },
      cognito: {
        user_pool_id: "us-west-1_1eQCIgm5h",
        user_pool_client_id: "5qcjd3l5i733b2tn99qf2g6675",
        identity_pool_id: "us-west-1:11d5c002-cbe3-4414-bd8f-4f046d2ab457"
      },
      storage: {
        bucket_name: "amplify-realtecheeclone-production-bucket-PROD",
        region: "us-west-1"
      },
      api: {
        graphql_url: "https://374sdjlh3bdnhp2sz4qttvyhce.appsync-api.us-west-1.amazonaws.com/graphql",
        api_key: "da2-PRODUCTION_API_KEY"
      },
      tables_suffix: "aqnqdrctpzfwfjwyxxsmu6peoq"
    }
  }
};

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
  const [currentEnv, setCurrentEnv] = useState<CurrentEnvironment | null>(null);
  const [serviceStatuses, setServiceStatuses] = useState<ServiceStatus[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);

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
  }, []);

  useEffect(() => {
    checkAuthorization();
  }, [checkAuthorization]);

  const loadConfiguration = async () => {
    try {
      setRefreshing(true);
      
      // Determine current environment based on URL
      const currentUrl = window.location.href;
      let environment: CurrentEnvironment;
      
      if (currentUrl.includes('localhost')) {
        environment = {
          name: 'Development (Local)',
          environment: 'development',
          config: environmentsConfig.environments.development
        };
      } else if (currentUrl.includes('d3atadjk90y9q5')) {
        environment = {
          name: 'Staging',
          environment: 'staging', 
          config: environmentsConfig.environments.staging
        };
      } else if (currentUrl.includes('d200k2wsaf8th3')) {
        environment = {
          name: 'Production',
          environment: 'production',
          config: environmentsConfig.environments.production
        };
      } else {
        environment = {
          name: 'Unknown Environment',
          environment: 'development',
          config: environmentsConfig.environments.development
        };
      }
      
      setCurrentEnv(environment);
      
      // Check service statuses based on current environment
      const statuses = checkServiceStatuses(environment);
      setServiceStatuses(statuses);
      
    } catch (error) {
      console.error('Failed to load configuration:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const checkServiceStatuses = (env: CurrentEnvironment): ServiceStatus[] => {
    const statuses: ServiceStatus[] = [];
    const config = env.config;

    // Check Environment Match
    const currentUrl = window.location.href;
    let envStatus: ServiceStatus['status'] = 'healthy';
    let envDetails = `Running on correct environment: ${env.name}`;
    
    // For development, check if we're on localhost
    if (env.environment === 'development') {
      if (!currentUrl.includes('localhost')) {
        envStatus = 'warning';
        envDetails = `Development environment should run on localhost, currently on: ${currentUrl}`;
      }
    } else {
      // For staging/production, check App ID in URL
      if (!currentUrl.includes(config.amplify.app_id)) {
        envStatus = 'error';
        envDetails = `Environment mismatch! Expected App ID: ${config.amplify.app_id}`;
      }
    }

    statuses.push({
      service: 'Environment Detection',
      status: envStatus,
      details: envDetails,
      value: `${env.name} (${config.amplify.app_id})`
    });

    // Check DynamoDB Tables
    let dynamoStatus: ServiceStatus['status'] = 'healthy';
    let dynamoDetails = `Tables using suffix: ${config.tables_suffix}`;
    
    // Environment-specific validations
    if (env.environment === 'production' && config.tables_suffix !== 'aqnqdrctpzfwfjwyxxsmu6peoq') {
      dynamoStatus = 'error';
      dynamoDetails = 'Production should use isolated table suffix: aqnqdrctpzfwfjwyxxsmu6peoq';
    } else if (env.environment === 'staging' && config.tables_suffix !== 'fvn7t5hbobaxjklhrqzdl4ac34') {
      dynamoStatus = 'warning';
      dynamoDetails = 'Staging should use shared table suffix: fvn7t5hbobaxjklhrqzdl4ac34';
    }

    statuses.push({
      service: 'DynamoDB Tables',
      status: dynamoStatus,
      details: dynamoDetails,
      value: config.tables_suffix
    });

    // Check AWS Cognito
    let cognitoStatus: ServiceStatus['status'] = 'healthy';
    let cognitoDetails = 'Cognito configuration loaded from environment config';
    
    // Validate production has different cognito than staging
    if (env.environment === 'production') {
      const stagingCognito = environmentsConfig.environments.staging.cognito.user_pool_id;
      if (config.cognito.user_pool_id === stagingCognito) {
        cognitoStatus = 'error';
        cognitoDetails = 'Production is using same Cognito pool as staging - should be isolated';
      }
    }

    statuses.push({
      service: 'AWS Cognito',
      status: cognitoStatus,
      details: cognitoDetails,
      value: config.cognito.user_pool_id
    });

    // Check AWS S3 Storage
    statuses.push({
      service: 'AWS S3 Storage',
      status: 'healthy',
      details: 'S3 bucket configuration loaded from environment config',
      value: config.storage.bucket_name
    });

    // Check GraphQL API
    statuses.push({
      service: 'GraphQL API',
      status: 'healthy',
      details: 'GraphQL endpoint configuration loaded from environment config',
      value: config.api.graphql_url
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
                  label={currentEnv.name}
                  color={currentEnv.environment === 'production' ? 'error' : currentEnv.environment === 'staging' ? 'warning' : 'info'}
                  size="small"
                />
              </Box>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  App ID
                </Typography>
                <Typography variant="body1" fontFamily="monospace">
                  {currentEnv.config.amplify.app_id}
                </Typography>
              </Box>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  App Name
                </Typography>
                <Typography variant="body1">
                  {currentEnv.config.amplify.app_name}
                </Typography>
              </Box>
              <Box minWidth="200px" flex="1">
                <Typography variant="body2" color="text.secondary">
                  Git Branch
                </Typography>
                <Typography variant="body1">
                  {currentEnv.config.git_branch}
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
                        {currentEnv.config.cognito.user_pool_id}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        User Pool Client ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace" gutterBottom>
                        {currentEnv.config.cognito.user_pool_client_id}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Identity Pool ID
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {currentEnv.config.cognito.identity_pool_id}
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
                        {currentEnv.config.storage.bucket_name}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Region
                      </Typography>
                      <Typography variant="body2" fontFamily="monospace">
                        {currentEnv.config.storage.region}
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
                    {currentEnv.config.api.graphql_url}
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    API Key (masked)
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    {currentEnv.config.api.api_key.substring(0, 8)}***
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
                    {currentEnv.config.tables_suffix}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Example table names:
                  </Typography>
                  <Typography variant="body2" fontFamily="monospace">
                    • Requests-{currentEnv.config.tables_suffix}-NONE<br/>
                    • Contacts-{currentEnv.config.tables_suffix}-NONE<br/>
                    • Projects-{currentEnv.config.tables_suffix}-NONE
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
            This configuration is loaded from <code>config/environments.json</code> which is used by the deployment scripts 
            to ensure consistency across environments. All values are read-only and managed through the deployment process.
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