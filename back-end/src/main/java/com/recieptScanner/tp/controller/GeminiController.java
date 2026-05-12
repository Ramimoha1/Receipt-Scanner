package com.recieptScanner.tp.controller;

import com.recieptScanner.tp.service.GeminiService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/gemini")
@CrossOrigin(origins = "http://localhost:3000")
public class GeminiController {

    private final GeminiService geminiService;

    public GeminiController(GeminiService geminiService) {
        this.geminiService = geminiService;
    }

    @PostMapping("/generate")
    public ResponseEntity<Map<String, String>> generate(@RequestBody Map<String, String> request) {
        String prompt = request.getOrDefault("prompt", "Explain how AI works in a few words");
        String response = geminiService.generateText(prompt);
        return ResponseEntity.ok(Map.of("response", response));
    }

}
