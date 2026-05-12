package com.recieptScanner.tp.controller;

import com.recieptScanner.tp.model.Receipt;
import com.recieptScanner.tp.service.ReceiptService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/receipts")
@CrossOrigin(origins = "http://localhost:3000")
public class ReceiptController {

    private final ReceiptService receiptService;

    public ReceiptController(ReceiptService receiptService) {
        this.receiptService = receiptService;
    }

    /**
     * Create a new receipt
     */
    @PostMapping
    public ResponseEntity<Receipt> createReceipt(@RequestBody Receipt receipt) {
        Receipt created = receiptService.createReceipt(receipt);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /**
     * Get all receipts
     */
    @GetMapping
    public ResponseEntity<List<Receipt>> getAllReceipts() {
        List<Receipt> receipts = receiptService.getAllReceipts();
        return ResponseEntity.ok(receipts);
    }

    /**
     * Get a receipt by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Receipt> getReceiptById(@PathVariable UUID id) {
        Receipt receipt = receiptService.getReceiptById(id);
        return ResponseEntity.ok(receipt);
    }

    /**
     * Update a receipt
     */
    @PutMapping("/{id}")
    public ResponseEntity<Receipt> updateReceipt(@PathVariable UUID id, @RequestBody Receipt receiptDetails) {
        Receipt updated = receiptService.updateReceipt(id, receiptDetails);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a receipt
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReceipt(@PathVariable UUID id) {
        receiptService.deleteReceipt(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get receipts by status (PENDING, REVIEWED, SAVED)
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<List<Receipt>> getReceiptsByStatus(@PathVariable String status) {
        List<Receipt> receipts = receiptService.getReceiptsByStatus(status);
        return ResponseEntity.ok(receipts);
    }

}
