// Content script for email field detection and filling
;(() => {
  // Listen for messages from background script
  const getBrowserAPI = () => {
    if (typeof browser !== "undefined" && browser.runtime) {
      return browser
    } else if (typeof chrome !== "undefined" && chrome.runtime) {
      return chrome
    }
    return null
  }

  const api = getBrowserAPI()
  if (!api) return

  // Find email input fields on the page
  const findEmailInputs = () => {
    const emailInputs = []

    // Look for input fields with email type
    const emailTypeInputs = document.querySelectorAll('input[type="email"]')
    emailInputs.push(...emailTypeInputs)

    // Look for input fields with email-related names/ids/placeholders
    const emailNameInputs = document.querySelectorAll(`
      input[name*="email" i],
      input[id*="email" i],
      input[placeholder*="email" i],
      input[name*="mail" i],
      input[id*="mail" i],
      input[placeholder*="mail" i]
    `)
    emailNameInputs.forEach((input) => {
      if (input.type === "text" || input.type === "email" || !input.type) {
        emailInputs.push(input)
      }
    })

    // Look for common username/login fields that might accept emails
    const usernameInputs = document.querySelectorAll(`
      input[name*="username" i],
      input[id*="username" i],
      input[name*="login" i],
      input[id*="login" i],
      input[name*="user" i],
      input[id*="user" i]
    `)
    usernameInputs.forEach((input) => {
      if (input.type === "text" || !input.type) {
        // Check if this looks like it could accept an email
        const hasEmailContext =
          input.placeholder?.toLowerCase().includes("email") ||
          input.title?.toLowerCase().includes("email") ||
          input.getAttribute("aria-label")?.toLowerCase().includes("email") ||
          // Look for nearby labels that mention email
          document
            .querySelector(`label[for="${input.id}"]`)
            ?.textContent?.toLowerCase()
            .includes("email")

        if (hasEmailContext) {
          emailInputs.push(input)
        }
      }
    })

    // Remove duplicates
    return [...new Set(emailInputs)]
  }

  // Fill email field with labeled email
  const fillEmailField = (targetElement, labeledEmail) => {
    if (!targetElement || !labeledEmail) return false

    try {
      // Focus the field
      targetElement.focus()

      // Set the value
      targetElement.value = labeledEmail

      // Trigger input events to notify form frameworks
      const inputEvent = new Event("input", { bubbles: true })
      const changeEvent = new Event("change", { bubbles: true })

      targetElement.dispatchEvent(inputEvent)
      targetElement.dispatchEvent(changeEvent)

      // Brief highlight to show what was filled
      const originalBackground = targetElement.style.backgroundColor
      targetElement.style.backgroundColor = "#e8f5e8"
      targetElement.style.transition = "background-color 0.3s ease"

      setTimeout(() => {
        targetElement.style.backgroundColor = originalBackground
        setTimeout(() => {
          targetElement.style.transition = ""
        }, 300)
      }, 1000)

      return true
    } catch (error) {
      console.error("Failed to fill email field:", error)
      return false
    }
  }

  // Store the target element for context menu clicks
  let contextMenuTarget = null

  // Floating icon for quick access
  let floatingIcon = null
  let currentFocusedInput = null

  // Email generation functions (copied from background script)
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

  const generateLabeledEmail = (
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

  // Create floating icon element
  const createFloatingIcon = () => {
    const icon = document.createElement("div")
    icon.innerHTML = "📧"
    icon.style.cssText = `
      position: absolute;
      z-index: 10000;
      width: 24px;
      height: 24px;
      background: #ffffff;
      border: 1px solid #ccc;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      transition: all 0.2s ease;
      opacity: 0.8;
    `

    // Hover effects
    icon.addEventListener("mouseenter", () => {
      icon.style.opacity = "1"
      icon.style.transform = "scale(1.1)"
      icon.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)"
    })

    icon.addEventListener("mouseleave", () => {
      icon.style.opacity = "0.8"
      icon.style.transform = "scale(1)"
      icon.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)"
    })

    // Click handler
    icon.addEventListener("click", async (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (currentFocusedInput) {
        try {
          // Get current tab info and generate labeled email directly
          const hostname = window.location.hostname

          // Get email settings from storage
          const { email: emailAddress, domainMode } =
            await api.storage.local.get(["email", "domainMode"])
          const trimmedEmail = (emailAddress || "").trim()

          if (trimmedEmail && hostname) {
            const labeledEmail = generateLabeledEmail(
              trimmedEmail,
              hostname,
              domainMode || "main",
            )
            fillEmailField(currentFocusedInput, labeledEmail)
          }
        } catch (error) {
          console.error("Failed to generate labeled email:", error)
        }
      }
    })

    return icon
  }

  // Position the floating icon relative to input field
  const positionFloatingIcon = (inputElement) => {
    if (!floatingIcon || !inputElement) return

    const rect = inputElement.getBoundingClientRect()
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    floatingIcon.style.left = rect.right + scrollX - 30 + "px"
    floatingIcon.style.top = rect.top + scrollY + (rect.height - 24) / 2 + "px"
  }

  // Show floating icon
  const showFloatingIcon = (inputElement) => {
    if (!inputElement) return

    // Create icon if it doesn't exist
    if (!floatingIcon) {
      floatingIcon = createFloatingIcon()
      document.body.appendChild(floatingIcon)
    }

    currentFocusedInput = inputElement
    positionFloatingIcon(inputElement)
    floatingIcon.style.display = "flex"
  }

  // Hide floating icon
  const hideFloatingIcon = () => {
    if (floatingIcon) {
      floatingIcon.style.display = "none"
    }
    currentFocusedInput = null
  }

  // Track right-click target
  document.addEventListener("contextmenu", (event) => {
    const target = event.target

    // Store any input field as the target (for context menu functionality)
    if (
      target.tagName === "INPUT" &&
      (target.type === "text" ||
        target.type === "email" ||
        target.type === "search" ||
        !target.type)
    ) {
      contextMenuTarget = target
    } else {
      contextMenuTarget = null
    }
  })

  // Listen for messages from background script
  api.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "fillEmailField") {
      const success = fillEmailField(contextMenuTarget, request.labeledEmail)
      sendResponse({ success })
    } else if (request.action === "fillFocusedField") {
      const focusedElement = document.activeElement
      const success = fillEmailField(focusedElement, request.labeledEmail)
      sendResponse({ success })
    } else if (request.action === "hasEmailFields") {
      const emailInputs = findEmailInputs()
      sendResponse({ hasEmailFields: emailInputs.length > 0 })
    } else if (request.action === "labeledEmailResponse") {
      // Handle response for floating icon click
      if (currentFocusedInput && request.labeledEmail) {
        fillEmailField(currentFocusedInput, request.labeledEmail)
      }
      sendResponse({ success: true })
    }

    return true // Keep the message channel open for async response
  })

  // Focus and blur event listeners for floating icon
  document.addEventListener("focusin", async (event) => {
    const target = event.target
    if (target.tagName === "INPUT" && target.type === "email") {
      // Check if floating icon is enabled in settings
      try {
        const { showFloatingIcon: iconEnabled } = await api.storage.local.get([
          "showFloatingIcon",
        ])
        if (iconEnabled !== false) {
          // Default to true if not set
          showFloatingIcon(target)
        }
      } catch (error) {
        console.error("Failed to check floating icon setting:", error)
        // Default to showing the icon if there's an error
        showFloatingIcon(target)
      }
    }
  })

  document.addEventListener("focusout", (event) => {
    // Small delay to allow clicking the floating icon before it disappears
    setTimeout(() => {
      if (document.activeElement !== currentFocusedInput) {
        hideFloatingIcon()
      }
    }, 150)
  })

  // Update icon position on scroll or resize
  window.addEventListener("scroll", () => {
    if (currentFocusedInput && floatingIcon) {
      positionFloatingIcon(currentFocusedInput)
    }
  })

  window.addEventListener("resize", () => {
    if (currentFocusedInput && floatingIcon) {
      positionFloatingIcon(currentFocusedInput)
    }
  })
})()
