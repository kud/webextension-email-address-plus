const saveOptions = async (e) => {
  e.preventDefault()

  // Force blur to ensure autofill value is committed
  const emailInput = document.querySelector("#email")
  emailInput.blur()

  const saveBtn = document.querySelector(".save-btn")
  const originalText = "Save"
  const savedText = "Saved!"

  // Enhanced email validation
  const emailValue = emailInput.value.trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailValue) {
    emailInput.classList.add("invalid")
    emailInput.focus()
    return
  } else if (!emailRegex.test(emailValue)) {
    emailInput.classList.add("invalid")
    emailInput.focus()
    // Could add a specific error message here
    return
  } else {
    emailInput.classList.remove("invalid")
  }

  // Set loading state
  saveBtn.classList.add("saving")
  // Create spinner element safely
  const spinner = document.createElement("span")
  spinner.className = "spinner"
  spinner.setAttribute("aria-label", "Loading")
  
  saveBtn.textContent = ""
  saveBtn.appendChild(spinner)
  saveBtn.appendChild(document.createTextNode("Save"))

  // Get browser API with compatibility
  const getBrowserAPI = () => {
    if (typeof browser !== 'undefined' && browser.storage) {
      return browser
    } else if (typeof chrome !== 'undefined' && chrome.storage) {
      return chrome
    }
    throw new Error("No browser storage API available")
  }
  
  try {
    const api = getBrowserAPI()
    await api.storage.local.set({
      email: emailValue,
      domainMode: document.querySelector("#domainMode").value,
    })
    
    setTimeout(() => {
      // Show Saved!
      saveBtn.classList.remove("saving")
      saveBtn.textContent = savedText
      setTimeout(() => {
        saveBtn.textContent = originalText
      }, 1200)
    }, 400)
  } catch (error) {
    console.error("Failed to save options:", error)
    saveBtn.classList.remove("saving")
    saveBtn.textContent = "Error!"
    setTimeout(() => {
      saveBtn.textContent = originalText
    }, 2000)
  }
}

const restoreOptions = async () => {
  try {
    const getBrowserAPI = () => {
      if (typeof browser !== 'undefined' && browser.storage) {
        return browser
      } else if (typeof chrome !== 'undefined' && chrome.storage) {
        return chrome
      }
      throw new Error("No browser storage API available")
    }
    
    const api = getBrowserAPI()
    const { email, domainMode } = await api.storage.local.get([
      "email",
      "domainMode",
    ])

    const emailInput = document.querySelector("#email")
    const domainModeSelect = document.querySelector("#domainMode")
    
    if (email && emailInput) {
      emailInput.value = email
    }
    if (domainMode && domainModeSelect) {
      domainModeSelect.value = domainMode
    }
    
    // Update preview after restoring values
    updatePreview()
  } catch (error) {
    console.error("Failed to restore options:", error)
  }
}

// Email preview functionality
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
  
  return label.replace(/[^a-zA-Z0-9.-]/g, "").toLowerCase()
}

const generatePreviewEmail = (email, hostname, domainMode) => {
  if (!email || !email.includes("@")) return email
  
  const atIndex = email.lastIndexOf("@")
  if (atIndex <= 0) return email
  
  const preEmail = email.substring(0, atIndex)
  const postEmail = email.substring(atIndex + 1)
  const label = generateLabel(hostname, domainMode)
  
  return label ? `${preEmail}+${label}@${postEmail}` : email
}

const updatePreview = () => {
  const emailInput = document.querySelector("#email")
  const domainModeSelect = document.querySelector("#domainMode")
  const previewGroup = document.querySelector("#preview-group")
  const previewDiv = document.querySelector("#email-preview")
  
  const email = emailInput.value.trim()
  const domainMode = domainModeSelect.value
  
  if (!email || !email.includes("@")) {
    previewGroup.style.display = "none"
    return
  }
  
  // Sample websites for examples
  const sampleSites = [
    { hostname: "github.com", name: "GitHub" },
    { hostname: "www.amazon.com", name: "Amazon" },
    { hostname: "mail.google.com", name: "Gmail" }
  ]
  
  let previewHTML = ""
  sampleSites.forEach(site => {
    const generatedEmail = generatePreviewEmail(email, site.hostname, domainMode)
    previewHTML += `
      <div class="preview-item">
        <span class="preview-label">${site.name}:</span>
        <span class="preview-email">${generatedEmail}</span>
      </div>
    `
  })
  
  previewDiv.innerHTML = previewHTML
  previewGroup.style.display = "block"
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.querySelector("form").addEventListener("submit", saveOptions)

// Add event listeners for preview
document.querySelector("#email").addEventListener("input", updatePreview)
document.querySelector("#domainMode").addEventListener("change", updatePreview)

// On load, always set the button to 'Save' and fixed width
const saveBtn = document.querySelector(".save-btn")
saveBtn.textContent = "Save"
saveBtn.style.minWidth = "110px"
