#!/usr/bin/env python3
"""
Amplify Schema Consolidation Script
Consolidates all 26 generated schemas into amplify/data/resource.ts
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set

class AmplifySchemaConsolidator:
    def __init__(self, workspace_path: str):
        self.workspace_path = Path(workspace_path)
        self.generated_schemas_path = self.workspace_path / "generated" / "schemas"
        self.amplify_resource_path = self.workspace_path / "amplify" / "data" / "resource.ts"
        self.models: Dict[str, str] = {}
        
    def log(self, message: str, level: str = "INFO"):
        print(f"[{level}] {message}")
    
    def extract_model_from_schema(self, schema_file: Path) -> tuple[str, str]:
        """Extract model name and definition from a schema file"""
        try:
            with open(schema_file, 'r') as f:
                content = f.read()
            
            # Extract the model name (remove _schema.ts suffix)
            file_model_name = schema_file.stem.replace('_schema', '')
            
            # Find the model definition pattern: ModelName: a.model({...}).authorization
            model_pattern = r'(\w+):\s*a\s*\.model\(\s*\{(.*?)\}\s*\)\s*\.authorization\(\(allow\)\s*=>\s*\[allow\.publicApiKey\(\)\]\)'
            match = re.search(model_pattern, content, re.DOTALL)
            
            if match:
                actual_model_name = match.group(1)
                model_fields = match.group(2).strip()
                
                # Clean up the model definition - preserve proper indentation
                lines = model_fields.split('\n')
                cleaned_lines = []
                for line in lines:
                    stripped = line.strip()
                    if stripped and not stripped.startswith('//'):
                        # Preserve the original indentation style
                        cleaned_lines.append('  ' + stripped)
                
                model_definition = f"""const {actual_model_name} = a.model({{
{chr(10).join(cleaned_lines)}
}}).authorization((allow) => allow.publicApiKey());"""
                
                self.log(f"✅ Extracted model: {actual_model_name}")
                return actual_model_name, model_definition
            else:
                self.log(f"❌ Could not extract model from {schema_file}", "ERROR")
                self.log(f"Content preview: {content[:200]}...", "DEBUG")
                return None, None
                
        except Exception as e:
            self.log(f"❌ Error processing {schema_file}: {e}", "ERROR")
            return None, None
    
    def load_all_schemas(self):
        """Load all schema files and extract models"""
        self.log("🔍 Loading all generated schemas...")
        
        schema_files = list(self.generated_schemas_path.glob("*_schema.ts"))
        self.log(f"Found {len(schema_files)} schema files")
        
        for schema_file in schema_files:
            model_name, model_def = self.extract_model_from_schema(schema_file)
            if model_name and model_def:
                self.models[model_name] = model_def
        
        self.log(f"✅ Successfully loaded {len(self.models)} models")
        return len(self.models)
    
    def generate_consolidated_resource(self) -> str:
        """Generate the consolidated resource.ts content"""
        self.log("🔧 Generating consolidated resource.ts...")
        
        # Header
        content = """import { a } from '@aws-amplify/data-schema';
import { defineData } from '@aws-amplify/backend';

// Consolidated models from 26 migrated tables
// Generated from CSV to DynamoDB migration

"""
        
        # Add all model definitions
        for model_name in sorted(self.models.keys()):
            content += self.models[model_name] + "\n\n"
        
        # Create schema object
        model_names = sorted(self.models.keys())
        schema_models = ',\n  '.join(model_names)
        
        content += f"""const schema = a.schema({{
  {schema_models}
}});

// Export the data configuration
export const data = defineData({{
  schema,
  authorizationModes: {{
    defaultAuthorizationMode: 'apiKey',
    apiKeyAuthorizationMode: {{
      expiresInDays: 30
    }}
  }}
}});

// Export the schema type for use in other files
export type Schema = typeof schema;
"""
        
        return content
    
    def backup_current_resource(self):
        """Backup the current resource.ts file"""
        if self.amplify_resource_path.exists():
            backup_path = self.amplify_resource_path.with_suffix('.ts.backup')
            with open(self.amplify_resource_path, 'r') as f:
                content = f.read()
            with open(backup_path, 'w') as f:
                f.write(content)
            self.log(f"✅ Backed up current resource.ts to {backup_path.name}")
    
    def write_consolidated_resource(self, content: str):
        """Write the consolidated resource.ts file"""
        self.backup_current_resource()
        
        with open(self.amplify_resource_path, 'w') as f:
            f.write(content)
        
        self.log(f"✅ Updated {self.amplify_resource_path}")
    
    def generate_summary_report(self) -> Dict:
        """Generate a summary of the consolidation process"""
        return {
            "total_models": len(self.models),
            "model_names": sorted(self.models.keys()),
            "resource_file": str(self.amplify_resource_path),
            "generated_from": str(self.generated_schemas_path),
            "timestamp": "2025-06-09"
        }
    
    def consolidate(self):
        """Main consolidation process"""
        self.log("🚀 Starting Amplify Schema Consolidation...")
        
        try:
            # Load all schemas
            model_count = self.load_all_schemas()
            if model_count == 0:
                self.log("❌ No models found to consolidate", "ERROR")
                return False
            
            # Generate consolidated content
            consolidated_content = self.generate_consolidated_resource()
            
            # Write to resource.ts
            self.write_consolidated_resource(consolidated_content)
            
            # Generate summary
            summary = self.generate_summary_report()
            summary_path = self.workspace_path / "amplify_schema_consolidation_summary.json"
            with open(summary_path, 'w') as f:
                json.dump(summary, f, indent=2)
            
            self.log(f"✅ Consolidation complete! Summary saved to {summary_path.name}")
            
            # Display summary
            print("\n" + "="*60)
            print("📊 CONSOLIDATION SUMMARY")
            print("="*60)
            print(f"Models consolidated: {summary['total_models']}")
            print(f"Resource file: {summary['resource_file']}")
            print(f"Backup created: resource.ts.backup")
            print("\nModels included:")
            for i, model in enumerate(summary['model_names'], 1):
                print(f"  {i:2d}. {model}")
            print("="*60)
            
            return True
            
        except Exception as e:
            self.log(f"❌ Consolidation failed: {e}", "ERROR")
            return False

def main():
    workspace_path = "/Users/doron/Projects/RealTechee 2.0"
    
    consolidator = AmplifySchemaConsolidator(workspace_path)
    success = consolidator.consolidate()
    
    if success:
        print("\n🎉 Next steps:")
        print("1. Review the updated amplify/data/resource.ts")
        print("2. Start Amplify sandbox: npx ampx sandbox")
        print("3. Verify connection to DynamoDB tables")
        print("4. Test GraphQL API queries")
    else:
        print("\n❌ Consolidation failed. Check the error messages above.")

if __name__ == "__main__":
    main()
