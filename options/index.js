const saveOptions = (e) => {
  e.preventDefault()

  // Force blur to ensure autofill value is committed
  const emailInput = document.querySelector("#email")
  emailInput.blur()

  const saveBtn = document.querySelector(".save-btn")
  const originalText = "Save"
  const savedText = "Saved!"

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
  // Create spinner element safely
  const spinner = document.createElement("span")
  spinner.className = "spinner"
  spinner.setAttribute("aria-label", "Loading")
  
  saveBtn.textContent = ""
  saveBtn.appendChild(spinner)
  saveBtn.appendChild(document.createTextNode("Save"))

  browser.storage.local
    .set({
      email: emailInput.value,
      domainMode: document.querySelector("#domainMode").value,
    })
    .then(() => {
      setTimeout(() => {
        // Show Saved!
        saveBtn.classList.remove("saving")
        saveBtn.textContent = savedText
        setTimeout(() => {
          saveBtn.textContent = originalText
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
saveBtn.textContent = "Save"
saveBtn.style.minWidth = "110px"
