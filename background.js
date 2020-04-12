const handleClick = async (tab) => {
  const url = new URL(tab.url)
  const hostname = url.hostname

  const { email } = await browser.storage.local.get("email")

  const splitEmail = email.split("@")

  const preEmail = splitEmail[0]
  const postEmail = splitEmail[1]
  const label = hostname.split(".")[hostname.split(".").length - 2]

  const address = `${preEmail}+${label}@${postEmail}`

  navigator.clipboard.writeText(address)
}

browser.browserAction.onClicked.addListener(handleClick)
