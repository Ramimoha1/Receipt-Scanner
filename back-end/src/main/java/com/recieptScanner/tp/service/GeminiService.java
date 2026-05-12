package com.recieptScanner.tp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Stream;

@Service
public class GeminiService {

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);
    private static final String MODEL = "gemini-2.5-flash";
    private static final int MAX_OUTPUT_TOKENS = 5000;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;

    public GeminiService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public Map<String, Object> prefillReceipt(String imageData, String mimeType) {
        String apiKey = getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new AiServiceException("ai failed");
        }

        HttpRequest request = HttpRequest.newBuilder()
            .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent?key=" + apiKey))
                .header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .timeout(Duration.ofSeconds(30))
                .POST(HttpRequest.BodyPublishers.ofString(writeJson(buildRequestPayload(stripDataUrlPrefix(imageData), normalizeMimeType(mimeType)))))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == HttpStatus.TOO_MANY_REQUESTS.value()) {
                log.warn("Gemini AI rate limit reached: status={}, body={}", response.statusCode(), abbreviate(response.body()));
                throw new AiRateLimitException("max rate reached for ai api");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.error("Gemini AI request failed: status={}, body={}", response.statusCode(), abbreviate(response.body()));
                throw new AiServiceException("ai failed");
            }

            return parseReceiptJson(response.body());
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            log.error("Gemini AI request interrupted", ex);
            throw new AiServiceException("ai failed", ex);
        } catch (IOException ex) {
            log.error("Gemini AI request could not be sent or read", ex);
            throw new AiServiceException("ai failed", ex);
        }
    }

    public String generateText(String prompt) {
        return generatePlaceholder(prompt);
    }

    public String generatePlaceholder(String prompt) {
        return "Gemini service ready; implement generation logic for: " + prompt;
    }

    public String getApiKey() {
        String apiKey = System.getenv("GEMINI_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            apiKey = loadApiKeyFromDotEnv();
        }
        return apiKey;
    }

    private String loadApiKeyFromDotEnv() {
        for (Path candidate : List.of(Path.of(".env"), Path.of("..", ".env"), Path.of("..", "..", ".env"))) {
            if (!Files.isRegularFile(candidate)) {
                continue;
            }

            try (Stream<String> lines = Files.lines(candidate)) {
                return lines
                        .map(String::trim)
                        .filter(line -> !line.isBlank() && !line.startsWith("#"))
                        .filter(line -> line.startsWith("GEMINI_API_KEY="))
                        .map(line -> line.substring("GEMINI_API_KEY=".length()).trim())
                        .filter(value -> !value.isBlank())
                        .findFirst()
                        .orElse("");
            } catch (IOException ignored) {
                // Fall through to the next candidate.
            }
        }

        return "";
    }

    private Map<String, Object> buildRequestPayload(String base64Image, String mimeType) {
        Map<String, Object> schema = new LinkedHashMap<>();
        schema.put("type", "OBJECT");
        schema.put("properties", Map.of(
            "merchantName", Map.of("type", "STRING"),
            "date", Map.of("type", "STRING"),
            "totalAmount", Map.of("type", "NUMBER"),
            "currency", Map.of("type", "STRING")
            
        ));
        schema.put("required", List.of("merchantName", "date", "totalAmount", "currency"));

        Map<String, Object> generationConfig = new LinkedHashMap<>();
        generationConfig.put("temperature", 0.1);
        generationConfig.put("topP", 0.8);
        generationConfig.put("maxOutputTokens", MAX_OUTPUT_TOKENS);
        generationConfig.put("responseMimeType", "application/json");
        generationConfig.put("responseSchema", schema);

        Map<String, Object> imagePart = Map.of("inlineData", Map.of(
            "mimeType", mimeType,
            "data", base64Image
        ));
        Map<String, Object> textPart = Map.of("text", "Extract receipt fields and return JSON only.");

        Map<String, Object> content = Map.of(
            "role", "user",
            "parts", List.of(imagePart, textPart)
        );

        return Map.of(
            "contents", List.of(content),
            "generationConfig", generationConfig
        );
    }

        private Map<String, Object> parseReceiptJson(String responseBody) throws IOException {
        // 1. TEMPORARY DEBUG: Print the exact raw response from Google
        log.info("RAW API RESPONSE: {}", responseBody);

        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidate = root.path("candidates").path(0);
        
        // 2. CHECK FINISH REASON: This is the golden rule of debugging Gemini
        String finishReason = candidate.path("finishReason").asText("UNKNOWN");
        if (!"STOP".equals(finishReason)) {
            log.warn("Gemini aborted generation! Finish Reason: {}", finishReason);
            // If it says "SAFETY", your receipt image has sensitive data.
            // If it says "MAX_TOKENS", increase your MAX_OUTPUT_TOKENS variable.
        }

        JsonNode textNode = candidate.path("content")
                .path("parts")
                .path(0)
                .path("text");

        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            log.error("Gemini AI response missing expected text content. Finish reason was: {}", finishReason);
            throw new AiServiceException("ai failed due to missing text");
        }

        String rawContent = stripCodeFences(textNode.asText());
        try {
            JsonNode receiptNode = objectMapper.readTree(rawContent);
            Map<String, Object> receipt = new LinkedHashMap<>();
            receipt.put("merchantName", textNode(receiptNode, "merchantName"));
            receipt.put("date", textNode(receiptNode, "date"));
            receipt.put("totalAmount", numberNode(receiptNode, "totalAmount"));
            receipt.put("currency", textNode(receiptNode, "currency"));
            receipt.put("taxAmount", optionalNumberNode(receiptNode, "taxAmount"));
            return receipt;
        } catch (IOException ex) {
            log.error("Gemini AI returned invalid JSON: {}", rawContent, ex);
            throw new AiServiceException("ai failed to parse JSON", ex);
        }
    }

    private List<Map<String, Object>> parseItems(JsonNode itemsNode) {
        if (!itemsNode.isArray()) {
            return List.of();
        }

        return java.util.stream.StreamSupport.stream(itemsNode.spliterator(), false)
                .map(itemNode -> {
                    Map<String, Object> item = new LinkedHashMap<>();
                    item.put("description", textNode(itemNode, "description"));
                    item.put("quantity", numberNode(itemNode, "quantity"));
                    item.put("price", numberNode(itemNode, "price"));
                    return item;
                })
                .toList();
    }

    private String textNode(JsonNode node, String fieldName) {
        return Objects.toString(node.path(fieldName).asText(""), "");
    }

    private Double numberNode(JsonNode node, String fieldName) {
        JsonNode valueNode = node.path(fieldName);
        if (valueNode.isNumber()) {
            return valueNode.asDouble();
        }
        if (valueNode.isTextual()) {
            try {
                return Double.parseDouble(valueNode.asText().replaceAll("[^0-9.\\-]", ""));
            } catch (NumberFormatException ignored) {
                return 0d;
            }
        }
        return 0d;
    }

    private Double optionalNumberNode(JsonNode node, String fieldName) {
        JsonNode valueNode = node.path(fieldName);
        if (valueNode.isMissingNode() || valueNode.isNull() || valueNode.asText().isBlank()) {
            return null;
        }
        return numberNode(node, fieldName);
    }

    private String writeJson(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (IOException ex) {
            throw new AiServiceException("ai failed", ex);
        }
    }

    private String buildPrompt() {
    return "You are an expert receipt data extractor. Carefully scan the entire image and extract the receipt fields. " +
           "Return JSON only with merchantName, date, totalAmount, currency, taxAmount, items. " +
           "CRITICAL: The 'date' field MUST be formatted exactly as YYYY-MM-DD (e.g., 2026-05-12). " +
           "Look at the top, bottom, and near the transaction ID for the date. Convert any format you find into YYYY-MM-DD. " +
           "Use short strings, numbers for amounts, and an items array with description, quantity, and price. " +
           "If a field is truly missing after a thorough search, use an empty string, 0, or null for taxAmount.";
        }

    private String stripCodeFences(String value) {
        String trimmed = value.trim();
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewline >= 0 && lastFence > firstNewline) {
                return trimmed.substring(firstNewline + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private String abbreviate(String value) {
        if (value == null) {
            return "";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        if (compact.length() <= 1200) {
            return compact;
        }
        return compact.substring(0, 1200) + "...";
    }

    private String stripDataUrlPrefix(String imageData) {
        if (imageData == null) {
            return "";
        }
        int commaIndex = imageData.indexOf(',');
        return commaIndex >= 0 ? imageData.substring(commaIndex + 1) : imageData;
    }

    private String normalizeMimeType(String mimeType) {
        if (mimeType == null || mimeType.isBlank()) {
            return "image/jpeg";
        }
        return mimeType;
    }

    public static class AiServiceException extends RuntimeException {
        public AiServiceException(String message) {
            super(message);
        }

        public AiServiceException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public static class AiRateLimitException extends AiServiceException {
        public AiRateLimitException(String message) {
            super(message);
        }
    }

}
