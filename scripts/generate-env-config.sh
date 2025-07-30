#!/bin/bash

# Environment Configuration Generator for RealTechee 2.0
# Generates amplify_outputs.json files for each environment from centralized config

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_ROOT/config/environments.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==>${NC} 🔧 Environment Configuration Generator"

# Check if config file exists
if [[ ! -f "$CONFIG_FILE" ]]; then
    echo -e "${RED}❌ ERROR:${NC} Configuration file not found: $CONFIG_FILE"
    exit 1
fi

# Function to generate amplify_outputs.json for an environment
generate_config() {
    local env_name="$1"
    local output_file="$2"
    
    echo -e "${BLUE}ℹ️  INFO:${NC} Generating config for $env_name environment"
    
    # Extract environment config using jq
    local env_config=$(cat "$CONFIG_FILE" | jq -r ".environments.$env_name")
    
    if [[ "$env_config" == "null" ]]; then
        echo -e "${RED}❌ ERROR:${NC} Environment '$env_name' not found in config"
        return 1
    fi
    
    # Generate amplify_outputs.json
    cat > "$output_file" << EOF
{
  "_note": "$(echo "$env_config" | jq -r '.description') for $(echo "$env_config" | jq -r '.amplify.app_name') app",
  "_backend_suffix": "$(echo "$env_config" | jq -r '.amplify.backend_suffix')",
  "_app_id": "$(echo "$env_config" | jq -r '.amplify.app_id')",
  "_sandbox": "$(echo "$env_config" | jq -r '.amplify.sandbox')",
  "auth": {
    "user_pool_id": "$(echo "$env_config" | jq -r '.cognito.user_pool_id')",
    "aws_region": "$(echo "$env_config" | jq -r '.storage.region')",
    "user_pool_client_id": "$(echo "$env_config" | jq -r '.cognito.user_pool_client_id')",
    "identity_pool_id": "$(echo "$env_config" | jq -r '.cognito.identity_pool_id')",
    "mfa_methods": [],
    "standard_required_attributes": [
      "email"
    ],
    "username_attributes": [
      "email"
    ],
    "user_verification_types": [
      "email"
    ],
    "groups": [
      {
        "super_admin": {
          "precedence": 0
        }
      },
      {
        "admin": {
          "precedence": 1
        }
      },
      {
        "accounting": {
          "precedence": 2
        }
      },
      {
        "srm": {
          "precedence": 3
        }
      },
      {
        "agent": {
          "precedence": 4
        }
      },
      {
        "homeowner": {
          "precedence": 5
        }
      },
      {
        "provider": {
          "precedence": 6
        }
      },
      {
        "pm": {
          "precedence": 7
        }
      }
    ]
  },
  "data": {
    "url": "$(echo "$env_config" | jq -r '.api.graphql_url')",
    "aws_region": "$(echo "$env_config" | jq -r '.api.region')",
    "api_key": "$(echo "$env_config" | jq -r '.api.api_key')",
    "default_authorization_type": "AMAZON_COGNITO_USER_POOLS",
    "authorization_types": [
      "API_KEY",
      "AWS_IAM"
    ],
    "model_introspection": {
      "version": 1,
      "models": {
        "Affiliates": {
          "name": "Affiliates",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        },
        "BackOfficeRequestStatuses": {
          "name": "BackOfficeRequestStatuses",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        },
        "Contacts": {
          "name": "Contacts",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        },
        "Projects": {
          "name": "Projects",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        },
        "Properties": {
          "name": "Properties",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        },
        "Requests": {
          "name": "Requests",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        },
        "Quotes": {
          "name": "Quotes",
          "fields": {
            "id": {
              "name": "id",
              "isArray": false,
              "type": "ID",
              "isRequired": true,
              "attributes": []
            }
          }
        }
      }
    }
  },
  "storage": {
    "aws_region": "$(echo "$env_config" | jq -r '.storage.region')",
    "bucket_name": "$(echo "$env_config" | jq -r '.storage.bucket_name')"
  }
}
EOF
    
    echo -e "${GREEN}✅ SUCCESS:${NC} Generated $output_file"
}

# Generate configs for all environments
echo -e "${BLUE}==>${NC} 📦 Generating environment configurations"

generate_config "development" "$PROJECT_ROOT/config/amplify_outputs.development.json"
generate_config "staging" "$PROJECT_ROOT/config/amplify_outputs.staging.json"
generate_config "production" "$PROJECT_ROOT/config/amplify_outputs.production.json"

echo ""
echo -e "${GREEN}🎉 CONFIGURATION GENERATION COMPLETE${NC}"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Generated files:"
echo "  • config/amplify_outputs.development.json"
echo "  • config/amplify_outputs.staging.json"
echo "  • config/amplify_outputs.production.json"
echo ""
echo -e "${BLUE}ℹ️  INFO:${NC} Usage:"
echo "  • Development: cp config/amplify_outputs.development.json amplify_outputs.json"
echo "  • Staging: cp config/amplify_outputs.staging.json amplify_outputs.json"
echo "  • Production: cp config/amplify_outputs.production.json amplify_outputs.json"