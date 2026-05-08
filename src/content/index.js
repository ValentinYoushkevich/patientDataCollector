import { parsePatient } from '../parsers/index.js'

let pickerActive = false
let pickerFieldKey = ''
let pickerCleanup = null
let lastHoverElement = null

function getNodeText(node) {
  if (!node) return ''
  if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
    return String(node.value || '').trim()
  }
  if (node instanceof HTMLSelectElement) {
    return String(node.value || node.selectedOptions?.[0]?.textContent || '').trim()
  }
  return String(node.textContent || '').trim()
}

function teardownPicker() {
  if (pickerCleanup) {
    pickerCleanup()
  }
  pickerCleanup = null
  pickerActive = false
  pickerFieldKey = ''
  if (lastHoverElement) {
    lastHoverElement.style.outline = ''
    lastHoverElement = null
  }
  document.body.style.cursor = ''
}

function setupPicker(fieldKey, sendResponse) {
  if (pickerActive) {
    teardownPicker()
  }
  pickerActive = true
  pickerFieldKey = fieldKey
  document.body.style.cursor = 'crosshair'

  const onMouseMove = (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (lastHoverElement && lastHoverElement !== target) {
      lastHoverElement.style.outline = ''
    }
    lastHoverElement = target
    target.style.outline = '2px solid #0ea5e9'
  }

  const onClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const target = event.target
    const value = getNodeText(target)
    const selectedFieldKey = pickerFieldKey
    teardownPicker()
    sendResponse({
      ok: true,
      fieldKey: selectedFieldKey,
      value
    })
  }

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      teardownPicker()
      sendResponse({ ok: false, error: 'Picker cancelled' })
    }
  }

  document.addEventListener('mousemove', onMouseMove, true)
  document.addEventListener('click', onClick, true)
  document.addEventListener('keydown', onKeyDown, true)

  pickerCleanup = () => {
    document.removeEventListener('mousemove', onMouseMove, true)
    document.removeEventListener('click', onClick, true)
    document.removeEventListener('keydown', onKeyDown, true)
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  try {
    if (message?.type === 'COLLECT_DATA') {
      const { systemId } = message.payload ?? {}
      const rawData = parsePatient(systemId, document)
      sendResponse({ ok: true, data: rawData })
      return true
    }

    if (message?.type === 'PICK_FIELD_START') {
      const fieldKey = String(message?.payload?.fieldKey || '')
      if (!fieldKey) {
        sendResponse({ ok: false, error: 'Field key is required' })
        return true
      }
      setupPicker(fieldKey, sendResponse)
      return true
    }

    if (message?.type === 'PICK_FIELD_CANCEL') {
      teardownPicker()
      sendResponse({ ok: true })
      return true
    }
  } catch (err) {
    sendResponse({ ok: false, error: err?.message ?? 'Content script operation failed' })
  }

  return false
})
