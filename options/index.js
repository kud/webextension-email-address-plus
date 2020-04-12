const saveOptions = (e) => {
  e.preventDefault()

  browser.storage.local.set({
    email: document.querySelector("#email").value,
  })
}

const restoreOptions = async () => {
  const { email } = await browser.storage.local.get("email")

  if (email) {
    document.querySelector("#email").value = email
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.querySelector("form").addEventListener("submit", saveOptions)
