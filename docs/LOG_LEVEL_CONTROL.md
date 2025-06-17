# Log Level Control Guide

This guide shows you how to control logging levels in the RealTechee application for different environments and scenarios.

## 🎛️ **Quick Reference**

| Environment | Default Level | What You See |
|-------------|---------------|--------------|
| Development | DEBUG | All logs (debug, info, warn, error) |
| Production | INFO | Production logs (info, warn, error) |
| Test | NONE | No logs (clean test output) |

## 🔧 **Method 1: Environment Variables (Recommended)**

### **For Client-Side (Frontend)**
Set `NEXT_PUBLIC_LOG_LEVEL` in your environment or `.env.local`:

```bash
# .env.local (create if doesn't exist)
NEXT_PUBLIC_LOG_LEVEL=DEBUG
```

### **For Server-Side (Backend)**
Set `LOG_LEVEL` in your environment or `.env.local`:

```bash
# .env.local
LOG_LEVEL=INFO
```

### **Available Log Levels**
- `DEBUG` - Show everything (development debugging)
- `INFO` - Show info, warn, error (production safe)
- `WARN` - Show warnings and errors only
- `ERROR` - Show only errors
- `NONE` - Show nothing (silent)

## 🚀 **Quick Commands**

### **1. Debug Everything (Development)**
```bash
# Terminal 1 (start with debug logging)
NEXT_PUBLIC_LOG_LEVEL=DEBUG LOG_LEVEL=DEBUG npm run dev
```

### **2. Production Mode Simulation**
```bash
# Terminal 1 (simulate production logging)
NEXT_PUBLIC_LOG_LEVEL=INFO LOG_LEVEL=INFO npm run dev
```

### **3. Silent Mode (Clean Output)**
```bash
# Terminal 1 (minimal logging)
NEXT_PUBLIC_LOG_LEVEL=ERROR LOG_LEVEL=ERROR npm run dev
```

### **4. Completely Silent**
```bash
# Terminal 1 (no logs at all)
NEXT_PUBLIC_LOG_LEVEL=NONE LOG_LEVEL=NONE npm run dev
```

## 📁 **Method 2: Environment Files**

### **Create/Edit `.env.local`**
```bash
# In project root: /Users/doron/Projects/RealTechee 2.0/.env.local

# Client-side logging (browser console)
NEXT_PUBLIC_LOG_LEVEL=DEBUG

# Server-side logging (terminal/server logs)
LOG_LEVEL=INFO

# Next.js environment
NODE_ENV=development
```

### **Different Environment Files**
```bash
# .env.development (development only)
NEXT_PUBLIC_LOG_LEVEL=DEBUG
LOG_LEVEL=DEBUG

# .env.production (production only)  
NEXT_PUBLIC_LOG_LEVEL=INFO
LOG_LEVEL=INFO

# .env.local (local overrides - gitignored)
NEXT_PUBLIC_LOG_LEVEL=DEBUG
LOG_LEVEL=DEBUG
```

## 🛠️ **Method 3: Runtime Override**

### **Temporary Session Override**
```bash
# Set for current terminal session
export NEXT_PUBLIC_LOG_LEVEL=DEBUG
export LOG_LEVEL=DEBUG
npm run dev
```

### **Single Command Override**
```bash
# Set for single command
NEXT_PUBLIC_LOG_LEVEL=DEBUG LOG_LEVEL=DEBUG npm run dev
```

## 🧪 **Testing Different Scenarios**

### **Scenario 1: Debugging Agent Contact Loading**
```bash
# Enable debug logs to see contact loading details
NEXT_PUBLIC_LOG_LEVEL=DEBUG npm run dev
```
Then visit: http://localhost:3001/project?projectId=68

### **Scenario 2: Production Simulation**
```bash
# Test what logs will appear in production
NEXT_PUBLIC_LOG_LEVEL=INFO LOG_LEVEL=INFO npm run dev
```

### **Scenario 3: Error Debugging Only**
```bash
# Only show errors to focus on problems
NEXT_PUBLIC_LOG_LEVEL=ERROR LOG_LEVEL=ERROR npm run dev
```

## 📍 **Where to Set Environment Variables**

### **Option A: .env.local (Recommended for development)**
```bash
# Create file: /Users/doron/Projects/RealTechee 2.0/.env.local
NEXT_PUBLIC_LOG_LEVEL=DEBUG
LOG_LEVEL=DEBUG
```

### **Option B: Terminal/Shell Profile**
```bash
# Add to ~/.zshrc or ~/.bashrc
export NEXT_PUBLIC_LOG_LEVEL=DEBUG
export LOG_LEVEL=DEBUG
```

### **Option C: IDE/Editor Configuration**
Most IDEs allow you to set environment variables in run configurations.

### **Option D: Docker/Deployment**
```yaml
# docker-compose.yml or deployment config
environment:
  - NEXT_PUBLIC_LOG_LEVEL=INFO
  - LOG_LEVEL=INFO
  - NODE_ENV=production
```

## 🔍 **Debugging Specific Components**

### **AgentInfoCard Debug Logs**
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG npm run dev
# Look for: "RealTechee | DEBUG | AgentInfoCard | Agent data loaded"
```

### **ProjectsAPI Debug Logs**
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG npm run dev  
# Look for: "RealTechee | DEBUG | ProjectsAPI | Project query result"
```

### **Gallery Utils Debug Logs**
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG npm run dev
# Look for: "RealTechee | DEBUG | GalleryUtils | Extracting gallery images"
```

## ⚠️ **Important Notes**

### **Client vs Server Variables**
- `NEXT_PUBLIC_LOG_LEVEL` - Controls browser console logs (client-side)
- `LOG_LEVEL` - Controls terminal logs (server-side)
- Both can be set to different levels if needed

### **Environment Precedence**
1. Command line variables (highest priority)
2. `.env.local` file
3. `.env.development` / `.env.production`
4. Default based on NODE_ENV (lowest priority)

### **Browser Console**
Client-side logs appear in browser DevTools Console:
- Chrome: F12 → Console tab
- Firefox: F12 → Console tab
- Safari: Develop → Show Web Inspector → Console

### **Server Console**
Server-side logs appear in the terminal where you run `npm run dev`.

## 🎯 **Recommended Settings**

### **Development (Default)**
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG  # See everything in browser
LOG_LEVEL=INFO               # Structured server logs
```

### **Production**
```bash
NEXT_PUBLIC_LOG_LEVEL=INFO   # Clean browser console
LOG_LEVEL=INFO               # Essential server logs only
```

### **Debugging Issues**
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG  # Full debugging info
LOG_LEVEL=DEBUG              # Full server debugging
```

### **Demo/Presentation**
```bash
NEXT_PUBLIC_LOG_LEVEL=ERROR  # Clean console for demos
LOG_LEVEL=ERROR              # Minimal server output
```

## 🚀 **Quick Start Commands**

```bash
# Current project directory
cd "/Users/doron/Projects/RealTechee 2.0"

# Option 1: Create .env.local file
echo "NEXT_PUBLIC_LOG_LEVEL=DEBUG" > .env.local
echo "LOG_LEVEL=DEBUG" >> .env.local
npm run dev

# Option 2: One-time override
NEXT_PUBLIC_LOG_LEVEL=DEBUG LOG_LEVEL=DEBUG npm run dev

# Option 3: Session override
export NEXT_PUBLIC_LOG_LEVEL=DEBUG
export LOG_LEVEL=DEBUG
npm run dev
```