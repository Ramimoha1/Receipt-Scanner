package com.recieptScanner.tp.service;

import com.recieptScanner.tp.model.Receipt;
import com.recieptScanner.tp.repository.ReceiptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ReceiptService {

    private final ReceiptRepository receiptRepository;

    public ReceiptService(ReceiptRepository receiptRepository) {
        this.receiptRepository = receiptRepository;
    }

    public Receipt createReceipt(Receipt receipt) {
        if (receipt.getStatus() == null) {
            receipt.setStatus("PENDING");
        }
        if (receipt.getCurrency() == null) {
            receipt.setCurrency("MYR");
        }
        return receiptRepository.save(receipt);
    }

    public Receipt updateReceipt(UUID id, Receipt receiptDetails) {
        Receipt receipt = receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found with id: " + id));

        if (receiptDetails.getMerchantName() != null) {
            receipt.setMerchantName(receiptDetails.getMerchantName());
        }
        if (receiptDetails.getTransactionDate() != null) {
            receipt.setTransactionDate(receiptDetails.getTransactionDate());
        }
        if (receiptDetails.getTotalAmount() != null) {
            receipt.setTotalAmount(receiptDetails.getTotalAmount());
        }
        if (receiptDetails.getCurrency() != null) {
            receipt.setCurrency(receiptDetails.getCurrency());
        }
        if (receiptDetails.getStatus() != null) {
            receipt.setStatus(receiptDetails.getStatus());
        }

        return receiptRepository.save(receipt);
    }

    public Receipt getReceiptById(UUID id) {
        return receiptRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Receipt not found with id: " + id));
    }

    public List<Receipt> getAllReceipts() {
        return receiptRepository.findAll();
    }

    public List<Receipt> getReceiptsByStatus(String status) {
        return receiptRepository.findByStatus(status);
    }

    public void deleteReceipt(UUID id) {
        if (!receiptRepository.existsById(id)) {
            throw new RuntimeException("Receipt not found with id: " + id);
        }
        receiptRepository.deleteById(id);
    }

}
