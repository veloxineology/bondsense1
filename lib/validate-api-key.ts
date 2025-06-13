// Function to validate an API key by making a simple test request
export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    // Endpoint for Gemini API - updated to v1 from v1beta
    const endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${encodeURIComponent(apiKey)}`

    // Simple test prompt
    const payload = {
      contents: [
        {
          parts: [
            {
              text: "Hello, this is a test request to validate the API key.",
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: 5,
      },
    }

    // Make the request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    // Check if the response is successful
    if (!response.ok) {
      const errorData = await response.json()
      console.error("API key validation failed:", errorData)
      return false
    }

    // If we get here, the key is valid
    const data = await response.json()
    return !!data.candidates
  } catch (error) {
    console.error("Error validating API key:", error)
    return false
  }
}
