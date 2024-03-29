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

/* Handle Click */
const getHostnameByTab = (tab) => new URL(tab.url).hostname

const getSettingEmailAddress = () => browser.storage.local.get("email")

const getLabeledEmailAddress = (emailAddress, hostname) => {
  const [preEmail, postEmail] = emailAddress.split("@")

  const fixedHostname =
    hostname !== "www.gov.uk" ? hostname.replace(".uk", "") : hostname

  const hostnameArr = fixedHostname.split(".")

  const label = hostnameArr[hostnameArr.length - 2]

  return `${preEmail}+${label}@${postEmail}`
}

const handleClick = async (tab) => {
  const hostname = getHostnameByTab(tab)

  const { email: emailAddress } = await getSettingEmailAddress()

  if (emailAddress) {
    navigator.clipboard.writeText(
      getLabeledEmailAddress(emailAddress, hostname),
    )

    chrome.browserAction.setBadgeBackgroundColor({
      color: "rgba(0,0,0,0)",
    })

    chrome.browserAction.setBadgeText({
      text: "👍",
    })

    setTimeout(() => {
      chrome.browserAction.setBadgeText({
        text: "",
      })
    }, 2000)
  } else {
    chrome.browserAction.setBadgeText({
      text: "X",
    })

    setTimeout(() => {
      chrome.browserAction.setBadgeText({
        text: "",
      })
    }, 3000)
  }
}

browser.browserAction.onClicked.addListener(handleClick)
