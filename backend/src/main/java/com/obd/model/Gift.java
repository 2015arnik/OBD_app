package com.obd.model;

import jakarta.persistence.*;

@Entity
@Table(name = "gifts")
public class Gift {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long ownerId;

    private String title;

    @Column(length = 1000)
    private String description;

    private String url;

    private Integer price;

    @Enumerated(EnumType.STRING)
    private GiftStatus status = GiftStatus.WANTED;

    public Gift() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long ownerId) { this.ownerId = ownerId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }

    public GiftStatus getStatus() { return status; }
    public void setStatus(GiftStatus status) { this.status = status; }
}
