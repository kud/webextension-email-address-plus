/* Handle icon */
const updateIcon = async () => {
  try {
    const theme = await browser.theme.getCurrent()
    console.log("Current theme:", theme)
    
    let isDark = false
    
    // Check toolbar color brightness 
    const toolbarColor = theme.colors?.toolbar || "rgb(255, 255, 255)"
    console.log("Toolbar color:", toolbarColor)
    
    if (toolbarColor.includes("rgb(")) {
      const rgb = toolbarColor.match(/rgb\(([^)]+)\)/)
      if (rgb) {
        const [r, g, b] = rgb[1].split(",").map(v => parseFloat(v.trim()))
        const brightness = (r * 299 + g * 587 + b * 114) / 1000
        isDark = brightness < 128
        console.log("RGB:", r, g, b, "Brightness:", brightness, "isDark:", isDark)
      }
    }
    
    const iconPath = isDark ? "icons/icon-dark.svg" : "icons/icon.svg"
    console.log("Setting icon to:", iconPath)
    
    browser.browserAction.setIcon({
      path: {
        "16": iconPath,
        "32": iconPath,
        "48": iconPath
      }
    })
  } catch (error) {
    console.error("Icon update failed:", error)
    browser.browserAction.setIcon({ path: "icons/icon.svg" })
  }
}

// Set initial icon
updateIcon()

// Update when theme changes
browser.theme.onUpdated.addListener(updateIcon)

// Update when switching tabs (adaptive colors change per site)
browser.tabs.onActivated.addListener(updateIcon)

// Update when tab content changes
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') {
    // Small delay to let adaptive tab color do its thing
    setTimeout(updateIcon, 100)
  }
})

/* Handle Click */
const getHostnameByTab = (tab) => new URL(tab.url).hostname

const getSettingEmailAddress = () => browser.storage.local.get("email")

const getLabeledEmailAddress = (emailAddress, hostname) => {
  const [preEmail, postEmail] = emailAddress.split("@")

  // Get domain mode from storage (sync call not possible, so pass as param in real use)
  // Here, we use a workaround: get from window if set, else default to 'main'
  const domainMode = window._domainMode || "main"

  const hostnameArr = hostname.split(".")
  let label = hostname
  if (domainMode === "main") {
    if (hostnameArr.length >= 2) {
      label = hostnameArr.slice(-2).join(".")
    }
  } else if (domainMode === "short") {
    if (hostnameArr.length >= 2) {
      label = hostnameArr[hostnameArr.length - 2]
    }
  }
  return `${preEmail}+${label}@${postEmail}`
}

const handleClick = async (tab) => {
  const hostname = getHostnameByTab(tab)

  const { email: emailAddress, domainMode } = await browser.storage.local.get([
    "email",
    "domainMode",
  ])

  // Make domainMode available to getLabeledEmailAddress
  window._domainMode = domainMode || "main"

  if (emailAddress && emailAddress.trim() !== "") {
    navigator.clipboard.writeText(
      getLabeledEmailAddress(emailAddress, hostname),
    )
    // Open the popup programmatically (works in Chrome, not in Firefox)
    if (chrome?.browserAction?.openPopup) {
      chrome.browserAction.openPopup()
    }
  } else {
    // Open the popup with error message (works in Chrome, not in Firefox)
    if (chrome?.browserAction?.openPopup) {
      // Set a query param to indicate error
      chrome.browserAction.setPopup(
        {
          popup: "tooltip.html?error=noemail",
          tabId: tab.id,
        },
        () => {
          chrome.browserAction.openPopup()
          // Restore default popup after a short delay
          setTimeout(() => {
            chrome.browserAction.setPopup({
              popup: "tooltip.html",
              tabId: tab.id,
            })
          }, 1300)
        },
      )
    }
  }
}

browser.browserAction.onClicked.addListener(handleClick)

// Listen for the keyboard shortcut
browser.commands.onCommand.addListener((command, tab) => {
  if (command === "copy-labeled-email") {
    handleClick(tab)
  }
})
