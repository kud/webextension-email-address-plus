/* Handle icon */
const getBrowserAPI = () => {
  if (typeof browser !== "undefined" && browser.browserAction) {
    return browser
  } else if (typeof chrome !== "undefined" && chrome.browserAction) {
    return chrome
  }
  throw new Error("No browser API available")
}

const parseRGBColor = (colorString) => {
  const rgbMatch = colorString.match(/rgb\(([^)]+)\)/)
  if (!rgbMatch) return null

  const values = rgbMatch[1].split(",").map((v) => parseFloat(v.trim()))
  if (values.length !== 3 || values.some(isNaN)) return null

  return values
}

const calculateBrightness = (r, g, b) => {
  // Using luminance formula
  return (r * 299 + g * 587 + b * 114) / 1000
}

const updateIcon = async () => {
  try {
    const api = getBrowserAPI()
    const theme = await api.theme.getCurrent()

    let isDark = false

    // Check toolbar color brightness
    const toolbarColor = theme.colors?.toolbar || "rgb(255, 255, 255)"

    if (toolbarColor.includes("rgb(")) {
      const rgbValues = parseRGBColor(toolbarColor)
      if (rgbValues) {
        const [r, g, b] = rgbValues
        const brightness = calculateBrightness(r, g, b)
        isDark = brightness < 128
      }
    }

    const iconPath = isDark ? "src/icons/icon-dark.svg" : "src/icons/icon.svg"

    await api.browserAction.setIcon({
      path: {
        16: iconPath,
        32: iconPath,
        48: iconPath,
      },
    })
  } catch (error) {
    console.error("Icon update failed:", error)
    try {
      const api = getBrowserAPI()
      await api.browserAction.setIcon({ path: "src/icons/icon.svg" })
    } catch (fallbackError) {
      console.error("Fallback icon update failed:", fallbackError)
    }
  }
}

// Initialize
;(async () => {
  try {
    const api = getBrowserAPI()

    // Set initial icon
    await updateIcon()

    // Update when theme changes
    if (api.theme && api.theme.onUpdated) {
      api.theme.onUpdated.addListener(updateIcon)
    }

    // Update when switching tabs (adaptive colors change per site)
    if (api.tabs && api.tabs.onActivated) {
      api.tabs.onActivated.addListener(updateIcon)
    }

    // Update when tab content changes
    if (api.tabs && api.tabs.onUpdated) {
      api.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === "complete") {
          // Small delay to let adaptive tab color do its thing
          setTimeout(updateIcon, 100)
        }
      })
    }

    // Set up click handler
    if (api.browserAction && api.browserAction.onClicked) {
      api.browserAction.onClicked.addListener(handleClick)
    }

    // Listen for keyboard shortcuts
    if (api.commands && api.commands.onCommand) {
      api.commands.onCommand.addListener(async (command, tab) => {
        if (command === "fill-focused-field") {
          await handleFillFocusedField(tab)
        }
      })
    }

    // Create context menu
    if (api.contextMenus) {
      api.contextMenus.create({
        id: "fill-labeled-email",
        title: "Fill with labeled email",
        contexts: ["editable"],
        documentUrlPatterns: ["http://*/*", "https://*/*"],
      })
    }

    // Handle context menu clicks
    if (api.contextMenus && api.contextMenus.onClicked) {
      api.contextMenus.onClicked.addListener(async (info, tab) => {
        if (info.menuItemId === "fill-labeled-email") {
          await handleContextMenuClick(tab)
        }
      })
    }

  } catch (error) {
    console.error("Extension initialization failed:", error)
  }
})()

/* Handle Click */
const getHostnameByTab = (tab) => {
  try {
    const url = new URL(tab.url)

    // Skip special protocols
    if (
      url.protocol === "chrome:" ||
      url.protocol === "about:" ||
      url.protocol === "moz-extension:" ||
      url.protocol === "chrome-extension:"
    ) {
      return ""
    }

    return url.hostname
  } catch (e) {
    console.warn("Invalid tab URL:", tab.url)
    return ""
  }
}

const getStorageData = async (keys) => {
  const api = getBrowserAPI()
  if (api.storage) {
    return await api.storage.local.get(keys)
  }
  throw new Error("Storage API not available")
}

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

const getLabeledEmailAddress = (
  emailAddress,
  hostname,
  domainMode = "main",
) => {
  if (!emailAddress || !emailAddress.includes("@")) {
    return emailAddress
  }

  const atIndex = emailAddress.lastIndexOf("@")
  if (atIndex <= 0) return emailAddress

  const preEmail = emailAddress.substring(0, atIndex)
  const postEmail = emailAddress.substring(atIndex + 1)
  const label = generateLabel(hostname, domainMode)

  return label ? `${preEmail}+${label}@${postEmail}` : emailAddress
}

const handleContextMenuClick = async (tab) => {
  try {
    const hostname = getHostnameByTab(tab)
    const { email: emailAddress, domainMode } = await getStorageData([
      "email",
      "domainMode",
    ])
    const trimmedEmail = (emailAddress || "").trim()

    if (trimmedEmail && hostname) {
      const labeledEmail = getLabeledEmailAddress(
        trimmedEmail,
        hostname,
        domainMode || "main",
      )

      // Send message to content script to fill the email field
      const api = getBrowserAPI()
      try {
        await api.tabs.sendMessage(tab.id, {
          action: "fillEmailField",
          labeledEmail: labeledEmail,
        })
      } catch (error) {
        console.error("Failed to communicate with content script:", error)
      }
    }
  } catch (error) {
    console.error("Context menu click failed:", error)
  }
}

const handleFillFocusedField = async (tab) => {
  try {
    const hostname = getHostnameByTab(tab)
    const { email: emailAddress, domainMode } = await getStorageData([
      "email",
      "domainMode",
    ])
    const trimmedEmail = (emailAddress || "").trim()

    if (trimmedEmail && hostname) {
      const labeledEmail = getLabeledEmailAddress(
        trimmedEmail,
        hostname,
        domainMode || "main",
      )

      // Send message to content script to fill the focused field
      const api = getBrowserAPI()
      try {
        await api.tabs.sendMessage(tab.id, {
          action: "fillFocusedField",
          labeledEmail: labeledEmail,
        })
      } catch (error) {
        console.error("Failed to communicate with content script:", error)
      }
    }
  } catch (error) {
    console.error("Fill focused field failed:", error)
  }
}

const handleClick = async () => {
  try {
    const { email: emailAddress } = await getStorageData(["email"])
    const trimmedEmail = (emailAddress || "").trim()

    if (trimmedEmail) {
      // Open popup programmatically (Chrome only)
      // The popup will handle email generation and copying
      const api = getBrowserAPI()
      if (api === chrome && chrome.browserAction?.openPopup) {
        try {
          chrome.browserAction.openPopup()
        } catch (e) {
          console.warn("Failed to open popup:", e)
        }
      }
    } else {
      // Handle missing email - open popup for error display
      const api = getBrowserAPI()
      if (api === chrome && chrome.browserAction?.openPopup) {
        try {
          chrome.browserAction.openPopup()
        } catch (e) {
          console.warn("Failed to open error popup:", e)
        }
      }
    }
  } catch (error) {
    console.error("Handle click failed:", error)
  }
}
