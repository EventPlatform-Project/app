package com.smartevent.ticketservice.controller;

import com.smartevent.ticketservice.dto.ReservationConfirmedEvent;
import com.smartevent.ticketservice.entity.Ticket;
import com.smartevent.ticketservice.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import java.util.List;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping("/create")
    public ResponseEntity<Ticket> createTicket(@RequestBody ReservationConfirmedEvent event) {
        return ResponseEntity.ok(ticketService.generateTicket(event));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getTicketById(id));
    }

    @GetMapping("/reservation/{resId}")
    public ResponseEntity<Ticket> getTicketByReservation(@PathVariable Long resId) {
        return ResponseEntity.ok(ticketService.getTicketByReservation(resId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Ticket>> getTicketsByUser(@PathVariable String userId) {
        return ResponseEntity.ok(ticketService.getTicketsByUser(userId));
    }

    @PutMapping("/{id}/use")
    public ResponseEntity<Ticket> useTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.useTicket(id));
    }
    @GetMapping(value = "/{id}/view", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> viewTicket(@PathVariable Long id) {
        Ticket ticket = ticketService.getTicketById(id);
        String html = buildTicketHtml(ticket);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(html);
    }

    private String buildTicketHtml(Ticket ticket) {
        String statusColor = ticket.getStatus() == Ticket.TicketStatus.VALID ? "#2e7d32" :
                ticket.getStatus() == Ticket.TicketStatus.USED ? "#e65100" : "#c62828";
        String statusBg    = ticket.getStatus() == Ticket.TicketStatus.VALID ? "#e8f5e9" :
                ticket.getStatus() == Ticket.TicketStatus.USED ? "#fff3e0" : "#ffebee";
        String statusIcon  = ticket.getStatus() == Ticket.TicketStatus.VALID ? "✓" : "✗";
        String animClass   = ticket.getStatus() == Ticket.TicketStatus.VALID ? "anim-valid" :
                ticket.getStatus() == Ticket.TicketStatus.USED ? "anim-used" : "anim-cancelled";
        String generatedAt = ticket.getGeneratedAt() != null ?
                ticket.getGeneratedAt().toString().substring(0,16).replace("T"," ") : "—";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html lang='fr'><head>")
                .append("<meta charset='UTF-8'>")
                .append("<meta name='viewport' content='width=device-width, initial-scale=1.0'>")
                .append("<title>Ticket #").append(ticket.getTicketNumber()).append("</title>")
                .append("<style>")
                .append("* { margin:0; padding:0; box-sizing:border-box; }")
                .append("body { font-family:'Segoe UI',Arial,sans-serif; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }")
                .append(".ticket { background:white; border-radius:20px; width:420px; overflow:hidden; box-shadow:0 25px 50px rgba(0,0,0,0.3); animation:slideIn 0.6s cubic-bezier(0.175,0.885,0.32,1.275); }")
                .append("@keyframes slideIn { from{opacity:0;transform:translateY(60px) scale(0.9)} to{opacity:1;transform:translateY(0) scale(1)} }")
                .append(".ticket-header { background:linear-gradient(135deg,#667eea,#764ba2); color:white; padding:30px; text-align:center; }")
                .append(".logo { font-size:32px; margin-bottom:8px; animation:bounce 1s ease 0.6s both; }")
                .append("@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }")
                .append(".ticket-header h1 { font-size:22px; font-weight:700; letter-spacing:1px; }")
                .append(".ticket-header p { font-size:13px; opacity:0.85; margin-top:5px; }")
                .append(".ticket-body { padding:25px 30px; }")
                .append(".ticket-number { text-align:center; margin:15px 0 5px; font-size:26px; font-weight:800; color:#667eea; letter-spacing:2px; animation:fadeIn 0.5s ease 0.4s both; }")
                .append("@keyframes fadeIn { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }")
                .append(".status-wrap { text-align:center; margin-bottom:18px; }")
                .append(".status-badge { display:inline-flex; align-items:center; gap:8px; padding:8px 20px; border-radius:30px; font-size:13px; font-weight:700; letter-spacing:1px; background:").append(statusBg).append("; color:").append(statusColor).append("; }")
                .append(".status-icon { width:24px; height:24px; border-radius:50%; background:").append(statusColor).append("; color:white; display:flex; align-items:center; justify-content:center; font-size:14px; font-weight:900; }")
                .append(".anim-valid .status-icon { animation:pulse-green 1.5s ease-in-out infinite; }")
                .append("@keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(46,125,50,0.5)} 50%{box-shadow:0 0 0 10px rgba(46,125,50,0)} }")
                .append(".anim-used .status-badge { animation:shake 0.6s ease 0.5s both; }")
                .append("@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }")
                .append(".anim-cancelled .status-icon { animation:spin-in 0.5s ease 0.4s both; }")
                .append("@keyframes spin-in { from{transform:rotate(-180deg) scale(0);opacity:0} to{transform:rotate(0) scale(1);opacity:1} }")
                .append(".info-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f5f5f5; animation:fadeSlide 0.4s ease both; }")
                .append(".info-row:nth-child(1){animation-delay:0.5s} .info-row:nth-child(2){animation-delay:0.6s} .info-row:nth-child(3){animation-delay:0.7s} .info-row:nth-child(4){animation-delay:0.8s}")
                .append("@keyframes fadeSlide { from{opacity:0;transform:translateX(-20px)} to{opacity:1;transform:translateX(0)} }")
                .append(".info-label { font-size:11px; color:#999; text-transform:uppercase; letter-spacing:1px; font-weight:600; }")
                .append(".info-value { font-size:14px; color:#333; font-weight:600; }")
                .append(".dashed-line { border-top:2.5px dashed #e0e0e0; margin:0 30px; }")
                .append(".ticket-divider { position:relative; display:flex; align-items:center; }")
                .append(".ticket-divider::before { content:''; position:absolute; left:-20px; width:40px; height:40px; background:linear-gradient(135deg,#667eea,#764ba2); border-radius:50%; }")
                .append(".ticket-divider::after  { content:''; position:absolute; right:-20px; width:40px; height:40px; background:linear-gradient(135deg,#667eea,#764ba2); border-radius:50%; }")
                .append(".qr-section { background:#f9f9fc; padding:25px; text-align:center; border-top:2px dashed #e0e0e0; animation:fadeIn 0.6s ease 1s both; }")
                .append(".qr-section img { width:160px; height:160px; border:6px solid white; border-radius:12px; box-shadow:0 4px 15px rgba(102,126,234,0.25); transition:transform 0.3s ease; }")
                .append(".qr-section img:hover { transform:scale(1.08); }")
                .append(".qr-section p { margin-top:10px; font-size:11px; color:#aaa; letter-spacing:1px; }")
                .append(".ticket-footer { background:#667eea; color:white; text-align:center; padding:12px; font-size:11px; letter-spacing:1px; }")
                .append(".print-btn { display:block; margin:20px auto 0; padding:10px 30px; background:linear-gradient(135deg,#667eea,#764ba2); color:white; border:none; border-radius:25px; font-size:14px; font-weight:600; cursor:pointer; letter-spacing:1px; transition:transform 0.2s,box-shadow 0.2s; }")
                .append(".print-btn:hover { transform:translateY(-2px); box-shadow:0 8px 20px rgba(102,126,234,0.4); }")
                .append("@media print { body{background:white} .ticket{box-shadow:none} .print-btn{display:none} }")
                .append("</style></head><body>")
                .append("<div class='ticket ").append(animClass).append("'>")
                .append("<div class='ticket-header'>")
                .append("<div class='logo'></div>")
                .append("<h1>SMART EVENT PLATFORM</h1>")
                .append("<p>Votre billet d'entrée officiel</p>")
                .append("</div>")
                .append("<div class='ticket-body'>")
                .append("<div class='ticket-number'>").append(ticket.getTicketNumber()).append("</div>")
                .append("<div class='status-wrap'><div class='status-badge'>")
                .append("<div class='status-icon'>").append(statusIcon).append("</div>")
                .append(ticket.getStatus())
                .append("</div></div>")
                .append("<div class='info-row'><span class='info-label'>Réservation</span><span class='info-value'>#").append(ticket.getReservationId()).append("</span></div>")
                .append("<div class='info-row'><span class='info-label'>Événement</span><span class='info-value'>#").append(ticket.getEventId()).append("</span></div>")
                .append("<div class='info-row'><span class='info-label'>Participant</span><span class='info-value'>User #").append(ticket.getUserId()).append("</span></div>")
                .append("<div class='info-row'><span class='info-label'>Généré le</span><span class='info-value'>").append(generatedAt).append("</span></div>")
                .append("<button class='print-btn' onclick='window.print()'> Imprimer le ticket</button>")
                .append("</div>")
                .append("<div class='ticket-divider'><div class='dashed-line'></div></div>")
                .append("<div class='qr-section'>")
                .append("<img src='data:image/png;base64,").append(ticket.getQrCode()).append("' alt='QR Code'/>")
                .append("<p>SCANNEZ À L'ENTRÉE</p>")
                .append("</div>")
                .append("<div class='ticket-footer'>© 2026 Smart Event Platform — Ticket valide une seule fois</div>")
                .append("</div>")
                .append("</body></html>");

        return html.toString();
    }
    @GetMapping(value = "/{id}/qrcode", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getQrCode(@PathVariable Long id) {
        byte[] imageBytes = ticketService.getQrCodeBytes(id);
        return ResponseEntity.ok()
                .contentType(MediaType.IMAGE_PNG)
                .body(imageBytes);
    }

}