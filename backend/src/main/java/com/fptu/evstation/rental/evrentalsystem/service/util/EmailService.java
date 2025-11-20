package com.fptu.evstation.rental.evrentalsystem.service.util;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {
    private final JavaMailSender mailSender;

    public void sendInvoiceWithAttachment(String toEmail, String customerName, String invoiceCode, File pdfFile) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Thông báo phát hành Hóa đơn điện tử của EVolve");

            String htmlContent =
                    "<p>Kính gửi Quý khách <strong>" + customerName + "</strong>,</p>" +
                            "<p>Hệ thống cho thuê xe điện <strong>EVolve</strong> chân thành cảm ơn Quý khách đã tin tưởng sử dụng dịch vụ của chúng tôi.</p>" +
                            "<p>EVolve trân trọng thông báo: Chúng tôi đã phát hành <strong>Hóa đơn điện tử</strong> mang mã số: <strong>" + invoiceCode + "</strong>.</p>" +
                            "<p>(Chi tiết hóa đơn và tệp PDF được đính kèm trong email này).</p>" +
                            "<p>Trân trọng,<br>Đội ngũ EVolve.</p>";

            helper.setText(htmlContent, true);
            helper.addAttachment(pdfFile.getName(), pdfFile);

            mailSender.send(message);
            log.info("Đã gửi hóa đơn cho khách hàng {}", customerName);

        } catch (MessagingException e) {
            log.error("Lỗi khi gửi email hóa đơn: {}", e.getMessage(), e);
            throw new RuntimeException("Lỗi khi gửi email hóa đơn: " + e.getMessage(), e);
        }
    }
}

