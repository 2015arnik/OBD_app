package com.obd.dto;

public class ChargeResult {
    public String txnId;
    public String status;
    public Integer amount;

    public ChargeResult(String txnId, String status, Integer amount) {
        this.txnId = txnId;
        this.status = status;
        this.amount = amount;
    }
}
