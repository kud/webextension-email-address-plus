const saveOptions = (e) => {
  e.preventDefault()

  // Force blur to ensure autofill value is committed
  const emailInput = document.querySelector("#email")
  emailInput.blur()

  const saveBtn = document.querySelector(".save-btn")
  const originalHTML = "Save"
  const loadingHTML =
    '<span class="spinner" aria-label="Loading" style="margin-right:6px;"></span>Save'
  const savedHTML = "Saved!"

  // Validate email is not empty
  if (!emailInput.value.trim()) {
    emailInput.classList.add("invalid")
    emailInput.focus()
    return
  } else {
    emailInput.classList.remove("invalid")
  }

  // Set loading state
  saveBtn.classList.add("saving")
  saveBtn.innerHTML = loadingHTML

  browser.storage.local
    .set({
      email: emailInput.value,
      domainMode: document.querySelector("#domainMode").value,
    })
    .then(() => {
      setTimeout(() => {
        // Show Saved!
        saveBtn.classList.remove("saving")
        saveBtn.innerHTML = savedHTML
        setTimeout(() => {
          saveBtn.innerHTML = originalHTML
        }, 1200)
      }, 400)
    })
}

const restoreOptions = async () => {
  const { email, domainMode } = await browser.storage.local.get([
    "email",
    "domainMode",
  ])

  if (email) {
    document.querySelector("#email").value = email
  }
  if (domainMode) {
    document.querySelector("#domainMode").value = domainMode
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions)
document.querySelector("form").addEventListener("submit", saveOptions)

// On load, always set the button to 'Save' and fixed width
const saveBtn = document.querySelector(".save-btn")
saveBtn.innerHTML = "Save"
saveBtn.style.minWidth = "110px"
