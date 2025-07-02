# Log Level Control Examples

## 🎯 **Quick Commands for Your Project**

### **Method 1: Environment Variables (.env.local file)**

Create or edit `.env.local` in your project root:

```bash
# Navigate to project
cd "/Users/doron/Projects/RealTechee 2.0"

# Create .env.local with debug logging
cat > .env.local << EOF
NEXT_PUBLIC_LOG_LEVEL=DEBUG
LOG_LEVEL=DEBUG
EOF

# Start with debug logging
npm run dev
```

### **Method 2: One-Time Command Override**

```bash
# Debug everything (recommended for development)
NEXT_PUBLIC_LOG_LEVEL=DEBUG LOG_LEVEL=DEBUG npm run dev

# Production simulation (clean logs)
NEXT_PUBLIC_LOG_LEVEL=INFO LOG_LEVEL=INFO npm run dev

# Error only (minimal output)
NEXT_PUBLIC_LOG_LEVEL=ERROR LOG_LEVEL=ERROR npm run dev

# Silent mode (no logs)
NEXT_PUBLIC_LOG_LEVEL=NONE LOG_LEVEL=NONE npm run dev
```

### **Method 3: Runtime Control (Browser Console)**

While your app is running, open browser DevTools (F12) and type:

```javascript
// See current log level
getLogLevel()

// Enable debug logs
setLogLevel('DEBUG')

// Enable only errors
setLogLevel('ERROR')

// See available levels
LogLevel
```

## 🧪 **Testing Scenarios**

### **Test Agent Contact Loading**
```bash
# Enable debug logs
NEXT_PUBLIC_LOG_LEVEL=DEBUG npm run dev

# Visit project page
# Open browser console (F12)
# Go to: http://localhost:3001/project?projectId=68
# Look for logs like:
# "RealTechee | DEBUG | AgentInfoCard | Agent data loaded"
# "RealTechee | INFO | RelationAPI | Contacts loaded successfully"
```

### **Test Gallery Functionality**
```bash
# Enable debug logs
NEXT_PUBLIC_LOG_LEVEL=DEBUG npm run dev

# Visit project page  
# Look for logs like:
# "RealTechee | DEBUG | GalleryUtils | Extracting gallery images"
# "RealTechee | INFO | GalleryUtils | Gallery URLs parsed successfully"
```

### **Test Production Readiness**
```bash
# Simulate production logging
NEXT_PUBLIC_LOG_LEVEL=INFO LOG_LEVEL=INFO npm run dev

# Visit app - you should see:
# ✅ Clean, structured logs
# ✅ No debug spam
# ✅ Important events logged
# ❌ No detailed debugging info
```

## 📍 **Current Files Updated with Logging**

### **✅ Ready to Test**
- `server.js` - Server startup and errors
- `components/projects/AgentInfoCard.tsx` - Agent contact loading
- `components/projects/ProjectsGridSection.tsx` - Project grid interactions
- `utils/galleryUtils.ts` - Gallery image parsing
- `utils/amplifyAPI.ts` - API operations (partial)
- `hooks/useProjectData.ts` - Data loading hooks (partial)

### **🔍 What to Look For**

**AgentInfoCard Logs:**
```
RealTechee | DEBUG | AgentInfoCard | Agent data loaded
RealTechee | INFO | AgentInfoCard | Agent contact loaded successfully
RealTechee | WARN | AgentInfoCard | No agent contact data available, using fallback
```

**ProjectsGridSection Logs:**
```
RealTechee | DEBUG | ProjectsGridSection | Handling project click
RealTechee | INFO | ProjectsGridSection | Loading project data from API
RealTechee | INFO | ProjectsGridSection | Storing complete project data in sessionStorage
```

**Gallery Utils Logs:**
```
RealTechee | DEBUG | GalleryUtils | Extracting gallery images from project
RealTechee | INFO | GalleryUtils | Gallery URLs parsed successfully
```

## 🎛️ **Live Demo Commands**

```bash
# Terminal 1: Start with full debugging
cd "/Users/doron/Projects/RealTechee 2.0"
NEXT_PUBLIC_LOG_LEVEL=DEBUG LOG_LEVEL=DEBUG npm run dev

# Browser: Visit http://localhost:3001/project?projectId=68
# Browser: Open DevTools Console (F12)
# Browser: Click around to see structured logs

# Browser Console: Try runtime control
setLogLevel('INFO')    // Reduce noise
setLogLevel('ERROR')   // Only errors
setLogLevel('DEBUG')   // Back to full debug
```