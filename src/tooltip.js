// tooltip.js
;(async function () {
  const title = document.getElementById("card-title")
  const subtitle = document.getElementById("card-subtitle")
  
  if (!title || !subtitle) {
    console.error("Required DOM elements not found")
    return
  }
  
  let email = ""
  let domainMode = "main"
  let hostname = ""
  
  // Helper function for browser API compatibility
  const getStorageData = async (keys) => {
    if (typeof browser !== 'undefined' && browser.storage) {
      return await browser.storage.local.get(keys)
    } else if (typeof chrome !== 'undefined' && chrome.storage) {
      return new Promise((resolve) => chrome.storage.local.get(keys, resolve))
    }
    throw new Error("No browser storage API available")
  }
  
  const getActiveTab = async () => {
    const query = { active: true, currentWindow: true }
    if (typeof browser !== 'undefined' && browser.tabs) {
      return await browser.tabs.query(query)
    } else if (typeof chrome !== 'undefined' && chrome.tabs) {
      return new Promise((resolve) => chrome.tabs.query(query, resolve))
    }
    throw new Error("No browser tabs API available")
  }
  
  try {
    // Get email and domainMode from storage
    const result = await getStorageData(["email", "domainMode"])
    email = (result.email || "").trim()
    domainMode = result.domainMode || "main"
    
    // Get the current tab's hostname
    const tabs = await getActiveTab()
    if (tabs && tabs[0] && tabs[0].url) {
      try {
        const url = new URL(tabs[0].url)
        hostname = url.hostname
        
        // Skip special protocols
        if (url.protocol === 'chrome:' || url.protocol === 'about:' || 
            url.protocol === 'moz-extension:' || url.protocol === 'chrome-extension:') {
          hostname = ""
        }
      } catch (e) {
        console.warn("Invalid URL:", tabs[0].url)
        hostname = ""
      }
    }
  } catch (e) {
    console.error("Failed to get storage or tab data:", e)
    email = ""
  }
  // Email validation function
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.includes('@')
  }
  
  // Improved domain parsing function
  const generateLabel = (hostname, domainMode) => {
    if (!hostname) return ""
    
    const hostnameArr = hostname.split(".")
    let label = hostname
    
    switch (domainMode) {
      case "main":
        if (hostnameArr.length >= 2) {
          label = hostnameArr.slice(-2).join(".")
        }
        break
      case "short":
        if (hostnameArr.length >= 2) {
          label = hostnameArr[hostnameArr.length - 2]
        }
        break
      case "full":
      default:
        label = hostname
        break
    }
    
    // Sanitize label for email use
    return label.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase()
  }
  
  // Success animation function
  const showSuccessAnimation = (labeledEmail) => {
    const title = document.getElementById("card-title")
    const subtitle = document.getElementById("card-subtitle")
    
    // Wait a bit for tooltip to display before starting animation
    setTimeout(() => {
      title.innerHTML = '<span class="success-checkmark">✅</span>Email address copied'
      subtitle.textContent = `${labeledEmail} • Ready to paste`
    }, 200)
  }
  
  if (!email) {
    title.textContent = "❌ Email address missing"
    subtitle.textContent = "Please set your email address in the extension preferences."
    subtitle.classList.add("error")
  } else if (!isValidEmail(email)) {
    title.textContent = "❌ Invalid email format"
    subtitle.textContent = "Please check your email address in the extension preferences."
    subtitle.classList.add("error")
  } else {
    // Generate labeled email
    let labeledEmail = email
    if (hostname) {
      const atIndex = email.lastIndexOf("@")
      if (atIndex > 0) {
        const preEmail = email.substring(0, atIndex)
        const postEmail = email.substring(atIndex + 1)
        const label = generateLabel(hostname, domainMode)
        
        if (label) {
          labeledEmail = `${preEmail}+${label}@${postEmail}`
        }
      }
    }
    
    // Copy to clipboard with better error handling
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(labeledEmail)
        showSuccessAnimation(labeledEmail)
      } else {
        // Fallback for non-secure contexts
        const textArea = document.createElement("textarea")
        textArea.value = labeledEmail
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand("copy")
        document.body.removeChild(textArea)
        showSuccessAnimation(labeledEmail)
      }
      subtitle.classList.remove("error")
    } catch (e) {
      console.error("Failed to copy to clipboard:", e)
      title.textContent = "⚠️ Copy failed"
      subtitle.textContent = `Email: ${labeledEmail}`
      subtitle.classList.add("error")
    }
  }
  // Settings button functionality
  const settingsBtn = document.getElementById("settings-btn")
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      // Open options page
      if (typeof browser !== 'undefined' && browser.runtime) {
        browser.runtime.openOptionsPage()
      } else if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.openOptionsPage()
      }
    })
  }
  
  // Auto-close after 4s
  setTimeout(() => window.close(), 4000)
})()
