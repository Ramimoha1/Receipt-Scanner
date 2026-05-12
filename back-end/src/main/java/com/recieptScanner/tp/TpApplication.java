package com.recieptScanner.tp;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import com.recieptScanner.tp.service.GeminiService;

@SpringBootApplication
public class TpApplication {

	public static void main(String[] args) {
		SpringApplication.run(TpApplication.class, args);
	}

	@Bean
	public CommandLineRunner geminiRunner(GeminiService geminiService) {
		return args -> System.out.println("GeminiService injected successfully.");
	}

}
