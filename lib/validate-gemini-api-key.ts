// Function to validate a Gemini API key with multiple fallback methods
export async function validateGeminiApiKey(apiKey: string): Promise<boolean> {
  // Basic format validation first
  if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
    console.error("API key validation failed: Empty or invalid API key format")
    return false
  }

  // Log a safe version of the key for debugging (first 4 chars + length)
  const keyPreview = apiKey.substring(0, 4) + "..." + `(length: ${apiKey.length})`
  console.log(`Attempting to validate API key: ${keyPreview}`)

  // Check for common issues with API keys
  if (apiKey.includes(" ") || apiKey.includes("\n") || apiKey.includes("\t")) {
    console.error("API key validation failed: Key contains whitespace characters")
    return false
  }

  // Most Google API keys are alphanumeric and typically 39 characters
  // This is a loose validation to catch obvious formatting issues
  const googleApiKeyPattern = /^[A-Za-z0-9_-]{20,40}$/
  if (!googleApiKeyPattern.test(apiKey)) {
    console.warn("API key format warning: Key doesn't match expected Google API key pattern")
    // Continue anyway as this is just a warning
  }

  try {
    // Try a simpler endpoint first - just checking if the key works with the API at all
    const testEndpoint = `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`

    console.log("Making test request to models endpoint")
    const testResponse = await fetch(testEndpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (testResponse.ok) {
      console.log("API key validation successful with models endpoint")
      return true
    }

    // If that fails, try the content generation endpoint with minimal payload
    console.log("Models endpoint failed, trying content generation endpoint")
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${encodeURIComponent(apiKey)}`

    const payload = {
      contents: [{ parts: [{ text: "Hello" }] }],
      generationConfig: { maxOutputTokens: 1 },
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Log detailed response information for debugging
    console.log("Status:", response.status, response.statusText)

    const responseData = await response.text()
    try {
      // Try to parse as JSON for structured logging
      const jsonData = JSON.parse(responseData)
      console.log("Response data:", JSON.stringify(jsonData, null, 2))
    } catch {
      // If not JSON, log as text
      console.log("Response text:", responseData)
    }

    // Return true only if we got a successful response
    return response.ok
  } catch (error) {
    console.error("Error during API key validation:", error)

    // Provide more specific error information
    if (error instanceof TypeError && error.message.includes("fetch")) {
      console.error("Network error during validation. Please check your internet connection.")
    }

    return false
  }
}
