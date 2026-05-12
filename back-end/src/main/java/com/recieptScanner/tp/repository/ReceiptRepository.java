package com.recieptScanner.tp.repository;

import com.recieptScanner.tp.model.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, UUID> {

    List<Receipt> findByStatus(String status);

    List<Receipt> findByMerchantName(String merchantName);

}
