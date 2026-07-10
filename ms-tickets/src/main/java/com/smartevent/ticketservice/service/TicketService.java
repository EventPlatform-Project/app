package com.smartevent.ticketservice.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.qrcode.decoder.ErrorCorrectionLevel;
import com.smartevent.ticketservice.dto.ReservationConfirmedEvent;
import com.smartevent.ticketservice.entity.Ticket;
import com.smartevent.ticketservice.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class TicketService {

    private final TicketRepository ticketRepository;

    @Transactional
    public Ticket generateTicket(ReservationConfirmedEvent event) {
        if (ticketRepository.existsByReservationId(event.getReservationId())) {
            log.warn("Ticket déjà existant pour reservationId={}", event.getReservationId());
            return ticketRepository.findByReservationId(event.getReservationId()).orElseThrow();
        }

        String ticketNumber = generateTicketNumber();
        log.info("Génération ticket {} pour reservationId={}", ticketNumber, event.getReservationId());

        String qrContent = buildQrContent(ticketNumber, event);
        String qrCodeBase64 = generateQrCodeBase64(qrContent);

        Ticket ticket = Ticket.builder()
                .reservationId(event.getReservationId())
                .userId(event.getUserId()) // String (Keycloak UUID)
                .eventId(event.getEventId())
                .ticketNumber(ticketNumber)
                .qrCode(qrCodeBase64)
                .status(Ticket.TicketStatus.VALID)
                .build();

        ticket = ticketRepository.save(ticket);
        log.info("Ticket {} persisté avec id={}", ticketNumber, ticket.getId());
        return ticket;
    }

    @Transactional
    public Ticket useTicket(Long ticketId) {
        Ticket ticket = getTicketById(ticketId);
        if (ticket.getStatus() == Ticket.TicketStatus.USED) {
            throw new IllegalStateException("Ticket " + ticket.getTicketNumber() + " déjà utilisé.");
        }
        ticket.setStatus(Ticket.TicketStatus.USED);
        ticket.setUsedAt(LocalDateTime.now());
        return ticketRepository.save(ticket);
    }

    public Ticket getTicketById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable : id=" + id));
    }

    public Ticket getTicketByReservation(Long reservationId) {
        return ticketRepository.findByReservationId(reservationId)
                .orElseThrow(() -> new RuntimeException("Ticket introuvable pour reservationId=" + reservationId));
    }

    public List<Ticket> getTicketsByUser(String userId) {
        return ticketRepository.findByUserId(userId);
    }

    private String generateTicketNumber() {
        int year = Year.now().getValue();
        long count = ticketRepository.count() + 1;
        return "TKT-" + year + "-" + String.format("%05d", count);
    }

    private String buildQrContent(String ticketNumber, ReservationConfirmedEvent event) {
        // %s pour userId (String), %d pour les IDs numériques (Long)
        return String.format(
                "TICKET:%s|RESERVATION:%d|USER:%s|EVENT:%d|SEAT:%s",
                ticketNumber,
                event.getReservationId(),
                event.getUserId(),
                event.getEventId(),
                event.getSeatNumber() != null ? event.getSeatNumber() : "N/A"
        );
    }

    private String generateQrCodeBase64(String content) {
        try {
            Map<EncodeHintType, Object> hints = new HashMap<>();
            hints.put(EncodeHintType.ERROR_CORRECTION, ErrorCorrectionLevel.H);
            hints.put(EncodeHintType.MARGIN, 2);
            hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");

            QRCodeWriter writer = new QRCodeWriter();
            BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, 300, 300, hints);
            BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (WriterException | IOException e) {
            throw new RuntimeException("Impossible de générer le QR Code", e);
        }
    }

    public byte[] getQrCodeBytes(Long ticketId) {
        String base64 = getTicketById(ticketId).getQrCode();
        return Base64.getDecoder().decode(base64);
    }
}