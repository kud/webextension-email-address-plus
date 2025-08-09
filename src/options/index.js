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
  } catch (error) {
    console.error("Failed to restore options:", error)
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.querySelector("form").addEventListener("submit", saveOptions)

// On load, always set the button to 'Save' and fixed width
const saveBtn = document.querySelector(".save-btn")
saveBtn.textContent = "Save"
saveBtn.style.minWidth = "110px"
