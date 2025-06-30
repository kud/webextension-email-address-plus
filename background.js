/* Handle icon */
browser.theme.getCurrent().then((theme) => {
  let iconPath

  // Set the icon path based on the current theme
  if (theme.properties?.color_scheme === "dark") {
    iconPath = "icons/icon-dark.svg"
  } else {
    iconPath = "icons/icon.svg"
  }

  // Set the icon for the current tab
  browser.browserAction.setIcon({
    path: iconPath,
  })
})

// Dynamically update icon when theme changes (Firefox only)
if (browser && browser.theme && browser.theme.onUpdated) {
  browser.theme.onUpdated.addListener(() => {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    browser.browserAction.setIcon({
      path: isDark
        ? {
            16: "icons/icon-dark.svg",
            32: "icons/icon-dark.svg",
            48: "icons/icon-dark.svg",
          }
        : {
            16: "icons/icon.svg",
            32: "icons/icon.svg",
            48: "icons/icon.svg",
          },
    })
  })
}

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
