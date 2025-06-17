# Quick Log Level Switching Guide

## 🎯 **How to Switch Log Levels**

### **Step 1: Open the config file**
```bash
# Open in your editor
code /Users/doron/Projects/RealTechee\ 2.0/.env.local

# Or edit in terminal
nano /Users/doron/Projects/RealTechee\ 2.0/.env.local
```

### **Step 2: Comment/Uncomment the desired level**

**Example: Switch from DEBUG to INFO (Production Mode)**

**Before (Development Mode):**
```bash
NEXT_PUBLIC_LOG_LEVEL=DEBUG          # 🔍 Development
# NEXT_PUBLIC_LOG_LEVEL=INFO         # 🚀 Production
LOG_LEVEL=DEBUG                      # 🔍 Development  
# LOG_LEVEL=INFO                     # 🚀 Production
```

**After (Production Mode):**
```bash
# NEXT_PUBLIC_LOG_LEVEL=DEBUG        # 🔍 Development
NEXT_PUBLIC_LOG_LEVEL=INFO           # 🚀 Production
# LOG_LEVEL=DEBUG                    # 🔍 Development  
LOG_LEVEL=INFO                       # 🚀 Production
```

### **Step 3: Restart the server**
```bash
# Stop current server (Ctrl+C)
# Then restart
npm run dev
```

## 🚀 **Common Switching Scenarios**

### **🔍 → 🚀 Development to Production**
```bash
# Comment out DEBUG lines, uncomment INFO lines
# NEXT_PUBLIC_LOG_LEVEL=DEBUG
NEXT_PUBLIC_LOG_LEVEL=INFO
# LOG_LEVEL=DEBUG
LOG_LEVEL=INFO
```

### **🚀 → 🔍 Production to Development** 
```bash
# Comment out INFO lines, uncomment DEBUG lines
NEXT_PUBLIC_LOG_LEVEL=DEBUG
# NEXT_PUBLIC_LOG_LEVEL=INFO
LOG_LEVEL=DEBUG
# LOG_LEVEL=INFO
```

### **🔇 Silent Mode for Demos**
```bash
# Comment out current lines, uncomment NONE
# NEXT_PUBLIC_LOG_LEVEL=DEBUG
NEXT_PUBLIC_LOG_LEVEL=NONE
# LOG_LEVEL=DEBUG  
LOG_LEVEL=NONE
```

### **❌ Errors Only for Debugging**
```bash
# Comment out current lines, uncomment ERROR
# NEXT_PUBLIC_LOG_LEVEL=DEBUG
NEXT_PUBLIC_LOG_LEVEL=ERROR
# LOG_LEVEL=DEBUG
LOG_LEVEL=ERROR
```

## ⚡ **No-Restart Alternative**

For instant changes without server restart, use browser console:

```javascript
// Open browser DevTools (F12) and type:
setLogLevel('INFO')    // Switch to production mode
setLogLevel('DEBUG')   // Switch to development mode  
setLogLevel('ERROR')   // Switch to errors only
setLogLevel('NONE')    // Switch to silent mode
```

## 📋 **Current Active Levels**

Your current `.env.local` is set to:
- **Frontend**: `DEBUG` (full development logging)
- **Backend**: `DEBUG` (full server logging)

To change, just edit the uncommented lines in `.env.local`!

## 🎛️ **Quick Commands**

```bash
# Edit config file
code ~/.../RealTechee\ 2.0/.env.local

# Restart server  
npm run dev

# Test in browser console
setLogLevel('INFO')
```