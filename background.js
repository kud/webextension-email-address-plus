const getHostnameByTab = () => new URL(tab.url).hostname

const getSettingEmailAddress = () => browser.storage.local.get("email").email

const getLabeledEmailAddress = (emailAddress, hostname) => {
  const [preEmail, postEmail] = emailAddress.split("@")

  const fixedHostname = hostname.replace(".uk", "")

  const hostnameArr = fixedHostname.split(".")

  const label = hostnameArr[hostnameArr.length - 2]

  return `${preEmail}+${label}@${postEmail}`
}

const handleClick = async (tab) => {
  const hostname = getHostnameByTab(tab)

  const emailAddress = await getSettingEmailAddress()

  navigator.clipboard.writeText(getLabeledEmailAddress(emailAddress, hostname))
}

browser.browserAction.onClicked.addListener(handleClick)
