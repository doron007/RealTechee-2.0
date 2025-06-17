# Log Level Presets - Quick Copy & Paste

This file contains ready-to-use log level configurations for different scenarios. Simply copy and paste the desired preset into your `.env.local` file.

## 🔍 **Development Mode (Default)**
```bash
# Full debugging - see everything
NEXT_PUBLIC_LOG_LEVEL=DEBUG
LOG_LEVEL=DEBUG
```

## 🚀 **Production Simulation**
```bash
# Clean, professional logging
NEXT_PUBLIC_LOG_LEVEL=INFO
LOG_LEVEL=INFO
```

## 🎯 **Demo/Presentation Mode**
```bash
# Clean console for demos
NEXT_PUBLIC_LOG_LEVEL=INFO
LOG_LEVEL=ERROR
```

## 🐛 **Bug Hunting Mode**
```bash
# Frontend debug, backend clean
NEXT_PUBLIC_LOG_LEVEL=DEBUG
LOG_LEVEL=INFO
```

## ⚠️ **Issues Focus Mode**
```bash
# Only warnings and errors
NEXT_PUBLIC_LOG_LEVEL=WARN
LOG_LEVEL=WARN
```

## 🔇 **Silent Mode**
```bash
# No logs at all
NEXT_PUBLIC_LOG_LEVEL=NONE
LOG_LEVEL=NONE
```

## ❌ **Errors Only**
```bash
# Critical issues only
NEXT_PUBLIC_LOG_LEVEL=ERROR
LOG_LEVEL=ERROR
```

## 🧪 **Performance Testing**
```bash
# Minimal overhead
NEXT_PUBLIC_LOG_LEVEL=NONE
LOG_LEVEL=ERROR
```

## 📱 **Mobile Development**
```bash
# Reduce console noise on mobile
NEXT_PUBLIC_LOG_LEVEL=WARN
LOG_LEVEL=INFO
```

---

## 📋 **How to Use**

1. **Open**: `/Users/doron/Projects/RealTechee 2.0/.env.local`
2. **Replace** the active log level lines with your chosen preset
3. **Save** the file
4. **Restart** the dev server: `npm run dev`

## 🎛️ **Alternative: Runtime Control**

For instant changes without restart, use browser console:
```javascript
setLogLevel('DEBUG')   // or INFO, WARN, ERROR, NONE
```