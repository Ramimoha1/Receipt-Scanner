package com.recieptScanner.tp.service;

import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;

@Service
public class GeminiService {

    private final Environment env;

    public GeminiService(Environment env) {
        this.env = env;
    }

    public String generateText(String prompt) {
        return generatePlaceholder(prompt);
    }

    public String generatePlaceholder(String prompt) {
        return "Gemini service ready; implement generation logic for: " + prompt;
    }

    public String getApiKey() {
        return env.getProperty("spring.ai.vertex.ai.gemini.api-key");
    }

}
