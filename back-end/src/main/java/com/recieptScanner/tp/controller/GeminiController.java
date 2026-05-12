package com.recieptScanner.tp.controller;

import com.recieptScanner.tp.service.GeminiService;
import com.recieptScanner.tp.service.GeminiService.AiRateLimitException;
import com.recieptScanner.tp.service.GeminiService.AiServiceException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
<<<<<<< Updated upstream
@CrossOrigin(origins = "http://localhost:5173")
=======
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
>>>>>>> Stashed changes
public class GeminiController {

    private static final Logger log = LoggerFactory.getLogger(GeminiController.class);

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/prefill")
    public ResponseEntity<Map<String, Object>> prefill(@RequestBody Map<String, String> request) {
        String imageData = request.getOrDefault("imageData", "");
        String mimeType = request.getOrDefault("mimeType", "image/jpeg");

        try {
            Map<String, Object> response = geminiService.prefillReceipt(imageData, mimeType);
            return ResponseEntity.ok(response);
        } catch (AiRateLimitException ex) {
            log.warn("AI prefill rate limited: {}", ex.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", ex.getMessage()));
        } catch (AiServiceException ex) {
            log.error("AI prefill failed: {}", ex.getMessage(), ex);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("message", ex.getMessage()));
        }
    }

}
