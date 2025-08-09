// tooltip.js
;(async function () {
  const title = document.getElementById("card-title")
  const subtitle = document.getElementById("card-subtitle")
  let email = ""
  let domainMode = "main"
  let hostname = ""
  try {
    // Get email and domainMode from storage
    const result = await (window.browser
      ? browser.storage.local.get(["email", "domainMode"])
      : new Promise((resolve) =>
          chrome.storage.local.get(["email", "domainMode"], resolve),
        ))
    email = result.email || result["email"] || ""
    domainMode = result.domainMode || result["domainMode"] || "main"
    // Get the current tab's hostname
    let tabs
    if (window.browser) {
      tabs = await browser.tabs.query({ active: true, currentWindow: true })
    } else {
      tabs = await new Promise((resolve) =>
        chrome.tabs.query({ active: true, currentWindow: true }, resolve),
      )
    }
    if (tabs && tabs[0]) {
      try {
        hostname = new URL(tabs[0].url).hostname
      } catch (e) {
        hostname = ""
      }
    }
  } catch (e) {
    email = ""
  }
  if (!email || email.trim() === "") {
    title.textContent = "❌ Email address missing"
    subtitle.textContent =
      "Please set your email address in the extension preferences."
    subtitle.classList.add("error")
  } else {
    // Generate labeled email
    let labeledEmail = email
    if (hostname) {
      const [preEmail, postEmail] = email.split("@")
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
      labeledEmail = `${preEmail}+${label}@${postEmail}`
    }
    // Try to copy
    try {
      await navigator.clipboard.writeText(labeledEmail)
    } catch (e) {}
    title.textContent = "📧 Email address copied"
    subtitle.textContent = "You can now paste it where you need."
    subtitle.classList.remove("error")
  }
  // Auto-close after 2s
  setTimeout(() => window.close(), 2000)
})()
